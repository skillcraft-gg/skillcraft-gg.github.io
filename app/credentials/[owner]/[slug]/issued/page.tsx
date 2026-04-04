import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import AppShell from '../../../../../components/AppShell'
import {
  findCredentialByPath,
  fetchCredentialIndex,
} from '../../../../../lib/credentialIndex'
import {
  findIssuedProfilesForCredential,
  fetchIssuedCredentialsIndex,
} from '../../../../../lib/issuedCredentialsIndex'

type CredentialIssuedUsersParams = {
  owner: string
  slug: string
}

const BASE_URL = 'https://skillcraft.gg'

const buildCanonical = (owner: string, slug: string) => `/credentials/${owner}/${slug}/issued/`

const buildCredentialBackUrl = (owner: string, slug: string) => `/credentials/${owner}/${slug}/`

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

const formatIssuedCount = (count: number) => {
  if (count === 0) {
    return 'No users have been issued this credential yet.'
  }

  if (count === 1) {
    return '1 user has been issued this credential.'
  }

  return `${count} users have been issued this credential.`
}

const safeFetchIssuedProfiles = async () => {
  try {
    return await fetchIssuedCredentialsIndex()
  } catch {
    return []
  }
}

export async function generateStaticParams(): Promise<CredentialIssuedUsersParams[]> {
  const credentials = await fetchCredentialIndex()

  return credentials.map((credential) => ({
    owner: credential.owner,
    slug: credential.slug,
  }))
}

export async function generateMetadata({ params }: { params: CredentialIssuedUsersParams }): Promise<Metadata> {
  const owner = decodeURIComponent((params.owner || '').toLowerCase())
  const slug = decodeURIComponent((params.slug || '').toLowerCase())

  const credentials = await fetchCredentialIndex()
  const selected = findCredentialByPath(credentials, owner, slug)
  const canonical = `${BASE_URL}${buildCanonical(owner, slug)}`

  if (!selected) {
    return {
      title: 'Issued Credential List Not Found | Skillcraft',
      description: 'This issued credential list could not be found.',
      alternates: {
        canonical,
      },
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const issuedProfiles = await safeFetchIssuedProfiles()
  const issuedUsers = findIssuedProfilesForCredential(issuedProfiles, selected.owner, selected.slug)

  const description = `${formatIssuedCount(issuedUsers.length)} View the complete issue list for ${selected.name}.`

  return {
    title: `${selected.name} issuers | Skillcraft`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${selected.name} issuers | Skillcraft`,
      description,
      images: [
        {
          url: '/images/og-home.jpg',
          width: 1200,
          height: 630,
          alt: `${selected.name} issued users`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${selected.name} issuers | Skillcraft`,
      description,
      images: ['/images/og-home.jpg'],
    },
  }
}

export default async function CredentialIssuedUsersPage({ params }: { params: CredentialIssuedUsersParams }) {
  const owner = decodeURIComponent((params.owner || '').toLowerCase())
  const slug = decodeURIComponent((params.slug || '').toLowerCase())

  const credentials = await fetchCredentialIndex()
  const selected = findCredentialByPath(credentials, owner, slug)

  if (!selected) {
    notFound()
  }

  const issuedProfiles = await safeFetchIssuedProfiles()
  const issuedUsers = findIssuedProfilesForCredential(issuedProfiles, selected.owner, selected.slug)

  return (
    <AppShell
      title={`Credentials / ${selected.owner}`}
      activePath="/credentials"
      copyClassName="copy--wide copy-skill-list"
      fullBleed
    >
      <Link className="btn btn-secondary detail-back-link" href={buildCredentialBackUrl(selected.owner, selected.slug)} aria-label="Back to credential detail">
        ← Back to credential
      </Link>

      <section className="section" aria-label="Credential issued users header">
        <div className="section-head section-head--skills">
          <div>
            <h1>{selected.name}</h1>
            <p>{formatIssuedCount(issuedUsers.length)}</p>
          </div>
        </div>
      </section>

      <section className="section" aria-label={`Users issued ${selected.name}`}>
        {issuedUsers.length === 0 ? (
          <p className="caption">No issued users were found for this credential.</p>
        ) : (
          <div className="item-grid item-grid--credentials">
            {issuedUsers.map(({ profile, issuedCredential }) => {
              const profilePath = `/credentials/profiles/github/${profile.github}/`
              const issuedCredentialPath = `/credentials/profiles/github/${profile.github}/${selected.owner}/${selected.slug}/`
              const issuedAt = formatIssuedDate(issuedCredential.issuedAt)

              return (
                <article key={`${profile.github}-${issuedCredential.claimId || issuedCredential.definition}`} className="skill-card credential-card">
                  <Link href={issuedCredentialPath} className="credential-card-primary-link credential-card-body">
                    <div className="credential-card-body-top">
                      <p className="label">Credential holder</p>
                      <h3>@{profile.github}</h3>
                      <p className="caption">Issued credential: {selected.name}</p>
                      <p className="skill-meta-text">Issued {issuedAt}</p>
                      {issuedCredential.claimId ? <p className="skill-meta-text">Claim ID: {issuedCredential.claimId}</p> : null}
                    </div>
                  </Link>
                  <div className="credential-card-actions skill-install-row" role="group" aria-label="Issued credential actions">
                    <Link className="btn btn-secondary credential-card-button" href={profilePath}>View Profile</Link>
                    <Link className="btn btn-secondary credential-card-button" href={issuedCredentialPath}>View Credential</Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </AppShell>
  )
}
