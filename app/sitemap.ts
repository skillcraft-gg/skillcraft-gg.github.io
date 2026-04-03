import type { MetadataRoute } from 'next'

import { fetchSkillIndex } from '../lib/skillIndex'
import { fetchCredentialIndex } from '../lib/credentialIndex'
import { fetchIssuedCredentialsIndex } from '../lib/issuedCredentialsIndex'
import { getAllNewsPosts } from '../lib/newsPosts'

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
  const credentials = await fetchCredentialIndex()
  const issuedProfiles = await fetchIssuedCredentialsIndex()
  const newsPosts = await getAllNewsPosts()

  const issuedRoutes = issuedProfiles.flatMap((profile) =>
    profile.credentials.map((credential) => ({
      url: `${BASE_URL}/credentials/profiles/github/${profile.github}/${credential.definitionOwner}/${credential.definitionSlug}/`,
      lastModified: parseLastModified(credential.issuedAt) || parseLastModified(profile.credentials[0]?.issuedAt) || new Date(),
      priority: 0.7,
    })),
  )

  const profileRoutes = issuedProfiles.map((profile) => ({
    url: `${BASE_URL}/credentials/profiles/github/${profile.github}/`,
    lastModified: parseLastModified(profile.credentials[0]?.issuedAt) || new Date(),
    priority: 0.75,
  }))

  const uniqueIssued = issuedRoutes.filter((route, index, allRoutes) =>
    allRoutes.findIndex((entry) => entry.url === route.url) === index,
  )

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
    {
      url: `${BASE_URL}/credentials`,
      lastModified: new Date(),
      priority: 0.9,
    },
    ...credentials.map((credential) => ({
      url: `${BASE_URL}/credentials/${credential.owner}/${credential.slug}/`,
      lastModified: parseLastModified(credential.updatedAt) || new Date(),
      priority: 0.8,
    })),
    {
      url: `${BASE_URL}/credentials/profiles`,
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/news`,
      lastModified: new Date(),
      priority: 0.75,
    },
    ...newsPosts.map((post) => ({
      url: `${BASE_URL}/news/${post.slug}/`,
      lastModified: parseLastModified(post.date) || new Date(),
      priority: 0.7,
    })),
    ...profileRoutes,
    ...uniqueIssued,
  ]

  return routes
}
