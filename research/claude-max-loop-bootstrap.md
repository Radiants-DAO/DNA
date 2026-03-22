# Claude Max Loop Bootstrap Prompt

```text
You are starting a fresh iterative architecture-research loop for the DNA monorepo.

Mission:
Determine the best defensible architecture for making RDNA’s machine-readable design contract the single source of truth for:
1. registry generation
2. design guards / lint rules
3. AI-facing artifacts
4. future reuse across non-RDNA design systems

Context:
This is not just a lint cleanup task.
This research supports two related products:
- RDNA: the reusable design system and prototype for an AI-ready design production system
- RadOS: a consuming application that uses RDNA and should enforce RDNA rules cleanly

Current architectural problem:
Today, registry generation is partly canonical, but lint/design guards still rely on hand-maintained config and maps.
The goal is to design a contract-first system where authored component/system metadata can generate registry + enforcement together.

Local repo files to inspect first:
- eslint.rdna.config.mjs
- packages/radiants/eslint/token-map.mjs
- packages/preview/src/types.ts
- tools/playground/scripts/generate-registry.ts
- tools/playground/scripts/check-registry-freshness.mjs
- packages/radiants/DESIGN.md

Suggested external starting points:
These are seed examples, not prescriptive answers. Use them as initial comparables and replace them if stronger evidence appears.

- Adobe Spectrum Design Data
  - https://opensource.adobe.com/spectrum-design-data/
  - https://github.com/adobe/spectrum-design-data
  Why inspect:
  likely closest to contract/registry/API/AI-facing design-data architecture

- Atlassian Design System ESLint plugin
  - https://atlassian.design/components/eslint-plugin-design-system/
  Why inspect:
  strong example of design-system-specific guard rails and enforcement patterns

- Shopify Polaris Stylelint
  - https://polaris-react.shopify.com/tools/stylelint-polaris
  - https://github.com/Shopify/polaris
  Why inspect:
  strong example of consumer enforcement and system adoption rules

- Primer React / Primer Primitives
  - https://primer.style/product/getting-started/react/linting/
  - https://github.com/primer/react
  - https://github.com/primer/primitives
  Why inspect:
  useful token-package plus component-enforcement split

- Carbon token enforcement
  - https://github.com/carbon-design-system/stylelint-plugin-carbon-tokens
  Why inspect:
  token-enforcement architecture and rule design

- Kong design-tokens
  - https://github.com/Kong/design-tokens
  Why inspect:
  token package with stylelint/tooling in one repo

Seed-example rule:
Treat the listed systems as initial comparables only.
Do not assume they are the best fit for RDNA.
You may replace them with stronger examples if the evidence supports it.

Team structure:
You are the coordinator and editor.
Immediately spawn a team of 6 focused subagents with non-overlapping roles.
Each subagent must return concrete findings with sources, not vague summaries.
Do not paste full subagent transcripts into the main thread unless necessary.

Spawn these 6 roles:
1. Local Repo Cartographer
   Goal:
   map the current RDNA/RadOS architecture, identify drift surfaces, and list missing contract fields in the local repo.
   Focus:
   local files only.
   Deliverable:
   current-state architecture note, drift inventory, missing metadata fields.

2. Design Data Scout
   Goal:
   study systems closest to contract-first design data and AI-facing design infrastructure.
   Focus:
   Adobe Spectrum Design Data and any stronger comparable systems found.
   Deliverable:
   contract patterns, generated artifact patterns, AI-facing artifact patterns.

3. Guard Rails Scout
   Goal:
   study design-system enforcement systems.
   Focus:
   Atlassian ESLint plugin, Shopify Polaris Stylelint, Carbon token enforcement, and similar primary-source examples.
   Deliverable:
   guard-rule architecture patterns, policy-layering patterns, autofix/codemod patterns.

4. Tokens and Primitives Scout
   Goal:
   study systems that separate tokens/primitives/components cleanly and show how enforcement attaches to that split.
   Focus:
   Primer, Kong, and any better primary-source examples.
   Deliverable:
   token pipeline patterns, primitive/component split patterns, maintenance tradeoffs.

5. Contract Synthesizer
   Goal:
   turn local findings plus external patterns into a proposed RDNA contract shape.
   Focus:
   metadata fields, system-level contract fields, generated artifacts, package boundaries.
   Deliverable:
   candidate contract schema and list of fields RDNA is missing today.

6. Comparator and Critic
   Goal:
   build candidate architectures, score them, and attack the leading one.
   Focus:
   tradeoffs, migration cost, overfitting risk, generalization to future client design systems.
   Deliverable:
   candidate architecture comparison, scorecard draft, strongest objections.

Loop mechanics:
- Use the 6-role team as bounded subagents when work can be parallelized.
- Each active subagent must return a compact summary with:
  - findings
  - exact sources
  - implications
  - unresolved questions
- Persist useful findings to research/design-guard/ immediately so progress compounds through files, not chat memory.

Context discipline:
- Treat research/design-guard/ files as the canonical working memory.
- At the start of every loop, reread the artifact files before doing new work.
- After any compaction or long session gap, rebuild state from the artifact files instead of relying on memory.
- Prefer updating the artifacts over repeating previous reasoning in chat.

Research rules:
- Prefer official repos, source code, and official docs
- Distinguish observed fact from inference
- Prefer contract-first architecture over CSS-scrape-first architecture
- Treat CSS scanning as verification unless evidence strongly supports making it primary
- Focus on architectures that generalize beyond pixel-art systems
- Avoid duplicate work across subagents
- Require exact repo/file/doc links where possible

Artifacts to create and maintain:
- research/design-guard/scorecard.md
- research/design-guard/open-questions.md
- research/design-guard/evidence-log.md
- research/design-guard/comparable-systems.md
- research/design-guard/candidate-architectures.md
- research/design-guard/recommendation.md
- research/design-guard/loop-log.md

Evaluation criteria:
Score candidate architectures against:
- single source of truth
- generates registry and guards from same contract
- separates design-system facts from app-level policy
- supports AI-facing outputs
- minimizes manual drift surfaces
- works for RDNA now
- generalizes later to other design systems
- reasonable migration cost from current repo
- low maintenance burden
- configurable enforcement strictness

Required evidence format:
For each important claim, record:
- Observation
- Source
- Why it matters
- Confidence
- Implication for RDNA

Your first-run responsibilities:
1. Build the initial research workspace under research/design-guard/
2. Read the local repo context above
3. Spawn the 6-subagent team immediately
4. Aggregate the returned findings
5. Immediately call `/compound-knowledge` after aggregation so the research state is compressed into durable reusable knowledge before further synthesis
6. Identify the current drift surfaces and missing contract fields
7. Distill what patterns are relevant
8. Propose initial candidate architectures
9. Create a first recommendation, even if provisional

Required first-run outputs:
- a populated scorecard
- an initial list of comparable systems
- at least 2-4 candidate architectures
- a provisional leading recommendation
- a reduced set of open questions for the next loop

At the end of this first run, output:
- what you learned
- current leading architecture
- confidence level
- biggest unresolved questions
- exact next-step questions for the continuation loop
```
