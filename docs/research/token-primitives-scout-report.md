# Tokens & Primitives Scout Report

**Scout:** Tokens and Primitives Scout
**Date:** 2026-03-22
**Mission:** Study systems that cleanly separate tokens, primitives, and components, and show how enforcement attaches to that split.

---

## Systems Analyzed

| System | URLs | Focus |
|--------|------|-------|
| Primer Primitives + Primer React | [primer/primitives](https://github.com/primer/primitives), [primer/eslint-plugin-primer-react](https://github.com/primer/eslint-plugin-primer-react), [primer/stylelint-config](https://github.com/primer/stylelint-config) | 3-tier tokens, multi-package enforcement |
| Kong Design Tokens | [Kong/design-tokens](https://github.com/Kong/design-tokens) | Tokens + stylelint plugin in one repo |
| Chakra UI / Panda CSS / Park UI | [chakra-ui/panda](https://github.com/chakra-ui/panda), [chakra-ui/park-ui](https://github.com/chakra-ui/park-ui) | Semantic token layers, recipe-based component binding |
| vanilla-extract + Sprinkles | [vanilla-extract.style](https://vanilla-extract.style/) | Type-level enforcement at build time |
| Carbon Design System | [carbon-design-system/stylelint-plugin-carbon-tokens](https://github.com/carbon-design-system/stylelint-plugin-carbon-tokens) | Runtime import of token packages for lint rules |
| Shopify Polaris | [Shopify/polaris-tokens](https://github.com/Shopify/polaris-tokens), [stylelint-polaris](https://polaris.shopify.com/tools/stylelint-polaris) | Category-scoped enforcement, 40+ generated rules |
| Martin Fowler Token Architecture | [martinfowler.com/articles/design-token-based-ui-architecture](https://martinfowler.com/articles/design-token-based-ui-architecture.html) | Reference architecture for token pipelines |

---

## Token Pipeline Patterns

### 1. Primer Primitives (GitHub) — Relevance to RDNA: 5/5

**Token tier structure:**
- 3 tiers: `base/` (raw palette), `functional/` (semantic), `component/` (per-component)
- Additional `removed/` and `fallback/` directories
- Base tokens organized by: color, motion, size, typography
- Functional tokens organized by: border, color, shadow, size, typography
- Color tokens further split by mode: `light/`, `dark/`, with `overrides/` for accessibility variants (tritanopia, high-contrast, colorblind)

**Package organization:**
- **3 separate packages**: `@primer/primitives` (token data + build), `eslint-plugin-primer-react` (component enforcement), `@primer/stylelint-config` (CSS enforcement)
- Primitives package generates `dist/deprecated/` and `dist/removed/` JSON files from source `deprecated.json` / `removed.json` alongside token definitions
- These generated deprecation files are consumed by `@primer/stylelint-config`'s `no-deprecated-colors` rule

**Token -> enforcement connection:**
- `@primer/stylelint-config` loads `variables.json` from `@primer/css` via a `requirePrimerFile()` helper — the token package publishes the data that powers the lint rules
- `eslint-plugin-primer-react` uses a static `css-variable-map.json` (manually maintained, not generated from primitives) that maps old variable names to new Primitives v8 names, keyed by CSS property context
- The deprecation decision lives in `primer/primitives`, not in the lint plugin — the plugin just reads the data

**Component -> token binding model:**
- Components reference tokens via CSS custom properties (e.g., `var(--color-fg-default)`)
- No formal component-level token binding declaration in source
- The `component/` token directory defines component-scoped tokens that map semantic tokens to component parts

**Generated artifacts:**
- Style Dictionary builds from JSON5 source to: CSS custom properties (per-theme), SCSS, JS, Figma metadata
- `deprecated.json` and `removed.json` are generated into `dist/` and consumed by lint rules
- Recently added: markdown file with all token context for LLM consumption

**Maintenance burden:** MODERATE — deprecation/removal data is manually authored in `deprecated.json` alongside token source. The `css-variable-map.json` in the ESLint plugin is fully manual and separate from the primitives package. No automated generation of the ESLint variable map from token source.

**Strengths:**
- Clean separation: token definitions own deprecation policy, lint tools consume it
- 3-tier token hierarchy (base/functional/component) is mature and well-structured
- Theme overrides via delta files is elegant for accessibility variants

**Weaknesses:**
- ESLint variable map (`css-variable-map.json`) is manually maintained and disconnected from primitives
- Two separate enforcement stacks (ESLint for JSX, Stylelint for CSS) with no shared data source
- Component token directory exists but has no formal binding contract (no `meta.ts` equivalent)

---

### 2. Kong Design Tokens — Relevance to RDNA: 4/5

**Token tier structure:**
- 2 tiers: `tokens/alias/` (internal raw values, not exported) and `tokens/source/` (public semantic tokens, exported)
- Component tokens in `tokens/source/components/{component-name}.json`
- `_` key convention for default + nested children (e.g., `color.text._` and `color.text.primary`)

**Package organization:**
- Single monorepo with tokens + stylelint plugin as sibling workspace packages
- Token source -> Style Dictionary build -> `dist/tokens/{css,scss,less,js}/`
- Stylelint plugin at `/stylelint-plugin/` reads built token JSON

**Token -> enforcement connection:**
- `use-proper-token` rule: validates tokens are used with semantically appropriate CSS properties (e.g., `color-text` tokens only valid for `color`, not `background-color`)
- `token-var-usage` rule: enforces CSS custom property fallback syntax `var(--kui-token, $kui-token)`
- Property-token mapping inferred from naming convention (`color-text-*` -> valid for `color`)

**Component -> token binding model:**
- No formal component token binding — tokens are consumed via CSS custom properties directly
- Vue sandbox for experimentation

**Generated artifacts:**
- CSS custom properties (with values + IDE-only list without values), SCSS variables, SCSS map, LESS variables, JS/TS constants (ESM + CJS), JSON
- CSS custom-properties-list.css specifically for IDE auto-complete (never imported in production)

**Maintenance burden:** LOW for tokens, MODERATE for enforcement — naming convention drives enforcement automatically, but the property mapping in the stylelint plugin needs manual verification when new token categories are added.

**Strengths:**
- Tokens and enforcement co-located in same repo — changes are atomic
- Property-semantic enforcement by naming convention is clever and low-maintenance
- Multi-format output covers all major consumers
- IDE auto-complete file is a nice DX touch

**Weaknesses:**
- No formal 3-tier hierarchy (alias is private, not a true "base" tier for consumers)
- Naming convention enforcement is fragile — a new token category that doesn't follow the pattern breaks the plugin silently
- No multi-theme support visible

---

### 3. Chakra UI / Panda CSS / Park UI — Relevance to RDNA: 3/5

**Token tier structure:**
- 2 explicit tiers: `tokens` (raw primitives) and `semanticTokens` (purpose-driven, condition-aware)
- Semantic tokens reference raw tokens via `{path.to.token}` syntax
- Semantic tokens support conditional values (light/dark mode) natively
- Component tokens via `defineRecipe` / `defineSlotRecipe` — not a separate tier but recipe-embedded

**Package organization:**
- Panda CSS: config-driven (tokens defined in `panda.config`)
- Park UI: copy-on-import model (like RDNA) — source files copied into project, recipes are editable
- Tokens, conditions, and recipes are framework-agnostic (can be reused in Vue, Svelte via Panda)

**Token -> enforcement connection:**
- Type-safe at build time: Panda CSS generates utility classes only for defined token values — using a non-existent token produces a TypeScript error
- No runtime lint rules — enforcement is structural (TypeScript + build)
- `colorPalette` virtual color system constrains which colors components can use

**Component -> token binding model:**
- `defineRecipe` / `defineSlotRecipe`: recipes declare variants that map to token values
- Slot recipes define explicit styling contracts per component sub-part (icon slot, label slot, loading slot)
- Custom `defineComponent` helpers can colocate semantic tokens with recipes — "component token binding"
- `cva` (atomic recipe) for simple cases, `defineRecipe` (config recipe) for design system components

**Generated artifacts:**
- CSS utility classes (atomic, at build time)
- TypeScript types for all token values
- No separate enforcement artifact — enforcement is the type system itself

**Maintenance burden:** LOW — tokens and enforcement are the same artifact. Adding a token automatically makes it available as a utility. Removing a token causes immediate TypeScript errors in all consumers.

**Strengths:**
- Zero-gap between token definition and enforcement (types ARE the enforcement)
- Slot recipes are a strong pattern for multi-part component contracts
- Conditional semantic tokens handle theming elegantly
- Copy-on-import aligns with RDNA's model

**Weaknesses:**
- Requires Panda CSS — not portable to other CSS approaches
- No deprecation workflow (removing a token is a breaking change with no migration path)
- Recipe colocated tokens are a community pattern, not first-class API

---

### 4. vanilla-extract + Sprinkles — Relevance to RDNA: 2/5

**Token tier structure:**
- `createThemeContract`: defines the shape (keys) that all themes must implement — acts as a schema
- `createTheme`: implements a contract with actual values
- No explicit primitive/semantic split — the contract IS the semantic layer, values ARE the primitives

**Package organization:**
- All in `.css.ts` files alongside components
- No separate token package — tokens and components are co-located
- Rainbow Sprinkles extends this with dynamic values via CSS custom properties

**Token -> enforcement connection:**
- Enforcement is entirely at the TypeScript level:
  - `createThemeContract` ensures all themes have the same keys (schema enforcement)
  - Sprinkles `defineProperties` constrains which values are valid for which CSS properties
  - Using a non-existent token is a compile error
- No runtime lint rules, no stylelint, no eslint rules

**Component -> token binding model:**
- `Box` component pattern: polymorphic component that exposes design tokens as typed props
- `sprinkled-react`: binds sprinkles to React components with full IntelliSense
- Components consume tokens via typed props, not className strings

**Generated artifacts:**
- CSS classes (atomic, at build time, zero runtime)
- TypeScript types
- WARNING: CSS output scales as `[values] * [conditions]` — can explode with large token sets

**Maintenance burden:** VERY LOW — tokens, types, and enforcement are unified. But requires vanilla-extract as the styling engine.

**Strengths:**
- Strongest type-level enforcement of any system studied
- Zero runtime overhead
- `createThemeContract` is the cleanest schema enforcement pattern found
- Compile-time errors beat lint-time warnings

**Weaknesses:**
- Requires vanilla-extract — incompatible with Tailwind/CSS-first approach
- No deprecation/migration workflow
- CSS class explosion risk with large token sets
- Not applicable to RDNA's Tailwind v4 + CSS custom properties stack

---

### 5. Carbon Design System — Relevance to RDNA: 4/5

**Token tier structure:**
- Tokens organized by concern across separate packages: `@carbon/themes`, `@carbon/colors`, `@carbon/layout`, `@carbon/type`, `@carbon/motion`
- Each package owns its own token values

**Package organization:**
- Separate npm packages for each token category
- `stylelint-plugin-carbon-tokens` is a separate package that declares Carbon packages as dependencies
- Plugin imports token data directly from the Carbon npm packages at runtime

**Token -> enforcement connection:**
- **Direct import model**: the stylelint plugin `require()`s `@carbon/themes`, `@carbon/layout`, etc. and reads the actual token values at lint time
- Rules: `carbon/layout-use`, `carbon/motion-duration-use`, `carbon/motion-easing-use`, `carbon/theme-use`, `carbon/type-use`
- Auto-fix only where 1:1 value-to-token mapping exists (conservative approach)
- `acceptUndefinedVariables: false` by default — undefined variables must be explicitly allowed

**Component -> token binding model:**
- Components use SCSS mixins/functions from Carbon packages
- No formal component-token binding declaration

**Generated artifacts:**
- Token packages publish SCSS variables, CSS custom properties, JS values
- Stylelint plugin doesn't generate its own data — it reads from the published packages

**Maintenance burden:** LOW for enforcement sync — because the plugin imports live token data, adding a token to `@carbon/themes` automatically makes it available to the lint rules. But HIGH for multi-package coordination when token categories span packages.

**Strengths:**
- **Live import model eliminates stale enforcement data** — lint rules always match current tokens
- Conservative auto-fix (1:1 only) prevents incorrect replacements
- V10/V11 migration support via the same plugin
- Per-package `carbonPath` option supports monorepos

**Weaknesses:**
- Token data spread across 5+ packages creates dependency complexity
- SCSS-centric — doesn't cover JS-in-CSS patterns
- Limited auto-fix capability due to difficulty translating physical values to logical tokens

---

### 6. Shopify Polaris — Relevance to RDNA: 5/5

**Token tier structure:**
- `polaris-tokens` package: primitive + semantic tokens published as CSS custom properties (`--p-*` prefix)
- Private component tokens use `--pc-*` prefix — explicitly banned in consumer code via stylelint
- Space tokens use 100-based scale (e.g., `space-100` = 4px, `space-400` = 16px)

**Package organization:**
- Monorepo with 6 packages: `polaris-react`, `polaris-tokens`, `stylelint-polaris`, `polaris-icons`, `polaris-for-vscode`, docs site
- `stylelint-polaris` has internal structure: `plugins/`, `configs/shared.js`, `configs/internal.js`, `configs/index.js`
- Separate configs for internal (polaris-react authoring) vs external (consumer) — mirrors RDNA's `internals` vs `recommended` split

**Token -> enforcement connection:**
- **40+ stylelint rules** organized by design token category: border, color, motion, shadow, z-index, layout, media-queries, typography
- Each category has multiple rule types: `custom-property-disallowed-list`, `declaration-property-unit-disallowed-list`, `function-disallowed-list`, `at-rule-disallowed-list`
- `conventions/custom-property-allowed-list` is the master rule: flags non-Polaris custom properties, invalid tokens, and private `--pc-*` tokens
- Rules enforce specific token usage per CSS property context (e.g., `px`/`em`/`rem` banned in border properties)

**Component -> token binding model:**
- Components expose tokens via typed props (e.g., `Box` has `padding` prop accepting space token names)
- CSS custom properties bridge token package to component implementation
- VS Code extension provides IntelliSense for token names

**Generated artifacts:**
- CSS custom properties, JS/TS token objects with metadata (value + description), Ruby gem
- Stylelint rules reference token data but exact generation mechanism not visible

**Maintenance burden:** MODERATE — 40+ rules organized by category needs maintenance when token categories change, but the category-based organization makes it systematic.

**Strengths:**
- **Most comprehensive enforcement coverage** of any system studied (40+ rules across 7 categories)
- Internal vs external config split is directly applicable to RDNA
- Private token prefix (`--pc-*`) with explicit lint ban is a clean boundary pattern
- Category-scoped rules make it clear what each rule enforces

**Weaknesses:**
- Stylelint-only — no JSX/className enforcement
- Rule count is high — maintenance overhead scales linearly with categories
- No visible automated generation of rules from token definitions

---

## Best Token Architecture Patterns for RDNA

### Rank 1: Generated Deprecation Data from Token Source (Primer Pattern)

**Pattern:** Token source files include `deprecated.json` / `removed.json` alongside token definitions. Build pipeline generates `dist/deprecated/` and `dist/removed/` directories. Lint rules consume these generated files.

**Why it matters for RDNA:** RDNA's `token-map.mjs` is manually maintained and disconnected from `tokens.css`. The Primer pattern places deprecation decisions at the token source (where they belong) and generates enforcement data. RDNA could add a `deprecated.json` alongside `tokens.css` and generate a section of `token-map.mjs` automatically during `pnpm build`.

**Implementation cost:** Low. Add `deprecated.json` to `packages/radiants/`, add a build script that reads it and updates `token-map.mjs`'s `removedAliases` array.

---

### Rank 2: Category-Scoped Enforcement Rules (Polaris Pattern)

**Pattern:** Instead of one large "no hardcoded values" rule, split enforcement into category-specific rules: color, spacing, border, motion, shadow, z-index. Each category rule knows which CSS properties it covers and which token types are valid for those properties.

**Why it matters for RDNA:** RDNA already does this partially (`no-hardcoded-colors`, `no-hardcoded-spacing`, `no-hardcoded-typography`, `no-hardcoded-motion`, `no-raw-radius`, `no-raw-shadow`). The Polaris pattern takes it further by also covering property-unit enforcement (e.g., banning `px` in border contexts) and function/at-rule enforcement.

**Implementation cost:** Medium. RDNA is already 70% there. Adding property-unit enforcement and private-token bans would be the incremental work.

---

### Rank 3: Live Token Import for Enforcement (Carbon Pattern)

**Pattern:** Lint rules import token data directly from the published token package at runtime, rather than maintaining a separate mapping file.

**Why it matters for RDNA:** Currently `token-map.mjs` duplicates information from `tokens.css`. If the ESLint plugin could parse `tokens.css` (or a generated JSON export) at lint time, the manual map would be eliminated. Adding a token to `tokens.css` would automatically make it available to the enforcement rules.

**Implementation cost:** Medium-High. Requires either: (a) a build step that exports `tokens.css` values as JSON, consumed by the ESLint plugin; or (b) the ESLint plugin parses CSS at startup. Option (a) is more robust.

---

### Rank 4: Private Token Prefix Convention (Polaris Pattern)

**Pattern:** Public tokens use `--p-*` prefix, private/component-internal tokens use `--pc-*` prefix. Lint rules ban `--pc-*` in consumer code.

**Why it matters for RDNA:** RDNA could distinguish between public semantic tokens (e.g., `--color-page`, `--color-main`) and internal component tokens (e.g., `--color-window-chrome-from`) by prefix convention. This would prevent consumers from depending on internal implementation details.

**Implementation cost:** Low. Add a naming convention rule to the ESLint plugin. No token restructuring needed.

---

### Rank 5: Slot-Based Component Token Contracts (Panda CSS Pattern)

**Pattern:** Components declare which slots they have (icon, label, content, overlay) and which tokens bind to each slot. This creates a formal contract between the token system and the component.

**Why it matters for RDNA:** RDNA's `*.meta.ts` files already have `tokenBindings` and `slots` — this is the same pattern. Panda CSS shows that colocating semantic tokens with component recipes reduces maintenance burden. RDNA could formalize this by generating component-specific token documentation from `meta.ts` files.

**Implementation cost:** Low. RDNA already has the infrastructure. The improvement would be using `tokenBindings` data to generate validation rules or documentation.

---

## Primitive/Component Split Patterns

### Pattern A: Three-Package Split (Primer)
```
@primer/primitives     → token data + build + deprecation data
eslint-plugin-primer   → component usage enforcement (JSX)
@primer/stylelint      → token usage enforcement (CSS)
```
- **Boundary:** Token package publishes data, lint packages consume it
- **Coupling:** Loose (JSON data contract between packages)
- **Maintenance:** Each package versioned independently; deprecation data bridges them

### Pattern B: Monorepo with Internal Boundaries (Kong / Polaris)
```
design-tokens/
├── tokens/           → source of truth
├── stylelint-plugin/ → enforcement (reads from tokens/)
└── dist/             → generated artifacts for consumers
```
- **Boundary:** Directory-level separation within one package
- **Coupling:** Tight (plugin reads from sibling directory)
- **Maintenance:** Atomic changes — token + enforcement updated together

### Pattern C: Type-Level Contracts (vanilla-extract)
```
theme.css.ts         → createThemeContract (schema)
theme-light.css.ts   → createTheme(contract, values)
sprinkles.css.ts     → defineProperties(tokens) → constrained utilities
Box.tsx              → typed props consuming sprinkles
```
- **Boundary:** TypeScript type system IS the boundary
- **Coupling:** Maximum (schema, implementation, and enforcement are one artifact)
- **Maintenance:** Zero sync burden — but requires vanilla-extract runtime

### Pattern D: Build-Time Generated Enforcement (Recommended for RDNA)
```
packages/radiants/
├── tokens.css           → source of truth (Tailwind @theme blocks)
├── deprecated.json      → deprecation/removal declarations
├── components/core/     → components with *.meta.ts (tokenBindings)
├── eslint/
│   ├── generated/       → NEW: build-generated enforcement data
│   │   ├── token-values.json   → parsed from tokens.css
│   │   ├── deprecated.json     → copied/merged from source
│   │   └── component-tokens.json → extracted from *.meta.ts
│   ├── token-map.mjs    → manual overrides + imports generated data
│   └── rules/           → lint rules consume generated data
```

**Why Pattern D for RDNA:** It preserves the current Tailwind v4 + CSS-first architecture, adds generated enforcement data without requiring a new build tool, and keeps manual overrides for ambiguous mappings (like RDNA's context-aware hex-to-semantic maps where one color maps to different tokens based on CSS property context).

---

## Maintenance Tradeoff Analysis

### Approach 1: Manual Maps (Current RDNA)

| Aspect | Assessment |
|--------|------------|
| **Current file** | `token-map.mjs` — 135 lines, manually maintained |
| **Sync burden** | Every token change in `tokens.css` requires manual update to `token-map.mjs` |
| **Risk** | Stale mappings cause incorrect autofix suggestions or missed violations |
| **Advantage** | Full control over ambiguous mappings (e.g., `#fce184` maps to `page` in bg context, `flip` in text context) |
| **Comparable systems** | Primer's `css-variable-map.json` (also manual, also risks staleness) |
| **Verdict** | Workable at current scale (10 brand colors, ~30 semantic tokens) but won't scale |

### Approach 2: Generated Artifacts (Primer Deprecation, Kong Token Build)

| Aspect | Assessment |
|--------|------------|
| **Mechanism** | Build script parses token source, generates JSON consumed by lint rules |
| **Sync burden** | Near-zero for token values; manual only for deprecation declarations |
| **Risk** | Build step must run before linting — requires CI pipeline discipline |
| **Advantage** | Token additions are automatically enforcement-ready |
| **Comparable systems** | Primer's `dist/deprecated/`, Kong's Style Dictionary -> JSON, Polaris's token package |
| **Verdict** | Best tradeoff for RDNA. Preserves CSS-first authoring while eliminating manual value sync |

### Approach 3: Type-Level Enforcement (vanilla-extract, Panda CSS)

| Aspect | Assessment |
|--------|------------|
| **Mechanism** | Token definitions ARE the enforcement — TypeScript types constrain valid values |
| **Sync burden** | Zero — single artifact serves both purposes |
| **Risk** | Requires specific build tool (vanilla-extract or Panda CSS) |
| **Advantage** | Enforcement errors surface at compile time, not lint time |
| **Comparable systems** | vanilla-extract `createThemeContract`, Panda CSS `defineTokens` |
| **Verdict** | Not viable for RDNA without abandoning Tailwind v4. However, RDNA could generate TypeScript types from tokens for consumption in `*.meta.ts` files |

### Approach 4: Live Runtime Import (Carbon)

| Aspect | Assessment |
|--------|------------|
| **Mechanism** | Lint rules `require()` the published token package and read values at lint time |
| **Sync burden** | Zero for values; requires publishing token package before linting |
| **Risk** | Lint results depend on which version of token package is installed |
| **Advantage** | Always in sync with installed token version |
| **Comparable systems** | Carbon's `@carbon/themes` import in stylelint plugin |
| **Verdict** | Viable but adds a publish-before-lint dependency. Better suited to multi-repo setups than RDNA's monorepo |

### Recommended Hybrid for RDNA

Combine Approach 1 (manual context-aware maps for ambiguous auto-fix) with Approach 2 (generated token value list and deprecation data):

1. **Generate** `token-values.json` from `tokens.css` during `pnpm build` — lists all defined tokens with their resolved values
2. **Generate** `component-tokens.json` from `*.meta.ts` `tokenBindings` fields
3. **Keep** manual `hexToSemantic` / `oklchToSemantic` context maps for ambiguous auto-fix (where one color maps to different semantic tokens by CSS property)
4. **Auto-generate** `removedAliases` from a `deprecated.json` source file
5. **Validate** at build time that `token-map.mjs` references only tokens that exist in `token-values.json`

This gives RDNA the safety of generated data with the precision of manual context-aware mappings.

---

## Evidence Log

### E1: Primer publishes deprecation data from token source
- **Observation:** `deprecated.json` files alongside token definitions generate `dist/deprecated/` at build time; `@primer/stylelint-config`'s `no-deprecated-colors` rule consumes this generated data
- **Source:** [github.com/primer/primitives/issues/364](https://github.com/primer/primitives/issues/364), [primer/stylelint-config CHANGELOG](https://github.com/primer/stylelint-config/blob/main/CHANGELOG.md)
- **Confidence:** HIGH (issue closed as completed, rule exists in production)
- **Implication:** RDNA should author deprecation decisions alongside tokens and generate enforcement data

### E2: Primer ESLint variable map is manually maintained
- **Observation:** `eslint-plugin-primer-react` uses `css-variable-map.json` (static, committed to repo). Package.json has no build scripts to generate it. No dependency on `@primer/primitives`.
- **Source:** [primer/eslint-plugin-primer-react/src/rules/new-color-css-vars.js](https://github.com/primer/eslint-plugin-primer-react/blob/main/src/rules/new-color-css-vars.js), [package.json](https://github.com/primer/eslint-plugin-primer-react/blob/main/package.json)
- **Confidence:** HIGH (verified in source code)
- **Implication:** Even GitHub's system has manual maintenance gaps — RDNA should avoid replicating this weakness

### E3: Kong's stylelint plugin infers property validity from token naming convention
- **Observation:** `use-proper-token` rule determines that `kui-color-text-primary` is valid for `color` but not `background-color` based on the `text` segment in the token name
- **Source:** [Kong/design-tokens/stylelint-plugin/README.md](https://github.com/Kong/design-tokens/blob/main/stylelint-plugin/README.md)
- **Confidence:** MEDIUM (behavior confirmed in docs; internal implementation not inspected)
- **Implication:** RDNA's new `surface-*`, `content-*`, `edge-*` naming convention could enable similar automatic property-context enforcement

### E4: Carbon's stylelint plugin imports live token data from published packages
- **Observation:** `stylelint-plugin-carbon-tokens` lists `@carbon/themes`, `@carbon/colors`, `@carbon/layout`, `@carbon/type`, `@carbon/motion` as dependencies and imports them at runtime
- **Source:** [github.com/carbon-design-system/stylelint-plugin-carbon-tokens](https://github.com/carbon-design-system/stylelint-plugin-carbon-tokens), [npm page](https://www.npmjs.com/package/stylelint-plugin-carbon-tokens)
- **Confidence:** HIGH (verified in package metadata)
- **Implication:** Monorepo equivalent: RDNA's ESLint plugin could import from a generated JSON in the same workspace rather than maintaining a manual copy

### E5: Polaris separates public vs private tokens by prefix
- **Observation:** Public tokens use `--p-*`, private component tokens use `--pc-*`. `conventions/custom-property-allowed-list` rule explicitly bans `--pc-*` in consumer code.
- **Source:** [polaris.shopify.com/tools/stylelint-polaris/rules/conventions-custom-property-allowed-list](https://polaris-react.shopify.com/tools/stylelint-polaris/rules/conventions-custom-property-allowed-list)
- **Confidence:** HIGH (documented in official Polaris docs)
- **Implication:** RDNA should consider a naming convention or prefix to distinguish public semantic tokens from internal implementation tokens

### E6: Panda CSS slot recipes define component token contracts
- **Observation:** `defineSlotRecipe` creates named slots (icon, label, loading) with per-slot styling that responds to shared variants. Custom `defineComponent` helpers colocate semantic tokens with recipes.
- **Source:** [panda-css.com/docs/concepts/slot-recipes](https://panda-css.com/docs/concepts/slot-recipes), [community gist on colocated component tokens](https://gist.github.com/ShaneYu/401d395f13ad48a623731bb3c8372e9f)
- **Confidence:** HIGH (first-class API documented on official site)
- **Implication:** RDNA's `*.meta.ts` `tokenBindings` field already captures this pattern. Formalizing it with validation would be the next step.

### E7: vanilla-extract `createThemeContract` enforces theme shape at compile time
- **Observation:** `createThemeContract` defines key structure with null values. Any theme created with `createTheme(contract, ...)` that is missing a key produces a TypeScript compile error. This is the strongest enforcement pattern found.
- **Source:** [vanilla-extract.style](https://vanilla-extract.style/), [highlight.io/blog/typesafe-tailwind](https://www.highlight.io/blog/typesafe-tailwind)
- **Confidence:** HIGH (core API, widely documented)
- **Implication:** RDNA can't use vanilla-extract directly, but could generate a TypeScript interface from `tokens.css` that `*.meta.ts` files import for type-safe `tokenBindings`

### E8: W3C DTCG Design Tokens spec reached v1 stability (October 2025)
- **Observation:** The Design Tokens Community Group published the first stable specification (2025.10). Style Dictionary v4 has first-class DTCG support. Over 10 tools implement or are implementing the standard.
- **Source:** [w3.org/community/design-tokens/2025/10/28](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
- **Confidence:** HIGH (official W3C announcement)
- **Implication:** If RDNA ever needs to interoperate with Figma/Tokens Studio or publish tokens for external consumption, DTCG format is now the standard. Current CSS-first approach is fine for internal use.

### E9: Martin Fowler architecture describes public/private token scoping
- **Observation:** Option tokens should be private (not exported to consumers). Enforcement via Style Dictionary `filter: token => !token.filePath.endsWith('options.json')` or per-token `"public": true` flag. Figma supports this via `hiddenFromPublishing`.
- **Source:** [martinfowler.com/articles/design-token-based-ui-architecture.html](https://martinfowler.com/articles/design-token-based-ui-architecture.html)
- **Confidence:** HIGH (detailed reference architecture with code examples)
- **Implication:** RDNA's brand primitives (`--color-sun-yellow`, etc.) are currently public but should arguably be private. Consumers should use semantic tokens only. A lint rule banning direct brand primitive usage in app code would enforce this.

### E10: RDNA's token-map.mjs is context-aware — a unique strength
- **Observation:** RDNA's `hexToSemantic` maps the same hex value to different semantic tokens based on CSS property context (e.g., `#fef8e2` -> `page` in bg context, `flip` in text context). No other system studied has this level of context-aware auto-fix.
- **Source:** `/Users/rivermassey/Desktop/dev/DNA/packages/radiants/eslint/token-map.mjs`
- **Confidence:** HIGH (verified in source)
- **Implication:** This context-awareness is valuable and should be preserved. It's the one part of the manual map that can't be trivially generated. The hybrid approach (generated values + manual context maps) is correct.
