# @rdna/radiants Package Split Plan

Status: planned, no extraction executed in Phase 10.

## Current Shape

`@rdna/radiants` currently owns the theme CSS, fonts, components, icons, schemas, registry metadata, preview metadata, BlockNote renderers, pattern helpers, pixel icon facades, generated contracts, scripts, and the custom RDNA ESLint plugin.

Published subpaths in `packages/radiants/package.json`:

- `.` / `./tokens` / `./dark` / `./animations` / `./base` / `./typography` / `./fonts`
- `./components/core`
- `./icons` and `./icons/runtime`
- `./schemas`
- `./eslint`
- `./registry`
- `./meta`
- `./patterns` and `./patterns/*`
- `./pixel-icons`
- `./blocknote`

The package is not ready for a broad split. Component, icon, registry, schema, and metadata code are tightly coupled through relative imports and generated files. The safe path is to split only after making each candidate self-contained.

## Coupling Snapshot

Approximate grep counts from Phase 10:

| Area | External repo consumers | Internal coupling hits | Notes |
| --- | ---: | ---: | --- |
| `components/core` | 44 | 199 | RadOS and Ctrl consume it heavily; components import icons, patterns, shared helpers, and pixel icon facades. |
| `icons` / `icons/runtime` | 33 | 43 | Used by RadOS, Ctrl, and Radiants components. A split requires components to depend on the new icon package. |
| `registry` | 9 | 7 | RadOS UI library depends on it; registry imports `meta`, `schemas`, and runtime component attachments. |
| `meta` | 0 | 56 | Generated/indexed metadata is coupled to component source files and `@rdna/preview`. |
| `schemas` | 0 | 2 direct, many generated imports | Generated schema barrel points back into component schema JSON files. |
| `patterns` | 8 | 10 | RadOS pretext surface consumes specific pattern helpers; components also import patterns. |
| `pixel-icons` | 0 | 5 | Mostly facade/generated data over `@rdna/pixel`; used by core `PixelIcon`. |
| `blocknote` | 1 | 32 | Scratchpad consumes it; renderers import many core components. |
| `eslint` | 0 subpath consumers, 3 direct path consumers | Root config and scripts import plugin internals by relative path; plugin reads generated Radiants contract JSON. |

## Recommended Target Shape

1. Keep `@rdna/radiants` as the default theme and core component package for now:
   - CSS tokens, base CSS, fonts, components/core, component metadata, schemas, and registry should remain together for now.
   - These surfaces currently form one authoring/runtime loop: component `.meta.ts` files generate schemas, registry entries, docs, and lint contracts.
   - This should not imply Radiants is the permanent parent package for every future theme.

2. Extract `@rdna/eslint-plugin-rdna` after prework:
   - Move `packages/radiants/eslint/` into a private workspace package.
   - Give it a stable contract input that is not a relative read from `packages/radiants/generated/`.
   - Update root and package scripts to import plugin helpers from package exports rather than deep relative paths.

3. Extract icons later as `@rdna/icons`:
   - Move `icons/` and runtime icon exports into a standalone package.
   - Update Radiants components and Ctrl to import from `@rdna/icons`.
   - Keep any component-level `Icon` wrapper in `@rdna/radiants/components/core` if it is a styled design-system component, not raw icon data.

4. Keep patterns in Radiants until pretext ownership is clearer:
   - `patterns/pretext-*` is app-facing and could become `@rdna/patterns`.
   - Current component `Pattern` and RadOS pretext code still depend on this area directly.

5. Defer registry/meta/schema extraction:
   - These are generated from component metadata and are not cleanly separable from `components/core`.
   - A registry-tools package can be considered later, but the runtime registry should stay with the components it describes.

6. Defer BlockNote extraction:
   - `@rdna/radiants/blocknote` imports many core components.
   - It can only split cleanly after deciding whether it is a RadOS app feature or a reusable design-system renderer layer.

## Theme Package Direction

The theme contract should assume a family of themes, not a Radiants-plus-one-off model. Radiants is the default implementation today; MONOLITH/SKR and future skins should be treated as additional implementations of the same token/component contract.

Near term, keep `@rdna/radiants` in place to avoid broad import churn and because it still owns the component metadata authoring loop. Do not use that convenience to make Radiants the catch-all namespace for unrelated themes.

Package layouts to evaluate before moving theme files:

- Workspace folder family: `packages/themes/radiants`, `packages/themes/monolith`, and `packages/themes/<name>`, with package names kept backward-compatible during transition where useful.
- Renamed package family: `@rdna/theme-radiants`, `@rdna/theme-monolith`, and future `@rdna/theme-<name>` packages.
- Meta package: `@rdna/themes` with subpath CSS exports such as `@rdna/themes/radiants`, only if central packaging is worth the ownership and tree-shaking tradeoffs.

MONOLITH should either become a theme package in this family or fold into a broader theme package strategy. It should not remain a permanent one-off sibling whose only relationship to Radiants is import order.

## Migration Order

1. Prework for ESLint extraction:
   - Add an explicit generated-contract export or package-local contract artifact strategy.
   - Replace root script imports from `packages/radiants/eslint/*` with exported helper paths.
   - Update docs that mention `@rdna/radiants/eslint`.

2. Extract `@rdna/eslint-plugin-rdna`:
   - Create `packages/eslint-plugin-rdna`.
   - Move plugin source and tests.
   - Add private package metadata with `type: "module"`.
   - Update `eslint.rdna.config.mjs` and script imports.
   - Remove the `./eslint` export from `@rdna/radiants`.

3. Stabilize icon package boundaries:
   - Convert core component icon imports to package imports.
   - Move icon source/runtime into `@rdna/icons`.
   - Update RadOS and Ctrl imports.

4. Revisit patterns/pretext:
   - Decide whether pretext helpers belong to `@rdna/patterns`, `@rdna/pretext`, or RadOS app code.
   - Only then split `patterns/*`.

5. Revisit registry/meta/schema:
   - Keep generated metadata next to core components unless a separate package has a clear consumer outside RadOS.

## Blast Radius

| Step | Blast radius | Risk |
| --- | --- | --- |
| ESLint prework | Root config, root scripts, generated eslint contract, Radiants ESLint tests | Medium; rule loading affects `pnpm lint` and design-system checks. |
| ESLint extraction | Workspace package graph, root config, script imports, Radiants package exports | Medium; manageable after prework. |
| Icon extraction | RadOS, Ctrl, Radiants components, generated icon registries | High; many runtime imports and generated files. |
| Patterns extraction | RadOS pretext/editorial code, `Pattern` component, pixel pattern generation | High; app feature behavior could regress. |
| Registry/meta/schema extraction | RadOS UI library, docs generation, schema generation, package contracts | High; generated-file workflows make this risky. |
| BlockNote extraction | Scratchpad editor and generated block renderers | Medium/high; depends on editor feature ownership. |

## Safe To Do Now

No Phase 11 extraction is safe under the machine gate.

The apparent candidate, `packages/radiants/eslint/`, fails the safe-subset gate today:

- It is not a self-contained directory. `contract.mjs` reads `../generated/eslint-contract.json`.
- `eslint.rdna.config.mjs` imports `./packages/radiants/eslint/index.mjs` directly, not the public `@rdna/radiants/eslint` subpath.
- Root scripts import plugin internals directly:
  - `scripts/lint-token-colors.mjs`
  - `scripts/report-new-rdna-exceptions.mjs`
- Extraction would require contract-sourcing decisions and helper export design, not just a directory move plus import-path rewrites.

Set `ops/codex-cleanup-state.json.radiants_split_safe_subset` to `null`; Phase 11 should skip.

## Deferred

- Approve whether the ESLint plugin should own a generated contract snapshot, import `@rdna/radiants` contract data, or receive contract paths from config.
- Decide the theme package family layout before removing `@rdna/monolith`, folding it into Radiants, or adding more campaign/client themes.
- Decide final package names for icons and patterns before moving files.
- Decide whether `blocknote` is reusable design-system code or RadOS-specific editor code.
