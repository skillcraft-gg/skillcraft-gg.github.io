import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import AppShell from '../../../../../components/AppShell'
import IssuedCredentialList from '../../../../../components/credentials/IssuedCredentialList'
import { findIssuedProfile, fetchIssuedCredentialsIndex } from '../../../../../lib/issuedCredentialsIndex'
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

export async function generateStaticParams() {
  const issuedProfiles = await fetchIssuedCredentialsIndex()

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
  const profiles = await fetchIssuedCredentialsIndex()
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
  const profiles = await fetchIssuedCredentialsIndex()
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
      <section className="section" aria-label="Profile credential context">
        <div className="section-head section-head--skills">
          <div>
            <h1>{profileDisplay(profile.github)}</h1>
            <p>{formatIssuedCount(profile.issuedCount)}</p>
          </div>
          <Link className="btn btn-secondary" href="/credentials/profiles" aria-label="Back to profile list">
            ← Back to profiles
          </Link>
        </div>
      </section>

      <section className="section" aria-label={`Issued credentials for ${profile.github}`}>
        <IssuedCredentialList handle={profile.github} credentials={profile.credentials} definitions={definitionMap} />
      </section>
    </AppShell>
  )
}
