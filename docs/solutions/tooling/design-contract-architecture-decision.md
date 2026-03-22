---
title: "Design Contract Architecture: Meta-First Generation"
category: tooling
date: 2026-03-22
tags: [eslint, design-system, contract, architecture, meta, registry, enforcement, generated-artifacts, token-map]
---

# Design Contract Architecture: Meta-First Generation

## Symptom

Registry generation reads from `*.meta.ts` files (canonical), but ESLint rules read from hand-maintained `token-map.mjs` and config in `eslint.rdna.config.mjs`. These are separate seams that drift independently. Specific drift found:

- `SEMANTIC_COLOR_SUFFIXES` in `no-hardcoded-colors.mjs:76-89` is stale — missing `surface-*`, `content-*`, `action-*`, `edge-*`, `status-*` tokens
- `themeVariants` in `eslint.rdna.config.mjs:93-96` includes nonexistent CSS selectors, misses Card's actual variants
- Only 5/39 components have HTML element replacement enforcement in `rdnaComponentMap`

## Investigation

Researched 11+ comparable design systems (Atlassian, Adobe Spectrum, Shopify Polaris, Primer, Carbon, Kong, kickstartDS, Storybook, vanilla-extract, Panda CSS, W3C DTCG). Evaluated 4 candidate architectures against 10 weighted criteria.

Key finding: **Atlassian's `@atlaskit/eslint-plugin-design-system` already implements the target pattern** — rules import generated token data from `@atlaskit/tokens/tokens-raw` at load time. No hand-maintained maps.

Second finding: **No system in the industry generates ESLint rules from component metadata.** This is an open gap RDNA can fill.

Third finding: **RDNA's `.meta.ts` is already richer than any comparable system's component schema** — including Adobe Spectrum (no slots, no tokenBindings).

## Root Cause

The meta→registry and token-map→eslint pipelines were built independently. There was no mechanism to share data between them. The `token-map.mjs` file is a manual duplicate of information that exists in `tokens.css` and could exist in `*.meta.ts`.

## Solution

**Architecture A: Meta-First Generation** — extend `*.meta.ts` with enforcement fields, add system-level `design-contract.ts`, generate `eslint-contract.json` from the same contract.

### New fields on ComponentMeta (all optional, backward-compatible)

```typescript
// packages/preview/src/types.ts — extend ComponentMeta
replaces?: ElementReplacement[];     // HTML elements this component replaces
pixelCorners?: boolean;              // uses clip-path pixel corners
shadowSystem?: "standard" | "pixel"; // which shadow system
styleOwnership?: StyleOwnership[];   // theme-owned data attributes
wraps?: string;                      // Base UI primitive wrapped
a11y?: A11yContract;                 // accessibility contract
structuralRules?: StructuralRule[];  // markup constraints
```

### System-level contract

```typescript
// packages/radiants/contract/system.ts
export const radiantsSystemContract: DesignSystemContract = {
  tokens: { brandPalette, hexToSemantic, oklchToSemantic, removedAliases, semanticColorSuffixes },
  shadows: { elevations, migrationMap },
  motion: { maxDurationMs: 300, allowedEasings: ["ease-out"], durationTokens, easingTokens },
  pixelCorners: { triggerClasses, bannedCoexistingClasses },
  themeVariants: [...],
  componentMap: {}, // generated from component replaces fields
  requiredTokens: ["--color-page", "--color-inv", "--color-main", "--color-flip", "--color-line"],
};
```

### Generated artifacts

- `packages/radiants/generated/eslint-contract.json` — all ESLint rule data
- `packages/radiants/generated/ai-contract.json` — prompt-friendly flattened view
- Extended `tools/playground/generated/registry.manifest.json` — contract fields included

### Migration (5 phases, ~8.5 days)

1. System contract extraction (~2 days)
2. Component field additions (~3 days)
3. ESLint rule refactoring (~2 days)
4. AI contract generation (~1 day)
5. `token-map.mjs` deprecation (~0.5 day)

### Which rules read what from the contract

| Rule | Contract section |
|------|-----------------|
| `no-hardcoded-colors` | `tokenMap.hexToSemantic`, `tokenMap.oklchToSemantic`, `tokenMap.semanticColorSuffixes` |
| `no-removed-aliases` | `tokenMap.removedAliases` |
| `prefer-rdna-components` | `componentMap` (generated from component `replaces` fields) |
| `no-clipped-shadow` | `pixelCorners.triggerClasses`, `pixelCorners.shadowMigrationMap` |
| `no-pixel-border` | `pixelCorners.triggerClasses` |
| `no-mixed-style-authority` | `themeVariants` + per-component `styleOwnership` |
| `no-hardcoded-motion` | `motion.durationTokens`, `motion.easingTokens` |
| `no-raw-shadow` | `shadows.validStandard`, `shadows.validPixel` |
| `no-hardcoded-typography` | `typography.validSizes` |

## Prevention

- Freshness guard: extend `check-registry-freshness.mjs` to cover `eslint-contract.json`
- Commit generated files — CI catches drift via `git diff --exit-code`
- New components with `replaces` field automatically appear in enforcement
- New tokens in `tokens.css` automatically appear in `semanticColorSuffixes`

## Related

- Full research: `research/design-guard/` (scorecard, evidence-log, candidate-architectures, recommendation, loop-log)
- Contract synthesis: `docs/research/design-contract-synthesis.md` (full TypeScript interfaces)
- Guard rails analysis: `docs/research/guard-rails-scout-report.md`
- Token pipeline analysis: `docs/research/token-primitives-scout-report.md`
- Rejected architectures: B (CSS-Derived), C (Schema Registry — over-engineered), D (Overlay — incomplete)
