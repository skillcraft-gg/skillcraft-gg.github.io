'use client'

import { useState } from 'react'

import { MarkdownDescription } from './MarkdownDescription'

type SkillDetailSummaryPanelProps = {
  owner: string
  name: string
  updatedAt: string
  sourceUrl?: string | null
  summary: string
  fallbackSummary: string
}

export default function SkillDetailSummaryPanel({
  owner,
  name,
  updatedAt,
  sourceUrl,
  summary,
  fallbackSummary,
}: SkillDetailSummaryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const displaySummary = summary || fallbackSummary
  const summaryPanelId = `skill-detail-summary-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <>
      <div className="detail-summary-shell" aria-label={`Description for ${name}`}>
        <p className="kicker">{owner} · {updatedAt}</p>
        <h1>{name}</h1>

        <div className="detail-quick-links">
          {sourceUrl ? (
            <a className="btn btn-secondary" href={sourceUrl} target="_blank" rel="noreferrer">
              View source
            </a>
          ) : null}
        </div>

        <MarkdownDescription
          id={summaryPanelId}
          className={`workflow-copy detail-summary detail-summary-collapse${isExpanded ? ' is-expanded' : ''}`}
          content={displaySummary}
        />

        <button
          type="button"
          className="btn btn-secondary detail-summary-toggle"
          aria-expanded={isExpanded}
          aria-controls={summaryPanelId}
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? 'Hide description' : 'Expand description'}
        </button>
      </div>
    </>
  )
}
