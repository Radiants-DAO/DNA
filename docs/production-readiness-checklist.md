---
type: "note"
---
# Production Readiness Checklist

Regenerated 2026-04-15 from codebase audit against archived checklist (`archive/reports/2026-03-27-production-readiness-checklist.md`). Stale/completed items removed. New work added.

**Context**: Solo dev (+ Claude Code) preparing for handoff to 4 devs. Visual quality is top priority. Mobile is a launch blocker.

***

## How to Read This

* **T0**: Fix now. Small effort, prevents surprises.

* **T1**: Component visual quality. The embarrassment tier.

* **TP**: Launch polish pass (cross-cutting polish batch).

* **T2**: Mobile rebuild. Launch blocker, ground-up rework.

* **T3**: App content & functionality.

* **T4**: Tooling & infrastructure.

* **T5**: Motion pipeline.

* **T6**: Documentation & cleanup.

* **T7**: Post-launch.

Items marked `[explore]` need investigation before scoping.

***

## T0 — Fix Now

* [ ] `:focus-visible` uses `box-shadow` only — add `outline` fallback for Windows High Contrast Mode (`@media (forced-colors: active)`). Target: `packages/radiants/base.css`

***

## T1 — Component Visual Quality

42 core components in `packages/radiants/components/core/`. 43 test files exist (~100% coverage). The remaining visual work:

### T1a — Slider

* [ ] Add fader variant (vertical, elongated track)
* [ ] Add stepped variant with visual tick marks (not just `step` prop)

### T1b — Form Controls

**Select:**

* [ ] Verify dropdown clipping at window edges (Base UI Positioner should handle, needs visual QA)

### T1c — Dropdown Unification

* [ ] All dropdowns (ContextMenu, DropdownMenu, Menubar, NavigationMenu, Select, Combobox) share same hover/press patterns
* [ ] `[explore]` Shared dropdown overlay primitive they all consume

### T1d — Cross-Cutting

* [ ] Audit string props that should be toggle groups or booleans (e.g., "orientation")
* [ ] HelpPanel replacement: SidePanel inside AppWindow (app-window priority) OR fullscreen. Same two-tier pattern for Sheet, Dialog.

### T1e — Missing Components

* [ ] AppWindow layout presets (pre-defined content layouts for app windows)
* [ ] StartMenu as RDNA component (currently rad-os only at `apps/rad-os/components/Rad_os/StartMenu.tsx`)
* [ ] Widget component defaults
* [ ] `[explore]` System 7-inspired OS patterns

***

## TP — Launch Polish Pass

Cross-cutting polish batch identified 2026-04-16. Groups visual/content/docs polish that should land before launch but doesn't belong in any single tier.

### TP1 — Studio App Ctrl Polish

* [ ] `@rdna/ctrl` polish pass across the Studio app — swap ad-hoc controls for ctrl primitives, align spacing/density, verify light+dark parity

### TP2 — CMD-K Menu

* [ ] Design polish pass on the CMD-K menu (layout, typography rhythm, hover/selected states, result grouping, empty state)

### TP3 — Pretext

* [ ] Pretext review + polish pass — audit authored pages, fix layout regressions, tighten authoring primitives, refresh broadsheet/editorial/book samples

### TP4 — Manifesto Rewrite

* [ ] Update Manifesto: new version copy, embed images, render through Pretext (replaces current ManifestoBook flow)

### TP5 — AboutApp Post-Manifesto

* [ ] Rewrite AboutApp to follow the new manifesto (tone, structure, references); fold in real team/contributor content (supersedes T3 AboutApp placeholder item)

### TP6 — Skills & Docs Cleanup

* [ ] Finish skills audit/cleanup (see T5 Skills Audit) and produce docs — skills index, authoring guide, per-skill usage notes

### TP7 — Logo Builder

* [ ] Replace logo panes in BrandAssetsApp with a Logo Builder (compose/recolor/export configurable logo lockups instead of static panes)

### TP8 — Colors Page → Swatches Picker

* [ ] Layout revamp on the colors page — "Swatches" picker approach: swatch grid on the left, card explainer (token name, value, usage, contrast) on the right

### TP9 — Type Specimen

* [ ] Type specimen updates/cleanup — scale samples, family showcases, pairing examples, remove stale states, align with current type scale

### TP10 — Pixel Art Tab Editors

Lives in Studio (see T3 Studio Phase 2). Pulled forward as launch polish since pixel corners is unblocked now.

* [ ] Pixel corner editor (unblocked — can start now)
* [ ] Pixel icon editor (16px / 24px sets)
* [ ] Pattern editor (larger pull — depends on pattern metadata format stabilizing)

***

## T2 — Mobile Rebuild

Launch blocker. Complete absence of mobile UI — nothing exists yet.

* [ ] Design + implement mobile app drawer / launcher (bottom nav, smooth UX)
* [ ] Replace hidden Taskbar with mobile nav component
* [ ] Make Start Menu reachable on mobile
* [ ] Add `touch-action: none` to drag/resize handles (0 instances in codebase)
* [ ] Fix touch on pixel art canvas (fluid canvas sizing, RDNA color tokens)
* [ ] Fix touch on audio seek bar (proper ref pattern already exists, needs touch testing)
* [ ] Audit all apps in mobile mode for usability at narrow widths
* [ ] `[explore]` Reference: app drawer pattern, Apple System 7 mobile patterns

***

## T3 — App Content & Functionality

### StudioApp — Creative Hub

**Phase 1 — Pixel Art Editor** ✅ (functional at `apps/rad-os/components/apps/studio/`)

**Phase 2 — Asset Editors** (depends on `@rdna/pixel` maturity)

* [ ] Pixel corner editor — author corner bitstrings via canvas, export to `PixelCorner` SVG
* [ ] Pattern editor — author pattern tiles, export to pattern metadata format
* [ ] Icon editor — author 16px / 24px icons into the icon set
* [ ] `[explore]` Single unified editor with mode selector vs. separate windows per asset type
* [ ] Shared canvas toolkit between editors

**Phase 3 — Community Gallery**

* [ ] Gallery view — inside Studio window (tab?) or separate catalog entry? `[explore]`
* [ ] Submission flow — save artwork + metadata
* [ ] Voting / favoriting — storage decision needed `[explore]`
* [ ] Feed / curation logic
* [ ] Moderation model `[explore]`

**Phase 4 — Polish**

* [ ] Studio grid color hardcoded `#0f0e0c20` in `CanvasArea.tsx:44` — derive from theme at runtime (invisible in dark mode)
* [ ] Touch support audit (Dotting has `isPanZoomable={true}`, draw-on-touch is unknown)
* [ ] Mobile layout (depends on T2)
* [ ] Export scale options (1×/2×/4×)
* [ ] Keyboard shortcuts

### RadRadio

* [ ] Add more local tracks
* [ ] Fix widget mode readability (black text on black background) — needs verification
* [ ] `[explore]` Hardcoded semantic hex values in BrandAssetsApp — auto-derive from tokens?

### Content

* [ ] AboutApp: fill in real team names, contributors, acknowledgments (currently placeholder roles only)

***

## T4 — Tooling & Infrastructure

### Visual Regression

* [ ] Pilot Playwright visual regression on T1 components (config exists at `apps/rad-os/playwright.config.ts`, tests minimal)
* [ ] Keep manual `/qc-visual` as second layer
* [ ] Add Argos CI once baseline is stable
* [ ] Bridge automated QC findings into Playground annotations

### ESLint

* [ ] Add `@eslint/css` coverage for token, pattern, and authored CSS files (0 CSS linting currently)
* [ ] `[explore]` CI automated lint/test runs

### Component Metadata

* [ ] Generate `.dna.json` for 42 core components (0 exist today)
* [ ] Add axe-core accessibility coverage for core RDNA components

### Playground

* [ ] Add state-matrix rendering (variants × states × themes)
* [ ] Add CDP pseudo-state forcing for hover/focus/active capture
* [ ] Add dagre auto-layout to PlaygroundCanvas

***

## T5 — Motion Pipeline

### Hardcoded Duration Migration

32 hardcoded `duration-*` instances across 20 components in `packages/radiants/components/core/`. Semantic motion tokens exist in `tokens.css` (`--duration-fast`, `--duration-base`, `--duration-moderate`, `--duration-slow`). ESLint rule `rdna/no-hardcoded-motion` exists at `warn`.

* [ ] Replace hardcoded Tailwind durations with motion tokens across 20 component files
* [ ] Flip `rdna/no-hardcoded-motion` from `warn` to `error` after migration
* [ ] Enforce max 300ms motion rule from spec

### Reduced Motion

`prefers-reduced-motion` is handled at the CSS token level (`tokens.css` sets all durations to 0ms). Only `WebGLSun` has a per-component JS listener. Only 2 files in radiants reference it.

* [ ] Audit components with JS-driven animation (canvas, rAF loops) for reduced-motion compliance
* [ ] Wire `prefers-reduced-motion` through any component using `requestAnimationFrame`

### Skills Audit

5 project-local skills exist in `.agents/skills/`. The ~50 user-scoped skills audit hasn't happened.

* [ ] Audit user-scoped skills for relevance, overlap, quality
* [ ] Design new skills library structure
* [ ] Create project-specific skills (app scaffolding, visual QA, deployment, code review)
* [ ] Create motion-specific skills and lint rules

***

## T6 — Documentation & Cleanup

* [ ] Session files: **4,993 files / ~19MB** in `ops/sessions/` — mine for potential skills, then purge

***

## T7 — Post-Launch

* [ ] SoundCloud OAuth integration
* [ ] Boot/splash screen `[explore: desired?]`
* [ ] Dithered animations/gradients `[explore]`
* [ ] WebGL fallback for browsers without WebGL support
* [ ] `data-start-button` click guard
* [ ] CI test pipeline

### Optional Bonuses

* [ ] Shared motion duration scalar (`calc(Xms * var(--duration-scalar))`)
* [ ] Add Syncpack to dependency hygiene
* [ ] Add Figma Code Connect `.figma.tsx` mappings
* [ ] Explore fluid `clamp()` typography
* [ ] Explore Capsize metrics for tighter vertical rhythm

***

## New Work (not in original checklist)

These packages landed after the original checklist was written and have their own roadmaps:

| Package        | Status  | Notes                                                                                   |
| -------------- | ------- | --------------------------------------------------------------------------------------- |
| `@rdna/ctrl`   | Active  | Control surface library (30+ controls/selectors/readouts). Preview at `/ctrl-preview`.  |
| `@rdna/pixel`  | Active  | 1-bit pixel engine (grids, renderers, transitions, icons). Preview at `/pixel-corners`. |
| Pretext system | Active  | Layout editor with broadsheet/editorial/book modes, serialization, authoring primitives |

***

## Dependency Graph

```text
T0 (focus-visible HCM) ───────────────────────► can start immediately (1 file)
T1 (components) ───────────────────────────────► can start immediately
  T1a (slider variants) ──► independent
  T1c (dropdown unification) ──► after individual QA
  T1d (cross-cutting) ──► after core components stable
  T1e (missing components) ──► after T1d
TP (launch polish) ────────────────────────────► parallel with T1
  TP1 Studio ctrl polish ──► after @rdna/ctrl stable
  TP3 Pretext polish ──► blocks TP4 manifesto rewrite
  TP4 Manifesto ──► blocks TP5 AboutApp rewrite
  TP6 Skills docs ──► after T5 skills audit
  TP10 Pixel editors ──► corner editor now, pattern editor after format stable
T2 (mobile) ───────────────────────────────────► after T0, benefits from stable T1
T3 (apps) ─────────────────────────────────────► Studio Phase 2 after @rdna/pixel
  AboutApp content ──► independent, anytime
T4 (tooling) ──────────────────────────────────► parallel with T1
  .dna.json ──► after T1 stabilizes
T5 (motion) ───────────────────────────────────► mechanical duration swap can start now
  Skills audit ──► parallel with anything
T6 (docs) ─────────────────────────────────────► parallel with anything
T7 (post-launch) ──────────────────────────────► after launch
```

⠀
