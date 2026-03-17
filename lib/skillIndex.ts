export const INDEX_URL = process.env.SKILLCRAFT_INDEX_URL || 'https://skillcraft.gg/skills/search/index.json'

export type SkillRecord = {
  id: string
  name: string
  owner: string
  slug: string
  url: string
  path: string
  runtimes: string[]
  runtimeText: string
  tags: string[]
  updatedAt: string
  description: string
}

type RawSkillPayload = {
  owner?: unknown
  slug?: unknown
  name?: unknown
  runtime?: unknown
  runtimes?: unknown
  tags?: unknown
  tagsText?: unknown
  updatedAt?: unknown
  description?: unknown
  url?: unknown
  path?: unknown
}

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

const uniqueSorted = (items: string[]) =>
  [...new Set(items.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))

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

  const response = await fetch(INDEX_URL)

  if (!response.ok) {
    throw new Error(`Failed to load skill index (${response.status})`)
  }

  const payload = (await response.json()) as unknown
  const entries = Array.isArray(payload)
    ? (payload as unknown[])
    : (typeof payload === 'object' && payload !== null && 'skills' in (payload as Record<string, unknown>)
      ? ((payload as Record<string, unknown>).skills as unknown)
      : null)

  if (!Array.isArray(entries)) {
    throw new Error('Unexpected payload shape: expected an array')
  }

  const parsed = entries
    .map((entry) => {
      const skill = (entry || {}) as RawSkillPayload
      const owner = normalize(skill.owner).toLowerCase() || 'unknown'
      const slug = normalize(skill.slug || skill.name || '').toLowerCase() || safeId(skill.name)
      const runtimeList = Array.isArray(skill.runtimes)
        ? skill.runtimes
        : Array.isArray(skill.runtime)
          ? skill.runtime
          : normalize(skill.runtime).split(',').filter(Boolean)
      const runtimes = runtimeList.length > 0
        ? runtimeList.map((runtime) => String(runtime).trim())
        : ['unknown']

      const tags = Array.isArray(skill.tags)
        ? skill.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : normalize(skill.tagsText).split(',').map((tag) => String(tag).trim()).filter(Boolean)

      return {
        id: `${owner}:${slug}`,
        name: normalize(skill.name || slug || 'Untitled'),
        owner,
        slug,
        url: normalize(skill.url || ''),
        path: normalize(skill.path || `skills/${slug}`),
        runtimes,
        runtimeText: runtimes.join(', ') || 'unknown',
        tags,
        updatedAt: normalize(skill.updatedAt || ''),
        description: normalize(skill.description) || 'No description provided.',
      }
    })
    .filter((item) => Boolean(item.owner && item.slug))

  cachedSkills = parsed
  return parsed
}

export const collectOwners = (skills: SkillRecord[]): string[] =>
  uniqueSorted(skills.map((skill) => skill.owner))

export const collectRuntimes = (skills: SkillRecord[]): string[] =>
  uniqueSorted(skills.flatMap((skill) => skill.runtimes))

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
