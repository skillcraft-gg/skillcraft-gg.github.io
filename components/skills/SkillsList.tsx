'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { fetchLiveSkillIndex, type SkillRecord } from '../../lib/skillIndex'
import { readFilters, buildSearchParams } from './filters'
import CopyCommandButton from './CopyCommandButton'

type SkillsListProps = {
  skills: SkillRecord[]
  owners: string[]
  tags: string[]
}

const normalizeMatch = (value: string) => value.toLowerCase().trim()

const formatSummary = (value: string) => {
  const normalized = value.trim()
  if (!normalized) {
    return ''
  }

  if (normalized.length <= 190) {
    return normalized
  }

  const short = normalized.slice(0, 190)
  const boundary = short.lastIndexOf(' ')

  return `${(boundary > 140 ? short.slice(0, boundary) : short).trim()}…`
}

const buildFallbackSummary = (skill: SkillRecord) => {
  const tagCopy = skill.tags.length > 0 ? ` Includes ${skill.tags.slice(0, 4).join(', ')}.` : ''

  return `${skill.name} from ${skill.owner}.${tagCopy}`.trim()
}

const parseUpdatedAt = (value: string): number => {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

const formatRelativeDate = (value: string) => {
  if (!value) {
    return 'Updated unknown'
  }

  const parsed = parseUpdatedAt(value)
  if (!parsed) {
    return 'Updated unknown'
  }

  const deltaDays = Math.max(0, Math.floor((Date.now() - parsed) / 86400000))
  if (deltaDays === 0) {
    return 'Updated today'
  }

  if (deltaDays === 1) {
    return 'Updated yesterday'
  }

  if (deltaDays < 7) {
    return `Updated ${deltaDays} days ago`
  }

  if (deltaDays < 30) {
    return `Updated ${Math.floor(deltaDays / 7)} weeks ago`
  }

  if (deltaDays < 365) {
    return `Updated ${Math.floor(deltaDays / 30)} months ago`
  }

  return `Updated ${Math.floor(deltaDays / 365)} years ago`
}

const stripNoDescription = (value: string) => {
  return value === 'No description provided.' ? '' : value
}

export default function SkillsList({ skills, owners, tags }: SkillsListProps) {
  const router = useRouter()
  const pathname = usePathname() || '/skills'
  const searchParams = useSearchParams()
  const currentParams = new URLSearchParams(searchParams || undefined)

  const state = readFilters(currentParams)
  const [skillRows, setSkillRows] = useState<SkillRecord[]>(skills)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [showTopFade, setShowTopFade] = useState(false)
  const [showBottomFade, setShowBottomFade] = useState(false)

  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      try {
        const liveSkills = await fetchLiveSkillIndex()
        if (!cancelled && liveSkills.length > 0) {
          setSkillRows((previousSkills) => {
            if (previousSkills.length === liveSkills.length) {
              const same = previousSkills.every(
                (skill, index) =>
                  skill.id === liveSkills[index].id
                  && skill.updatedAt === liveSkills[index].updatedAt,
              )

              if (same) {
                return previousSkills
              }
            }

            return liveSkills
          })
        }
      } catch {
        // Keep the server-rendered index if live refresh fails.
      }
    }

    void refresh()

    return () => {
      cancelled = true
    }
  }, [])

  const updateScrollFades = useCallback(() => {
    const element = resultsRef.current
    if (!element) {
      return
    }

    const scrolled = element.scrollTop
    const viewportBottom = scrolled + element.clientHeight
    const contentBottom = element.scrollHeight

    setShowTopFade(scrolled > 1)
    setShowBottomFade(viewportBottom < contentBottom - 1)
  }, [])

  const applyFilter = (nextState: Partial<{ q: string; owner: string; tag: string; sort: string; view: string }>) => {
    const next = buildSearchParams(currentParams, {
      q: nextState.q ?? state.q,
      owner: nextState.owner ?? state.owner,
      tag: nextState.tag ?? state.tag,
      sort: nextState.sort ?? state.sort,
      view: nextState.view ?? state.view,
    })

    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const filteredSkills = useMemo(() => {
    return skillRows.filter((skill) => {
      const summary = stripNoDescription(skill.description)
      const matchesQuery = !state.q
        || normalizeMatch(skill.name).includes(state.q)
        || normalizeMatch(skill.owner).includes(state.q)
        || normalizeMatch(summary).includes(state.q)
        || normalizeMatch(skill.tags.join(' ')).includes(state.q)

      const matchesOwner = !state.owner || skill.owner === state.owner
      const matchesTag = !state.tag || skill.tags.map(normalizeMatch).includes(state.tag)

      return matchesQuery && matchesOwner && matchesTag
    })
  }, [skillRows, state])

  const sortedSkills = useMemo(() => {
    const clone = [...filteredSkills]

    if (state.sort === 'name') {
      clone.sort((a, b) => a.name.localeCompare(b.name))
    } else if (state.sort === 'owner') {
      clone.sort((a, b) => {
        const ownerSort = a.owner.localeCompare(b.owner)
        return ownerSort !== 0 ? ownerSort : a.name.localeCompare(b.name)
      })
    } else {
      clone.sort((a, b) => parseUpdatedAt(b.updatedAt) - parseUpdatedAt(a.updatedAt))
    }

    return clone
  }, [filteredSkills, state.sort])

  const results = useMemo(() => sortedSkills, [sortedSkills])

  const hasFilter = state.q || state.owner || state.tag
  const isListView = state.view === 'list'
  const isCardView = state.view === 'cards'

  useEffect(() => {
    updateScrollFades()
  }, [results, updateScrollFades])

  useEffect(() => {
    const element = resultsRef.current
    if (!element) {
      return
    }

    const onScroll = () => {
      updateScrollFades()
    }

    updateScrollFades()
    element.addEventListener('scroll', onScroll, { passive: true })

    const resizeObserver = new ResizeObserver(onScroll)
    resizeObserver.observe(element)

    return () => {
      element.removeEventListener('scroll', onScroll)
      resizeObserver.disconnect()
    }
  }, [results, isListView, updateScrollFades])

  return (
    <section className="section skills-workspace" aria-label="Skills workspace">
      <div className="section-head section-head--skills">
        <div>
          <h1>Skills</h1>
          <p>Browse and install reusable skill definitions.</p>
        </div>
        <span id="result-count" className="count-pill skills-count">
          {results.length} of {skillRows.length} shown
        </span>
      </div>

      <form className="skills-filter-form" aria-label="Filter skills" onSubmit={(event) => event.preventDefault()}>
        <label className="skills-search">
          <span className="label">Search</span>
          <input
            id="skill-search"
            type="search"
            placeholder="Search name, owner, tag, or summary"
            value={state.q}
            onChange={(event) => applyFilter({ q: event.currentTarget.value.toLowerCase() })}
          />
        </label>

        <div className="skills-filter-row">
          <label>
            <span className="label">Owner</span>
            <select
              id="owner-filter"
              value={state.owner}
              onChange={(event) => applyFilter({ owner: event.currentTarget.value })}
            >
              <option value="">All owners</option>
              {owners.map((owner) => (
                <option value={owner} key={`owner-${owner}`}>
                  {owner}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="label">Tag</span>
            <select
              id="tag-filter"
              value={state.tag}
              onChange={(event) => applyFilter({ tag: event.currentTarget.value })}
            >
              <option value="">All tags</option>
              {tags.map((tag) => (
                <option value={tag} key={`tag-${tag}`}>
                  {tag}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="label">Sort</span>
            <select
              id="sort-filter"
              value={state.sort}
              onChange={(event) => applyFilter({ sort: event.currentTarget.value })}
            >
              <option value="updated">Updated</option>
              <option value="name">Name</option>
              <option value="owner">Owner</option>
            </select>
          </label>

          <label className="skills-view-row">
            <span className="label">View</span>
            <div className="skills-view-toggle" role="group" aria-label="Skills view mode">
              <button
                type="button"
                className={isCardView ? 'tag tag-row--active' : 'tag'}
                onClick={() => {
                  if (isCardView) {
                    return
                  }

                  applyFilter({ view: 'cards' })
                }}
                aria-pressed={isCardView}
                aria-label="Use card view"
                disabled={isCardView}
              >
                <span className="skills-view-icon skills-view-icon--cards" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                Cards
              </button>
              <button
                type="button"
                className={isListView ? 'tag tag-row--active' : 'tag'}
                onClick={() => {
                  if (isListView) {
                    return
                  }

                  applyFilter({ view: 'list' })
                }}
                aria-pressed={isListView}
                aria-label="Use list view"
                disabled={isListView}
              >
                <span className="skills-view-icon skills-view-icon--list" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                List
              </button>
            </div>
          </label>
        </div>

        {hasFilter ? (
          <div className="active-filter-row">
            <span className="label">Active filters</span>
            <div className="active-filter-chips" aria-live="polite">
              {state.q ? (
                <button type="button" className="tag" onClick={() => applyFilter({ q: '' })}>
                  search: {state.q}
                </button>
              ) : null}
              {state.owner ? (
                <button type="button" className="tag" onClick={() => applyFilter({ owner: '' })}>
                  owner: {state.owner}
                </button>
              ) : null}
              {state.tag ? (
                <button type="button" className="tag" onClick={() => applyFilter({ tag: '' })}>
                  tag: {state.tag}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className="tag tag-row--active"
              onClick={() => applyFilter({ q: '', owner: '', tag: '' })}
            >
              Clear all
            </button>
          </div>
        ) : null}

        <div className="tag-row" aria-live="polite">
          {tags.slice(0, 18).map((tag) => (
            <button
              key={`tag-chip-${tag}`}
              type="button"
              className={`tag ${state.tag === tag ? 'tag-row--active' : ''}`}
              onClick={() => applyFilter({ tag: state.tag === tag ? '' : tag })}
            >
              {tag}
            </button>
          ))}
        </div>
      </form>

        <div
          className={`skills-list-scroll-shell ${showTopFade ? 'has-top-fade' : ''} ${showBottomFade ? 'has-bottom-fade' : ''}`}
          aria-live="polite"
        >
          <div
            id="skill-results"
            ref={resultsRef}
            className={`skills-list-scroll ${isListView ? 'skills-list-scroll--list' : ''}`}
            aria-live="polite"
          >
            <div className={`item-grid ${isListView ? 'item-grid--list' : ''}`}>
              {results.map((skill) => {
                const rawSummary = stripNoDescription(skill.description)
                const fallbackSummary = buildFallbackSummary(skill)
                const summary = rawSummary || fallbackSummary
                const shortSummary = formatSummary(summary)
                const installCommand = `skillcraft skills add ${skill.owner}/${skill.slug}`
                const cardPath = `/skills/${skill.owner}/${skill.slug}/`

                const openCard = () => {
                  router.push(cardPath)
                }

                const handleCardClick = () => {
                  openCard()
                }

                const handleCardKeydown = (event: { key: string; preventDefault: () => void }) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openCard()
                  }
                }

                return (
                  <article
                    key={skill.id}
                    className={`skill-card ${isListView ? 'skill-card--list' : ''}`}
                    role="link"
                    tabIndex={0}
                    onClick={handleCardClick}
                    onKeyDown={handleCardKeydown}
                    aria-label={`Open ${skill.name} skill page`}
                  >
                    <header>
                      <div className="skill-card__header">
                        <p className="label label--inline">{skill.owner}</p>
                        <h3>{skill.name}</h3>
                      </div>
                    </header>

                    <p className="skill-card__description">{shortSummary}</p>

                    <div className="skill-card__divider" />

                    <div className="meta-row">
                      {skill.tags.map((tag) => (
                        <span className="meta-pill meta-chip" key={`${skill.id}-${tag}`}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <p className="skill-meta-text">{formatRelativeDate(skill.updatedAt)}</p>

                    <div
                      className="skill-install-row"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <code className="skill-install" title={`Install command: ${installCommand}`}>
                        {installCommand}
                      </code>
                      <CopyCommandButton text={installCommand} />
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>

      <p id="no-results" className={`caption${results.length > 0 ? ' hidden' : ''}`}>
        No skills matched your filters.
      </p>
    </section>
  )
}
