import type { MetadataRoute } from 'next'

import { fetchSkillIndex } from '../lib/skillIndex'

const BASE_URL = 'https://skillcraft.gg'

const parseLastModified = (value: string) => {
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return undefined
  }

  return new Date(parsed)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const skills = await fetchSkillIndex()

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/skills`,
      lastModified: new Date(),
      priority: 0.9,
    },
    ...skills.map((skill) => ({
      url: `${BASE_URL}/skills/${skill.owner}/${skill.slug}/`,
      lastModified: parseLastModified(skill.updatedAt) || new Date(),
      priority: 0.8,
    })),
  ]

  return routes
}
