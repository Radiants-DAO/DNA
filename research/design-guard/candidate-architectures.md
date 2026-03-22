# Candidate Architectures

**Last updated:** 2026-03-22 | **Loop:** 1

## Architecture A: Meta-First Generation (RECOMMENDED)

### Description
Extend existing `*.meta.ts` files with enforcement fields (`replaces`, `styleOwnership`, `pixelCorners`, `structuralRules`). Add a system-level `design-contract.ts`. A single generator reads both → emits `registry.manifest.json` + `eslint-contract.json` + `ai-contract.json`. ESLint rules read from generated JSON instead of hand-maintained `token-map.mjs`.

### Data Flow
```
*.meta.ts ──────────┐
                     ├──► generator ──► registry.manifest.json  (playground, docs)
design-contract.ts ──┤              ──► eslint-contract.json    (ESLint rules)
                     │              ──► ai-contract.json        (AI agents)
tokens.css ──────────┘  (verification)
```

### Migration Path (5 phases, ~8.5 days)
1. System contract extraction → `design-contract.ts` (~2 days)
2. Component field additions → `replaces`, `pixelCorners`, etc. (~3 days)
3. ESLint rule refactoring → read from `eslint-contract.json` (~2 days)
4. AI contract generation → `ai-contract.json` (~1 day)
5. `token-map.mjs` deprecation (~0.5 day)

### Strengths
- 42 meta files are already 80% of what's needed
- TypeScript authoring preserves IDE autocompletion, type inference, refactoring
- Backward-compatible: new fields are optional
- Validated by Atlassian (generated token artifacts → ESLint rules)
- Validated by kickstartDS (single source → multi-artifact generation)

### Weaknesses
- System-level `design-contract.ts` is a new coordination point
- Generator becomes a critical-path build dependency
- ESLint rules need `eslint-contract.json` to exist before linting

### Why it wins
Scores 154/200. Pragmatic execution criteria dominate: works for RDNA now (4), reasonable migration (3), low maintenance (3). External research confirms RDNA's `.meta.ts` is already the richest component metadata format in the industry — extending it is the right move.

---

## Architecture B: CSS-Derived + Meta Enrichment (REJECTED)

### Description
Keep CSS as primary authority for tokens and selectors. AST-scan `tokens.css` / `base.css` → extract token map, theme variants, component selectors. Meta enriches with intent data.

### Why rejected
- **CSS shows implementation, not intent.** CSS can show `[data-color="danger"]` exists but cannot express "Button tone is a public contract" or "`<details>` should map to Collapsible."
- Two sources of truth (CSS + meta) with a fragile merge step
- Tailwind v4 `@theme` parsing has quirks (1-level var() chain limit)
- Scored 130/200 — lowest on "single source of truth" and "separates DS from app policy"

---

## Architecture C: Schema Registry Pattern (REJECTED)

### Description
JSON/YAML schema file per component in a standard format. A compiler reads schemas → all artifacts.

### Why rejected (6 objections from Critic)
1. **Catastrophic migration cost** — 3-4 weeks to rewrite 42 meta files + build schema compiler
2. **Authoring downgrade** — YAML/JSON loses TypeScript type inference, IDE autocompletion, refactoring
3. **Schema format becomes a versioned API surface** — meta adding a field is trivial; schema format changes cascade
4. **Assumes imminent second design system** — optimizes for a future that may not arrive
5. **Schema compiler is a project within the project** — 1000+ lines, custom AST, multiple formatters
6. **Over-engineers for 42 components** — eliminates 2 manual sync points by adding 5 new infrastructure pieces

Despite scoring highest (160/200), the 6-point gap over A is entirely in theoretical criteria. If A needs to become C later, the jump is ~2 weeks from A's foundation.

---

## Architecture D: Incremental Contract Overlay (REJECTED)

### Description
Thin `design-contract.ts` overlay that imports from meta + adds system rules. Minimal generator emits `eslint-contract.json`. Rules migrate gradually.

### Why rejected
- Does not achieve single source of truth — two parallel data paths
- `token-map.mjs` continues to exist indefinitely
- Scored lowest (116/200) on core criteria
- **However:** D's staged migration tactic is adopted into A's implementation plan. Phase 1 of A is essentially D.
