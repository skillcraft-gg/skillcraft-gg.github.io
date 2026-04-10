import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import AppShell from '../../../../../components/AppShell'
import IssuedCredentialList from '../../../../../components/credentials/IssuedCredentialList'
import {
  resolveCredentialImage,
  CREDENTIAL_IMAGE_PLACEHOLDER,
} from '../../../../../components/credentials/credentialImageResolver'
import { findIssuedProfile, fetchIssuedCredentialsIndex } from '../../../../../lib/issuedCredentialsIndex'
import { fetchCredentialIndex, type CredentialDefinition } from '../../../../../lib/credentialIndex'
import { withSocialImageDefaults } from '../../../../../lib/metadata'

type ProfileParams = {
  handle: string
}

const BASE_URL = 'https://skillcraft.gg'
const SOCIAL_IMAGE_FALLBACK = '/images/og-home.jpg'
const SOCIAL_IMAGE_FALLBACK_WIDTH = 1200
const SOCIAL_IMAGE_FALLBACK_HEIGHT = 630
const SEO_DESCRIPTION_TARGET = 155

const buildCanonical = (handle: string) => `/credentials/profiles/github/${handle}/`

const profileDisplay = (handle: string) => `@${handle}`

const formatIssuedDate = (value: string) => {
  if (!value) {
    return 'Unknown date'
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

const normalizeMetaText = (value: string, fallback: string) => {
  const normalized = (value || '').trim()
  return normalized || fallback
}

const buildIssuedCountPhrase = (issuedCount: number) => {
  if (issuedCount <= 0) {
    return 'no recorded credentials'
  }

  if (issuedCount === 1) {
    return '1 credential'
  }

  return `${issuedCount} credentials`
}

const buildProfileIssuedCountPhrase = (issuedCount: number) => {
  if (issuedCount <= 0) {
    return 'no issued credentials'
  }

  if (issuedCount === 1) {
    return '1 issued credential'
  }

  return `${issuedCount} issued credentials`
}

const buildProfileMetaTitle = (handle: string, issuedCount: number) => {
  const issuedCountText = buildProfileIssuedCountPhrase(issuedCount)
  return `${handle} has ${issuedCountText} | Prove your AI skills at Skillcraft.gg`
}

const getMostRecentCredentialName = (definitionMap: Record<string, CredentialDefinition>, definition: string, owner: string, slug: string) => {
  const mappedDefinition = definitionMap[definition] || definitionMap[`${owner}/${slug}`]

  return mappedDefinition?.name || definition || `${owner}/${slug}`
}

const buildLatestProfileCredentialSummary = (
  definitionMap: Record<string, CredentialDefinition>,
  definition: string,
  owner: string,
  slug: string,
  issuedAt: string,
  claimId: string,
  sourceCommits: string[],
) => {
  const name = getMostRecentCredentialName(definitionMap, definition, owner, slug)
  const issued = formatIssuedDate(issuedAt)
  const claim = claimId ? ` Claim ${claimId}.` : ''
  const commitCount = sourceCommits.length
  const commitText = commitCount > 0
    ? ` ${commitCount} source commit${commitCount === 1 ? '' : 's'} referenced.`
    : ''

  return `${name} was issued on ${issued}.${claim}${commitText}`
}

const buildMetaDescription = (
  handle: string,
  issuedCount: number,
  latest: string,
) => {
  const profile = profileDisplay(handle)
  const issuedCountText = buildIssuedCountPhrase(issuedCount)
  const base = `${profile} has earned ${issuedCountText}.`
  if (!latest) {
    return normalizeMetaText(base, base)
  }

  const summary = `${base} Latest: ${latest}`
  if (summary.length <= SEO_DESCRIPTION_TARGET) {
    return summary
  }

  const compact = `${base} Latest: ${latest.slice(0, 90)}`
  return compact.length <= SEO_DESCRIPTION_TARGET ? compact : compact.slice(0, SEO_DESCRIPTION_TARGET)
}

const buildProfileMetaImage = (
  handle: string,
  definitionMap: Record<string, CredentialDefinition>,
  definition?: string,
  owner?: string,
  slug?: string,
) => {
  const selectedDefinition = definition && owner && slug
    ? definitionMap[definition] || definitionMap[`${owner}/${slug}`]
    : null

  const resolved = selectedDefinition ? resolveCredentialImage(selectedDefinition) : ''

  if (resolved && resolved !== CREDENTIAL_IMAGE_PLACEHOLDER) {
    return {
      url: resolved,
      alt: `${handle} latest issued credential`
    }
  }

  return {
    url: `https://github.com/${handle}.png?size=500`,
    alt: `${handle} GitHub avatar`,
    width: 500,
    height: 500,
  }
}

const buildFallbackProfileMetaImage = () => ({
  url: SOCIAL_IMAGE_FALLBACK,
  width: SOCIAL_IMAGE_FALLBACK_WIDTH,
  height: SOCIAL_IMAGE_FALLBACK_HEIGHT,
  alt: 'Skillcraft credential profile',
})

const formatIssuedCount = (issuedCount: number) => {
  if (issuedCount <= 0) {
    return 'No credential issuances recorded.'
  }

  if (issuedCount === 1) {
    return '1 credential recorded.'
  }

  return `${issuedCount} credentials recorded.`
}

const safeFetchProfiles = async () => {
  try {
    return await fetchIssuedCredentialsIndex()
  } catch {
    return []
  }
}

export async function generateStaticParams() {
  const issuedProfiles = await safeFetchProfiles()
  return issuedProfiles.map((profile) => ({
    handle: profile.github,
  }))
}

export async function generateMetadata({ params }: { params: ProfileParams }) {
  const handle = decodeURIComponent((params.handle || '').toLowerCase())
  const profiles = await safeFetchProfiles()
  const profile = findIssuedProfile(profiles, handle)
  const credentials = await fetchCredentialIndex()
  const definitionMap = buildCredentialDefinitionMap(credentials)

  const canonical = `${BASE_URL}${buildCanonical(handle)}`
  const count = profile ? profile.issuedCount : 0

  if (!profile) {
    return withSocialImageDefaults({
      title: 'Profile Not Found | Skillcraft',
      description: 'This credential profile could not be found.',
      alternates: {
        canonical,
      },
      robots: {
        index: false,
        follow: false,
      },
    })
  }

  const [latest] = profile.credentials
    const latestSummary = latest
    ? buildLatestProfileCredentialSummary(
      definitionMap,
      latest.definition,
      latest.definitionOwner,
      latest.definitionSlug,
      latest.issuedAt,
      latest.claimId,
      latest.sourceCommits,
    )
    : ''

   const description = buildMetaDescription(profile.github, count, latestSummary)
   const title = buildProfileMetaTitle(profile.github, count)
   const metaImage = latest
     ? buildProfileMetaImage(
       profile.github,
       definitionMap,
       latest.definition,
      latest.definitionOwner,
      latest.definitionSlug,
    )
    : null
  const profileImage = metaImage || buildFallbackProfileMetaImage()
   const latestCredentialName = latest
     ? getMostRecentCredentialName(definitionMap, latest.definition, latest.definitionOwner, latest.definitionSlug)
     : ''

    return withSocialImageDefaults({
      title: {
        absolute: title,
      },
      description,
     alternates: {
       canonical,
     },
      openGraph: {
        type: 'website',
        url: canonical,
        title,
        description,
        images: [
          {
            url: profileImage.url,
            ...(profileImage.width ? { width: profileImage.width } : {}),
            ...(profileImage.height ? { height: profileImage.height } : {}),
          alt: profileImage.alt,
        },
      ],
     },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [profileImage.url],
      },
    })
  }

const buildCredentialDefinitionMap = (definitions: CredentialDefinition[]) => {
  return definitions.reduce<Record<string, CredentialDefinition>>((accumulator, definition) => {
    accumulator[definition.id] = definition
    accumulator[`${definition.owner}/${definition.slug}`] = definition

    return accumulator
  }, {})
}

export default async function CredentialProfilePage({ params }: { params: ProfileParams }) {
  const handle = decodeURIComponent((params.handle || '').toLowerCase())
  const profiles = await safeFetchProfiles()
  const profile = findIssuedProfile(profiles, handle)
  const definitions = await fetchCredentialIndex()
  const definitionMap = buildCredentialDefinitionMap(definitions)

  if (!profile) {
    notFound()
  }

  return (
    <AppShell
      title={`Credentials / ${profileDisplay(profile.github)}`}
      activePath="/credentials"
      copyClassName="copy--wide copy-skill-detail"
      fullBleed
    >
      <section className="section profile-credential-header" aria-label="Profile credential context">
        <div className="section-head section-head--skills">
          <div className="profile-header-row">
            <img
              className="profile-page-avatar"
              src={`https://github.com/${profile.github}.png?size=120`}
              alt={`${profile.github} avatar`}
              loading="lazy"
            />
            <div className="profile-header-meta">
              <h1>{profileDisplay(profile.github)}</h1>
              <p>{formatIssuedCount(profile.issuedCount)}</p>
            </div>
          </div>
          <a
            className="btn btn-secondary profile-github-link"
            href={`https://github.com/${profile.github}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`View ${profile.github} on GitHub`}
          >
            <span className="btn-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.387 7.86 10.91.574.105.783-.25.783-.555 0-.273-.01-1.12-.016-2.02-3.197.695-3.873-1.54-3.873-1.54-.522-1.327-1.275-1.68-1.275-1.68-1.044-.714.08-.7.08-.7 1.155.081 1.763 1.187 1.763 1.187 1.026 1.757 2.692 1.25 3.35.955.104-.742.4-1.251.726-1.539-2.553-.29-5.237-1.276-5.237-5.678 0-1.255.45-2.281 1.186-3.084-.119-.29-.513-1.462.112-3.047 0 0 .968-.31 3.173 1.178a11.04 11.04 0 0 1 2.89-.387c.98.005 1.965.132 2.89.387 2.204-1.488 3.17-1.178 3.17-1.178.627 1.585.233 2.757.114 3.047.738.803 1.185 1.83 1.185 3.084 0 4.412-2.687 5.385-5.249 5.67.41.353.775 1.05.775 2.116 0 1.529-.014 2.762-.014 3.138 0 .307.206.666.79.553C20.713 21.38 24 17.08 24 12 24 5.65 18.85.5 12 .5Z" />
              </svg>
            </span>
            View on GitHub
          </a>
        </div>
      </section>

      <section className="section" aria-label={`Issued credentials for ${profile.github}`}>
        <IssuedCredentialList handle={profile.github} credentials={profile.credentials} definitions={definitionMap} />
      </section>
    </AppShell>
  )
}
