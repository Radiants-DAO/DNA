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
- `research/design-guard/scorecard.md` — weighted scoring of 4 architectures
- `research/design-guard/open-questions.md` — 7 open + 3 resolved
- `research/design-guard/evidence-log.md` — 8 local + 8 external evidence entries
- `research/design-guard/comparable-systems.md` — 11+ systems in 3 tiers
- `research/design-guard/candidate-architectures.md` — 4 candidates with rejection rationale
- `research/design-guard/recommendation.md` — Architecture A with migration plan
- `research/design-guard/loop-log.md` — this file
- `docs/research/design-contract-synthesis.md` — full contract TypeScript interfaces
- `docs/research/guard-rails-scout-report.md` — enforcement patterns
- `docs/research/token-primitives-scout-report.md` — token pipeline patterns

### Next-step questions for Loop 2
1. Review the proposed `ComponentContractMeta` and `DesignSystemContract` TypeScript interfaces — are the field names and types right?
2. Draft the actual `eslint-contract.json` schema and validate it against every ESLint rule's data needs
3. Prototype the generator extension — can it parse `tokens.css` `@theme` blocks reliably?
4. Identify which 3-5 ESLint rules to migrate first (highest drift risk → highest value)
5. Decide on the `token-map.mjs` transition strategy
