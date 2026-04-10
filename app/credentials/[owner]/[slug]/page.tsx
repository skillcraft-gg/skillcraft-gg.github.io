import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import AppShell from '../../../../components/AppShell'
import CredentialDetailSummaryPanel from '../../../../components/credentials/CredentialDetailSummaryPanel'
import CredentialRequirementsRenderer from '../../../../components/credentials/CredentialRequirementsRenderer'
import CredentialJsonLd from '../../../../components/seo/CredentialJsonLd'
import { resolveCredentialImage } from '../../../../components/credentials/credentialImageResolver'
import CopyCommandButton from '../../../../components/skills/CopyCommandButton'
import {
  findCredentialByPath,
  fetchCredentialIndex,
  type CredentialDefinition,
} from '../../../../lib/credentialIndex'
import {
  findIssuedProfilesForCredential,
  fetchIssuedCredentialsIndex,
} from '../../../../lib/issuedCredentialsIndex'
import { withSocialImageDefaults } from '../../../../lib/metadata'

type CredentialDetailParams = {
  owner: string
  slug: string
}

const BASE_URL = 'https://skillcraft.gg'
const TRACK_PREFIX = 'skillcraft progress track '
const defaultSummary = 'Explore this Skillcraft credential definition, source location, and supporting metadata.'

const RESERVED_INDEX_KEYS = new Set(['id', 'name', 'owner', 'slug', 'url', 'path', 'updatedAt', 'description', 'requirements', 'images'])

const SEO_DESCRIPTION_TARGET = 100

const ensureDescriptionLength = (value: string): string => {
  if (value.length >= SEO_DESCRIPTION_TARGET) {
    return value
  }

  return `${value} Explore this credential definition to review verification criteria, source references, and how to validate trust claims.`
}

const buildCanonical = (owner: string, slug: string) => `/credentials/${owner}/${slug}/`

const buildIssuedListUrl = (owner: string, slug: string) => `${buildCanonical(owner, slug)}issued/`

const normalizeText = (value: string): string => {
  if (!value) {
    return 'Not provided'
  }

  return value.trim()
}

const buildMetaDescription = (credential: CredentialDefinition): string => {
  const summary = normalizeText(credential.description)
  if (summary && summary !== 'No description provided.') {
    return ensureDescriptionLength(summary)
  }

  return ensureDescriptionLength(`${credential.name} issued by ${credential.owner}.`)
}

const buildFallbackSummary = (credential: CredentialDefinition): string => {
  return `${credential.name} is a credential definition maintained by ${credential.owner}.`
}

const buildSummaryForJsonLd = (credential: CredentialDefinition) => {
  return normalizeText(credential.description) || buildFallbackSummary(credential)
}

const formatIssuedCount = (count: number) => {
  if (count === 0) {
    return 'No users'
  }

  if (count === 1) {
    return '1 user'
  }

  return `${count} users`
}

const formatUpdated = (value: string) => {
  if (!value) {
    return 'Unknown'
  }

  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return value
  }

  return new Date(parsed).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const safeFetchIssuedProfiles = async () => {
  try {
    return await fetchIssuedCredentialsIndex()
  } catch {
    return []
  }
}

const stringifyValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'Not provided'
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'Not provided'
    }

    return value
      .map((entry) => stringifyValue(entry))
      .filter(Boolean)
      .join('\n')
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  if (typeof value === 'string') {
    return value.trim() || 'Not provided'
  }

  return String(value)
}

const isDisplayableMetadata = (key: string, value: unknown) => {
  if (RESERVED_INDEX_KEYS.has(key)) {
    return false
  }

  if (value === null || value === undefined || value === '') {
    return false
  }

  if (Array.isArray(value) && value.length === 0) {
    return false
  }

  return true
}

const renderMetadataList = (entries: [string, unknown][]) => {
  if (entries.length === 0) {
    return <p className="caption">No additional index metadata was published.</p>
  }

  return (
    <ul className="detail-list detail-list--compact detail-metadata-list">
      {entries.map(([key, value]) => (
        <li key={key}>
          <strong>{key}:</strong>
          {typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? (
            <span> {stringifyValue(value)}</span>
          ) : Array.isArray(value) || (value && typeof value === 'object') ? (
            <pre className="metadata-json">{stringifyValue(value)}</pre>
          ) : (
            <span> {stringifyValue(value)}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

export const generateStaticParams = async (): Promise<CredentialDetailParams[]> => {
  const credentials = await fetchCredentialIndex()

  return credentials.map((credential) => ({
    owner: credential.owner,
    slug: credential.slug,
  }))
}

export async function generateMetadata({ params }: { params: CredentialDetailParams }): Promise<Metadata> {
  const owner = decodeURIComponent((params.owner || '').toLowerCase())
  const slug = decodeURIComponent((params.slug || '').toLowerCase())

  const credentials = await fetchCredentialIndex()
  const credential = findCredentialByPath(credentials, owner, slug)

  if (!credential) {
    return withSocialImageDefaults({
      title: 'Credential Not Found | Skillcraft',
      description: 'This credential could not be found.',
      alternates: {
        canonical: `${BASE_URL}/credentials/${owner}/${slug}/`,
      },
      robots: {
        index: false,
        follow: false,
      },
    })
  }

  const summary = buildMetaDescription(credential)

  return withSocialImageDefaults({
    title: `${credential.name} | Skillcraft Credentials`,
    description: summary,
    alternates: {
      canonical: `${BASE_URL}${buildCanonical(credential.owner, credential.slug)}`,
    },
    openGraph: {
      type: 'article',
      url: `${BASE_URL}${buildCanonical(credential.owner, credential.slug)}`,
      title: `${credential.name} | Skillcraft Credentials`,
      description: summary,
      images: [
        {
          url: '/images/og-home.jpg',
          width: 1200,
          height: 630,
          alt: `${credential.name} credential`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${credential.name} | Skillcraft Credentials`,
      description: summary,
      images: ['/images/og-home.jpg'],
    },
  })
}

export default async function CredentialDetailPage({ params }: { params: CredentialDetailParams }) {
  const owner = decodeURIComponent((params.owner || '').toLowerCase())
  const slug = decodeURIComponent((params.slug || '').toLowerCase())

  const credentials = await fetchCredentialIndex()
  const selected = findCredentialByPath(credentials, owner, slug)

  if (!selected) {
    notFound()
  }

  const summary = buildSummaryForJsonLd(selected)
  const canonical = buildCanonical(selected.owner, selected.slug)
  const metadataEntries = Object
    .entries(selected.indexMetadata)
    .filter(([key, value]) => isDisplayableMetadata(key, value))
    .sort((a, b) => a[0].localeCompare(b[0]))

  const issuedProfiles = await safeFetchIssuedProfiles()
  const issuedUsers = findIssuedProfilesForCredential(issuedProfiles, selected.owner, selected.slug)
  const issuedCount = issuedUsers.length
  const issuedListUrl = buildIssuedListUrl(selected.owner, selected.slug)
  const trackCommand = `${TRACK_PREFIX}${selected.owner}/${selected.slug}`

  return (
    <>
      <CredentialJsonLd
        credential={selected}
        canonicalUrl={`${BASE_URL}${canonical}`}
        summary={summary}
      />

      <AppShell
        title={`Credentials / ${selected.owner}`}
        activePath="/credentials"
        copyClassName="copy--wide copy-skill-detail"
        fullBleed
      >
        <Link href="/credentials" className="btn btn-secondary detail-back-link" aria-label="Back to credentials">
          ← Back to Credentials
        </Link>

        <section className="section skill-detail" aria-label={`Credential detail for ${selected.name}`}>
          <div className="detail-summary-layout">
            <div className="detail-summary-column">
              <CredentialDetailSummaryPanel
                owner={selected.owner}
                name={selected.name}
                updatedAt={formatUpdated(selected.updatedAt)}
                sourceUrl={selected.url}
                imageUrl={resolveCredentialImage(selected)}
                summary={selected.description}
                fallbackSummary={defaultSummary}
              />
            </div>

            <div className="detail-action-row">
              <div className="skill-install-card">
                <p className="label">Track this skill</p>
                <div className="skill-install-row skill-install-row--stacked">
                  <code className="skill-install-command skill-install-command--detail">{trackCommand}</code>
                  <CopyCommandButton text={trackCommand} className="btn btn-primary" label="Copy Command" />
                </div>
              </div>

              <section className="panel detail-sidebar-panel">
                <h2 className="panel-title">Registry details</h2>
                <ul className="detail-list detail-list--compact">
                  <li><strong>Owner:</strong> {selected.owner}</li>
                  <li><strong>Slug:</strong> {selected.slug}</li>
                  <li><strong>Updated:</strong> {formatUpdated(selected.updatedAt)}</li>
                  <li><strong>Path:</strong> {selected.path || 'unknown'}</li>
                   <li><strong>Registry ID:</strong> {selected.id}</li>
                   <li>
                     <strong>Issued:</strong> {formatIssuedCount(issuedCount)}
                     <Link className="tag" href={issuedListUrl} aria-label={`View issued profiles for ${selected.name}`}>
                       View Profiles
                     </Link>
                   </li>
                  </ul>
                </section>

              <section className="panel detail-sidebar-panel">
                <h2 className="panel-title">Requirements</h2>
                <CredentialRequirementsRenderer requirements={selected.requirements} />
              </section>

              <section className="panel detail-sidebar-panel">
                <h2 className="panel-title">Index metadata</h2>
                {renderMetadataList(metadataEntries)}
              </section>
            </div>
          </div>
        </section>
      </AppShell>
    </>
  )
}
