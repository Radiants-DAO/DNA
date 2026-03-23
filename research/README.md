---
type: "note"
---
# Research Prompt Library

This folder contains reusable prompt docs for long-running Claude Max workflows in the DNA monorepo.

These prompts are organized by task type, not by priority. Use the right loop for the right class of work.

***

## Prompt Index

### Architecture / Design-System Research

* [claude-max-loop-bootstrap.md](./claude-max-loop-bootstrap.md)\
  Use for the first run of a new architecture-research loop.

* [claude-max-loop-continuation.md](./claude-max-loop-continuation.md)\
  Use for later cycles of the same research loop after the initial artifacts exist.

Best for:

* contract design

* design-guard generation strategy

* registry/lint/AI-artifact architecture

* reusable design-system infrastructure decisions

***

### Production Readiness Backlog Review

* [production-readiness-audit-swarm.md](./production-readiness-audit-swarm.md) Use for a read-only audit swarm against the production-readiness backlog.

Best for:

* stale checklist statuses

* missing backlog items

* reclassification between execution/research/mixed

* hidden dependency chains

* highest-leverage refactor opportunities

Run this sparingly, usually:

* once before major execution work starts

* again after several execution batches

* again before handoff/release if needed

***

### Production Readiness Execution

* [production-readiness-cleanup-loop.md](./production-readiness-cleanup-loop.md)\
  Use for dead code, broken imports, stale exports, logging cleanup, and low-ambiguity cleanup batches.

* [production-readiness-behavior-loop.md](./production-readiness-behavior-loop.md)\
  Use for state, persistence, pointer/touch, runtime, transport, and testable behavior bugs.

* [production-readiness-ui-browser-loop.md](./production-readiness-ui-browser-loop.md)\
  Use for visual polish, mobile UX, responsive behavior, and user-facing component quality that needs browser verification.

***

## Recommended Sequence

For design-system architecture work:

1. Run the bootstrap loop

2. Continue with the continuation loop until the recommendation stabilizes

For production-readiness work:

1. Run the audit swarm

2. Update the checklist and track files

3. Start a cleanup loop for T0-style items

4. Run behavior loops for functional bugs and tooling fixes

5. Run UI/browser loops for visual and mobile polish

6. Re-run the audit swarm after a few major batches if the backlog may be stale

***

## Working Rules

* Keep `docs/production-readiness-checklist.md` as the source of truth.

* Treat the derived checklist views as working queues, not canonical truth.

* Use `/compound-knowledge` after subagent aggregation in every loop.

* Keep findings in files, not only in chat.

* Prefer small, closed batches over large mixed batches.

***

## Checklist Views

The production-readiness backlog is split into three working views:

* [../docs/production-readiness-checklist.md](../docs/production-readiness-checklist.md)\
  Source of truth

* [../docs/production-readiness-execution-track.md](../docs/production-readiness-execution-track.md)\
  Implementation-ready work

* [../docs/production-readiness-research-track.md](../docs/production-readiness-research-track.md)\
  Architecture/policy/contract decisions

* [../docs/production-readiness-mixed-track.md](../docs/production-readiness-mixed-track.md)\
  Needs a short decision pass, then execution

⠀