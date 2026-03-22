---
title: Production Readiness Audit Swarm — 6-Agent Parallel Codebase Audit
category: tooling
date: 2026-03-22
tags: [audit, swarm, production-readiness, checklist, dead-code, drift, classification, parallel-agents]
---

# Production Readiness Audit Swarm — 6-Agent Parallel Codebase Audit

## Symptom

A 120+ item production readiness checklist with 3 derived track views (execution, research, mixed) had accumulated:
- Items marked open that were already done
- Newly introduced bugs/drift not represented in any checklist
- Items classified in the wrong track (execution items needing architecture decisions, research items that were already decided)
- Hidden dependency chains between items
- Stale counts and references (worktree paths, component counts, test thresholds)

Manual review was intractable — too many items spanning code, config, CSS, store, lint, registry, and docs.

## Investigation

A single-pass audit missed cross-cutting concerns. Trying to read everything sequentially hit context limits and produced shallow findings.

## Root Cause

The checklist was generated from a prior 7-agent audit + interview, but the codebase continued evolving. Items were completed without updating the checklist. New bugs were introduced without being captured. The 3 derived tracks were created once and never reconciled against code changes.

## Solution

### 6-Agent Parallel Audit Swarm

Spawn 6 bounded read-only agents with non-overlapping scopes:

| Agent | Scope | Key Tools |
|-------|-------|-----------|
| **Checklist Auditor** | Stale statuses, missing items, duplicates, misclassifications, items missing from tracks | grep exports/imports against checklist claims |
| **Dead Code Hunter** | Unused files, dead exports, broken imports, orphaned registry entries | grep for exports with 0 import matches |
| **Behavior Bug Hunter** | State bugs, event mismatches, persistence issues, runtime hacks | read store slices, event handlers, effects |
| **UI Polish Auditor** | Hardcoded colors, dark mode drift, pixel-corner violations, z-index, motion spec | grep for `#[0-9a-f]`, `border.*pixel-rounded`, `duration-` |
| **Tooling Drift Auditor** | Lint rule coverage, test gaps, registry drift, generated artifact staleness | compare rule files vs test files, registry vs disk |
| **Boundary Auditor** | Misclassified items, hidden dependency chains, ownership boundaries | read checklist + track files, then verify claims against code |

### Key Design Decisions

1. **Read-only constraint**: Agents report findings but never edit code. This prevents conflicts and keeps the swarm focused on accuracy.
2. **Non-overlapping scopes**: Each agent has a distinct focus area. The checklist already captures known T0 dead code — Dead Code Hunter explicitly skips those and finds NEW items.
3. **Evidence-first format**: Every finding requires file paths, line numbers, and code evidence. No speculation.
4. **Structured output**: Every finding uses the same format (severity, confidence, fix size, track, blocked?) enabling machine-sortable aggregation.

### Results (this run)

| Metric | Count |
|--------|-------|
| Total findings | 78 |
| High severity | 12 |
| Medium severity | 31 |
| Items already done (mark ✅) | 6 |
| Items to reclassify | 8 |
| Newly discovered items | 34 |
| Dependency graph corrections | 6 |
| Top leverage refactors | 6 |

### Aggregation Pattern

After all agents complete:
1. Deduplicate findings that multiple agents independently discovered (confirms high confidence)
2. Cross-reference: Boundary Auditor reclassifications + Checklist Auditor stale items → combined "items to update"
3. Dead Code + Behavior findings → new T0 items for Batch 1
4. UI Polish + Tooling Drift → mechanical sweep batches
5. Produce recommended execution order based on dependency analysis

## Prevention

- Re-run the audit swarm before each major execution phase begins
- When completing a checklist item, mark it ✅ in the same commit
- Keep derived tracks in sync with the checklist via a reconciliation pass after each batch
- Use the structured finding format so future swarm runs can diff against prior findings

## Related

- `research/production-readiness-audit-swarm.md` — full findings from this run
- `docs/production-readiness-checklist.md` — source of truth
- `docs/solutions/tooling/design-contract-architecture-decision.md` — Architecture A decision referenced by tooling drift findings
- `docs/solutions/tooling/eslint-rdna-drift-bugs-2026-03.md` — prior drift analysis
