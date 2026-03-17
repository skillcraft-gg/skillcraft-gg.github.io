export type SkillFiltersState = {
  q: string
  owner: string
  runtime: string
  tag: string
  selected: string
}

export const readFilters = (searchParams: URLSearchParams): SkillFiltersState => {
  return {
    q: searchParams.get('q')?.toLowerCase().trim() || '',
    owner: searchParams.get('owner')?.toLowerCase().trim() || '',
    runtime: searchParams.get('runtime')?.toLowerCase().trim() || '',
    tag: searchParams.get('tag')?.toLowerCase().trim() || '',
    selected: searchParams.get('selected')?.toLowerCase().trim() || '',
  }
}

export const buildSearchParams = (
  base: URLSearchParams,
  updates: Partial<Record<keyof SkillFiltersState, string>>
) => {
  const next = new URLSearchParams(base)

  for (const [key, value] of Object.entries(updates)) {
    if (!value) {
      next.delete(key)
      continue
    }

    next.set(key, value)
  }

  return next
}
