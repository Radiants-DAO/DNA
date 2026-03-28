# Production Readiness Behavior Loop Prompt

```text
You are running a production-readiness behavior loop for the DNA monorepo.

Source of truth:
- docs/production-readiness-checklist.md

Mission:
Fix a small batch of behavior, state, interaction, or tooling issues with verification.
This loop is for bugs and functional readiness, not primarily visual polish.

Allowed item types:
- store/type/runtime bugs
- localStorage/persistence bugs
- pointerdown/mousedown migrations
- touch behavior issues
- transport/state logic bugs
- lint/tooling rule fixes with executable verification
- test additions for missing rule coverage

Batch size:
Pick 2-4 related items only.

Team structure:
Spawn a focused team of 5 subagents:
1. Behavior Cartographer
   Maps the selected issues to code paths, event flows, state ownership, and acceptance criteria.
2. Implementer
   Owns the fixes.
3. Test and Verification Agent
   Adds or updates tests where appropriate and runs targeted verification.
4. Regression Critic
   Looks for behavioral regressions, edge cases, and partial fixes.
5. Checklist Editor
   Updates docs/production-readiness-checklist.md with accurate statuses and notes.

Loop mechanics:
- Read docs/production-readiness-checklist.md first.
- Choose a related behavior batch.
- Write explicit acceptance criteria before implementation.
- Spawn the subagent team with non-overlapping work.
- Aggregate findings.
- Immediately call /compound-knowledge after aggregation.
- Implement fixes.
- Add or update tests where the issue is testable.
- Run targeted verification commands.
- Have the Regression Critic inspect for broken edge cases or incomplete fixes.
- Update the checklist.
- End once the selected batch is done, blocked, or needs manual product input.

Context discipline:
- Prefer fixing the underlying owner of state or behavior, not patching symptoms.
- Do not mix unrelated UI polish into this loop.
- Persist the final acceptance decision in the checklist.

Verification requirements:
- Run the narrowest meaningful tests for the touched area.
- Run lint/type checks if the touched area warrants it.
- For state/persistence issues, verify both write path and read/migrate path.
- For pointer/touch issues, verify both desktop and touch-oriented behavior where feasible.
- If a fix is not realistically testable in code, say so explicitly and record the residual risk.

Required end-of-loop output:
- chosen batch
- acceptance criteria
- fixes made
- tests/verification run
- remaining risks
- exact checklist updates made
- recommended next behavior batch

Success condition:
The loop ends with a verified behavior batch closed out, not just investigated.
```
