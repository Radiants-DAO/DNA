# Production Readiness Execution Track

Derived from [production-readiness-checklist.md](./production-readiness-checklist.md).
Updated 2026-03-22 by audit swarm.

Source of truth remains `docs/production-readiness-checklist.md`.
This file is a working view for items that look implementation-ready and should be handled by cleanup, behavior, or UI/browser loops.

---

## Cleanup Loop Candidates

### T0 — Fix Now (expanded by swarm)

**Original items:**
- Delete Trash app
- Delete Web3ActionBar component
- Remove `getAppMockStates` import from `Desktop.tsx` **⚠ potential build break**
- Fix `store/index.ts:32` migrate type error
- Fix dual localStorage for `radioFavorites`
- Delete unused `lib/colors.ts`
- Remove unused `StartButton` export from `Taskbar.tsx`
- Remove `hasAutoSized` dead state from `AppWindow.tsx`
- Remove `console.log('Next')` stub in `RadiantsStudioApp.tsx:406`
- Remove debug logs from `RadRadioApp.tsx`

**Swarm additions:**
- Delete `Web3Shell.tsx` (0 consumers, hosts Web3ActionBar)
- Delete `AppWindowContent.tsx` (deprecated, 0 consumers)
- Remove `UtilityBar` export from `Taskbar.tsx` and `index.ts`
- Delete `lib/constants.tsx` (compat shim, 0 consumers)
- Delete `mockData/radiants.ts` + `mockData/commissions.ts` (0 consumers)
- Delete `nft-metadata/`, `nfts.json`, `download-nft-data.js` (stale NFT artifacts)
- Delete `walletSlice.ts` + `useWalletStore` (0 consumers) `[confirm: Web3 in v1?]`
- Delete `useModalBehavior.ts` (dead hooks, 0 consumers)
- Delete `test/render.tsx` (unused test helper)
- Delete `ops/hex-to-oklch.mjs`, `scripts/find-non-oklch.sh` (stale scripts)
- Delete `trash/registry.tsx` (dead reference file)
- Migrate Desktop.tsx + StartMenu.tsx to `useIsMobile` hook (don't delete the hook)
- Add `data-start-button` attribute to Start button in Taskbar
- Fix StartMenu social links: add `noopener,noreferrer`

### T6 — Documentation & Cleanup

- `packages/radiants/README.md`: add missing components, remove "Divider" and HelpPanel

---

## Behavior Loop Candidates

### Pointer Event Migration (Batch 2)

- Convert all `mouse*` → `pointer*` across 5 files (AppWindow, StartMenu, WebGLSun, RadiantsStudio, RadRadio)
- Add `touch-action: none` to drag/resize handles

### Pixel-Corner Sweep (Batch 2)

- Remove `border-*` from `pixel-rounded-*` elements (~20 instances across 6 files)
- Remove `overflow-hidden` from pixel-cornered elements (3 instances in RadiantsStudioApp)

### T1 — Component Visual Quality

#### T1a — Button

- Flat mode: add pressed + hover states
- Disabled: reconcile `disabled` prop vs disabled state
- Focus state: replace outline with accessible alternative
- Active prop: fix linear gradient on border
- Pattern mode: fix rest state / text / icon visibility
- Add "transparent" tone option

#### T1c — Toggle / ToggleGroup

- Fix inconsistent button pattern inheritance

#### T1d — Form Controls

- Select: fix dropdown popping over on top
- Select: fix clipped border on dropdown
- Select: fix dark mode hover color
- NumberField: fix +/- border placement
- NumberField: fix dark mode button colors
- Slider: remove extra border on filled part
- Slider: add variants `fader`, `stepped with dots`
- Switch: fix dark mode competing colors
- Switch: off/on backgrounds should be ink -> yellow in both modes
- Switch: dark mode on-state should glow, off-state should not
- Switch: thumb should be cream by default and white on hover/press

#### T1e — Feedback Components

- Alert: verify or add string, icon, heading props
- Alert: fix closable boolean if broken
- Badge: add string prop for text and/or icon content
- Tooltip: add compact variant

#### T1f — Other Components

- Combobox: add pixelated borders
- CountdownTimer: fix type mismatch between schema and implementation
- ScrollArea: add styled scrollbar

#### T1f-swarm — Newly Discovered UI Issues

- `border-ink` in BrandAssetsApp won't flip in dark mode
- Duplicate dark mode tokens in base.css vs dark.css (stale legacy block)
- 6 inline SVG icons in RadiantsStudioApp bypass icon system
- 2 inline SVG icons in RadRadioApp (add to icon set)
- StartMenu mobile close button uses inline SVG
- DesktopIcon: move onClick to Button, remove wrapper div (keyboard access)
- InvertOverlay `duration-500` → `duration-300` (spec violation)
- No `prefers-reduced-motion` on WebGLSun rAF loop
- InvertOverlay + widget z-[900] collision

### T2 — Mobile Rebuild

- Clear all existing mobile breakpoints and overrides
- Consolidate `isMobile` detection (done in T0 batch)
- Replace hidden Taskbar with mobile nav component
- Make Start Menu reachable on mobile
- Fix touch on pixel art canvas
- Fix touch on audio seek bar (expose audio ref, remove querySelector hack)
- Fix RadRadio widget responsiveness and readability
- Audit all apps in MobileAppModal for usability at narrow widths

### T3 — App Content & Functionality

#### RadiantsStudioApp

- Fix pixel art canvas
- Wire NEXT button to actual functionality
- Voting/submission system completion

#### RadRadio

- Add more local tracks
- Implement physical-looking transport buttons
- Fix widget mode readability
- Fix `document.querySelector('audio')` seek hack
- Remove share button or wire it up

#### Brand Assets

- Fix download paths
- Fix font download URLs

#### Content

- AboutApp: fill in real team names, contributors, acknowledgments
- ManifestoApp: fill in actual manifesto content
- LinksApp: remove from catalog (17-line stub, no content planned)

### T4 — Tooling & Infrastructure

#### ESLint

- Add test files for `no-clipped-shadow` and `no-pixel-border`

#### CI

- Add component tests to CI workflow
- Add `test` task to turbo.json

#### Token Drift

- Sync sun-red oklch value across tokens.css, token-map.mjs, DESIGN.md
- Update stale hex values in token-map.mjs
- Migrate 4 remaining rgba() values in tokens.css to oklch

#### Component Testing

- Component tests after T1 refactoring is complete
- Prioritize zero-coverage components after refactoring stabilizes
- Generate missing `.dna.json` files after refactoring stabilizes

#### Registry

- Update registry test threshold (>= 22 → >= 40)
- Update `packages/radiants/README.md` component list

### T5 — Skills -> Motion Pipeline

#### Phase 2: Motion Refactor

- Audit all transitions/animations across the app
- Replace hardcoded Tailwind durations with motion tokens
- Fix transitions that should not fire in light mode
- Fix transitions that are too slow
- Wire `prefers-reduced-motion` through all motion
- Enforce max 300ms motion rule from spec
- Fix `duration-500` on InvertOverlay

---

## Notes

- Batch 1 (T0 sweep) and Batch 2 (pixel-corner + pointer events) are mechanical and can be parallelized across agents.
- Do not pull in architecture questions from the mixed or research tracks mid-loop.
- When an execution item reveals a deeper contract or ownership question, move it back to the mixed track before continuing.
