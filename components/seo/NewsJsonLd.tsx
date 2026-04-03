import type { NewsPost } from '../../lib/newsPosts'

type NewsJsonLdProps = {
  post: NewsPost
  canonicalUrl: string
}

export default function NewsJsonLd({ post, canonicalUrl }: NewsJsonLdProps) {
  const payload: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: canonicalUrl,
    datePublished: post.date,
    dateModified: post.updatedAt || post.date,
    inLanguage: 'en',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Skillcraft',
    },
    image: post.heroImage || '/images/og-home.jpg',
  }

  if (post.tags.length > 0) {
    payload.keywords = post.tags.join(', ')
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
