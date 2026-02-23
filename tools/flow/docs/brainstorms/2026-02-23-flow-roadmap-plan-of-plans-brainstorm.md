# Flow Roadmap — Plan of Plans Brainstorm

**Date:** 2026-02-23
**Status:** Decided

## What We're Building

A sequenced roadmap that cleans up stale plans/docs, stabilizes the test suite, ships a final VisBug feature pass, then executes the FAB-First architectural shift (pipeline refactor → Chrome Side Panel → Layers Panel) as one coordinated initiative.

## Why This Approach

The codebase has accumulated 10+ brainstorms and 19+ plans across two directories (`docs/` root and `tools/flow/docs/`). Several plans reference completed or absorbed work. The FAB-First brainstorm identifies the root cause of the comment-mode bug (panel dependency) and three follow-up brainstorms (Side Panel, Layers Panel) that are really one initiative. Cleaning up first gives a clear view of actual remaining work before investing in new features.

## Key Decisions

- **Pipeline → Side Panel → Layers sequencing.** Each phase ships independently. Pipeline refactor unblocks panel-free comments. Side Panel provides the new power UI. Layers Panel is the crown jewel but depends on Side Panel infrastructure.
- **Drop annotate mode (tasks 4.2–4.5).** Comment/question mode is the shipped system. Pipeline refactor makes it panel-independent. No parallel annotation system.
- **Test-then-build.** Fix 2 broken tests + add unit tests for all recently-built content-script tools before starting new feature work. Every tool gets at least a basic test file.
- **Merge worktree to main.** Inspect mode work is done. Clean up debug logs, merge, delete worktree. Future work starts fresh worktrees per initiative.

## The Roadmap

### Plan 0: Cleanup & Stabilize (do first, this session)

**Scope:** Housekeeping. No new features.

1. **Remove debug logging** — delete `console.log('[Flow DEBUG]...')` from `panelRouter.ts`
2. **Fix 2 failing tests** — `measurements.test.ts` (overlapping rects case) and `positionTool.test.ts` (style element cleanup)
3. **Quick comment fix** — content script opens composer directly in comment/question mode (~20 lines in `content.ts`), bypassing panel round-trip. Shim that works today, gets replaced properly in Plan 2.
4. **Merge worktree to main** — squash or merge `worktree-unified-inspect-mode`, delete worktree
5. **Archive stale plans/brainstorms** — move completed/superseded docs to archive:

   **Archive (completed/absorbed):**
   - `plans/2026-02-20-unified-inspect-mode.md` → done
   - `plans/2026-02-20-asset-mode.md` → absorbed into inspect
   - `brainstorms/2026-02-20-unified-inspect-mode-brainstorm.md` → done
   - `brainstorms/2026-02-20-asset-mode-brainstorm.md` → absorbed
   - `brainstorms/2026-02-20-asset-pipeline-consolidation-brainstorm.md` → explicitly deferred
   - `plans/2026-02-20-merged-layout-panel.md` → done
   - `plans/2026-02-20-move-mode.md` → done
   - `brainstorms/2026-02-20-merged-layout-panel-brainstorm.md` → done
   - `brainstorms/2026-02-20-move-mode-brainstorm.md` → done

   **Archive (superseded by FAB-First):**
   - `plans/2026-02-08-panel-data-pipeline-audit.md`
   - `plans/2026-02-08-panel-data-wiring.md`
   - `plans/2026-02-08-panel-wiring-phases.md`
   - `plans/2026-02-09-panel-wiring-fixes.md`
   - `plans/2026-02-10-wire-comment-mode.md`

   **Update (mark completed tasks):**
   - `plans/2026-02-06-flow-phase1-visbug-port.md` — mark Task 5.2 (inspector) and Task 2.9 (a11y tool) as done, delete tasks 4.2–4.5 (annotate mode dropped)
   - `plans/2026-02-20-pipeline-refactor.md` — delete Tasks 1.1 and 1.2 (already done), add Task 0 (quick comment shim)

6. **Verify `pnpm typecheck` and `pnpm test` pass** on main after merge

---

### Plan 1: Test Stabilization

**Scope:** Add unit tests for all untested content-script tools. Gate: all tests green before Plan 2.

**Tools needing tests:**
- `inspectTooltip.ts` — hover lifecycle, content rendering
- `inspectPanel.ts` — attach/detach/destroy, tab switching
- `assetScanner.ts` — element scanning, deduplication
- `inspectRuler.ts` — measurement rendering, clear/destroy
- `colorTool.ts` — attach/detach, color mutation via engine
- `effectsTool.ts` — attach/detach, shadow/filter mutations
- `spacingTool.ts` — arrow key mutations, shift modifier
- `layoutTool.ts` — display mode switching, alignment
- `moveTool.ts` — DOM reorder, undo recording

**Pattern:** Each test file covers: creation, attach to mock element, key mutation, detach, destroy. Mock `UnifiedMutationEngine` and `ShadowRoot`.

**Estimated:** ~9 test files, ~5–8 tests each.

---

### Plan 2: Pipeline Refactor (FAB-First Phase 1)

**Scope:** Background service worker owns the MCP context pipeline. Comments, mutations, and annotations flow to sidecar regardless of DevTools panel state.

**Existing plan:** `plans/2026-02-20-pipeline-refactor.md` (updated per cleanup)

**Phases:**
1. Sidecar client session methods (Task 1.3)
2. Background session store + comment capture + agent routing (Tasks 2.1–2.5)
3. FAB auto-sleep with keepalive alarm (Tasks 3.1–3.2) — deferrable, not a blocker
4. Panel delegation + delete sidecarSync.ts (Tasks 4.1–4.3)

**Gate:** Comments work with DevTools closed. Remove the quick shim from Plan 0.

---

### Plan 3: VisBug Final Pass

**Scope:** Remaining high-value features from the VisBug port plan. Cherry-picked, not the full 16.

**Include:**
- Copy/paste styles (Cmd+Alt+C/V) — universally useful
- Keyboard element traversal (Tab/Enter) — big UX win
- Typography tool (arrow keys for font properties) — completes design tool set
- Guides tool (alignment gridlines) — wraps existing `guides.ts` as tool
- Text edit mode wiring verification — confirm it works end-to-end
- Legacy `content/features/` cleanup — remove files superseded by `modes/tools/`
- Panel message wiring for new tools

**Exclude (dropped or deferred):**
- Annotate mode 4.2–4.5 — dropped, comment/question is the system
- Popover API overlay — nice-to-have, defer
- Group/ungroup — low priority, defer
- A11y tool as design sub-mode — absorbed into inspect mode's A11y tab
- Inspector mode (Task 5.2) — done via unified inspect

---

### Plan 4: Chrome Side Panel

**Scope:** Replace DevTools panel as the primary power UI surface.

**Depends on:** Plan 2 (pipeline refactor — background owns state)

**Brainstorms to consolidate:**
- `2026-02-20-fab-first-architecture-brainstorm.md` (decisions 1, 4, 5)
- `2026-02-20-side-panel-brainstorm.md` (layout, rail tabs, prompt builder)

**Key deliverables:**
- `chrome.sidePanel` registration + basic shell
- Rail tabs: Layers (stub), Components, Assets, Variables, Designer
- Bottom dock: Clipboard (auto-accumulated) + Prompt Builder (replaces Cmd+K)
- V-mode on FAB → chips in Side Panel prompt builder
- Sunset Cmd+K spotlight (`spotlight.ts` + `PromptPalette.tsx`)

**Needs detailed plan written** — this brainstorm provides the stub.

---

### Plan 5: Layers Panel

**Scope:** Webflow Navigator-style DOM tree as default Side Panel tab.

**Depends on:** Plan 4 (Side Panel infrastructure)

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

**Needs detailed plan written** — this brainstorm provides the stub.

---

## Execution Order

```
Plan 0: Cleanup & Stabilize ──→ Plan 1: Test Stabilization ──→ Plan 2: Pipeline Refactor
                                                                        │
                                                               Plan 3: VisBug Final Pass
                                                                        │
                                                               Plan 4: Chrome Side Panel
                                                                        │
                                                               Plan 5: Layers Panel
```

Plans 2 and 3 can run in parallel (different files, no overlap). Plans 4 and 5 are sequential.

## Open Questions

- Should Plan 3 (VisBug final pass) block on Plan 2 (pipeline refactor), or can they overlap since they touch different files?
- Exact scope of the DevTools panel redesign (CDP-only lens) — defer brainstorm until Side Panel is live?
- React DevTools integration (inline props/state editing) — separate plan after Layers Panel, or fold into Plan 5?

## Research Notes

- 43 test files, 259 tests, 2 failing (`measurements.test.ts`, `positionTool.test.ts`)
- `sidecar-client.ts` already has bidirectional messaging (Tasks 1.1, 1.2 of pipeline plan done)
- `@flow/shared` already has `Feedback` type (Task 1.1 of pipeline plan done)
- `sidecarSync.ts` still exists (Phase 4 deletion still needed)
- No `backgroundSessionStore.ts`, `backgroundCompiler.ts`, or `keepalive.ts` yet
- VisBug port plan: 14 of 30 tasks complete, 16 remaining (now ~10 after drops)
- Debug `console.log` statements in `panelRouter.ts` need removal
- Merged layout panel and move mode are implemented but plans not archived
