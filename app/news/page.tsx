import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { getAllNewsPosts } from '../../lib/newsPosts'

const BASE_URL = 'https://skillcraft.gg'
const PAGE_CANONICAL = `${BASE_URL}/news`

export const metadata: Metadata = {
  title: 'News | Skillcraft',
  description:
    'Read the latest Skillcraft announcements, guidance, and product updates, focused on verifiable AI development and trust through evidence.',
  alternates: {
    canonical: PAGE_CANONICAL,
  },
  openGraph: {
    type: 'website',
    url: PAGE_CANONICAL,
    title: 'News | Skillcraft',
    description:
      'Read the latest Skillcraft announcements, guidance, and product updates, focused on verifiable AI development and trust through evidence.',
    images: [
      {
        url: '/images/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'Skillcraft News',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'News | Skillcraft',
    description:
      'Read the latest Skillcraft announcements, guidance, and product updates, focused on verifiable AI development and trust through evidence.',
    images: ['/images/og-home.jpg'],
  },
}

export default async function NewsIndexPage() {
  const posts = await getAllNewsPosts()
  const launchPost = posts[0]

  if (launchPost) {
    redirect(`/news/${launchPost.slug}/`)
  }

  notFound()
}
