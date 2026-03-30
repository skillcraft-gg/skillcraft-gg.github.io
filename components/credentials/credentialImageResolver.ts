import { type CredentialDefinition } from '../../lib/credentialIndex'

const CREDENTIAL_LEDGER_URL = 'https://skillcraft.gg/credential-ledger'

export const CREDENTIAL_IMAGE_PLACEHOLDER = '/images/skillcraft-icon.png'

type ImageRecord = Record<string, unknown>

const stripCredentialLedgerPath = (value: string) => value
  .replace(/^\/+/, '')
  .replace(/^credential-ledger\//, '')

const sanitizePath = (value: string) => {
  if (!value) {
    return ''
  }

  return stripCredentialLedgerPath(String(value).trim())
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/g, '')
}

const collectImageCandidates = (images: unknown): string[] => {
  if (!images || typeof images === 'string') {
    return images ? [sanitizePath(String(images))].filter(Boolean) : []
  }

  if (Array.isArray(images)) {
    return images
      .map((entry) => sanitizePath(String(entry)))
      .filter((entry) => entry.length > 0)
  }

  if (typeof images !== 'object') {
    return []
  }

  const entries = images as ImageRecord
  const prioritized = ['credential', 'badge', 'image', 'thumbnail', 'icon']

  const fromKeys = prioritized.flatMap((key) => {
    const value = entries[key]
    if (!value) {
      return []
    }

    const normalized = sanitizePath(String(value))
    return normalized ? [normalized] : []
  })

  if (fromKeys.length > 0) {
    return fromKeys
  }

  return Object
    .values(entries)
    .map((value) => sanitizePath(String(value)))
    .filter(Boolean)
}

const normalizeImageSource = (pathOrUrl: string, credential: Pick<CredentialDefinition, 'path' | 'owner' | 'slug'>) => {
  const sanitized = sanitizePath(pathOrUrl)
  if (!sanitized) {
    return CREDENTIAL_IMAGE_PLACEHOLDER
  }

  const explicitPrefix = sanitized.startsWith('credentials/')

  if (credential.path && !explicitPrefix) {
    return `${CREDENTIAL_LEDGER_URL}/${sanitizePath(credential.path)}/${sanitized}`
  }

  if (!explicitPrefix && credential.owner && credential.slug) {
    return `${CREDENTIAL_LEDGER_URL}/credentials/${credential.owner}/${credential.slug}/${sanitized}`
  }

  return `${CREDENTIAL_LEDGER_URL}/${sanitized}`
}

const extractPathFromUrl = (value: string): string => {
  try {
    const parsed = new URL(value)
    return parsed.pathname
  } catch {
    return sanitizePath(value)
  }
}

const buildAbsoluteImageUrl = (pathOrUrl: string, credential: Pick<CredentialDefinition, 'path' | 'owner' | 'slug'>): string => {
  const normalizedSource = extractPathFromUrl(pathOrUrl)
  return normalizeImageSource(normalizedSource, credential)
}

export const resolveCredentialImage = (
  credential: Pick<CredentialDefinition, 'images' | 'path' | 'owner' | 'slug'>,
): string => {
  const candidates = collectImageCandidates(credential.images)
  const primary = candidates[0]

  if (!primary) {
    return CREDENTIAL_IMAGE_PLACEHOLDER
  }

  return buildAbsoluteImageUrl(primary, {
    path: credential.path,
    owner: credential.owner,
    slug: credential.slug,
  })
}
