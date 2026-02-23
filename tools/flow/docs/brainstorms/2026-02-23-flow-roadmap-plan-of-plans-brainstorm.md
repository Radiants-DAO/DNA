# Flow Roadmap — Plan of Plans Brainstorm

**Date:** 2026-02-23 (revised)
**Status:** Decided
**Last audit:** 2026-02-23

## What We're Building

A sequenced roadmap: restore green baseline, stabilize the test suite, ship a final VisBug feature pass with the comment-mode composer fix, then execute the FAB-First architectural shift (Chrome Side Panel → Layers Panel) as one coordinated initiative. E2E smoke tests gate each major milestone.

## Why This Approach

The codebase shipped a huge amount of work in February: unified mutation engine, 8 design sub-mode tools, inspect mode, move mode, full MCP bidirectional pipeline, background-owned WebSocket, comment/feedback system. The pipeline refactor (originally Plan 2) is already done. What remains is hardening what exists, filling a few feature gaps, then building the next-gen UI surface (Side Panel replaces DevTools panel).

## Key Decisions

- **Pipeline refactor is done.** `backgroundSessionStore`, `backgroundCompiler`, `keepalive` all implemented. `sidecarSync.ts` deleted. Background owns the single WebSocket.
- **Drop annotate mode (tasks 4.2–4.5).** Comment/question mode is the shipped system. No parallel annotation system. Delete the annotation files.
- **Comment composer shim still needed.** Pipeline made comments panel-independent at the data layer, but the on-page UX (click element → type comment without opening DevTools) needs a content-script trigger (~20 lines in `content.ts`). The composer UI itself (`commentBadges.ts:openCommentComposer`) is fully built — it just lacks a content-script entry point.
- **Test-then-build.** But the baseline is worse than "1 failing test" — typecheck also fails. Fix both before adding new tests.
- **Typography tool is done.** 1,230 lines, wired as sub-mode 3. Removed from Plan 2's scope.

## Completed (formerly Plans 0–2)

### Pipeline Refactor (Plan 2) — DONE
All 4 phases complete:
- [x] Shared types + sidecar client bidirectional messaging
- [x] Background session store + comment capture + agent routing
- [x] FAB auto-sleep with keepalive alarm
- [x] Panel delegation + `sidecarSync.ts` deleted

---

## Codebase Audit (2026-02-23)

Full audit performed before planning. Findings ordered by severity.

### Findings

#### Red (blocks Plan 1 gate)

1. **Baseline is not green.** Typecheck fails (3 errors in `promptBuilderSlice.test.ts` — Zustand `StateCreator<AppState>` not assignable to `StateCreator<PromptBuilderSlice>`). One test fails (`measurements.test.ts` overlapping rects case expects `[]` but `computeMeasurements` returns 4 partial-overlap measurements for a containing rect).
   - `packages/extension/src/panel/stores/slices/__tests__/promptBuilderSlice.test.ts:7`
   - `packages/extension/src/content/__tests__/measurements.test.ts:47`
   - `packages/extension/src/content/measurements/measurements.ts:37`

2. **Screenshot feature wired to stub.** `ScreenshotPanel.tsx` sends `panel:screenshot` to content script. `panelRouter.ts:handleScreenshot` always returns `{ success: false }`. Meanwhile, `screenshotService.ts` has a working CDP implementation (`Page.captureScreenshot`) that is never called.
   - `packages/extension/src/panel/components/context/ScreenshotPanel.tsx:312`
   - `packages/extension/src/content/panelRouter.ts:398`
   - `packages/extension/src/panel/api/screenshotService.ts:16`

3. **MCP `flow_get_component_tree` returns empty data.** Server-side tool exists and queries `contextStore.getComponentTree()`. But extension-side emission is commented out (`background.ts:253` has `// TODO: Handle component-tree when React DevTools integration is available`). Tool will always return `[]` in real sessions.
   - `packages/extension/src/entrypoints/background.ts:253`
   - `packages/server/src/routes/mcp.ts:565`

#### Yellow (tech debt, not blocking)

4. **Orphaned context panels.** `SearchPanel`, `ImageSwapPanel`, `ScreenshotPanel` are exported from `context/index.ts` but never imported by any component. Not in `LeftTabBar` tabs or `EditorLayout.TabContent`. (Note: `AccessibilityAuditPanel` IS wired — it's a different component from `context/AccessibilityPanel`.)
   - `packages/extension/src/panel/components/context/index.ts:8`
   - `packages/extension/src/panel/components/layout/LeftTabBar.tsx:27`

5. **Dead compatibility code from Tauri port.** Zero runtime consumers:
   - `useBridgeConnection.ts` — 210 lines, never imported
   - `useFileWrite.ts` — stub, never imported
   - `useFileWatcher.ts` — stub, never imported
   - `useDevServer.ts` — stub, never imported
   - `ModeToolbar.tsx` — never imported (on-page toolbar in `content/ui/toolbar.ts` replaced it)
   - `handleGetComponentMap()` in `panelRouter.ts:440` — dead handler, self-documented as dead code

6. **Dead annotation system.** Decision to drop annotate mode made, but files still exist:
   - `content/annotationHandler.ts` — zero importers
   - `content/annotationBadges.ts` — only imported by `annotationHandler.ts`
   - `panel/stores/slices/annotationSlice.ts` — wired into appStore but no component reads/writes it
   - `shared/src/types/annotations.ts` — type defs for the dropped system
   - **Not useful for commenting.** `commentBadges.ts` (640 lines) fully supersedes `annotationBadges.ts` (96 lines) in every feature: color-coded badges, hover tooltips, inline composer, linked badges, anchor pulse animation.

7. **Stub-era store slices.** Wired into appStore but contain no real logic. Actions are no-ops:
   - `workspaceSlice.ts` — `scanProjectRoot` is a no-op
   - `assetsSlice.ts` — actions marked "stubbed for extension"
   - `componentsSlice.ts` — "stubbed for extension context"
   - `tokensSlice.ts` — "stubbed for extension context"
   - **Keep for now:** These have correct type shapes matching planned sidecar API. Remove only when Side Panel replaces them.

8. **Rectangle selection stub.** `bridgeSlice.ts:selectComponentsInRect` logs "not implemented" and falls back.

#### Green (low-priority, track)

9. **BoxShadowsSection.tsx:27** — `TODO: Parse boxShadow string to LayersValue`. Editor creates new shadows but can't hydrate existing `box-shadow` values. `boxShadowParser.ts` exists with 15 passing tests — just needs wiring.

10. **Docs/scripts drift.** Root `README.md` and `package.json` scripts reference only `@flow/extension`. Server package (`@flow/server`) isn't in `pnpm dev` or documented. Minor, but new contributors won't discover it.

### Dead Code Summary

| Category | Files | Action |
|----------|-------|--------|
| Annotation system | `annotationHandler.ts`, `annotationBadges.ts`, `annotationSlice.ts`, `types/annotations.ts` | Delete in Plan 0 |
| Tauri compat hooks | `useBridgeConnection.ts`, `useFileWrite.ts`, `useFileWatcher.ts`, `useDevServer.ts` | Delete in Plan 0 |
| Dead panel component | `ModeToolbar.tsx` | Delete in Plan 0 |
| Dead handler | `handleGetComponentMap()` in panelRouter.ts | Delete in Plan 0 |
| Unreachable panels | `context/SearchPanel.tsx`, `context/ImageSwapPanel.tsx`, `context/ScreenshotPanel.tsx` | Keep — wire into Side Panel (Plan 3) or delete then |
| Canvas/spatial utils | 11 files (~1,500 lines) in hooks + utils + types | Keep — potential use in Plans 3–4 |
| Stub slices | workspace, assets, components, tokens | Keep — correct shapes for sidecar integration |

### Unimplemented Features

| Feature | Where | Notes |
|---------|-------|-------|
| Content-script comment trigger | `content.ts` | `openCommentComposer` exists but only reachable via panel message. Need ~20 lines to trigger on click in comment/question mode. |
| Screenshot CDP wiring | `ScreenshotPanel` → `screenshotService.ts` | Service exists, panel sends wrong message path |
| Component tree forwarding | `background.ts` → sidecar | TODO comment, no emission |
| Box shadow hydration | `BoxShadowsSection.tsx` | Parser exists, just needs wiring |

---

## The Roadmap

### Plan 0: Restore Green Baseline + Cleanup

**Scope:** Fix all typecheck errors and test failures. Delete confirmed dead code. Wire comment composer to content script. Get to a clean, honest baseline.

**Gate:** `pnpm typecheck` passes AND `pnpm test` passes (all packages, zero failures).

**Tasks (ordered):**

#### 0.1: Fix typecheck — promptBuilderSlice.test.ts

The test creates a standalone store with `create<PromptBuilderSlice>()(createPromptBuilderSlice)` but the slice creator is typed `StateCreator<AppState, [], [], PromptBuilderSlice>` — it expects the full AppState. Fix the test to either:
- (a) Cast the creator: `create<PromptBuilderSlice>()(createPromptBuilderSlice as any)`, or
- (b) Create a proper test helper that builds a minimal AppState with only the needed slices.

Option (b) is better if other slice tests share the pattern. Check if `commentSlice.test.ts` or `mutationSlice.test.ts` have the same pattern.

- File: `packages/extension/src/panel/stores/slices/__tests__/promptBuilderSlice.test.ts:7`

#### 0.2: Fix test — measurements.test.ts overlapping rects

The test expects `[]` for a containing rect (a fully wraps b). But `computeMeasurements` intentionally measures partial-overlap distances when `a.right > b.left` etc. The implementation has `// Partial overlap` branches that fire even for full containment, AND explicit `// Containing` branches.

Two options:
- (a) **Fix the test:** Containing rects DO have meaningful distances (how far inside b is from a's edges). Update the test to expect the 4 measurements.
- (b) **Fix the implementation:** Add an early return when one rect fully contains the other.

Decide based on how the measurements are used in practice (inspect ruler). If the ruler shows "5px from left edge" for nested elements, option (a) is correct.

- File: `packages/extension/src/content/__tests__/measurements.test.ts:47`
- File: `packages/extension/src/content/measurements/measurements.ts:37`

#### 0.3: Delete dead annotation system

Remove 4 files + all references:
- Delete: `packages/extension/src/content/annotationHandler.ts`
- Delete: `packages/extension/src/content/annotationBadges.ts`
- Delete: `packages/extension/src/panel/stores/slices/annotationSlice.ts`
- Delete: `packages/shared/src/types/annotations.ts`
- Modify: `packages/extension/src/panel/stores/slices/index.ts` — remove `createAnnotationSlice` export
- Modify: `packages/extension/src/panel/stores/appStore.ts` — remove `createAnnotationSlice` import and spread
- Modify: `packages/extension/src/panel/stores/types.ts` — remove `AnnotationSlice` from `AppState`
- Modify: `packages/shared/src/index.ts` — remove annotations type export (if present)

Verify: `pnpm typecheck && pnpm test`

#### 0.4: Delete dead Tauri compat code

Remove 5 files + references:
- Delete: `packages/extension/src/panel/hooks/useBridgeConnection.ts`
- Delete: `packages/extension/src/panel/hooks/useFileWrite.ts`
- Delete: `packages/extension/src/panel/hooks/useFileWatcher.ts`
- Delete: `packages/extension/src/panel/hooks/useDevServer.ts`
- Delete: `packages/extension/src/panel/components/ModeToolbar.tsx`
- Modify: `packages/extension/src/panel/hooks/index.ts` — remove all exports for the 4 deleted hooks

Verify: `pnpm typecheck && pnpm test`

#### 0.5: Remove dead panelRouter handler

- Modify: `packages/extension/src/content/panelRouter.ts`
  - Remove `handleGetComponentMap()` function (line ~440–470)
  - Remove its case from the message router switch
  - Remove the `ComponentMapResponse` type if only used here

Verify: `pnpm typecheck && pnpm test`

#### 0.6: Wire comment composer to content script

`commentBadges.ts:openCommentComposer()` is fully built (inline Shadow DOM textarea, Cmd+Enter to submit, Escape to cancel). But it's only reachable via `panelRouter.ts:handleCommentCompose()` which requires a `panel:comment-compose` message from DevTools.

Add ~20 lines to `content.ts` in the click handler: when mode is `comment` or `question` (via port message from panel's `setActiveFeedbackType`), intercept clicks and call `openCommentComposer` directly.

- Modify: `packages/extension/src/entrypoints/content.ts`
  - Import `openCommentComposer` and `setCommentBadgeCallbacks` from `commentBadges.ts`
  - In the port message handler, listen for `panel:set-feedback-type` to track active comment/question mode
  - In the click handler (or add a new comment-mode click path), when comment mode is active, call `openCommentComposer({ type, selector, componentName, x: e.clientX, y: e.clientY })`
  - Wire `setCommentBadgeCallbacks({ onCreate })` to forward new comments to the port

Verify: Manual test — enable comment mode from panel, click element on page, verify composer appears without DevTools panel interaction.

#### 0.7: Verify baseline

Run full verification:
```bash
pnpm typecheck        # 0 errors
pnpm test             # all packages, 0 failures
pnpm build            # builds cleanly
```

**Commit:** `chore: restore green baseline — fix typecheck, tests, delete dead code, wire comment composer`

---

### Plan 1: Test Stabilization

**Scope:** Add unit tests for all untested content-script tools. Gate: all tests green before Plan 2.

**Depends on:** Plan 0 (baseline green)

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

**Scope:** Remaining high-value features from the VisBug port plan. Cherry-picked for impact.

**Depends on:** Plan 0 (baseline green). Can overlap Plan 1 (different files).

**Include:**
- Copy/paste styles (Cmd+Alt+C/V) — universally useful
- Keyboard element traversal (Tab/Enter) — big UX win
- Guides tool (sub-mode 6) — wraps existing measurement code as design tool
- Text edit mode wiring verification — confirm end-to-end
- Wire screenshot to CDP service — replace stub with real `screenshotService.ts`
- Wire BoxShadowsSection to existing `boxShadowParser.ts`
- Panel message wiring for all tools

**Exclude (dropped or deferred):**
- Annotate mode 4.2–4.5 — dropped, comment/question is the system (deleted in Plan 0)
- Typography tool — already done
- Popover API overlay — defer
- Group/ungroup — defer
- A11y tool as separate sub-mode — absorbed into inspect mode A11y tab
- Inspector mode — done as unified inspect
- Legacy `content/features/` cleanup — most files are still used by tools (only `registry.ts`, `index.ts` are candidates; not worth a separate task)

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
- Wire orphaned context panels (Search, ImageSwap, Screenshot) or delete

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
- Wire `flow_get_component_tree` MCP tool — implement component-tree emission from background.ts

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
- Plan 0 gate: typecheck + all tests green
- Plan 1 gate: all unit tests green
- Plan 2 gate: comment composer works without DevTools, copy/paste styles, keyboard traversal, screenshot capture works
- Plan 3 gate: Side Panel opens, shows data for selected element
- Plan 4 gate: Layers tree renders, bidirectional selection sync

---

## Execution Order

```
Plan 0: Restore Green Baseline + Cleanup  ←── YOU ARE HERE
        │
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
- Context panels (Search/ImageSwap/Screenshot) — wire into Side Panel in Plan 3, or delete as dead weight?

## Research Notes (updated 2026-02-23)

- 46 test files, 284 passing, 1 failing (`measurements.test.ts` overlapping rects)
- Typecheck fails: 3 errors in `promptBuilderSlice.test.ts` (StateCreator generic mismatch)
- Server: 10 test files, 120 passing, 0 failing
- Debug logs already removed (commit 1628d35)
- Worktree merged and cleaned (only main remains)
- `sidecarSync.ts` deleted, `backgroundSessionStore/Compiler/keepalive` all exist with tests
- VisBug port: ~27/39 tasks done, 12 remaining (8 after drops)
- 5 brainstorms archived, 5 active, 1 is this file
- Dead code audit: 4 annotation files, 5 Tauri compat files, 1 dead component, 1 dead handler — all confirmed zero importers
- Screenshot: CDP service exists (`screenshotService.ts`, 88 lines) but panel routes through content script stub
- Component tree: MCP tool exists server-side, background.ts has commented-out forwarding
- Comment composer: `openCommentComposer()` fully built in `commentBadges.ts` (640 lines), needs content-script trigger only
