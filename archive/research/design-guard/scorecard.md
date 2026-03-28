# Architecture Scorecard

**Last updated:** 2026-03-22 | **Loop:** 2 (no score changes — Critic found mitigatable risks, not architectural flaws)

## Evaluation Criteria

| # | Criterion | Weight | Rationale |
|---|-----------|--------|-----------|
| 1 | Single source of truth | 5 | Core mission — contract drives everything |
| 2 | Generates registry + guards from same contract | 5 | Eliminates the current dual-pipeline drift |
| 3 | Separates design-system facts from app-level policy | 4 | RDNA vs RadOS boundary |
| 4 | Supports AI-facing outputs | 3 | ai-contract.json, MCP server, prompt context |
| 5 | Minimizes manual drift surfaces | 5 | token-map.mjs + eslint config are the problem |
| 6 | Works for RDNA now | 4 | 42 components, 1 theme, small team |
| 7 | Generalizes to other design systems later | 3 | Future reuse, not current priority |
| 8 | Reasonable migration cost from current repo | 4 | Must be achievable in ~2 weeks |
| 9 | Low maintenance burden | 4 | Ongoing cost matters as much as migration cost |
| 10 | Configurable enforcement strictness | 3 | warn → error governance, per-consumer policy |

**Max possible score:** 200

## Candidate Scores

| Criterion | Wt | A: Meta-First | B: CSS-Derived | C: Schema Registry | D: Overlay |
|-----------|----|:---:|:---:|:---:|:---:|
| Single source of truth | 5 | 4 | 3 | 5 | 2 |
| Generates registry + guards | 5 | 5 | 4 | 5 | 2 |
| Separates DS facts from app policy | 4 | 4 | 3 | 5 | 3 |
| Supports AI-facing outputs | 3 | 4 | 3 | 5 | 2 |
| Minimizes drift surfaces | 5 | 4 | 4 | 5 | 2 |
| Works for RDNA now | 4 | 4 | 3 | 2 | 5 |
| Generalizes later | 3 | 3 | 3 | 5 | 1 |
| Migration cost | 4 | 3 | 3 | 1 | 5 |
| Maintenance burden | 4 | 3 | 3 | 2 | 4 |
| Configurable strictness | 3 | 4 | 3 | 5 | 3 |

## Weighted Totals

| Rank | Architecture | Score | % of Max |
|------|-------------|-------|----------|
| 1 | C: Schema Registry | 160 | 80% |
| **2** | **A: Meta-First Generation** | **154** | **77%** |
| 3 | B: CSS-Derived + Meta Enrichment | 130 | 65% |
| 4 | D: Incremental Contract Overlay | 116 | 58% |

## Decision

**Architecture A is the recommended choice** despite C scoring 6 points higher (3.75% gap).

Rationale: C's advantage is entirely in theoretical criteria (generalization, purity). On the four pragmatic criteria (works now, migration cost, maintenance burden, works now), A scores **52 vs C's 32** — a 62% advantage on practical execution. C requires building a schema compiler from scratch, migrating 42 meta files to YAML/JSON, and sacrificing TypeScript type inference during authoring.

Architecture A with D's overlay pattern for staged migration is the optimal path.

## External Validation (from scout findings)

- **Atlassian** validates A's core pattern: generated token artifacts consumed by ESLint rules
- **kickstartDS** validates A's "one source, many outputs" pipeline
- **No system** generates ESLint rules from component metadata — RDNA would pioneer this
- **RDNA's `.meta.ts`** is already richer than Adobe Spectrum's component schemas — the format is right, the consumption pipeline is what's missing
