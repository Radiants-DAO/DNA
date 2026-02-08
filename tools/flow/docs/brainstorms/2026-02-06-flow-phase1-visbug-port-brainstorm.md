# Phase 1: VisBug Port + UI Finalization Brainstorm

**Date:** 2026-02-06
**Status:** Decided

## What We're Building

Phase 1 redefines Flow's UI around VisBug's tool-based paradigm. Each VisBug tool becomes a mode with its own interaction behavior and contextual panel. The existing designer panel sections become detail panels within tools — not a separate feature. Comments/questions mode follows the Agentation model (annotation → agent pipeline) and compiles to markdown (ported from Flow 0). The selection model is fixed: hover overlay activates when a tool is selected, and select+prompt makes the page non-interactable via event interception.

## Why This Approach

Feature-based (not layer-based) because VisBug tools directly inform the mutation engine — they're inseparable. Organizing by tool means each feature ships as a working vertical slice: interaction → mutation → undo → panel feedback. The designer panel is integrated into tools rather than being standalone, which may make some sections redundant (e.g., SpacingSection is superseded by VisBug's margin/padding tools with box model visualization).

## Key Decisions

- **Tool switching:** Both hotkeys (VisBug-style single-letter) AND a visible toolbar/mode bar. Hotkeys for power users, toolbar for discoverability.
- **Default mode:** No mode active. Page fully interactive, no overlays. User must explicitly activate a mode.
- **Selection model:** Hover overlay activates when a tool is selected. No alt+click. Select+prompt tool makes page non-interactable via transparent event-intercepting overlay.
- **Designer panel:** Contextual per-tool, not standalone. Some sections may be redundant with VisBug tools.
- **Annotate mode (A):** Merges comment + question into single Agentation-style mode. Port from Flow 0 + Agentation patterns.
- **Spacing sub-mode:** Merges margin + padding. Two colors (orange margin, green padding). Shift+drag = all sides, Alt+drag = opposing sides.
- **Move tool:** Inspector's full implementation (3 drag modes, snapping, resize) — NOT VisBug's simpler version. Planned for a later phase.
- **Scope:** VisBug gaps + upgrades to Flow's existing equivalents. Not a 1:1 VisBug clone.

## Phase 1 Feature Breakdown

### A. Core Selection & Overlay System (Foundation)

1. **Fix selection model** — Remove alt+click requirement. When any tool is active, hovering highlights elements. Click to select.
2. **Event interception overlay** — Transparent full-page overlay that intercepts all mouse events when in select/prompt mode. Page visible but non-interactable. Clicks routed to Flow, not page.
3. **Popover API overlays** — Port VisBug's top-layer overlay pattern. Render selection rects, box model vis, guides in browser's top layer (avoids z-index wars). Augment or replace current Shadow DOM overlays.
4. **Tool activation system** — Toolbar + hotkeys. Activating a tool enters its mode, shows its contextual panel, enables its overlay behavior. Only one tool active at a time (existing single-feature constraint).
5. **Element exclusion** — Ensure Flow's own UI elements (toolbar, panels, overlays) are excluded from selection. Port VisBug's `isOffBounds()` pattern.

### B. VisBug Tool Ports (Gaps)

6. **Move/Reorder tool (VisBug-level)** — Arrow key sibling reorder + basic drag grip handles. This is the simple version; Inspector-level move tool is Phase 4.
7. **Hue Shift tool** — Arrow keys for saturation/brightness, Cmd for hue/opacity, toggle fg/bg/border target. Maps to ColorsSection but with keyboard-first interaction.
8. **Box Shadow tool** — Arrow keys for X/Y offset, Alt for blur/spread, Cmd for opacity/inset. Replaces/upgrades BoxShadowsSection (which can't even parse existing shadows).
9. **Accessibility audit tool** — WCAG 2.1 contrast ratio, APCA contrast, AA/AAA compliance, ARIA attribute inspection. New capability.
10. **Search tool** — CSS selector search, text content search, fuzzy search, attribute search. Shadow DOM traversal. Plugin dispatch pattern (`/command`).

### C. VisBug Upgrades to Existing Features

11. **Box model visualization** — Pink/purple margin/padding overlay rendering. Flow has spacing handles but no full box model vis like VisBug's.
12. **Keyboard-driven spacing** — Arrow key margin/padding adjustment (VisBug's `m` and `p` tools). Upgrade Flow's mouse-only spacing handles.
13. **Keyboard-driven typography** — Arrow keys for size, line-height, letter-spacing, weight. Upgrade Flow's TypographySection with keyboard interaction.
14. **Keyboard-driven position** — Drag-to-position + arrow key nudge (1px / 10px with Shift). Upgrade Flow's PositionSection.
15. **Copy/Paste styles** — Cmd+Alt+C copies computed CSS, Cmd+Alt+V pastes to selection. New global feature.
16. **Group/Ungroup** — Cmd+G wraps selection in `<div>`, Cmd+Shift+G unwraps. New DOM operation.
17. **Element keyboard traversal** — Tab through siblings, Enter into children, Shift+Enter to parent. Flow is currently click-only.
18. **Image drag-and-drop swap** — Drag images between `<img>`, `<picture>`, and CSS `background-image` elements. Flow scans images but can't swap.

### D. Designer Panel Integration

19. **Contextual panel mapping** — Map each VisBug tool to its relevant designer section(s). When a tool is active, show only the relevant panel controls.
20. **Redundancy audit** — Determine which designer sections are fully superseded by VisBug tools vs which add value (e.g., LayoutSection for flex/grid editing may not have a VisBug equivalent).
21. **Unified mutation pipeline** — All tools (VisBug-style keyboard, designer panel, spacing handles) must go through one mutation system with one undo/redo stack.
22. **Change coalescing** — Batch rapid sequential changes (e.g., holding arrow key) into single undo steps.

### E. Comments/Questions Mode (Agentation Model)

23. **Port Flow 0 comment system** — Feedback data model, CommentBadge (numbered, color-coded), CommentPopover (textarea with smart positioning), CommentMode overlay.
24. **Markdown compilation** — Port `compileToMarkdown()` from Flow 0's commentSlice. Groups by file path, sorts by line number, includes rich context (provenance, props, parent chain).
25. **Comment/question types** — Two feedback types: comments (sky blue) and questions (sunset). Each with element selector, component name, source location, coordinates, rich context.
26. **Annotation status lifecycle** — Extend Flow 0's model with Agentation-style statuses: pending → acknowledged → resolved/dismissed. Track what agents have acted on.
27. **Multi-select annotations** — Shift+click to annotate multiple elements. Compiles as "Multiple Elements" group in markdown output.

### F. Infrastructure

28. **Unify mutation systems** — Merge `mutationEngine.ts` and `mutationRecorder.ts` into single system. All mutations (spacing handles, designer panel, VisBug tools, text edit) share one pipeline.
29. **Single undo/redo stack** — Connect the two disconnected systems (`useUndoRedo` hook + `editingSlice` store) into one global stack.
30. **Fix BoxShadowsSection parser** — Cannot parse existing `box-shadow` values. Blocks the box shadow tool.

## Mode Hierarchy (Decided)

### Top-Level Modes
| Mode (Hotkey) | Interaction | Panel |
|---------------|-------------|-------|
| **Default (none)** | No overlays, page fully interactive. User must explicitly activate a mode. | None |
| Select/Prompt | Hover highlights, click selects, page non-interactable via event interception overlay | Full context panel |
| **Design Mode (D)** | Parent mode — opens floating grid toolbar, number keys select sub-modes | Sub-mode's contextual panel |
| **Annotate (A)** | Click elements to annotate (Agentation-style). Merges comment + question into single mode. | Annotation thread panel |
| Search (s) | CSS selector / text / fuzzy / attribute search | Search results panel |
| Inspector (i) | Hover for computed CSS tooltip | Read-only property inspector |
| Edit Text (e) | Double-click for contenteditable (rewriting page text) | None (inline) |

### Design Mode Sub-Modes (D → number key)
Accessed by pressing D to enter Design Mode, then number keys to select. Floating grid toolbar appears above with tooltips.

| Sub-Mode (Key) | Interaction | Contextual Panel |
|----------------|-------------|-----------------|
| Position (1) | Drag + arrow key nudge (1px / 10px) | PositionSection |
| Spacing (2) | Merged margin+padding. Two colors (orange margin, green padding). Drag to adjust. Shift+drag = all sides, Alt+drag = opposing sides. Arrow keys also work. | SpacingSection |
| Flex Align (3) | Auto-sets flex, arrows for justify/align | LayoutSection |
| Move/Reorder (4) | Arrow key sibling reorder + drag grip | None (overlay-only) |
| Hue Shift (5) | Arrow keys for sat/brightness, Cmd for hue/opacity | ColorsSection |
| Box Shadow (6) | Arrow keys for X/Y, Alt for blur/spread | BoxShadowsSection |
| Typography (7) | Arrow keys for size, weight, line-height, etc. | TypographySection |
| Guides (8) | Click-to-anchor measurements, crosshair gridlines | None (overlay-only) |
| Accessibility (9) | WCAG contrast, APCA, AA/AAA, ARIA audit | Accessibility results panel |

## Open Questions

- Which designer sections survive the VisBug integration vs become redundant? (Needs hands-on audit during implementation)
- Should hotkeys work when typing in panels? (Probably need focus-aware suppression)
- How does the toolbar visually integrate with Flow's existing panel layout?
- Should comments persist across sessions or remain session-only like Flow 0?

## Research Notes

- **Flow 0 comment system**: Full implementation in `commentSlice.ts`, `CommentMode.tsx`, `CommentBadge.tsx`, `CommentPopover.tsx`. Feedback data model with rich context, provenance tracking, markdown compilation with file grouping and line sorting. Session-only storage.
- **VisBug source**: At `reference/ProjectVisBug-main/`. ~4-5K lines, 13 tools, Popover API overlays, closed Shadow DOM, `deepElementFromPoint`, `isOffBounds()`.
- **Flow's current state**: 3 Shadow DOM hosts, dual mutation systems (not connected), dual undo/redo (not connected), push-only sidecar, single-feature constraint in registry.
- **Comparison doc**: `docs/solutions/2026-02-06-inspector-vs-flow-comparison.md` with full implementation context appendix.
