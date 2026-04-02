export const ISSUED_CREDENTIALS_INDEX_URL = process.env.ISSUED_CREDENTIALS_INDEX_URL
  || 'https://skillcraft.gg/credential-ledger/issued/users/index.json'

export type IssuedCredentialSummary = {
  definition: string
  issuedAt: string
  claimId: string
  sourceCommits: string[]
  subject: Record<string, unknown>
  path: string
  definitionOwner: string
  definitionSlug: string
}

export type IssuedCredentialProfileMatch = {
  profile: IssuedUserRecord
  issuedCredential: IssuedCredentialSummary
}

export type IssuedUserRecord = {
  github: string
  issuedCount: number
  credentials: IssuedCredentialSummary[]
}

type RawIssuedRecord = Record<string, unknown>

type RawIssuedIndexPayload = {
  github?: unknown
  issuedCount?: unknown
  credentials?: unknown
}

const normalize = (value: unknown): string => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

const normalizeHandle = (value: unknown): string => {
  const normalized = normalize(value).toLowerCase().replace(/^@/, '')
  return normalized
}

const normalizeSlug = (value: unknown): string => normalize(value).toLowerCase()

const parseDefinition = (value: string): [string, string] => {
  const normalizedDefinition = normalize(value)
  if (!normalizedDefinition) {
    return ['', '']
  }

  const rawParts = normalizedDefinition.includes('://')
    ? normalizedDefinition.split('://').slice(1).join('://').split('/')
    : normalizedDefinition.split('/')

  const filteredParts = rawParts
    .map((entry) => normalize(entry))
    .filter(Boolean)

  const owner = filteredParts[filteredParts.length - 2] || ''
  const slug = normalizeSlug(filteredParts[filteredParts.length - 1] || '')

  return [normalizeSlug(owner), slug.replace(/\.json$/i, '')]
}

const normalizeSourceCommits = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => normalize(entry))
    .filter(Boolean)
}

const parseIssuedCredential = (entry: unknown): IssuedCredentialSummary | null => {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return null
  }

  const raw = entry as Record<string, unknown>
  const definition = normalize(raw.definition)
  if (!definition) {
    return null
  }

  const [owner, slug] = parseDefinition(definition)
  const subject = raw.subject && typeof raw.subject === 'object' && !Array.isArray(raw.subject)
    ? raw.subject as Record<string, unknown>
    : {}

  return {
    definition: definition.toLowerCase(),
    issuedAt: normalize(raw.issuedAt || raw.issued_at),
    claimId: normalize(raw.claimId || raw.claim_id),
    sourceCommits: normalizeSourceCommits(raw.sourceCommits ?? raw.source_commits),
    subject,
    path: normalize(raw.path),
    definitionOwner: owner,
    definitionSlug: slug,
  }
}

const parseProfileRecord = (entry: unknown): IssuedUserRecord | null => {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return null
  }

  const raw = entry as RawIssuedRecord
  const github = normalizeHandle(raw.github)
  if (!github) {
    return null
  }

  const rawCredentials = Array.isArray(raw.credentials) ? raw.credentials : []
  const credentials = rawCredentials
    .map(parseIssuedCredential)
    .filter((item): item is IssuedCredentialSummary => Boolean(item))

  const issuedCount = Number.isFinite(Number(raw.issuedCount))
    ? Math.max(0, Number(raw.issuedCount))
    : credentials.length

  const sortedCredentials = [...credentials].sort((left, right) => {
    const leftTime = Date.parse(left.issuedAt)
    const rightTime = Date.parse(right.issuedAt)

    const leftValue = Number.isNaN(leftTime) ? 0 : leftTime
    const rightValue = Number.isNaN(rightTime) ? 0 : rightTime

    if (rightValue === leftValue) {
      return left.definition.localeCompare(right.definition)
    }

    return rightValue - leftValue
  })

  return {
    github,
    issuedCount: issuedCount || sortedCredentials.length,
    credentials: sortedCredentials,
  }
}

const parseIndexPayloadFromObject = (payload: Record<string, unknown>): RawIssuedRecord[] => {
  if (Array.isArray(payload.credentials) && payload.github) {
    return [payload]
  }

  return Object
    .values(payload)
    .filter((entry): entry is RawIssuedRecord => {
      return Boolean(entry && typeof entry === 'object' && !Array.isArray(entry))
    })
    .map((entry) => {
      if ((entry as Record<string, unknown>).github) {
        return entry as RawIssuedRecord
      }

      return entry as RawIssuedRecord
    })
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export const parseIssuedCredentialsPayload = (payload: unknown): IssuedUserRecord[] => {
  const entries = Array.isArray(payload)
    ? (payload as unknown[])
    : isObjectRecord(payload)
      ? parseIndexPayloadFromObject(payload)
      : []

  return entries
    .map(parseProfileRecord)
    .filter((record): record is IssuedUserRecord => Boolean(record))
    .sort((left, right) => left.github.localeCompare(right.github))
}

const fetchIndexPayload = async (cache: RequestCache = 'default'): Promise<IssuedUserRecord[]> => {
  const response = await fetch(ISSUED_CREDENTIALS_INDEX_URL, { cache })

  if (!response.ok) {
    throw new Error(`Failed to load issued credentials index (${response.status})`)
  }

  const payload = (await response.json()) as unknown
  return parseIssuedCredentialsPayload(payload)
}

let cachedIssuedCredentials: IssuedUserRecord[] | null = null

export const fetchIssuedCredentialsIndex = async (): Promise<IssuedUserRecord[]> => {
  if (cachedIssuedCredentials) {
    return cachedIssuedCredentials
  }

  const parsed = await fetchIndexPayload()
  cachedIssuedCredentials = parsed
  return parsed
}

export const fetchLiveIssuedCredentialsIndex = async (): Promise<IssuedUserRecord[]> => {
  return fetchIndexPayload('no-store')
}

export const collectProfileHandles = (profiles: IssuedUserRecord[]): string[] =>
  [...new Set(profiles.map((profile) => profile.github))].sort((a, b) => a.localeCompare(b))

export const findIssuedProfile = (profiles: IssuedUserRecord[], handle: string) =>
  profiles.find((profile) => profile.github === normalizeHandle(handle))

export const findIssuedCredentialForProfile = (
  profile: IssuedUserRecord,
  owner: string,
  slug: string,
) => {
  const matchOwner = normalizeSlug(owner)
  const matchSlug = normalizeSlug(slug)

  return profile.credentials.find((credential) => (
    credential.definitionOwner === matchOwner
    && credential.definitionSlug === matchSlug
  ))
}

export const findIssuedProfilesForCredential = (
  profiles: IssuedUserRecord[],
  owner: string,
  slug: string,
) => {
  const matchOwner = normalizeSlug(owner)
  const matchSlug = normalizeSlug(slug)
  const matchDefinition = `${matchOwner}/${matchSlug}`

  return profiles
    .map((profile) => {
      const issuedCredential = profile.credentials.find((credential) => (
        credential.definitionOwner === matchOwner
        && credential.definitionSlug === matchSlug
      ) || normalize(credential.definition) === matchDefinition)

      if (!issuedCredential) {
        return null
      }

      return {
        profile,
        issuedCredential,
      }
    })
    .filter((entry): entry is IssuedCredentialProfileMatch => Boolean(entry))
}
