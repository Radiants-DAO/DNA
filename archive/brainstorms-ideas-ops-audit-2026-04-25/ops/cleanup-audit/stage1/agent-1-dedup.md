# Agent 1 — Deduplication & DRY (Stage 1)

**Dispatch:** main @ `d658b2b5` (clean tree). Tools: rg / Read / Glob only. No `knip`/`madge` run.

**Scope:** utilities, hooks, shared constants, inline-repeat helpers *inside* a single package or app. The apps/rad-os <-> packages/radiants component boundary is copy-on-import and was not traversed. Patterns with only 2 usages were not promoted.

## Critical assessment (ordered by severity x confidence)

### 1. DEDUP-001 — Three identical `clamp` helpers in `packages/ctrl` (consolidation_candidate, conf 0.97)

- `packages/ctrl/primitives/useDragControl.ts:16-18`
- `packages/ctrl/selectors/Stepper/Stepper.tsx:43-45`
- `packages/ctrl/controls/Ribbon/Ribbon.tsx:39-41`

Byte-identical `function clamp(v, min, max)` declared privately in three files inside the same package. `useDragControl.ts` is the natural home — it already hosts `snapToStep` and `normalize` primitives used by the rest of `@rdna/ctrl`. Promote to an internal shared math util (or export from `primitives/`) and import. Low blast radius, low risk: single package, internal only, no public API change required if exported only within `@rdna/ctrl` or from `primitives/types.ts` sibling.

### 2. DEDUP-002 — Repeated "fonts.ready then layout" SSR-safe block in rad-os pretext views (consolidation_candidate, conf 0.90)

- `apps/rad-os/components/apps/pretext/primitives/book/BookView.tsx:101-125`
- `apps/rad-os/components/apps/pretext/primitives/broadsheet/BroadsheetView.tsx:159-190`
- `apps/rad-os/components/apps/pretext/primitives/editorial/EditorialView.tsx:147-175`

All three `*View.tsx` files contain:
```ts
const ready = typeof document !== 'undefined' && 'fonts' in document && document.fonts?.ready
  ? document.fonts.ready
  : Promise.resolve();
void ready.then(() => { if (cancelled) return; /* layout call */ });
```
Identical structure, three sibling files, all in `apps/rad-os/components/apps/pretext/primitives/*`. A tiny hook (`useFontsReady`) or helper inside the shared sibling folder (`pretext/primitives/shared/`) removes the repeat with no external API change. Manifesto and GoodNewsLegacyApp use the simpler un-guarded `document.fonts.ready.then(...)` form — those are 4 more usages of the *concept* but a different code shape, so they are left out unless a follow-up proves convergence.

### 3. DEDUP-003 — rem->px conversion across the rad-os/core boundary (intentional_copy_on_import, conf 0.93)

- `apps/rad-os/lib/windowSizing.ts:15-21`
- `packages/radiants/components/core/AppWindow/AppWindow.tsx:210-222`

Near-identical root-font-size reads sit on opposite sides of the copy-on-import boundary. Recorded so a later agent does not re-flag it. No action.

### 4. DEDUP-004 — templates/rados-app-prototype scaffold clones (intentional_copy_on_import, conf 0.97)

- `templates/rados-app-prototype/lib/windowSizing.ts` vs `apps/rad-os/lib/windowSizing.ts`
- `templates/rados-app-prototype/store/slices/windowsSlice.ts` vs `apps/rad-os/store/slices/windowsSlice.ts`
- `templates/rados-app-prototype/hooks/useThemeSync.ts` vs `apps/rad-os/components/Rad_os/InvertModeProvider.tsx:22-44`

`templates/*` is consumed by `@rdna/create` as scaffold sources; the duplication is the product, not drift. Recorded so Agent 3 (dead-code) and Agent 8 (slop) leave it alone. No action.

### 5. DEDUP-005 — Widespread `new ResizeObserver(...)` (intentional_copy_on_import, conf 0.90)

Eight distinct call sites (apps/rad-os, packages/radiants/core, packages/ctrl) but each observes a semantically different target: container width+height, toolbar height, canvas DPR/resize, single-width column. Within `apps/rad-os` alone only `hooks/useContainerSize.ts` + `GoodNewsLegacyApp.tsx` share the "generic size tracker" shape — 2 usages, below threshold. Everything else crosses the copy-on-import boundary or wraps domain-specific logic (PixelBorder effective radius, AppWindow cascade centering, useCanvasRenderer DPR). No consolidation proposed.

## Negative findings (searched, no 3+ consolidation candidate)

- `snapToStep` (2 occurrences — `useDragControl`, `Ribbon`). Below threshold.
- `toPascalCase` (3 files but split across published package `@rdna/create` and two internal generator scripts — `generate-icons.ts` + the superseded `generate-icons.mjs`). Better handled by Agent 3 (the `.mjs` version is a likely dead-code/legacy shim).
- `cn`/`cx` class merger: no local helper — all files use template-literal strings or `cva` directly. Nothing to consolidate.
- `typeof window === 'undefined'` SSR guards: idiomatic, not a DRY target.
- `document.documentElement.classList.toggle('dark', ...)` — only 1 in-app occurrence (`InvertModeProvider`), plus 1 scaffold copy; below threshold.
- `matchMedia('(prefers-reduced-motion: reduce)')`: 1 occurrence.
- Click-outside pointerdown listener: 1 occurrence (`StartMenu`).
- `createCompoundContext` already exists and is used by 7 compound components inside `packages/radiants/components/core`. Good; no action.
- `packages/pixel/src/*` functions are non-overlapping and well-factored.

## Risks / blocked items

- No files are dirty (clean tree), so nothing is blocked on that dimension.
- DEDUP-001 is the clearest auto-approval candidate under the minimal approval policy (conf >= 0.90, blast radius low, single canonical owner, no package root barrel edit).
- DEDUP-002 is also auto-approvable if the coordinator accepts a new file under `pretext/primitives/shared/`; that folder already exists (`prepared-text-cache.ts`), so it is not a new package-level surface.

## What I did not do

- I did not traverse the apps/rad-os <-> packages/radiants component boundary per the copy-on-import rule.
- I did not invoke knip or madge (not installed per dispatch).
- I did not propose abstractions for 2-usage patterns.
- I did not touch `.meta.ts`, `.schema.json`, tokens.css, or icon assets.
