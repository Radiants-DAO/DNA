# Recommendation: Architecture A — Meta-First Generation

**Last updated:** 2026-03-22 | **Loop:** 1 | **Confidence:** High

## One-sentence summary

Extend RDNA's existing `*.meta.ts` files with enforcement fields, add a system-level `design-contract.ts`, and generate `eslint-contract.json` + `ai-contract.json` alongside the existing `registry.manifest.json` — making the authored contract the single source of truth for registry, enforcement, and AI.

## Why this architecture

1. **RDNA's `.meta.ts` is already the richest component metadata format in the industry** — richer than Adobe Spectrum, Storybook, kickstartDS. Extending it is building on a strong foundation, not starting over.

2. **Atlassian proves the core pattern at enterprise scale** — 50+ ESLint rules consuming generated token data from `@atlaskit/tokens/tokens-raw`. RDNA follows the same architecture.

3. **No system generates ESLint rules from component metadata** — this is an open gap. RDNA can pioneer it with the `replaces` → `prefer-rdna-components`, `pixelCorners` → structural rules, `styleOwnership` → `no-mixed-style-authority` pattern.

4. **Migration is ~8.5 days, not weeks** — all new fields are optional. Existing meta files remain valid. Rules migrate one at a time from `token-map.mjs` to `eslint-contract.json`.

5. **The alternative (C: Schema Registry) costs 3-4 weeks and sacrifices TypeScript authoring** — for a 3.75% theoretical score improvement that's entirely in non-urgent criteria.

## What gets built

### New authored artifacts
- `packages/radiants/contract/system.ts` — DesignSystemContract instance (token maps, shadow system, motion constraints, pixel corner rules, theme variants)
- Extended `ComponentMeta` type with: `replaces`, `pixelCorners`, `shadowSystem`, `styleOwnership`, `wraps`, `a11y`, `structuralRules`
- 7 new optional fields across 42 component meta files (most components need only 1-3)

### New generated artifacts
- `packages/radiants/generated/eslint-contract.json` — all data ESLint rules need
- `packages/radiants/generated/ai-contract.json` — flattened prompt-friendly view
- Extended `registry.manifest.json` — contract fields included

### Refactored consumers
- 9+ ESLint rules migrate from `token-map.mjs` → `eslint-contract.json`
- `eslint.rdna.config.mjs` gets thinner (no more embedded `themeVariants`)
- `token-map.mjs` becomes thin re-export, then deprecated

## What this fixes immediately

| Current Problem | How Contract Fixes It |
|----------------|----------------------|
| Stale `SEMANTIC_COLOR_SUFFIXES` (E-L2) | Generated from `tokens.css` into contract |
| Wrong `themeVariants` list (E-L3) | Authored in `system.ts`, components declare `styleOwnership` |
| Only 5/39 components enforced (E-L4) | `replaces` field on meta → generated `componentMap` |
| Two pipelines share zero data (E-L1) | Single generator produces both registry + enforcement |

## What this enables later
- MCP server consuming contract data (Adobe Spectrum pattern)
- ESLint bulk suppressions for `recommended` → `recommended-strict` migration
- Codegen'd plugin `index.mjs` when rule count exceeds ~20
- DTCG token export via `$extensions` for interoperability
- Second design system using same guard engine, different authored contract

## Migration phases (from Contract Synthesizer)

| Phase | Scope | Effort | Risk |
|-------|-------|--------|------|
| 1. System contract extraction | Create `system.ts`, generator, `eslint-contract.json` | ~2 days | Low |
| 2. Component field additions | Add `replaces`, `pixelCorners`, etc. to meta files | ~3 days | Low |
| 3. ESLint rule refactoring | Rules read from generated JSON | ~2 days | Medium — stale JSON risk |
| 4. AI contract generation | `ai-contract.json` | ~1 day | Low |
| 5. token-map.mjs deprecation | Remove hand-maintained file | ~0.5 day | Low |

**Rollback:** At any phase, revert ESLint rule imports to `token-map.mjs`. Generated files are additive.

## Strongest objection and response

**Objection:** "The generator becomes a critical-path build dependency. If `eslint-contract.json` is stale, lint silently uses wrong data."

**Response:** This is already true for `registry.manifest.json` — and solved by `check-registry-freshness.mjs`. Extend the same freshness guard to cover the contract. Commit generated files. CI catches drift.
