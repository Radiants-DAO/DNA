# Production Readiness Audit Swarm Prompt

```text
You are running a read-only audit swarm for the DNA monorepo.

Mission:
Stress-test the current production-readiness backlog, find missing bugs/options, and improve task classification before execution loops begin.

Source of truth:
- docs/production-readiness-checklist.md
- docs/production-readiness-execution-track.md
- docs/production-readiness-research-track.md
- docs/production-readiness-mixed-track.md

Important rule:
This is a read-only exploration and review pass.
Do not implement fixes in this swarm.
Do not edit application code.
The only allowed outputs are findings, backlog corrections, and recommendations for future execution batches.

Goal:
1. find stale checklist statuses
2. find missing checklist items
3. find wrongly classified items
4. find hidden dependency chains between items
5. find bugs or drift that are not yet represented
6. improve the next execution batches
7. identify highest-leverage refactor opportunities that unlock multiple checklist items at once

Team structure:
Spawn a swarm of 6 bounded subagents.
Each subagent must work in a separate worktree if needed, stay read-only, and return a compact findings summary.
Do not paste full transcripts into the parent thread unless necessary.

Spawn these 6 roles:

1. Checklist Auditor
   Goal:
   Compare the current checklist and derived track files against the repo.
   Look for stale statuses, missing notes, duplicate items, and misclassified items.
   Deliverable:
   checklist corrections, missing backlog items, reclassification suggestions.

2. Dead Code Hunter
   Goal:
   Search for unused files, dead exports, broken imports, orphaned registry/meta entries, stale logs, and obvious cleanup items not yet captured.
   Deliverable:
   cleanup findings with file references and estimated fix size.

3. Behavior Bug Hunter
   Goal:
   Search for state bugs, persistence bugs, pointer/touch issues, event mismatches, runtime hacks, data flow inconsistencies, and brittle logic.
   Deliverable:
   behavioral findings, severity, and likely verification requirements.

4. UI Polish Auditor
   Goal:
   Review T1/T2/T3 surfaces for visible bugs, inconsistency clusters, shared-primitive opportunities, and likely embarrassment risks.
   Deliverable:
   UI findings grouped by component/system, with likely batching suggestions.

5. Tooling Drift Auditor
   Goal:
   Inspect lint/test/registry/docs drift, missing tests, handwritten maps, stale generated artifacts, and weak guard coverage.
   Deliverable:
   tooling findings plus whether each belongs in execution or research.

6. Boundary Auditor
   Goal:
   Identify items that look executable but are actually architecture decisions, and items that look architectural but are actually implementation-ready.
   Deliverable:
   reclassification recommendations with rationale.

Swarm rules:
- Read-only only
- Prefer exact file refs and grep/read evidence
- Prefer primary local evidence over speculation
- Do not suggest broad rewrites without pointing to the concrete triggering evidence
- Avoid duplicating other agents’ likely work

Additional objective:
Each subagent should also look for highest-leverage refactor opportunities:
- changes that unlock multiple checklist items at once
- shared primitives that would remove repeated bug classes
- ownership or boundary fixes that reduce future drift
- cleanup tasks that simplify later UI/mobile/tooling work

For each refactor opportunity, report:
- Opportunity
- What it would unlock
- Files/systems involved
- Risk
- Estimated payoff
- Track: execution / research / mixed

Required output format for every finding:
- Finding
- Evidence
- File refs
- Severity: low / medium / high
- Confidence: low / medium / high
- Likely fix size: small / medium / large
- Track: execution / research / mixed
- Blocked by product or architecture decision?: yes / no

Aggregation steps:
1. Spawn the 6-agent swarm
2. Aggregate all findings into one coherent backlog review
3. Immediately call /compound-knowledge after aggregation
4. Update the checklist views only after aggregation is complete
5. Produce a recommended next batch order

Expected parent-thread synthesis:
- stale checklist items
- newly discovered backlog items
- reclassification recommendations
- dependency chains between items
- top leverage refactors and what they unlock
- best next execution batches
- best next research questions

Success condition:
The swarm does not implement anything.
It returns a sharper, more accurate backlog and a better execution order than what existed before.

Required final output:
- top 10 findings
- checklist items that should change track
- newly discovered missing items
- top leverage refactors and the checklist items each would unlock
- recommended first 3 execution batches
- recommended first 3 research questions
```
