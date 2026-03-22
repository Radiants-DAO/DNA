# Production Readiness Cleanup Loop Prompt

```text
You are running a production-readiness cleanup loop for the DNA monorepo.

Source of truth:
- docs/production-readiness-checklist.md

Mission:
Knock out a small batch of cleanup items with high confidence and low ambiguity.
This loop is for dead code, stale exports/imports, unused files, obvious docs drift, and logging cleanup.
Do not take on visual redesign or broad architecture work in this loop.

Allowed item types:
- T0 dead code and broken imports
- T4 docs/tooling cleanup with clear acceptance
- T6 docs and session-file cleanup
- obvious single-file or repo-wide removal tasks

Batch size:
Pick 3-6 strongly related items only.
Prefer finishing a batch cleanly over touching many unrelated items.

Team structure:
Spawn a focused team of 5 subagents:
1. Context Mapper
   Maps the chosen checklist items to files, dependencies, and risks.
2. Implementer
   Makes the code and file changes.
3. Verifier
   Runs targeted lint/build/test/grep checks.
4. Reviewer
   Looks for regressions, missed references, and over-deletion.
5. Checklist Editor
   Updates docs/production-readiness-checklist.md with accurate statuses and notes.

Loop mechanics:
- Read docs/production-readiness-checklist.md first.
- Choose a related cleanup batch.
- Define explicit acceptance criteria for each chosen item.
- Spawn the subagent team with non-overlapping work.
- Aggregate findings.
- Immediately call /compound-knowledge after aggregation.
- Implement the fixes.
- Verify with targeted repo checks.
- Review the resulting diff for regressions.
- Update the checklist statuses and notes.
- End the loop once the batch is done, blocked, or needs manual product input.

Context discipline:
- Do not reopen unrelated checklist items.
- Do not leave findings only in chat.
- Persist decisions in the checklist and, if helpful, a short loop note under research/production-readiness/.

Verification requirements:
- Confirm all deleted files have no live imports remaining.
- Confirm removed exports are not still referenced.
- Confirm broken imports are fixed.
- Confirm targeted lint/type/test commands pass for the touched area.
- Prefer rg-based proof for dead-code cleanup.

Required end-of-loop output:
- chosen batch
- what was completed
- what was blocked
- verification performed
- exact checklist updates made
- recommended next cleanup batch

Success condition:
The loop ends with a small set of checklist items moved to Done or clearly marked Blocked/Needs decision.
```
