import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import AppShell from '../../../../../../../components/AppShell'
import CredentialImageFallback from '../../../../../../../components/credentials/CredentialImageFallback'
import CredentialRequirementsRenderer from '../../../../../../../components/credentials/CredentialRequirementsRenderer'
import VerifyCredentialModal from '../../../../../../../components/credentials/VerifyCredentialModal'
import CredentialJsonLd from '../../../../../../../components/seo/CredentialJsonLd'
import CopyCommandButton from '../../../../../../../components/skills/CopyCommandButton'
import LinkedInShareModal from '../../../../../../../components/credentials/LinkedInShareModal'
import {
  resolveCredentialImage,
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

const formatIssuedMonth = (value: string) => {
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return 'Unknown'
  }

  return new Date(parsed).toLocaleDateString('en-US', {
    month: 'long',
  })
}

const formatIssuedYear = (value: string) => {
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return 'Unknown'
  }

  return new Date(parsed).toLocaleDateString('en-US', {
    year: 'numeric',
  })
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
  sourceSummary: string,
) => {
  const holder = formatHandleLabel(handle)
  const issued = formatIssuedDate(issuedAt)
  const candidate = sourceSummary
    ? `See how ${holder} earned the ${definition.name} credential on Skillcraft with verified GitHub evidence. ${sourceSummary}`
    : `See how ${holder} earned the ${definition.name} credential on Skillcraft with verified GitHub evidence and a public verification trail.`

  if (candidate.length <= SEO_DESCRIPTION_TARGET) {
    return candidate
  }

  const fallback = `See how ${holder} earned the ${definition.name} credential on Skillcraft. Issued ${issued} with public verification details.`
  if (fallback.length <= SEO_DESCRIPTION_TARGET) {
    return fallback
  }

  return fallback.slice(0, SEO_DESCRIPTION_TARGET)
}

const buildMetaTitle = (definition: CredentialDefinition, handle: string) => {
  const holder = formatHandleLabel(handle)
  return `${definition.name} earned by ${holder}`
}

const buildSocialTitle = (definition: CredentialDefinition, handle: string) => {
  const holder = formatHandleLabel(handle)
  return `${holder} earned ${definition.name} | Verified on Skillcraft`
}

const buildMetaImageAlt = (definition: CredentialDefinition, handle: string, sourceSummary: string) => {
  const holder = formatHandleLabel(handle)
  return {
    alt: sourceSummary
      ? `${holder} earned the ${definition.name} credential on Skillcraft with verified GitHub evidence. ${sourceSummary}`
      : `${holder} earned the ${definition.name} credential on Skillcraft. View the public verification trail.`,
  }
}

const buildLinkedInSuggestions = (
  definition: CredentialDefinition,
  issuedDate: string,
  sourceSummary: string,
) => {
  const issuedDateLabel = formatIssuedDate(issuedDate)

  return [
    `I earned the ${definition.name} credential on Skillcraft with verified GitHub evidence.`,
    `I just earned ${definition.name} on Skillcraft. ${sourceSummary}`,
    `I earned the ${definition.name} credential on Skillcraft. View the public verification trail from ${issuedDateLabel}.`,
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

const buildCommitHref = ({ commit, repo }: CommitReference) => {
  const normalizedCommit = normalizeCommitReference(commit)
  if (!normalizedCommit) {
    return ''
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

  return ''
}

const buildProofHref = ({ commit, repo }: CommitReference) => {
  if (!repo) {
    return ''
  }

  const normalizedCommit = normalizeCommitReference(commit)
  if (!normalizedCommit) {
    return ''
  }

  return `https://github.com/${repo}/search?q=${encodeURIComponent(`${normalizedCommit} path:proofs`)}&type=code`
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
    sourceSummary,
  )
  const title = buildMetaTitle(credentialForMeta, handle)
  const socialTitle = buildSocialTitle(credentialForMeta, handle)
  const metaImage = buildMetaImageAlt(credentialForMeta, handle, sourceSummary)
  const metaImageUrl = `${canonical}opengraph-image.jpg`
  const publishedTime = normalizeIssuedDateIso(issued.issuedAt)

  return {
    title,
    description: summary,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'article',
      siteName: 'Skillcraft',
      url: canonical,
      title: socialTitle,
      description: summary,
      images: [
        {
          url: metaImageUrl,
          width: SOCIAL_IMAGE_FALLBACK_WIDTH,
          height: SOCIAL_IMAGE_FALLBACK_HEIGHT,
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
      title: socialTitle,
      description: summary,
      images: [
        {
          url: metaImageUrl,
          alt: metaImage.alt,
        },
      ],
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
  const issueMonth = formatIssuedMonth(issued.issuedAt)
  const issueYear = formatIssuedYear(issued.issuedAt)
  const verificationCommits = commitReferences.map((entry) => ({
    commit: entry.commit,
    repo: entry.repo || '',
    commitUrl: buildCommitHref(entry),
    proofUrl: buildProofHref(entry),
  }))

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

                   <div className="issued-credential-title-copy">
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
                    <section className="issued-credential-fields" aria-label="LinkedIn credential fields">
                      <div className="issued-credential-field-grid">
                        <article className="issued-credential-field-card">
                          <p className="issued-credential-field-label">Credential Name</p>
                          <div>
                            <Link className="tag" href={`/credentials/${definition.owner}/${definition.slug}/`}>
                              {definition.id}
                            </Link>
                          </div>
                        </article>

                        <article className="issued-credential-field-card">
                          <p className="issued-credential-field-label">Issuing organization</p>
                          <div>
                            <a className="tag" href="https://www.linkedin.com/company/skillcraft-gg/" target="_blank" rel="noreferrer">
                              Skillcraft
                              <span className="tag-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" focusable="false" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M14 5H19V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M10 14L19 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M19 14V18C19 18.5304 18.7893 19.0391 18.4142 19.4142C18.0391 19.7893 17.5304 20 17 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18V7C4 6.46957 4.21071 5.96086 4.58579 5.58579C4.96086 5.21071 5.46957 5 6 5H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                            </a>
                          </div>
                        </article>

                       <article className="issued-credential-field-card">
                         <p className="issued-credential-field-label">Issue date</p>
                         <div className="issued-credential-date-grid">
                           <div className="issued-credential-date-cell">
                             <p className="issued-credential-date-label">Month</p>
                             <p className="issued-credential-field-value">{issueMonth}</p>
                           </div>
                           <div className="issued-credential-date-cell">
                             <p className="issued-credential-date-label">Year</p>
                             <p className="issued-credential-field-value">{issueYear}</p>
                           </div>
                         </div>
                       </article>

                        <article className="issued-credential-field-card">
                          <p className="issued-credential-field-label">Expiration date</p>
                          <p className="issued-credential-field-value">Does not expire</p>
                        </article>

                        <article className="issued-credential-field-card">
                          <p className="issued-credential-field-label">Credential ID</p>
                          <p className="issued-credential-field-value">{issued.claimId || 'Not provided'}</p>
                        </article>

                        <article className="issued-credential-field-card">
                          <p className="issued-credential-field-label">Issued To</p>
                          <div>
                            <Link className="tag" href={`/credentials/profiles/github/${profile.github}/`}>
                              @{profile.github}
                            </Link>
                          </div>
                        </article>

                        <article className="issued-credential-field-card issued-credential-field-card--wide">
                          <p className="issued-credential-field-label">Credential URL</p>
                         <a className="issued-credential-field-link" href={credentialPageUrl} target="_blank" rel="noreferrer">
                           {credentialPageUrl}
                         </a>
                       </article>
                     </div>

                    </section>

                    <section className="panel issued-credential-about" aria-label="About this credential">
                      <h2 className="panel-title">About this credential</h2>
                      <p className="caption">{definition.description || 'No description provided.'}</p>

                      <h3 className="panel-title">Requirements</h3>
                      <CredentialRequirementsRenderer requirements={definition.requirements} />

                      <div>
                        <Link className="btn btn-secondary" href={`/credentials/${definition.owner}/${definition.slug}/`}>
                          View Credential
                        </Link>
                      </div>
                    </section>

                  </section>
                </div>

              <div className="detail-action-row">
                <div className="skill-install-card">
                  <p className="label">This credential was issued by Skillcraft</p>
                  <p className="caption">Skillcraft works with your favourite AI coding agents like OpenCode to turn git commits from real projects into verifiable evidence.</p>
                  <div className="skill-install-row skill-install-row--stacked">
                    <VerifyCredentialModal
                      buttonClassName="btn btn-secondary"
                      buttonLabel="Verify Credential"
                      openQueryParam="verify"
                      credentialName={definition.name}
                      credentialDefinitionId={definition.id}
                      holderHandle={profile.github}
                      issuedDate={issuedDate}
                      claimId={issued.claimId}
                      sourceSummary={sourceSummary}
                      credentialUrl={credentialPageUrl}
                      requirements={definition.requirements}
                      commitReferences={verificationCommits}
                    />
                    <Link className="btn btn-primary btn-flat" href="/docs/tutorials/first-credential">
                      Earn Your First Credential
                    </Link>
                    <LinkedInShareModal
                      credentialPageUrl={credentialPageUrl}
                      suggestedMessages={linkedInShareMessages}
                      buttonClassName="btn btn-primary btn-linkedin"
                      buttonLabel="Share on LinkedIn"
                      openQueryParam="share"
                    />
                  </div>
                </div>

                <div className="skill-install-card">
                  <p className="label">Track this credential</p>
                  <p className="caption">You can track your progress to earn this credential too.</p>
                  <div className="skill-install-row skill-install-row--stacked">
                    <code className="skill-install-command skill-install-command--detail">{trackCommand}</code>
                    <CopyCommandButton text={trackCommand} className="btn btn-primary" label="Copy Command" />
                  </div>
                </div>

              </div>
            </div>
          </section>
      </AppShell>
    </>
  )
}
