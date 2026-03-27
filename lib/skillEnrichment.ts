import type { SkillRecord } from './skillIndex'

const MARKDOWN_SUMMARY_FILE_NAMES = ['SKILL.md', 'SKILL.MD', 'README.md', 'readme.md', 'skill.md', 'skill.MD', 'INDEX.md', 'index.md']
const SKILL_SUMMARY_MAX_CHARS = 240
const SKILL_DETAIL_SUMMARY_MAX_CHARS = Number.POSITIVE_INFINITY

type GitHubSource = {
  owner: string
  repo: string
  branch: string
  pathSegments: string[]
}

type SummaryCache = {
  [key: string]: string
}

const summaryCache: SummaryCache = Object.create(null)

const isMarkdownFile = (value: string): boolean =>
  /\.(md|mdx|markdown|mdown)$/i.test(value)

const dedupe = (values: string[]) => [...new Set(values.map((item) => item.trim()).filter(Boolean))]

const normalizePath = (value: string): string => value.replace(/^\/+|\/+$/g, '')

const splitPathSegments = (value: string): string[] =>
  normalizePath(value)
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)

const parseGitHubSource = (value: string): GitHubSource | null => {
  try {
    const url = new URL(value)

    if (url.hostname === 'raw.githubusercontent.com') {
      const parts = normalizePath(url.pathname).split('/').filter(Boolean)

      if (parts.length < 4) {
        return null
      }

      return {
        owner: parts[0].toLowerCase(),
        repo: parts[1],
        branch: parts[2],
        pathSegments: parts.slice(3),
      }
    }

    if (url.hostname !== 'github.com') {
      return null
    }

    const parts = normalizePath(url.pathname).split('/').filter(Boolean)
    if (parts.length < 2) {
      return null
    }

    const owner = parts[0].toLowerCase()
    const repo = parts[1]
    const mode = parts[2]

    if (mode === 'blob' || mode === 'raw' || mode === 'tree') {
      if (parts.length < 4) {
        return null
      }

      return {
        owner,
        repo,
        branch: parts[3] || 'main',
        pathSegments: parts.slice(4),
      }
    }

    if (parts.length >= 3) {
      return {
        owner,
        repo,
        branch: 'main',
        pathSegments: parts.slice(2),
      }
    }

    return null
  } catch {
    return null
  }
}

const buildUrlWithPath = (source: GitHubSource, pathSegments: string[]): string => {
  const cleanPath = normalizePath(pathSegments.join('/'))
  const base = `https://raw.githubusercontent.com/${source.owner}/${source.repo}/${source.branch}`

  if (!cleanPath) {
    return base
  }

  return `${base}/${cleanPath}`
}

const appendMarkdownCandidates = (target: string[], source: GitHubSource, pathSegments: string[]) => {
  const cleanSegments = pathSegments.map((item) => item.trim()).filter(Boolean)
  const baseUrl = buildUrlWithPath(source, cleanSegments)
  const finalSegments = normalizePath(cleanSegments.join('/'))

  if (finalSegments && isMarkdownFile(cleanSegments[cleanSegments.length - 1])) {
    target.push(baseUrl)
    return
  }

  for (const fileName of MARKDOWN_SUMMARY_FILE_NAMES) {
    target.push(cleanSegments.length > 0 ? `${baseUrl}/${fileName}` : `${baseUrl}/${fileName}`)
  }
}

const appendBranchFallbackCandidates = (target: string[], source: GitHubSource, pathSegments: string[]) => {
  const cleanPath = normalizePath(pathSegments.join('/'))
  if (!cleanPath) {
    return
  }

  const branches = ['main', 'master']
  for (const branch of branches) {
    const branchBase = `https://raw.githubusercontent.com/${source.owner}/${source.repo}/${branch}`
    if (isMarkdownFile(cleanPath)) {
      target.push(`${branchBase}/${cleanPath}`)
    }

    for (const fileName of MARKDOWN_SUMMARY_FILE_NAMES) {
      target.push(`${branchBase}/${cleanPath}/${fileName}`)
    }
  }
}

const buildReadmeCandidates = (skill: SkillRecord): string[] => {
  const source = parseGitHubSource(skill.url)
  if (!source) {
    return []
  }

  const rawFromSource: string[] = []
  const pathCandidates = dedupe([
    normalizePath(source.pathSegments.join('/')),
    normalizePath(skill.path),
  ]).map(splitPathSegments)

  for (const pathSegments of pathCandidates) {
    appendMarkdownCandidates(rawFromSource, source, pathSegments)
    appendBranchFallbackCandidates(rawFromSource, source, pathSegments)
  }

  const sourcePath = normalizePath(source.pathSegments.join('/'))
  if (sourcePath) {
    return dedupe(rawFromSource)
  }

  const inferredPath = normalizePath(skill.path)
  if (!inferredPath) {
    return dedupe(rawFromSource)
  }

  appendBranchFallbackCandidates(rawFromSource, source, inferredPath.split('/').filter(Boolean))

  return dedupe(rawFromSource)
}

const timeout = (ms: number) => {
  const controller = new AbortController()
  const id = setTimeout(() => {
    controller.abort()
  }, ms)

  return { controller, done: () => clearTimeout(id) }
}

export const fetchText = async (url: string): Promise<string | null> => {
  const timeoutContext = timeout(6000)
  try {
    const response = await fetch(url, {
      signal: timeoutContext.controller.signal,
      headers: {
        Accept: 'text/plain, text/markdown, */*',
      },
    })

    if (!response.ok) {
      return null
    }

    const text = await response.text()
    const trimmed = typeof text === 'string' ? text.trim() : ''

    return trimmed.length > 0 ? trimmed : null
  } catch {
    return null
  } finally {
    timeoutContext.done()
  }
}

const squashWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim()

const stripYamlFrontMatter = (value: string): string =>
  value.replace(/^\s*---\s*\n[\s\S]*?\n---\s*\n?/m, '').trim()

const cleanTextBlock = (value: string): string =>
  squashWhitespace(
    value
      .replace(/(^|\n)\s*#{1,6}\s+[^\n]*/g, ' ')
      .replace(/(^|\n)\s*>\s*/g, '$1')
      .replace(/(^|\n)\s*[-*+]\s+/g, '$1')
      .replace(/(^|\n)\s*\d+\.\s+/g, '$1')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
      .replace(/~~([^~]+)~~/g, '$1')
      .trim(),
  )

const extractReadableParagraphs = (value: string, maxCount = 2): string[] => {
  const blocks = value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\{:[^}]*\}/g, ' ')
    .split(/\n{2,}/g)
    .map(cleanTextBlock)
    .filter(Boolean)

  return blocks.slice(0, maxCount)
}

const extractReadableSummary = (value: string, maxChars = SKILL_SUMMARY_MAX_CHARS, paragraphLimit = 1): string => {
  if (!value || !value.trim()) {
    return ''
  }

  const withoutFrontMatter = stripYamlFrontMatter(value)

  const heading = buildHeadingFromSource(withoutFrontMatter)
  const paragraphs = extractReadableParagraphs(withoutFrontMatter, paragraphLimit)
    .filter((paragraph) => paragraph.length >= 1)

  const firstParagraph = paragraphLimit <= 1 ? paragraphs[0] : paragraphs.join(' ')
  const combined = heading ? `${heading}. ${firstParagraph || heading}` : firstParagraph
  const plain = squashWhitespace(combined || value)

  if (!plain) {
    return ''
  }

  if (plain.length <= maxChars) {
    return plain
  }

  const shortened = plain.slice(0, maxChars)
  const boundary = shortened.lastIndexOf(' ')
  const cut = boundary > Math.floor(maxChars * 0.55) ? boundary : maxChars

  return `${shortened.slice(0, cut).trim()}…`
}

const extractReadableDetailSummary = (value: string, maxChars = SKILL_DETAIL_SUMMARY_MAX_CHARS, paragraphLimit = Infinity): string => {
  if (!value || !value.trim()) {
    return ''
  }

  const withoutFrontMatter = stripYamlFrontMatter(value)
  const blocks = withoutFrontMatter
    .trim()
    .split(/\n{2,}/g)
    .map((block) => block.trim())
    .filter(Boolean)
  const selectedBlocks = Number.isFinite(paragraphLimit)
    ? blocks.slice(0, paragraphLimit)
    : blocks

  const plain = selectedBlocks.join('\n\n').trim()

  if (!plain) {
    return ''
  }

  if (plain.length <= maxChars) {
    return plain
  }

  const shortened = plain.slice(0, maxChars)
  const boundary = shortened.lastIndexOf(' ')
  const cut = boundary > Math.floor(maxChars * 0.55) ? boundary : maxChars

  return `${shortened.slice(0, cut).trim()}…`
}

const buildHeadingFromSource = (value: string): string => {
  const matches = value.match(/^\s*#{1,6}\s+(.+)$/m)
  return matches && matches[1] ? matches[1].trim() : ''
}

export const getSkillSeoSummary = async (skill: SkillRecord): Promise<string> => {
  if (summaryCache[skill.id]) {
    return summaryCache[skill.id]
  }

  const candidates = buildReadmeCandidates(skill)
  for (const candidate of candidates) {
    const readme = await fetchText(candidate)
    if (!readme) {
      continue
    }

    const summary = extractReadableSummary(readme)
    if (summary) {
      summaryCache[skill.id] = summary
      return summary
    }
  }

  const fallback = extractReadableSummary(skill.description || `${skill.owner} / ${skill.name}`)
  summaryCache[skill.id] = fallback
  return fallback
}

export const getSkillDetailSummary = async (skill: SkillRecord): Promise<string> => {
  const cacheKey = `${skill.id}:detail`
  if (summaryCache[cacheKey]) {
    return summaryCache[cacheKey]
  }

  const candidates = buildReadmeCandidates(skill)
  for (const candidate of candidates) {
    const readme = await fetchText(candidate)
    if (!readme) {
      continue
    }

      const summary = extractReadableDetailSummary(readme, SKILL_DETAIL_SUMMARY_MAX_CHARS, Infinity)
      if (summary) {
        summaryCache[cacheKey] = summary
        return summary
      }
    }

    const fallback = extractReadableDetailSummary(skill.description || `${skill.owner} / ${skill.name}`, SKILL_DETAIL_SUMMARY_MAX_CHARS, Infinity)
  summaryCache[cacheKey] = fallback
  return fallback
}

export const buildCanonicalSummary = (value: string): string =>
  extractReadableSummary(value || '', SKILL_SUMMARY_MAX_CHARS)
