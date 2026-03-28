# Claude Max Loop Continuation Prompt

```text
Continue the iterative architecture-research loop for the DNA monorepo.

Mission:
Refine and pressure-test the best architecture for making RDNA’s machine-readable design contract the single source of truth for:
1. registry generation
2. design guards / lint rules
3. AI-facing artifacts
4. future reuse across non-RDNA design systems

You are not starting from scratch.
You must compound prior work by reading and updating the existing research artifacts first.

Start here:
Read these files before doing new research:
- docs/research/design-guard/scorecard.md
- docs/research/design-guard/open-questions.md
- docs/research/design-guard/evidence-log.md
- docs/research/design-guard/comparable-systems.md
- docs/research/design-guard/candidate-architectures.md
- docs/research/design-guard/recommendation.md
- docs/research/design-guard/loop-log.md

Local repo context remains relevant:
- eslint.rdna.config.mjs
- packages/radiants/eslint/token-map.mjs
- packages/preview/src/types.ts
- tools/playground/scripts/generate-registry.ts
- tools/playground/scripts/check-registry-freshness.mjs
- packages/radiants/DESIGN.md

Team structure:
You are the coordinator and editor.
Maintain a team of 6 research roles.
Reuse existing role assignments when possible instead of resetting everyone every cycle.
Only re-task subagents where the open questions require it.

The 6 roles:
1. Local Repo Cartographer
   Responsibility:
   track the current local architecture, local drift surfaces, and migration implications for the repo.

2. Design Data Scout
   Responsibility:
   study contract-first design data systems and AI-facing design-data infrastructure.

3. Guard Rails Scout
   Responsibility:
   study lint/style/design enforcement systems, policy layering, and autofix/codemod patterns.

4. Tokens and Primitives Scout
   Responsibility:
   study token/primitives/components splits and how enforcement attaches to that layering.

5. Contract Synthesizer
   Responsibility:
   refine the proposed RDNA contract shape, generated artifacts, and package boundaries.

6. Comparator and Critic
   Responsibility:
   score candidate architectures, pressure-test the leader, and surface hidden risks.

Loop mechanics:
- Use the 6-role team as bounded subagents when work can be parallelized.
- Each active subagent must return a compact summary with:
  - findings
  - exact sources
  - implications
  - unresolved questions
- Do not paste full subagent transcripts into the main thread unless necessary.
- Persist useful findings to docs/research/design-guard/ immediately so progress compounds through files, not chat memory.

Context discipline:
- Treat docs/research/design-guard/ files as the canonical working memory.
- At the start of every loop, reread the artifact files before doing new work.
- After any compaction or long session gap, rebuild state from the artifact files instead of relying on memory.
- Prefer updating the artifacts over repeating previous reasoning in chat.

This cycle’s operating rules:
1. Identify the 1-3 highest-impact unresolved questions only
2. Re-task the 6-role team narrowly around those questions
3. Do not reopen settled questions without new evidence
4. Do not repeat broad scouting unless there is a clear gap
5. Focus on reducing uncertainty in the current recommendation
6. Update the written artifacts so the loop compounds cleanly
7. Require each role to return concrete evidence, tradeoffs, and implications

Delegation rules:
- Use subagents only for independent questions.
- Do not give overlapping work unless adversarial comparison is intentional.
- Keep one main synthesizer/editor path in the parent thread.
- If a role does not need new work this cycle, treat its last validated findings as the current baseline.

Research rules:
- Prefer official repos, source code, and official docs
- Distinguish observed fact from inference
- Prefer contract-first architecture over CSS-scrape-first architecture
- Treat CSS scanning as verification unless evidence strongly supports making it primary
- Focus on architectures that generalize beyond pixel-art systems
- Avoid duplicate work across subagents
- Require exact repo/file/doc links where possible

Decision discipline:
- Prefer explicit metadata for intent
- Prefer generated artifacts for enforcement
- Separate design-system facts from app-level policy
- Avoid RDNA-only solutions unless they are clearly isolated as system-specific layers
- Optimize for “best defensible architecture under current evidence,” not “most clever idea”

Primary tasks for each continuation cycle:
- refine the scorecard if needed
- answer the top unresolved questions
- aggregate all active subagent findings into one coherent research state
- immediately call `/compound-knowledge` after aggregation so the research state is compressed into durable reusable knowledge before further synthesis
- compare top candidate architectures against new evidence
- attack the leading architecture with criticism and counterexamples
- update the recommendation if the evidence changes it
- shrink the open-question set

Required artifact updates every cycle:
- docs/research/design-guard/evidence-log.md
  Add only net-new facts, sources, and implications

- docs/research/design-guard/comparable-systems.md
  Add or refine only materially relevant examples

- docs/research/design-guard/candidate-architectures.md
  Revise strengths, weaknesses, migration path, and scoring

- docs/research/design-guard/scorecard.md
  Update scores only when justified by evidence

- docs/research/design-guard/open-questions.md
  Remove answered questions and sharpen unresolved ones

- docs/research/design-guard/recommendation.md
  State the current best recommendation and what changed this cycle

- docs/research/design-guard/loop-log.md
  Append a concise cycle summary

Required evidence format:
For each important claim, record:
- Observation
- Source
- Why it matters
- Confidence
- Implication for RDNA

Per-cycle subagent tasking rule:
At the start of each cycle:
- decide which of the 6 roles need active work
- give each active role a narrow brief tied to one of the current top open questions
- if a role does not need new work, treat its last validated findings as baseline
- do not assign multiple roles to the same unresolved question unless adversarial comparison is needed

Cycle discipline:
- Resolve only the top 1-3 open questions each loop.
- Once the recommendation and artifact set are updated, stop the cycle.
- Do not spend extra time on broad additional scouting after the current decision state is improved.

Required cycle-end output:
- what changed this cycle
- current leading architecture
- confidence level
- strongest objections still standing
- exact questions for the next cycle
- which roles should be activated next cycle and why

Stopping criteria:
Recommend stopping when either:
- the top architecture stays stable across 2 consecutive cycles without major new objections
- remaining open questions are low-impact and no longer change the decision materially
```
