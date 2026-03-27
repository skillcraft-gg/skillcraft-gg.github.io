export type SkillFiltersState = {
  q: string
  owner: string
  tag: string
  sort: 'updated' | 'name' | 'owner'
  view: 'cards' | 'list'
}

const parseSort = (value: string | null): SkillFiltersState['sort'] => {
  if (value === 'name' || value === 'owner') {
    return value
  }

  return 'updated'
}

const parseView = (value: string | null): SkillFiltersState['view'] => {
  return value === 'list' ? 'list' : 'cards'
}

export const readFilters = (searchParams: URLSearchParams): SkillFiltersState => {
  return {
    q: searchParams.get('q')?.toLowerCase().trim() || '',
    owner: searchParams.get('owner')?.toLowerCase().trim() || '',
    tag: searchParams.get('tag')?.toLowerCase().trim() || '',
    sort: parseSort(searchParams.get('sort')),
    view: parseView(searchParams.get('view')),
  }
}

export const buildSearchParams = (
  base: URLSearchParams,
  updates: Partial<Record<keyof SkillFiltersState, string>>
) => {
  const next = new URLSearchParams(base)

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      continue
    }

    if (!value) {
      next.delete(key)
      continue
    }

    next.set(key, value)
  }

  return next
}
