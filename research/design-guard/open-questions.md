# Open Questions

**Last updated:** 2026-03-22 | **Loop:** 1

## Critical (blocks implementation decisions)

### OQ-1: Build ordering — can CI guarantee `eslint-contract.json` exists before lint?
- **Context:** Architecture A requires generated JSON before `pnpm lint:design-system` runs
- **Options:** (a) Commit generated files (like `registry.manifest.json` today), (b) generate on-the-fly at lint startup, (c) CI pipeline ordering
- **Leaning:** (a) — commit the generated file, use freshness guard (already exists for registry)
- **Impact if wrong:** Rules silently use stale data or fail to load

### OQ-2: Should `token-map.mjs` become a thin re-export or be deleted?
- **Context:** Rules currently `import { brandPalette } from '../token-map.mjs'`. Switching to JSON needs either `--experimental-json-modules`, import assertions, or a wrapper.
- **Synthesizer proposal:** Keep as thin re-export using `createRequire` to read JSON
- **Impact:** Determines migration complexity for 9+ rule files

### OQ-3: Per-component vs system-level `styleOwnership` — how to aggregate?
- **Context:** `themeVariants` is currently a flat system-level list. Some components have unique theme-owned values.
- **Synthesizer proposal:** Both — system contract holds baseline, components declare their subset, lint checks the union
- **Impact:** Determines whether `no-mixed-style-authority` reads one source or two

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

## Resolved in Loop 1

### OQ-R1: Is Architecture A or C the right choice?
- **Answer:** A. The 6-point gap in C's favor is entirely theoretical. A dominates on pragmatic criteria by 62%. External research confirms A's pattern (Atlassian) and validates RDNA's existing meta format as industry-leading.

### OQ-R2: Should CSS scanning be primary or verification?
- **Answer:** Verification. CSS shows implementation, not intent. Intent belongs in metadata. All evidence supports contract-first over CSS-scrape-first.

### OQ-R3: Is the context-aware hex→semantic mapping worth preserving manually?
- **Answer:** Yes. No other system has this. Hybrid approach (generated values + manual context maps) is correct. The Tokens & Primitives Scout confirmed this is unique.
