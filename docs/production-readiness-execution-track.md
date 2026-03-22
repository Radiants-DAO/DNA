# Production Readiness Execution Track

Derived from [production-readiness-checklist.md](./production-readiness-checklist.md).

Source of truth remains `docs/production-readiness-checklist.md`.
This file is a working view for items that look implementation-ready and should be handled by cleanup, behavior, or UI/browser loops.

---

## Cleanup Loop Candidates

### T0 — Fix Now

- Delete Trash app
- Delete Web3ActionBar component
- Remove `getAppMockStates` import from `Desktop.tsx`
- Fix `store/index.ts:32` migrate type error
- Fix dual localStorage for `radioFavorites`
- Delete unused `hooks/useIsMobile.ts`
- Delete unused `lib/colors.ts`
- Remove unused `StartButton` export from `Taskbar.tsx`
- Remove `hasAutoSized` dead state from `AppWindow.tsx`
- Remove `console.log('Next')` stub in `RadiantsStudioApp.tsx:406`
- Remove debug logs from `RadRadioApp.tsx`

### T6 — Documentation & Cleanup

- `packages/radiants/README.md`: add missing components, remove HelpPanel

---

## Behavior Loop Candidates

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
- Checkbox + Radio: full visual refactor to macOS System 7 styling

#### T1e — Feedback Components

- Alert: verify or add string, icon, heading props
- Alert: fix closable boolean if broken
- Badge: add string prop for text and/or icon content
- Toast: align Toast styling with Alert
- Tooltip: add compact variant

#### T1f — Other Components

- Combobox: add pixelated borders
- CountdownTimer: fix type mismatch between schema and implementation

### T2 — Mobile Rebuild

- Clear all existing mobile breakpoints and overrides
- Consolidate `isMobile` detection
- Design + implement mobile app drawer / launcher
- Replace hidden Taskbar with mobile nav component
- Make Start Menu reachable on mobile
- Convert `mousedown` click-outside handlers to `pointerdown`
- Fix touch on pixel art canvas
- Fix touch on audio seek bar
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

### T4 — Tooling & Infrastructure

#### ESLint

- Add test files for `no-clipped-shadow` and `no-pixel-border`

#### Component Testing

- Component tests after T1 refactoring is complete
- Prioritize zero-coverage components after refactoring stabilizes
- Generate missing `.dna.json` files after refactoring stabilizes

#### Registry

- Update registry test comment with actual count
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

- Some execution-track items are still large. Batch them in groups of 2-5 related tasks.
- Do not pull in architecture questions from the mixed or research tracks mid-loop.
- When an execution item reveals a deeper contract or ownership question, move it back to the mixed track before continuing.
