import type { Metadata } from 'next'
import './globals.css'

import { SITE_DESCRIPTION } from '../lib/navigation'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: {
    default: 'Skillcraft',
    template: '%s | Skillcraft',
  },
  description: SITE_DESCRIPTION,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
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
