# Phase 7: UI Wiring + Toolbar + Dogfood Mode

**Date:** 2026-02-06
**Status:** Decided

## What We're Building

Three things in one phase:

1. **Dogfood mode** — Toggle in SettingsBar. When on, hovering any component in the DevTools panel shows a mouse-following tooltip with the component name + file path. Uses a `DogfoodBoundary` wrapper component. Purpose: identify components by name so we can reference them in Claude Code.

2. **On-page toolbar** — The FloatingModeBar (8 mode buttons) renders on the inspected page inside the content script's existing Shadow DOM overlay (`<flow-overlay>`), not in the DevTools panel. Layers and Components panels slide out from the toolbar as sub-panels. CommentMode, TextEditMode, ComponentIdMode overlays also render on-page in the Shadow DOM.

3. **Wire all orphaned components** — PromptBuilderPanel as a Cmd+K spotlight overlay on-page. ContextOutputPanel, mutations, comments/questions, clipboard info stay in the DevTools panel. Designer sections stay in DevTools panel (future: contextual on-page editing per element). AssetsPanel and VariablesPanel wired into the DevTools panel.

## Why This Approach

- **Shadow DOM for on-page UI** — Prevents Flow from inspecting its own toolbar/overlays. The closed Shadow DOM isolates Flow's UI from the page DOM tree. `pointer-events: none` on the container, `pointer-events: auto` on interactive elements inside.
- **Toolbar sub-panels** — Layers/Components slide out from toolbar (like VisBug) rather than independent floating windows. Simpler, more cohesive.
- **DevTools panel as data hub** — Inspection results, mutations list, comments log, clipboard/prompt output live in the DevTools panel. On-page UI is for interaction (selecting, commenting, editing). DevTools panel is for reviewing accumulated data.

## Key Decisions

### On-page (Shadow DOM overlay)
- **FloatingModeBar** — 8 modes: Smart Edit (E), Select/Prompt (V), Text (T), Comment (C), Question (Q), Designer (D), Animation (A), Preview (P). Designer + Animation disabled for now.
- **Layers sub-panel** — Slides out from toolbar. Real DOM tree (replace hardcoded stub).
- **Components sub-panel** — Slides out from toolbar. Component list from fiber walker.
- **CommentMode overlay** — Crosshair, hover highlights, comment popovers on-page.
- **TextEditMode overlay** — Text selection + editing on-page.
- **ComponentIdMode overlay** — Component info pills on hover, copy on click.
- **PromptBuilderPanel** — Cmd+K spotlight: centered floating overlay, step builder, dismiss on Esc.

### DevTools panel
- **PreviewCanvas** — Inspection results display (component identity, styles, custom properties).
- **SettingsBar** — Connection status, mode selector (synced with on-page toolbar), search, settings, dogfood toggle.
- **RightPanel** — Designer sections (9 style editors) + Mutations tab.
- **ContextOutputPanel** — Copy prompt, preview compiled markdown.
- **AssetsPanel + VariablesPanel** — New tabs/sections in the DevTools panel.
- **Comments/Questions log** — Accumulated feedback visible in DevTools.

### Dogfood mode
- **DogfoodBoundary** wrapper component with `name`, `file`, `category` props.
- When `dogfoodMode` is on: mouse-following tooltip shows component name + file path on hover. Outline on hover (not permanent).
- Toggle via switch in SettingsBar.
- All components already import DogfoodBoundary (added in prior work).

## Open Questions

- Should the on-page toolbar position sync to the DevTools mode selector? (Clicking "Comment" in either place activates comment mode.)
- Real DOM tree walker for Layers panel — scope for Phase 7 or defer?
- ThemeSelector and ThemeTransition — wire into DevTools panel or defer?

## Research Notes

- `content.ts` already creates `<flow-overlay>` with closed Shadow DOM, `pointer-events: none`, z-index 2147483647
- `FloatingModeBar.tsx` (421 lines) — fully implemented with draggable positioning, badge counts, snap-to-edge
- All 8 orphaned components are real implementations (2,396 lines total), all already wrapped with DogfoodBoundary
- `DogfoodBoundary.tsx` does not exist yet — needs to be created
- VisBug toolbar pattern: icon buttons with inline SVG, hover tooltips, hotkey bindings, draggable
- Flow 0 EditorLayout rendered CommentMode + TextEditMode + FloatingModeBar at root level alongside layout panels
- `uiStateSlice.ts` already has `dogfoodMode: boolean` and `setDogfoodMode` (unused)
