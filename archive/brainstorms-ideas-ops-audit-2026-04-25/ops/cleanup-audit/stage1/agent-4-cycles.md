# Agent 4 — Circular Dependency Audit

**Dispatch:** Stage 1 read-only, HEAD `d658b2b5`, branch `main`, clean tree.
**Tools:** Manual graph trace via `rg`, barrel reads, and `package.json` deps. `madge` not installed.

## Executive Summary

No live runtime circular dependencies exist in the monorepo today — neither at the package level nor at the module level. Package-level graph is a clean DAG:

```
rad-os ──┬──> @rdna/ctrl ───┬──> @rdna/preview  (devDep, via *.meta.ts files)
         │                  └──> @rdna/radiants (devDep, only referenced in docs/tests)
         └──> @rdna/radiants ─┬──> @rdna/pixel
                              └──> @rdna/preview (devDep, meta)
@rdna/preview: no @rdna/* deps
@rdna/pixel:   no @rdna/* deps
@rdna/create:  no @rdna/* runtime deps
```

No reverse edges — confirmed by scanning every `@rdna/*` import site.

Three near-cycle / barrel-drift findings are reported, all classified `consolidation_candidate`. Two of them touch `packages/ctrl` (explicitly called out in the brief); the third is a preventive reshape inside `apps/rad-os/lib/apps` that is safe today only because of `React.lazy`.

## Findings

### CYCLE-001 — ctrl root barrel drift (consolidation_candidate, 0.95, high)

`packages/ctrl/index.ts` re-exports a **subset** of what the per-area sub-barrels export. Missing from the root:

| Missing from root | Present in sub-barrel |
|---|---|
| `IconRadioGroup`, `IconRadioOption`, `IconRadioGroupProps` | `selectors/index.ts:11-12` |
| `NumberInput`, `NumberInputProps` | `controls/index.ts:8-9` |
| `ProgressBar`, `Tooltip`, `TooltipProvider`, `TooltipProps` | `readouts/index.ts:6-8` |
| `ColorPicker` | file exists (`selectors/ColorPicker/ColorPicker.tsx`) but is not exported from any barrel |

Consumers of `@rdna/ctrl` (rad-os imports at `apps/rad-os/app/ctrl-preview/page.tsx`, `apps/rad-os/components/apps/pattern-playground/GlowControls.tsx`) therefore see a smaller surface than consumers of `@rdna/ctrl/selectors` or `@rdna/ctrl/readouts`. Not a cycle, but a structural inconsistency that invites one the next time someone adds a cross-area helper.

**Proposed fix:** make `packages/ctrl/index.ts` a pure passthrough (`export * from './controls'`, etc.), and decide whether `ColorPicker` should be registered or deleted.

### CYCLE-002 — ctrl selectors/IconRadioGroup → readouts/Tooltip (consolidation_candidate, 0.88, medium)

`packages/ctrl/selectors/IconRadioGroup/IconRadioGroup.tsx:6`:

```ts
import { Tooltip } from '../../readouts/Tooltip/Tooltip';
```

This is the only cross-sub-package leaf-to-leaf import inside ctrl. Today it is not a cycle because no file under `readouts/*` imports from `selectors/*`. The risk is that Tooltip is a generic overlay primitive, not a readout — siting it under `readouts/` puts any future cross-coupling one edit away from forming a selectors↔readouts cycle.

**Proposed fix:** relocate Tooltip to `packages/ctrl/primitives/Tooltip/` (leaf module, already in the dependency bottom of the ctrl graph) or a new `packages/ctrl/overlays/` area, and update the three or four import sites accordingly.

### CYCLE-003 — rad-os `lib/apps/catalog.tsx` vs `components/apps/*Apps` (consolidation_candidate, 0.82, high)

`apps/rad-os/lib/apps/catalog.tsx` uses `React.lazy(() => import('@/components/apps/FooApp'))` for 7 apps (lines 5-11). Those same app components statically import `type AppProps` from `@/lib/apps`:

```
apps/rad-os/components/apps/BrandAssetsApp.tsx:5
apps/rad-os/components/apps/ManifestoApp.tsx:2
apps/rad-os/components/apps/RadRadioApp.tsx:12
apps/rad-os/components/apps/AboutApp.tsx:3
apps/rad-os/components/apps/ScratchpadApp.tsx:6
apps/rad-os/components/apps/goodnews/GoodNewsLegacyApp.tsx:3
```

`@/lib/apps` is just `export * from './catalog'`. No runtime cycle because `lazy()` uses a dynamic `import()`, but the cycle `catalog.tsx → (dynamic) components/apps/*App.tsx → (static) lib/apps/index.ts → catalog.tsx` forms the instant anyone swaps `lazy()` for a static import during debugging.

**Proposed fix:** move `AppProps` (and any other consumer-only types) into `apps/rad-os/lib/apps/types.ts` with zero runtime dependencies, and have the app components import from there. Leaves the catalog barrel untouched.

## What is NOT a cycle (checked)

All of the following were verified and are clean DAGs:

- `packages/radiants/components/core/*` internal cross-component imports (Toggle→Button, Toast→Alert, AppWindow→Button/ScrollArea/Separator/Tabs/Tooltip, ToggleGroup→Toggle, Alert→Button, NumberField→Spinner, etc.). No file imports back up through `../index`.
- `packages/radiants/registry/*` → `packages/radiants/meta/index.ts` → `components/core/*/*.meta.ts`: strictly downstream. Components do not import registry or meta.
- `packages/radiants/icons/*`: `index → runtime → Icon → resolve-icon/types`, no back-edges.
- `packages/radiants/patterns/*`: `index → registry → types` and sibling pretext-* modules. Linear.
- `packages/radiants/eslint/*`: `index → rules/* → contract/utils`. Linear.
- `packages/radiants/pixel-icons/*`: `index → {types, source, registry}`, `registry → types`, `types → source`. DAG.
- `packages/pixel/src/*`: everything depends on `types` and `core`, clean DAG.
- `packages/create/src/*`: `cli → {names, scaffold}`, `scaffold → {names, template}`. Linear.
- `packages/preview/src/*`: no internal multi-file cycles.
- `apps/rad-os/store/*`: `index → slices/*`, slices depend on `@/lib/apps` and `@/lib/windowSizing` (leaves). No back-edge from lib or hooks.
- `apps/rad-os/hooks/*`: `useWindowManager → @/store`, `useHashRouting → @/lib/apps`. No hook imports a component that re-enters hooks.
- `apps/rad-os/components/apps/pretext/*`: `primitive-registry/types → markdown → views`. DAG.
- `apps/rad-os/components/apps/studio/*`: `constants` is the leaf; `PixelArtEditor` composes the rest. DAG.
- `apps/rad-os/components/Rad_os/*`: barrel is a leaf re-exporter; no component imports the barrel.

## Severity Ranking

| ID | Confidence | Blast | Priority |
|---|---|---|---|
| CYCLE-001 | 0.95 | high | 1 — clear surface drift, mostly mechanical |
| CYCLE-002 | 0.88 | medium | 2 — small scoped move, removes a structural risk |
| CYCLE-003 | 0.82 | high | 3 — preventive only; fine to defer until a cycle actually appears |

## Notes / Surprises

- The `@rdna/ctrl` root barrel omitting IconRadioGroup/NumberInput/ProgressBar/Tooltip was unexpected given the brief explicitly flagged `packages/ctrl/index.ts`. Likely the sub-barrels were extended without updating the root — a CI test that asserts "root barrel re-exports the union of all sub-barrels" would catch this going forward.
- No `madge` was needed. All observed graphs are small enough to trace by hand, and there are no dynamic `require()` or `import.meta.glob` call sites that would hide an edge.
