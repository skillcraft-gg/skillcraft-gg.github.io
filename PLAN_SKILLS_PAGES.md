# PLAN: Skills Pages + SEO Optimization

## Objective

Build and enable the missing skills routes using the existing skill registry while preserving the current app-shell UI language and adding SEO support so Google can discover and rank pages reliably.

- Implement and restore:
  - `/skills`
  - `/skills/[owner]/[slug]`
- Keep static-export compatibility (`next.config.mjs: output: 'export'`, `trailingSlash: true`).
- Keep source-of-truth behavior driven by `lib/skillIndex.ts` (`INDEX_URL`).
- Add rich detail pages with graceful content enrichment from `SKILL.md` when available.
- Add SEO primitives: per-page metadata, canonical URLs, sitemap, robots, optional JSON-LD.

## Scope

### In scope
- Server-rendered route pages for skills list and skill detail.
- Client components for list/filters/inspector reuse.
- URL-driven filtering and selected item sync.
- SEO metadata and discovery artifacts (`sitemap.xml`, `robots.txt`).
- Structured data on skill pages.

### Out of scope
- Implementing `/loadouts` and `/credentials` pages.
- Major visual redesign outside existing design system.

## Existing assets to reuse

- Layout shell: `components/AppShell.tsx`
- Shell navigation: `components/TopNav.tsx`
- Shared styles/patterns: `app/globals.css`
- Skills UI pieces:
  - `components/skills/SkillsFilters.tsx`
  - `components/skills/SkillsList.tsx`
  - `components/skills/SkillsInspector.tsx`
  - `components/skills/filters.ts`
- Registry helper:
  - `lib/skillIndex.ts`

## Current baseline snapshot

- There are no active route files for:
  - `app/skills/page.tsx`
  - `app/skills/[owner]/[slug]/page.tsx`
- Navigation currently disables Skills in `lib/navigation.ts`.
- Existing metadata defaults are defined in `app/layout.tsx` and static fallback is for page metadata only.

## Work plan by file

### 1) Enable Skills in navigation

- **File:** `lib/navigation.ts`
- Change:
  - `ROUTES` entry for `Skills` from `disabled: true` → `disabled: false`.

### 2) Add enrichment utility module

- **File:** `lib/skillEnrichment.ts` (new)
- Add helpers:
  - `buildSkillReadmeUrl(skill: SkillRecord): string | null`
  - `fetchText(url: string): Promise<string | null>`
  - `extractReadableSummary(markdown: string, maxChars?: number): string`
  - `getSkillSeoSummary(skill: SkillRecord): Promise<string>`

#### Behavior and rules

- Prefer enriching detail metadata/content using `SKILL.md`-style source docs.
- Derive raw content URLs from registry `skill.url`:
  - Handle GitHub blob/raw conversions.
  - Build fallback with `skill.path` when possible.
- Never fail page rendering when enrichment fails.
- Return fallback order:
  1) `SKILL.md` extracted summary
  2) `skill.description`
  3) generic fallback sentence
- For metadata descriptions, truncate/normalize to a short SEO-friendly summary length (~160-240 chars).

### 3) Build `/skills` route

- **File:** `app/skills/page.tsx` (new)
- Server data load:
  - `fetchSkillIndex()`
  - `collectOwners`, `collectRuntimes`, `collectTags`
  - `sortByUpdatedDesc`
- Render with AppShell:
  - `title="Skills"`
  - `activePath="/skills"`
  - `sidebar` → `<SkillsFilters owners... runtimes... tags... />`
  - `children` → `<SkillsList skills={skills} />`
  - `inspector` → `<SkillsInspector skills={skills} />`
- Add page metadata:
  - `title`: `"Skills Registry | Skillcraft"`
  - `description`: index-aware, keyword-conscious copy
  - `alternates.canonical: '/skills'`
  - OG/Twitter values consistent with global card theme

### 4) Build skill detail dynamic route

- **File:** `app/skills/[owner]/[slug]/page.tsx` (new)
- Static params + metadata:
  - `generateStaticParams()` from `fetchSkillIndex()`.
  - `generateMetadata({ params })` with:
    - `title: "{skill.name} | Skillcraft Skills"`
    - `description` from enriched summary
    - `alternates.canonical: '/skills/{owner}/{slug}'`
    - OG + Twitter
    - `keywords` from tags
- Detail resolution:
  - Use `findSkillByPath(skills, owner, slug)`.
  - If not found:
    - call `notFound()`;
    - set no-index metadata.
- Page content:
  - Show core metadata (`owner`, `runtime`, `tags`, `updatedAt`, `path`, links).
  - Show enriched body summary above fallback metadata block.
  - Add right sidebar with definition/source links and “back to index” actions.
  - Keep visual language consistent with `AppShell` side panels.

### 5) Add structured data component

- **File:** `components/seo/SkillJsonLd.tsx` (new)
- Server-only JSON-LD emitter.
- Use conservative schema:
  - `@type: CreativeWork`
  - fields: `name`, `description`, `url`, `author`/`creator`, `keywords`, `dateModified`.

### 6) Add discovery files

- **File:** `app/sitemap.ts` (new)
  - Export `MetadataRoute.Sitemap`.
  - Include entries for:
    - `/`
    - `/skills`
    - each `/{owner}/{slug}` path from index
  - Use `updatedAt` for `lastModified` where available.
  - Respect trailing slash output format.

- **File:** `app/robots.ts` (new)
  - Emit base allow rules and sitemap URL.
  - Include:
    - `sitemap: 'https://skillcraft.gg/sitemap.xml'`
    - `rules: [{ userAgent: '*', allow: '/' }]`
  - Optional: disallow `/loadouts` and `/credentials` until those routes are active.

## Implementation sequence

1. Update nav enablement.
2. Create `lib/skillEnrichment.ts`.
3. Implement `app/skills/page.tsx` + list UI composition.
4. Implement `app/skills/[owner]/[slug]/page.tsx` (+ `generateStaticParams`, `generateMetadata`).
5. Add JSON-LD component and embed in detail route.
6. Add `app/sitemap.ts` and `app/robots.ts`.
7. Build locally and verify generated artifacts.

## Validation checklist

- `npm run build` completes successfully.
- Output includes:
  - `out/skills/index.html`
  - `out/skills/{owner}/{slug}/index.html`
  - `out/sitemap.xml`
  - `out/robots.txt`
- `/skills` and detail routes render valid content using `AppShell`.
- Every skill detail page has unique title and meta description.
- Sitemap contains the full skill URL set.
- JSON-LD output is valid JSON in rendered detail pages.
- Missing skill path resolves cleanly to `not-found`.

## Optional follow-ups

- Expand enrichment parser to include:
  - first heading + short paragraph extraction
  - list/section-aware truncation
- Add schema enhancements (`SoftwareSourceCode`, `Person/Organization` for owner) if data becomes reliable.
- Add optional canonical redirects for mixed-case slugs/legacy path forms.

## Decision points

- D1: Structured data schema is set to `CreativeWork` (decision confirmed).
- D2: Robots policy is set to disallow placeholder routes (`/loadouts`, `/credentials`).

### D1 details

- Chosen: `CreativeWork`.
- Rationale: safest, lowest-risk schema for initial rollout; works well with partial metadata and avoids strict validation requirements.

### D2 details

- Chosen: disallow placeholder routes while they remain unimplemented.
- Rationale: keeps crawl budget focused on high-signal pages and avoids thin/placeholder indexing.
- Scope: apply this in `app/robots.ts`.
