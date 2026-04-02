import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import AppShell from '../../../../../components/AppShell'
import IssuedCredentialList from '../../../../../components/credentials/IssuedCredentialList'
import { findIssuedProfile, fetchLiveIssuedCredentialsIndex } from '../../../../../lib/issuedCredentialsIndex'
import { fetchCredentialIndex, type CredentialDefinition } from '../../../../../lib/credentialIndex'

type ProfileParams = {
  handle: string
}

const BASE_URL = 'https://skillcraft.gg'

const buildCanonical = (handle: string) => `/credentials/profiles/github/${handle}/`

const getNoProfilesHandle = () => '__skillcraft-no-profiles__'

const profileDisplay = (handle: string) => `@${handle}`

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
    return await fetchLiveIssuedCredentialsIndex()
  } catch {
    return []
  }
}

export async function generateStaticParams() {
  const issuedProfiles = await safeFetchProfiles()

  if (issuedProfiles.length === 0) {
    return [{
      handle: getNoProfilesHandle(),
    }]
  }

  return issuedProfiles.map((profile) => ({
    handle: profile.github,
  }))
}

export async function generateMetadata({ params }: { params: ProfileParams }) {
  const handle = decodeURIComponent((params.handle || '').toLowerCase())
  const profiles = await safeFetchProfiles()
  const profile = findIssuedProfile(profiles, handle)

  const canonical = `${BASE_URL}${buildCanonical(handle)}`
  const count = profile ? profile.issuedCount : 0

  if (!profile) {
    return {
      title: 'Profile Not Found | Skillcraft',
      description: 'This credential profile could not be found.',
      alternates: {
        canonical,
      },
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const description = `${formatIssuedCount(count)} View all credentials for ${profileDisplay(profile.github)}.`

  return {
    title: `${profileDisplay(profile.github)} Credentials | Skillcraft`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${profileDisplay(profile.github)} Credentials | Skillcraft`,
      description,
      images: [
        {
          url: '/images/og-home.jpg',
          width: 1200,
          height: 630,
          alt: `${profile.github} credential profile`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profileDisplay(profile.github)} Credentials | Skillcraft`,
      description,
      images: ['/images/og-home.jpg'],
    },
  }
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
