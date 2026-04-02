import type { CredentialDefinition } from '../../lib/credentialIndex'

type CredentialJsonLdProps = {
  credential: CredentialDefinition
  canonicalUrl: string
  summary: string
  issued?: {
    issuedDate?: string
    holder?: string
    claimId?: string
    sourceRepo?: string
    sourceCommitCount?: number
    sourceSummary?: string
  }
}

export default function CredentialJsonLd({
  credential,
  canonicalUrl,
  summary,
  issued,
}: CredentialJsonLdProps) {
  const payload: Record<string, unknown> = {
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

  if (issued?.issuedDate) {
    payload.datePublished = issued.issuedDate
  }

  if (issued?.holder) {
    payload.additionalProperty = [
      ...(Array.isArray(payload.additionalProperty) ? payload.additionalProperty : []),
      {
        '@type': 'PropertyValue',
        name: 'holder',
        value: `@${issued.holder.replace(/^@/, '')}`,
      },
    ]
  }

  if (issued?.claimId) {
    payload.identifier = [credential.id, issued.claimId]
    payload.additionalProperty = [
      ...(Array.isArray(payload.additionalProperty) ? payload.additionalProperty : []),
      {
        '@type': 'PropertyValue',
        name: 'claimId',
        value: issued.claimId,
      },
    ]
  }

  if (issued?.sourceRepo) {
    payload.additionalProperty = [
      ...(Array.isArray(payload.additionalProperty) ? payload.additionalProperty : []),
      {
        '@type': 'PropertyValue',
        name: 'sourceRepo',
        value: issued.sourceRepo,
      },
    ]
  }

  if (issued?.sourceCommitCount !== undefined) {
    payload.additionalProperty = [
      ...(Array.isArray(payload.additionalProperty) ? payload.additionalProperty : []),
      {
        '@type': 'PropertyValue',
        name: 'sourceCommitCount',
        value: issued.sourceCommitCount,
      },
    ]
  }

  if (issued?.sourceSummary) {
    payload.additionalProperty = [
      ...(Array.isArray(payload.additionalProperty) ? payload.additionalProperty : []),
      {
        '@type': 'PropertyValue',
        name: 'sourceSummary',
        value: issued.sourceSummary,
      },
    ]
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
