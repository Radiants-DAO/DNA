# Flow Roadmap — Plan of Plans Brainstorm

**Date:** 2026-02-23 (revised)
**Status:** Decided

## What We're Building

A sequenced roadmap: stabilize the test suite, ship a final VisBug feature pass with the comment-mode composer fix, then execute the FAB-First architectural shift (Chrome Side Panel → Layers Panel) as one coordinated initiative. E2E smoke tests gate each major milestone.

## Why This Approach

The codebase shipped a huge amount of work in February: unified mutation engine, 8 design sub-mode tools, inspect mode, move mode, full MCP bidirectional pipeline, background-owned WebSocket, comment/feedback system. The pipeline refactor (originally Plan 2) is already done. What remains is hardening what exists, filling a few feature gaps, then building the next-gen UI surface (Side Panel replaces DevTools panel).

## Key Decisions

- **Pipeline refactor is done.** `backgroundSessionStore`, `backgroundCompiler`, `keepalive` all implemented. `sidecarSync.ts` deleted. Background owns the single WebSocket.
- **Drop annotate mode (tasks 4.2–4.5).** Comment/question mode is the shipped system. No parallel annotation system.
- **Comment composer shim still needed.** Pipeline made comments panel-independent at the data layer, but the on-page UX (click element → type comment without opening DevTools) needs a content-script composer.
- **Test-then-build.** Fix the 1 remaining broken test, add unit tests for untested tools, then add E2E smoke tests at each milestone gate.
- **Typography tool is done.** 1,230 lines, wired as sub-mode 3. Removed from Plan 2's scope.

## Completed (formerly Plans 0–2)

### Cleanup & Stabilize (Plan 0) — MOSTLY DONE
- [x] Remove debug logging from `panelRouter.ts`
- [x] Merge worktree to main (commit dfbce6a)
- [x] Archive 17 completed/superseded plans
- [x] Archive 5 completed brainstorms
- [x] Update VisBug port plan checkboxes and status
- [x] Fix `positionTool.test.ts` failure
- [ ] Fix `measurements.test.ts` — overlapping rects case expects `[]` but gets 4 measurements
- [ ] Quick comment composer — content script opens input directly in comment/question mode (~20 lines in `content.ts`)
- [ ] Verify `pnpm typecheck` passes on main

### Pipeline Refactor (Plan 2) — DONE
All 4 phases complete:
- [x] Shared types + sidecar client bidirectional messaging
- [x] Background session store + comment capture + agent routing
- [x] FAB auto-sleep with keepalive alarm
- [x] Panel delegation + `sidecarSync.ts` deleted

---

## The Roadmap

### Plan 1: Test Stabilization

**Scope:** Fix remaining test failure. Add unit tests for all untested content-script tools. Gate: all tests green before Plan 2.

**Fix first:**
- `measurements.test.ts` — overlapping rects case

**Tools needing tests:**
- `inspectTooltip.ts` — hover lifecycle, content rendering
- `inspectPanel.ts` — attach/detach/destroy, tab switching
- `assetScanner.ts` — element scanning, deduplication
- `inspectRuler.ts` — measurement rendering, clear/destroy
- `colorTool.ts` — attach/detach, color mutation via engine
- `effectsTool.ts` — attach/detach, shadow/filter mutations
- `typographyTool.ts` — arrow key mutations, font property cycling
- `layoutTool.ts` — display mode switching, alignment
- `moveTool.ts` — DOM reorder, undo recording

**Pattern:** Each test covers: creation, attach to mock element, key mutation, detach, destroy. Mock `UnifiedMutationEngine` and `ShadowRoot`.

**Estimated:** ~9 test files, ~5–8 tests each.

---

### Plan 2: VisBug Final Pass

**Scope:** Remaining high-value features from the VisBug port plan + comment composer. Cherry-picked for impact.

**Include:**
- Comment composer shim — content-script input for comment/question mode (from Plan 0 remnant)
- Copy/paste styles (Cmd+Alt+C/V) — universally useful
- Keyboard element traversal (Tab/Enter) — big UX win
- Guides tool (sub-mode 6) — wraps existing measurement code as design tool
- Text edit mode wiring verification — confirm end-to-end
- Legacy `content/features/` cleanup — remove ~7 files superseded by `modes/tools/`
- Panel message wiring for all tools

**Exclude (dropped or deferred):**
- Annotate mode 4.2–4.5 — dropped, comment/question is the system
- Typography tool — already done
- Popover API overlay — defer
- Group/ungroup — defer
- A11y tool as separate sub-mode — absorbed into inspect mode A11y tab
- Inspector mode — done as unified inspect

**Existing plan:** `plans/2026-02-06-flow-phase1-visbug-port.md` (updated 2026-02-23)

---

### Plan 3: Chrome Side Panel

**Scope:** Replace DevTools panel as the primary power UI surface.

**Depends on:** Plan 1 (tests green)

**Brainstorms to consolidate:**
- `2026-02-20-fab-first-architecture-brainstorm.md` (decisions 1, 4, 5)
- `2026-02-20-side-panel-brainstorm.md` (layout, rail tabs, prompt builder)

**Key deliverables:**
- `chrome.sidePanel` registration + basic shell
- Rail tabs: Layers (stub), Components, Assets, Variables, Designer
- Bottom dock: Clipboard (auto-accumulated) + Prompt Builder (replaces Cmd+K)
- V-mode on FAB → chips in Side Panel prompt builder
- Sunset Cmd+K spotlight (`spotlight.ts` + `PromptPalette.tsx`)

**E2E gate:** Smoke test — enable Flow, select element, verify Side Panel shows data.

**Needs detailed plan written.**

---

### Plan 4: Layers Panel

**Scope:** Webflow Navigator-style DOM tree as default Side Panel tab.

**Depends on:** Plan 3 (Side Panel infrastructure)

**Brainstorms to consolidate:**
- `2026-02-20-layers-panel-brainstorm.md`
- `2026-02-05-react-devtools-integration-brainstorm.md` (fiber tree, component names)

**Key deliverables:**
- DOM tree rendering with type-specific icons and smart labels
- Component name labels from fiber walker (React/Vue/Svelte)
- Bidirectional sync with canvas selection
- Arrow key + drag-and-drop reordering (shared engine with Move mode)
- Filter bar / view modes for deep DOMs
- Virtual scroll for performance

**E2E gate:** Smoke test — load React app, verify component names in tree, click tree node → element selected on page.

**Needs detailed plan written.**

---

### E2E Smoke Tests (cross-cutting)

**Scope:** Browser-level extension testing that gates each milestone.

**Approach TBD — options:**
- Playwright with Chrome extension loading
- Manual smoke test checklist (lower investment, less reliable)
- WXT's built-in testing utilities if they support extension page testing

**Milestones that need smoke tests:**
- Plan 1 gate: all unit tests green
- Plan 2 gate: comment composer works without DevTools, copy/paste styles, keyboard traversal
- Plan 3 gate: Side Panel opens, shows data for selected element
- Plan 4 gate: Layers tree renders, bidirectional selection sync

---

## Execution Order

```
Plan 1: Test Stabilization
        │
Plan 2: VisBug Final Pass ←─── can overlap with Plan 1 (different files)
        │
Plan 3: Chrome Side Panel
        │
Plan 4: Layers Panel
```

## Separate Track (not sequenced)

- **Responsive Viewer** (Phase 7) — `plans/2026-02-02-flow-2-phase-7-responsive-viewer.md`. Independent, can run in parallel via worktree anytime.

## Active Brainstorms (not yet planned)

| Brainstorm | Feeds Into |
|-----------|-----------|
| `2026-02-20-fab-first-architecture-brainstorm.md` | Plan 3 |
| `2026-02-20-side-panel-brainstorm.md` | Plan 3 |
| `2026-02-20-layers-panel-brainstorm.md` | Plan 4 |
| `2026-02-05-react-devtools-integration-brainstorm.md` | Plan 4 |
| `2026-02-06-flow-phase1-visbug-port-brainstorm.md` | Plan 2 (reference) |

## Open Questions

- E2E test framework choice — Playwright vs manual checklist vs WXT utilities?
- Should Plan 2 (VisBug pass) block on Plan 1 (tests), or overlap since they touch different files?
- React DevTools integration (inline props/state editing) — separate plan after Layers, or fold into Plan 4?
- DevTools panel future — CDP-only debugging lens, or sunset entirely once Side Panel is live?

## Research Notes

- 46 test files, 284 passing, 1 failing (`measurements.test.ts` overlapping rects)
- Debug logs already removed (commit 1628d35)
- Worktree merged and cleaned (only main remains)
- `sidecarSync.ts` deleted, `backgroundSessionStore/Compiler/keepalive` all exist with tests
- VisBug port: ~27/39 tasks done, 12 remaining (8 after drops)
- 5 brainstorms archived, 5 active, 1 is this file
