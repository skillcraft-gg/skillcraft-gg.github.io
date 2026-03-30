export const CREDENTIAL_INDEX_URL = process.env.CREDENTIAL_INDEX_URL || 'https://skillcraft.gg/credential-ledger/credentials/index.json'

export type CredentialDefinition = {
  id: string
  name: string
  owner: string
  slug: string
  url: string
  path: string
  updatedAt: string
  description: string
  requirements: Record<string, unknown>
  images: Record<string, unknown>
  indexMetadata: Record<string, unknown>
}

type RawCredentialPayload = Record<string, unknown>

type ParsedCredentialIndexPayload = {
  credentials?: unknown
}

const IGNORED_METADATA_KEYS = new Set([
  'id',
  'name',
  'owner',
  'slug',
  'url',
  'path',
  'updatedAt',
  'description',
  'requirements',
  'images',
])

const normalize = (value: unknown): string => {
  if (!value) {
    return ''
  }

  return String(value).trim()
}

const toLower = (value: string) => value.toLowerCase()

const ensureOwner = (value: unknown): string => {
  const owner = normalize(value).toLowerCase()
  return owner || 'unknown'
}

const ensureSlug = (value: unknown, fallback: unknown, owner: string): string => {
  const slug = normalize(value).toLowerCase().replace(/\s+/g, '-')
  if (slug) {
    return slug
  }

  const fallbackValue = normalize(fallback).toLowerCase().replace(/\s+/g, '-')
  if (fallbackValue) {
    return fallbackValue
  }

  const id = normalize((value as { toString?: () => string } )?.toString?.() || '')
  const [idOwner, idSlug] = normalize(id).split('/')

  if (idOwner && idOwner.toLowerCase() === owner && idSlug) {
    return normalize(idSlug).toLowerCase().replace(/\s+/g, '-')
  }

  return safeId(fallbackValue || id || 'credential')
}

const buildIndexMetadata = (entry: RawCredentialPayload): Record<string, unknown> => {
  const output: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(entry)) {
    if (!IGNORED_METADATA_KEYS.has(key)) {
      output[key] = value
    }
  }

  return output
}

const normalizeObject = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

const parseCredentialEntry = (entry: unknown): CredentialDefinition | null => {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return null
  }

  const credential = entry as RawCredentialPayload
  const rawOwner = ensureOwner(credential.owner)
  const rawId = normalize(credential.id).toLowerCase()
  const [idOwner, idSlug] = rawId.split('/')
  const owner = rawOwner || (idOwner || 'unknown')
  const slug = ensureSlug(credential.slug, idSlug || credential.path || credential.name, owner)

  if (!owner || !slug) {
    return null
  }

  const url = normalize(credential.url)
  const path = normalize(credential.path)

  return {
    id: rawId || `${owner}/${slug}`,
    name: normalize(credential.name || slug || 'Untitled') || 'Untitled',
    owner,
    slug: slug.toLowerCase(),
    url,
    path,
    updatedAt: normalize(credential.updatedAt),
    description: normalize(credential.description || '') || 'No description provided.',
    requirements: normalizeObject(credential.requirements),
    images: normalizeObject(credential.images),
    indexMetadata: buildIndexMetadata(credential),
  }
}

export const parseCredentialIndexPayload = (payload: unknown): CredentialDefinition[] => {
  const entries = Array.isArray(payload)
    ? (payload as unknown[])
    : (
      isObjectRecord(payload) && 'credentials' in (payload as ParsedCredentialIndexPayload)
        ? ((payload as ParsedCredentialIndexPayload).credentials as unknown)
        : null
    )

  if (!Array.isArray(entries)) {
    return []
  }

  return entries
    .map(parseCredentialEntry)
    .filter((credential): credential is CredentialDefinition => Boolean(credential))
}

const isObjectRecord = (value: unknown): value is ParsedCredentialIndexPayload => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const fetchIndexPayload = async (cache: RequestCache = 'default'): Promise<CredentialDefinition[]> => {
  const response = await fetch(CREDENTIAL_INDEX_URL, { cache })

  if (!response.ok) {
    throw new Error(`Failed to load credential index (${response.status})`)
  }

  const payload = (await response.json()) as unknown
  return parseCredentialIndexPayload(payload)
}

const safeId = (value: unknown) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')

let cachedCredentials: CredentialDefinition[] | null = null

export const fetchCredentialIndex = async (): Promise<CredentialDefinition[]> => {
  if (cachedCredentials) {
    return cachedCredentials
  }

  const parsed = await fetchIndexPayload()
  cachedCredentials = parsed
  return parsed
}

export const fetchLiveCredentialIndex = async (): Promise<CredentialDefinition[]> => {
  return fetchIndexPayload('no-store')
}

export const collectCredentialOwners = (credentials: CredentialDefinition[]): string[] => {
  return [...new Set(credentials.map((credential) => credential.owner))].sort((a, b) => a.localeCompare(b))
}

const parseUpdatedAt = (value: string): number => {
  const parsed = Date.parse(value || '')
  return Number.isNaN(parsed) ? 0 : parsed
}

export const sortByUpdatedDesc = (credentials: CredentialDefinition[]): CredentialDefinition[] =>
  [...credentials].sort((a, b) => {
    const aTime = parseUpdatedAt(a.updatedAt)
    const bTime = parseUpdatedAt(b.updatedAt)

    if (aTime === bTime) {
      return a.name.localeCompare(b.name)
    }

    return bTime - aTime
  })

export const findCredentialByPath = (
  credentials: CredentialDefinition[],
  owner: string,
  slug: string,
) => {
  return credentials.find((credential) => credential.owner === owner && credential.slug === slug)
}
