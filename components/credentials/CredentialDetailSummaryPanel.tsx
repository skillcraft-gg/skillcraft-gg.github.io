'use client'

import { useState } from 'react'

import CredentialImageFallback from './CredentialImageFallback'
import { MarkdownDescription } from '../skills/MarkdownDescription'

type CredentialDetailSummaryPanelProps = {
  owner: string
  name: string
  updatedAt: string
  sourceUrl?: string | null
  imageUrl?: string
  summary: string
  fallbackSummary: string
}

export default function CredentialDetailSummaryPanel({
  owner,
  name,
  updatedAt,
  sourceUrl,
  imageUrl,
  summary,
  fallbackSummary,
}: CredentialDetailSummaryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const displaySummary = summary || fallbackSummary
  const summaryPanelId = `credential-detail-summary-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <div className="detail-summary-shell" aria-label={`Description for ${name}`}>
      <p className="kicker">{owner} · {updatedAt}</p>
         <div className="detail-image-shell">
           <CredentialImageFallback
             src={imageUrl || ''}
             alt={`${name} credential image`}
             loading="eager"
             className="detail-image"
           />
         </div>
      <h1>{name}</h1>

      <div className="detail-quick-links">
        {sourceUrl ? (
          <a className="btn btn-secondary" href={sourceUrl} target="_blank" rel="noreferrer">
            View credential source
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
  )
}
