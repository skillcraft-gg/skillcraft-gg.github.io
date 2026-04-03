import type { Metadata } from 'next'
import type { Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

import RouteMotionGate from '../components/RouteMotionGate'
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
    title: 'Skillcraft: Turn your work into verifiable AI credentials',
    description:
      'Capture what you build, share your progress, and earn verifiable credentials that prove measurable real-world AI engineering work.',
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
    title: 'Skillcraft: Turn your work into verifiable AI credentials',
    description:
      'Capture what you build, share your progress, and earn verifiable credentials that prove measurable real-world AI engineering work.',
    images: ['/images/og-home.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/images/skillcraft-stripes.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#07050d',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetBrains.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/skillcraft-stripes.png" />
      </head>
      <body>
        <RouteMotionGate />
        {children}
      </body>
    </html>
  )
}
