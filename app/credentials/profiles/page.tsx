import type { Metadata } from 'next'
import Link from 'next/link'

import AppShell from '../../../components/AppShell'
import CredentialProfilesList from '../../../components/credentials/CredentialProfilesList'
import { fetchIssuedCredentialsIndex } from '../../../lib/issuedCredentialsIndex'
import { withSocialImageDefaults } from '../../../lib/metadata'

const PAGE_CANONICAL = 'https://skillcraft.gg/credentials/profiles'

export const metadata: Metadata = withSocialImageDefaults({
  title: 'Credential Profiles | Skillcraft',
  description:
    'Browse verified Skillcraft contributors and discover which credentials each GitHub profile has earned from commit-based verification.',
  alternates: {
    canonical: PAGE_CANONICAL,
  },
  openGraph: {
    type: 'website',
    url: PAGE_CANONICAL,
    title: 'Credential Profiles | Skillcraft',
    description:
      'Browse verified Skillcraft contributors and discover which credentials each GitHub profile has earned from commit-based verification.',
    images: [
      {
        url: '/images/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'Credential profiles',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Credential Profiles | Skillcraft',
    description:
      'Browse verified Skillcraft contributors and discover which credentials each GitHub profile has earned from commit-based verification.',
    images: ['/images/og-home.jpg'],
  },
})

export default async function CredentialProfilesPage() {
  const profiles = await fetchIssuedCredentialsIndex()

  return (
    <AppShell
      title="Credential Profiles"
      activePath="/credentials"
      copyClassName="copy--wide copy-skill-list"
      fullBleed
    >
      <section className="section" aria-label="Credential profiles directory header">
        <div className="section-head section-head--skills">
          <div>
            <h1>Credential Profiles</h1>
            <p>Profiles are grouped by GitHub handle and list every credential they have earned.</p>
          </div>
          <Link className="btn btn-secondary" href="/credentials" aria-label="Back to credential index">
            ← Back to Credentials
          </Link>
        </div>
      </section>

      <CredentialProfilesList profiles={profiles} />
    </AppShell>
  )
}
