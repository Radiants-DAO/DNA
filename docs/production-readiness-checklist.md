# Production Readiness Checklist

Generated 2026-03-22 from 7-agent codebase audit + 40-question interview.
Full audit data: `docs/reports/2026-03-22-production-readiness-audit.md`

**Context**: Solo dev (+ Claude Code + Codex) preparing for handoff to 4 devs. Top priority is visual quality — UI bugs are the #1 embarrassment risk. Mobile is a launch blocker. Skills refactor is a prerequisite for motion work.

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

- [ ] Delete Trash app (remove from catalog, delete `TrashApp.tsx`, clean `trash/registry.tsx`)
- [ ] Delete Web3ActionBar component (remove from core index, meta, schemas, registry)
- [ ] Remove HelpPanel exports from `core/index.ts` and `WindowTitleBar.tsx` import
- [ ] Remove MockStatesPopover exports from `core/index.ts`
- [ ] Remove `getAppMockStates` import from `Desktop.tsx` (deleted file)
- [ ] Fix `store/index.ts:32` migrate type error (passthrough cast)
- [ ] Fix dual localStorage for radioFavorites (pick one: Zustand persist OR manual)
- [ ] Delete dead `components/Rad_os/SunBackground.tsx` (315 lines, superseded by WebGLSun) `[explore: compare both first]`
- [ ] Delete unused `hooks/useIsMobile.ts` (not exported, not imported anywhere)
- [ ] Delete unused `lib/colors.ts` (no consumers)
- [ ] Remove unused `StartButton` export from `Taskbar.tsx`
- [ ] Remove `hasAutoSized` dead state from `AppWindow.tsx`
- [ ] Remove `console.log('Next')` stub in `RadiantsStudioApp.tsx:406`
- [ ] Remove `console.log`/`console.error` debug logs from `RadRadioApp.tsx`

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
- [ ] Investigate/remove `focusableWhenDisabled` if no clear purpose
- [ ] Add "transparent" tone option

### T1b — Tabs (worktree exists: `/private/tmp/claude/tabs-refactor`)

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
- [ ] Deprecate Field + Fieldset → merge into Input and InputSet

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
- [ ] Add styled scrollbar

**Separator / Divider:**
- [ ] Consolidate — redundant to have both `[explore: which to keep]`

**Combobox:**
- [ ] Add pixelated borders

**CountdownTimer:**
- [ ] Fix type mismatch: schema says string, implementation accepts number|Date

### T1g — Dropdown Unification

- [ ] All dropdowns (ContextMenu, DropdownMenu, Menubar, NavigationMenu, Select, Combobox) should share same hover/interaction patterns
- [ ] `[explore]` Create shared "Dropdown" overlay primitive they all consume

### T1h — Cross-Cutting

- [ ] Many components use string props where toggle groups or booleans would be better (e.g., "orientation"). Audit and standardize.
- [ ] HelpPanel replacement: SidePanel that opens inside a window (app-window priority) OR fullscreen (full-screen priority). Same two-tier pattern for Sheet, Dialog.

### T1i — Missing Components

- [ ] AppWindow as RDNA component (promote from Rad_os)
- [ ] Toolbar as RDNA component
- [ ] AppWindow layout presets (pre-defined content layouts for app windows)
- [ ] StartMenu as RDNA component
- [ ] System 7-inspired OS patterns `[explore]`
- [ ] Widget component defaults

---

## T2 — Mobile Rebuild

Launch blocker. Ground-up rework, not incremental patches.

- [ ] Clear all existing mobile breakpoints and overrides (start fresh)
- [ ] Consolidate `isMobile` detection (use `useIsMobile` hook, remove 2 inline duplicates)
- [ ] Design + implement mobile app drawer / launcher (bottom nav, smooth UX)
- [ ] Replace hidden Taskbar with mobile nav component
- [ ] Make Start Menu reachable on mobile
- [ ] Convert `mousedown` click-outside handlers to `pointerdown` (touch-compatible)
- [ ] Fix touch on pixel art canvas (add touch event handlers, fluid canvas sizing)
- [ ] Fix touch on audio seek bar (handle `TouchEvent.touches[0].clientX`)
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
- [ ] Expand `prefer-rdna-components` element list (only covers 5 elements)
- [ ] `[explore]` CI automated test runs — worth adding?

### Component Testing

- [ ] Component tests come AFTER T1 refactoring is complete
- [ ] 20 components have zero test coverage — prioritize refactored components
- [ ] 23 components missing `.dna.json` — generate after refactoring stabilizes

### Registry

- [ ] Update registry test comment ("26 entries" → actual count)
- [ ] Update `packages/radiants/README.md` component list (missing 18, lists deleted HelpPanel)

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
- [ ] `duration-500` on InvertOverlay violates spec

---

## T6 — Documentation & Cleanup

- [ ] `packages/radiants/README.md`: add 18 missing components, remove HelpPanel
- [ ] `references/design-playground/UPSTREAM.md`: ~~`apps/playground/` → `tools/playground/`~~ ✅ Fixed
- [ ] ~~`apps/rad-os/CLAUDE.md`: full rewrite~~ ✅ Fixed
- [ ] ~~Root `CLAUDE.md`: fix app/component counts~~ ✅ Fixed
- [ ] ~~Memory file: fix worktrees, remove dead Flow block, fix broken link~~ ✅ Fixed
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

```
T0 (fix now) ──────────────────────────────────────► can start immediately
T1 (components) ───────────────────────────────────► can start immediately, largest effort
  T1b (tabs) ──► has existing worktree, start here
  T1a (button) ──► foundational, unblocks toggle/pattern
  T1d (form controls) ──► independent per-component
  T1g (dropdown unification) ──► after individual dropdown fixes
  T1h (two-tier overlay) ──► after HelpPanel removal (T0)
T2 (mobile) ───────────────────────────────────────► after T0, parallel with T1
T3 (apps) ─────────────────────────────────────────► after relevant T1 components
  RadRadio ──► after button refactor (T1a)
  Studio ──► after checkbox/canvas touch (T1d, T2)
T4 (tooling) ──────────────────────────────────────► parallel with T1
  Tests ──► AFTER T1 refactoring completes
T5 (skills → motion) ──────────────────────────────► after T1+T4 stabilize
  Motion ──► AFTER skills audit
T6 (docs) ─────────────────────────────────────────► parallel with anything
T7 (post-launch) ──────────────────────────────────► after launch
```

---

## Suggested Execution Order

For a solo dev with Claude Code + Codex, parallelizing where possible:

1. **T0** — 1 session. Clean sweep of dead code and broken imports.
2. **T1b (Tabs)** — Worktree exists. High-impact since tabs are everywhere.
3. **T1a (Button)** — Foundational. Unblocks Toggle, ToggleGroup, Pattern work.
4. **T1d (Form controls)** — Parallelize: Select, NumberField, Slider, Switch can each be independent agents.
5. **T2 (Mobile)** — Can run in parallel with T1d. Clear breakpoints first, then build new nav.
6. **T1e-f (Feedback + other)** — After Button is stable.
7. **T1g (Dropdown unification)** — After Select, Combobox, Menubar are individually fixed.
8. **T3 (Apps)** — RadRadio and Studio after their component deps are fixed.
9. **T4 (Tooling)** — ESLint auto-gen and test gaps. Parallel with T3.
10. **T1h-i (Overlays + missing components)** — Two-tier overlay system, new RDNA components.
11. **T5 (Skills → Motion)** — After component refactoring stabilizes.
12. **T6 (Docs)** — Before handoff.
