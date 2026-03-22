# Open Questions

**Last updated:** 2026-03-22 | **Loop:** 2

## Critical (blocks implementation decisions)

### OQ-8: How should rules handle missing `eslint-contract.json`? (NEW — Loop 2)
- **Context:** If `eslint-contract.json` is absent (fresh clone before generation, deleted branch), ESLint crashes with `ENOENT`. Current `no-mixed-style-authority` fails open (returns `{}`). Architecture A changes this to a crash.
- **Options:** (a) try/catch with empty fallback + stderr warning, (b) require JSON as precondition (postinstall hook), (c) ship a minimal committed baseline that's never stale
- **Leaning:** (a) — matches current silent-fail behavior, warning surfaces the issue without blocking dev
- **Impact:** Determines whether Architecture A regresses the developer experience

### OQ-9: Generator conflict detection — how to handle duplicate `replaces` entries? (NEW — Loop 2)
- **Context:** If `Input.meta.ts` and `TextArea.meta.ts` both declare `replaces: [{ element: 'textarea' }]`, generator must resolve. No conflict detection described in Architecture A.
- **Options:** (a) Generator throws explicit error, (b) last-write-wins with warning, (c) allow multiple with qualifier
- **Leaning:** (a) — fail loudly, make the conflict visible immediately
- **Impact:** Prevents silent enforcement of wrong component

## Important (shapes design but doesn't block Phase 1)

### OQ-4: Is a second design system actually planned for 2026 H2?
- **Context:** If yes, Architecture C's portability becomes more valuable. If no, A is clearly right.
- **Current answer:** Unknown. A can be extended to C-like portability in ~2 weeks if needed.
- **Impact:** Would change relative weighting of "generalizes later" criterion

### OQ-5: Should RDNA add UUID-based entity tracking?
- **Context:** Adobe uses UUIDs on every token for rename-safe tracking and diff generation
- **Tradeoff:** Adds a field to every meta file and token; enables reliable migration tooling
- **Impact:** Not needed for Phase 1 but affects long-term contract evolution

### OQ-6: Should RDNA build an MCP server from contract data?
- **Context:** Adobe has 2 MCP servers. Storybook has 1. Both prove the pattern.
- **Tradeoff:** Valuable for AI integration but separate project from the contract architecture
- **Impact:** Deferred — build the contract first, MCP server consumes it later

### OQ-7: How deep should the `a11y` contract field go?
- **Context:** Synthesizer proposed role + required attributes + keyboard interactions
- **Options:** (a) Minimal (role only), (b) Medium (role + attributes + keyboard), (c) Full WAI-ARIA APG
- **Leaning:** (b) — enough for AI agents to generate correct markup
- **Impact:** Affects authoring effort per component (~3 lines vs ~10 lines)

### OQ-10: Ghost meta guard — how to detect orphaned `.meta.ts` files? (NEW — Loop 2)
- **Context:** If a component `.tsx` is deleted but `.meta.ts` persists, generator produces contract entries for nonexistent components. `prefer-rdna-components` suggests imports that don't resolve.
- **Proposal:** Freshness check verifies every `*.meta.ts` with `replaces` has a corresponding `*.tsx`
- **Impact:** Low probability but confusing failure mode; easy to implement

## Resolved in Loop 1

### OQ-R1: Is Architecture A or C the right choice?
- **Answer:** A. The 6-point gap in C's favor is entirely theoretical. A dominates on pragmatic criteria by 62%. External research confirms A's pattern (Atlassian) and validates RDNA's existing meta format as industry-leading.

### OQ-R2: Should CSS scanning be primary or verification?
- **Answer:** Verification. CSS shows implementation, not intent. Intent belongs in metadata. All evidence supports contract-first over CSS-scrape-first.

### OQ-R3: Is the context-aware hex→semantic mapping worth preserving manually?
- **Answer:** Yes. No other system has this. Hybrid approach (generated values + manual context maps) is correct. The Tokens & Primitives Scout confirmed this is unique.

## Resolved in Loop 2

### OQ-R4: Build ordering — commit or generate-on-the-fly? (was OQ-1)
- **Answer:** Commit. 2/3 industry systems (Atlassian, Primer) commit generated lint data. RDNA already commits `registry.manifest.json` with a git-diff freshness guard. Add `eslint-contract.json` to the same `CHECKED_PATHS` in `check-registry-freshness.mjs`. Zero-cost read at lint time vs startup latency for on-the-fly.
- **Evidence:** E-X9

### OQ-R5: Should `token-map.mjs` become a thin re-export or be deleted? (was OQ-2)
- **Answer:** Thin re-export via `createRequire(import.meta.url)`. This achieves zero rule file changes in Phase 1. `import { brandPalette } from '../token-map.mjs'` continues to work — the file just reads from JSON internally instead of defining values inline. New contract-only exports (e.g., `semanticColorSuffixes`) are added as new named exports for Phase 3 rule migrations.
- **Evidence:** E-X10, Contract Synthesizer analysis

### OQ-R6: Per-component vs system-level `styleOwnership`? (was OQ-3)
- **Answer:** System-level `themeVariants` in contract JSON as the default source. `no-mixed-style-authority` rule option remains as an override for per-repo customization. Per-component `styleOwnership` in meta files is Phase 2+ — generator aggregates the union into the contract's `themeVariants` array. The rule's existing safe failure mode (empty set → no-op) is preserved.
- **Evidence:** E-L7, Critic's Risk 5 analysis
