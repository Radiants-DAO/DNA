# Merged Layout Panel Brainstorm

**Date:** 2026-02-20
**Status:** Decided

## What We're Building

Merge the Spacing tool (sub-mode 1) and Layout tool (sub-mode 2) into a single "Layout" panel — Figma-inspired, compact, with a redesigned hotkey system. Simultaneously extract DOM reorder into a new top-level Move mode (`M`).

## Panel Structure (top to bottom)

### 1. Shared header
Sub-mode switcher dropdown (existing `toolPanelHeader`).

### 2. Display mode selector
Row of icon tabs for the common modes: **flex-row, flex-col, grid, block**. Dropdown overflow for inline variants (`inline`, `inline-block`, `inline-flex`, `inline-grid`) and `none`.

### 3. Alignment section (flex/grid only)
- 3x3 dot grid for justify/align (interactive, keyboard-navigable)
- X/Y dropdowns alongside the grid for explicit value selection
- Gap input(s) with lock toggle (row-gap / column-gap)

### 4. Flex-specific controls (when display=flex)
- Wrap dropdown (nowrap / wrap / wrap-reverse)
- Direction is implicit from the icon tabs (row vs column selected above)

### 5. Grid-specific controls (when display=grid)
- Cols / Rows spinners
- Grid alignment dropdowns (justify-items / align-items)

### 6. Spacing section
- **Margin/Padding tab** switcher (two small tabs)
- **Default: 2-input mode** — Horizontal value + Vertical value, each with Figma-style box-model icons
- **Expanded: 4-input mode** — Click the 4-sides icon to expand to T/R/B/L
- **Scrub labels** on all inputs (drag to adjust)
- **Box-sizing** toggle (content-box / border-box)

## Hotkey Design

### Alignment (arrows on 3x3 grid)

Direction-aware: arrow mapping rotates based on flex-direction so it always feels spatial.

| Keys | In row mode | In column mode |
|------|-------------|----------------|
| `←→` | Cycle justify-content | Cycle align-items |
| `↑↓` | Cycle align-items | Cycle justify-content |
| `Shift+←→` | Cycle justify distribute (space-between → space-around → space-evenly) | Cycle align distribute |
| `Shift+↑↓` | Cycle align (stretch → baseline) | Cycle justify distribute |
| `Cmd+↑↓` | Toggle flex-direction (row ↔ column) | Toggle flex-direction |

All arrow hotkeys are **disabled when a panel input is focused** — arrow keys in focused inputs step that input's value instead.

### Spacing (no global arrow keys)

Spacing adjustment is panel-only:
- **Scrub labels:** Drag on input label = step through Tailwind spacing scale. Alt+drag = raw px.
- **Focused input arrows:** ArrowUp/Down in a focused spacing input steps through TW scale. Shift = 10px jumps. Alt = 0.1px fine control.

### On-element drag handles

- **4 padding handles visible by default** (one per edge)
- **Hold Alt: handles switch to margin**
- Drag modifiers: Shift = all 4 sides, Alt (during drag) = opposing edge pair
- Gap visualization: shown on hover over the gap input only, not persistent

## Mode Map (after merge)

### Design sub-modes (D → number):

| Key | ID | Label | What it covers |
|-----|----|-------|----------------|
| 1 | layout | Layout | Spacing + display + flex/grid alignment + gap |
| 2 | color | Color | Semantic color picker |
| 3 | typography | Typography | Font properties |
| 4 | effects | Effects | Shadows, filters, blend |
| 5 | position | Position | CSS position, offsets, z-index |
| 6 | guides | Guides | Click-to-anchor measurements |
| 7 | accessibility | Accessibility | WCAG audit |

### Top-level modes:

| Key | Mode | Notes |
|-----|------|-------|
| D | Design | Parent mode, defaults to Layout (sub-mode 1) |
| M | Move | DOM reorder via arrow keys + drag-and-drop repositioning |
| C | Comment | Feedback |
| Q | Question | AI question |
| S | Search | Selector/text/fuzzy |
| I | Inspector | CSS tooltip |
| T | Edit Text | In-place text editing |
| Esc | Default | Exit to no-mode |

## Key Decisions

- Spacing and Layout merge into one panel; no separate sub-modes
- `DesignSubMode` type drops `'spacing'`, renames to just `'layout'` covering everything
- Arrow keys = alignment grid navigation (not spacing)
- Shift+arrow = distribute/stretch cycling on the alignment grid
- Direction-aware: arrow axes swap to stay spatial in column mode
- Margin/Padding shown via Figma-style tab + H/V inputs (expandable to 4-side)
- Scrub labels: TW scale default, Alt+drag for raw px
- On-element handles: padding by default, Alt for margin
- Move mode (`M`) becomes top-level, extracted from positionTool's DOM reorder section
- Move mode supports both arrow-key reorder AND drag-and-drop

## Resolved Questions

- **Grid mode:** Gets its own Figma-style visualization (grid preview with cols×rows label, not the 3x3 dot grid). Full grid mode pass planned separately — will eventually include Webflow-style on-canvas grid editor.
- **Gap:** Single `gap` value with lock toggle to split into `row-gap` / `column-gap`.
- **Move mode:** Deferred to its own brainstorm — needs additional setup beyond this merge.

## Research Notes

- `spacingTool.ts`: 8 overlay drag handles, TW scale stepping, box-model visualization (being removed)
- `layoutTool.ts`: display tabs, flex section (direction/wrap/alignment/gap), grid section (cols/rows/gap)
- `positionTool.ts`: DOM reorder section (moveUp/moveDown/promote/demote) — to be extracted into Move mode
- `modeHotkeys.ts`: registers top-level + sub-mode number keys via `registerHotkeys()`
- `toolPanelHeader.ts`: singleton dropdown already handles sub-mode switching from panel header
- Existing keyboard guard: `shouldIgnoreKeyboardShortcut()` + `isEditableElement()` already gate shortcuts when inputs are focused — covers the "disable arrows in focused input" requirement
- Effects and typography tools already have scrub label implementations that can be reused
