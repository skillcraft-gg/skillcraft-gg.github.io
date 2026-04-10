import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import AppShell from '../../../../components/AppShell'
import CopyCommandButton from '../../../../components/skills/CopyCommandButton'
import SkillDetailSummaryPanel from '../../../../components/skills/SkillDetailSummaryPanel'
import SkillJsonLd from '../../../../components/seo/SkillJsonLd'
import { withSocialImageDefaults } from '../../../../lib/metadata'
import { findSkillByPath, fetchSkillIndex, type SkillRecord } from '../../../../lib/skillIndex'
import { buildCanonicalSummary, getSkillSeoSummary, getSkillDetailSummary } from '../../../../lib/skillEnrichment'

type SkillDetailParams = {
  owner: string
  slug: string
}

const BASE_URL = 'https://skillcraft.gg'
const INSTALL_PREFIX = 'skillcraft skills add '

const defaultSummary = 'Explore this Skillcraft skill definition, source location, and supporting metadata.'

const SEO_DESCRIPTION_TARGET = 100

const ensureDescriptionLength = (value: string): string => {
  const trimmed = (value || '').trim()
  if (trimmed.length >= SEO_DESCRIPTION_TARGET) {
    return trimmed
  }

  return `${trimmed} This skill page includes metadata details, usage guidance, and practical verification guidance.`
}

const buildDetailMetaDescription = (skill: SkillRecord, summary: string): string => {
  const compactSummary = buildCanonicalSummary(summary)
  if (compactSummary) {
    return ensureDescriptionLength(compactSummary)
  }

  const tagLine = skill.tags.length > 0 ? `Tags: ${skill.tags.join(', ')}` : 'Reusable skill definition'

  return `${skill.name} by ${skill.owner}. ${tagLine}.`
}

const stringifyMetadataValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'Not provided'
  }

  if (Array.isArray(value)) {
    if (!value.length) {
      return 'Not provided'
    }

    return value
      .map((entry) => stringifyMetadataValue(entry))
      .filter(Boolean)
      .join('\n')
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  if (typeof value === 'string') {
    return value.trim() || 'Not provided'
  }

  return String(value)
}

const buildFallbackSummary = (skill: SkillRecord): string => {
  const summarySource = skill.description && skill.description !== 'No description provided.'
    ? skill.description
    : `Reusable ${skill.name} skill maintained by ${skill.owner}.`

  return summarySource
}

const buildCanonical = (owner: string, slug: string) => `/skills/${owner}/${slug}/`

const formatUpdated = (value: string) => {
  if (!value) {
    return 'Unknown'
  }

  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return value
  }

  return new Date(parsed).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getMetadataFromSkill = async (skill: SkillRecord, summary: string): Promise<Metadata> => {
  const canonical = buildCanonical(skill.owner, skill.slug)
  const canonicalUrl = `${BASE_URL}${canonical}`
  const normalizedSummary = buildDetailMetaDescription(skill, summary)
  const safeSummary = ensureDescriptionLength(normalizedSummary)
  const title = `${skill.name} | Skillcraft Skills`

  return withSocialImageDefaults({
    title,
    description: safeSummary,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title,
      description: safeSummary,
      images: [
        {
          url: '/images/og-home.jpg',
          width: 1200,
          height: 630,
          alt: `${skill.name} skill page`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: safeSummary,
      images: ['/images/og-home.jpg'],
    },
    keywords: [...new Set(skill.tags)],
  })
}

const isDisplayableMetadata = (key: string, value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return false
  }

  if ((Array.isArray(value) && value.length === 0)) {
    return false
  }

  return !['id', 'name', 'owner', 'slug', 'tags', 'tagsText', 'updatedAt', 'description', 'url', 'path'].includes(key)
}

const renderMetadataList = (entries: [string, unknown][]) => {
  if (entries.length === 0) {
    return <p className="caption">No additional metadata was published in the index.</p>
  }

  return (
    <ul className="detail-list detail-list--compact detail-metadata-list">
      {entries.map(([key, value]) => (
        <li key={key}>
          <strong>{key}:</strong>
          {typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? (
            <span> {stringifyMetadataValue(value)}</span>
          ) : Array.isArray(value) || (value && typeof value === 'object') ? (
            <pre className="metadata-json">{stringifyMetadataValue(value)}</pre>
          ) : (
            <span> {stringifyMetadataValue(value)}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

export async function generateStaticParams(): Promise<SkillDetailParams[]> {
  const skills = await fetchSkillIndex()

  return skills.map((skill) => ({
    owner: skill.owner,
    slug: skill.slug,
  }))
}

export async function generateMetadata({ params }: { params: SkillDetailParams }): Promise<Metadata> {
  const owner = decodeURIComponent((params.owner || '').toLowerCase())
  const slug = decodeURIComponent((params.slug || '').toLowerCase())

  const skills = await fetchSkillIndex()
  const skill = findSkillByPath(skills, owner, slug)

  if (!skill) {
    return withSocialImageDefaults({
      title: 'Skill Not Found | Skillcraft',
      description: 'This skill could not be found.',
      alternates: {
        canonical: `${BASE_URL}/skills/${owner}/${slug}/`,
      },
      robots: {
        index: false,
        follow: false,
      },
    })
  }

  const summary = await getSkillSeoSummary(skill)
  return getMetadataFromSkill(skill, summary)
}

export default async function SkillDetailPage({ params }: { params: SkillDetailParams }) {
  const owner = decodeURIComponent((params.owner || '').toLowerCase())
  const slug = decodeURIComponent((params.slug || '').toLowerCase())

  const skills = await fetchSkillIndex()
  const selected = findSkillByPath(skills, owner, slug)

  if (!selected) {
    notFound()
  }

  const summary = await getSkillDetailSummary(selected)
  const canonical = buildCanonical(selected.owner, selected.slug)
  const installCommand = `${INSTALL_PREFIX}${selected.owner}/${selected.slug}`
  const displaySummary = summary || buildFallbackSummary(selected)

  const metadataEntries = Object
    .entries(selected.indexMetadata)
    .filter(([key, value]) => isDisplayableMetadata(key, value))
    .sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <>
      <SkillJsonLd
        skill={selected}
        canonicalUrl={`https://skillcraft.gg${canonical}`}
        summary={buildCanonicalSummary(summary || defaultSummary)}
      />

        <AppShell
          title={`Skills / ${selected.owner}`}
          activePath="/skills"
          copyClassName="copy--wide copy-skill-detail"
          fullBleed
        >
          <Link href="/skills" className="btn btn-secondary detail-back-link" aria-label="Back to skills">
            ← Back to Skills
          </Link>

           <section className="section skill-detail" aria-label={`Skill detail for ${selected.name}`}>
                <div className="detail-summary-layout">
                  <div className="detail-summary-column">
                    <SkillDetailSummaryPanel
                      owner={selected.owner}
                      name={selected.name}
                      updatedAt={formatUpdated(selected.updatedAt)}
                      sourceUrl={selected.url}
                      summary={displaySummary}
                      fallbackSummary={defaultSummary}
                    />
                  </div>

                <div className="detail-action-row">
                  <div className="skill-install-card">
                    <p className="label">Add this skill to your project</p>
                    <div className="skill-install-row skill-install-row--stacked">
                       <code className="skill-install-command skill-install-command--detail">{installCommand}</code>
                       <CopyCommandButton text={installCommand} className="btn btn-primary" label="Copy Command" />
                    </div>
                  </div>

                  <section className="panel detail-sidebar-panel">
                    <h2 className="panel-title">Registry details</h2>
                    <ul className="detail-list detail-list--compact">
                      <li><strong>Owner:</strong> {selected.owner}</li>
                      <li><strong>Tags:</strong> {selected.tags.length > 0 ? selected.tags.join(', ') : 'None'}</li>
                      <li><strong>Updated:</strong> {formatUpdated(selected.updatedAt)}</li>
                      <li><strong>Path:</strong> {selected.path || 'unknown'}</li>
                      <li><strong>Registry ID:</strong> {selected.id}</li>
                    </ul>
                  </section>

                  <section className="panel detail-sidebar-panel">
                    <h2 className="panel-title">Index metadata</h2>
                    {renderMetadataList(metadataEntries)}
                  </section>

                </div>
              </div>
        </section>
      </AppShell>
    </>
  )
}
