# Portfolio site: "Bitmap" design spec

- **Date:** 2026-10-12
- **Owner:** Jared Chester (GitHub `jmc07712`)
- **Status:** Approved by Jared, 2026-10-12
- **Reference prototypes (not shipped):** `prototypes/bitmap.html` (chosen direction), `prototypes/petabyte.html` (particle donor), `prototypes/fusion.html` (the two combined)

## 1. Goal

A personal portfolio that is remembered after one visit and still answers the practical questions fast.

**Audience:** hiring managers, engineering leaders, recruiters, founders.

**Success criteria**
1. Within 30 seconds a visitor knows Jared is a senior engineer who builds AI agents and very large data systems, and has seen at least one real metric.
2. Work and contact are reachable in one click or keystroke from first paint, without learning the OS metaphor.
3. The signature visual runs at 60fps on a recent laptop, degrades gracefully, and never blocks reading.
4. On a phone the site is calm and pleasant:
   - It's one-handed and thumb-reachable, with nothing to drag or close.
   - Scrolling is never hijacked.
   - The scene is light enough not to warm the phone or drain the battery.
5. Lighthouse (mobile) Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO = 100.
6. Every fact on the site traces to the resume; nothing is invented. The phone number is never published.

## 2. Concept

A one-person operating system rendered in exactly two inks: paper `#C9CEBB` (an unlit reflective LCD) and ink `#262E1B` (deep olive). Every grey is a 1-bit dither mask.

**Signature: one GPU, one dither.** A single WebGL2 renderer draws a raymarched "agent hub" and 262,144 GPU particles into one low-resolution luminance buffer. The hub is a breathing core with six tool nodes on tethers and a gateway ring. One 8×8 Bayer pass then reduces the whole frame to the two inks at a 3px pixel scale. The agent stands for Jared's agent work; the particles stand for his data scale.

| Moment | What happens |
|---|---|
| Boot | Particles stream in on curl-noise currents and spell "Jared Chester" in Jersey 10. The name implodes into the agent core as the hub resolves, then the icons and the About window appear. Any input skips to the end state. |
| Wallpaper | Particles are data in flight along the tethers between the core and the tool nodes. They surge when a tool dives in (a tool call), and the cursor scatters them. One line of copy: each point stands for about 4,578 of the 1.2B records a month served by the Insights API. The copy is computed from the live particle count, so Pocket mode's 32,768 points read about 36,621. |
| Experience | Opening the Experience window pours particles out of the hub into the three role bars of the career trace. Closing it returns them. |

Everything else is quiet. Motion only answers the user: drag, open, close, select.

## 3. Content

`src/content/resume.ts` is the single typed source of truth. Components never hard-code facts.

- **Identity:**
  - Name, title (Senior Software Engineer, L6, promoted 2025), and location.
  - Email: `jared.m.chester516@gmail.com`
  - GitHub: `https://github.com/jmc07712`
  - LinkedIn: `https://www.linkedin.com/in/jared-chester-52b76a190/`
  - Source of this site: `https://github.com/jmc07712/personal-site`. It appears in the menubar ("Source"), in the About window footer, in Contact and in the Pocket footer.
  - No phone number.
- **Roles:**
  - Tischfield Lab: Sep 2018 – May 2021
  - AT&T Chief Security Organization: Jul 2021 – Jul 2022
  - Amazon Ads: Aug 2022 – present
- **Amazon systems** (child spans, oldest first). Each carries its real metrics as typed attributes. Approximate years come from Jared's own impact summary and are labelled approximate.

  | System | Approx. years |
  |---|---|
  | Cross-VPC pseudonymization cache | 2022–2023 |
  | Insights data store | 2023–2024 |
  | Insights API | 2023–2025 |
  | 3PM study recommendations | 2024–2025 |
  | Spark/EMR orchestration service | 2025 |
  | Pitching Agent | 2025–now |
  | Org agent architecture | 2026–now |
  | GenAI adoption | 2025–now |

  GenAI adoption covers an org-wide tech talk series, co-authoring the org's GenAI adoption plan, and shared developer tooling: an LLM-as-judge code reviewer and a docs knowledge base for coding agents.
- **Public-safe additions from the impact summary,** generalized:
  - The Pitching Agent connects 40+ MCP tools.
  - The pseudonymization migration was a 4-phase shadow-then-dial-up rollout, fully migrated in 3.5 weeks. Cache hit rates were 97–99% in all three regions.
  - Mentoring of new grads and promotion-panel participation.
- **Event:** Rutgers B.S. Computer Science, minor in mathematics, summa cum laude, May 2021.
- **Products,** newest first. Each has its own desktop icon and window.
  - **Counterdex** (latest; `counterdex.vercel.app`, source `github.com/jmc07712/counterdex`):
    - A Pokémon team builder: teams of up to six from about 1,350 Pokémon, a counter team for any team, and alerts when PokéAPI changes a Pokémon on your team.
    - Stack: a React/Vite/TanStack Query frontend and a FastAPI/SQLAlchemy/Alembic backend on Postgres 17 (Neon), both on Vercel under one domain.
    - Highlights:
      - Change detection: a sync of about 3,000 requests in about 10 s fingerprints each Pokémon and keeps before/after snapshots.
      - Counter teams: pairwise matchup scoring with a greedy builder, instead of searching about 1.6 quadrillion teams.
  - **Docly** (askdocly.com).
  - **DateEscape** (dateescape.app).
- **Skills list.**

Child spans use the approximate years above; the legend marks them "approx." The data model takes `from`/`to` per span as month precision, with a `approx: true` flag.

**Confidentiality rule (hard):** the site never publishes any of the following.
- Amazon-internal codenames, such as program, service, team, org and framework names. Use descriptive names instead.
- Colleagues' names.
- Performance-review quotes.
- Internal links.
- Internal business metrics beyond those already on the resume.
- Launch/GA dates.
- Anything from privileged or confidential program material.

The impact summary file itself is never committed.

**Enforcement:** a unit test hashes every word and bigram in all content and fails if any matches a SHA-256 hash in a denylist. The denylist holds hashes, not words, so the banned terms never appear in the public repo. The same test fails on any phone-number pattern.

## 3a. Case files (click-through detail)

Every span in the Experience trace opens a **case file**: a document window with the deeper story. There are ten:
- The eight Amazon systems.
- AT&T OAuth/OIDC.
- Tischfield behavioural syllables.

**Contents of each case file** (`src/content/caseFiles.ts`, typed):
- Title, role and approximate dates.
- A one-line summary.
- **Problem:** what was slow, manual or broken.
- **What I built.**
- **Diagram:** a 1-bit schematic of nodes and edges laid out on a coarse grid, rendered as pixel SVG in the two inks.
- **Key decisions:** two to four judgment calls, each with its reason.
- **Impact:** real numbers only.
- **Stack.**

**Behaviour:**
- **Desktop:** selecting a span shows its metrics in the inspector, as today, with an "Open case file" button. Double-click or Enter on a row also opens it. Case-file windows can be dragged like any other, and several can be open at once.
- **URLs:** each case file has a prerendered route `/work/[slug]` with its own metadata.
  - Loading that URL renders the desktop with the case file already open.
  - Opening and closing a case file updates the URL with `history.pushState`/`replaceState`.
  - The browser back button closes it.
- **Pocket mode:** an expanded role row shows "Read the case file", which opens the file as a full-screen sheet with a back control. The URL behaves the same way.

**Content gate:** case-file copy is generalized from Jared's impact summary under the confidentiality rule. Jared skims all case-file copy before the first public push.

## 3b. Writing (blog)

A place for Jared to publish. In the OS it is the **Writing** app.

**Authoring:**
- Posts are MDX files in `src/content/posts/<slug>.mdx`. Each exports `metadata = { title, date: 'YYYY-MM-DD', summary, tags: string[], draft?: boolean }`.
- Drafts are excluded from production builds, the index, the sitemap and the feed.

**Routes**, all prerendered:
- `/blog`: the desktop with the Writing window open.
- `/blog/[slug]`: the desktop with that post open in a reading window.
- `/feed.xml`: RSS 2.0.
- Each post has its own title, description, canonical URL and Open Graph metadata.

**Desktop:**
- A Writing icon opens a window listing posts newest first: date, title, one-line summary.
- Opening a post opens a large reading window. It fills the desktop below the menubar, with a 68ch measure, 19px Atkinson body text, Jersey 10 headings, and code blocks in ink on a 25% dither.
- URL sync and back-button behaviour match the case files.

**Pocket mode:** a Writing section in the scroll and a fifth dock item. A post opens as a full-screen sheet.

**Launch content:** the first post is "How this site works": one GPU, one dither, transform-feedback particles, and the cut-out trick. Claude drafts it from the real implementation, Jared edits it, and it ships only once he approves it (otherwise `draft: true`).

## 4. Visual system

- **Colour:** two tokens only, `--paper` and `--ink`. Contrast is 8.75:1. Tints are dither masks at 25/50/75% plus a hatch, delivered as tiny inline SVG or CSS patterns.
- **Type:**
  - Jersey 10 for chrome, the name, numbers and window titles. Sizes are whole multiples of its 10-unit grid, with font smoothing off so glyphs stay 1-bit.
  - Atkinson Hyperlegible Next for body copy.
  - Both load through `next/font/google`, self-hosted with no layout shift.
- **Chrome:** 1px rules, a hatched title bar, a 3px hard offset shadow drawn as a dither pattern (not a blurred shadow), pixel icons drawn from a 16×16 bitmap table rendered to SVG.
- **Layout:**
  - ≥ 1180px: free desktop, icons on the right, windows positioned in-flow and draggable.
  - 769–1179px: icons become a dock; windows still drag.
  - ≤ 768px: Pocket mode (§4a), a separate composition rather than a shrunken desktop.

## 4a. Mobile: Pocket mode (≤ 768px)

On a phone the site should feel calm, like a handheld e-ink device: same two inks and fonts, one column, nothing to manage.

1. **Order:** a slim menubar (name and clock only), then the name large with one line of positioning, then the scene as a calm square "screen", then the sections.
2. **Navigation:**
   - A sticky bottom dock in the thumb zone with four pixel icons and labels: About, Work, Projects, Contact.
   - Tapping smooth-scrolls to the section, and the dock marks the current section.
   - It respects `env(safe-area-inset-bottom)`. Tap targets are ≥ 44px.
3. **Light chrome:** a title-bar line only. No close buttons, dragging, offset shadows or z-order.
4. **Work as a vertical trace:**
   - Each role is a full-width row with a thin bar showing its share of Sep 2018–now.
   - Tapping a role expands its systems (accordion); tapping a system expands its metrics inline.
   - Nothing depends on hover.
5. **Projects:** Counterdex, Docly, DateEscape as a simple vertical list with links.
6. **Calm, battery-friendly GPU:**
   - 32,768 particles, capped at 30fps, with a chunkier pixel scale and fewer raymarch steps.
   - It renders only while the scene is on-screen.
   - The boot is shortened to about 1.2s and plays once per session (`sessionStorage`).
   - `touch-action: pan-y` on the canvas, so the scene never fights scrolling. A tap sends a gentle ripple through the particles.
   - **The screen sleeps:** after about 20s without interaction the scene freezes to a still frame with a small "Tap to wake" label, and a tap wakes it.
   - `prefers-reduced-motion` or `Save-Data` gives a static frame and no boot.
7. **Type:** body text ≥ 17px Atkinson; Jersey 10 at its grid sizes.

## 5. Architecture

**Stack:** Next.js (latest stable, App Router) and TypeScript in strict mode. Every route is prerendered to static HTML, with no server runtime. Plain CSS with custom properties, using CSS Modules per component plus one global token sheet. No UI library.

```
src/
  app/
    layout.tsx            fonts, metadata, analytics, skip link
    page.tsx              the desktop (server component shell)
    work/[slug]/page.tsx  same desktop, case file pre-opened; generateStaticParams + per-file metadata
    blog/page.tsx         desktop with Writing open
    blog/[slug]/page.tsx  desktop with the post open; per-post metadata
    feed.xml/route.ts     RSS 2.0, statically generated
    opengraph-image.png   static dithered capture of the scene
    sitemap.ts, robots.ts
    globals.css           tokens, dither masks, base type
  content/
    resume.ts             typed facts (section 3)
    caseFiles.ts          typed case files (section 3a)
    posts/*.mdx           blog posts (section 3b)
  lib/
    dates.ts              month math, durations ("2 y 8 mo")
    trace.ts              spans → waterfall geometry (pure)
  components/
    os/
      Desktop.tsx         client: owns WindowManager context
      windowManager.ts    reducer: open, close, focus, move; z-order (pure)
      Window.tsx          chrome, drag (pointer events), focus, close/reopen
      MenuBar.tsx, Clock.tsx, Icon.tsx, PixelIcon.tsx
    apps/
      About.tsx, Experience.tsx (TraceWaterfall + Inspector),
      Product.tsx (one component, three instances: Counterdex, Docly, DateEscape),
      Contact.tsx
      CaseFile.tsx        case-file document window / Pocket sheet
      Schematic.tsx       1-bit node/edge diagram → pixel SVG
    gpu/
      SceneCanvas.tsx     client wrapper: mount, resize, visibility, reduced motion
      renderer.ts         framework-free class: init / setPointer / setCutouts / setMode / dispose
      shaders/*.glsl.ts   raymarch, particle update (transform feedback), particle draw, dither
      fallback.ts         CPU-dithered still for no-WebGL2
tests/
  e2e/*.spec.ts           Playwright
  unit/*.test.ts          Vitest (dates, trace, windowManager)
```

### Boundaries
- `renderer.ts` knows nothing about React. Its inputs are the pointer position, a list of cut-out rectangles in device pixels, and a mode (`boot`, `wallpaper` or `experience`). Its output is pixels.
- `SceneCanvas` translates React state into those calls.
- The window manager is a pure reducer, so it is unit-testable. Window components only dispatch.
- `trace.ts` turns resume data into waterfall geometry (percent offsets and labels). Both the DOM waterfall and the particle targets use it, so they can never disagree.

### Data flow for the Experience moment
1. The Experience window's three role-bar cells are transparent cut-outs.
2. Each animation frame, `SceneCanvas` reads their `getBoundingClientRect()` and hands them to the renderer.
3. Inside those rects, the dither shader suppresses the hub and draws paper plus particles. Particle targets are sampled inside the same rects.
4. The canvas sits beneath every window, so overlapping windows and dragging occlude correctly with no extra work.

## 6. Accessibility

- All window content is server-rendered semantic HTML: headings, lists, tables for metrics. A closed window keeps its content in the document under a visually-hidden region, so search engines and screen readers get everything. A "Skip to content" link jumps straight to About.
- **Keyboard:**
  - Icons are buttons; Enter opens.
  - Windows are focusable regions with a visible 2px focus ring in ink.
  - Escape closes the focused window.
  - Arrow keys move through the trace rows.
  - The menubar mirrors every icon.
- `prefers-reduced-motion`: no boot, static scene frame, no particle motion. The "Pause scene" control persists the choice in `localStorage`.
- The canvas is `aria-hidden`. The caption describes the scene in text.

## 7. Performance

- **Budgets:** first-load JS ≤ 130 KB gzip. LCP element is the About window text, not the canvas. CLS = 0.
- The renderer starts after first paint (`requestIdleCallback` fallback to timeout) and pauses when the tab is hidden or the canvas is off-screen.
- DPR is capped at 2.
- **Particle tiers:** 262,144 on desktop and 32,768 in Pocket mode, capped at 30fps. Any device drops one tier when a frame-time probe exceeds budget.
- Without WebGL2, a CPU-dithered still is drawn once.

## 8. SEO and sharing

- `metadata` sets title, description and canonical (Vercel URL for now; the custom domain later).
- An Open Graph and Twitter image: a static dithered capture of the scene with the name.
- `sitemap.ts`, `robots.ts`, and JSON-LD `Person` with `sameAs` GitHub and LinkedIn.
- Vercel Web Analytics (`@vercel/analytics`): cookieless, no consent banner needed.

## 9. Testing

- **Unit (Vitest):**
  - date math (durations, month labels)
  - trace geometry (spans map to correct percentages; children clamp inside their parent)
  - window manager reducer (open, close, focus order, move)
  - Content guard: no denylisted terms (hashed), no phone-number pattern, unique slugs, every trace span has a case file.
- **E2E (Playwright, Chromium):**
  - The page loads with zero console errors.
  - Skipping the boot reaches the final state.
  - Icons open windows; Escape closes them; dragging moves a window.
  - Selecting a trace row updates the inspector.
  - At 390×844 and 430×932 there is no horizontal scroll.
  - The dock reaches every section and marks the current one.
  - Work accordions expand and collapse.
  - The scene sleeps after idle and wakes on tap.
  - On desktop, selecting a span and choosing "Open case file" opens it and changes the URL to `/work/<slug>`.
  - Loading `/work/<slug>` directly shows the case file open.
  - Back closes the case file.
  - In Pocket mode, the case file opens as a sheet.
  - `/blog` lists posts; opening one changes the URL to `/blog/<slug>` and Back closes it.
  - `/feed.xml` is valid RSS containing every published post.
  - Drafts don't appear in production.
  - With reduced motion there is no boot.
- **CI gate:** `npm run lint && npm run typecheck && npm test && npm run build`.

## 9a. Code quality (the repo is part of the portfolio)

Recruiters and interviewers will read this code, so it is held to production standards.

- **TypeScript:** `strict`, `noUncheckedIndexedAccess`, no `any`, no non-null assertions outside tests.
- **Lint and format:** ESLint (Next core-web-vitals + TypeScript rules) with zero warnings; Prettier, checked in CI.
- **Small modules with one job each:**
  - Pure logic lives in `src/lib`, framework-free and unit-tested.
  - Components stay under about 200 lines.
  - The renderer splits into shader sources, the particle system, the raymarch pass and the dither/compose pass.
- **Comments and errors:**
  - Comments explain *why*. Exported functions in `src/lib` and `src/components/gpu` get short doc comments.
  - No dead code, no commented-out code, no TODOs on `main`.
- **CI:** GitHub Actions runs format check, lint, typecheck, unit tests, build and Playwright e2e on every push and PR. The README shows the badge.
- **README:** what it is, a live link, an architecture overview with a diagram, how the scene works, project layout, scripts, testing, the content and confidentiality guard, and deployment.
- **Commits:** focused, conventional-commit messages.
- **License:** MIT for the code; written content (resume facts, case files, posts) © Jared Chester, stated in the README.
- **Docs:** the approved design lives at `docs/design.md`. Working implementation plans stay local and are not committed.

## 10. Delivery

1. The local repo is at `~/Code/personal-site`; the public GitHub repo is `jmc07712/personal-site`, with default branch `main`.
2. The Vercel project is linked to the GitHub repo. Pushing to `main` deploys to production at `*.vercel.app`; pull requests get preview URLs.
3. The custom domain is added later in Vercel, and canonical/metadata `metadataBase` switches to it.
4. The README covers what it is, how to run it, the scene's technique, and the content source of truth.

## 11. Out of scope (for v1)

- The Lab folder or alternate themes (explicitly declined).
- The agent console.
- A CMS (posts are MDX files in the repo).
- A downloadable resume PDF, because the current PDF contains the phone number.
- Multi-language support.

## 12. Open questions

1. The custom domain name, to set `metadataBase` once it's attached.

Resolved: the Amazon system dates (approximate years from Jared's impact summary) and LinkedIn (added).
