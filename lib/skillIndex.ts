export const INDEX_URL = process.env.SKILLCRAFT_INDEX_URL || 'https://skillcraft.gg/skills/search/index.json'

export type SkillRecord = {
  id: string
  name: string
  owner: string
  slug: string
  url: string
  path: string
  tags: string[]
  updatedAt: string
  description: string
  indexMetadata: Record<string, unknown>
}

type RawSkillPayload = Record<string, unknown>

type ParsedSkillIndexPayload = {
  skills?: unknown
}

const IGNORED_METADATA_KEYS = new Set([
  'id',
  'name',
  'owner',
  'slug',
  'runtime',
  'runtimes',
  'runtimeText',
  'tags',
  'tagsText',
  'updatedAt',
  'description',
  'url',
  'path',
])

const normalize = (value: unknown): string => {
  if (!value) {
    return ''
  }

  if (Array.isArray(value)) {
    return value
      .filter((item) => item)
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(', ')
  }

  return String(value).trim()
}

const normalizeList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

const uniqueSorted = (items: string[]) =>
  [...new Set(items.map((item) => item.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))

const ensureOwner = (value: unknown): string => {
  const owner = normalize(value).toLowerCase()
  return owner || 'unknown'
}

const ensureSlug = (value: unknown, fallback: unknown): string => {
  const normalized = normalize(value).toLowerCase().replace(/\s+/g, '-')
  const fallbackValue = fallback ? normalize(fallback).toLowerCase().replace(/\s+/g, '-') : ''

  return normalized || fallbackValue || safeId(fallback)
}

const parseTagList = (value: unknown, tagsText: unknown): string[] => {
  return uniqueSorted([...normalizeList(value), ...normalizeList(tagsText)])
}

const buildIndexMetadata = (entry: RawSkillPayload): Record<string, unknown> => {
  const output: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(entry)) {
    if (!IGNORED_METADATA_KEYS.has(key)) {
      output[key] = value
    }
  }

  return output
}

const parseSkillEntry = (entry: unknown): SkillRecord | null => {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return null
  }

  const skill = entry as RawSkillPayload
  const owner = ensureOwner(skill.owner)
  const slug = ensureSlug(skill.slug, skill.name)

  if (!owner || !slug) {
    return null
  }

  const tags = parseTagList(skill.tags, skill.tagsText)
  const rawMetadata = buildIndexMetadata(skill)

  return {
    id: normalize(skill.id || `${owner}:${slug}`).toLowerCase() || `${owner}:${slug}`,
    name: normalize(skill.name || slug || 'Untitled') || 'Untitled',
    owner,
    slug,
    url: normalize(skill.url || ''),
    path: normalize(skill.path || `skills/${slug}`),
    tags,
    updatedAt: normalize(skill.updatedAt || ''),
    description: normalize(skill.description || '') || 'No description provided.',
    indexMetadata: rawMetadata,
  }
}

export const parseSkillIndexPayload = (payload: unknown): SkillRecord[] => {
  const entries = Array.isArray(payload)
    ? (payload as unknown[])
    : (
        isObjectRecord(payload) && 'skills' in (payload as ParsedSkillIndexPayload)
          ? ((payload as ParsedSkillIndexPayload).skills as unknown)
          : null
      )

  if (!Array.isArray(entries)) {
    return []
  }

  return entries
    .map(parseSkillEntry)
    .filter((skill): skill is SkillRecord => Boolean(skill))
}

const isObjectRecord = (value: unknown): value is ParsedSkillIndexPayload => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const fetchIndexPayload = async (cache: RequestCache = 'default'): Promise<SkillRecord[]> => {
  const response = await fetch(INDEX_URL, { cache })

  if (!response.ok) {
    throw new Error(`Failed to load skill index (${response.status})`)
  }

  const payload = (await response.json()) as unknown
  return parseSkillIndexPayload(payload)
}

const safeId = (value: unknown) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')

let cachedSkills: SkillRecord[] | null = null

export const fetchSkillIndex = async (): Promise<SkillRecord[]> => {
  if (cachedSkills) {
    return cachedSkills
  }

  const parsed = await fetchIndexPayload()

  cachedSkills = parsed
  return parsed
}

export const fetchLiveSkillIndex = async (): Promise<SkillRecord[]> => {
  return fetchIndexPayload('no-store')
}

export const collectOwners = (skills: SkillRecord[]): string[] =>
  uniqueSorted(skills.map((skill) => skill.owner))

export const collectTags = (skills: SkillRecord[]): string[] =>
  uniqueSorted(skills.flatMap((skill) => skill.tags))

const parseUpdatedAt = (value: string): number => {
  const parsed = Date.parse(value || '')
  return Number.isNaN(parsed) ? 0 : parsed
}

export const sortByUpdatedDesc = (skills: SkillRecord[]): SkillRecord[] =>
  [...skills].sort((a, b) => {
    const aTime = parseUpdatedAt(a.updatedAt)
    const bTime = parseUpdatedAt(b.updatedAt)

    if (aTime === bTime) {
      return a.name.localeCompare(b.name)
    }

    return bTime - aTime
  })

export const findSkillByPath = (skills: SkillRecord[], owner: string, slug: string) =>
  skills.find((skill) => skill.owner === owner && skill.slug === slug)
