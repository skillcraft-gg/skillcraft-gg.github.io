import type { SkillRecord } from '../../lib/skillIndex'

type SkillJsonLdProps = {
  skill: SkillRecord
  canonicalUrl: string
  summary: string
}

export default function SkillJsonLd({ skill, canonicalUrl, summary }: SkillJsonLdProps) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: skill.name,
    headline: skill.name,
    description: summary,
    author: {
      '@type': 'Organization',
      name: skill.owner,
    },
    creator: {
      '@type': 'Organization',
      name: skill.owner,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Skillcraft',
    },
    identifier: skill.id,
    keywords: skill.tags.join(', '),
    dateModified: skill.updatedAt || undefined,
    url: canonicalUrl,
    inLanguage: 'en',
    isPartOf: {
      '@type': 'Collection',
      name: 'Skillcraft Skills Registry',
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
