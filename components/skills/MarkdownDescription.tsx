import React from 'react'
import type { ReactNode } from 'react'

type MarkdownDescriptionProps = {
  content: string
  className?: string
  id?: string
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const parseInline = (value: string): ReactNode[] => {
  const escaped = escapeHtml(value)
  const tokens = escaped.split(/(`[^`]+`|\[[^\]]+\]\([^\)]+\)|\*\*[^\*\n]+\*\*|\*[^\*\n]+\*|__[^_\n]+__|_[^_\n]+_)/g)

  return tokens
    .filter((token) => token !== '')
    .map((token, index) => {
      if (/^`[^`]+`$/.test(token)) {
        return <code key={index}>{token.slice(1, -1)}</code>
      }

      const link = /^\[([^\]]+)\]\(([^\s)]+)(?:\s+"[^"]+")?\)$/.exec(token)
      if (link) {
        return (
          <a key={index} href={link[2]} target="_blank" rel="noreferrer">
            {link[1]}
          </a>
        )
      }

      if (/^\*\*[^\*\n]+\*\*$/.test(token)) {
        return <strong key={index}>{token.slice(2, -2)}</strong>
      }

      if (/^__[^_\n]+__$/.test(token)) {
        return <strong key={index}>{token.slice(2, -2)}</strong>
      }

      if (/^\*[^\*\n]+\*$/.test(token)) {
        return <em key={index}>{token.slice(1, -1)}</em>
      }

      if (/^_[^_\n]+_$/.test(token)) {
        return <em key={index}>{token.slice(1, -1)}</em>
      }

      return token
    })
}

const buildMarkdownBlocks = (content: string): ReactNode[] => {
  const lines = content.replace(/\r\n?/g, '\n').split('\n')

  const blocks: ReactNode[] = []
  let paragraph: string[] = []
  let listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let quoteLines: string[] = []
  let inCodeBlock = false
  let codeLines: string[] = []
  let keySeed = 0

  const flushParagraph = () => {
    if (!paragraph.length) {
      return
    }

    const text = paragraph.join(' ').trim()
    paragraph = []

    if (text) {
      blocks.push(<p key={`paragraph-${keySeed++}`}>{parseInline(text)}</p>)
    }
  }

  const flushList = () => {
    if (!listItems.length || !listType) {
      listItems = []
      listType = null
      return
    }

    const items = listItems
      .map((item) => parseInline(item))
      .map((item, index) => <li key={`item-${keySeed}-${index}`}>{item}</li>)

    if (listType === 'ul') {
      blocks.push(<ul key={`ul-${keySeed++}`}>{items}</ul>)
    } else {
      blocks.push(<ol key={`ol-${keySeed++}`}>{items}</ol>)
    }

    listItems = []
    listType = null
  }

  const flushQuote = () => {
    if (!quoteLines.length) {
      return
    }

    blocks.push(
      <blockquote key={`quote-${keySeed++}`}>
        {parseInline(quoteLines.join(' ').trim())}
      </blockquote>,
    )

    quoteLines = []
  }

  const flushCode = () => {
    if (!inCodeBlock) {
      return
    }

    blocks.push(<pre key={`code-${keySeed++}`}><code>{codeLines.join('\n')}</code></pre>)
    codeLines = []
    inCodeBlock = false
  }

  const flushAll = () => {
    flushParagraph()
    flushList()
    flushQuote()
    flushCode()
  }

  for (const line of lines) {
    if (/^```/.test(line)) {
      if (inCodeBlock) {
        flushCode()
      } else {
        flushParagraph()
        flushList()
        flushQuote()
        inCodeBlock = true
      }

      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line)
    if (headingMatch) {
      flushAll()
      const level = headingMatch[1].length
      const text = parseInline(headingMatch[2].trim())
      const HeadingTag = `h${Math.min(level, 6)}` as `h${1 | 2 | 3 | 4 | 5 | 6}`
      blocks.push(React.createElement(HeadingTag, { key: `heading-${keySeed++}` }, text))
      continue
    }

    const hrMatch = /^\s*([*\-_])(?:\s*\1){2,}\s*$/.exec(line)
    if (hrMatch) {
      flushAll()
      blocks.push(<hr key={`hr-${keySeed++}`} />)
      continue
    }

    const bulletMatch = /^\s*[-*+]\s+(.*)$/.exec(line)
    const orderedMatch = /^\s*\d+\.\s+(.*)$/.exec(line)

    if (bulletMatch) {
      flushParagraph()
      flushQuote()

      if (listType && listType !== 'ul') {
        flushList()
      }

      listType = 'ul'
      listItems.push(bulletMatch[1].trim())
      continue
    }

    if (orderedMatch) {
      flushParagraph()
      flushQuote()

      if (listType && listType !== 'ol') {
        flushList()
      }

      listType = 'ol'
      listItems.push(orderedMatch[1].trim())
      continue
    }

    const quoteMatch = /^\s*>\s?(.*)$/.exec(line)
    if (quoteMatch) {
      flushParagraph()
      flushList()
      quoteLines.push(quoteMatch[1].trim())
      continue
    }

    if (!line.trim()) {
      flushParagraph()
      flushList()
      flushQuote()
      continue
    }

    flushList()
    flushQuote()
    paragraph.push(line.trim())
  }

  flushAll()

  return blocks
}

export const MarkdownDescription = ({ content, className, id }: MarkdownDescriptionProps) => {
  const blocks = buildMarkdownBlocks(content)

  return <div id={id} className={className || 'detail-markdown'}>{blocks}</div>
}
