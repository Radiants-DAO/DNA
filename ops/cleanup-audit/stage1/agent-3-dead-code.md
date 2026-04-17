# Agent 3 — Dead Code Removal (Stage 1 Report)

**Dispatch:** HEAD `d658b2b5`, branch `main`, clean tree.
**Toolset:** Manual trace only (`knip` / `madge` treated as unavailable per orchestration rules).
**Scope:** Genuinely unreachable JS/TS exports, unused `package.json` deps, dead component files with zero importers, unused function/variable declarations.

Every candidate below was vetted against five indirect-reference vectors:
1. `rg` across the whole repo (incl. `.md`, `.mjs`, `.json` configs).
2. String-based dynamic imports (`await import('...')`, `lazy(() => import('...'))`).
3. Generator inputs (`scripts/`, `.meta.ts` consumers, `knip.json` `ignoreFiles`).
4. CSS `@import` / `url()` references.
5. Barrel / deep-path re-exports (direct deep paths bypass root barrels).

All guardrail exclusions were respected — no `.meta.ts`, no `.schema.json`, no ESLint plugin rule, no CSS custom property, no icon asset, no pretext authoring primitive, and no `tokens.css` alias block proposed for removal.

---

## Top-severity findings (ranked)

### 1. Unused npm dependency — `motion` in two workspaces (high confidence)

Both `apps/rad-os/package.json:28` and `packages/radiants/package.json:146` declare `motion@^12.38.0`, but no `.ts`/`.tsx`/`.mjs` file imports anything from `motion` or `motion/*`. Tokens named `motion` in the design-system contract are an unrelated CSS concept and do not touch the npm package.

- **Verification (proves zero importers):**
  `rg -n "from ['\"]motion['\"]|from ['\"]motion/|require\(['\"]motion['\"]\)|require\(['\"]motion/" --glob '!node_modules' --glob '!.next' --glob '!.turbo' --glob '!archive'` → no matches.
- **Blast radius:** high (two `package.json` files). Requires coordinator approval per orchestration rules.
- **Proposed action:** remove from both workspaces in one coordinated wave; `pnpm install` regenerates lockfile.

### 2. Unused npm dependency — `ts-node` in rad-os (high confidence)

`apps/rad-os/package.json:58` declares `ts-node@^10.9.2`. No script, config, CLI, or source file references it. The repo uses `node --experimental-strip-types` (see `packages/radiants/package.json` scripts) for TypeScript execution, not `ts-node`.

- **Verification:** `rg -n "ts-node" --glob '!node_modules' --glob '!archive' --glob '!.next' --glob '!.turbo'` → only the one `package.json` line.
- **Blast radius:** high (`package.json`). Coordinator-reviewed wave.

### 3. Superseded generator script — `packages/radiants/scripts/generate-icons.mjs` (high confidence)

A TypeScript rewrite `generate-icons.ts` is the canonical generator (referenced by `packages/radiants/package.json:111` and by icon freshness tests). The `.mjs` version is explicitly listed in `knip.json` `ignoreFiles` and Agent 1's dedup report already flagged it (`ops/cleanup-audit/stage1/agent-1-dedup.md:54`) as a likely dead-code / legacy shim.

- **Verification:** `rg -n "generate-icons\\.mjs" --glob '!node_modules' --glob '!archive'` returns only self-references, a `docs/CODEMAP.md` mention, the `knip.json` ignore entry, and a stale `archive/plans/...` reference.
- **Blast radius:** low (single file under `scripts/`, not re-exported).
- **Proposed action:** delete `packages/radiants/scripts/generate-icons.mjs` and remove the `knip.json` `ignoreFiles` entry for it.

### 4. Dead barrel re-exports — `apps/rad-os/components/Rad_os/{WindowTabs,WindowSidebar}` (high confidence)

`apps/rad-os/components/Rad_os/index.ts:6-7` re-exports `WindowTabs` and `WindowSidebar`. No source file imports them directly or via the barrel. All hits outside the files themselves live in `archive/` or `docs/` (future plans that never shipped) and playwright snapshots.

- **Verification:**
  `rg -n "WindowSidebar|WindowTabs" --glob '*.ts' --glob '*.tsx' --glob '!archive' | rg -v 'WindowTabs\\.tsx|WindowSidebar\\.tsx|Rad_os/index\\.ts'` → empty.
- **Blast radius:** medium (two component files + two barrel lines inside rad-os).
- **Proposed action:** delete `WindowTabs.tsx` + `WindowSidebar.tsx`, remove both `export` lines from `components/Rad_os/index.ts`.

### 5. Dead component — `apps/rad-os/components/ui/PatternsTab.tsx` (high confidence)

`PatternsTab` is exported in `apps/rad-os/components/ui/PatternsTab.tsx:99` but the sibling barrel `components/ui/index.ts` is empty (comment-only) and nothing imports the file. All external references live in `archive/` and `docs/plans/`.

- **Verification:** `rg -n "PatternsTab" --glob '*.ts' --glob '*.tsx' --glob '!archive'` → only the declaration file itself.
- **Blast radius:** low (single orphaned file).

### 6. Empty barrel file — `apps/rad-os/components/ui/index.ts` (high confidence)

The file contains only a JSDoc comment and no exports. No source imports `@/components/ui`; all hits are archive docs.

- **Verification:** `rg -n "from ['\"]@/components/ui['\"]"` → only `archive/rad-os/migration-guide-rad_os.md`.
- **Blast radius:** low. Coupled with finding #5; can be deleted after `PatternsTab` + `DesignSystemTab.tsx` ownership is confirmed (DesignSystemTab is still actively imported).

### 7. Unused exported function — `getPatternsByDensity` (medium confidence)

`packages/radiants/patterns/index.ts:14` defines `export const getPatternsByDensity`. No consumer imports it; sibling helpers `getPatternByName`, `getPatternsByGroup`, `PATTERN_GROUPS` are all actively used.

- **Verification:** `rg -n "getPatternsByDensity" --glob '!node_modules' --glob '!archive'` → only the declaration.
- **Caveat:** `@rdna/radiants` is a published public package (`publishConfig.access: public`), so external consumers cannot be statically verified. Medium confidence; coordinator-review only.

### 8. Orphaned barrel — `packages/radiants/pixel-icons/index.ts` (medium confidence)

The barrel re-exports `pixelIconSource`, `getPixelIcon`, `pixelIconRegistry`, and four types. All current consumers import via deep paths (`../../../pixel-icons/registry`, `../pixel-icons/source`). No import of the barrel exists. However this is a public package surface; removal would narrow the public API.

- **Verification:** `rg -n "from ['\"].*pixel-icons['\"]|@rdna/radiants/pixel-icons"` → no barrel-style imports.
- **Blast radius:** medium — touches published package API shape. Report-only unless confirmed no external consumer relies on the barrel path.

---

## Findings intentionally NOT filed

The following looked plausible but were rejected after tracing indirect references. Listing them here so the coordinator does not re-investigate:

1. **`@mantine/core`, `@mantine/hooks` in `apps/rad-os/package.json`.** No direct imports, but both are declared as peers by `@blocknote/mantine` (confirmed via the `.pnpm` dir path `@blocknote+mantine@0.47.3_...@mantine+core@8.3.18_@mantine+hooks@8._...`). Required runtime deps.
2. **`@svgr/plugin-jsx` in `packages/radiants`.** Referenced as a string plugin name inside `scripts/generate-icons.ts:239`; svgr loads it by require at runtime.
3. **`alertVariants`, `switchTrackVariants`, `buttonRootVariants`, `buttonFaceVariants`, `selectTriggerVariants`, `tabsTriggerVariants`, `cardVariants`, `inputVariants`, `badgeVariants`.** Re-exported by `components/core/index.ts` and consumed indirectly by `registry/runtime-attachments.tsx` (listed in `FORWARDED_PROPS`/variant registries) and tests.
4. **`AppWindowBody`, `AppWindowSplitView`, `AppWindowPane`.** Referenced by `AppWindow.meta.ts` `subcomponents`, `AppWindow.schema.json`, and generated Figma contract; generator-consumer indirect reference.
5. **`apps/rad-os/hooks/{useTypewriter,useKonamiCode,useHashRouting,useContainerSize,useWindowManager}`.** All have at least one active importer (verified).
6. **`@rdna/ctrl` `useDensity`, `useCanvasRenderer`, `useDragControl`, `NumberInput`, `IconRadioGroup`, `ColorPicker`, `ScrubSurface`, `ProgressBar`, `LEDArray`, `LayerTreeRow`, `PanelTitle`, `TooltipProvider`.** All imported via deep paths from `apps/rad-os/app/ctrl-preview/page.tsx` or consumed internally by other ctrl components.
7. **`@rdna/pixel` deprecated `listFilledRects` and other legacy public API (`paintTiledGrid`, `createGridCanvas`, `mirrorForCorner`, `getCornerStyle`, `CORNER_POSITIONS`, `registerShape`, `listShapes`, `animateTransition`, `interpolateFrame`, `computeFlipOrder`).** All are public exports of a published package (`packages/pixel/package.json` sets `publishConfig.access: public`). Only consumed internally + by tests, but external consumers cannot be ruled out. `listFilledRects` is already marked `@deprecated`; belongs in Agent 7's legacy-removal scope, not dead-code.
8. **`apps/rad-os/scripts/import-radiants-pfps.mjs` and `scripts/{export,vectorize}-emojis.py`.** Standalone CLI utilities documented to be run manually; not dead, just out-of-graph.
9. **`packages/radiants/scripts/{pixel-corners-lib,pixel-corners.config,generate-pattern-css}.mjs/ts`.** All referenced by the `packages/radiants/test/` suite via dynamic `await import(...)` — covered by the `knip.json` `ignoreFiles` list for a reason.
10. **`apps/rad-os/lib/mockData/index.ts`** — re-exports only from `./tracks`. No consumer imports the barrel; all use the deep `@/lib/mockData/tracks` path. Barrel could technically be deleted but risk is asymmetric (low payoff, breaks grep-ability for future mock-data additions). Classified as report-only.

---

## Summary

- 8 findings filed.
- 7 high-confidence (>= 0.90) — two are `package.json` edits (high blast radius), five are low-to-medium blast within rad-os/radiants.
- 2 medium-confidence — public-package API surface that cannot be statically verified against external consumers.
- ~10 tempting candidates rejected after indirect-reference tracing (listed above).

Execution order recommendation: approve findings 3–6 in the first dead-code wave (small-scope, local). Findings 1–2 should go through the coordinator's high-risk-approval gate because they touch `package.json`. Findings 7–8 stay report-only unless a public-package consumer survey is run.
