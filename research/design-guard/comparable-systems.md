# Comparable Systems

**Last updated:** 2026-03-22 | **Loop:** 2

## Tier 1: Directly Applicable (score 4-5/5)

### Atlassian Design System (`@atlaskit/eslint-plugin-design-system`)
- **URL:** https://atlassian.design/components/eslint-plugin-design-system/
- **Source mirror:** https://github.com/pioug/atlassian-frontend-mirror/tree/master/design-system/eslint-plugin
- **Why it matters:** 50+ rules. **Rules consume generated token data** from `@atlaskit/tokens/tokens-raw`. Plugin index is codegen'd from rule metadata. Deprecation rules import `renameMapping` from generated artifacts. Style Dictionary powers the token build.
- **Key pattern:** Generated token artifact → ESLint rule data source (eliminates hand-maintained maps)
- **RDNA relevance:** 5/5 — proves the exact architecture RDNA needs at enterprise scale

### Shopify Polaris (`@shopify/stylelint-polaris`)
- **URL:** https://github.com/Shopify/polaris/tree/main/stylelint-polaris
- **Why it matters:** 40+ rules organized by category. Coverage meta-plugin wraps all enforcement. Z-index allowlist generated from `themeDefault.zIndex`. Private token prefix (`--pc-*`) banned in consumer code.
- **Key pattern:** Category-based severity + private/public token boundary
- **RDNA relevance:** 5/5 — category organization and internal/external config split mirror RDNA's needs

### Adobe Spectrum Design Data
- **URL:** https://github.com/adobe/spectrum-design-data
- **Why it matters:** Most mature machine-readable design data ecosystem. 80 component schemas. Two MCP servers for AI consumption. UUID-based entity tracking. `llms.txt` orientation file. Token diff generator.
- **Key pattern:** MCP server for AI-facing design data; UUID-based rename-safe tracking
- **RDNA relevance:** 4/5 — MCP pattern and UUID tracking are directly applicable; component schemas are shallower than RDNA's meta.ts

### kickstartDS
- **URL:** https://www.kickstartds.com/
- **Why it matters:** JSON Schema as universal component API contract. One schema generates TypeScript types, Storybook controls, CMS schemas, GraphQL fragments.
- **Key pattern:** Single source → multi-artifact generation pipeline
- **RDNA relevance:** 4/5 — validates RDNA's "meta as source of truth" architecture

### Storybook MCP / Component Manifest
- **URL:** https://github.com/storybookjs/mcp
- **Why it matters:** Component manifest format served via MCP. Token-efficient markdown output. Story-derived examples.
- **Key pattern:** MCP delivery of component metadata for AI agents
- **RDNA relevance:** 4/5 — RDNA's .meta.ts is already richer than Storybook's manifest format

## Tier 2: Useful Patterns (score 3/5)

### IBM Carbon (`stylelint-plugin-carbon-tokens`)
- **URL:** https://github.com/carbon-design-system/stylelint-plugin-carbon-tokens
- **Why it matters:** Rules import token data directly from published Carbon packages at runtime. Three config tiers (strict/recommended/light-touch). Conservative auto-fix (1:1 only).
- **Key pattern:** Live token import; three-tier config with varying exception tolerance
- **RDNA relevance:** 3/5

### Primer Primitives + Primer React (GitHub)
- **URL:** https://github.com/primer/primitives, https://github.com/primer/eslint-plugin-primer-react
- **Why it matters:** 3-tier tokens (base/functional/component). Publishes `deprecated.json` / `removed.json` consumed by lint rules. ESLint variable map is still manually maintained (a weakness).
- **Key pattern:** Generated deprecation data from token source
- **RDNA relevance:** 3/5 (deprecation pattern useful; manual ESLint map is a cautionary tale)

### Kong Design Tokens
- **URL:** https://github.com/Kong/design-tokens
- **Why it matters:** Tokens + stylelint in one repo. Property-semantic enforcement by naming convention (`color-text-*` valid for `color` property).
- **Key pattern:** Naming convention → automatic property-context enforcement
- **RDNA relevance:** 3/5 (RDNA's `surface-*`/`content-*`/`edge-*` naming could enable similar)

### W3C DTCG Format Module 2025.10
- **URL:** https://www.designtokens.org/
- **Why it matters:** First stable design token interchange standard. Formal JSON Schema. `$extensions` for vendor metadata.
- **Key pattern:** Standard token format with extensibility; RDNA should support for interop
- **RDNA relevance:** 3/5 (token layer only; RDNA needs everything above)

## Tier 3: Monitor / Limited Applicability (score 1-2/5)

| System | URL | Note |
|--------|-----|------|
| W3C UI Spec Schema CG | https://www.w3.org/community/uispec/ | Launched Aug 2025, 10 participants, no deliverables yet. Monitor. |
| MetaMask ESLint plugin | https://github.com/MetaMask/eslint-plugin-design-tokens | 3 rules, fully hardcoded. Too simple. |
| Salesforce SLDS Linter | https://github.com/salesforce-ux/slds-linter | Ecosystem-specific (LWC/Aura). SARIF output interesting. |
| Tokens Studio | https://documentation.tokens.studio/ | Figma bridge. Graph engine interesting but token-only. |
| vanilla-extract | https://vanilla-extract.style/ | Strongest type-level enforcement but requires its own runtime. |

## Commit vs Generate-on-the-fly for Lint Data (Loop 2)

| System | Lint data committed? | Freshness guard? | Drift consequence | Architecture |
|--------|---------------------|-------------------|-------------------|-------------|
| **Atlassian** | Yes (generated, in package) | Version coupling | Silent wrong lint | Generated artifacts in npm package |
| **Shopify Polaris** | No (runtime import) | Not needed | Version mismatch | On-the-fly at lint time |
| **Primer/GitHub** | Yes (source + generated dist) | Implicit (versioning) | Silent wrong lint | Source JSON committed, dist built |
| **RDNA (current)** | Yes (registry.manifest.json) | Yes (git diff guard) | CI fails | Generated, committed, verified |

**Conclusion:** 2/3 systems commit. RDNA's freshness guard is the strongest approach. Commit `eslint-contract.json`.

## Industry Gap RDNA Can Fill

**No system generates ESLint rules from component schema metadata.** All enforcement is hand-authored. RDNA could pioneer automated lint rule generation from `.meta.ts` registry data — the `replaces` field generating `prefer-rdna-components` entries, the `pixelCorners` flag triggering structural rules, the `styleOwnership` field configuring `no-mixed-style-authority`.
