import type { Metadata } from 'next'
import type { Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

import { SITE_DESCRIPTION } from '../lib/navigation'
import type { ReactNode } from 'react'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetBrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

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
        url: '/images/og-home.jpg',
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
    images: ['/images/og-home.jpg'],
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
    <html lang="en" className={`${inter.variable} ${jetBrains.variable}`}>
      <head>
        <link rel="icon" href="/images/skillcraft-icon-zoom.png" />
        <link rel="shortcut icon" href="/images/skillcraft-icon-zoom.png" />
        <link rel="apple-touch-icon" href="/images/skillcraft-icon-zoom.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
