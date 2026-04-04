'use client'

import type { ReactNode } from 'react'

type RequirementRendererProps = {
  requirements: unknown
  emptyMessage?: string
}

const KNOWN_LABELS: Record<string, string> = {
  minCommits: 'Minimum commits',
  min_commits: 'Minimum commits',
  minRepositories: 'Minimum repositories',
  min_repositories: 'Minimum repositories',
  minBranches: 'Minimum branches',
  min_branches: 'Minimum branches',
  minStars: 'Minimum stars',
  min_stars: 'Minimum stars',
  minFollowers: 'Minimum followers',
  min_followers: 'Minimum followers',
}

const LOGICAL_OPERATOR_LABELS: Record<string, string> = {
  and: 'All of',
  or: 'Any of',
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const toDisplayValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'Not provided'
  }

  if (typeof value === 'string') {
    return value.trim() || 'Not provided'
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return JSON.stringify(value)
}

const formatKey = (key: string): string => {
  if (KNOWN_LABELS[key]) {
    return KNOWN_LABELS[key]
  }

  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase())
}

const hasRenderableValue = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') {
    return false
  }

  if (Array.isArray(value)) {
    return value.some((entry) => hasRenderableValue(entry))
  }

  if (isPlainObject(value)) {
    return Object.values(value).some((entry) => hasRenderableValue(entry))
  }

  return true
}

const renderArrayEntries = (
  values: unknown[],
  depth: number,
  prefix: string,
  nestedDepth = depth + 1,
): ReactNode[] => {
  const entries = values.filter((entry) => hasRenderableValue(entry))
  return entries.map((entry, index) => (
    <li key={`${prefix}-${depth}-${index}`} className="requirement-entry">
      {renderValue(entry, nestedDepth)}
    </li>
  ))
}

const renderObjectRows = (value: Record<string, unknown>, depth: number): ReactNode[] => {
  const entries = Object.entries(value)
    .filter(([, entryValue]) => hasRenderableValue(entryValue))

  if (entries.length === 0) {
    return [
      <li key={`empty-${depth}`} className="requirement-entry">
        <span className="caption">No requirements were defined.</span>
      </li>,
    ]
  }

  const rows: ReactNode[] = []

  entries.forEach(([key, entryValue], index) => {
    if (key === 'tree' && (Array.isArray(entryValue) || isPlainObject(entryValue))) {
      if (Array.isArray(entryValue)) {
        rows.push(...renderArrayEntries(entryValue, depth, `tree-${depth}-${index}`, depth))
      } else {
        rows.push(...renderObjectRows(entryValue, depth))
      }
      return
    }

    const label = formatKey(key)
    const logical = LOGICAL_OPERATOR_LABELS[key]

    if (logical && Array.isArray(entryValue)) {
      rows.push(
        <li key={key} className="requirement-entry">
          <span className="requirement-key">{logical}:</span>
          {' '}
          {renderArray(entryValue, depth + 1)}
        </li>,
      )
      return
    }

    rows.push(
      <li key={key} className="requirement-entry">
        <span className="requirement-key">{label}:</span>
        {' '}
        {renderValue(entryValue, depth + 1)}
      </li>,
    )
  })

  return rows
}

const renderArray = (values: unknown[], depth: number): ReactNode => {
  const rows = renderArrayEntries(values, depth, `array-${depth}`)

  if (rows.length === 0) {
    return <p className="caption">No values were defined.</p>
  }

  return (
    <ul className={`requirements-list ${depth > 0 ? 'requirements-list--nested' : ''}`}>
      {rows}
    </ul>
  )
}

const renderObject = (value: Record<string, unknown>, depth: number): ReactNode => {
  const rows = renderObjectRows(value, depth)

  if (rows.length === 0) {
    return <p className="caption">No requirements were defined.</p>
  }

  return (
    <ul className={`requirements-list ${depth > 0 ? 'requirements-list--nested' : ''}`}>
      {rows}
    </ul>
  )
}

const renderValue = (value: unknown, depth: number): ReactNode => {
  if (hasRenderableValue(value) === false) {
    return <span className="requirement-value">Not provided</span>
  }

  if (Array.isArray(value)) {
    return renderArray(value, depth)
  }

  if (isPlainObject(value)) {
    return renderObject(value, depth)
  }

  return <span className="requirement-value">{toDisplayValue(value)}</span>
}

export const hasDisplayableRequirements = (requirements: unknown): boolean => {
  if (!requirements) {
    return false
  }

  if (isPlainObject(requirements)) {
    return Object.values(requirements).some(hasRenderableValue)
  }

  return hasRenderableValue(requirements)
}

export default function CredentialRequirementsRenderer(
  { requirements, emptyMessage = 'No requirements were defined in the ledger.' }: RequirementRendererProps,
) {
  if (!hasDisplayableRequirements(requirements)) {
    return <p className="caption">{emptyMessage}</p>
  }

  return <>{renderValue(requirements, 0)}</>
}
