# Production Readiness Audit — 2026-03-22

7 research agents surveyed the full codebase. This is the consolidated output.

---

## 1. Component Registry Health

### Total Component Count

**42 component directories**, plus 3 sub-components without their own directory:
- `Radio` lives inside `Checkbox/`
- `Label` and `TextArea` live inside `Input/`

This gives **45 logical components** tracked in `meta/index.ts` and `schemas/index.ts`. The registry manifest (`tools/playground/generated/registry.manifest.json`) lists **44 entries** (MockStatesPopover is excluded at runtime, and `Pattern` has `dna: null`).

### Three-File Pattern Completeness

All 42 directories have `.tsx`, `.schema.json`, and `.meta.ts` files.

**23 of 45 components are missing `.dna.json` files** (token bindings), while `schemas/index.ts` imports them as if they exist:

AlertDialog, Collapsible, ContextMenu, CountdownTimer, Dialog, Drawer, DropdownMenu, HelpPanel, Menubar, Meter, MockStatesPopover, NavigationMenu, Popover, PreviewCard, ScrollArea, Separator, Sheet, Tabs, Toast, Toggle, ToggleGroup, Toolbar, Web3ActionBar

`Pattern` is explicitly set to `dna: null` — intentional.

### Schema Quality Issues

- **CountdownTimer**: `endTime` is `number | Date` in TSX but `type: "string"` (ISO date) in schema and meta. Demo passes numeric timestamp.
- **Web3ActionBar**: `onConnect`/`onDisconnect` typed as `type: "string"` in meta, but they are callback functions.
- **Registry test**: Comment says "componentData has 26 entries" — actual count is 43+. Assertion `>= 24` still passes.

### Test Coverage

**21 of 42 component directories** have per-component `.test.tsx` files.

**20 components have zero test coverage** (not in per-component tests AND not in smoke test):
Avatar, Breadcrumbs, Card, Collapsible, CountdownTimer, Divider, Field, Fieldset, Input, Label, Menubar, Meter, MockStatesPopover, NavigationMenu, Pattern, Separator, TextArea, ToggleGroup, Toolbar, Web3ActionBar

### Export Consistency

All 42 component directories are exported from `packages/radiants/components/core/index.ts`, including deleted components MockStatesPopover and HelpPanel.

### Registry Coverage

| Metric | Count |
|---|---|
| Component directories | 42 |
| Logical components | 45 |
| Entries in `schemas/index.ts` | 44 |
| Entries in `registry.manifest.json` | 44 |
| Excluded from registry | 1 (MockStatesPopover) |
| Active registry entries | 43 |
| Components with `.dna.json` | 21 of 44 |
| Components missing `.dna.json` | 23 |

### Top 5 Most Problematic Components

1. **CountdownTimer** — No .dna.json, no test, type mismatch (endTime)
2. **Web3ActionBar** — No .dna.json, no test, meta types callbacks as strings
3. **Toolbar** — No .dna.json, no test, no smoke test
4. **ToggleGroup** — No .dna.json, no test, no smoke test
5. **NavigationMenu** — No .dna.json, no test, complex compound component

---

## 2. Mobile Responsiveness

### Current Approach

Two-tier: `AppWindow` (draggable/resizable) for desktop, `MobileAppModal` (fixed full-screen) for mobile. Detection via `window.innerWidth < 768` in component-local `useEffect` hooks.

### Components WITH Mobile-Specific Code

- **Desktop.tsx** — Dual `isMobile` state (duplicated, not using the existing `useIsMobile` hook). Mobile: icons as `MobileIcon` in flex-wrap row. Desktop: `DesktopIcon` row. Taskbar conditionally hidden.
- **StartMenu.tsx** — Own duplicated `isMobile` state. Mobile: fixed full-screen overlay. Desktop: Win95 popup. Click-outside uses `mousedown` (no `touchstart`).
- **MobileAppModal.tsx** — Full-screen takeover with close button (44px tap target). Scrolling works.

### Components with NO Mobile Consideration

- **Taskbar.tsx** — Hidden on mobile. No replacement nav. Start Menu trigger is inaccessible.
- **AppWindow.tsx** — Pure desktop. All mouse events. Not rendered on mobile.
- **WindowTitleBar.tsx** — Mouse/keyboard only. Tooltips hover-only.
- **RadiantsStudioApp.tsx** — Canvas `350x350` hardcoded px. Mouse-only drawing. Broken on touch.
- **RadRadioApp.tsx** — Widget `w-[320px]` fixed. Progress bar mouse-only (`clientX`). Seeking broken on touch.
- **BrandAssetsApp.tsx** — Uses `@container` queries correctly (good).
- **AboutApp.tsx** — Uses `@sm:grid-cols-2` (good).

### Known Jank Patterns

1. **Taskbar hidden, no replacement** — No persistent navigation on mobile. No way to open Start Menu.
2. **Duplicated `isMobile` detection** — Desktop.tsx and StartMenu.tsx each have independent detection. `useIsMobile` hook exists but is unused.
3. **`mousedown` not `pointerdown`** — StartMenu click-outside unreliable on touch.
4. **WebGLSun uses `mousemove`** — Sun animation static on touch (cosmetic).
5. **RadiantsStudioApp canvas mouse-only** — Pixel art completely non-functional on touch.
6. **ProgressBar mouse-only** — Audio seeking broken on touch.
7. **Fixed-width widget** — `w-[320px]` may clip on narrow phones.

### Touch Interaction Status

| Interaction | Status |
|---|---|
| Open app | Works (tap MobileIcon) |
| Close app | Works (close button) |
| Open Start Menu | **Broken** — trigger hidden |
| Tap-outside to close | **Unreliable** — mousedown only |
| Scroll within app | Works |
| Draw on pixel canvas | **Broken** — mouse-only |
| Seek audio | **Broken** — mouse-only |
| Tooltips | Non-functional — hover only |

### Files Needing Changes for Mobile

**High priority:**
1. Desktop.tsx — Add mobile nav affordance, fix duplicated isMobile
2. StartMenu.tsx — Add touchstart to click-outside, ensure reachable on mobile
3. Taskbar.tsx — Add mobile variant or MobileNav component
4. RadiantsStudioApp.tsx — Add touch events, make canvas fluid
5. RadRadioApp.tsx — Add touch seek handler
6. useIsMobile.ts — Make Desktop/StartMenu use this hook

**Medium priority:**
7. MobileAppModal.tsx — touch-action: pan-y
8. RadRadioApp widget — responsive width
9. WindowTitleBar.tsx — tooltips hover-only on mobile
10. StartMenu.tsx — replace hardcoded calc(100% - 60px)

---

## 3. ESLint Plugin + Tooling

### ESLint Rules — 14 Total, All Implemented

| Rule | Config | Status |
|---|---|---|
| `no-hardcoded-colors` | recommended, internals, strict | Complete, has auto-fix |
| `no-hardcoded-spacing` | recommended, internals, strict | Complete |
| `no-hardcoded-typography` | recommended, internals, strict | Complete |
| `no-hardcoded-motion` | recommended, internals, strict | Complete |
| `no-removed-aliases` | recommended, internals, strict | Complete |
| `prefer-rdna-components` | recommended (warn), internals (off), strict (error) | Complete |
| `no-raw-radius` | recommended, internals, strict | Complete |
| `no-raw-shadow` | recommended, internals, strict | Complete |
| `no-clipped-shadow` | recommended, internals, strict | Complete, **no test file** |
| `no-pixel-border` | recommended, internals, strict | Complete, **no test file** |
| `no-viewport-breakpoints-in-window-layout` | repo-local only | Complete |
| `require-exception-metadata` | repo-local only | Complete |
| `no-mixed-style-authority` | repo-local only | Complete, dormant (needs `themeVariants` option) |
| `no-broad-rdna-disables` | repo-local only | Complete |

### Test Coverage

12 of 14 rules have dedicated test files. Missing: `no-clipped-shadow`, `no-pixel-border`.

### token-map.mjs — Hand-Maintained

`brandPalette`, `hexToSemantic`, `oklchToSemantic`, `removedAliases`, `rdnaComponentMap` — all manually updated. No script bridges `tokens.css` changes into the ESLint plugin.

### Registry Generation — Automated

- Stage 1: `generate-schemas.ts` scans `*.meta.ts` → writes `*.schema.json`, `*.dna.json`, barrel `meta/index.ts`
- Stage 2: `generate-registry.ts` → assembles `registry.manifest.json`
- CI guard: `check-registry-freshness.mjs` — fails build if manifest drifts

### Build Pipeline

| Command | What |
|---|---|
| `pnpm dev` | turbo dev (all workspaces) |
| `pnpm build` | turbo build |
| `pnpm lint` | turbo lint |
| `pnpm lint:design-system` | RDNA ESLint rules only |
| `pnpm lint:design-system:staged` | Staged files only |
| `pnpm lint:token-colors` | Flags non-oklch colors in CSS |
| `pnpm audit:style-authority` | Style authority audit |
| `pnpm report:rdna-exceptions` | Reports new eslint-disable comments |

### CI/CD

One GitHub Actions workflow: `.github/workflows/rdna-design-guard.yml`
- **design-guard job**: Asserts design.md symlink, grep-blocks removed aliases
- **design-system-lint job**: Reports new exceptions, runs RDNA ESLint, checks registry freshness

**Missing from CI**: `pnpm build`, `pnpm lint` (standard), `pnpm test`, component tests.

### Gaps

1. No auto-generation of `token-map.mjs` from CSS
2. No automated test run in CI
3. `no-clipped-shadow` and `no-pixel-border` have no test files
4. Schema generation not in Turbo pipeline (only manual or CI guard)
5. `no-mixed-style-authority` is effectively dormant
6. `prefer-rdna-components` only covers 5 elements (button, input, select, textarea, dialog)

---

## 4. RadRadio + Motion + Loading + Dithering

### RadRadio — Current Implementation

**Audio**: Headless `RadRadioController` (bare `<audio>` element, persists in Desktop.tsx) + visual `RadRadioApp` (in AppWindow). Communicate via Zustand.

**Sources**: 3 local MP3 files in `/public/media/music/`. One channel (`kemosabe`). Duration values are hardcoded integers (not from audio metadata).

**Seek**: Uses `document.querySelector('audio').currentTime = time` — fragile global DOM query.

**Favorites**: Dual localStorage problem — written by both Zustand persist AND manual `localStorage.setItem`.

**Video Visualizer**: 3 local MP4s in `/public/media/video/`. CRT scanlines + phosphor + vignette CSS overlays. Video and audio advance independently.

**Widget Mode**: Desktop detects widget window, swaps WebGLSun for VideoPlayer wallpaper, shows floating RadRadioWidget (320px).

**Zero SoundCloud code exists.**

### SoundCloud Integration Gap

| Area | Current | Change Required |
|---|---|---|
| Track type | `audioUrl: string` (local) | Add `scTrackId` or `streamUrl` |
| Channels | Single hardcoded | Populate from SC API |
| Playback | `<audio src>` | SC Widget API or OAuth stream |
| Duration | Hardcoded integers | SC API `track.duration` |
| Seek | DOM querySelector | SC Widget `.seekTo()` |

**Critical blocker**: SC API requires OAuth for streaming. Need iframe Widget or backend proxy.

### Motion Audit

**Tokens defined** in `packages/radiants/tokens.css`:
- `--duration-instant: 0ms` through `--duration-slow: 300ms`
- `--easing-default: cubic-bezier(0, 0, 0.2, 1)`
- `--duration-scalar: 1` (zeroed by `prefers-reduced-motion`)

**Tokens almost never used.** Only `PatternsTab.tsx` uses `duration-fast`. Everything else uses hardcoded Tailwind: `duration-100`, `duration-150`, `duration-200`, `duration-500`.

**`prefers-reduced-motion` has no effect** on most transitions — they bypass the CSS variable system.

**Keyframe animations** in `packages/radiants/animations.css`: `slide-in-right`, `fadeIn`, `scaleIn`, `slideIn`. Toast uses `animate-slideIn`. StartMenu uses `animate-in fade-in` (from tailwindcss-animate, not RDNA).

**No animation libraries** (framer-motion etc.) installed.

**Consistency issues:**
- `duration-500` on InvertOverlay violates 300ms max-motion spec
- Easing inconsistent (RDNA easing vs Tailwind default)
- Transitions without explicit duration snap to 150ms default

### Loading Screens

**No splash/boot screen.** App loads straight to `<RadOSDesktop />`.

Lazy-loaded apps use `<Suspense>` with `<AppLoadingFallback>`:
```tsx
<Spinner size={24} />
<p className="mt-2">Loading...</p>
```
The "Loading..." text is unstyled (no font class, no token class).

**Missing**: Boot sequence, skeleton placeholders, audio loading state, WebGL failure fallback.

### Dithering / WebGL

**Two implementations** (only one active):

1. **`WebGLSun.tsx`** (active, `components/background/`) — Binary 4x4 Bayer dither via conditionals, dark mode color lerp, sun arc + wave rings + mouse trail + repulsion. 720x720 canvas with `image-rendering: pixelated`. High quality.

2. **`SunBackground.tsx`** (dead code, `components/Rad_os/`) — Simpler 3-color dither, no dark mode. 315 lines, exported but no live consumer.

**Gaps**: No WebGL failure fallback (blank background). Fixed 720px canvas scales up on wide viewports. Dead SunBackground still ships.

---

## 5. Skills + Documentation

### Skills Inventory

**1 skill exists** in-repo: `apps/rad-os/.claude/skills/rdna-reviewer/`

| File | Lines | Role |
|---|---|---|
| `SKILL.md` | 69 | Entry point |
| `references/checks.md` | 45 | Rule catalog |
| `scripts/rdna_qc.py` | 295 | Python audit runner |
| `agents/openai.yaml` | 4 | Agent metadata |

**Status**: Mostly current. Minor prose issue in SKILL.md step 1 about "root" path resolution.

### Documentation Assessment

| File | Status | Issue |
|---|---|---|
| Root `CLAUDE.md` | Mostly current | "42 components" → 40, "9 apps" → 7 |
| `apps/rad-os/CLAUDE.md` | **Severely outdated** | References deleted devtools, non-existent skills, missing directories |
| `packages/radiants/CLAUDE.md` | Accurate | None |
| `docs/theme-spec.md` | Accurate | None |
| `packages/radiants/README.md` | Incomplete | Missing 18 components, lists deleted HelpPanel |
| `references/design-playground/UPSTREAM.md` | Path error | `apps/playground/` → `tools/playground/` |

### Stale Content

- `ops/sessions/`: **2,631 files, 10 MB** — session log tombstones. Safe to purge.
- `templates/`: Does not exist at repo root (only inside `prompts/dna-conversion/templates/`).
- `prompts/dna-conversion/`: Still relevant, keep.

---

## 6. RadOS Apps + Brand Assets

### App Inventory

| id | Title | Status | Lines | Issues |
|----|-------|--------|-------|--------|
| `brand` | Brand Assets | **Complete** | 1054 | Download paths broken, font URLs wrong |
| `manifesto` | Manifesto | **Complete** | 100 | Clean |
| `music` | Rad Radio | **Complete** | 837 | console.log noise, fragile seek, hardcoded colors (excepted) |
| `links` | Links | **Stub** | 17 | "Coming soon" only |
| `about` | About | **Partial** | 157 | Placeholder team/acknowledgment data |
| `studio` | Radiants Studio | **Partial** | 572 | NEXT button is console.log stub, hardcoded hex colors |
| `trash` | Trash | **Complete** | 59 | Empty (no trashed apps) |

### Brand Assets Deep Dive

**01 Logos/Marks** — 9 logo configs. Copy SVG works. Download broken:
- PNG subdirectory `/assets/logos/PNG/` does not exist
- Filename mismatch: code uses `mark-cream`, actual file is `rad-mark-cream`
- SVG downloads may 404 for mark variants

**02 Color Palette** — Brand (3), Extended (4), Semantic (22 tokens). Hex values hardcoded (drift risk). Click-to-copy works.

**03 Typography** — Three fonts. **Joystix and Mondwest download URLs both point to a "Bonkathon Wordmark" Dropbox ZIP** (wrong asset). PixelCode has empty downloadUrl (intentional).

**04 UI Toolkit** — Delegates to `<DesignSystemTab>`. Functional, uses live registry.

**05 Pixel Toolkit** — Delegates to `<PatternsTab>`. Functional.

**06 AI Toolkit** — 2 Midjourney sref codes with 4 reference images each. Sparse. Images present in `/public/assets/images/`.

### Top 5 Apps Needing Work

1. **LinksApp** — 100% stub
2. **BrandAssetsApp** — Broken downloads, wrong font URLs, hardcoded semantic hex
3. **RadiantsStudioApp** — NEXT stub, hardcoded hex, mouse-only canvas
4. **AboutApp** — Placeholder data
5. **RadRadioApp** — Fragile seek, console.log noise, share button unwired

### Broken Imports / Dead References

- `Desktop.tsx` imports `getAppMockStates` from `@/lib/mockStates` — file marked deleted in git
- `core/index.ts` exports HelpPanel and MockStatesPopover — both deleted
- Logo download paths don't match actual filenames
- Font download URLs point to wrong Dropbox asset

---

## 7. Store + Architecture

### Store Architecture

5 slices merged via spread into `RadOSState` with `devtools` + `persist` middleware.

| Slice | State |
|---|---|
| `windowsSlice` | `windows[]`, `nextZIndex`. Open/close/focus/resize/position/fullscreen/widget/tab. |
| `preferencesSlice` | `volume`, `reduceMotion`, `invertMode`, `darkMode`. |
| `mockDataSlice` | `radiants[]`, `studioSubmissions[]`. |
| `walletSlice` | `isWalletConnected`, `walletAddress`, `ownedRadiants[]`, `activeMockState`. |
| `radRadioSlice` | Video/track indices, channel, isPlaying, currentTime, favorites. |

**Persistence**: `rados-storage` v1 persists volume, reduceMotion, darkMode, radioFavorites. Windows and invertMode excluded (session-only).

**Known Issues:**
- `store/index.ts:32`: `migrate` returns `Partial<RadOSState>` (type error, pre-existing)
- Dual localStorage for radioFavorites (Zustand persist + manual `localStorage.setItem`)
- `radRadioSlice` prefixes all fields with `radio` (naming inconsistency vs other slices)
- No circular dependencies between slices

### Hooks

| Hook | Purpose | Quality | Issues |
|---|---|---|---|
| `useWindowManager` | Facade over windows slice | Good | Subscribes to 9+ individual selectors |
| `useHashRouting` | URL hash ↔ window sync | Good | `setTimeout(100)` timing hack, unused `closeWindow` |
| `useIsMobile` | Viewport width check | Dead code | Not exported, not imported anywhere |
| `useKonamiCode` | Konami code detection | Good | None |

### Window System

**AppWindow.tsx** (560 lines):
- `hasAutoSized` state declared but never written to `true` — dead state
- `TASKBAR_HEIGHT = 48` duplicated here and in windowsSlice
- Double focus fire: both `onMouseDown` and `onClick` call `focusWindow`
- Fullscreen uses `overflow-hidden` (pixel-corners conflict)
- CSS `position: 'absolute'` set as both class and inline style

**Desktop.tsx**: Clean after refactor. Inline mobile detection duplicates `useIsMobile`.

**Taskbar.tsx**: `StartButton` export unused. Social URLs hardcoded in both Taskbar and StartMenu. `data-start-button` attribute referenced in StartMenu but not applied to any element.

**StartMenu.tsx**: Mobile close button uses inline SVG path instead of Icon component. `border-rule` token used (verify existence).

### Code Quality

- **`any` types**: 0 across all rad-os files
- **TODOs**: 1 (in scaffolding script, not production)
- **console.log in production**: RadiantsStudioApp (stub), RadRadioApp (debug logs), BrandAssetsApp (acceptable error logs)
- **Dead code**: `lib/colors.ts` (unused), `hooks/useIsMobile.ts` (unused), `hasAutoSized` in AppWindow, `StartButton` in Taskbar, `SunBackground` in Rad_os/

### Test Coverage

**Zero test files exist in `apps/rad-os/`.** Everything is untested: store slices, hooks, window system, all apps.

### Top Architectural Concerns

1. **Dual localStorage for radioFavorites** — persist middleware + manual write will silently drift
2. **`migrate` type error** — no-op passthrough means schema changes silently fail
3. **`data-start-button` guard broken** — clicking Start immediately closes menu
4. **Dead SunBackground** — 315 lines shipped but unused
5. **`useIsMobile` unused** — mobile detection duplicated 3x
6. **Zero test coverage** — largest quality risk
