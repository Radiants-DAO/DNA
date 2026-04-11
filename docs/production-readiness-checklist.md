---
type: "note"
---
# Production Readiness Checklist

Generated 2026-03-22 from 7-agent codebase audit + 40-question interview.\
Updated 2026-03-22 by 6-agent audit swarm (findings: `archive/research/production-readiness-audit-swarm.md`).\
Full audit data: `archive/reports/2026-03-22-production-readiness-audit.md`.\
Updated 2026-03-26 by Codex from Reforge comparator pass: [CODEX-COMPARISON-REPORT.md](/Users/rivermassey/Desktop/dev/reforge/export/dna/2026-03-26/CODEX-COMPARISON-REPORT.md). Archive refs below resolve under [reforge_archive/2026-03-26-dna-run/reforge-workspace](/Users/rivermassey/Desktop/dev/reforge_archive/2026-03-26-dna-run/reforge-workspace).\
Updated 2026-03-27 by Codex for backend/tooling completions and merge-pass verification.

**Context**: Solo dev (+ Claude Code + Codex) preparing for handoff to 4 devs. Top priority is visual quality — UI bugs are the #1 embarrassment risk. Mobile is a launch blocker. Skills refactor is a prerequisite for motion work.

**Derived planning views**:

* Execution track: `archive/production-readiness/production-readiness-execution-track.md`

* Research track: `archive/production-readiness/production-readiness-research-track.md`

* Mixed track: `archive/production-readiness/production-readiness-mixed-track.md`

Source of truth remains this checklist.

***

## How to Read This

* **T0**: Fix now. Broken imports, dead code, data bugs. Small effort, prevents surprises.

* **T1**: Component visual quality. The embarrassment tier. Largest body of work.

* **T2**: Mobile rebuild. Launch blocker, ground-up rework.

* **T3**: App content & functionality. Features that need to work at launch.

* **T4**: Tooling & infrastructure. Prevents drift, supports handoff.

* **T5**: Skills → Motion pipeline. Sequenced: skills first, motion second.

* **T6**: Documentation & cleanup. Handoff readiness.

* **T7**: Post-launch. Nice-to-haves and future features.

Items marked `[explore]` need investigation before scoping.

***

## T0 — Fix Now

Quick wins that prevent broken builds and confusing code for incoming devs.

### T0 Reforge Critical Fixes (2026-03-26)

* [ ] Rework global `:focus-visible` so Windows High Contrast Mode gets a real outline; keep glow only as a progressive enhancement. Reforge: [CODEX comparison report](/Users/rivermassey/Desktop/dev/reforge/export/dna/2026-03-26/CODEX-COMPARISON-REPORT.md), [token-system accessibility spike](/Users/rivermassey/Desktop/dev/reforge_archive/2026-03-26-dna-run/reforge-workspace/spikes/token-system/src/accessibility.ts). DNA target: [packages/radiants/base.css](../packages/radiants/base.css)

***

## T1 — Component Visual Quality

The largest body of work. Refactor before testing. Grouped by component.

### T1a — Button ✅

* [x] Disabled: reconcile `disabled` prop vs disabled state ✅ CSS handles `[disabled]`, `[aria-disabled="true"]`, and `[data-disabled]` identically — all three paths aligned
* [x] Pattern mode: rest state should show pattern ✅ `::before` now renders `--pat-dust` at rest, densifying to `--pat-mist` on hover and `--pat-spray-grid` on press
* [x] Add pattern lint rules ✅ `rdna/no-pattern-color-override` warns when pattern-mode buttons or `rdna-pat` elements have hardcoded color overrides that break dark/light mode
* [x] Add "transparent" tone option ✅ `data-color="transparent"` with `--btn-fill: transparent`, `--btn-text: var(--color-main)` — type, CSS, meta, schema, and Figma contract updated

### T1c — Toggle / ToggleGroup

* [ ] Fix inconsistent button pattern inheritance
* [ ] ToggleGroup should cascade from Toggle or Button (switchable), not only flat style
* [ ] `[explore]` lightweight fix, needs investigation

### T1d — Form Controls

**Select:**

* [ ] Fix dropdown popping over on top
* [ ] Fix clipped border on dropdown

**Slider:**

* [ ] Add variants: fader, stepped with dots

**Switch:**

* [ ] Fix dark mode competing colors
* [ ] Background: ink (off) → yellow (on) in both modes
* [ ] Dark mode on-state should glow, off-state no glow
* [ ] Thumb: cream default, white on hover/press, both modes

**Checkbox + Radio:**

* [ ] Full visual refactor — match macOS System 7 styling

### T1e — Feedback Components

**Alert:**

* [ ] Verify/add string, icon, heading props
* [ ] Fix closable boolean if broken

**Badge:**

* [ ] Add string prop for text and/or icon content

**Toast:**

* [ ] Align Toast styling with Alert (should consume same patterns)

**Tooltip:**

* [ ] Add compact variant (PixelCode font)
* [ ] Add pixelated borders `[explore: feasibility]`

### T1f — Other Components

**Pattern:**

* [ ] Fix squished display in UI Toolkit tab
* [ ] Fix ToggleGroup showing too many options (use button-style color selector, not string)
* [ ] Same fix for bg color (with transparency support)
* [ ] Dark/light mode adherence: inherit from border semantic variables by default
* [ ] Global rule: pattern colors match parent's border color

**CountdownTimer:**

* [x] Fix type mismatch: schema says string, implementation accepts number|Date ✅ Schema updated to accept number (timestamp) or date-time string

### T1f-swarm — Newly Discovered UI Issues

* [x] ~20 pixel-corner + border violations (border-* on pixel-rounded-* breaks clip-path) across RadiantsStudioApp, RadRadioWidget, BrandAssetsApp, Taskbar, DesignSystemTab ✅ No border-* on pixel-rounded-* elements remain
* [x] RadiantsStudioApp: 3 instances of `overflow-hidden` on pixel-cornered elements ✅ Removed
* [x] `border-ink` in BrandAssetsApp won't flip in dark mode (use `border-line`) ✅ Removed
* [x] Duplicate dark mode tokens in `base.css` `[data-theme="dark"]` block vs `dark.css` (stale legacy block) — ✅ Verified intentional: base.css uses [data-theme="dark"] (attribute forcing), dark.css uses .dark (preference-driven) — different selectors, different token sets
* [x] 6 inline SVG icons in RadiantsStudioApp bypass icon system — ✅ All migrated to Icon component from @rdna/radiants/icons/runtime
* [x] 2 inline SVG icons in RadRadioApp (QueueIcon, ResizeIcon) — add to icon set — ✅ All migrated to Icon component
* [x] StartMenu mobile close button uses inline SVG instead of Icon component ✅ Migrated to Icon in `8547d8d1`; mobile UI subsequently removed in `fc3ef8e4`
* [x] DesktopIcon wraps Button in clickable div — no keyboard access, double event dispatch — ✅ Verified clean — Button is direct child of Tooltip, no wrapping div
* [x] DarkModeToggle in Taskbar uses raw `<button>` instead of RDNA Switch `[explore: intentional?]` ✅ Verified: already uses RDNA Switch component correctly
* [x] InvertOverlay `duration-500` violates 300ms max spec ✅ Fixed to `duration-300`
* [x] No `prefers-reduced-motion` on WebGLSun rAF loop — ✅ Properly implemented with matchMedia listener + reduceMotionRef check in rAF
* [x] InvertOverlay + ambient widget both use `z-[900]` — overlapping z-layers ✅ Fixed: InvertOverlay z-[900], widget z-[950]

### T1g — Dropdown Unification

* [ ] All dropdowns (ContextMenu, DropdownMenu, Menubar, NavigationMenu, Select, Combobox) should share same hover/interaction patterns
* [ ] `[explore]` Create shared "Dropdown" overlay primitive they all consume

### T1h — Cross-Cutting

* [ ] Many components use string props where toggle groups or booleans would be better (e.g., "orientation"). Audit and standardize.
* [ ] HelpPanel replacement: SidePanel that opens inside a window (app-window priority) OR fullscreen (full-screen priority). Same two-tier pattern for Sheet, Dialog.

### T1i — Missing Components

* [ ] AppWindow as RDNA component (promote from Rad_os)
* [ ] AppWindow layout presets (pre-defined content layouts for app windows)
* [ ] StartMenu as RDNA component
* [ ] System 7-inspired OS patterns `[explore]`
* [ ] Widget component defaults

***

## T2 — Mobile Rebuild

Launch blocker. Ground-up rework, not incremental patches.

* [ ] Clear all existing mobile breakpoints and overrides (start fresh)
* [ ] Design + implement mobile app drawer / launcher (bottom nav, smooth UX)
* [ ] Replace hidden Taskbar with mobile nav component
* [ ] Make Start Menu reachable on mobile
* [ ] Add `touch-action: none` to drag/resize handles
* [ ] Fix touch on pixel art canvas (fluid canvas sizing, RDNA color tokens)
* [ ] Fix touch on audio seek bar (expose audio ref via store/context, remove `document.querySelector('audio')` hack)
* [ ] Fix RadRadio widget: responsive width, readable text (black on black bug)
* [ ] Audit all apps in MobileAppModal for usability at narrow widths
* [ ] `[explore]` Reference: app drawer pattern, Apple System 7 mobile patterns

***

## T3 — App Content & Functionality

### StudioApp — Rebuild (was RadiantsStudioApp)

Legacy `RadiantsStudioApp` deleted. New `StudioApp` ported from `sandbox/studio` — a pixel-art editor built on vendored `Dotting` canvas engine. Registered in `lib/apps/catalog.tsx` as `id: 'studio'`.

* [x] Ground-up rebuild: pixel-art editor with layers, brush tools, undo/redo, PNG export
* [x] Vendored canvas engine (`lib/dotting/`) for HTML5 canvas drawing
* [ ] Touch support on canvas (pan/draw on mobile — T2 dep)
* [ ] Voting/submission system — scope + rewire (was tied to old app)
* [ ] Replace hardcoded palette hex with RDNA brand token CSS vars (currently resolved at paint time)
* [ ] Dark-mode pass on canvas grid stroke + background colors

### RadRadio — Refactor

* [ ] Add more local tracks (user has files)
* [ ] Implement physical-looking transport buttons (tape deck / CD player aesthetic)
* [ ] Fix widget mode readability (black text on black background)

### Brand Assets — Fix Broken Features

* [ ] `[explore]` Hardcoded semantic hex values — auto-derive from tokens?
* [ ] `[explore]` AI Toolkit tab scope (2 sref codes — final or placeholder?)

### Content

* [ ] AboutApp: fill in real team names, contributors, acknowledgments
* [ ] ManifestoApp: fill in actual manifesto content

***

## T4 — Tooling & Infrastructure

Reforge items here are reference inputs, not copy-paste implementations. Integrate them into DNA's existing pnpm, `.githooks/`, manual-QC, and `rdna-design-guard.yml` patterns.

### Reforge Follow-up (2026-03-26)

* [ ] Pilot Playwright visual regression on T1 components and keep manual `/qc-visual` as the second layer. Add Argos CI as the default regression surface once the baseline is stable. Reforge: [production-readiness-qc comparator](/Users/rivermassey/Desktop/dev/reforge_archive/2026-03-26-dna-run/reforge-workspace/comparator/production-readiness-qc.md), [visual-test-runner.ts](/Users/rivermassey/Desktop/dev/reforge_archive/2026-03-26-dna-run/reforge-workspace/spikes/production-readiness-qc/src/visual-test-runner.ts). DNA targets: [.github/workflows/rdna-design-guard.yml](../.github/workflows/rdna-design-guard.yml), [docs/ops/qc-visual-t1-checklist.md](./ops/qc-visual-t1-checklist.md), [tools/playground/package.json](../tools/playground/package.json)
* [ ] Replace the manual QC markdown with generated checklists once the visual regression suite is trustworthy; keep human review as the final layer.
* [ ] Bridge automated QC findings into Playground annotations so visual regressions land in the same adoption/review workflow.

### ESLint

* [ ] Auto-generate `token-map.mjs` from `tokens.css` + component data (prevents drift)
* [ ] Add `@eslint/css` coverage for token, pattern, and other authored CSS files
* [ ] `[explore]` CI automated test runs — worth adding?

### Component Testing

* [ ] Component tests come AFTER T1 refactoring is complete
* [ ] 18 components have zero individual test coverage — prioritize refactored components
* [ ] All 38+ components missing `.dna.json` (zero exist) — generate after refactoring stabilizes
* [ ] Add axe-core accessibility coverage for core RDNA components alongside visual regression

### Playground / State Inspection

* [ ] Add state-matrix rendering (variants × states × themes) to Playground for systematic component review
* [ ] Add CDP pseudo-state forcing to the screenshot / Playwright tooling for hover, focus, and active capture
* [ ] Add dagre auto-layout to PlaygroundCanvas for generated comparison and state views

### Token Drift

* [x] Sync `sun-red` oklch value across `tokens.css`, `token-map.mjs`, and `DESIGN.md` (currently divergent) — ✅ Consistent oklch(0.7429 0.1568 21.43) across all files; token-map.mjs deprecated
* [x] Update stale hex values in `token-map.mjs` (pre-oklch migration artifacts) — ✅ token-map.mjs deprecated and removed (see archive/plans/2026-03-22-meta-first-phase4-token-map-deprecation.md)
* [x] Migrate 4 remaining `rgba()` values in `tokens.css` to oklch — ✅ All values migrated to oklch; only migration-history comments remain
* [x] Add tests for `no-clipped-shadow` and `no-pixel-border` ESLint rules (complex ancestor-walking, untested)

***

## T5 — Skills → Motion Pipeline

Sequenced: skills audit first, motion refactor second. Skills provide the rules and patterns that motion work needs.

### Phase 1: Skills Audit

* [ ] Audit all ~50 user-scoped skills for relevance, overlap, quality
* [ ] Design new skills library structure
* [ ] Move skills from user settings → skills library → repo
* [ ] Create project-specific skills (app scaffolding, visual QA, deployment, code review)

### Phase 2: Motion Refactor (after skills)

* [ ] Create motion-specific skills and lint rules
* [ ] Audit all transitions/animations across the app
* [ ] Replace hardcoded Tailwind durations with motion tokens
* [ ] Fix transitions that shouldn't fire in light mode
* [ ] Fix transitions that are too slow
* [ ] Wire `prefers-reduced-motion` through all motion (currently only affects 1 component)
* [ ] Enforce max 300ms motion rule from spec

***

## T6 — Documentation & Cleanup

* [ ] Session files (2,631 / 10MB): mine for potential RDNA skills, then purge

***

## T7 — Post-Launch

* [ ] SoundCloud OAuth integration (scope the flow, backend proxy or iframe Widget)
* [ ] Boot/splash screen `[explore: desired?]`
* [ ] Dithered animations/gradients `[explore: scope undefined]`
* [ ] RadOS test suite (store slices, hooks, window system)
* [ ] CI test pipeline
* [ ] `data-start-button` click guard (user is OK with current close-on-outside behavior)
* [ ] WebGL fallback for browsers without WebGL support

### Optional Bonuses

* [ ] Replace one-off duration overrides with a shared motion duration scalar (`calc(Xms * var(--duration-scalar))`)
* [ ] Add Syncpack to dependency hygiene / monorepo consistency checks
* [ ] Verify Rad-OS singleton and SSR safety assumptions
* [ ] Add Figma Code Connect `.figma.tsx` mappings for component linking
* [ ] Explore fluid `clamp()` typography where fixed Tailwind sizes are too rigid
* [ ] Explore Capsize metrics for tighter vertical rhythm in the pixel/retro type system

***

## Dependency Graph

Updated 2026-03-22 by audit swarm. Corrections marked with ⚡.

```text
T0 (fix now) ──────────────────────────────────────► can start immediately
  ⚡ includes isMobile consolidation (don't delete hook, migrate consumers)
T1 (components) ───────────────────────────────────► can start immediately, largest effort
  T1b (tabs) ──► ⚡ worktree needs recreation (old one pruned)
  T1a (button) ──► foundational, unblocks toggle/pattern
  T1d (form controls) ──► independent per-component
  T1g (dropdown unification) ──► after individual dropdown fixes
  T1h (two-tier overlay) ──► ⚡ HelpPanel already deleted, can start now
T2 (mobile) ───────────────────────────────────────► after T0
  ⚡ NOT fully parallel with T1 — mobile nav needs stable Button (T1a), probably Tabs (T1b)
  ⚡ pointer event sweep should precede or accompany T2
  ⚡ consider partial T5 motion token migration alongside T2 (reduced-motion on mobile)
T3 (apps) ─────────────────────────────────────────► after relevant T1 components
  RadRadio ──► after button refactor (T1a) + dropdown (T1g)
  Studio ──► ⚡ after canvas touch (T2) only — does NOT depend on T1d checkbox
T4 (tooling) ──────────────────────────────────────► parallel with T1
  Tests ──► AFTER T1 refactoring completes
  ⚡ token-map.mjs auto-generation: Architecture A decided, ready for phased execution
T5 (skills → motion) ──────────────────────────────► after T1+T4 stabilize
  Motion ──► AFTER skills audit
  ⚡ but hardcoded duration → token migration can start early (mechanical, no skills needed)
T6 (docs) ─────────────────────────────────────────► parallel with anything
T7 (post-launch) ──────────────────────────────────► after launch
```

***

## Suggested Execution Order

Updated 2026-03-22 by audit swarm. First 3 batches are concrete; rest is sequenced.

### Batch 1: T0 Sweep + isMobile Consolidation (1 session)

All dead code, broken imports, dead exports, and quick behavior fixes.

* Delete getAppMockStates import (build risk), Trash app, Web3ActionBar + Web3Shell

* Delete AppWindowContent, UtilityBar export, constants.tsx, walletSlice (if confirmed)

* Delete dead mock data, stale scripts, dead hooks

* Fix dual localStorage, store migrate cast

* Consolidate isMobile (migrate Desktop+StartMenu to hook)

* Add data-start-button, fix noopener/noreferrer

* Mark 6 already-done items as ✅

### Batch 2: Pixel-Corner + Pointer Event Sweep (1 session)

Two mechanical sweeps for highest-severity visual and behavioral bugs.

* Remove border-* from pixel-rounded-* elements (~20 instances, 6 files)

* Remove overflow-hidden from pixel-cornered elements (3 instances)

* Convert mouse* → pointer* across 5 files, add touch-action:none

* Fix InvertOverlay duration-500, border-ink in BrandAssetsApp

* Reconcile base.css dark block with dark.css

### Batch 3: T1b Tabs + T1a Button Foundations (2-3 sessions)

The two foundational components everything else depends on.

* Recreate tabs worktree, validate existing refactor plan, execute

* Button: flat pressed+hover, disabled reconciliation, focus, active gradient, pattern mode

### Then continue with:

4. **T1d (Form controls)** — Parallelize: Select, NumberField, Slider, Switch independently.

5. **T2 (Mobile)** — After T1a Button is stable. Clear breakpoints, then build mobile nav.

6. **T1e-f (Feedback + other)** — After Button is stable.

7. **T1g (Dropdown unification)** — After individual dropdown fixes. Needs canonical hover pattern decision.

8. **T3 (Apps)** — RadRadio and Studio after component deps are fixed.

9. **T4 (Tooling)** — token-map.mjs auto-gen, ESLint tests, CI pipeline. Parallel with T3.

10. **T1h-i (Overlays + missing components)** — Two-tier overlay system, new RDNA components.

11. **T5 (Skills → Motion)** — After component refactoring stabilizes.

12. **T6 (Docs)** — Before handoff.

⠀