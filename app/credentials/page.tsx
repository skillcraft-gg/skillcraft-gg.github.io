import type { Metadata } from 'next'
import { Suspense } from 'react'

import AppShell from '../../components/AppShell'
import CredentialsList from '../../components/credentials/CredentialsList'
import { collectCredentialOwners, fetchCredentialIndex, sortByUpdatedDesc } from '../../lib/credentialIndex'

const PAGE_CANONICAL = 'https://skillcraft.gg/credentials'

export const metadata: Metadata = {
  title: 'Credentials Registry | Skillcraft',
  description:
    'Browse and explore the Skillcraft credential registry by owner and summary. Compare definition requirements, source paths, and discover how to verify capability claims.',
  alternates: {
    canonical: PAGE_CANONICAL,
  },
  openGraph: {
    type: 'website',
    url: PAGE_CANONICAL,
    title: 'Credentials Registry | Skillcraft',
    description:
      'Browse and explore the Skillcraft credential registry by owner and summary. Compare definition requirements, source paths, and discover how to verify capability claims.',
    images: [
      {
        url: '/images/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'Credential registry overview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Credentials Registry | Skillcraft',
    description:
      'Browse and explore the Skillcraft credential registry by owner and summary. Compare definition requirements, source paths, and discover how to verify capability claims.',
    images: ['/images/og-home.jpg'],
  },
}

export default async function CredentialsPage() {
  const credentials = sortByUpdatedDesc(await fetchCredentialIndex())
  const owners = collectCredentialOwners(credentials)

  return (
    <AppShell
      title="Credentials"
      activePath="/credentials"
      copyClassName="copy--wide copy-skills-list"
      fullBleed
    >
      <Suspense>
        <CredentialsList credentials={credentials} owners={owners} />
      </Suspense>
    </AppShell>
  )
}
