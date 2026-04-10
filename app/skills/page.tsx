import type { Metadata } from 'next'
import { Suspense } from 'react'

import AppShell from '../../components/AppShell'
import SkillsList from '../../components/skills/SkillsList'
import { collectOwners, collectTags, fetchSkillIndex, sortByUpdatedDesc } from '../../lib/skillIndex'
import { withSocialImageDefaults } from '../../lib/metadata'

const PAGE_CANONICAL = 'https://skillcraft.gg/skills'

export const metadata: Metadata = withSocialImageDefaults({
  title: 'Skills Registry | Skillcraft',
  description:
    'Browse the Skillcraft skills registry by owner and tag. Explore reusable AI and engineering skills, compare capabilities, and open the source-backed definitions.',
  alternates: {
    canonical: PAGE_CANONICAL,
  },
  openGraph: {
    type: 'website',
    url: PAGE_CANONICAL,
    title: 'Skills Registry | Skillcraft',
    description:
      'Browse the Skillcraft skills registry by owner and tag. Explore reusable AI and engineering skills, compare capabilities, and open the source-backed definitions.',
    images: [
      {
        url: '/images/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'Skillcraft skills registry',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skills Registry | Skillcraft',
    description:
      'Browse the Skillcraft skills registry by owner and tag. Explore reusable AI and engineering skills, compare capabilities, and open the source-backed definitions.',
    images: ['/images/og-home.jpg'],
  },
})

export default async function SkillsPage() {
  const skills = sortByUpdatedDesc(await fetchSkillIndex())
  const owners = collectOwners(skills)
  const tags = collectTags(skills)

  return (
      <AppShell
        title="Skills"
        activePath="/skills"
          copyClassName="copy--wide copy-skills-list"
          fullBleed
        >
        <Suspense>
          <SkillsList skills={skills} owners={owners} tags={tags} />
        </Suspense>
      </AppShell>
    )
}
