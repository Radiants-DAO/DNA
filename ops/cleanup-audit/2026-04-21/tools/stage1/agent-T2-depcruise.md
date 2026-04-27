# Lane T2 — dependency-cruiser 17.3.10 (2026-04-21)

**Raw:** `tools/depcruise.json` (1.2 MB), `tools/depcruise-validate.txt`, `tools/depcruise-metrics.txt`, `tools/depcruise-cross-pkg-deep.json`, `tools/depcruise-orphans.json`, `tools/depcruise-unresolved.json`.
**Config:** `tools/depcruise.config.cjs` (audit-only, not wired to CI).
**Coverage:** 786 modules / 1206 dependencies cruised.
**Cap:** 30.
**Total findings:** 10.

## Headline counts

| Rule | Count | Real after filtering |
|---|---|---|
| no-circular | 0 | **0** — no cycles. |
| no-orphans | 25 | **~7 real** (the other 18 are `types.ts` barrels re-exported via wildcard, not traceable without tsconfig paths). |
| not-to-unresolvable | 123 | **34 real** (32 `@rdna/ctrl/*` deep subpaths + `react-draggable` + `server-only`). The other 89 are `@/…` Next.js path aliases that my audit config can't see without tsconfig. |
| deep-import-into-package | 701 | **125 real cross-package** (576 are same-package `@/` false positives). |
| not-to-dev-dep | 0 | — |
| not-to-test | 0 | — |
| no-deprecated-core | 0 | — |
| no-duplicate-dep-types | 0 | — |

## Findings

| # | ID | File | Line | Severity | Category | Finding | Suggested fix | Effort | Cross-lane |
|---|---|---|---|---|---|---|---|---|---|
| 1 | T2-DEEP-01 | `apps/rad-os/app/ctrl-preview/page.tsx` | 5-37 | **crit** | deep-bypass-pkg-exports | 32 imports like `@rdna/ctrl/controls/Knob/Knob`, `@rdna/ctrl/selectors/ColorPicker/ColorPicker`. `packages/ctrl/package.json` only exports `.`, `./css`, `./controls`, `./selectors`, `./readouts`, `./layout` — the deep subpaths are **not in the exports map**. This works today only because Next.js doesn't enforce pkg exports, but will break once ctrl is published or consumed from outside the monorepo. | Route all ctrl imports through `@rdna/ctrl/controls`, `@rdna/ctrl/selectors`, `@rdna/ctrl/readouts`, `@rdna/ctrl/layout` barrels. Add components missing from those barrels (ScrubSurface, ColorPicker) first. | M | DEAD-001, DEAD-002, T1-KNIP-002/003 |
| 2 | T2-DEEP-02 | `apps/rad-os/components/apps/typography-playground/TemplatePreview.tsx` | 4 | high | unlisted-dep | `import Draggable from 'react-draggable'` but `react-draggable` is declared only in `@rdna/radiants/package.json`. rad-os gets it by pnpm hoisting. | Add `react-draggable` to `apps/rad-os/package.json` dependencies. | XS | DEDUP-002 |
| 3 | T2-DEEP-03 | `apps/rad-os/lib/icon-conversion-review.ts` | top | med | server-only-unresolved | `import 'server-only'` from `server-only` virtual module — depcruise can't resolve (Next.js virtual). | No action; false positive at audit layer. | XS | |
| 4 | T2-DEEP-04 | 41 `.meta.ts` files in `packages/radiants/components/core/**` | — | low | cross-pkg-define-util | All meta files import `@rdna/preview/src/define-component-meta.ts` via a deep path. `preview/package.json` exports `.` → `./src/index.ts`, and `./cli` → cli binary, but `./src/define-component-meta` is not in the exports map. | Either (a) add `./src/define-component-meta` to preview's exports map, or (b) re-export `defineComponentMeta` from `./src/index.ts` and migrate the 41 meta files. | M | |
| 5 | T2-DEEP-05 | 24 `.meta.ts` files in `packages/ctrl/**` | — | low | cross-pkg-define-util | Same pattern as T2-DEEP-04. | Same fix; resolves both together. | — | |
| 6 | T2-DEEP-06 | `packages/radiants/scripts/{generate-pattern-css.ts,generate-pixel-icon-registry.ts}` | — | low | cross-pkg-generator-internal | Build script imports `packages/pixel/src/patterns/registry.ts`, `packages/pixel/src/icons/registry.ts`, `packages/pixel/src/path.ts` directly (bypassing `@rdna/pixel` entry). | Acceptable for build scripts (not runtime). Add a one-line comment marking these as intentional internal reaches, or expose the registries from pixel's `src/index.ts`. | S | |
| 7 | T2-DEEP-07 | `packages/ctrl/selectors/TransportButton/TransportButton.tsx` | — | low | cross-pkg-runtime-icon | Deep import: `packages/radiants/icons/runtime.ts`. `@rdna/radiants/package.json` exports `./icons/runtime` — so this is actually fine at runtime but depcruise's deep-into-package rule still warns. Mark as allowed. | No action; note as intentional public entry. | — | |
| 8 | T2-ORPHAN-01 | `packages/ctrl/controls/ScrubSurface/ScrubSurface.tsx` | whole file | high | orphan-module | Orphan per depcruise (no in-graph importers — ctrl-preview imports via deep path not resolved by depcruise). | Add to `controls/index.ts` or delete. | S | DEAD-001, T1-KNIP-002 |
| 9 | T2-ORPHAN-02 | `packages/ctrl/selectors/ColorPicker/ColorPicker.tsx` | whole file | high | orphan-module | Same. | Same. | S | DEAD-002, T1-KNIP-003 |
| 10 | T2-ORPHAN-03 | `packages/radiants/vitest.config.ts` + various `types.ts` files | — | low | orphan-but-legitimate | 10+ `types.ts` barrels flagged as orphans because they're re-exported via wildcard `export * from` that depcruise's default rule set can't cross. | No action; adjust `no-orphans` rule path-not list if the audit config is ever wired to CI. | — | |

## What's NOT a finding (verified false positives)

- 576 `deep-import-into-package` warnings involving `@/…` → actual same-package Next.js tsconfig `paths` aliases. My audit config's regex-without-backrefs mis-categorized them.
- 89 `not-to-unresolvable` entries targeting `@/…` aliases — same cause.
- All `apps/rad-os/hooks/*`, `apps/rad-os/lib/*`, `apps/rad-os/store/*`, `apps/rad-os/components/apps/*` "orphan" flags — false positives for the same reason (importers use `@/` aliases).
- `apps/rad-os/app/{apple-icon,icon}.tsx` — Next.js magic route files; correct that they have no static importers.

## Recommended follow-up (not a finding)

If you want depcruise in CI, add a root `tsconfig.json` with `extends` + `paths` declarations for both `@/` (rad-os) and `@rdna/*` (workspaces) so depcruise can resolve them. Right now the audit only works because we ran with the tsc engine picking up the workspace hoisted install.
