# Agent 8 — AI Slop & Comment Cleanup (Stage 1)

**Dispatch:** HEAD `d658b2b5` on `main`, clean tree.
**Scope:** Low-value comments, filler annotations, trivial wrappers, pass-through barrels.
**Out of scope (deferred):** Copy-on-import comment parity, RDNA exception comments, `.meta.ts` contract descriptions, generator headers, vendored library (`apps/rad-os/lib/dotting/**`) with `@ts-nocheck` banner.

Findings are ordered by severity/confidence. All reference `main @ d658b2b5`; the tree is clean, so none are blocked on dirty files.

---

## High-confidence — running-commentary comments

### SLOP-001 — Running-commentary comments in `useKonamiCode.ts`
**Classification:** `comment_cleanup` · **Confidence:** 0.92 · **Blast radius:** low

`apps/rad-os/hooks/useKonamiCode.ts` uses seven line comments inside a ~55-line `useEffect` that each restate the next statement verbatim: `// Clear any existing timeout` (line 55), `// Add key to sequence` (line 60), `// Check if sequence matches so far` (line 63), `// Check if current sequence matches expected` (line 68, duplicates the word "matches" in code below), `// Reset if sequence doesn't match` (line 74), `// Check if full sequence is complete` (line 79), `// Set timeout to reset sequence if user takes too long` (line 86). None provide non-obvious context; the code already reads as prose. The leading `// Konami Code sequence: Up Up Down Down Left Right Left Right` at line 5 is the only comment with value (it names the sequence).

### SLOP-002 — Running-commentary comments in `WebGLSun.tsx`
**Classification:** `comment_cleanup` · **Confidence:** 0.93 · **Blast radius:** low

`apps/rad-os/components/background/WebGLSun.tsx` has ten inline comments that describe the next WebGL API call instead of explaining intent: `// Get locations` (339), `// Animation loop` (424), `// Set viewport` (466), `// Clear canvas` (469), `// Use program` (473), `// Set uniforms` (476), `// Draw` (496), `// Bind position buffer` (486), `// Bind texture coordinate buffer` (491), `// Start animation` (508), `// Cleanup` (511). The companion comments at lines 351/359/365/397/424 plus the `// ===== Constants/Shaders/Component` section banners already carry the file structure. The listed ten are pure restatement.

### SLOP-003 — Restatement comments in `windowsSlice.ts`
**Classification:** `comment_cleanup` · **Confidence:** 0.74 · **Blast radius:** low

`apps/rad-os/store/slices/windowsSlice.ts` mixes genuinely useful hints (`// SSR safety check` line 57, `// Warn if more than 5 windows (soft limit)` line 182, `// Re-opening: use stored position` line 124) with restatement comments that add nothing: `// Default window size estimate if not provided` (69), `// Calculate centered position` (73), `// Apply cascade offset if multiple windows are open` (77), `// Ensure window doesn't go off-screen` (83), `// Compute target size from catalog defaults` (114), `// Compute target position` (121), `// Resolve size from catalog defaults` (171), `// Calculate centered position (with cascade offset for multiple windows)` (178). Confidence lowered because some reviewers may prefer these as narrative cues in a long action reducer.

---

## High-confidence — trivial wrappers (dead_code)

### SLOP-004 — `apps/rad-os/hooks/useWindowManager.ts` wraps stable store actions in `useCallback`
**Classification:** `dead_code` · **Confidence:** 0.88 · **Blast radius:** medium

Lines 81–154 wrap nine Zustand store actions in `useCallback` without adding logic. Zustand store actions are already referentially stable, so every one of `openWindow`, `openWindowWithZoom`, `closeWindow`, `focusWindow`, `toggleFullscreen`, `toggleWidget`, `updateWindowPosition`, `updateWindowSize`, and `setActiveTab` is a zero-value wrapper — each useCallback simply calls `storeFoo(...)` with the same arguments. `toggleWindow` (123) is the only callback that adds real logic (checks state, picks open vs close). The inline `// State`, `// Actions`, `// Queries` section comments inside the interface (11/14/26), and the inside-function `// Select state and actions from Zustand store` (62), `// Computed: open windows` (74), `// Actions with stable references` (80), `// Queries` (156) are all restatement. Recommendation: drop the useCallbacks (return the store actions directly), then delete the redundant comments.

### SLOP-005 — `apps/rad-os/components/ui/index.ts` is a doc-only empty barrel
**Classification:** `legacy_path` · **Confidence:** 0.95 · **Blast radius:** low

The file exports nothing; it only contains a JSDoc block telling readers to import from `@rdna/radiants/components/core`. A repo-wide grep (`from '@/components/ui'`) finds zero code importers (only `archive/rad-os/migration-guide-rad_os.md` mentions it in prose). Consumers who want `DesignSystemTab` import `@/components/ui/DesignSystemTab` directly. This file is reachable only as a 404 landing comment — remove or move the guidance into a README/migration note.

### SLOP-006 — `apps/rad-os/lib/mockData/index.ts` is an unused single-file barrel
**Classification:** `legacy_path` · **Confidence:** 0.93 · **Blast radius:** low

`apps/rad-os/lib/mockData/index.ts` contains `// Central export for all mock data` + `// Tracks (Rad Radio App)` + `export * from './tracks';`. The directory only has `tracks.ts`, and every importer (`radRadioSlice.ts:2`, `RadRadioApp.tsx:11`) targets `@/lib/mockData/tracks` directly — never `@/lib/mockData`. The barrel is a pure pass-through to a single module with zero importers. Remove the barrel, delete the running-commentary comments it contains.

### SLOP-007 — `apps/rad-os/lib/apps/index.ts` is a single-file barrel
**Classification:** `legacy_path` · **Confidence:** 0.75 · **Blast radius:** medium

`apps/rad-os/lib/apps/index.ts` is `export * from './catalog';` alongside a `catalog.tsx` sibling. The barrel is heavily imported (13+ `@/lib/apps` call sites across the app). Technically classifies as a single-file barrel per brief, but the re-export is an intentional public-API seam for the app catalog (see `archive/plans/2026-03-19-rados-app-catalog-boundary.md`). Reporting at lower confidence so the coordinator can decide: "collapse to direct `@/lib/apps/catalog` imports" vs "keep as documented boundary".

---

## Medium-confidence — section banners + compact structural comments

### SLOP-008 — Oversized section banners in short component files
**Classification:** `comment_cleanup` · **Confidence:** 0.72 · **Blast radius:** low (but wide)

The RDNA core components follow a template that injects `// ========` banners titled `Types`, `Component`, and (in some files) `Export` even in short files (Badge 70 lines, Separator 89, Spinner 139). Pure-restatement banners include:

- `packages/radiants/components/core/AlertDialog/AlertDialog.tsx:257` — `// Export` above a single `AlertDialog` object and default export.
- `packages/radiants/components/core/NumberField/NumberField.tsx:210`, `Dialog/Dialog.tsx:232`, `Select/Select.tsx:230`, `InputSet/InputSet.tsx:61`, `Alert/Alert.tsx:145`, `Drawer/Drawer.tsx:300` — same `// Export` banner over a trivial re-export block.
- `packages/radiants/components/core/Badge/Badge.tsx:34/45`, `Separator/Separator.tsx`, `Spinner/Spinner.tsx`, `DesktopIcon.tsx:7/22`, `WindowTitleBar.tsx:7/70`, `AboutApp.tsx:6/32`, `BrandAssetsApp.tsx:21/41`, plus most of `packages/radiants/components/core/*/*.tsx` — repeated `// ======== Types ========` and `// ======== Component ========` banners that partition single-interface + single-component files.

Low confidence because some team style guides treat banners as useful scaffolding. Suggestion: keep banners in files >200 lines with 3+ sections; strip them in files <150 lines that have one interface and one component.

### SLOP-009 — Trivial component wrappers to expose default exports
**Classification:** `dead_code` · **Confidence:** 0.55 · **Blast radius:** medium

`apps/rad-os/components/apps/StudioApp.tsx` (2 lines), `apps/rad-os/components/apps/GoodNewsApp.tsx` (4 lines), and `apps/rad-os/components/apps/ManifestoApp.tsx` (thin `<ManifestoBook />` wrapper) exist only so the catalog `lazy(() => import('@/components/apps/XxxApp'))` targets a stable path. Could be collapsed by pointing `lazy()` at the real components (`./manifesto/ManifestoBook`, `./studio/PixelArtEditor`, `./goodnews/GoodNewsLegacyApp`). Confidence is low because the current indirection makes the catalog robust to internal renames and may be intentional. Report-only.

### SLOP-010 — Unnecessary `// Main`/`// Helpers` dividers in short scripts
**Classification:** `comment_cleanup` · **Confidence:** 0.60 · **Blast radius:** low

`packages/radiants/scripts/generate-icons.mjs:159` and `packages/radiants/scripts/generate-typography-tokens.ts:83` separate "Helpers" (~130 lines earlier) from "Main" via decorated comment blocks. The files are already imperative scripts with one obvious entry flow; the banner is more noise than signal. Minor.

---

## Patterns observed across many files

- **"Types/Component/Export" banner stamp.** Nearly every RDNA core component (30+ files) applies the same `// ======== Types ======== / Component / Export` banner set regardless of file size. Many files have only one interface and one component; banners are pure scaffolding slop in those cases. (See SLOP-008.)
- **Inline `// State / // Actions / // Queries` dividers inside Zustand slice/return interfaces** (`windowsSlice.ts:25,30`; `preferencesSlice.ts:4,10`; `radRadioSlice.ts:5,13`; `useWindowManager.ts:10,14,26`). These are consistent and arguably useful as outline markers — they appear next to >10 properties each. Left as pattern-observation, not a finding.
- **WebGL/canvas restatement comments.** Files driving low-level APIs (`WebGLSun.tsx`, vendored dotting canvas code) tend to accumulate running-commentary comments ("Set uniforms", "Draw", "Cleanup"). SLOP-002 covers WebGLSun; the dotting vendor files are out of scope (carry `@ts-nocheck — vendored canvas engine`).
- **Single-file barrels as "public API seams".** Three encountered: `@/lib/apps/index.ts` (used, SLOP-007), `@/lib/mockData/index.ts` (unused, SLOP-006), `@/components/ui/index.ts` (noop, SLOP-005). Differentiating by importer count is cheap evidence.
- **Zustand action re-wrapping in `useCallback`.** Only `useWindowManager.ts` does this, but thoroughly (9 wrappers). Worth a single-file sweep rather than treating each callback as a separate finding.

No placeholder/dummy-return implementations found in the target workspaces (packages + apps/rad-os). No `// TODO` / `// FIXME` stubs matched; completed-then-abandoned markers are Agent 7's scope.

## Verification recipes (for coordinator use)

- Comment-cleanup only edits: re-run `pnpm lint` and `pnpm test` after edits.
- `useWindowManager` refactor (SLOP-004): `pnpm turbo typecheck --filter=rad-os` + `pnpm --filter rad-os test -- useWindowManager`.
- Barrel removals (SLOP-005/006): `rg --fixed-strings "@/lib/mockData'" apps packages` (expect 0), `rg --fixed-strings "@/components/ui'" apps packages` (expect 0), then `pnpm build --filter=rad-os`.
- Trivial wrappers (SLOP-009): verify `lazy(() => import('./scratchpad/ScratchpadEditor'))` etc. still resolves a default export. Type-check + smoke-test window open for each app.
