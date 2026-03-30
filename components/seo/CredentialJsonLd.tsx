import type { CredentialDefinition } from '../../lib/credentialIndex'

type CredentialJsonLdProps = {
  credential: CredentialDefinition
  canonicalUrl: string
  summary: string
}

export default function CredentialJsonLd({ credential, canonicalUrl, summary }: CredentialJsonLdProps) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: credential.name,
    headline: credential.name,
    description: summary,
    author: {
      '@type': 'Organization',
      name: credential.owner,
    },
    creator: {
      '@type': 'Organization',
      name: credential.owner,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Skillcraft',
    },
    identifier: credential.id,
    dateModified: credential.updatedAt || undefined,
    url: canonicalUrl,
    inLanguage: 'en',
    isPartOf: {
      '@type': 'Collection',
      name: 'Skillcraft Credentials Registry',
    },
  }

  const json = JSON.stringify(payload).replace(/</g, '\\u003c')

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
