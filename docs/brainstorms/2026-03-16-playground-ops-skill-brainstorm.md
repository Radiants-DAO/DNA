# Playground Ops Skill Brainstorm

**Date:** 2026-03-16
**Status:** Decided

## What We're Building

A single `playground-ops` skill that gives Claude full operational control of the playground CLI. Two modes: assistant (human-in-the-loop, runs commands on request) and autonomous (works the annotation priority queue, batch reports results). Includes an annotation system refactor from severity-based to priority-based (P1-P4).

## Why This Approach

Single-loop skill (Approach A) — one skill, two modes, no extra files or agent dispatch overhead. The autonomous mode is straightforward: poll → triage by priority → act → report. `/loop` integration documented for periodic polling but not auto-started.

## Key Decisions

- **One skill** covering signals, annotations, variations, and agent commands
- **Explicit trigger only** — fires on `/playground`, not ambient context
- **Two modes**: assistant (default) and autonomous (`/playground work`)
- **Priority replaces severity**: P1/P2/P3/P4 (highest to lowest), unprioritized allowed (no default selection)
- **Intent simplified**: fix, change, question only (approve removed)
- **UI refactor**: ToggleGroup component for both priority and intent selection in annotation popover
- **Queue order**: P1→P2→P3→P4→unprioritized (by creation time within each level)
- **Reporting**: Batch report in agent chat via `/playground report` — no browser-side reporting
- **`/loop` integration**: Skill auto-suggests `/loop 5m /playground check` when entering autonomous mode

## Annotation Model Changes

### Before (current)
- **Severity:** blocking | important | suggestion
- **Intent:** fix | change | question | approve
- **Status:** pending | acknowledged | resolved | dismissed

### After
- **Priority:** P1 | P2 | P3 | P4 | (none) — default is no selection
- **Intent:** fix | change | question (approve dropped)
- **Status:** pending | acknowledged | resolved | dismissed (unchanged)
- **UI:** ToggleGroup for priority selection, ToggleGroup for intent selection

### Migration
- Existing annotations with severity `blocking` → P1, `important` → P2, `suggestion` → P3
- Schema field rename: `severity` → `priority` (string "P1"-"P4" or null)
- CLI flags: `--severity` → `--priority` (or `-p`)
- API payload: `severity` → `priority`
- Annotation store, route handlers, CLI commands, hook output all need updating

## Skill Command Surface

| Command | Mode | What it does |
|---------|------|-------------|
| `/playground check` | Assistant | Fetch and display all pending annotations, grouped by priority |
| `/playground status` | Assistant | Run `rdna-playground status` — signals, iterations, lock state |
| `/playground fix <id>` | Assistant | Run `rdna-playground fix` for a specific annotation |
| `/playground variations <component>` | Assistant | Run `create-variants` for a component |
| `/playground adopt <component> <file>` | Assistant | Run `variations adopt` |
| `/playground resolve <id> [summary]` | Assistant | Resolve an annotation |
| `/playground dismiss <id> <reason>` | Assistant | Dismiss an annotation |
| `/playground work` | Autonomous | Drain the priority queue: P1→P4→unprioritized. Fix/act on each, batch report. |
| `/playground report` | Either | Summarize all actions taken this session: fixes applied, annotations resolved, variants created |

## Autonomous Mode Behavior

1. Poll `GET /agent/annotation?status=pending`
2. Sort by priority: P1 first, then P2, P3, P4, unprioritized last
3. For each annotation:
   - **fix intent**: Run `rdna-playground fix <component> --annotation <id>`
   - **change intent**: Run `rdna-playground create-variants <component>`, acknowledge annotation
   - **question intent**: Acknowledge, surface to human in batch report
4. After queue is drained, print batch report
5. Auto-suggest: "To keep monitoring: `/loop 5m /playground check`"

## Prerequisite Check

Skill must verify playground is running before any CLI call:
```bash
curl -sf http://localhost:3004/playground/api/agent/signal?format=json > /dev/null
```
If not running, instruct user to start with `pnpm --filter @rdna/playground dev`.

## Open Questions

- Should `/playground work` also run `create-variants` for components with no iterations, or only act on existing annotations?
- Should the batch report persist to disk (like `ops/session-status.md`) or just print to chat?

## Worktree Context

- Path: `/Users/rivermassey/Desktop/dev/DNA` (main checkout)
- Branch: `main`

## Research Notes

- CLI lives at `tools/playground/bin/rdna-playground.mjs` with commands in `bin/commands/`
- API base: `http://localhost:3004/playground/api`
- Annotation store is process-local (resets on server restart)
- Prior brainstorms (`2026-03-15-playground-agent-integration-brainstorm.md`, `2026-03-15-playground-annotations-brainstorm.md`) explicitly deferred skills to repo-level initiative — this brainstorm picks that up
- 44 existing skills in `~/.claude/skills/` — `op-status`, `wf-execute`, `op-team` are the closest patterns
- Sandbox now allows localhost network access (`settings.local.json` updated this session)
