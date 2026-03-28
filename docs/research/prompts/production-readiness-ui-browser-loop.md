# Production Readiness UI / Browser Loop Prompt

```text
You are running a production-readiness UI/browser loop for the DNA monorepo.

Source of truth:
- docs/production-readiness-checklist.md

Mission:
Fix a small batch of visual, component, responsive, or interaction-polish issues and verify them with browser-based checks.
This loop is for component quality, mobile polish, and app-content presentation.

Allowed item types:
- T1 component visual quality
- T2 mobile/touch UI behavior that needs live interaction checks
- T3 app-content polish with visible UX outcomes
- component consolidation where user-facing behavior must be visually validated

Batch size:
Pick 1-3 related UI items only.
Do not take on a giant cross-system redesign in one loop.

Team structure:
Spawn a focused team of 5 subagents:
1. UI Context Mapper
   Maps the selected UI issues to components, routes/screens, states, and acceptance criteria.
2. Implementer
   Makes the component and styling changes.
3. Browser Verifier
   Uses browser-based checks, screenshots, and interaction smoke tests on desktop and mobile-sized layouts.
4. UI Reviewer
   Looks for regressions, inconsistent states, and rough edges after the implementation.
5. Checklist Editor
   Updates docs/production-readiness-checklist.md with accurate statuses and notes.

Loop mechanics:
- Read docs/production-readiness-checklist.md first.
- Choose a related UI batch.
- Define explicit visual/interaction acceptance criteria.
- Spawn the subagent team with non-overlapping work.
- Aggregate findings.
- Immediately call /compound-knowledge after aggregation.
- Implement the fixes.
- Run browser-based smoke checks.
- Check desktop and mobile-sized layouts where relevant.
- Have the UI Reviewer inspect for regressions and polish gaps.
- Update the checklist.
- End once the selected UI batch is done, blocked, or requires human product judgment.

Context discipline:
- Prefer shared primitives and consistent component behavior over one-off visual patches.
- Do not mark a UI item done without at least one live verification pass.
- Record residual manual-check items explicitly if they remain.

Browser verification requirements:
- Verify the exact changed states, not just page load.
- Check the most relevant interaction path for each item.
- Capture concise evidence in notes: what was checked, what passed, what remains questionable.
- For mobile-related items, check at least one narrow viewport and one desktop viewport.
- If browser verification is not possible for a specific item, say why and downgrade confidence.

Required end-of-loop output:
- chosen UI batch
- acceptance criteria
- components/screens changed
- browser checks performed
- regressions found or ruled out
- exact checklist updates made
- recommended next UI batch

Success condition:
The loop ends with a visually verified batch closed out or explicitly blocked by a product/design decision.
```
