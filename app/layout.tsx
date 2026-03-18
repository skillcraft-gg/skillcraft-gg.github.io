import type { Metadata } from 'next'
import type { Viewport } from 'next'
import './globals.css'

import { SITE_DESCRIPTION } from '../lib/navigation'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  metadataBase: new URL('https://skillcraft.gg'),
  title: {
    default: 'Skillcraft',
    template: '%s | Skillcraft',
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'Skillcraft',
    title: 'Skillcraft',
    description: SITE_DESCRIPTION,
    url: 'https://skillcraft.gg',
    images: [
      {
        url: '/images/og-home.png',
        width: 1200,
        height: 630,
        alt: 'Skillcraft landing preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skillcraft',
    description: SITE_DESCRIPTION,
    images: ['/images/og-home.png'],
  },
  icons: {
    icon: '/images/skillcraft-icon-zoom.png',
    shortcut: '/images/skillcraft-icon-zoom.png',
    apple: '/images/skillcraft-icon-zoom.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#07050d',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/skillcraft-icon-zoom.png" />
        <link rel="shortcut icon" href="/images/skillcraft-icon-zoom.png" />
        <link rel="apple-touch-icon" href="/images/skillcraft-icon-zoom.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
