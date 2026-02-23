# Move Mode (M) Brainstorm

**Date:** 2026-02-20
**Status:** Decided

## What We're Building

A new top-level mode activated by pressing `M`. Provides on-canvas DOM reordering via two interaction patterns: arrow keys for precise step-by-step reorder, and drag-and-drop with live sibling reflow preview. Elements can be reordered within the same parent, with Cmd/Ctrl held during drag to reparent (promote/demote).

## Why This Approach

Extracted from the Position tool (sub-mode 5) so Position focuses purely on CSS positioning. Move mode gets its own top-level hotkey because DOM reordering is a fundamentally different operation from CSS property editing — it's structural, not stylistic. The placeholder-driven drag approach lets the browser handle reflow animation across all layout types (flex, block, grid) without layout-specific code.

## Interaction Design

### Activation
- Press `M` to enter Move mode (top-level, same tier as D/C/Q/S/I/T).
- Hover highlights potential targets (reuses existing hover overlay).
- **Click** an element to select it for keyboard reorder.
- **Mousedown + drag** starts the drag-and-drop flow.

### Arrow Key Reorder (extracted from positionTool)
| Keys | Action |
|------|--------|
| `↑` | Move selected element before previous sibling |
| `↓` | Move selected element after next sibling |
| `←` | Promote (move up one level in DOM tree) |
| `→` | Demote (nest into previous sibling) |
| `Shift+↑` | Jump to first child |
| `Shift+↓` | Jump to last child |

All reorder operations use `recordCustomMutation` for undo/redo.

### Drag-and-Drop

**Drag start (mousedown + threshold):**
- 3px movement threshold before drag initiates (prevents accidental drags on click).
- Snapshot the element's DOM position (parent + nextSibling).
- Set the element to `position: fixed` at its current screen coordinates.
- Apply elevated visual: full opacity, strong drop shadow, slight scale-up (1.02).
- Insert a placeholder `<div>` at the element's original DOM position with matching dimensions.
- Add `transition: transform 0.15s ease-out` to siblings for smooth reflow animation.

**Dragging (mousemove):**
- Element follows cursor (update fixed left/top).
- Calculate nearest sibling gap: compare cursor position against sibling midpoints along the parent's flow axis.
- Move the placeholder to the target gap position. Browser reflows siblings naturally (flex, block, grid all handled by layout engine).
- **Cmd/Ctrl held:** enable reparent mode — dragging near a sibling's edge nests into it (demote), dragging outside parent boundary promotes.

**Drop (mouseup):**
- Remove placeholder.
- Remove `position: fixed` and elevated styles from element.
- Insert element at the placeholder's final DOM position.
- Single `recordCustomMutation` call (before snapshot → after snapshot).
- Flash the element briefly (reuse existing `flashDropZone` pattern).

**Cancel (Escape during drag):**
- Remove placeholder.
- Restore element to original DOM position (revert to before snapshot).
- Remove all temporary styles.

### Visual Feedback
- **Dragged element:** Full opacity, `box-shadow: 0 12px 40px rgba(0,0,0,0.3)`, `transform: scale(1.02)`, `z-index: 2147483647`.
- **Placeholder:** Dashed border, same dimensions as original element, semi-transparent background.
- **Siblings:** Smooth CSS transition as they reflow around the moving placeholder.
- **On drop:** Brief flash animation on the settled element (300ms, same as existing `flashDropZone`).
- **Status indicator:** Floating label near cursor showing "child N of M" during drag.

## Key Decisions

- Move is a **top-level mode** (`M` key), not a design sub-mode
- Arrow key reorder is extracted from positionTool (positionTool keeps CSS position/offsets/z-index only)
- Drag uses **placeholder-driven reflow** — browser layout engine handles flex/block/grid animation
- Single undo entry per drop (no intermediate tracking)
- **Cmd/Ctrl during drag** enables reparent (promote/demote)
- Dragged element visual: full element at full opacity with drop shadow + slight scale-up
- Same-parent reorder by default; modifier key for tree navigation
- Layers panel integration deferred to its own brainstorm

## Mode System Changes

Add to `TopLevelMode` union:
```
| 'move'  // M - DOM reorder + drag-and-drop
```

Add to `TOP_LEVEL_MODES` config:
```
{
  id: 'move',
  hotkey: 'm',
  label: 'Move',
  interceptsEvents: true,
  showsHoverOverlay: true,
}
```

## Resolved Questions

- **Layers panel:** Separate brainstorm. Will integrate with Move mode's reorder engine later.
- **Grid layout during drag:** Placeholder-driven approach handles grid naturally — browser reflows grid items around the placeholder.
- **Undo model:** Single snapshot pair (before drag → after drop). No intermediate states.

## Research Notes

- `positionTool.ts` lines 448–486: reorder UI section (to be removed from position tool)
- `positionTool.ts` lines 677–768: 6 move functions + `commitReorderMutation` (to be extracted)
- `positionTool.ts` lines 824–858: arrow key handler (to be extracted)
- `eventInterceptor.ts`: `onMouseMove` registered as passive — drag needs a non-passive listener for `preventDefault` (text selection suppression). Will need either a separate listener or interceptor modification.
- `spacingTool.ts` drag handles: reference for the 3px threshold + Shift/Alt modifier pattern during drag
- `flow-0-ref/app/components/layout/LeftPanel.tsx` lines 587–1089: `LayersContent` reference implementation — recursive DOM tree view, no DnD yet
