import type { Metadata } from 'next'

const DEFAULT_SOCIAL_IMAGE_URL = '/images/og-home.jpg'

const DEFAULT_OPEN_GRAPH_IMAGE = {
  url: DEFAULT_SOCIAL_IMAGE_URL,
  width: 1200,
  height: 630,
  alt: 'Skillcraft landing preview',
} as const

const hasImages = (images: unknown) => {
  if (Array.isArray(images)) {
    return images.length > 0
  }

  return images !== null && images !== undefined
}

export const withSocialImageDefaults = (metadata: Metadata): Metadata => {
  const openGraph = metadata.openGraph ?? {}
  const twitter = metadata.twitter ?? {}

  return {
    ...metadata,
    openGraph: {
      siteName: 'Skillcraft',
      ...openGraph,
      images: hasImages(openGraph.images) ? openGraph.images : [DEFAULT_OPEN_GRAPH_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      ...twitter,
      images: hasImages(twitter.images) ? twitter.images : [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}
