'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import CredentialImageFallback from './CredentialImageFallback'
import { fetchLiveCredentialIndex, type CredentialDefinition } from '../../lib/credentialIndex'
import { buildSearchParams, readFilters } from './filters'
import { resolveCredentialImage } from './credentialImageResolver'

type CredentialsListProps = {
  credentials: CredentialDefinition[]
  owners: string[]
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

const buildFallbackSummary = (credential: CredentialDefinition) => {
  return `${credential.name} by ${credential.owner}.`
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

const normalizeRequirementsSummary = (requirements: Record<string, unknown>) => {
  if (!requirements || typeof requirements !== 'object') {
    return 'No explicit requirements provided.'
  }

  const minCommits = typeof requirements.minCommits === 'number'
    ? `${requirements.minCommits} minimum commits`
    : ''

  const minRepositories = typeof requirements.minRepositories === 'number'
    ? `${requirements.minRepositories} minimum repositories`
    : ''

  const detailParts = [minCommits, minRepositories].filter(Boolean)

  if (detailParts.length === 0) {
    return 'Requirements defined in the ledger.'
  }

  return detailParts.join(' · ')
}

export default function CredentialsList({ credentials, owners }: CredentialsListProps) {
  const router = useRouter()
  const pathname = usePathname() || '/credentials'
  const searchParams = useSearchParams()
  const currentParams = new URLSearchParams(searchParams || undefined)

  const state = readFilters(currentParams)
  const [credentialRows, setCredentialRows] = useState<CredentialDefinition[]>(credentials)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [showTopFade, setShowTopFade] = useState(false)
  const [showBottomFade, setShowBottomFade] = useState(false)

  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      try {
        const liveCredentials = await fetchLiveCredentialIndex()
        if (!cancelled && liveCredentials.length > 0) {
          setCredentialRows((previousCredentials) => {
            if (previousCredentials.length === liveCredentials.length) {
              const same = previousCredentials.every((item, index) => (
                item.id === liveCredentials[index].id
                && item.updatedAt === liveCredentials[index].updatedAt
              ))

              if (same) {
                return previousCredentials
              }
            }

            return liveCredentials
          })
        }
      } catch {
        // Keep the server-rendered list if live refresh fails.
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

  const applyFilter = (nextState: Partial<{ q: string; owner: string; sort: string; view: string }>) => {
    const next = buildSearchParams(currentParams, {
      q: nextState.q ?? state.q,
      owner: nextState.owner ?? state.owner,
      sort: nextState.sort ?? state.sort,
      view: nextState.view ?? state.view,
    })

    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const filteredCredentials = useMemo(() => {
    return credentialRows.filter((credential) => {
      const summary = stripNoDescription(credential.description)
      const matchesQuery = !state.q
        || normalizeMatch(credential.name).includes(state.q)
        || normalizeMatch(credential.owner).includes(state.q)
        || normalizeMatch(summary).includes(state.q)

      const matchesOwner = !state.owner || credential.owner === state.owner

      return matchesQuery && matchesOwner
    })
  }, [credentialRows, state])

  const sortedCredentials = useMemo(() => {
    const clone = [...filteredCredentials]

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
  }, [filteredCredentials, state.sort])

  const results = useMemo(() => sortedCredentials, [sortedCredentials])

  const hasFilter = state.q || state.owner
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
    <section className="section skills-workspace" aria-label="Credential workspace">
      <div className="section-head section-head--skills">
        <div>
          <h1>Credentials</h1>
          <p>Browse credential definitions and claim eligibility requirements.</p>
        </div>
        <span id="result-count" className="count-pill skills-count">
          {results.length} of {credentialRows.length} shown
        </span>
      </div>

      <div className="skills-list-layout">
        <div className="skills-list-main">
          <div
            className={`skills-list-scroll-shell ${showTopFade ? 'has-top-fade' : ''} ${showBottomFade ? 'has-bottom-fade' : ''}`}
            aria-live="polite"
          >
            <div
              id="credential-results"
              ref={resultsRef}
              className={`skills-list-scroll ${isListView ? 'skills-list-scroll--list' : ''}`}
              aria-live="polite"
            >
              <div className={`item-grid ${isListView ? 'item-grid--list' : 'item-grid--credentials'}`}>
                {results.map((credential) => {
                  const summary = stripNoDescription(credential.description) || buildFallbackSummary(credential)
                  const shortSummary = formatSummary(summary)
                  const requirements = normalizeRequirementsSummary(credential.requirements)
                  const cardPath = `/credentials/${credential.owner}/${credential.slug}/`

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
                      key={credential.id}
                      className={`skill-card credential-card ${isListView ? 'skill-card--list' : ''}`}
                      role="link"
                      tabIndex={0}
                      onClick={handleCardClick}
                      onKeyDown={handleCardKeydown}
                      aria-label={`Open ${credential.name} credential page`}
                    >
                      <div className="credential-card-media">
                        <CredentialImageFallback
                          src={resolveCredentialImage(credential)}
                          alt={`${credential.name} credential image`}
                          loading="lazy"
                          className="credential-card-image"
                        />
                      </div>

                      <div className="credential-card-body">
                        <div className="credential-card-body-top">
                          <header>
                            <div className="skill-card__header">
                              <p className="label label--inline">{credential.owner}</p>
                              <h3>{credential.name}</h3>
                            </div>
                          </header>

                          <p className="skill-card__description">{shortSummary}</p>
                        </div>

                        <div className="credential-card-body-bottom">
                          <div className="skill-card__divider" />

                          <p className="skill-meta-text" title={requirements}>
                            {requirements}
                          </p>
                          <p className="skill-meta-text">{formatRelativeDate(credential.updatedAt)}</p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>

          <p id="no-results" className={`caption${results.length > 0 ? ' hidden' : ''}`}>
            No credentials matched your filters.
          </p>
        </div>

        <form className="skills-filter-form" aria-label="Filter credentials" onSubmit={(event) => event.preventDefault()}>
          <label className="skills-search">
            <span className="label">Search</span>
            <input
              id="credential-search"
              type="search"
              placeholder="Search name, owner, or summary"
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
              <div className="skills-view-toggle" role="group" aria-label="Credential view mode">
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
              </div>
              <button
                type="button"
                className="tag tag-row--active"
                onClick={() => applyFilter({ q: '', owner: '' })}
              >
                Clear all
              </button>
            </div>
          ) : null}
        </form>
      </div>
    </section>
  )
}
