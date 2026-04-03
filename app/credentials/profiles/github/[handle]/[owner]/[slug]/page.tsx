import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import AppShell from '../../../../../../../components/AppShell'
import CredentialImageFallback from '../../../../../../../components/credentials/CredentialImageFallback'
import CredentialRequirementsRenderer from '../../../../../../../components/credentials/CredentialRequirementsRenderer'
import CredentialJsonLd from '../../../../../../../components/seo/CredentialJsonLd'
import CopyCommandButton from '../../../../../../../components/skills/CopyCommandButton'
import LinkedInShareModal from '../../../../../../../components/credentials/LinkedInShareModal'
import {
  resolveCredentialImage,
  CREDENTIAL_IMAGE_PLACEHOLDER,
} from '../../../../../../../components/credentials/credentialImageResolver'
import {
  findCredentialByPath,
  fetchCredentialIndex,
  type CredentialDefinition,
} from '../../../../../../../lib/credentialIndex'
import {
  findIssuedCredentialForProfile,
  findIssuedProfile,
  fetchIssuedCredentialsIndex,
  type IssuedCredentialSource,
} from '../../../../../../../lib/issuedCredentialsIndex'

type IssuedCredentialDetailParams = {
  handle: string
  owner: string
  slug: string
}

const BASE_URL = 'https://skillcraft.gg'
const TRACK_PREFIX = 'skillcraft progress track '
const SOCIAL_IMAGE_FALLBACK = '/images/og-home.jpg'
const SOCIAL_IMAGE_FALLBACK_WIDTH = 1200
const SOCIAL_IMAGE_FALLBACK_HEIGHT = 630
const SEO_DESCRIPTION_TARGET = 155

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

const normalizeIssuedDateIso = (value: string) => {
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return ''
  }

  return new Date(parsed).toISOString()
}

const normalize = (value: string): string => (value || '').trim()

const formatHandleLabel = (handle: string) => {
  const normalized = normalize(handle)
  return normalized ? (normalized.startsWith('@') ? normalized : `@${normalized}`) : 'a verified holder'
}

const buildSourceSummary = (items: CommitReference[]) => {
  if (!items || items.length === 0) {
    return 'No verified source commits were published.'
  }

  const repoCounts = items.reduce((carry, entry) => {
    if (!entry.repo) {
      return carry
    }

    carry[entry.repo] = (carry[entry.repo] || 0) + 1
    return carry
  }, {} as Record<string, number>)

  const topEntry = Object.entries(repoCounts).sort((left, right) => {
    const [, leftCount] = left
    const [, rightCount] = right
    return rightCount - leftCount
  })[0]

  if (!topEntry) {
    return `${items.length} commits were recorded for this credential.`
  }

  const [repo, count] = topEntry
  const suffix = count === 1 ? 'commit' : 'commits'
  return `${count} ${suffix} verified in ${repo}.`
}

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

const buildMetaDescription = (
  definition: CredentialDefinition,
  issuedAt: string,
  handle: string,
  claimId: string,
  sourceSummary: string,
) => {
  const issued = formatIssuedDate(issuedAt)
  const holder = formatHandleLabel(handle)
  const claimClause = claimId ? ` Claim ID ${claimId}.` : ''
  const base = `${definition.name} was issued to ${holder} on ${issued}.${claimClause}`
  const sourceClause = sourceSummary ? ` ${sourceSummary}` : ''
  const candidate = `${base}${sourceClause}`

  if (candidate.length <= SEO_DESCRIPTION_TARGET) {
    return candidate
  }

  if (candidate.length > SEO_DESCRIPTION_TARGET) {
    const compactClaim = claimId ? ` Claim ${claimId.slice(0, 12)}.` : ''
    const compact = `${definition.name} issued to ${holder} on ${issued}.${compactClaim}${sourceClause}`
    return compact.length <= SEO_DESCRIPTION_TARGET ? compact : compact.slice(0, SEO_DESCRIPTION_TARGET)
  }

  return candidate.slice(0, SEO_DESCRIPTION_TARGET)
}

const buildMetaTitle = (definition: CredentialDefinition, handle: string) => {
  const holder = formatHandleLabel(handle)
  return `${definition.name} issued to ${holder} | Prove your AI skills at Skillcraft.gg`
}

const buildMetaImage = (definition: CredentialDefinition, handle: string, sourceSummary: string) => {
  const resolved = resolveCredentialImage(definition)
  if (resolved && resolved !== CREDENTIAL_IMAGE_PLACEHOLDER) {
    return {
      url: resolved,
      alt: `${definition.name} issued to ${formatHandleLabel(handle)}${sourceSummary ? ` · ${sourceSummary}` : ''}`,
    }
  }

  return {
    url: SOCIAL_IMAGE_FALLBACK,
    width: SOCIAL_IMAGE_FALLBACK_WIDTH,
    height: SOCIAL_IMAGE_FALLBACK_HEIGHT,
    alt: `${definition.name} issued credential detail`,
  }
}

const buildLinkedInSuggestions = (
  definition: CredentialDefinition,
  issuedDate: string,
  sourceSummary: string,
) => {
  const issuedDateLabel = formatIssuedDate(issuedDate)

  return [
    `I earned my ${definition.name} credential on Skillcraft today.`,
    `I was issued ${definition.name} with verified GitHub evidence (${sourceSummary}).`,
    `I just completed the ${definition.name} credential on Skillcraft. Verified on ${issuedDateLabel}.`,
  ]
}

const buildJsonLdSummary = (
  definition: CredentialDefinition,
  issuedDate: string,
  claimId: string,
  handle: string,
) => {
  const holder = formatHandleLabel(handle)

  if (claimId) {
    return `${definition.name} includes claim ${claimId} issued to ${holder} on ${issuedDate}.`
  }

  return `${definition.name} was issued to ${holder} on ${issuedDate}.`
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

type CommitReference = {
  commit: string
  repo?: string
}

const normalizeCommitReference = (value: unknown): string => (value || '').toString().trim()

const buildCommitReferences = (
  sourceCommits: string[],
  sources: IssuedCredentialSource[],
  fallbackRepository?: string,
) => {
  const referenced: CommitReference[] = []
  const seen = new Set<string>()

  for (const source of sources || []) {
    const repo = toRepositoryPath(source.repo || '')
    if (!repo) {
      continue
    }

    for (const commit of source.commits || []) {
      const normalizedCommit = normalizeCommitReference(commit)
      if (!normalizedCommit) {
        continue
      }

      const key = `${repo}:${normalizedCommit}`
      if (!seen.has(key)) {
        seen.add(key)
        referenced.push({
          commit: normalizedCommit,
          repo,
        })
      }
    }
  }

  if (referenced.length > 0) {
    return referenced
  }

  const fallbackRepo = toRepositoryPath(fallbackRepository || '')
  for (const commit of sourceCommits || []) {
    const normalizedCommit = normalizeCommitReference(commit)
    if (!normalizedCommit) {
      continue
    }

    const key = `${fallbackRepo || 'search'}:${normalizedCommit}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    referenced.push({
      commit: normalizedCommit,
      ...(fallbackRepo ? { repo: fallbackRepo } : {}),
    })
  }

  return referenced
}

const buildCommitLines = (items: CommitReference[]) => {
  if (!items || items.length === 0) {
    return <p className="caption">No source commits were referenced.</p>
  }

  const commitLinkFromEntry = ({ commit, repo }: CommitReference) => {
    const normalizedCommit = normalizeCommitReference(commit)
    if (!normalizedCommit) {
      return null
    }

    if (/^https?:\/\//i.test(normalizedCommit)) {
      return normalizedCommit
    }

    if (repo && /^[a-z0-9-_.]+\/[a-z0-9-_.]+$/.test(repo)) {
      return `https://github.com/${repo}/commit/${normalizedCommit}`
    }

    const ownerRepoWithAtSha = /^([a-z0-9-_.]+\/[a-z0-9-_.]+)@([0-9a-f]{7,40})$/i.exec(normalizedCommit)
    if (ownerRepoWithAtSha) {
      return `https://github.com/${ownerRepoWithAtSha[1]}/commit/${ownerRepoWithAtSha[2]}`
    }

    const maybePath = /(?:https:\/\/github\.com\/)?([a-z0-9-_.]+\/[a-z0-9-_.]+)(?:\/commit)?\/([0-9a-f]{7,40})(?:\/)?$/i.exec(normalizedCommit)
    if (maybePath) {
      return `https://github.com/${maybePath[1]}/commit/${maybePath[2]}`
    }

    const withRepoSuffix = /^([a-z0-9-_.]+\/[a-z0-9-_.]+):([0-9a-f]{7,40})$/i.exec(normalizedCommit)
    if (withRepoSuffix) {
      return `https://github.com/${withRepoSuffix[1]}/commit/${withRepoSuffix[2]}`
    }

    const commitOnly = /^[0-9a-f]{7,40}$/i.test(normalizedCommit)
    if (commitOnly) {
      return `https://github.com/search?q=${encodeURIComponent(normalizedCommit)}&type=commits`
    }

    return null
  }

  const buildProofLinkFromEntry = ({ commit, repo }: CommitReference) => {
    if (!repo) {
      return null
    }

    const normalizedCommit = normalizeCommitReference(commit)
    if (!normalizedCommit) {
      return null
    }

    return `https://github.com/${repo}/search?q=${encodeURIComponent(`${normalizedCommit} path:proofs`)}&type=code`
  }

  return (
    <ul className="detail-list detail-list--compact">
      {items.map((entry, index) => (
        <li key={`${entry.commit}-${index}`}>
          {(() => {
            const href = commitLinkFromEntry(entry)
            if (!href) {
              return <span>{entry.commit}</span>
            }

            return (
              <a href={href} target="_blank" rel="noreferrer">
                {entry.commit}
              </a>
            )
          })()}
          {entry.repo ? <span className="caption"> from {entry.repo}</span> : null}
          {(() => {
            const proofLink = buildProofLinkFromEntry(entry)
            if (!proofLink) {
              return null
            }

            return (
              <span className="caption">
                {' '}-{' '}
                <a href={proofLink} target="_blank" rel="noreferrer">Proof</a>
              </span>
            )
          })()}
        </li>
      ))}
    </ul>
  )
}

const safeFetchProfiles = async () => {
  try {
    return await fetchIssuedCredentialsIndex()
  } catch {
    return []
  }
}

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

  return []
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
  const commitReferences = buildCommitReferences(
    issued.sourceCommits,
    issued.sources,
    `${credentialForMeta.owner}/${credentialForMeta.slug}`,
  )
  const sourceSummary = buildSourceSummary(commitReferences)
  const summary = buildMetaDescription(
    credentialForMeta,
    issued.issuedAt,
    handle,
    issued.claimId,
    sourceSummary,
  )
  const title = buildMetaTitle(credentialForMeta, handle)
  const metaImage = buildMetaImage(credentialForMeta, handle, sourceSummary)
  const publishedTime = normalizeIssuedDateIso(issued.issuedAt)

  return {
    title,
    description: summary,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'article',
      url: canonical,
      title,
      description: summary,
      images: [
        {
          url: metaImage.url,
          ...(metaImage.width ? { width: metaImage.width } : {}),
          ...(metaImage.height ? { height: metaImage.height } : {}),
          alt: metaImage.alt,
        },
      ],
      ...(publishedTime ? { publishedTime } : {}),
      section: 'Issued Credentials',
      tags: [
        credentialForMeta.owner,
        credentialForMeta.slug,
        handle,
      ].filter(Boolean),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: summary,
      images: [metaImage.url],
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
  const commitReferences = buildCommitReferences(
    issued.sourceCommits,
    issued.sources,
    `${definition.owner}/${definition.slug}`,
  )
  const sourceSummary = buildSourceSummary(commitReferences)
  const jsonLdSummary = buildJsonLdSummary(definition, issuedDate, issued.claimId, handle)
  const imageUrl = resolveCredentialImage(definition)
  const trackCommand = `${TRACK_PREFIX}${definition.owner}/${definition.slug}`
  const credentialPageUrl = `${BASE_URL}${buildCanonical(profile.github, owner, slug)}`
  const linkedInShareMessages = buildLinkedInSuggestions(definition, issued.issuedAt, sourceSummary)

  return (
    <>
      <CredentialJsonLd
        credential={definition}
        canonicalUrl={`${BASE_URL}${buildCanonical(handle, owner, slug)}`}
        summary={jsonLdSummary}
        issued={{
          issuedDate: issued.issuedAt,
          holder: handle,
          claimId: issued.claimId,
          sourceRepo: commitReferences[0]?.repo,
          sourceCommitCount: commitReferences.length,
          sourceSummary,
        }}
      />

      <AppShell
        title={`Credential / ${profile.github}`}
        activePath="/credentials"
        copyClassName="copy--wide copy-skill-detail"
        fullBleed
      >
          <div className="detail-topbar">
            <Link className="btn btn-secondary detail-back-link" href={`/credentials/profiles/github/${profile.github}/`} aria-label="Back to profile">
              ← Back to profile
            </Link>
            <LinkedInShareModal
              credentialPageUrl={credentialPageUrl}
              suggestedMessages={linkedInShareMessages}
              buttonClassName="btn btn-primary detail-share-link btn-linkedin"
              buttonLabel="Share on LinkedIn"
            />
          </div>

         <section className="section skill-detail" aria-label="Issued credential details">
           <div className="detail-summary-layout">
             <div className="detail-summary-column">
               <div
                 className="issued-credential-title-row"
                 style={{
                   display: 'flex',
                   alignItems: 'flex-start',
                   gap: '1rem',
                   flexWrap: 'wrap',
                 }}
               >
                 <div
                   className="detail-image-shell"
                   style={{
                     width: '150px',
                     minWidth: '150px',
                   }}
                 >
                   <CredentialImageFallback
                     src={imageUrl}
                     alt={`${definition.name} credential image`}
                     loading="eager"
                     className="detail-image"
                   />
                 </div>

                  <div>
                    <h1>{definition.name}</h1>
                    <p className="caption">
                      <Link className="tag" href={`/credentials/${definition.owner}/${definition.slug}/`}>
                        {definition.id}
                      </Link>
                      {` issued to `}
                      <Link className="tag" href={`/credentials/profiles/github/${profile.github}/`}>
                        @{profile.github}
                      </Link>
                      {` on ${issuedDate}`}
                    </p>
                  </div>
                </div>

                <section className="detail-summary">
                   <p className="caption">{definition.description || 'No description provided.'}</p>

                  <h2 className="panel-title">Requirements</h2>
                  <CredentialRequirementsRenderer requirements={definition.requirements} />

                  <h2 className="panel-title">Evidence details</h2>
                  <ul className="detail-list detail-list--compact">
                    <li><strong>Referenced commits:</strong> {commitReferences.length}</li>
                  </ul>

                  <p className="panel-title" style={{ marginTop: '1rem' }}>Subject payload</p>
                  <pre className="metadata-json">{stringifySubject(issued.subject)}</pre>

                  <h2 className="panel-title">Source commits</h2>
                  {buildCommitLines(commitReferences)}
                </section>
              </div>

              <div className="detail-action-row">
                <div className="skill-install-card">
                  <p className="label">This credential was earned with Skillcraft</p>
                  <p className="caption">Enable Skillcraft in your repository to track, claim, and verify your next credential.</p>
                  <div className="skill-install-row skill-install-row--stacked">
                    <Link className="btn btn-secondary" href="/docs">
                      View Installation Docs
                    </Link>
                  </div>
                </div>

                <div className="skill-install-card">
                  <p className="label">Track this skill</p>
                  <div className="skill-install-row skill-install-row--stacked">
                    <code className="skill-install-command skill-install-command--detail">{trackCommand}</code>
                    <CopyCommandButton text={trackCommand} className="btn btn-primary" label="Copy Command" />
                  </div>
                </div>

                <section className="panel detail-sidebar-panel">
                  <h2 className="panel-title">Credential Information</h2>
                  <ul className="detail-list detail-list--compact">
                    <li>
                      <strong>Handle:</strong>
                      <Link className="tag" href={`/credentials/profiles/github/${profile.github}/`}>
                        @{profile.github}
                      </Link>
                    </li>
                    <li><strong>Owner:</strong> {definition.owner || owner}</li>
                    <li>
                      <strong>Definition:</strong>
                      <Link className="tag" href={`/credentials/${definition.owner}/${definition.slug}/`}>
                        {definition.id}
                      </Link>
                    </li>
                    <li><strong>Definition path:</strong> {definition.path || 'not provided'}</li>
                    <li><strong>Issued:</strong> {issuedDate}</li>
                    <li><strong>Claim ID:</strong> {issued.claimId || 'not provided'}</li>
                    <li><strong>Source path:</strong> {issued.path || 'not provided'}</li>
                  </ul>
                </section>

            </div>
          </div>
        </section>
      </AppShell>
    </>
  )
}
