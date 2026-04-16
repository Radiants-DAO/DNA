# Monorepo Cleanup Orchestration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Run a monorepo cleanup pass with parallel agents without causing overlapping edits, premature abstractions, or stale-state decisions.

**Architecture:** Two-stage workflow. Stage 1 is read-only reconnaissance across 8 cleanup domains. A coordinator then converges findings into a single approved work queue with explicit file ownership, confidence thresholds, and dependency ordering. Stage 2 executes only approved findings with disjoint write scopes, followed by repo-wide verification.

**Tech Stack:**
- Claude/Codex subagents
- `rg`, `git status`, `pnpm`, `turbo`
- Optional static-analysis tools: `knip`, `madge`
- JSON or markdown finding reports stored under `ops/cleanup-audit/`

---

## Why This Version Is Safer

- No agent edits during initial discovery.
- Overlap is treated as a prioritization signal, not proof.
- File ownership is exclusive during execution.
- Type moves, cycle fixes, and legacy removal happen before dead-code and comment cleanup.
- Existing unstaged work is protected by default.

## Global Guardrails

Use this block verbatim at the top of the coordinator prompt.

```text
You are coordinating a monorepo cleanup pass in a Turborepo + pnpm repository.

Repository shape:
- apps/rad-os (Next.js 16)
- packages/radiants
- packages/ctrl
- packages/pixel
- packages/preview
- packages/create

Hard constraints:
- This codebase uses a copy-on-import component model.
- Components in apps/rad-os/components/ that resemble components in packages/radiants/components/core/ are intentional independent copies.
- Do NOT consolidate or deduplicate those app/package component copies across that boundary.
- Focus DRY work on utility functions, hooks, shared constants, repeated inline logic within the same package or app, and identical helper patterns that appear 3+ times.
- Do NOT create abstractions for code used only twice.
- Do NOT remove .meta.ts files; they are consumed indirectly by the registry generator.
- Do NOT remove ESLint plugin rules in packages/radiants/eslint/ due to indirect loading.
- Do NOT remove CSS custom properties just because JS import analysis does not reference them.
- Do NOT remove .schema.json files; they are generated outputs.
- Do NOT remove icon assets in packages/radiants/assets/icons/ solely because there are no direct imports.
- Do NOT remove the backward-compat alias block in packages/radiants/tokens.css.
- Protect existing user changes. Do not overwrite or revert unstaged work. If a proposed edit touches a dirty file, mark it blocked unless that file is explicitly assigned for the run.

Output style requirements:
- Every finding must include file paths and line numbers.
- Every finding must include confidence, blast radius, and an explicit verification command.
- Every finding must be labeled as one of:
  - intentional_copy_on_import
  - consolidation_candidate
  - remove
  - keep_with_reason
  - legacy_path
  - dead_code
  - cycle
  - weak_type
  - comment_cleanup
```

## Shared Finding Schema

Require every Stage 1 agent to emit findings in this format.

```json
{
  "finding_id": "TYPE-003",
  "agent_area": "type_consolidation",
  "title": "Duplicate component contract type",
  "classification": "consolidation_candidate",
  "confidence": 0.94,
  "blast_radius": "medium",
  "evidence": [
    { "file": "apps/rad-os/types/components.ts", "lines": "12-28" },
    { "file": "packages/radiants/components/button.meta.ts", "lines": "5-21" }
  ],
  "summary": "Both files define the same prop contract; the .meta.ts definition is canonical.",
  "proposed_action": "Export the contract type from the owning package and import it from the app.",
  "canonical_owner": "packages/radiants",
  "blocked_by": [],
  "verification": [
    "pnpm turbo typecheck --filter=rad-os --filter=radiants"
  ],
  "edit_scope": [
    "apps/rad-os/types/components.ts",
    "packages/radiants/components/button.meta.ts"
  ]
}
```

## Confidence Rubric

- `0.90-1.00`: direct proof, low ambiguity, safe to auto-approve if ownership is clear
- `0.80-0.89`: likely correct, approve only if no higher-priority dependency blocks it
- `0.70-0.79`: plausible, report-only unless corroborated by another agent or direct evidence
- `<0.70`: report-only

Use these blast-radius definitions:

- `low`: local helper, local type, private function, comments, obvious dead variable
- `medium`: multi-file change within one package/app, shared utility, barrel reshaping within a package
- `high`: public exports, `package.json`, barrel files at package root, cross-package type ownership, cycle fixes spanning packages

## Convergence Rules

The coordinator applies these rules after Stage 1:

1. Group findings by affected file set and concept.
2. Mark overlap when 2+ agents describe the same underlying problem.
3. Treat overlap as a priority signal, not proof of correctness.
4. Auto-approve only when:
   - confidence is `>= 0.90`, and
   - blast radius is `low` or `medium`, and
   - no conflicting agent proposes a different canonical owner, and
   - the files are not dirty in the working tree.
5. Escalate to coordinator review when:
   - blast radius is `high`, or
   - the change touches a package root barrel, `package.json`, or public API, or
   - two agents disagree on ownership or action.
6. Reject findings that:
   - violate the copy-on-import rule,
   - abstract code used only twice,
   - depend on speculation instead of evidence,
   - remove indirect-entrypoint files covered by the guardrails.

## Execution Order

The coordinator should schedule approved work in this order:

1. Type consolidation
2. Circular dependency fixes
3. Deduplication / DRY cleanup
4. Weak type strengthening
5. Defensive programming cleanup
6. Legacy / compatibility removal
7. Dead code removal
8. Comment / AI slop cleanup

Reasoning:
- Type ownership and cycle fixes change the graph other agents rely on.
- Dead-code judgments are more accurate after types, imports, and legacy paths are normalized.
- Comment cleanup is last so it does not conflict with functional edits.

## Stage 1: Read-Only Reconnaissance Prompt

Use this as the shared preamble for all eight domain agents. Append the domain-specific brief after it.

```text
Stage 1 only. Do not edit files.

Your job is to audit one cleanup domain in this monorepo and return structured findings only.

Rules:
- Read as much code as needed to build evidence.
- Do not modify files.
- Do not propose abstractions for patterns used only twice.
- Respect the copy-on-import constraint.
- If a finding touches a dirty file, still report it, but mark it blocked.
- Prefer direct evidence over inferred style opinions.
- Include file paths and line numbers for every finding.
- Output:
  1. A short critical assessment in markdown ordered by severity and confidence.
  2. A JSON array of findings using the required schema.

When evaluating confidence:
- Trace importers, call sites, and ownership.
- For type findings, treat .meta.ts contracts as authoritative.
- For dead-code findings, manually verify every result from static-analysis tools.
- For cycle findings, include the exact dependency path.
- For weak types, identify the actual originating type before proposing a replacement.
- For defensive cleanup, keep boundary validation and meaningful error handling.
- For legacy cleanup, skip merely unreferenced code; that belongs to dead-code review.
```

## Stage 1: Domain Briefs

Append one of these after the shared Stage 1 prompt.

### Agent 1: Deduplication & DRY

```text
Research all code in this monorepo for duplication and consolidation opportunities.

Classify each finding as either:
- intentional_copy_on_import
- consolidation_candidate

Focus on:
- utility functions
- hooks
- shared constants
- repeated inline logic within the same package or app
- identical helper patterns that appear 3+ times

Do not consolidate app/package component copies across the apps/rad-os and packages/radiants boundary.
```

### Agent 2: Type Consolidation

```text
Find all TypeScript type definitions, interfaces, and enums across the monorepo.

Focus on:
- duplicates between apps/rad-os/types/ and packages/*/
- copy-pasted prop types across components
- inline types that duplicate a canonical definition
- .meta.ts files as the source of truth for component contracts

Shared types between packages should live in the package that owns the concept.
```

### Agent 3: Dead Code Removal

```text
Find truly unused code only after manual verification.

You may use knip if available, but verify every finding manually before reporting it.

Focus on:
- genuinely unreachable JS/TS exports
- unused npm dependencies in each workspace package.json
- dead component files with zero importers
- unused function and variable declarations

Respect all indirect-reference exclusions from the global guardrails.
```

### Agent 4: Circular Dependency Untangling

```text
Analyze circular dependencies at both the package level and module level.

Use madge if available, or trace import graphs manually.

Check:
- module-level cycles within a package
- package-level cycles in package.json
- barrel files that create unnecessary import cycles

Pay special attention to:
- packages/ctrl/index.ts
- packages/ctrl/selectors/index.ts

Include exact cycle paths in findings.
```

### Agent 5: Weak Type Strengthening

```text
Find weak types:
- any
- object
- Function
- {}
- Record<string, any>
- as any
- @ts-ignore
- @ts-expect-error

Use unknown when the real type cannot yet be determined and unknown is semantically correct.
Do not downgrade unknown to a guess.

For every finding:
- trace the value origin
- inspect call sites
- check related package exports
- propose the actual specific type when you can prove it
```

### Agent 6: Defensive Programming Cleanup

```text
Find unnecessary defensive programming and classify each finding as:
- remove
- keep_with_reason

Target:
- empty catch blocks
- catch blocks that only log and hide the error
- null checks on values guaranteed by type or framework
- redundant || or ?? fallbacks where nullish values are impossible
- try-catch around synchronous non-throwing code
- guards where the value is guaranteed by contract

Keep:
- boundary validation
- server action / API route / fetch / database error handling
- error boundaries
- meaningful catch-and-transform logic
```

### Agent 7: Legacy & Compatibility Shim Removal

```text
Find deprecated, legacy, and compatibility paths that are still referenced but should no longer exist.

Focus on:
- feature flags or env branches that are always true or false
- backward-compat shims that are fully migrated away from
- code marked deprecated / legacy / compat
- unreachable branches like if (false)
- TODO/FIXME/HACK markers whose work is already complete

Do not remove the alias block in packages/radiants/tokens.css.
Skip merely unreferenced code; that belongs to dead-code review.
```

### Agent 8: AI Slop & Comment Cleanup

```text
Find low-value comments, stubs, filler annotations, and unnecessary wrappers.

Target:
- comments that restate the code
- empty JSDoc blocks
- filler transition comments
- placeholder implementations returning dummy data
- abstractions that only wrap a single call with no logic
- barrel files that only pass through a single module

Keep:
- structured RDNA ESLint exception comments
- comments explaining non-obvious why decisions
- public package JSDoc
- license headers
```

## Coordinator Prompt

Use this after all Stage 1 agents return.

```text
You are the cleanup coordinator.

Inputs:
- 8 Stage 1 agent reports
- current git status

Tasks:
1. Merge all findings into a single queue.
2. Deduplicate overlapping findings by concept and affected files.
3. Assign each approved finding one owner and an exclusive write scope.
4. Compute status for each finding:
   - approved
   - blocked
   - rejected
5. Produce an execution order using the required sequencing.
6. Emit two outputs:
   - a concise markdown decision log
   - a machine-readable execution manifest

Decision rules:
- Overlap increases priority but does not override weak evidence.
- Prefer the narrowest fix that resolves the issue.
- If two findings touch the same file, they must either:
  - be assigned to the same execution owner, or
  - be serialized into separate execution waves.
- Any finding touching public exports, package root barrels, or package.json must be marked high-risk and require explicit approval in the manifest.
- Any finding involving dirty files is blocked unless the run explicitly claims those files.

Execution manifest schema:
{
  "wave": 1,
  "owner": "agent_2_type_consolidation",
  "finding_ids": ["TYPE-003", "TYPE-009"],
  "write_scope": [
    "packages/radiants/components/button.meta.ts",
    "apps/rad-os/types/components.ts"
  ],
  "verification": [
    "pnpm turbo typecheck --filter=rad-os --filter=radiants"
  ],
  "risk": "medium",
  "status": "approved"
}
```

## Stage 2: Execution Prompt

Run one execution agent per approved wave. Do not give the agent the full original discovery brief again. Give only the manifest and the repo guardrails.

```text
Stage 2 execution only.

You are executing approved cleanup findings from the coordinator manifest.

Inputs:
- approved manifest entries assigned to you
- the global guardrails

Rules:
- Edit only files listed in your write scope.
- Do not opportunistically clean nearby code outside your assigned findings.
- If you discover a finding depends on a blocked or rejected change, stop and mark the item blocked rather than improvising.
- Before editing, re-read the targeted files and confirm the evidence still holds.
- After editing, run the listed verification commands.
- Report:
  1. what changed
  2. what was verified
  3. anything deferred or blocked
```

## Recommended Output Locations

- Stage 1 reports: `ops/cleanup-audit/stage1/<agent-name>.md` and `.json`
- Coordinator outputs: `ops/cleanup-audit/coordinator/decision-log.md` and `execution-manifest.json`
- Stage 2 execution notes: `ops/cleanup-audit/execution/<wave>-<agent>.md`

## Minimal Approval Policy

If you want a fast first pass, approve only findings that meet all of these:

- confidence `>= 0.90`
- blast radius `low` or `medium`
- no disagreement on canonical owner
- no package root barrel or `package.json` edits
- no dirty-file conflict

Everything else stays report-only until reviewed.

## Practical Recommendation

For this repo, do not use "multiple agents in the same domain and pick overlap" as the main convergence strategy. Use one strong domain agent per area, then let the coordinator use overlap across domains to surface:

- duplicated type ownership that also causes cycles
- legacy shims that also create dead code
- comment cleanup targets adjacent to already-approved edits

That gives you diversity of evidence without correlated duplicate work.

## Suggested Kickoff Text

Use this if you want one top-level prompt to start the run:

```text
Run a two-stage cleanup orchestration in this monorepo.

Stage 1:
- Spawn 8 read-only domain agents using the shared Stage 1 prompt and the domain briefs.
- Collect structured findings only. No edits.

Stage 2:
- Run the coordinator prompt on the Stage 1 outputs.
- Approve only findings that satisfy the minimal approval policy unless explicitly escalated.
- Execute approved findings in ordered waves with exclusive file ownership.
- Run verification after each wave and a repo-wide verification pass at the end.

Return:
- the coordinator decision log
- the execution manifest
- a final summary of applied changes, blocked items, and residual risks
```
