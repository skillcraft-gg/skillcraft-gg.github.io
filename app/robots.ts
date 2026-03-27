import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/loadouts', '/credentials'],
      },
    ],
    sitemap: 'https://skillcraft.gg/sitemap.xml',
  }
}
