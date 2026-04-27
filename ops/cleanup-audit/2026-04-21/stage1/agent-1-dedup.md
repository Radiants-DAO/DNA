# Lane 1 — Dedup & DRY (2026-04-21)

**Seed:** `find_large_functions_tool` (graph), `get_architecture_overview_tool`, grep.
**Cap:** 20.
**Total findings:** 6.

| # | ID | File | Line | Severity | Category | Finding | Suggested fix | Effort | Cross-lane |
|---|---|---|---|---|---|---|---|---|---|
| 1 | DEDUP-001 | `apps/rad-os/app/ctrl-preview/page.tsx` | 77-78 | low | naming-shadow | `const ScrubTrap = ScrubSurface` — unused renamed alias; the name appears only once in the file. | Remove the alias line 77-78 and use `ScrubSurface` directly (or delete the whole section if dead). | XS | DEAD-004 (if ScrubSurface path removed) |
| 2 | DEDUP-002 | `apps/rad-os/components/apps/typography-playground/TemplatePreview.tsx` + `packages/radiants/components/core/AppWindow/AppWindow.tsx` | 4 / 4 | med | duplicate-dep-usage | Both files import `react-draggable` but only `@rdna/radiants/package.json` declares it. `apps/rad-os` relies on pnpm hoisting — fragile. | Add `react-draggable` to `apps/rad-os/package.json` dependencies (keeping radiants's). | S | T1-KNIP-unlisted |
| 3 | DEDUP-003 | `packages/ctrl/controls/Slider/Slider.tsx` + `packages/radiants/components/core/Slider/Slider.tsx` | — | high | near-duplicate | Two Slider components exist. ctrl variant is 505 LOC; radiants variant is ~200. They serve different palettes (DAW vs. general), but overlap on drag-math and keyboard keys. | Extract the pure "value <-> position" math into a shared `@rdna/radiants/hooks/useSliderDragMath` hook consumed by both. No visual change. Product-aware decision — flag for review. | L | REACT-004 |
| 4 | DEDUP-004 | `apps/rad-os/lib/logo-maker/rasterize.ts` + `packages/pixel/src/import.ts` | L12 / L300+ | low | overlap-pure-fn | Both contain image-loading/raster utilities; `loadImage(url)` wrapper is repeated. | Move `loadImage` into `@rdna/pixel/src/io` and import from both sites. | M | |
| 5 | DEDUP-005 | `packages/radiants/components/core/_shared/{SegmentGroup,ModalShell,PatternBackdrop}.tsx` | — | low | shared-but-unused | Three shared shells exist; knip flags types+default exports unused → only internal consumers remain. | Consolidate `SegmentGroup`/`PatternBackdrop` into `ModalShell` or remove the default-export from each (6 line deletions). | S | T1-KNIP-duplicates |
| 6 | DEDUP-006 | `apps/rad-os/lib/dotting/components/Canvas/Editor.tsx` (3840 LOC, class `Editor` 3747 LOC) | 94 | high | god-object | Single class holds the entire pixel editor. Not a dedup target but a decomposition candidate noted here. Derivable from `find_large_functions_tool`. | Out of scope for this audit; recommend dedicated decomposition ticket (Editor.canvas / Editor.tools / Editor.history). | L | |

## Cross-lane clusters

- `ctrl-preview/page.tsx` (1180 LOC) shows up in: DEDUP-001, T2-CROSS-01 (32 deep imports), LEGACY-003 (inline styles), RDNA-DRIFT-04 (`bg-black`, raw `fontSize:10`). Treat as a single refactor target with shared owner.
- Slider × 2 — REACT lane also flagged `Slider` useMemo/useCallback patterns in both; consolidating drag-math would resolve both.

## Not findings (considered + dismissed)

- `Alert.tsx`/`Badge.tsx`/... 41 files with a "duplicate export" per knip: pattern is `export { Alert }` + `export default Alert` in every core component. Not a deduplication issue per se — covered as a single systemic item in T1 lane (systemic pattern removal).
- `.meta.ts` files flagged as "unused files" by knip: false positive (loaded dynamically by `packages/radiants/registry/runtime-attachments.tsx` / `@rdna/preview` scanner). Covered in T1 lane.
