# Recommendation: Architecture A — Meta-First Generation

**Last updated:** 2026-03-22 | **Loop:** 3 | **Confidence:** High

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

## Migration phases (revised Loop 2 — with mitigations)

| Phase | Scope | Effort | Risk | Mitigations |
|-------|-------|--------|------|-------------|
| 1. System contract extraction | Create `system.ts`, generator, `eslint-contract.json`. Convert `token-map.mjs` to thin re-export via `createRequire`. Extend freshness guard. | ~2.5 days | Low | M-1 (freshness guard), M-3 (try/catch fallback), M-4 (conflict detection) |
| 2. Component field additions | Add `replaces`, `pixelCorners`, etc. to meta files | ~3 days | Low | M-5 (ghost meta guard) |
| 3. ESLint rule refactoring | Rules read new contract exports from `token-map.mjs` wrapper (e.g., `semanticColorSuffixes`, `shadowMigrationMap`) | ~2 days | Medium | M-2 (frozen `token-map.mjs` backup) |
| 4. AI contract generation | `ai-contract.json` | ~1 day | Low | — |
| 5. token-map.mjs deprecation | Remove hand-maintained values, keep as read-only bridge | ~0.5 day | Low | Validate all rules pass before removing backup |

**Total:** ~9 days (up from 8.5 — Phase 1 gains 0.5 day for mitigations)

**Rollback:** At any phase, `token-map.mjs` still has its original values as commented backup (M-2). Uncomment to restore pre-migration state. Generated files are additive — deleting them degrades to pre-migration behavior, not a crash (M-3).

## Rule migration order (added Loop 3)

Ranked by drift risk × blast radius. First batch fixes the most impactful active bugs.

| Priority | Rule | Why first | Active issue |
|----------|------|-----------|-------------|
| 1 | `no-hardcoded-colors` | False positives NOW + broken autofix | `SEMANTIC_COLOR_SUFFIXES` missing `surface-*`, `content-*`, `head`, `depth` |
| 2 | `prefer-rdna-components` | Only 5/39 components enforced | Missing `hr`, `meter`, `details`, `label`, etc. |
| 3 | `no-removed-aliases` | Simplest migration, potentially stale | 5 entries may not cover all removed aliases |
| 4+5 | `no-clipped-shadow` + `no-pixel-border` | Bundle — shared `PIXEL_CORNER_RE` | Missing `glow-sm/md/lg/xl` variants |
| 6 | `no-mixed-style-authority` | Already externalized to config | Config → contract wiring only |
| 7 | `no-hardcoded-motion` | Message strings only, zero logic impact | No urgency |

**Phase 3 execution:** Migrate rules 1-3 first (~1 day), then 4-5 bundled (~0.5 day), then 6-7 (~0.5 day).

## Concrete `eslint-contract.json` (added Loop 3)

A complete draft with all real RDNA values was produced in Loop 3 (E-L12). Key dimensions:
- 10 top-level keys
- `tokenMap`: brandPalette (10), hexToSemantic (7), oklchToSemantic (9), removedAliases (5), semanticColorSuffixes (25)
- `componentMap`: 5 entries (Phase 2 adds ~10 more from meta files)
- `pixelCorners`: triggerClasses (6), shadowMigrationMap (9)
- `themeVariants`: 8 entries
- `motion`, `shadows`, `typography`: informational for message strings
- `textLikeInputTypes`: 7 input types for `prefer-rdna-components` qualifier

The draft JSON is stored in the Loop 3 Contract Synthesizer findings and ready for implementation.

## Required mitigations (added Loop 2)

The Critic identified 2 genuine regressions and 5 mitigations not in the original plan:

### M-1: Extend freshness guard BEFORE Phase 3
Add `packages/radiants/generated/eslint-contract.json` to `CHECKED_PATHS` in `check-registry-freshness.mjs` during Phase 1, not after Phase 3. This closes the window where rules read from JSON but CI doesn't verify freshness.

### M-2: Freeze `token-map.mjs` as read-only during migration
Do not remove entries from `token-map.mjs` until Phase 5 is validated. During Phases 1-4, `token-map.mjs` is a thin re-export of `eslint-contract.json` BUT also retains its original hand-authored values as commented-out backup. This makes rollback safe at any phase.

### M-3: Safe fallback for missing JSON (refined Loop 3)
Rules consuming the contract must use try/catch with a **narrowed** error handler. Catch only `MODULE_NOT_FOUND` and `SyntaxError`; re-throw unexpected errors so programming mistakes surface during development:
```javascript
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let contract;
try { contract = require('../generated/eslint-contract.json'); }
catch (err) {
  if (err.code !== 'MODULE_NOT_FOUND' && !(err instanceof SyntaxError)) throw err;
  console.warn('[rdna] eslint-contract.json not found or invalid — run pnpm registry:generate');
  contract = {};
}
```
This preserves the current silent-fail behavior for expected failures (missing/malformed JSON) while surfacing unexpected errors. Validated: `createRequire` works in `.mjs`, path resolves correctly, `require()` throws synchronously, no circular deps.

### M-4: Generator conflict detection
If two meta files declare `replaces` for the same HTML element, the generator must throw an explicit error with both file paths. No silent last-write-wins.

### M-5: Ghost meta guard
Freshness check verifies every `*.meta.ts` that declares `replaces` has a corresponding `*.tsx` in the same directory. Orphaned meta files are a CI failure.

## Strongest objection and response

**Objection:** "The generator becomes a critical-path build dependency. If `eslint-contract.json` is stale, lint silently uses wrong data."

**Response:** This is already true for `registry.manifest.json` — and solved by `check-registry-freshness.mjs`. Extend the same freshness guard to cover the contract (M-1). Commit generated files. CI catches drift.

**Objection (Loop 2):** "Architecture A changes the failure mode from silent-pass to crash when JSON is missing."

**Response:** Mitigated by M-3 (try/catch with fallback). Rules fail open like today, with a visible warning. Generator breakage does not block local development.

**Objection (Loop 2):** "During migration, split-reader state means rules use different data snapshots."

**Response:** Mitigated by M-2 (freeze token-map.mjs). Both data paths read from the same underlying JSON via the re-export wrapper. True divergence only occurs if someone edits `token-map.mjs` directly during migration — which the freeze prevents.
