import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import AppShell from '../../../../../../../components/AppShell'
import CredentialImageFallback from '../../../../../../../components/credentials/CredentialImageFallback'
import CredentialRequirementsRenderer from '../../../../../../../components/credentials/CredentialRequirementsRenderer'
import CredentialJsonLd from '../../../../../../../components/seo/CredentialJsonLd'
import { resolveCredentialImage } from '../../../../../../../components/credentials/credentialImageResolver'
import {
  findCredentialByPath,
  fetchCredentialIndex,
  type CredentialDefinition,
} from '../../../../../../../lib/credentialIndex'
import {
  findIssuedCredentialForProfile,
  findIssuedProfile,
  fetchLiveIssuedCredentialsIndex,
} from '../../../../../../../lib/issuedCredentialsIndex'

type IssuedCredentialDetailParams = {
  handle: string
  owner: string
  slug: string
}

const BASE_URL = 'https://skillcraft.gg'

const buildCanonical = (handle: string, owner: string, slug: string) => (
  `/credentials/profiles/github/${handle}/${owner}/${slug}/`
)

const formatIssuedDate = (value: string) => {
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

const normalize = (value: string): string => (value || '').trim()

const fallbackCredential = (owner: string, slug: string, issuedDefinition: string, issuedAt: string): CredentialDefinition => ({
  id: issuedDefinition,
  name: normalize(issuedDefinition) || `${owner}/${slug}`,
  owner,
  slug,
  url: '',
  path: '',
  updatedAt: issuedAt,
  description: `Issued credential for ${owner}/${slug}.`,
  requirements: {},
  images: {},
  indexMetadata: {},
})

const buildMetaDescription = (definition: CredentialDefinition, issuedAt: string, handle: string, claimId: string) => {
  const issued = formatIssuedDate(issuedAt)
  if (claimId) {
    return `${definition.name} was issued to ${handle} on ${issued} (claim ${claimId}).`
  }

  return `${definition.name} was issued to ${handle} on ${issued}.`
}

const buildJsonLdSummary = (definition: CredentialDefinition, issuedDate: string, claimId: string) => {
  if (claimId) {
    return `${definition.name} includes claim ${claimId} issued on ${issuedDate}.`
  }

  return `${definition.name} was issued on ${issuedDate}.`
}

const stringifySubject = (subject: unknown) => {
  if (!subject || typeof subject !== 'object') {
    return 'No subject payload was published in this issued credential.'
  }

  const output = JSON.stringify(subject, null, 2)
  if (output === '{}') {
    return 'No subject payload was published in this issued credential.'
  }

  return output
}

const toRepositoryPath = (value: string) => {
  const repository = (value || '').trim().replace(/^@+/, '').replace(/^https:\/\//i, '').replace(/\/+$/g, '')
  if (!/^[a-z0-9-_.]+\/[a-z0-9-_.]+$/i.test(repository)) {
    return ''
  }

  return repository.toLowerCase()
}

const buildCommitLines = (items: string[], fallbackRepository?: string) => {
  if (!items || items.length === 0) {
    return <p className="caption">No source commits were referenced.</p>
  }

  const defaultRepository = toRepositoryPath(fallbackRepository || '')

  const getCommitLink = (entry: string) => {
    const commit = entry.trim()
    if (!commit) {
      return null
    }

    if (/^https?:\/\//.test(commit)) {
      return commit
    }

    const ownerRepoWithAtSha = /^([a-z0-9-_.]+\/[a-z0-9-_.]+)@([0-9a-f]{7,40})$/i.exec(commit)
    if (ownerRepoWithAtSha) {
      return `https://github.com/${ownerRepoWithAtSha[1]}/commit/${ownerRepoWithAtSha[2]}`
    }

    const commitOnly = /^[0-9a-f]{7,40}$/i.test(commit)
    if (commitOnly) {
      if (defaultRepository) {
        return `https://github.com/${defaultRepository}/commit/${commit}`
      }

      return `https://github.com/search?q=${encodeURIComponent(commit)}&type=commits`
    }

    const maybePath = /(?:https:\/\/github\.com\/)?([a-z0-9-_.]+\/[a-z0-9-_.]+)(?:\/commit)?\/([0-9a-f]{7,40})(?:\/)?$/i.exec(commit)
    if (maybePath) {
      return `https://github.com/${maybePath[1]}/commit/${maybePath[2]}`
    }

    const withRepoSuffix = /^([a-z0-9-_.]+\/[a-z0-9-_.]+):([0-9a-f]{7,40})$/i.exec(commit)
    if (withRepoSuffix) {
      return `https://github.com/${withRepoSuffix[1]}/commit/${withRepoSuffix[2]}`
    }

    return null
  }

  return (
    <ul className="detail-list detail-list--compact">
      {items.map((entry, index) => (
        <li key={`${entry}-${index}`}>
          {(() => {
            const href = getCommitLink(entry)
            if (!href) {
              return <span>{entry}</span>
            }

            return (
            <a href={href} target="_blank" rel="noreferrer">
              {entry}
            </a>
            )
          })()}
        </li>
      ))}
    </ul>
  )
}

const getNoIssuedHandle = () => '__skillcraft-no-profiles__'

const getNoIssuedPlaceholder = () => '__skillcraft-no-credential__'

const safeFetchProfiles = async () => {
  try {
    return await fetchLiveIssuedCredentialsIndex()
  } catch {
    return []
  }
}

const buildMissingIssuedParams = (handle: string): IssuedCredentialDetailParams[] => [{
  handle: handle || getNoIssuedHandle(),
  owner: getNoIssuedPlaceholder(),
  slug: getNoIssuedPlaceholder(),
}]

export async function generateStaticParams(): Promise<IssuedCredentialDetailParams[]> {
  const profiles = await safeFetchProfiles()

  const profileRoutes = profiles.flatMap((profile) => profile.credentials.map((credential) => ({
    handle: profile.github,
    owner: credential.definitionOwner,
    slug: credential.definitionSlug,
  })))

  if (profileRoutes.length > 0) {
    const seen = new Set<string>()
    return profileRoutes.filter((entry) => {
      const key = `${entry.handle}:${entry.owner}:${entry.slug}`
      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
  }

  return buildMissingIssuedParams('')
}

export async function generateMetadata({ params }: { params: IssuedCredentialDetailParams }): Promise<Metadata> {
  const handle = decodeURIComponent((params.handle || '').toLowerCase())
  const owner = decodeURIComponent((params.owner || '').toLowerCase())
  const slug = decodeURIComponent((params.slug || '').toLowerCase())

  const issuedProfiles = await safeFetchProfiles()
  const profile = findIssuedProfile(issuedProfiles, handle)
  const issued = profile ? findIssuedCredentialForProfile(profile, owner, slug) : null
  const definitions = await fetchCredentialIndex()
  const definitionFromLedger = findCredentialByPath(definitions, owner, slug)

  const canonical = `${BASE_URL}${buildCanonical(handle, owner, slug)}`

  if (!profile || !issued) {
    return {
      title: 'Issued Credential Not Found | Skillcraft',
      description: 'This issued credential record could not be found.',
      alternates: {
        canonical,
      },
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const credentialForMeta = definitionFromLedger
    || fallbackCredential(owner, slug, issued.definition, issued.issuedAt)
  const summary = buildMetaDescription(credentialForMeta, issued.issuedAt, handle, issued.claimId)

  return {
    title: `${credentialForMeta.name} | Skillcraft Credential Evidence`,
    description: summary,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'article',
      url: canonical,
      title: `${credentialForMeta.name} | Skillcraft Credential Evidence`,
      description: summary,
      images: [
        {
          url: '/images/og-home.jpg',
          width: 1200,
          height: 630,
          alt: `${credentialForMeta.name} issued credential detail`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${credentialForMeta.name} | Skillcraft Credential Evidence`,
      description: summary,
      images: ['/images/og-home.jpg'],
    },
  }
}

export default async function IssuedCredentialDetailPage({ params }: { params: IssuedCredentialDetailParams }) {
  const handle = decodeURIComponent((params.handle || '').toLowerCase())
  const owner = decodeURIComponent((params.owner || '').toLowerCase())
  const slug = decodeURIComponent((params.slug || '').toLowerCase())

  const issuedProfiles = await safeFetchProfiles()
  const profile = findIssuedProfile(issuedProfiles, handle)
  if (!profile) {
    notFound()
  }

  const issued = findIssuedCredentialForProfile(profile, owner, slug)
  if (!issued) {
    notFound()
  }

  const definitions = await fetchCredentialIndex()
  const definitionFromLedger = findCredentialByPath(definitions, owner, slug)
  const definition = definitionFromLedger
    || fallbackCredential(owner, slug, issued.definition, issued.issuedAt)

  const issuedDate = formatIssuedDate(issued.issuedAt)
  const jsonLdSummary = buildJsonLdSummary(definition, issuedDate, issued.claimId)
  const imageUrl = resolveCredentialImage(definition)

  return (
    <>
      <CredentialJsonLd credential={definition} canonicalUrl={`${BASE_URL}${buildCanonical(handle, owner, slug)}`} summary={jsonLdSummary} />

      <AppShell
        title={`Credential / ${profile.github}`}
        activePath="/credentials"
        copyClassName="copy--wide copy-skill-detail"
        fullBleed
      >
        <Link className="btn btn-secondary detail-back-link" href={`/credentials/profiles/github/${profile.github}/`} aria-label="Back to profile">
          ← Back to profile
        </Link>

        <section className="section" aria-label="Issued credential trail">
          <div className="section-head section-head--skills">
            <div>
              <p className="eyebrow">Issued credential</p>
              <h1>{definition.name}</h1>
              <p>{`Definition: ${definition.id}`}</p>
            </div>
          </div>
        </section>

        <section className="section skill-detail" aria-label="Issued credential details">
          <div className="detail-summary-layout">
            <div className="detail-summary-column">
              <div className="detail-summary-shell">
                <p className="kicker">Issued credential · @{profile.github}</p>

                <div className="detail-image-shell">
                  <CredentialImageFallback
                    src={imageUrl}
                    alt={`${definition.name} credential image`}
                    loading="eager"
                    className="detail-image"
                  />
                </div>

                <h2>{definition.name}</h2>
                <p className="caption">{`Issued ${issuedDate}`}</p>
                <p className="caption">{`Claim ID: ${issued.claimId || 'not provided'}`}</p>
              </div>

              <section className="detail-summary">
                <h2 className="panel-title">Evidence details</h2>
                <ul className="detail-list detail-list--compact">
                  <li><strong>Claim ID:</strong> {issued.claimId || 'not provided'}</li>
                  <li><strong>Referenced commits:</strong> {issued.sourceCommits.length}</li>
                </ul>

                <p className="panel-title" style={{ marginTop: '1rem' }}>Subject payload</p>
                <pre className="metadata-json">{stringifySubject(issued.subject)}</pre>

                <h2 className="panel-title">Source commits</h2>
                {buildCommitLines(issued.sourceCommits, `${definition.owner}/${definition.slug}`)}
              </section>
            </div>
            <div className="detail-action-row">
              <section className="panel detail-sidebar-panel">
                <h2 className="panel-title">Credential definition</h2>
                <ul className="detail-list detail-list--compact">
                  <li><strong>Handle:</strong> @{profile.github}</li>
                  <li><strong>Owner:</strong> {definition.owner || owner}</li>
                  <li><strong>Definition:</strong> {definition.id}</li>
                  <li><strong>Definition path:</strong> {definition.path || 'not provided'}</li>
                  <li><strong>Issued:</strong> {issuedDate}</li>
                  <li><strong>Source path:</strong> {issued.path || 'not provided'}</li>
                </ul>
              </section>

              <section className="panel detail-sidebar-panel">
                <h2 className="panel-title">Requirements</h2>
                <CredentialRequirementsRenderer requirements={definition.requirements} />
              </section>
            </div>
          </div>
        </section>
      </AppShell>
    </>
  )
}
