# Design System: Skillcraft Landing Shell (Current Implementation)

This document reflects the implemented UI state in this repository revision: a
single-page, homepage-first experience with an atmospheric hero shell, compact
top navigation, and supporting fallback behavior for unavailable routes.

---

## 1. Scope and Product Mode

- Primary user experience is the homepage at `/`.
- Other historical routes are intentionally unavailable in app routing:
  - `/loadouts`, `/loadouts/[owner]/[slug]`
- Navigation items for non-home sections remain visible but disabled.
- GitHub route remains active in top nav and in page CTA.

---

## 2. Visual Foundations

### 2.1 Color Tokens

Defined in `app/globals.css` `:root`:

- Backgrounds: `--bg #07050d`, `--panel rgba(11, 12, 22, 0.48)`,
  `--panel-strong rgba(15, 16, 28, 0.66)`
- Text: `--text #f7f4ef`, `--muted rgba(247, 244, 239, 0.9)`,
  `--muted-2 rgba(247, 244, 239, 0.72)`
- Borders/lines: `--line rgba(255, 255, 255, 0.10)`,
  `--line-strong rgba(255, 255, 255, 0.18)`
- Accent: `--yellow #fde330`, `--yellow-2 #ffe56a`, `--cyan #63d8ff`
- Shadow: `--shadow 0 30px 80px rgba(0, 0, 0, 0.45)`

### 2.2 Typography

- Sans stack: `var(--font-sans)` = `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Display stack: `var(--font-display)` = `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
- Common scales:
  - Base body: `15px`
  - Hero title: `clamp(48px, 7.8vw, 76px)`
  - Hero lede/workflow text: `clamp(15px, 1.2vw, 17px)`
  - Terminal code: `clamp(14px, 1.35vw, 18px)`

### 2.3 Spacing and Layout Scale

- Content max width: `--content-max-width 1280px`
- Horizontal side padding: `--content-side-pad 72px`
- Shell scale: `--content-scale 0.975` desktop, `1` at `max-width: 1180px`
- Hero left accent strip width: `--hero-edge-strip-width` defaults `3em`
  - `2em` at `<=980px`
  - `1em` at `<=640px`

### 2.4 Radius and Effects

- Borders/pills: high radius (`999px`) for nav and buttons.
- Cards/panels: rounded corners between `16px` and `22px` (`terminal`, `.side-panel`, `.section`).
- Layered glass effect implemented via `backdrop-filter` and semitransparent gradients.
- Background motion is intentionally subtle (`bgFloat`, `swirlPulse`, `charFloat`) with
  long durations.

---

## 3. App Structure and Shell

### 3.1 App Shell Composition

`AppShell` (`components/AppShell.tsx`) composes:

- Root visual layer: `.hero`
- Background layers: `.bg`, `.swirls`, `.char`, `.left-fade`, `.bottom-fade`, `.noise`, `.vignette`
- Foreground content container: `.shell`
- Top navigation: `TopNav`
- Main content container: `.content` and `.copy`

### 3.2 Routing Surface

- Active page shell is mounted from page components:
  - `app/page.tsx` for home
  - `app/not-found.tsx` for fallback
- `ROUTES` in `lib/navigation.ts` controls nav labels, targets, and disabled state.

### 3.3 Homepage Layout

- Single column content flow today: `content--single` is used on home and not-found because side panels are absent.
- Structure under `app/page.tsx`:
  - Hero copy
  - CTA row
  - Tagline
  - `#get-started` anchor section containing workflow copy + terminal demo

---

## 4. Components

### 4.1 Top Navigation (`components/TopNav.tsx`)

- Brand link (`/`) left aligned with image logo.
- Nav tabs in `.top-nav`:
  - Active route uses `.is-active` underline treatment.
  - External links (`GitHub`) render with star glyph.
  - Disabled routes render as `<span className="top-tab is-disabled">` to prevent
    interaction while preserving visual discoverability.

### 4.2 Hero Grid (`app/page.tsx` + `app/globals.css`)

- Title uses `.hero-title` with two lines:
  - `.headline-top`
  - `.headline-accent` in yellow accent.
- `.lede` explains core positioning message.
- `.how-it-works` section provides secondary messaging and anchor target for `Get Started`.

### 4.3 CTA Row and Buttons

- Buttons:
  - Primary flattened style: `.btn-primary.btn-flat`
  - Secondary style: `.btn-secondary`
- GitHub CTA in hero uses inline SVG icon via `.btn-icon` inside the link.
- Global button hover uses subtle `translateY(-2px)` and color/shadow adjustments.

### 4.4 Terminal Block

- Implemented in `.terminal` and `.code` blocks as pseudo-demo terminal output.
- Includes prompt and tokens with differentiated color roles:
  - `.cmd`, `.arg`, `.str`, `.path`, `.cursor`.
- Decorative lighting and noise layers for glass/terminal depth.

### 4.5 Disabled and Missing Routes

- Disabled nav state:
  - Non-interactive tabs use `.top-tab.is-disabled` (`opacity`, `cursor: not-allowed`,
    `pointer-events: none`).
- `app/not-found.tsx` message now directs users back to home and avoids routing to removed sections.

---

## 5. Interaction and Animation

- Smooth in-page navigation via `scroll-behavior: smooth` on `html, body`.
- Fade-in for key containers: `fadeUp`.
- Background micro-animation timings are intentionally restrained:
  - bgFloat: 30s
  - swirlPulse: 14s
  - charFloat: 18s
- Hover motion budget is short and subtle (`180ms` transitions).

---

## 6. Responsive Behavior

- `@media (max-width: 1180px)`
  - Disable shell scale transform and expand width behavior.
  - Maintain two-column content fallback in styles, though home remains single column.
- `@media (max-width: 980px)`
  - Reduce hero strip to `2em`.
  - Top nav stacks and wraps.
  - Content becomes single-column and narrower paddings.
- `@media (max-width: 640px)`
  - Hero strip becomes `1em`.
  - Buttons become full width.
  - Terminal padding/radius and terminal font scale down for mobile legibility.

---

## 7. Accessibility Notes

- Non-interactive nav entries use `aria-disabled="true"` and visual de-emphasis.
- `#get-started` section is discoverable through `Get Started` anchor link.
- Decorative imagery uses `alt=""` + `aria-hidden="true"`.
- External link semantics include `target="_blank"` and `rel="noreferrer"`.

---

## 8. Planned / Not Yet Implemented

The following legacy dashboard patterns are no longer part of the current shipping
state and are intentionally omitted from active design implementation:

- Full multi-section dashboard composition (`sidebar`, `inspector`) for all routes
- Item browsing grids and route-dependent detail pages on `/loadouts` are intentionally omitted while loadouts remain pending.
- Route-dependent complex detail pages beyond current scope

If/when additional sections are reintroduced, they should follow this shell pattern
for visual consistency but may restore a richer panel architecture in future phases.
