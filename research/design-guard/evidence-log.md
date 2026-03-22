# Evidence Log

**Last updated:** 2026-03-22 | **Loop:** 2

## Format
Each entry: Observation → Source → Confidence → Implication for RDNA

---

## Local Repo Evidence

### E-L1: Two data pipelines share zero data
- **Observation:** Meta → generator → `registry.manifest.json` and `token-map.mjs` → ESLint rules are completely independent. No data flows between them.
- **Source:** `tools/playground/scripts/generate-registry.ts`, `packages/radiants/eslint/token-map.mjs`
- **Confidence:** Confirmed
- **Implication:** Every component addition requires updating both pipelines independently. This is the core drift problem.

### E-L2: `SEMANTIC_COLOR_SUFFIXES` is stale (BUG)
- **Observation:** The allowlist in `no-hardcoded-colors.mjs:76-89` is missing all new naming convention tokens (`surface-*`, `content-*`, `action-*`, `edge-*`, `status-*`). These exist in `oklchToSemantic` autofix targets and `tokens.css` but NOT in the allowlist. Using `bg-surface-primary` triggers a false positive.
- **Source:** `packages/radiants/eslint/rules/no-hardcoded-colors.mjs:76-89`, `packages/radiants/eslint/token-map.mjs:70-115`
- **Confidence:** Confirmed
- **Implication:** Active bug. High-priority fix. Proves why generated data is needed.

### E-L3: `themeVariants` list is partially wrong
- **Observation:** Config lists `primary`, `secondary`, `outline`, `ghost`, `destructive` which are NOT `data-variant` selectors in CSS. Card's actual variants (`default`, `inverted`, `raised`) ARE in CSS but NOT in the list.
- **Source:** `eslint.rdna.config.mjs:93-96` vs `packages/radiants/base.css` Card selectors
- **Confidence:** Confirmed
- **Implication:** `no-mixed-style-authority` has both false negatives (misses Card) and potential false positives.

### E-L4: Only 5/39 components have replacement enforcement
- **Observation:** `rdnaComponentMap` covers `button`, `input`, `select`, `textarea`, `dialog`. Missing: `hr` → Separator, `meter`/`progress` → Meter, `details` → Collapsible, `label` → Label.
- **Source:** `packages/radiants/eslint/token-map.mjs:126-134`
- **Confidence:** Confirmed
- **Implication:** A `replaces` field on meta files would auto-generate this map and keep it complete.

### E-L5: RDNA's context-aware hex→semantic mapping is unique
- **Observation:** `hexToSemantic` maps the same hex to different tokens by CSS property context (e.g., `#fef8e2` → `page` in bg, `flip` in text). No other system has this.
- **Source:** `packages/radiants/eslint/token-map.mjs:29-66`
- **Confidence:** Confirmed
- **Implication:** This precision is worth preserving. The hybrid approach (generated token values + manual context maps) is correct.

### E-L6: Complete rule→data dependency map (Loop 2)
- **Observation:** Of 14 ESLint rules, only 4 import from `token-map.mjs` (`no-hardcoded-colors`, `no-removed-aliases`, `prefer-rdna-components`, and indirectly `no-mixed-style-authority` via config). 5 additional rules have hardcoded RDNA-specific data that should be externalized: `SEMANTIC_COLOR_SUFFIXES` (23 entries in `no-hardcoded-colors:76-89`), `SHADOW_MIGRATION` (9 entries in `no-clipped-shadow:26-36`), `PIXEL_CORNER_RE` (duplicated identically in `no-clipped-shadow:19` and `no-pixel-border:25`), extra `PRIMITIVE_COLOR_SUFFIXES` (3 entries in `no-hardcoded-colors`), and `themeVariants` (8 entries in `eslint.rdna.config.mjs:93-96`). 5 rules have zero RDNA-specific data needs (pure AST/regex patterns).
- **Source:** All files in `packages/radiants/eslint/rules/`, `token-map.mjs`, `eslint.rdna.config.mjs`
- **Confidence:** Confirmed (read every rule file)
- **Implication:** The contract JSON needs ~8 top-level keys to cover all rule data needs. Migration scope is smaller than expected — only 7 rules need contract data at all.

### E-L7: `no-mixed-style-authority` has a crash-vs-silent-pass asymmetry (Loop 2)
- **Observation:** The rule currently receives `themeVariants` via rule options and returns `{}` (no-op) when the set is empty. If migrated to read from `eslint-contract.json` at load time and the file is missing, ESLint throws `ENOENT` and crashes the entire lint run. This is a failure-mode regression from silent-pass to crash.
- **Source:** `packages/radiants/eslint/rules/no-mixed-style-authority.mjs:44-45`
- **Confidence:** Confirmed
- **Implication:** Rules consuming the contract must use try/catch with safe fallback, not bare `readFileSync`.

### E-L8: Motion token naming discrepancy (Loop 2)
- **Observation:** `no-hardcoded-motion.mjs:52` references `ease-standard` (CSS variable prefix `--ease-*`). But the design system uses Tailwind utility prefix `easing-*` (e.g., `easing-default`). The contract must resolve which naming convention to store.
- **Source:** `packages/radiants/eslint/rules/no-hardcoded-motion.mjs:51-53`
- **Confidence:** Confirmed
- **Implication:** Minor — affects lint message text only, not enforcement logic. Resolve during Phase 3.

### E-L9: RDNA's `.meta.ts` is richer than any comparable system's component schema
- **Observation:** Button.meta.ts includes name, description, props (typed), slots, examples, tokenBindings, registry (category, tags, renderMode, variants, states). Adobe Spectrum's action-button.json has only props with types/enums/defaults. No other system has slots + tokenBindings + registry config in one metadata file.
- **Source:** `packages/radiants/components/core/Button/Button.meta.ts` vs all external systems
- **Confidence:** High
- **Implication:** The format is right. The consumption/enforcement pipeline is what's missing.

---

## External Evidence

### E-X1: Atlassian generates token data for ESLint consumption
- **Observation:** `ensure-design-token-usage/utils.tsx` imports `spacing as spacingScale` from `@atlaskit/tokens/tokens-raw` and builds lookup maps: `Object.fromEntries(spacingScale.map(t => [t.value, t.cleanName]))`.
- **Source:** https://github.com/pioug/atlassian-frontend-mirror/tree/master/design-system/eslint-plugin/src/rules/ensure-design-token-usage
- **Confidence:** High (read actual source)
- **Implication:** Validates Architecture A's core pattern. Generated data → ESLint rules works at enterprise scale.

### E-X2: Atlassian's plugin index is codegen'd
- **Observation:** `src/index.tsx` re-exports from `./index.codegen`. Rule registration and config assembly are automated from rule metadata.
- **Source:** Same mirror repo
- **Confidence:** High
- **Implication:** As RDNA's rule count grows past ~20, codegen the index to prevent registration drift.

### E-X3: No system generates ESLint rules from component metadata
- **Observation:** Searched all 11+ systems. ESLint enforcement exists but is always hand-authored. No system derives lint rules from component registration/schema data.
- **Source:** All scout reports; Backlight blog; Gojek blog
- **Confidence:** High
- **Implication:** This is an open gap. RDNA can pioneer automated lint rule generation from `.meta.ts`.

### E-X4: Adobe has two MCP servers for design data
- **Observation:** `spectrum-design-data-mcp` (tokens, schemas, validation, recommendations) and `s2-docs-mcp` (documentation). Published on npm. Semantic tools like `find-tokens-by-use-case`.
- **Source:** https://github.com/adobe/spectrum-design-data
- **Confidence:** High
- **Implication:** RDNA should build an MCP server from its contract data. Adobe validates the pattern.

### E-X5: DTCG 2025.10 is the stable token interchange standard
- **Observation:** Published October 2025. JSON format with `$value`, `$type`, `$description`, `$extensions`. Style Dictionary v4, Tokens Studio, Figma (Nov 2026) support it.
- **Source:** https://www.w3.org/community/design-tokens/2025/10/28/
- **Confidence:** High
- **Implication:** RDNA token export should support DTCG for interop. `$extensions` can carry RDNA-specific metadata.

### E-X6: ESLint v9.24+ bulk suppressions enable warn→error migration
- **Observation:** `--suppress-all` generates `eslint-suppressions.json` for all existing violations. New code must comply. `--prune-suppressions` tracks progress.
- **Source:** https://eslint.org/docs/latest/use/suppressions
- **Confidence:** High
- **Implication:** Missing piece for RDNA's `recommended` → `recommended-strict` migration.

### E-X7: Primer publishes deprecation data from token source
- **Observation:** `deprecated.json` alongside token definitions → generates `dist/deprecated/` → consumed by `@primer/stylelint-config`'s `no-deprecated-colors` rule.
- **Source:** https://github.com/primer/primitives, https://github.com/primer/stylelint-config
- **Confidence:** High
- **Implication:** RDNA should author deprecation decisions alongside tokens and generate enforcement data.

### E-X8: RDNA's structured exception metadata is ahead of all systems
- **Observation:** RDNA's `reason:owner:expires:issue:` format with `require-exception-metadata` enforcement. No other system has structured exception metadata.
- **Source:** All scout reports
- **Confidence:** High
- **Implication:** Preserve and extend. Complements ESLint bulk suppressions.

### E-X9: Industry split on commit-vs-generate for lint data (Loop 2)
- **Observation:** Atlassian commits generated token artifacts in `@atlaskit/tokens` dist, consumed as npm dependency. Primer commits source `deprecated.json` + generated `dist/`. Shopify Polaris uses runtime import from `polaris-tokens` (no committed lint data). 2/3 systems commit. RDNA's existing `registry.manifest.json` commit+freshness-guard pattern matches the majority approach.
- **Source:** Atlassian Design docs, `@atlaskit/tokens` on unpkg, `primer/primitives` repo, `primer/primitives#364`, Shopify polaris monorepo
- **Confidence:** High
- **Implication:** Validates committing `eslint-contract.json`. RDNA's freshness guard is stronger than any external system's approach (git-diff vs version coupling).

### E-X10: `createRequire` is the production-grade ESM→JSON bridge (Loop 2)
- **Observation:** In ESM `.mjs` files, `import ... with { type: 'json' }` requires Node 22+ and is not universally supported by tooling. `createRequire(import.meta.url)` is stable since Node 12, requires no flags, and is the standard pattern for loading JSON from ESM modules.
- **Source:** Node.js docs, ESM interop patterns
- **Confidence:** High
- **Implication:** `token-map.mjs` thin re-export via `createRequire` is the right transition strategy. Zero rule file changes needed in Phase 1.
