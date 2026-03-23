# Production Readiness Checklist

Generated 2026-03-22 from 7-agent codebase audit + 40-question interview.
Updated 2026-03-22 by 6-agent audit swarm (findings: `research/production-readiness-audit-swarm.md`).
Full audit data: `docs/reports/2026-03-22-production-readiness-audit.md`

**Context**: Solo dev (+ Claude Code + Codex) preparing for handoff to 4 devs. Top priority is visual quality — UI bugs are the #1 embarrassment risk. Mobile is a launch blocker. Skills refactor is a prerequisite for motion work.

**Derived planning views**:
- Execution track: `docs/production-readiness-execution-track.md`
- Research track: `docs/production-readiness-research-track.md`
- Mixed track: `docs/production-readiness-mixed-track.md`

Source of truth remains this checklist.

---

## How to Read This

- **T0**: Fix now. Broken imports, dead code, data bugs. Small effort, prevents surprises.
- **T1**: Component visual quality. The embarrassment tier. Largest body of work.
- **T2**: Mobile rebuild. Launch blocker, ground-up rework.
- **T3**: App content & functionality. Features that need to work at launch.
- **T4**: Tooling & infrastructure. Prevents drift, supports handoff.
- **T5**: Skills → Motion pipeline. Sequenced: skills first, motion second.
- **T6**: Documentation & cleanup. Handoff readiness.
- **T7**: Post-launch. Nice-to-haves and future features.

Items marked `[explore]` need investigation before scoping.

---

## T0 — Fix Now

Quick wins that prevent broken builds and confusing code for incoming devs.

- [x] Delete Trash app ✅ `8195bed2`
- [x] Delete Web3ActionBar component ✅ `7956456c`
- [x] ~~Remove HelpPanel exports from `core/index.ts` and `WindowTitleBar.tsx` import~~ ✅ Already deleted
- [x] ~~Remove MockStatesPopover exports from `core/index.ts`~~ ✅ Already deleted
- [x] Remove `getAppMockStates` import from `Desktop.tsx` ✅ `44db50d3`
- [x] Fix `store/index.ts:32` migrate type error ✅ `d45997e3`
- [x] Fix dual localStorage for radioFavorites ✅ `c0f6bdc9`
- [x] ~~Delete dead `components/Rad_os/SunBackground.tsx`~~ ✅ Already deleted
- [x] Migrate Desktop.tsx + StartMenu.tsx to `useIsMobile` hook ✅ `e3a6d9ff`
- [x] Delete unused `lib/colors.ts` ✅ `cefc7ecb`
- [x] Remove unused `StartButton` export from `Taskbar.tsx` ✅ `b3b055f2`
- [x] Remove `hasAutoSized` dead state from `AppWindow.tsx` ✅ `44c8855f`
- [x] Remove `console.log('Next')` stub in `RadiantsStudioApp.tsx` ✅ `6d5c9463`
- [x] Remove `console.log`/`console.error` debug logs from `RadRadioApp.tsx` ✅ `b2143ed7`
- [x] Delete `Web3Shell.tsx` ✅ `797f4e91`
- [x] Delete `AppWindowContent.tsx` ✅ `e127e8e2`
- [x] Remove `UtilityBar` export from `Taskbar.tsx` and `index.ts` ✅ `8254ae93`
- [x] Delete `lib/constants.tsx` ✅ `05284973`
- [x] Delete `mockData/radiants.ts` + `mockData/commissions.ts` ✅ `4923e3b4`
- [x] Delete `nft-metadata/`, `nfts.json`, `download-nft-data.js` ✅ `4a3d7bcd`
- [x] Delete `walletSlice.ts` + `useWalletStore` ✅ `7d8bfff8`
- [x] Delete `useModalBehavior.ts` ✅ `7a233dc1`
- [x] Delete `test/render.tsx` ✅ `8c478e57`
- [x] Delete `ops/hex-to-oklch.mjs`, `scripts/find-non-oklch.sh` ✅ `b5662113`
- [x] Delete `trash/registry.tsx` ✅ `8195bed2`
- [x] Add `data-start-button` attribute to Start button in Taskbar ✅ `3770421c`
- [x] Fix StartMenu social links: add `noopener,noreferrer` ✅ `d0481094`

---

## T1 — Component Visual Quality

The largest body of work. Refactor before testing. Grouped by component.

### T1a — Button (7 issues)

- [ ] Flat mode: add pressed + hover states
- [ ] Disabled: reconcile `disabled` prop vs disabled state (prop has correct styles, state does not)
- [ ] Focus state: replace outline with drop shadow or similar accessible alternative
- [ ] Active prop: fix strange linear gradient on border
- [ ] Pattern mode: rest state should show pattern (currently acts like quiet). Fix invisible text/icons in rest + superstate
- [ ] Add pattern lint rules; verify pattern colors switch correctly in dark/light mode
- [x] ~~Investigate/remove `focusableWhenDisabled` if no clear purpose~~ ✅ Documented in meta, tested — keeps tab focus via `aria-disabled`
- [ ] Add "transparent" tone option

### T1b — Tabs (worktree needs recreation — `/private/tmp/claude/tabs-refactor` was pruned)

- [ ] Execute existing tabs refactor plan
- [ ] Fix known bugs (most-used UI pattern — bugs here cascade everywhere)

### T1c — Toggle / ToggleGroup

- [ ] Fix inconsistent button pattern inheritance
- [ ] ToggleGroup should cascade from Toggle or Button (switchable), not only flat style
- [ ] `[explore]` lightweight fix, needs investigation

### T1d — Form Controls

**Select:**
- [ ] Fix dropdown popping over on top
- [ ] Fix clipped border on dropdown
- [ ] Fix dark mode hover color (cream on yellow — unreadable)

**NumberField:**
- [ ] +/- buttons: borders only on inner edges (- has border on wrong side)
- [ ] Fix dark mode (buttons white on yellow)

**Slider:**
- [ ] Remove extra border on filled part
- [ ] Add variants: fader, stepped with dots

**Switch:**
- [ ] Fix dark mode competing colors
- [ ] Background: ink (off) → yellow (on) in both modes
- [ ] Dark mode on-state should glow, off-state no glow
- [ ] Thumb: cream default, white on hover/press, both modes

**Checkbox + Radio:**
- [ ] Full visual refactor — match macOS System 7 styling

**Field / Fieldset:**
- [x] ~~Deprecate Field + Fieldset → merge into Input and InputSet~~ ✅ Field and Fieldset never existed as components; InputSet already exists and is exported

### T1e — Feedback Components

**Alert:**
- [ ] Verify/add string, icon, heading props
- [ ] Fix closable boolean if broken

**Badge:**
- [ ] Add string prop for text and/or icon content

**Toast:**
- [ ] Align Toast styling with Alert (should consume same patterns)

**Tooltip:**
- [ ] Add compact variant (PixelCode font)
- [ ] Add pixelated borders `[explore: feasibility]`

### T1f — Other Components

**Pattern:**
- [ ] Fix squished display in UI Toolkit tab
- [ ] Fix ToggleGroup showing too many options (use button-style color selector, not string)
- [ ] Same fix for bg color (with transparency support)
- [ ] Dark/light mode adherence: inherit from border semantic variables by default
- [ ] Global rule: pattern colors match parent's border color

**ScrollArea:**
- [x] Add styled scrollbar ✅ Base UI ScrollArea with themed thumb (`bg-line/40`, hover `bg-line`), auto-hide on idle

**Separator:**
- [x] ~~Consolidate Separator / Divider~~ ✅ Divider never existed — only Separator. README incorrectly listed "Divider".

**Combobox:**
- [x] Add pixelated borders ✅ `pixel-rounded-xs` on input wrapper and dropdown popup

**CountdownTimer:**
- [ ] Fix type mismatch: schema says string, implementation accepts number|Date

### T1f-swarm — Newly Discovered UI Issues

- [x] ~20 pixel-corner + border violations (border-* on pixel-rounded-* breaks clip-path) across RadiantsStudioApp, RadRadioWidget, BrandAssetsApp, Taskbar, DesignSystemTab ✅ No border-* on pixel-rounded-* elements remain
- [x] RadiantsStudioApp: 3 instances of `overflow-hidden` on pixel-cornered elements ✅ Removed
- [x] `border-ink` in BrandAssetsApp won't flip in dark mode (use `border-line`) ✅ Removed
- [ ] Duplicate dark mode tokens in `base.css` `[data-theme="dark"]` block vs `dark.css` (stale legacy block)
- [ ] 6 inline SVG icons in RadiantsStudioApp bypass icon system
- [ ] 2 inline SVG icons in RadRadioApp (QueueIcon, ResizeIcon) — add to icon set
- [ ] StartMenu mobile close button uses inline SVG instead of Icon component
- [ ] DesktopIcon wraps Button in clickable div — no keyboard access, double event dispatch
- [ ] DarkModeToggle in Taskbar uses raw `<button>` instead of RDNA Switch `[explore: intentional?]`
- [x] InvertOverlay `duration-500` violates 300ms max spec ✅ Fixed to `duration-300`
- [ ] No `prefers-reduced-motion` on WebGLSun rAF loop
- [x] InvertOverlay + ambient widget both use `z-[900]` — overlapping z-layers ✅ Fixed: InvertOverlay z-[900], widget z-[950]

### T1g — Dropdown Unification

- [ ] All dropdowns (ContextMenu, DropdownMenu, Menubar, NavigationMenu, Select, Combobox) should share same hover/interaction patterns
- [ ] `[explore]` Create shared "Dropdown" overlay primitive they all consume

### T1h — Cross-Cutting

- [ ] Many components use string props where toggle groups or booleans would be better (e.g., "orientation"). Audit and standardize.
- [ ] HelpPanel replacement: SidePanel that opens inside a window (app-window priority) OR fullscreen (full-screen priority). Same two-tier pattern for Sheet, Dialog.

### T1i — Missing Components

- [ ] AppWindow as RDNA component (promote from Rad_os)
- [x] ~~Toolbar as RDNA component~~ ✅ Already exists, exported, registered
- [ ] AppWindow layout presets (pre-defined content layouts for app windows)
- [ ] StartMenu as RDNA component
- [ ] System 7-inspired OS patterns `[explore]`
- [ ] Widget component defaults

---

## T2 — Mobile Rebuild

Launch blocker. Ground-up rework, not incremental patches.

- [ ] Clear all existing mobile breakpoints and overrides (start fresh)
- [x] Consolidate `isMobile` detection ✅ Done in T0 sweep (`e3a6d9ff`)
- [ ] Design + implement mobile app drawer / launcher (bottom nav, smooth UX)
- [ ] Replace hidden Taskbar with mobile nav component
- [ ] Make Start Menu reachable on mobile
- [x] Convert all `mouse*` events to `pointer*` across the app (AppWindow resize, StartMenu dismiss, WebGLSun, pixel art canvas, RadRadio seek — 5 files, ~15 changes) ✅ All converted to pointer events
- [ ] Add `touch-action: none` to drag/resize handles
- [ ] Fix touch on pixel art canvas (fluid canvas sizing, RDNA color tokens)
- [ ] Fix touch on audio seek bar (expose audio ref via store/context, remove `document.querySelector('audio')` hack)
- [ ] Fix RadRadio widget: responsive width, readable text (black on black bug)
- [ ] Audit all apps in MobileAppModal for usability at narrow widths
- [ ] `[explore]` Reference: app drawer pattern, Apple System 7 mobile patterns

---

## T3 — App Content & Functionality

### RadiantsStudioApp — Full Refactor

- [ ] Fix pixel art canvas (touch support, fluid sizing, RDNA color tokens instead of hardcoded hex)
- [ ] Wire NEXT button to actual functionality
- [ ] Voting/submission system completion
- [ ] `[explore]` Full scope TBD

### RadRadio — Refactor

- [ ] Add more local tracks (user has files)
- [ ] Implement physical-looking transport buttons (tape deck / CD player aesthetic)
- [ ] Fix widget mode readability (black text on black background)
- [ ] Fix `document.querySelector('audio')` seek hack (use ref or store)
- [ ] Remove share button or wire it up

### Brand Assets — Fix Broken Features

- [ ] Fix download paths (PNG subdir doesn't exist, filename mismatch for mark variants)
- [ ] Fix font download URLs (both point to wrong Bonkathon Dropbox ZIP)
- [ ] `[explore]` Hardcoded semantic hex values — auto-derive from tokens?
- [ ] `[explore]` AI Toolkit tab scope (2 sref codes — final or placeholder?)

### Content

- [ ] AboutApp: fill in real team names, contributors, acknowledgments
- [ ] ManifestoApp: fill in actual manifesto content
- [ ] LinksApp: implement or remove from catalog (currently 17-line stub)

---

## T4 — Tooling & Infrastructure

### ESLint

- [ ] Auto-generate `token-map.mjs` from `tokens.css` + component data (prevents drift)
- [ ] Add test files for `no-clipped-shadow` and `no-pixel-border` rules
- [ ] Expand `prefer-rdna-components` element list (covers 11 elements: button, input, select, textarea, dialog, details, summary, label, meter, progress, hr)
- [ ] `[explore]` CI automated test runs — worth adding?

### CI

- [ ] Add component tests to CI workflow (`.github/workflows/rdna-design-guard.yml` only runs lint, not tests)
- [ ] Add `test` task to `turbo.json`

### Component Testing

- [ ] Component tests come AFTER T1 refactoring is complete
- [ ] 18 components have zero individual test coverage — prioritize refactored components
- [ ] All 38+ components missing `.dna.json` (zero exist) — generate after refactoring stabilizes

### Registry

- [ ] Update registry test threshold (`>= 22` but actual count is 42 — would miss deletion of 20 components)
- [ ] Update `packages/radiants/README.md` component list (missing 18, lists nonexistent "Divider" and deleted HelpPanel)

### Token Drift

- [ ] Sync `sun-red` oklch value across `tokens.css`, `token-map.mjs`, and `DESIGN.md` (currently divergent)
- [ ] Update stale hex values in `token-map.mjs` (pre-oklch migration artifacts)
- [ ] Migrate 4 remaining `rgba()` values in `tokens.css` to oklch
- [ ] Add tests for `no-clipped-shadow` and `no-pixel-border` ESLint rules (complex ancestor-walking, untested)

---

## T5 — Skills → Motion Pipeline

Sequenced: skills audit first, motion refactor second. Skills provide the rules and patterns that motion work needs.

### Phase 1: Skills Audit

- [ ] Audit all ~50 user-scoped skills for relevance, overlap, quality
- [ ] Design new skills library structure
- [ ] Move skills from user settings → skills library → repo
- [ ] Create project-specific skills (app scaffolding, visual QA, deployment, code review)

### Phase 2: Motion Refactor (after skills)

- [ ] Create motion-specific skills and lint rules
- [ ] Audit all transitions/animations across the app
- [ ] Replace hardcoded Tailwind durations with motion tokens
- [ ] Fix transitions that shouldn't fire in light mode
- [ ] Fix transitions that are too slow
- [ ] Wire `prefers-reduced-motion` through all motion (currently only affects 1 component)
- [ ] Enforce max 300ms motion rule from spec
- [x] `duration-500` on InvertOverlay violates spec ✅ Fixed to `duration-300`

---

## T6 — Documentation & Cleanup

- [ ] `packages/radiants/README.md`: add 18 missing components, remove HelpPanel
- [x] `references/design-playground/UPSTREAM.md`: ~~`apps/playground/` → `tools/playground/`~~ ✅ Fixed
- [x] ~~`apps/rad-os/CLAUDE.md`: full rewrite~~ ✅ Fixed
- [x] ~~Root `CLAUDE.md`: fix app/component counts~~ ✅ Fixed
- [x] ~~Memory file: fix worktrees, remove dead Flow block, fix broken link~~ ✅ Fixed
- [ ] Docs audit: review 6 brainstorms + 11 plans before deleting (may have useful content)
- [ ] Session files (2,631 / 10MB): mine for potential RDNA skills, then purge
- [ ] `[explore]` `prompts/dna-conversion/`: add "unmaintained" banner or archive

---

## T7 — Post-Launch

- [ ] SoundCloud OAuth integration (scope the flow, backend proxy or iframe Widget)
- [ ] Boot/splash screen `[explore: desired?]`
- [ ] Dithered animations/gradients `[explore: scope undefined]`
- [ ] RadOS test suite (store slices, hooks, window system)
- [ ] CI test pipeline
- [ ] `data-start-button` click guard (user is OK with current close-on-outside behavior)
- [ ] WebGL fallback for browsers without WebGL support

---

## Dependency Graph

Updated 2026-03-22 by audit swarm. Corrections marked with ⚡.

```
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

---

## Suggested Execution Order

Updated 2026-03-22 by audit swarm. First 3 batches are concrete; rest is sequenced.

### Batch 1: T0 Sweep + isMobile Consolidation (1 session)
All dead code, broken imports, dead exports, and quick behavior fixes.
- Delete getAppMockStates import (build risk), Trash app, Web3ActionBar + Web3Shell
- Delete AppWindowContent, UtilityBar export, constants.tsx, walletSlice (if confirmed)
- Delete dead mock data, stale scripts, dead hooks
- Fix dual localStorage, store migrate cast
- Consolidate isMobile (migrate Desktop+StartMenu to hook)
- Add data-start-button, fix noopener/noreferrer
- Mark 6 already-done items as ✅

### Batch 2: Pixel-Corner + Pointer Event Sweep (1 session)
Two mechanical sweeps for highest-severity visual and behavioral bugs.
- Remove border-* from pixel-rounded-* elements (~20 instances, 6 files)
- Remove overflow-hidden from pixel-cornered elements (3 instances)
- Convert mouse* → pointer* across 5 files, add touch-action:none
- Fix InvertOverlay duration-500, border-ink in BrandAssetsApp
- Reconcile base.css dark block with dark.css

### Batch 3: T1b Tabs + T1a Button Foundations (2-3 sessions)
The two foundational components everything else depends on.
- Recreate tabs worktree, validate existing refactor plan, execute
- Button: flat pressed+hover, disabled reconciliation, focus, active gradient, pattern mode

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
