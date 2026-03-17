'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import type { SkillRecord } from '../../lib/skillIndex'
import { readFilters } from './filters'

type SkillsInspectorProps = {
  skills: SkillRecord[]
}

export default function SkillsInspector({ skills }: SkillsInspectorProps) {
  const searchParams = useSearchParams()
  const filters = readFilters(new URLSearchParams(searchParams || undefined))

  const selected = useMemo(() => {
    return skills.find((skill) => skill.id === filters.selected) || null
  }, [skills, filters.selected])

  return (
    <>
      <h2 className="panel-title">Inspector</h2>
      {selected ? (
        <>
          <div id="inspector-content" className="inspector-content">
            <ul className="detail-list">
              <li><strong>Name:</strong> {selected.name}</li>
              <li><strong>Owner:</strong> {selected.owner}</li>
              <li><strong>Runtime:</strong> {selected.runtimeText}</li>
              <li><strong>Tags:</strong> {(selected.tags.length > 0 ? selected.tags.join(', ') : 'None')}</li>
              <li><strong>Updated:</strong> {selected.updatedAt || 'unknown'}</li>
              <li>
                <strong>Source:</strong>{' '}
                <a className="text-link" href={selected.url || '#'} target="_blank" rel="noreferrer">
                  open definition
                </a>
              </li>
            </ul>
            <p>
              <a className="button" href={`/skills/${selected.owner}/${selected.slug}/`}>
                Open skill page
              </a>
            </p>
          </div>
        </>
      ) : (
        <p id="inspector-empty" className="caption">
          Select a skill card to inspect metadata.
        </p>
      )}
    </>
  )
}
