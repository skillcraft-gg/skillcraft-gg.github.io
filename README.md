# skillcraft.gg Static Site (Next.js)

This repository publishes the canonical `skillcraft.gg` site on GitHub Pages.

- Static, no backend
- Generated pages for route index, skills index, and skill/credentials detail routes
- Loadout routes remain placeholders until implemented
- Rebuild workflow via workflow_dispatch or repository_dispatch

## Local development

- Install dependencies:

```bash
npm install
```

- Generate pages:

```bash
npm run build
```

Generated output is written to `out/` for GitHub Pages deployment.

For local preview, run `npm run dev` and open `http://localhost:3000`.

If you change templates, rerun:

```bash
npm run build
```

before refreshing.

## Useful commands

- `npm run build` — generate the full static site from `https://skillcraft.gg/skills-registry/search/index.json`
- `npm run dev` — start the Next.js dev server

## Current route map

- `/`
- `/docs`
- `/skills`
- `/skills/<owner>/<slug>`
- `/loadouts`
- `/credentials`
- `/credentials/<owner>/<slug>`
- `/credentials/profiles`
- `/credentials/profiles/github/<github>`
- `/credentials/profiles/github/<github>/<owner>/<slug>`
- `/loadouts/<owner>/<slug>` (route placeholder)

## GitHub Actions

- Workflow file: `.github/workflows/publish.yml`
- Triggers:
  - manual `workflow_dispatch`
  - repository events: `skills-update`, `loadouts-update`, `credentials-update`, `rebuild`
- Build step runs `npm run build`, copies static output, uploads Pages artifact, and deploys.
