'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import type { SkillRecord } from '../../lib/skillIndex'
import { buildSearchParams, readFilters } from './filters'

type SkillsListProps = {
  skills: SkillRecord[]
}

const normalizeMatch = (value: string) => value.toLowerCase().trim()

export default function SkillsList({ skills }: SkillsListProps) {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const searchParams = useSearchParams()
  const currentParams = new URLSearchParams(searchParams || undefined)
  const state = readFilters(currentParams)

  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      const matchesQuery = !state.q || skill.name.toLowerCase().includes(state.q) || skill.owner.includes(state.q)
      const matchesOwner = !state.owner || skill.owner === state.owner
      const matchesRuntime = !state.runtime || skill.runtimes.map(normalizeMatch).includes(state.runtime)
      const matchesTag = !state.tag || skill.tags.map(normalizeMatch).includes(state.tag)

      return matchesQuery && matchesOwner && matchesRuntime && matchesTag
    })
  }, [skills, state])

  const selectedSkill = filteredSkills.find((skill) => skill.id === state.selected)
  const effectiveSelectedId =
    selectedSkill?.id ||
    (filteredSkills.length > 0
      ? filteredSkills[0].id
      : '')

  useEffect(() => {
    if (!effectiveSelectedId && !state.selected) {
      return
    }

    if (effectiveSelectedId === state.selected) {
      return
    }

    const next = buildSearchParams(currentParams, {
      q: state.q,
      owner: state.owner,
      runtime: state.runtime,
      tag: state.tag,
      selected: effectiveSelectedId,
    })

    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [effectiveSelectedId, state.selected, state.q, state.owner, state.runtime, state.tag, searchParams, pathname, router])

  const setSelected = (skillId: string) => {
    const next = buildSearchParams(currentParams, {
      q: state.q,
      owner: state.owner,
      runtime: state.runtime,
      tag: state.tag,
      selected: skillId,
    })

    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <section className="section" aria-label="Skills workspace">
      <div className="section-head">
        <div>
          <h1>Skills</h1>
          <p>Browse {skills.length} registered skills.</p>
        </div>
        <span id="result-count" className="count-pill">
          {filteredSkills.length} shown
        </span>
      </div>
      <div id="skill-results" className="item-grid" aria-live="polite">
        {filteredSkills.map((skill) => (
          <article
            key={skill.id}
            className={`skill-card${state.selected === skill.id || effectiveSelectedId === skill.id ? ' is-selected' : ''}`}
            data-skill-id={skill.id}
            data-name={normalizeMatch(skill.name)}
            data-owner={skill.owner}
            data-runtimes={normalizeMatch(skill.runtimeText)}
            data-tags={skill.tags.map(normalizeMatch).join(',')}
            tabIndex={0}
            onClick={() => setSelected(skill.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setSelected(skill.id)
              }
            }}
          >
            <header>
              <div className="skill-card__header">
                <p className="label label--inline">{skill.owner}</p>
                <h3>{skill.name}</h3>
              </div>
              <Link className="text-link" href={`/skills/${skill.owner}/${skill.slug}/`}>
                Open
              </Link>
            </header>
            <p className="skill-card__description">{skill.description}</p>
            <div className="skill-card__divider" />
            <div className="meta-row">
              <span className="meta-pill">{skill.runtimeText}</span>
              {skill.tags.map((tag) => (
                <span className="meta-pill meta-chip" key={`${skill.id}-${tag}`}>
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
      <p id="no-results" className={`caption${filteredSkills.length > 0 ? ' hidden' : ''}`}>
        No skills matched your filters.
      </p>
    </section>
  )
}
