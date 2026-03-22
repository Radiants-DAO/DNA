# Guard Rails Scout Report: Design Contract Enforcement Architecture

**Date:** 2026-03-22
**Scout:** Guard Rails Scout
**Mission:** Study design-system enforcement systems to find patterns for lint rules, policy layering, autofix, and consumer enforcement. Identify how RDNA can move from hand-maintained ESLint config to contract-generated enforcement.

---

## Systems Analyzed

| System | Type | URL |
|--------|------|-----|
| Atlassian Design System (`@atlaskit/eslint-plugin-design-system`) | ESLint plugin | https://atlassian.design/components/eslint-plugin-design-system/ |
| Atlassian UI Styling Standard (`@atlaskit/eslint-plugin-ui-styling-standard`) | ESLint plugin | https://atlassian.design/components/eslint-plugin-ui-styling-standard/ |
| Shopify Polaris (`@shopify/stylelint-polaris`) | Stylelint plugin | https://github.com/Shopify/polaris/tree/main/stylelint-polaris |
| IBM Carbon (`stylelint-plugin-carbon-tokens`) | Stylelint plugin | https://github.com/carbon-design-system/stylelint-plugin-carbon-tokens |
| Salesforce SLDS (`@salesforce-ux/eslint-plugin-slds`) | ESLint plugin | https://github.com/salesforce-ux/slds-linter |
| MetaMask (`@metamask/eslint-plugin-design-tokens`) | ESLint plugin | https://github.com/MetaMask/eslint-plugin-design-tokens |
| ESLint Bulk Suppressions (v9.24+) | ESLint core feature | https://eslint.org/docs/latest/use/suppressions |

---

## Guard Rule Architecture Patterns

### 1. Atlassian Design System

**Rule count:** 50+ rules across two plugins (design-system + ui-styling-standard)

**Categories:**
- Token enforcement (ensure-design-token-usage, no-deprecated-design-token-usage, no-unsafe-design-token-usage)
- Component replacement (use-primitives, use-heading, use-visually-hidden)
- Import hygiene (no-banned-imports, no-deprecated-imports, no-deprecated-apis)
- CSS authoring standards (no-nested-styles, no-physical-properties, no-margin)
- Accessibility (icon-label, use-drawer-label, use-popup-label, use-button-group-label)
- DnD safety (no-direct-use-of-web-platform-drag-and-drop)

**Data source architecture: GENERATED from `@atlaskit/tokens` package.**
- `ensure-design-token-usage` imports `spacing as spacingScale` from `@atlaskit/tokens/tokens-raw` and builds lookup maps at runtime: `Object.fromEntries(spacingScale.map(t => [t.value, t.cleanName]))`
- `no-deprecated-design-token-usage` imports `renameMapping` from `@atlaskit/tokens/rename-mapping` and `getTokenId` from `@atlaskit/tokens/token-ids` -- all generated artifacts
- The plugin index itself is generated via codegen: `src/index.tsx` re-exports from `./index.codegen`, meaning rule registration and config assembly are automated
- Token artifacts are built via Style Dictionary, then published as part of `@atlaskit/tokens`

**Policy layering:**
- Single `recommended` config for consumers
- Per-rule severity configurable via standard ESLint overrides
- Two separate plugins for different concerns (design-system vs. ui-styling-standard)

**Autofix:**
- `ensure-design-token-usage`: full autofix -- replaces hardcoded values with `token()` calls and auto-inserts `@atlaskit/tokens` import
- `no-deprecated-design-token-usage`: autofix replaces deprecated token paths with their replacements (when a replacement exists in the rename mapping)
- `use-primitives`: suggestions (not auto-applied) for replacing HTML elements with Box/Stack/Inline

**Exception handling:** Standard ESLint inline disables. No structured metadata format visible.

**Strengths:**
- Rules consume generated token data -- the gold standard for contract-generated enforcement
- Codegen'd plugin index eliminates manual rule registration drift
- Deprecation workflow (deprecated state in token data -> lint rule -> autofix migration) is mature
- Three-tier token rule coverage: ensure usage, no-deprecated, no-unsafe
- Separate domains (color, spacing, shape) with per-domain opt-in via `domains` config

**Weaknesses:**
- Tightly coupled to CSS-in-JS patterns (Emotion, Compiled, styled-components) -- not directly applicable to Tailwind utility classes
- No visible per-team policy differentiation
- Exception handling is plain ESLint inline disables without structured metadata

**Relevance to RDNA: 5/5** -- The generated token data pattern and codegen'd plugin index are exactly what RDNA needs.

---

### 2. Shopify Polaris (stylelint-polaris)

**Rule count:** 40+ rules, organized by CSS construct type

**Categories:**
- Color (hex ban, named color ban, Sass mixin ban, legacy custom property ban)
- Space (hard-coded units on padding/margin/gap)
- Motion (keyframe ban, time unit ban, legacy Sass functions)
- Border (unit ban, legacy mixin ban, legacy custom property ban)
- Shadow (unit ban, legacy custom properties)
- Z-index (token allowlist, legacy function ban)
- Layout (property disallowed list -- warning severity)
- Typography (property disallowed list -- warning severity)
- Media queries (breakpoint allowlist)
- Conventions (custom property namespace enforcement)

**Data source architecture: HYBRID -- partially generated from `@shopify/polaris-tokens`.**
- Z-index allowlist is runtime-generated: `Object.keys(themeDefault.zIndex).map(tokenName => createVar(tokenName))`
- Theme var name validation uses `getThemeVarNames()` from `@shopify/polaris-tokens`
- But most rules use hardcoded regex patterns and disallowed-list configs
- The `polaris-tokens` package is itself built via a generation pipeline (JSON -> dist/ containing CSS, SCSS, JSON, JS)

**Policy layering: COVERAGE META-PLUGIN.**
- All rules feed through a single `polaris/coverage` meta-plugin that wraps Stylelint's built-in rules
- Categories are namespaced: `polaris/${category}/${stylelintRuleName}`
- Each category can carry its own `CategorySettings` with default message and meta
- Severity is per-rule, with fallback chain: rule-level -> Stylelint default -> 'error'
- Layout and Typography categories default to `warning`; everything else defaults to `error`

**Autofix:** Limited. Inherits from underlying Stylelint rules. The meta-plugin forwards the `fix` flag.

**Exception handling:**
- Uses `stylelint-disable` comments
- Has a migration script (`styles-insert-stylelint-disable`) that bulk-inserts ignore comments for initial adoption
- Recommends `--report-descriptionless-disables` and `--report-needless-disables` CLI flags

**Strengths:**
- The coverage meta-plugin pattern is elegant -- one plugin wraps all enforcement, enabling category-level messaging and doc URLs
- Category-based organization with per-category severity tiers is clean policy layering
- Token data flows from the canonical `polaris-tokens` package for z-index and variable name validation
- Migration tooling (bulk stylelint-disable insertion) unblocks adoption

**Weaknesses:**
- Most enforcement is pattern-based (regex on values/properties) rather than true token resolution
- Stylelint-only -- no JSX/component enforcement
- No structured exception metadata

**Relevance to RDNA: 4/5** -- The coverage meta-plugin and category-based severity model are directly applicable.

---

### 3. IBM Carbon (stylelint-plugin-carbon-tokens)

**Rule count:** 5 rules (layout-use, motion-duration-use, motion-easing-use, theme-use, type-use)

**Categories:** One rule per token domain (layout, motion-duration, motion-easing, theme/color, typography)

**Data source architecture: GENERATED from `@carbon` packages.**
- Rules load token definitions directly from Carbon packages (`@carbon/themes`, `@carbon/layout`, `@carbon/type`, `@carbon/motion`)
- Each rule accepts a `carbonPath` option for resolving the correct `@carbon` package in monorepo setups
- Supports `carbonModulePostfix` for v10/v11 coexistence
- Resolves both SCSS `$variables` and CSS `--custom-properties`

**Policy layering: THREE-TIER CONFIG PRESETS.**
- `strict` -- all rules at error, minimal exceptions
- `recommended` -- all rules at error, with sensible defaults
- `light-touch` -- all rules at warning, with `acceptUndefinedVariables: true` and `acceptScopes: ['**']`

**Autofix:**
- Supported where a 1:1 mapping exists between hardcoded value and carbon token
- Ambiguous fixes tagged with `/* fix: see notes */`
- Partial-line fixes (e.g., `margin: 2px 3px 4px`) are not supported

**Exception handling:**
- `acceptValues` option per rule with regex support (e.g., `/inherit|initial|none|unset/`)
- `acceptScopes` option controls which CSS variable scopes are valid
- Boolean flags: `acceptCarbonColorTokens`, `acceptUndefinedVariables`, `acceptCarbonCustomProp`
- Range syntax for multi-value properties: `"/prop-b$/<1 -2>"` checks specific value positions
- `includeProps` with `!` exclusion prefix (e.g., `"!line-height"`)
- Recommends `--report-descriptionless-disables` for inline disables

**Strengths:**
- Clean domain separation (one rule per token domain)
- Three config presets provide clear adoption path
- Rich per-rule options for fine-grained exception control without inline disables
- Token data comes from canonical Carbon packages -- no maintenance of separate maps
- Permitted math expressions (e.g., `calc(-1 * $token)`) reduce false positives

**Weaknesses:**
- SCSS-focused -- less relevant to CSS-only or Tailwind workflows
- Only 5 rules total (narrow scope)
- No component replacement enforcement

**Relevance to RDNA: 3/5** -- The three-tier config model and per-rule exception options are good patterns. Domain-from-package data loading is validated.

---

### 4. Salesforce SLDS Linter

**Rule count:** 15 rules (12 CSS + 3 HTML)

**Categories:**
- Token migration (lwc-token-to-slds-hook, enforce-sds-to-slds-hooks)
- Hardcoded value detection (no-hardcoded-values-slds2)
- Naming conventions (enforce-component-hook-naming-convention, enforce-bem-usage)
- Deprecation (no-deprecated-classes-slds2, no-slds-class-overrides)
- Safety (no-slds-private-var, no-sldshook-fallback-for-lwctoken)

**Data source architecture: CONFIGURATION-DRIVEN with hardcoded maps.**
- Rules consume `CustomHookMapping` objects passed via rule options at runtime
- Utility files contain color matching and value parsing logic, but token data appears embedded in TypeScript files rather than imported from a generated artifact
- Two config files (`eslint.rules.json` for public, `eslint.rules.internal.json` for internal) define rule severities

**Policy layering:**
- Public vs. internal rule configs (separate JSON files)
- HTML rules default to `error`; CSS rules mostly default to `warn`
- Two critical CSS rules at `error`: `lwc-token-to-slds-hook` and `enforce-component-hook-naming-convention`

**Autofix:** Supported via `--fix` flag. Bulk autofix across entire repos is a key feature.

**Exception handling:** Standard ESLint inline disables.

**Strengths:**
- SARIF report output for VS Code integration
- Combined ESLint + Stylelint in one CLI tool
- Bulk fix capability across repos
- Clear public/internal config separation

**Weaknesses:**
- Token data appears hardcoded rather than generated
- Salesforce-ecosystem-specific (LWC, Aura)
- No structured exception metadata

**Relevance to RDNA: 2/5** -- The SARIF report output and public/internal config split are interesting but the architecture is less transferable.

---

### 5. MetaMask (`@metamask/eslint-plugin-design-tokens`)

**Rule count:** 3 rules

**Categories:**
- Deprecated classname enforcement (no-deprecated-classnames)
- Hex color ban (color-no-hex)
- Theme class enforcement (prefer-theme-color-classnames)

**Data source architecture: FULLY HARDCODED / CONSUMER-PROVIDED.**
- `no-deprecated-classnames` takes a user-provided mapping object in `.eslintrc`
- No evidence of generated token data or imports from a design token package

**Relevance to RDNA: 1/5** -- Too simple to offer architectural patterns. Consumer-provided mapping is the opposite of what RDNA needs.

---

## Best Enforcement Patterns for RDNA

Ranked by impact and feasibility:

### 1. Generated Token Artifact as Rule Data Source (Atlassian pattern)

**Pattern:** Publish a `@rdna/radiants/tokens-raw` or similar entry point that exports structured token data (name, value, deprecation state, replacement). ESLint rules import this at load time and build their lookup maps dynamically.

**Why #1:** This eliminates `token-map.mjs` as a hand-maintained file. When tokens change in `tokens.css`, a build step regenerates the artifact, and all rules automatically pick up the changes. Atlassian's `spacing as spacingScale` from `@atlaskit/tokens/tokens-raw` proves this works at scale.

**RDNA implementation path:**
- Add a build step that parses `tokens.css` `@theme` blocks and emits a JSON or JS module with structured token data
- Rules import from this artifact instead of the hand-maintained `token-map.mjs`
- The `hexToSemantic`, `oklchToSemantic`, `brandPalette`, `removedAliases`, and `rdnaComponentMap` all become generated

### 2. Codegen'd Plugin Index (Atlassian pattern)

**Pattern:** Auto-generate the plugin `index.mjs` from rule metadata files, eliminating manual rule registration and config assembly.

**Why #2:** RDNA's current `index.mjs` manually imports 14 rules and hand-assembles 3 configs. As rule count grows, this becomes a maintenance burden and a source of drift (forgetting to add a new rule to a config).

**RDNA implementation path:**
- Each rule exports a `meta` object with category, recommended severity, and whether it's shared vs. repo-local
- A codegen script reads all `rules/*.mjs` files, extracts metadata, and generates `index.mjs` with all rules registered and configs assembled

### 3. Three-Tier Config Presets (Carbon pattern)

**Pattern:** `light-touch` (all warn, loose exceptions) -> `recommended` (all warn, strict exceptions) -> `strict` (all error).

**Why #3:** RDNA already has `recommended` (warn), `internals` (warn, no component enforcement), and `recommended-strict` (error, not activated). Carbon's explicit `light-touch` tier provides a better on-ramp for new consumers. The key insight is that the tiers differ in _exception tolerance_, not just severity.

**RDNA implementation path:**
- Keep current three tiers but consider making `light-touch` the explicit starting point for new apps
- Use ESLint bulk suppressions (see #5) to bridge from `recommended` to `recommended-strict`

### 4. Coverage Meta-Plugin / Category-Based Severity (Shopify pattern)

**Pattern:** Organize rules by domain (color, spacing, motion, shape, components) with per-domain severity defaults and category-level messaging.

**Why #4:** RDNA rules naturally fall into domains but this isn't formalized. Category-based severity would let RDNA say "all color rules are error, motion rules are still warn" as a graduated migration path.

**RDNA implementation path:**
- Tag each rule with a `domain` in its metadata (color, spacing, typography, motion, shape, component, accessibility)
- Config generator can produce domain-specific severity overrides
- Category-level messages can include doc URLs (e.g., link to DESIGN.md sections)

### 5. ESLint Bulk Suppressions for warn -> error Migration

**Pattern:** ESLint v9.24+ bulk suppressions allow enabling rules as `error` while suppressing all existing violations in `eslint-suppressions.json`. New code must comply; old violations are fixed incrementally.

**Why #5:** This is the missing piece for RDNA's `recommended` -> `recommended-strict` migration. Instead of fixing every violation before flipping to error, use `eslint --fix --suppress-all` to suppress remaining issues, then prune over time.

**RDNA implementation path:**
- Ensure ESLint 9.24+ is in use
- Run `pnpm lint:design-system --fix --suppress-all` to generate `eslint-suppressions.json`
- Commit the suppressions file
- Switch configs to `recommended-strict`
- Add `--prune-suppressions` to CI to track progress

### 6. Deprecation Pipeline from Token Metadata (Atlassian pattern)

**Pattern:** Token rename/deprecation data is published as a generated artifact (`@atlaskit/tokens/rename-mapping`). A dedicated lint rule reads this data and auto-fixes deprecated token references.

**Why #6:** RDNA's `removedAliases` list in `token-map.mjs` is hand-maintained. When tokens are renamed or deprecated, the lint rule should automatically know about it from the token source of truth.

**RDNA implementation path:**
- The generated token artifact (from pattern #1) includes deprecation state and replacement path for each token
- `no-removed-aliases` evolves into `no-deprecated-tokens` that reads from this artifact
- Autofix replaces deprecated tokens with their successors

### 7. Structured Exception Metadata with Expiry (RDNA's own pattern, validated)

**Pattern:** RDNA's existing exception format (`reason:`, `owner:`, `expires:`, `issue:`) with `require-exception-metadata` enforcement is actually ahead of all systems studied. No other system has structured exception metadata.

**Why #7:** This is worth preserving and doubling down on. The addition of ESLint bulk suppressions (pattern #5) complements it -- bulk suppressions handle the migration phase, structured exceptions handle intentional permanent violations.

---

## Policy Layering Patterns

### Observed Models

| System | Model | Layers |
|--------|-------|--------|
| Atlassian | Plugin separation | Two plugins: design-system (token/component rules) + ui-styling-standard (CSS authoring rules) |
| Shopify | Category severity | Per-category severity within one meta-plugin. Layout/Typography = warn; everything else = error |
| Carbon | Config presets | Three tiers: strict, recommended, light-touch. Tiers differ in severity AND exception tolerance |
| SLDS | File-type separation | HTML rules = error, CSS rules = warn. Public vs. internal configs |
| RDNA (current) | Config + scope | recommended (shared, warn), internals (component rules off), recommended-strict (shared, error). Repo-local rules in separate config file |

### Recommended Model for RDNA

RDNA's current model is already well-structured. The recommended evolution:

1. **Keep the shared/repo-local split.** Shared rules (exported in the plugin) vs. repo-local rules (in `eslint.rdna.config.mjs`) is a clean separation.

2. **Add domain tags to rule metadata.** Each rule gets a `domain: 'color' | 'spacing' | 'typography' | 'motion' | 'shape' | 'component' | 'authoring'` field. This enables per-domain severity overrides without changing the config tier model.

3. **Use bulk suppressions for the strict migration.** Instead of maintaining `recommended` and `recommended-strict` indefinitely, use `recommended-strict` as the target and bulk suppressions to manage the transition.

4. **Formalize the "consumer" vs. "design system author" distinction.** The `internals` config (component enforcement off) is this distinction. Consider whether other rules should also differ between these two audiences.

---

## Contract-Generated Enforcement

This is the key architectural question for RDNA. Here is every piece of evidence found:

### Atlassian: Full contract-generated enforcement (CONFIRMED)

**Observation:** `ensure-design-token-usage/utils.tsx` imports `spacing as spacingScale` from `@atlaskit/tokens/tokens-raw` and builds lookup maps via `Object.fromEntries(spacingScale.map(t => [t.value, t.cleanName]))`.

**Source:** https://github.com/pioug/atlassian-frontend-mirror/tree/master/design-system/eslint-plugin/src/rules/ensure-design-token-usage

**Confidence:** High (read actual source code)

**Implication for RDNA:** This is the exact pattern RDNA needs. A generated `tokens-raw` export from `@rdna/radiants` would let all rules derive their lookup maps from the token source of truth.

---

**Observation:** `no-deprecated-design-token-usage/index.tsx` imports `renameMapping` from `@atlaskit/tokens/rename-mapping` and `getTokenId` from `@atlaskit/tokens/token-ids`. Deprecation status and replacement paths come from generated artifacts.

**Source:** https://github.com/pioug/atlassian-frontend-mirror/tree/master/design-system/eslint-plugin/src/rules/no-deprecated-design-token-usage

**Confidence:** High (read actual source code)

**Implication for RDNA:** Token lifecycle (active -> deprecated -> removed) should be encoded in the generated artifact, not hand-maintained in `token-map.mjs`.

---

**Observation:** `src/index.tsx` re-exports from `./index.codegen`, meaning the plugin's rule list and config assembly are auto-generated.

**Source:** https://github.com/pioug/atlassian-frontend-mirror/tree/master/design-system/eslint-plugin/src

**Confidence:** High (read actual source code)

**Implication for RDNA:** As rule count grows, codegen'd index eliminates registration drift. This also enables automated config generation from rule metadata.

---

**Observation:** Token artifacts are built via Style Dictionary. The `@atlaskit/tokens` changelog confirms "refactored token artifact generation via style-dictionary" and consolidation of outputs.

**Source:** https://atlaskit.atlassian.com/packages/design-system/tokens/changelog

**Confidence:** High (from official changelog)

**Implication for RDNA:** RDNA uses Tailwind v4 `@theme` blocks as its token format. A parser for `@theme` blocks that outputs structured JSON would serve the same role as Style Dictionary in this pipeline.

---

### Shopify: Partial contract-generated enforcement (CONFIRMED)

**Observation:** Z-index allowlist is dynamically built from theme data: `Object.keys(themeDefault.zIndex).map(tokenName => createVar(tokenName))`. Theme variable name validation uses `getThemeVarNames()` from `@shopify/polaris-tokens`.

**Source:** https://github.com/Shopify/polaris/blob/main/stylelint-polaris/index.js

**Confidence:** High (read actual source code)

**Implication for RDNA:** Even partial generation (some rules reading from token package, others using patterns) is viable. RDNA can migrate incrementally.

---

### Carbon: Package-dependent enforcement (CONFIRMED)

**Observation:** Rules load token definitions directly from `@carbon/themes`, `@carbon/layout`, etc. at runtime. The `carbonPath` option allows pointing to the correct package version in monorepos.

**Source:** https://github.com/carbon-design-system/stylelint-plugin-carbon-tokens

**Confidence:** High (from README and rule source)

**Implication for RDNA:** An alternative to publishing a separate `tokens-raw` artifact is having rules import directly from the theme package and parse token definitions at load time.

---

### SLDS and MetaMask: No contract-generated enforcement

Both systems use hardcoded maps or consumer-provided configuration. No evidence of generated artifacts feeding rules.

---

## Evidence Log

| # | Observation | Source | Confidence | Implication for RDNA |
|---|-------------|--------|------------|---------------------|
| 1 | Atlassian builds spacing lookup map from `@atlaskit/tokens/tokens-raw` at rule load time | `ensure-design-token-usage/utils.tsx` in GitHub mirror | High | Generate a `tokens-raw` export from `@rdna/radiants` |
| 2 | Atlassian reads deprecation data from `@atlaskit/tokens/rename-mapping` generated artifact | `no-deprecated-design-token-usage/index.tsx` | High | Encode token lifecycle in generated artifact |
| 3 | Atlassian's plugin index is codegen'd (`index.codegen`) | `src/index.tsx` | High | Auto-generate RDNA's `index.mjs` from rule metadata |
| 4 | Atlassian uses Style Dictionary for token artifact generation | Atlaskit tokens changelog | High | Build a `@theme` block parser that outputs structured JSON |
| 5 | Shopify builds z-index allowlist from `themeDefault.zIndex` at runtime | `stylelint-polaris/index.js` | High | Partial generation is a valid incremental step |
| 6 | Shopify's coverage meta-plugin wraps Stylelint rules with category-level namespacing | `plugins/coverage/index.js` | High | Category-based organization for RDNA rules |
| 7 | Carbon has three config tiers (strict, recommended, light-touch) differing in both severity and exception tolerance | Config files in `config/` directory | High | Add `light-touch` tier to RDNA configs |
| 8 | Carbon's `acceptValues` option uses regex patterns for per-rule exceptions | Rule README files | High | Add per-rule exception options to reduce inline disable noise |
| 9 | ESLint v9.24+ bulk suppressions enable `error` severity without fixing all violations | ESLint docs | High | Use for RDNA's recommended -> strict migration |
| 10 | RDNA's `token-map.mjs` has 134 lines of hand-maintained hex/oklch/component mappings | `/packages/radiants/eslint/token-map.mjs` | Confirmed | This is the #1 file to replace with generated data |
| 11 | RDNA's `no-hardcoded-colors.mjs` has ~600 lines with hardcoded semantic suffix sets, regex patterns, and CSS named color lists | `/packages/radiants/eslint/rules/no-hardcoded-colors.mjs` | Confirmed | The `SEMANTIC_COLOR_SUFFIXES` set should be generated from `tokens.css` |
| 12 | Atlassian has 50+ rules with dedicated accessibility rules (icon-label, use-drawer-label, etc.) | Plugin rule listing | High | RDNA has no accessibility enforcement rules yet -- gap to address |
| 13 | No system studied has structured exception metadata comparable to RDNA's `reason:owner:expires:issue:` format | All systems | High | RDNA's exception format is a strength to preserve |
| 14 | Atlassian uses a `token-metadata` entrypoint for MCP server and code generation use cases | Atlaskit tokens changelog | High | Relevant to RDNA's playground annotation system |

---

## Recommended Next Steps (Priority Order)

1. **Build a `@theme` block parser** that reads `packages/radiants/tokens.css` and emits structured token data (JSON or JS module) with name, value, CSS variable, domain, deprecation state, and replacement path.

2. **Generate `token-map.mjs`** from the parser output, eliminating all hand-maintained mappings. The `hexToSemantic`, `oklchToSemantic`, `brandPalette`, `removedAliases`, and `rdnaComponentMap` should all derive from token/component metadata.

3. **Add domain tags to rule `meta` objects** (`color`, `spacing`, `typography`, `motion`, `shape`, `component`, `authoring`) to enable category-based config generation.

4. **Adopt ESLint bulk suppressions** for the `recommended` -> `recommended-strict` migration. Run `--fix --suppress-all`, commit `eslint-suppressions.json`, flip to strict, prune over time.

5. **Consider codegen for `index.mjs`** once rule count exceeds ~20 and manual registration becomes error-prone.

6. **Evaluate per-rule `acceptValues` options** (Carbon pattern) to reduce inline disable noise for legitimate exceptions.
