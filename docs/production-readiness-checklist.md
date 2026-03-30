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

### T1a — Button (7 issues)

* [ ] Disabled: reconcile `disabled` prop vs disabled state (prop has correct styles, state does not)
* [ ] Pattern mode: rest state should show pattern (currently acts like quiet). Fix invisible text/icons in rest + superstate
* [ ] Add pattern lint rules; verify pattern colors switch correctly in dark/light mode
* [ ] Add "transparent" tone option

### T1b — Tabs (worktree needs recreation — `/private/tmp/claude/tabs-refactor` was pruned)

* [ ] Fix known bugs (most-used UI pattern — bugs here cascade everywhere)

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

* [ ] Fix type mismatch: schema says string, implementation accepts number|Date

### T1f-swarm — Newly Discovered UI Issues

* [ ] Duplicate dark mode tokens in `base.css` `[data-theme="dark"]` block vs `dark.css` (stale legacy block)
* [ ] 6 inline SVG icons in RadiantsStudioApp bypass icon system
* [ ] 2 inline SVG icons in RadRadioApp (QueueIcon, ResizeIcon) — add to icon set
* [ ] StartMenu mobile close button uses inline SVG instead of Icon component
* [ ] DesktopIcon wraps Button in clickable div — no keyboard access, double event dispatch
* [ ] DarkModeToggle in Taskbar uses raw `<button>` instead of RDNA Switch `[explore: intentional?]`
* [ ] No `prefers-reduced-motion` on WebGLSun rAF loop

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

### RadiantsStudioApp — Full Refactor

* [ ] Fix pixel art canvas (touch support, fluid sizing, RDNA color tokens instead of hardcoded hex)
* [ ] Wire NEXT button to actual functionality
* [ ] Voting/submission system completion
* [ ] `[explore]` Full scope TBD

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

* [ ] Sync `sun-red` oklch value across `tokens.css`, `token-map.mjs`, and `DESIGN.md` (currently divergent)
* [ ] Update stale hex values in `token-map.mjs` (pre-oklch migration artifacts)
* [ ] Migrate 4 remaining `rgba()` values in `tokens.css` to oklch

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
