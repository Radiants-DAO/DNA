# Plan Review Fixes and Context

This document summarizes recommended fixes to the current plans and the context behind each change. It covers epic `fn-1` and `fn-2` based on the specs in `docs/features/`.

## fn-2: Page Editor MVP

### 1) Add a concrete DOM-to-source mapping strategy
**Issue**: The plan depends on accurate `ComponentName @ file.tsx:line` but does not specify how DOM nodes are mapped to source locations.

**Context**: Component ID Mode is the core value proposition and requires accurate, production-safe mapping beyond React Fiber debug data.

**Suggested fix**:
- Add a dedicated task before Component ID Mode to define and implement a DOM-to-source mapping pipeline.
- Decide between:
  - Build-time AST transform that injects data attributes (preferred for prod accuracy).
  - Runtime dev-only mapping (acceptable only if the MVP is dev-only).
- Update acceptance criteria to validate mapping accuracy on real `theme-rad-os` pages.

### 2) Expand Component ID Mode to include spec-required behaviors
**Issue**: Tasks mention "basic selection" and "multi-select" but omit spec-required features.

**Context**: The spec requires visual pills, select-all-of-type, rectangle selection, and HTML tag formatting with content preview.

**Suggested fix**:
- Add subtasks or expand `fn-2.5` and `fn-2.6` to cover:
  - Pill overlays with hover state and element highlight
  - Shift+Cmd+Click select-all-of-type
  - Click+drag rectangle selection
  - HTML tag clipboard format with content preview

### 3) Add Component Browser and Violations tab integration to MVP
**Issue**: The Page Editor MVP spec includes a Components tab and Violations tab, but the plan does not include this work.

**Context**: The MVP is defined as "Page Editor" with tabs/sidebar listing components and violations for selection and context copying.

**Suggested fix**:
- Add a new task after store setup:
  - Component Browser tab (list, filter, select, multi-select, copy context)
  - Violations tab (filter by violations, selection and copy)
- Add acceptance criteria to validate filtering and clipboard output.

### 4) Specify Text Edit Mode scope and undo behavior
**Issue**: The plan says contentEditable + clipboard but does not define rich text scope or how direct-write undo works.

**Context**: The spec requires headings, lists, links, blockquotes, code blocks, and full undo/redo for direct edits.

**Suggested fix**:
- Add a decision task: TipTap vs native contentEditable.
- Update `fn-2.7` and `fn-2.8` to include:
  - Minimum supported rich text features
  - Clipboard accumulation behavior
  - Undo/redo strategy for direct-write mode

### 5) Gate fn-2 on fn-1 outcomes
**Issue**: fn-2 assumes POCs are done and Rust/Tauri is confirmed, but does not declare dependency.

**Context**: fn-1 is a tech stack validation epic and could invalidate fn-2 if a fallback is chosen.

**Suggested fix**:
- Add epic dependency: `fn-2` depends on `fn-1` completion.
- Alternatively, add a task that verifies the stack decision before starting `fn-2.1`.

## fn-1: Research Phase

### 1) Align search POC with current stack decisions
**Issue**: The repo stack drops `tantivy` in favor of `fuzzy-matcher`, but the plan still includes a tantivy POC.

**Context**: `CLAUDE.md` lists `fuzzy-matcher` as the selected search crate.

**Suggested fix**:
- Replace or amend `fn-1.5` to validate `fuzzy-matcher` against component and icon names.
- If keeping tantivy for future, add rationale and change status from "required POC" to "optional research."

### 2) Remove or close the dropped git2 task
**Issue**: `fn-1.3` is marked blocked but also listed as dropped in the spec.

**Context**: The plan explicitly says git2 is dropped and git is handled via LLM prompts.

**Suggested fix**:
- Mark `fn-1.3` as canceled or remove it from the epic plan.
- Ensure the epic status reflects only active tasks.

## Suggested Plan Edits (High Level)

### fn-2 tasks to add or expand
- New: "DOM-to-source mapping strategy and implementation"
- Expand: `fn-2.5` / `fn-2.6` to include all Component ID Mode behaviors
- New: "Component Browser and Violations tabs"
- Expand: `fn-2.7` / `fn-2.8` to include rich text scope and undo for direct write
- Add epic dependency: `fn-2` depends on `fn-1`

### fn-1 tasks to update
- Replace `fn-1.5` with fuzzy-matcher validation
- Close or remove `fn-1.3` as dropped

