# fn-11: Git Integration (ARCHIVED)

> **ARCHIVED:** 2026-01-16
>
> **Reason:** RadFlow pivoted to "Design System Manager for LLM CLI tools". Direct file writes and git integration are handled by LLM CLI tools (Claude Code, Cursor), not RadFlow. RadFlow now focuses on browsing design systems and outputting context for LLMs.
>
> **Superseded by:** fn-9 (Context Engineering & Codebase Cleanup)

---

## Original Overview

Implement "Git is save" workflow per CLAUDE.md. Currently there is no git integration; this epic adds commit, status, diff, and snapshot functionality.

**Goal:** Cmd+S commits changes, enabling fearless editing with full undo.

**Priority:** P0 - Critical (per CLAUDE.md mandate)

**Estimated Hours:** 18-24h

**Dependencies:** None (can run in parallel with fn-9)

---

## Why Archived

The "Git is save" paradigm assumed RadFlow would write directly to files. With the context engineering pivot:

1. **RadFlow doesn't write files** — It outputs LLM-ready prompts
2. **LLMs handle git** — Claude Code, Cursor manage version control
3. **Simpler architecture** — No need for git integration in a read-only tool

---

## Original Scope (for reference)

| ID | Gap | Priority | Hours |
|----|-----|----------|-------|
| P0-14 | No Git-as-Save Integration | P0 | 8-10h |
| P0-15 | No Snapshot System | P0 | 6-8h |
| P0-16 | No Undo Everything | P0 | 4-6h |

---

## Original Task Breakdown

### Phase 1: Git Commands
- fn-11.1: Create Git Module
- fn-11.2: Implement git_status Command
- fn-11.3: Implement git_diff Command
- fn-11.4: Implement git_commit Command

### Phase 2: Snapshot System
- fn-11.5: Implement Snapshot Create
- fn-11.6: Implement Snapshot Restore

### Phase 3: UI Integration
- fn-11.7: Create Commit Dialog
- fn-11.8: Implement Undo Everything

---

## References

- Original spec: `.flow/specs/fn-11.md`
- Replacement epic: fn-9 (Context Engineering)
- Master Gap Report: `/docs/reviews/spec-review-master.md`
