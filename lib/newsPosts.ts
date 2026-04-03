import { promises as fs } from 'node:fs'
import path from 'node:path'

type FrontmatterMap = Record<string, string>

export type NewsPost = {
  slug: string
  title: string
  description: string
  date: string
  updatedAt: string
  author: string
  tags: string[]
  heroImage: string
  ctaText: string
  ctaUrl: string
  relatedSkills: string[]
  relatedCredentials: string[]
  relatedPosts: string[]
  content: string
}

const NEWS_SOURCE_DIRECTORY = path.join(process.cwd(), 'content', 'news')

const LIST_FIELDS = new Set([
  'tags',
  'relatedskills',
  'relatedcredentials',
  'relatedposts',
])

const normalize = (value: unknown): string => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

const normalizeSlug = (value: string, fallback: string) => {
  const base = normalize(value).toLowerCase() || normalize(fallback).toLowerCase()

  return base
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    || normalize(fallback).toLowerCase().replace(/\s+/g, '-')
}

const parseFrontmatterValue = (key: string, rawValue: string): string | string[] => {
  const keyLower = key.toLowerCase()
  const value = rawValue.trim().replace(/\uFEFF/g, '')

  if (!LIST_FIELDS.has(keyLower) || !value) {
    return value
  }

  const normalized = value.trim()

  if (normalized.startsWith('[') && normalized.endsWith(']')) {
    return normalized
      .slice(1, -1)
      .split(',')
      .map((entry) => entry.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, ''))
      .map((entry) => normalize(entry))
      .filter(Boolean)
  }

  if (normalized.includes(',')) {
    return normalized
      .split(',')
      .map((entry) => normalize(entry))
      .filter(Boolean)
  }

  return normalized
    ? [normalized]
    : []
}

const parseFrontmatter = (raw: string): FrontmatterMap => {
  const output: FrontmatterMap = {}

  const lines = raw.replace(/\r/g, '').split('\n')

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const match = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(trimmed)
    if (!match) {
      continue
    }

    const key = match[1]
    const value = match[2].trim()

    // Support one-line list syntax in frontmatter only.
    output[key.toLowerCase()] = String(parseFrontmatterValue(key, value))
  }

  return output
}

const parseList = (value: string): string[] => {
  const normalized = normalize(value)
  if (!normalized) {
    return []
  }

  const parsed = parseFrontmatterValue('list', normalized)
  if (Array.isArray(parsed)) {
    return parsed
  }

  return normalized
    ? [normalized]
    : []
}

const formatExcerpt = (content: string, maxLength = 190): string => {
  const plain = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[[^\]]+\]\([^\)]+\)/g, (match) => match.replace(/\[[^\]]+\]\(([^\)]+)\)/, '$1'))
    .replace(/[#>*_`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!plain) {
    return 'Read about this post in the Skillcraft news.'
  }

  if (plain.length <= maxLength) {
    return plain
  }

  return `${plain.slice(0, maxLength).trimEnd()}…`
}

const toDateOnly = (value: string): string => {
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return ''
  }

  return new Date(parsed).toISOString().split('T')[0]
}

const buildPostFromMarkdown = async (
  markdown: string,
  fileName: string,
): Promise<NewsPost> => {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/m.exec(markdown.replace(/\r\n?/g, '\n'))
  const frontmatter = match ? parseFrontmatter(match[1] || '') : {}
  const content = (match ? match[2] : markdown).trim()

  const fallbackSlug = path.basename(fileName, path.extname(fileName))
  const date = normalize(frontmatter.date) || normalize(frontmatter.published) || normalize(frontmatter.publishedAt)
  const updatedAt = normalize(frontmatter.updated)
    || normalize(frontmatter.updatedAt)
    || normalize(frontmatter.modified)

  const title = normalize(frontmatter.title) || normalize(frontmatter.name) || path.basename(fileName, path.extname(fileName))
  const slug = normalizeSlug(frontmatter.slug || frontmatter.title || fallbackSlug, fallbackSlug)
  const rawDescription = normalize(frontmatter.description)

  return {
    slug,
    title: title || 'Untitled post',
    description: rawDescription || formatExcerpt(content),
    date: toDateOnly(date) || updatedAt || toDateOnly(new Date().toISOString()),
    updatedAt: toDateOnly(updatedAt) || toDateOnly(date) || toDateOnly(new Date().toISOString()),
    author: normalize(frontmatter.author) || 'Skillcraft',
    tags: parseList(frontmatter.tags || ''),
    heroImage: normalize(frontmatter.heroimage) || '/images/og-home.jpg',
    ctaText: normalize(frontmatter.ctatext) || 'Read whitepaper',
    ctaUrl: normalize(frontmatter.ctaurl) || '/whitepaper/skillcraft.pdf',
    relatedSkills: parseList(frontmatter.relatedskills || ''),
    relatedCredentials: parseList(frontmatter.relatedcredentials || ''),
    relatedPosts: parseList(frontmatter.relatedposts || ''),
    content,
  }
}

let cachedPosts: NewsPost[] | null = null
const shouldUseCache = process.env.NODE_ENV === 'production'

const isMarkdownFile = (name: string) => name.toLowerCase().endsWith('.md')

export const getAllNewsPosts = async (): Promise<NewsPost[]> => {
  if (shouldUseCache && cachedPosts) {
    return cachedPosts
  }

  try {
    const files = await fs.readdir(NEWS_SOURCE_DIRECTORY)
    const candidates = files.filter(isMarkdownFile)

    const posts = await Promise.all(
      candidates.map(async (fileName) => {
        const fullPath = path.join(NEWS_SOURCE_DIRECTORY, fileName)
        const raw = await fs.readFile(fullPath, 'utf8')
        return buildPostFromMarkdown(raw, fileName)
      }),
    )

    const sortedPosts = posts
      .sort((left, right) => {
        const leftDate = Date.parse(left.date) || 0
        const rightDate = Date.parse(right.date) || 0

        if (rightDate === leftDate) {
          return left.title.localeCompare(right.title)
        }

        return rightDate - leftDate
      })

    if (shouldUseCache) {
      cachedPosts = sortedPosts
    }
    return sortedPosts
  } catch {
    if (shouldUseCache) {
      cachedPosts = []
    }
    return []
  }
}

export const getNewsPostBySlug = async (slug: string): Promise<NewsPost | undefined> => {
  const normalizedSlug = normalize(slug).toLowerCase()
  const posts = await getAllNewsPosts()

  return posts.find((post) => post.slug === normalizedSlug)
}

export const formatNewsPostDate = (value: string): string => {
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(parsed))
}

export const normalizeResourceSlug = (value: string): string => normalize(value).toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-')
