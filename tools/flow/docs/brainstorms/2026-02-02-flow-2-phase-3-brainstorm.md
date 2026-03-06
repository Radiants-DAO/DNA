# Flow 2 Phase 3 — VisBug Port + Flow UI Migration Brainstorm

**Date:** 2026-02-02
**Status:** Decided

## What We're Building

Full reimplementation of VisBug's 20 content-script feature modules (4,818 lines) as TypeScript within the WXT extension, plus migration of Flow 0's React panel UI (~25K lines) into the DevTools panel. Every VisBug mutation outputs CSS-centric before/after diffs for LLM prompt compilation.

## Why This Approach

Branch A (build from scratch, inspired by VisBug) was chosen over forking. VisBug's vanilla JS is studied for patterns but all code is new TypeScript. The hybrid panel strategy uses the existing 9-section designer panel for CSS property editing, with additional contextual panels in DevTools for features that don't fit (a11y, search, image swap, screenshot).

## Key Decisions

- **Hybrid panel mapping:** Designer panel sections handle margin, padding, font, color, hueshift, boxshadow, flex, position (CSS property). Move, accessibility, image swap, search, and screenshot become contextual panels within DevTools (not floating windows).
- **Move ≠ Position:** `move.js` (drag-to-reposition in layout) is separate from the Position designer section (CSS `position` property). Move gets its own handling.
- **Screenshot kept:** Feeds MCP as visual prompt context, not deferred.
- **Measurements kept:** Distance measurement between elements, renders as overlay.
- **Diff format:** CSS-only (property: oldValue → newValue). Tailwind translation deferred to Phase 6 language adapters.
- **Color handling:** Port Flow 0's superior color picker and mode handling (reference: `flow-0/app/components/designer/ColorPicker.tsx`).
- **All hotkeys preserved:** Every VisBug keyboard shortcut carries forward alongside the panel UI.
- **Three sub-phases:**
  - **3a: Core Infrastructure** — selection/overlay/measurement/guides systems
  - **3b: Editing Features** — all 19 mutation modules reimplemented in TypeScript
  - **3c: Panel UI Migration** — Flow 0 React components + Zustand slices ported to DevTools panel

## VisBug Feature → Flow Panel Mapping

| VisBug Module | Lines | Flow Mapping |
|--------------|-------|-------------|
| `selectable.js` | 806 | Core infrastructure (Phase 1/3a) |
| `metatip.js` | 289 | Core infrastructure — overlay labels (3a) |
| `measurements.js` | 163 | Core infrastructure — distance overlays (3a) |
| `guides.js` | 107 | Core infrastructure — alignment gridlines (3a) |
| `margin.js` | 120 | Designer → Spacing section (3b) |
| `padding.js` | 124 | Designer → Spacing section (3b) |
| `font.js` | 190 | Designer → Typography section (3b) |
| `color.js` | 184 | Designer → Colors section (3b) |
| `hueshift.js` | 163 | Designer → Colors section (3b) |
| `boxshadow.js` | 114 | Designer → Shadows section (3b) |
| `flex.js` | 212 | Designer → Layout section (3b) |
| `position.js` | 242 | Designer → Position section (CSS position property) (3b) |
| `move.js` | 320 | Own handling — drag-to-reposition in layout (3b) |
| `text.js` | 37 | Text Edit mode (spec §7.3) (3b) |
| `imageswap.js` | 278 | Contextual panel in DevTools (3b) |
| `accessibility.js` | 297 | Contextual panel in DevTools (3b) |
| `search.js` | 116 | Contextual panel in DevTools (3b) |
| `screenshot.js` | 4 | Contextual panel in DevTools — feeds MCP (3b) |
| `index.js` | 17 | Feature registry (3a) |

## Sub-Phase Scope

### Phase 3a: Core Infrastructure (~1,365 lines equivalent)
- Selection engine (deepElementFromPoint, multi-select, shift-click)
- Overlay system (SVG highlights, handles, labels in Shadow DOM)
- Measurement system (distance between elements)
- Guides system (alignment gridlines on hover)
- Feature module registry (activate/deactivate lifecycle)
- All rendered in closed Shadow DOM with Popover API

### Phase 3b: Editing Features (~2,500 lines equivalent)
- All mutation modules reimplemented in TypeScript
- Each module: activate/deactivate lifecycle, hotkey bindings, diff capture
- Wired to designer panel sections via message passing
- New contextual panels: A11y Inspector, Image Swap, Element Search, Screenshot
- Every mutation captures before/after CSS diff

### Phase 3c: Panel UI Migration (~25,000 lines from Flow 0)
- 15 Zustand slices (13 unchanged, 2 refactored)
- Layout components, canvas systems, designer panels, editor modes
- Replace Tauri `invoke()` with message passing / fetch
- Replace native dialogs with HTML equivalents
- Wire content script data into panel components
- Port Flow 0 color picker and color mode handling

## Research Notes

- VisBug source: `_references/ProjectVisBug-main/` (outside repo)
- Flow 0 source: `reference/flow-0/` (renamed from `/tools/flow-0/`)
- VisBug total: 4,818 lines across 20 feature modules + tests
- VisBug selection system: 3 components (~600 lines)
- VisBug utilities: 12 modules (~1,200 lines)
- Flow 0 Zustand: 15 slices (not 21 as old CLAUDE.md claimed)
- Flow 0 components: 69 files
- Flow 0 bindings.ts: 747 lines (delete entirely)
