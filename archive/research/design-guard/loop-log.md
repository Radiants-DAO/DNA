# Research Loop Log

**Research objective:** Determine the best defensible architecture for making RDNA's machine-readable design contract the single source of truth for registry generation, design guards, AI-facing artifacts, and future reuse.

---

## Loop 1 — 2026-03-22

### What we learned

**Local repo:**
- Two data pipelines (meta→registry, token-map→eslint) share zero data — guaranteed drift
- Active bug: `SEMANTIC_COLOR_SUFFIXES` is stale, causing false positives for new naming convention tokens
- `themeVariants` list in eslint config is partially wrong (includes nonexistent CSS selectors, misses Card variants)
- Only 5 of 39 components have HTML element replacement enforcement
- RDNA's context-aware hex→semantic autofix mapping is unique — no other system has it

**External research (11+ systems analyzed):**
- Atlassian proves generated-token-artifact→ESLint at enterprise scale (50+ rules)
- No system in the industry generates ESLint rules from component metadata — open gap
- RDNA's `.meta.ts` is already richer than Adobe Spectrum's component schemas (slots, tokenBindings, registry config)
- Adobe has 2 MCP servers for AI-facing design data — validates the MCP pattern
- kickstartDS validates single-source→multi-artifact generation (JSON Schema→5+ outputs)
- ESLint v9.24+ bulk suppressions solve the warn→error migration problem
- W3C DTCG 2025.10 is stable for token interchange; RDNA should support via `$extensions`
- RDNA's structured exception metadata (reason/owner/expires/issue) is ahead of all systems studied

### Current leading architecture
**Architecture A: Meta-First Generation** (score: 154/200)
- Extend `*.meta.ts` with enforcement fields
- Add `design-contract.ts` at system level
- Generate `eslint-contract.json` + `ai-contract.json` from the same contract
- ESLint rules consume generated artifacts instead of hand-maintained maps

### Confidence level
**High.** External evidence validates the pattern (Atlassian, kickstartDS). No blocking open questions for Phase 1. Migration cost is reasonable (~8.5 days). The format (`.meta.ts`) is confirmed as industry-leading.

### Biggest unresolved questions
1. Build ordering: commit generated files (leaning yes, matching existing `registry.manifest.json` pattern)
2. `token-map.mjs` transition: thin re-export vs delete (leaning re-export for Phase 1)
3. Per-component vs system-level `styleOwnership` aggregation (leaning union of both)
4. Whether a second design system is planned (affects generalization priority)

### Artifacts produced
- `archive/research/design-guard/scorecard.md` — weighted scoring of 4 architectures
- `archive/research/design-guard/open-questions.md` — 7 open + 3 resolved
- `archive/research/design-guard/evidence-log.md` — 8 local + 8 external evidence entries
- `archive/research/design-guard/comparable-systems.md` — 11+ systems in 3 tiers
- `archive/research/design-guard/candidate-architectures.md` — 4 candidates with rejection rationale
- `archive/research/design-guard/recommendation.md` — Architecture A with migration plan
- `archive/research/design-guard/loop-log.md` — this file
- `archive/research/design-contract-synthesis.md` — full contract TypeScript interfaces
- `archive/research/guard-rails-scout-report.md` — enforcement patterns
- `archive/research/token-primitives-scout-report.md` — token pipeline patterns

### Next-step questions for Loop 2
1. Review the proposed `ComponentContractMeta` and `DesignSystemContract` TypeScript interfaces — are the field names and types right?
2. Draft the actual `eslint-contract.json` schema and validate it against every ESLint rule's data needs
3. Prototype the generator extension — can it parse `tokens.css` `@theme` blocks reliably?
4. Identify which 3-5 ESLint rules to migrate first (highest drift risk → highest value)
5. Decide on the `token-map.mjs` transition strategy

---

## Loop 2 — 2026-03-22

### What we learned

**Local repo (Cartographer):**
- Complete rule→data dependency map: 14 rules total, only 7 need contract data, 5 have zero RDNA-specific data
- `token-map.mjs` exports 5 values consumed by 4 rules directly
- 5 additional hardcoded data sources need extraction: `SEMANTIC_COLOR_SUFFIXES` (23 entries), `SHADOW_MIGRATION` (9 entries), `PIXEL_CORNER_RE` (duplicated in 2 rules), extra `PRIMITIVE_COLOR_SUFFIXES` (3 entries), `themeVariants` (8 entries)
- Motion token naming discrepancy: `ease-standard` vs `easing-default` (CSS var vs Tailwind utility)

**Contract shape (Synthesizer):**
- Complete `eslint-contract.json` interface drafted: ~8 top-level keys covering all rule data needs
- `tokenMap` (5 sub-keys), `componentMap`, `pixelCorners` (2 sub-keys), `themeVariants`, `motion` (4 sub-keys), `shadows` (3 sub-keys), `typography` (1 sub-key)
- OQ-2 resolved: thin re-export via `createRequire` — zero rule file changes in Phase 1
- 5 gaps found vs Loop 1 synthesis: richer shadow map, `no-mixed-style-authority` doesn't import from token-map, motion naming discrepancy, window-chrome tokens, `textLikeInputTypes` for input qualifier

**External patterns (Guard Rails Scout):**
- Atlassian commits generated token artifacts, consumed as npm dep
- Shopify Polaris uses runtime import (no committed lint data)
- Primer commits source `deprecated.json` + generated dist
- OQ-1 resolved: commit `eslint-contract.json`, extend existing freshness guard

**Risk assessment (Critic):**
- 6 risks identified, 2 genuine regressions over status quo:
  1. Generator becomes lint dependency (crash vs silent-pass if JSON missing)
  2. Split-reader state during migration + degraded rollback path
- 5 mitigations added to recommendation (M-1 through M-5)
- No risk warrants changing the architecture choice — all are mitigatable

### Questions resolved this cycle
- OQ-1 → Commit (evidence: 2/3 industry systems, existing RDNA pattern)
- OQ-2 → Thin re-export via `createRequire` (evidence: Node.js ESM compatibility)
- OQ-3 → System-level default + rule option override (evidence: current rule behavior analysis)

### New questions surfaced
- OQ-8: How should rules handle missing JSON? (leaning: try/catch + fallback)
- OQ-9: Generator conflict detection for duplicate `replaces` (leaning: throw explicit error)
- OQ-10: Ghost meta guard (leaning: freshness check verifies .tsx exists)

### Current leading architecture
**Architecture A: Meta-First Generation** — unchanged, strengthened by mitigations

### Confidence level
**High.** 3 critical questions resolved. 2 genuine regressions found but all mitigatable. No evidence warrants reconsidering the architecture choice.

### Artifacts updated
- `evidence-log.md` — 5 new entries (E-L6 through E-L8, E-X9, E-X10)
- `open-questions.md` — 3 resolved (OQ-1→OQ-R4, OQ-2→OQ-R5, OQ-3→OQ-R6), 3 new (OQ-8, OQ-9, OQ-10)
- `recommendation.md` — 5 mitigations (M-1 through M-5), revised migration phases (+0.5 day), 2 new objection/response pairs
- `candidate-architectures.md` — Critic weaknesses added to Architecture A
- `comparable-systems.md` — commit-vs-generate comparison table added
- `scorecard.md` — no score changes (risks are mitigatable, not architectural)

### Next-step questions for Loop 3
1. Draft the concrete `eslint-contract.json` example (actual JSON, not just interface) with real RDNA data
2. Identify first 3-5 rules to migrate (highest drift risk → highest value)
3. Resolve OQ-8 (missing JSON handling) with a concrete code pattern
4. Validate the `createRequire` re-export pattern works with RDNA's existing ESLint setup

---

## Loop 3 — 2026-03-22

### What we learned

**Contract shape (Synthesizer):**
- Complete concrete `eslint-contract.json` drafted with ALL real RDNA values — every value traced to source file and line number
- 10 top-level keys: `tokenMap`, `componentMap`, `pixelCorners`, `themeVariants`, `motion`, `shadows`, `typography`, `textLikeInputTypes`
- `triggerPattern` regex included alongside `triggerClasses` array for backward compat
- `shadowMigrationMap` has 9 entries (richer than Loop 1 synthesis proposed — includes glow tokens with free-text suggestions)
- Typography section includes `validWeights` (4 entries) not in original interface

**Migration order (Cartographer):**
- Rules ranked 1-7 by drift risk × blast radius
- Top 3 for first batch: `no-hardcoded-colors` (active false positives + broken autofix), `prefer-rdna-components` (5/39 gap), `no-removed-aliases` (simplest, potentially stale)
- `no-clipped-shadow` + `no-pixel-border` bundled as batch 2 (shared `PIXEL_CORNER_RE`)
- `no-mixed-style-authority` and `no-hardcoded-motion` last (low/zero drift risk)
- `no-hardcoded-colors` has TWO active bugs: stale suffix allowlist AND wrong autofix suggestions (oklch maps use full-form names, Tailwind uses short-form)

**Pattern validation (Critic):**
- `createRequire` pattern PASSES all 5 checks against RDNA's ESLint setup
- Key finding: all 14 rules are eagerly loaded via static `import` in `index.mjs` — a top-level crash in `token-map.mjs` kills ALL rules, making `try/catch` mandatory not optional
- Catch block should be narrowed to `MODULE_NOT_FOUND` + `SyntaxError` only — re-throw unexpected errors
- `console.warn` fires once per ESLint worker process (noisy in Turbo parallel but not harmful)

### Questions resolved this cycle
- OQ-8 → try/catch with narrowed error handler (evidence: 5-point validation in E-L10)

### New questions surfaced
- None — remaining questions (OQ-9, OQ-10) are implementation-time decisions that don't change the architecture

### Current leading architecture
**Architecture A: Meta-First Generation** — stable for 2 consecutive cycles

### Confidence level
**High → Very High.** Contract shape is now concrete (not just an interface). Migration order is ranked. `createRequire` pattern validated. All critical implementation questions (OQ-1 through OQ-3, OQ-8) resolved. Remaining open questions (OQ-9, OQ-10) are implementation details.

### Strongest objections still standing
1. Generator-as-bottleneck is a genuine regression — mitigated by M-3 (try/catch) and committed JSON
2. Split-reader state during migration — mitigated by M-2 (frozen token-map.mjs)
3. Distributed enforcement (42 meta files vs 1 centralized map) is a deliberate tradeoff

### Artifacts updated
- `evidence-log.md` — 4 new entries (E-L10 through E-L13)
- `open-questions.md` — OQ-8 resolved (→ OQ-R7), duplicate OQ-9 fixed
- `recommendation.md` — M-3 refined with narrowed catch, migration order added, concrete JSON dimensions documented

### Assessment: approaching stopping criteria
Architecture A has been stable for 2 consecutive cycles (Loop 2 and Loop 3) without major new objections. All critical questions are resolved. Remaining open questions (OQ-4 through OQ-7, OQ-9, OQ-10) are either deferred decisions or implementation-time details. The recommendation could reasonably stop here.

### Next-step questions for Loop 4 (if needed)
1. Should we write the concrete `eslint-contract.json` to `packages/radiants/generated/` as a reference artifact?
2. Draft the thin `token-map.mjs` re-export wrapper (the actual code, not just the pattern)
3. Final review: is the recommendation document complete enough to hand off to implementation?

---

## Loop 4 — 2026-03-22 (FINAL)

### What we produced

**Reference artifacts written to `archive/research/design-guard/reference/`:**
- `eslint-contract.json` — complete JSON with all real RDNA values, every entry traced to source
- `token-map-wrapper.mjs` — thin re-export via `createRequire` with narrowed try/catch and inline fallbacks

These are reference implementations ready to be copied to their production locations (`packages/radiants/generated/` and `packages/radiants/eslint/`) when implementation begins.

### Stopping criteria assessment

**STOP. Research is complete.**

1. Architecture A has been stable for **3 consecutive cycles** (Loops 2, 3, 4) without any architecture-level objections
2. All **4 critical questions** resolved (OQ-1 through OQ-3, OQ-8)
3. **5 mitigations** identified and designed (M-1 through M-5)
4. Concrete **contract JSON** and **wrapper code** drafted with every value source-traced
5. **Migration order** ranked with rationale
6. Remaining open questions (OQ-4 through OQ-7, OQ-9, OQ-10) are either deferred decisions or implementation-time details

### Final state

| Dimension | Status |
|-----------|--------|
| Leading architecture | Architecture A: Meta-First Generation |
| Confidence | Very High |
| Scorecard | 154/200 (unchanged since Loop 1) |
| Critical questions | 0 remaining |
| Important questions | 6 remaining (all deferred or implementation-time) |
| Migration effort | ~9 days (5 phases) |
| Reference artifacts | 2 (contract JSON + wrapper) |
| Research artifacts | 7 core + 2 reference |
| External systems analyzed | 11+ |
| Evidence entries | 13 local + 10 external |

### What's needed to start implementation
1. Create `packages/radiants/generated/` directory
2. Copy `eslint-contract.json` from reference
3. Replace `token-map.mjs` with the wrapper
4. Extend `check-registry-freshness.mjs` to cover `eslint-contract.json` (M-1)
5. Migrate rules in order: `no-hardcoded-colors` → `prefer-rdna-components` → `no-removed-aliases` → `no-clipped-shadow`+`no-pixel-border` → `no-mixed-style-authority` → `no-hardcoded-motion`
