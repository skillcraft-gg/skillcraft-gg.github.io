'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

import { buildSearchParams, readFilters } from './filters'

type SkillsFiltersProps = {
  owners: string[]
  runtimes: string[]
  tags: string[]
}

export default function SkillsFilters({ owners, runtimes, tags }: SkillsFiltersProps) {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const searchParams = useSearchParams()
  const currentParams = new URLSearchParams(searchParams || undefined)
  const state = readFilters(currentParams)

  const applyFilter = (nextState: Partial<typeof state>) => {
    const next = buildSearchParams(currentParams, {
      q: nextState.q ?? state.q,
      owner: nextState.owner ?? state.owner,
      runtime: nextState.runtime ?? state.runtime,
      tag: nextState.tag ?? state.tag,
      selected: '' ,
    })

    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <section>
      <h2 className="panel-title">Filters</h2>
      <label>
        <span className="label">Search</span>
        <input
          id="skill-search"
          type="search"
          placeholder="Search skill name or owner"
          value={state.q}
          onChange={(event) => applyFilter({ q: event.currentTarget.value.toLowerCase() })}
        />
      </label>
      <label>
        <span className="label">Owner</span>
        <select
          id="owner-filter"
          value={state.owner}
          onChange={(event) => applyFilter({ owner: event.currentTarget.value })}
        >
          <option value="">All owners</option>
          {owners.map((owner) => (
            <option value={owner} key={owner}>
              {owner}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="label">Runtime</span>
        <select
          id="runtime-filter"
          value={state.runtime}
          onChange={(event) => applyFilter({ runtime: event.currentTarget.value })}
        >
          <option value="">All runtimes</option>
          {runtimes.map((runtime) => (
            <option value={runtime} key={runtime}>
              {runtime}
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
            <option value={tag} key={tag}>
              {tag}
            </option>
          ))}
        </select>
      </label>
      <div className="tag-row">
        {tags.slice(0, 8).map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </section>
  )
}
