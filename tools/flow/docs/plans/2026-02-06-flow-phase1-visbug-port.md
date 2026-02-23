# Phase 1: VisBug Port + UI Finalization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild Flow's UI around a tool-based paradigm (VisBug-style), with Design Mode as a parent mode containing sub-modes, Annotate mode (Agentation-style), and a proper selection/overlay system.

**Architecture:** Default state is no mode (page interactive). Top-level modes (Select, Design, Annotate, Search, Inspector, Edit Text) activated via hotkeys + toolbar. Design Mode contains 9 sub-modes (Position, Spacing, Flex, Move, Color, Effects, Typography, Guides, Accessibility) selected via number keys with a floating grid toolbar. All mutations flow through a unified pipeline with single undo/redo stack.

**Tech Stack:** WXT, React 19, TypeScript, Zustand 5, Tailwind v4, Shadow DOM

**Brainstorm:** `docs/brainstorms/2026-02-06-flow-phase1-visbug-port-brainstorm.md`
**Research:** `docs/solutions/2026-02-06-inspector-vs-flow-comparison.md`
**VisBug Reference:** `reference/ProjectVisBug-main/`
**Flow 0 Reference:** Tools at `../flow-0/`

---

## Completion Status

| Group | Done | Remaining |
|-------|------|-----------|
| 0: Foundation | 4/4 | — |
| 1: Mode System | 8/8 | — |
| 2: Design Tools | 8/9 + wiring done | 1 tool (guides) |
| 3: Global Features | 2/5 | 3 features |
| 4: Annotate Mode | 1/5 | 4 tasks |
| 5: Edit Text + Inspector | 2/2 | — (Inspector → Inspect mode, separate plan) |
| 6: Integration + Cleanup | 1/5 | 4 tasks |

---

## Task Group 0: Foundation — COMPLETE

- [x] Task 0.1: Audit Current Mutation Systems
- [x] Task 0.2: Create Unified Mutation Engine (`unifiedMutationEngine.ts` + tests)
- [x] Task 0.3: Wire Unified Engine into Content Script (content.ts, panelRouter, mutationSlice)
- [x] Task 0.4: Box Shadow Parser (`boxShadowParser.ts` + 15 passing tests)

---

## Task Group 1: Mode System Architecture — COMPLETE

- [x] Task 1.1: Define Mode Types (`packages/shared/src/types/modes.ts`)
- [x] Task 1.2: Create Mode Controller (`modeController.ts` + tests)
- [x] Task 1.3: Register Hotkeys (`modeHotkeys.ts`)
- [x] Task 1.4: Event Interception Overlay (`eventInterceptor.ts`)
- [x] Task 1.5: Mode-Aware Hover Overlay (in content.ts)
- [x] Task 1.6: Mode State in Zustand Store (`modeSlice.ts`)
- [x] Task 1.7: Mode Toolbar Component (`ModeToolbar.tsx`)
- [x] Task 1.8: Contextual Panel Routing (RightPanel.tsx)

---

## Task Group 2: Design Mode Sub-Mode Tools

**Pattern established:** All tools follow a factory pattern:
- Keyboard tools (position, spacing, flex, move): `create*Tool({ shadowRoot, engine, onUpdate }) → { attach, detach, destroy }` — arrow key / modifier-based
- Popover tools (color, effects): Same factory, but render a floating panel with sliders/dropdowns in the shadow DOM

### Completed (implemented + tested, tool files exist):

- [x] Task 2.1: Spacing Tool — `spacingTool.ts` (469 lines) + tests
- [x] Task 2.2: Position Tool — `positionTool.ts` (265 lines) + tests
- [x] Task 2.3: Flex Align Tool — `flexTool.ts` (243 lines) + tests
- [x] Task 2.4: Move/Reorder Tool — `moveTool.ts` (309 lines) + tests
- [x] Task 2.5: Color Tool — `colorTool.ts` (468 lines) + `colorTool.css` + `colorTokens.ts` (was "Hue Shift" in original plan; implemented as semantic color picker popover with tabs, palette, alpha slider)
- [x] Task 2.6: Effects Tool — `effectsTool.ts` (737 lines) + `effectsTool.css` (was "Box Shadow" in original plan; expanded to cover opacity, blend mode, box-shadow, backdrop-filter, filter)

### Wiring — All tools wired into content.ts:

All design tools (color, effects, position, layout, typography, move) are imported, instantiated, and wired to the mode subscription in `content.ts`. Spacing was merged into layoutTool. Flex was merged into layoutTool. Sub-modes renumbered 1-7.

---

### Task 2.W: Wire keyboard tools into content script — DONE

> Completed — all tools wired. Spacing/flex merged into layoutTool, move extracted to top-level mode.

**Files:**
- Modify: `packages/extension/src/entrypoints/content.ts`

**Step 1: Import the 4 tools**

After the existing effectsTool import:

```typescript
import { createSpacingTool } from '../content/modes/tools/spacingTool';
import { createPositionTool } from '../content/modes/tools/positionTool';
import { createFlexTool } from '../content/modes/tools/flexTool';
import { createMoveTool } from '../content/modes/tools/moveTool';
```

**Step 2: Instantiate**

After the effectsTool creation block, create all 4 with the same options pattern:

```typescript
const spacingTool = createSpacingTool({
  shadowRoot: overlayRoot,
  engine: unifiedMutationEngine,
  onUpdate: () => { port.postMessage({ type: 'mutation:updated', payload: null }); },
});

const positionTool = createPositionTool({
  shadowRoot: overlayRoot,
  engine: unifiedMutationEngine,
  onUpdate: () => { port.postMessage({ type: 'mutation:updated', payload: null }); },
});

const flexTool = createFlexTool({
  shadowRoot: overlayRoot,
  engine: unifiedMutationEngine,
  onUpdate: () => { port.postMessage({ type: 'mutation:updated', payload: null }); },
});

const moveTool = createMoveTool({
  shadowRoot: overlayRoot,
  engine: unifiedMutationEngine,
  onUpdate: () => { port.postMessage({ type: 'mutation:updated', payload: null }); },
});

let spacingToolAttached = false;
let positionToolAttached = false;
let flexToolAttached = false;
let moveToolAttached = false;
```

**Step 3: Add to mode subscription**

Extend the existing `cleanupToolWiring` subscriber (same pattern as color/effects blocks):

```typescript
// Position tool
if (state.topLevel === 'design' && state.designSubMode === 'position' && selectedElement) {
  if (!positionToolAttached) { positionTool.attach(selectedElement as HTMLElement); positionToolAttached = true; }
} else if (positionToolAttached) { positionTool.detach(); positionToolAttached = false; }

// Spacing tool
if (state.topLevel === 'design' && state.designSubMode === 'spacing' && selectedElement) {
  if (!spacingToolAttached) { spacingTool.attach(selectedElement as HTMLElement); spacingToolAttached = true; }
} else if (spacingToolAttached) { spacingTool.detach(); spacingToolAttached = false; }

// Flex tool
if (state.topLevel === 'design' && state.designSubMode === 'flex' && selectedElement) {
  if (!flexToolAttached) { flexTool.attach(selectedElement as HTMLElement); flexToolAttached = true; }
} else if (flexToolAttached) { flexTool.detach(); flexToolAttached = false; }

// Move tool
if (state.topLevel === 'design' && state.designSubMode === 'move' && selectedElement) {
  if (!moveToolAttached) { moveTool.attach(selectedElement as HTMLElement); moveToolAttached = true; }
} else if (moveToolAttached) { moveTool.detach(); moveToolAttached = false; }
```

**Step 4: Add to click handler**

In `onClick()`, after the effectsTool block, add re-attach logic for each:

```typescript
if (currentState.topLevel === 'design' && currentState.designSubMode === 'position') {
  positionTool.detach(); positionTool.attach(el as HTMLElement); positionToolAttached = true;
}
if (currentState.topLevel === 'design' && currentState.designSubMode === 'spacing') {
  spacingTool.detach(); spacingTool.attach(el as HTMLElement); spacingToolAttached = true;
}
if (currentState.topLevel === 'design' && currentState.designSubMode === 'flex') {
  flexTool.detach(); flexTool.attach(el as HTMLElement); flexToolAttached = true;
}
if (currentState.topLevel === 'design' && currentState.designSubMode === 'move') {
  moveTool.detach(); moveTool.attach(el as HTMLElement); moveToolAttached = true;
}
```

**Step 5: Add to cleanup**

In the disconnect handler, add:
```typescript
spacingTool.destroy();
positionTool.destroy();
flexTool.destroy();
moveTool.destroy();
```

**Step 6: Verify**

```bash
pnpm --filter @flow/extension typecheck
pnpm --filter @flow/extension test
pnpm --filter @flow/extension build
```

**Commit:** `feat: wire position, spacing, flex, and move tools into content script`

---

### Task 2.7: Typography Tool (Design Sub-Mode 3)

- [x] Implemented — `typographyTool.ts` (1,230 lines) + `typographyTool.css`, wired as sub-mode 3

**Files:**
- Create: `packages/extension/src/content/modes/tools/typographyTool.ts`

Follow the keyboard tool pattern (same as positionTool/spacingTool). Reference: `reference/ProjectVisBug-main/app/components/selection/font-styles.element.js`

**Behavior:**
- Up/Down: font-size (1px, Shift = 10px)
- Left/Right: text-align (cycle left/center/right/justify)
- Alt+Up/Down: line-height (0.1 increments)
- Alt+Left/Right: letter-spacing (0.5px increments)
- Cmd+Up/Down: font-weight (cycle 100-900)
- Cmd+B: bold toggle, Cmd+I: italic toggle

**Factory:** `createTypographyTool({ shadowRoot, engine, onUpdate }) → { attach, detach, destroy }`

**Step 1: Write tests** (`content/__tests__/typographyTool.test.ts`)
**Step 2: Implement tool**
**Step 3: Wire into content.ts** (same pattern as other keyboard tools)
**Step 4: Verify** — typecheck + test + build

**Commit:** `feat: add typography tool with arrow keys for font property editing`

---

### Task 2.8: Guides Tool (Design Sub-Mode 8)

- [ ] Not yet implemented

**Files:**
- Create: `packages/extension/src/content/modes/tools/guidesTool.ts`
- Reference: existing `packages/extension/src/content/guides/guides.ts`

Wrap the existing guides implementation as a tool factory. Add click-to-anchor distance measurement (VisBug pattern).

Reference: `reference/ProjectVisBug-main/app/components/selection/guides.element.js`

**Factory:** `createGuidesTool({ shadowRoot, engine, onUpdate }) → { attach, detach, destroy }`

**Commit:** `feat: guides tool as design sub-mode with click-to-anchor measurements`

---

### Task 2.9: Accessibility Tool (Design Sub-Mode 7)

- [x] Implemented as design sub-mode 7 (`'accessibility'` in DESIGN_SUB_MODES). Panel at `AccessibilityAuditPanel.tsx`, feature logic at `content/features/accessibility.ts`. A11y also available in Inspect mode's A11y tab.

**Files:**
- Create: `packages/extension/src/content/modes/tools/accessibilityTool.ts`

Wrap existing accessibility logic as a tool factory. On attach, run WCAG audit on element and send results to panel.

**Behavior:**
- Click element to audit
- Compute WCAG 2.1 contrast ratio (text vs background)
- APCA contrast score
- AA/AAA compliance badges
- ARIA attribute listing
- Missing aria-label warnings for interactive elements
- Results shown in existing AccessibilityPanel

Reference: `reference/ProjectVisBug-main/app/components/selection/accessibility.element.js`

**Factory:** `createAccessibilityTool({ shadowRoot, engine, onUpdate }) → { attach, detach, destroy }`

**Commit:** `feat: accessibility audit tool with WCAG contrast and ARIA checks`

---

## Task Group 3: Global Features (Not Mode-Specific)

### Completed:

- [x] Task 3.4: Image Drag-and-Drop Swap — `content/features/imageswap.ts` + `panel/components/context/ImageSwapPanel.tsx`
- [x] Task 3.5: Search Tool — `content/features/search.ts` + `panel/components/context/SearchPanel.tsx`

### Remaining:

---

### Task 3.1: Copy/Paste Styles

- [ ] Not yet implemented

**Files:**
- Create: `packages/extension/src/content/clipboard/styleClipboard.ts`

**Behavior:**
- Cmd+Alt+C: Copy computed styles of selected element to internal clipboard
- Cmd+Alt+V: Paste styles to selected element via unified mutation engine
- Copy captures: color, backgroundColor, fontSize, fontWeight, fontFamily, lineHeight, letterSpacing, padding, margin, border, borderRadius, boxShadow, opacity, display, flexDirection, alignItems, justifyContent

Register hotkeys via the mode system — these work in any mode that has a selected element.

Reference: `reference/ProjectVisBug-main/app/features/copy.js`

**Commit:** `feat: copy/paste styles with Cmd+Alt+C/V`

---

### Task 3.2: Group/Ungroup

- [ ] Not yet implemented

**Files:**
- Create: `packages/extension/src/content/dom/groupUngroup.ts`

**Behavior:**
- Cmd+G: Wrap selected element(s) in a `<div>` container
- Cmd+Shift+G: Unwrap (move children out, remove wrapper div)
- Both operations use the move tool's DOM undo approach (parent + nextSibling tuples) since the unified engine only handles style mutations

Reference: `reference/ProjectVisBug-main/app/features/grouping.js`

**Commit:** `feat: group/ungroup with Cmd+G and Cmd+Shift+G`

---

### Task 3.3: Element Keyboard Traversal

- [ ] Not yet implemented

**Files:**
- Create: `packages/extension/src/content/selection/keyboardTraversal.ts`

**Behavior:**
- Tab: Select next sibling
- Shift+Tab: Select previous sibling
- Enter: Select first child
- Shift+Enter: Select parent element
- Only works in modes with `showsHoverOverlay: true`
- Updates `selectedElement` in content.ts and re-runs inspection pipeline

Reference: `reference/ProjectVisBug-main/app/features/select.js`

**Commit:** `feat: keyboard element traversal (Tab/Enter for sibling/child navigation)`

---

## Task Group 4: Annotate Mode (Agentation-Style)

### Completed:

- [x] Task 4.1: Annotation Data Model — `annotationSlice.ts` exists with basic Annotation type

### Remaining:

---

### Task 4.2: Annotation Overlay (Content Script)

- [ ] Not yet implemented

**Files:**
- Create: `packages/extension/src/content/modes/tools/annotateTool.ts`
- Modify: `packages/extension/src/content/annotationBadges.ts` (existing badge rendering)

**Behavior:**
When Annotate mode (A) is active:
- Hover highlights elements (via event interception overlay — already works)
- Click creates annotation at click coordinates
- Show numbered badge at click position (color-coded by type)
- Port badge rendering from Flow 0's `CommentBadge.tsx`

**Commit:** `feat: annotate mode with click-to-annotate and numbered badges`

---

### Task 4.3: Annotation Popover Component

- [ ] Not yet implemented

**Files:**
- Create: `packages/extension/src/panel/components/AnnotationPopover.tsx`

Port `CommentPopover.tsx` from Flow 0:
- Smart viewport-aware positioning
- Textarea input (Enter to submit, Shift+Enter for newline, Escape to cancel)
- Component name in header
- Intent selector (fix / change / question / approve)
- Severity selector (blocking / important / suggestion)

**Commit:** `feat: annotation popover with intent and severity selectors`

---

### Task 4.4: Markdown Compilation

- [ ] Not yet implemented (annotationSlice exists but no compileToMarkdown)

**Files:**
- Modify: `packages/extension/src/panel/stores/slices/annotationSlice.ts`

Port the markdown compilation logic from Flow 0's `commentSlice.ts`:
- Group by file path, sort by line number
- Include rich context (provenance, props, parent chain)
- Format as structured markdown with component names and line numbers
- Support detail levels (compact / standard / detailed / forensic) from Agentation

**Commit:** `feat: annotation markdown compilation with detail levels`

---

### Task 4.5: Annotation Thread Panel

- [ ] Not yet implemented

**Files:**
- Create: `packages/extension/src/panel/components/AnnotationThreadPanel.tsx`

Panel shown when Annotate mode is active:
- List of all annotations (grouped by element/file)
- Each annotation shows: type badge, content, status indicator, timestamp
- Click to highlight annotated element on page
- Thread view: user messages + agent replies in conversation format
- Actions: acknowledge, resolve (with summary), dismiss (with reason)
- "Copy to Clipboard" button for markdown output

**Commit:** `feat: annotation thread panel with status lifecycle and copy-to-clipboard`

---

## Task Group 5: Edit Text Mode + Inspector Mode

### Partial:

- [x] Task 5.1 (partial): Edit Text Mode — `textEditMode.ts` and `TextEditMode.tsx` exist. Needs verification that it's properly wired to mode system hotkeys and event interception.

### Remaining:

---

### Task 5.1: Edit Text Mode Verification & Wiring

- [ ] Verify wiring

**Files:**
- Check: `packages/extension/src/content/mutations/textEditMode.ts`
- Check: `packages/extension/src/panel/components/TextEditMode.tsx`

Verify:
- `editText` mode triggers event interception
- Double-click in editText mode enters contenteditable
- Escape exits text editing (returns to default mode)
- Text changes go through unified mutation engine

Fix any gaps found.

**Commit:** (only if fixes needed) `fix: ensure edit text mode is fully wired to mode system`

---

### Task 5.2: Inspector Mode

- [x] SUPERSEDED — Replaced by unified Inspect mode (`I` hotkey) with hover tooltip, tabbed panel (Assets|Styles|A11y), and auto-ruler. See `2026-02-20-unified-inspect-mode.md`.

**Files:**
- Create: `packages/extension/src/content/modes/tools/inspectorTool.ts`
- Create: `packages/extension/src/panel/components/InspectorTooltip.tsx`

**Behavior:**
- Hover shows computed CSS tooltip (~35 curated properties)
- Click to pin tooltip (drag to reposition)
- Tooltip shows: tag, dimensions, padding/margin, colors, typography, flex/grid info
- Read-only — no mutations

Reference: `reference/ProjectVisBug-main/app/components/selection/inspector.element.js`

**Commit:** `feat: inspector mode with pinnable computed CSS tooltip`

---

## Task Group 6: Integration, Cleanup & Polish

### Completed:

- [x] Task 6.2: Designer Panel Redundancy Audit — RightPanel routes sections contextually

### Remaining:

---

### Task 6.0: Legacy features/ directory cleanup

- [ ] Not yet done

**Files:**
- Audit: `packages/extension/src/content/features/` (16 files)
- Potentially remove: `spacing.ts`, `colors.ts`, `position.ts`, `shadows.ts`, `move.ts`, `layout.ts`, `typography.ts` — these are superseded by `modes/tools/*`
- Keep: `hotkeys.ts`, `registry.ts`, `index.ts`, `styleUtils.ts`, `textEdit.ts`, `screenshot.ts`, `imageswap.ts`, `search.ts`, `accessibility.ts`

**Step 1:** Read each file in `content/features/`. Check if it's imported anywhere.
**Step 2:** For files with zero imports outside the features/ directory, remove them.
**Step 3:** For files still imported, trace the dependency and decide whether to migrate the consumer to use `modes/tools/` instead.

**Verify:** typecheck + test + build

**Commit:** `chore: remove legacy content/features/ files superseded by modes/tools/`

---

### Task 6.1: Popover API Overlay System

- [ ] Not yet implemented

**Files:**
- Create: `packages/extension/src/content/overlays/popoverOverlay.ts`

Feature-detect Popover API. If available, use it for selection rects, box model visualization, guides, and tool overlays. If not available, fall back to existing Shadow DOM approach.

Reference: `reference/ProjectVisBug-main/app/components/selection/overlay.js`

**Commit:** `feat: Popover API overlay system with Shadow DOM fallback`

---

### Task 6.3: Wire Panel Messages for All Tools

- [ ] Not yet done for new tools

**Files:**
- Modify: `packages/extension/src/content/panelRouter.ts`
- Modify: `packages/extension/src/entrypoints/panel/Panel.tsx`

Ensure the content↔panel message protocol supports:
- Tool-specific data (accessibility audit results, annotation data)
- Mutation diffs and undo/redo state updates
- Search results

**Commit:** `feat: extend content↔panel message protocol for all mode tools`

---

### Task 6.4: End-to-End Testing

- [ ] Not yet done for mode system

**Files:**
- Create: `packages/extension/src/__tests__/modeSystem-e2e.test.ts`

Test the full flow:
- Mode switching (default → design → sub-mode → default)
- Event interception (clicks blocked in design mode, pass through in default)
- Mutation through unified engine (apply, undo, redo, clearAll)
- Annotation creation and markdown compilation
- Keyboard traversal

**Verify:** `pnpm --filter @flow/extension test` — ALL PASS

**Commit:** `test: end-to-end tests for mode system, mutations, and annotations`

---

## Execution Order (Batches)

### Batch 1: Wire Existing Tools (Task 2.W)
Wire the 4 completed keyboard tools into content.ts. This is the highest-impact task — goes from 2 working tools to 6.

### Batch 2: Remaining Design Tools (Tasks 2.7, 2.8, 2.9)
Typography, guides, accessibility — complete the 9-tool design mode.

### Batch 3: Global Features (Tasks 3.1, 3.2, 3.3)
Copy/paste styles, group/ungroup, keyboard traversal.

### Batch 4: Annotate Mode (Tasks 4.2, 4.3, 4.4, 4.5)
Annotation overlay, popover, markdown compilation, thread panel.

### Batch 5: Edit Text + Inspector (Tasks 5.1, 5.2)
Verify edit text wiring, implement inspector mode.

### Batch 6: Integration & Cleanup (Tasks 6.0, 6.1, 6.3, 6.4)
Legacy cleanup, Popover API, panel messages, e2e tests.

---

## Summary (Updated 2026-02-23)

**12 remaining tasks:**
- Batch 2: 1 task — guides tool (sub-mode 6)
- Batch 3: 3 tasks — copy/paste styles, group/ungroup, keyboard traversal
- Batch 4: 4 tasks — annotation overlay, popover, markdown compilation, thread panel
- Batch 6: 4 tasks — legacy cleanup, popover API, panel messages, e2e tests

**27 tasks complete** (Groups 0-1 done, 8/9 design tools built + wired, spacing/flex merged into layout, typography built, move extracted to top-level, inspector superseded by unified inspect mode, effects done, all panel wiring done, mutation engine unified, undo/redo consolidated, comment mode wired, MCP tools complete, pipeline refactored, dead code cleaned).
