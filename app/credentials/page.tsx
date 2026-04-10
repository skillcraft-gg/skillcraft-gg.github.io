import type { Metadata } from 'next'
import { Suspense } from 'react'

import AppShell from '../../components/AppShell'
import CredentialsList from '../../components/credentials/CredentialsList'
import { collectCredentialOwners, fetchCredentialIndex, sortByUpdatedDesc } from '../../lib/credentialIndex'
import { withSocialImageDefaults } from '../../lib/metadata'

const PAGE_CANONICAL = 'https://skillcraft.gg/credentials'
const PINNED_CREDENTIAL_ID = 'skillcraft-gg/hello-world'

export const metadata: Metadata = withSocialImageDefaults({
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
})

export default async function CredentialsPage() {
  const credentials = sortByUpdatedDesc(await fetchCredentialIndex()).sort((left, right) => {
    if (left.id === PINNED_CREDENTIAL_ID) {
      return -1
    }

    if (right.id === PINNED_CREDENTIAL_ID) {
      return 1
    }

    return 0
  })
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
