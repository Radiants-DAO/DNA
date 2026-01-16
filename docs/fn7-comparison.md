# radflow-fn7 vs radflow-tauri Comparison

Created: 2026-01-16
Purpose: Decide what to keep/merge from each codebase

---

## Overview

| Aspect | radflow-fn7 | radflow-tauri |
|--------|-------------|---------------|
| Location | `/Users/rivermassey/Desktop/dev/radflow-fn7` | Current repo |
| fn-7 Tasks | fn-7.19 - fn-7.27 | fn-7.12 - fn-7.16 |
| Status | Higher numbered tasks (more complete) | Lower numbered tasks + fn-5, fn-9 work |
| Focus | Preview, Search, Undo/Redo | Wizard, DevServer, Context Engineering |

---

## Files Unique to radflow-fn7

| File | Purpose | Keep? |
|------|---------|-------|
| `components/UndoRedoControls.tsx` | Undo/redo buttons for style changes | **YES** - useful for style injection |
| `components/layout/ResizeDivider.tsx` | Draggable panel dividers | **YES** - better UX |
| `components/search/SearchOverlay.tsx` | Cmd+F search overlay with scopes | **YES** - full search implementation |
| `hooks/useDirectEdit.ts` | Direct file editing hook | **NO** - obsolete per fn-9 |
| `hooks/useSearch.ts` | Search state/results management | **YES** - needed for SearchOverlay |
| `hooks/useUndoRedo.ts` | Undo/redo for style injection | **YES** - useful for live preview |
| `stores/slices/directEditSlice.ts` | Direct edit state | **NO** - obsolete per fn-9 |
| `stores/slices/previewSlice.ts` | Preview state (breakpoints, viewport, bridge) | **YES** - comprehensive |
| `stores/slices/undoSlice.ts` | Undo/redo stacks | **YES** - needed for useUndoRedo |
| `utils/cssStateDetection.ts` | CSS pseudo-state detection (:hover, :focus, etc) | **YES** - useful for state editing |
| `utils/fuzzySearch.ts` | Fuzzy matching algorithm | **YES** - needed for search |

---

## Files Unique to radflow-tauri

| File | Purpose | Keep? |
|------|---------|-------|
| `components/FirstRunWizard.tsx` | First-run setup wizard | **YES** |
| `components/PreviewShell.tsx` | Preview shell component | **YES** - may need merge with fn7 PreviewCanvas |
| `components/wizard/*.tsx` | Wizard step components | **YES** |
| `hooks/useDevServer.ts` | Dev server management | **YES** |
| `hooks/useFileWrite.ts` | File write stub | **YES** - keep stub, remove direct-write |
| `stores/slices/bridgeSlice.ts` | Bridge communication state | **YES** |
| `stores/slices/projectSlice.ts` | Project state | **YES** |
| `stores/slices/selectionSlice.ts` | Element selection state | **YES** |
| `stores/slices/wizardSlice.ts` | Wizard state | **YES** |

---

## Component Comparisons

### TitleBar.tsx

| Feature | radflow-fn7 | radflow-tauri |
|---------|-------------|---------------|
| ModeToggle | Yes (clipboard/direct-edit) | No (removed per fn-9) |
| UndoRedoControls | Yes | No |
| BreakpointSelector | Full (Cmd+0-5 shortcuts, custom width) | Basic (simple toggle) |
| Search input | Yes | Yes |

**Recommendation**: Take fn7's BreakpointSelector, add UndoRedoControls, remove ModeToggle

### EditorLayout.tsx

| Feature | radflow-fn7 | radflow-tauri |
|---------|-------------|---------------|
| Lines | 94 | 46 |
| ResizeDivider | Yes (draggable panels) | No |
| directEditEnabled | Yes (in StatusBar) | No |
| Panel width state | Yes (sidebarWidth, panelWidth) | No |

**Recommendation**: Take fn7's EditorLayout for resizable panels, remove directEditEnabled

### PreviewCanvas.tsx

| Feature | radflow-fn7 | radflow-tauri |
|---------|-------------|---------------|
| Lines | ~590 | 130 |
| Iframe preview | Yes (full implementation) | No (placeholder) |
| Bridge connection | Yes | No |
| Viewport width | Yes (from store) | No |
| View modes | Grid, variant, focused | Basic grid |
| Element selection | Yes (with hover highlighting) | No |
| Style injection | Yes | No |

**Recommendation**: Take fn7's PreviewCanvas - much more complete

### SearchOverlay.tsx (fn7 only)

- 393 lines
- Full Cmd+F search implementation
- Scope filters (elements, components, layers, assets)
- Keyboard navigation (up/down/enter/escape)
- Recent searches with localStorage persistence
- Fuzzy matching with highlighting

**Recommendation**: Keep entire file

### ResizeDivider.tsx (fn7 only)

- 94 lines
- Draggable panel divider
- Double-click to reset width
- Hover highlight effect

**Recommendation**: Keep entire file

---

## Store Slice Comparisons

### textEditSlice.ts

| Feature | radflow-fn7 | radflow-tauri |
|---------|-------------|---------------|
| directWriteMode | Yes | No (removed per fn-9) |
| undo/redo stacks | Yes | No (removed per fn-9) |
| pendingEdits | Yes | Yes |
| clipboard only | No | Yes |

**Recommendation**: Keep radflow-tauri's clipboard-only version

### appStore.ts

Need to merge both versions:
- Keep fn7's: breakpoint state, viewport state, style undo/redo stacks, panel widths
- Keep tauri's: wizard, project, bridge, selection slices
- Remove: directEditEnabled, directWriteMode

---

## Tasks Status

### radflow-fn7 Tasks (fn-7.19 - fn-7.27)

| Task | Name | Status | Merge? |
|------|------|--------|--------|
| fn-7.19 | Clipboard Mode - Full CSS rule output | done | **YES** - this IS fn-9's approach |
| fn-7.20 | Direct-Edit Mode - Debounced file writes | done | **NO** - obsolete per fn-9 |
| fn-7.21 | Undo/Redo Stack - Local session history | done | **YES** - useful for style injection |
| fn-7.22 | Breakpoint Selector - Theme breakpoints in top bar | done | **YES** - full implementation |
| fn-7.23 | Search Integration - Cmd+F with scope filters | done | **YES** - complete search system |
| fn-7.24 | Welcome Screen - Project picker and recent projects | done | **MAYBE** - compare to wizard |
| fn-7.25 | Window Chrome Fixes - Traffic lights, drag region | done | **YES** - polish |
| fn-7.26 | Layers Panel Keyboard Navigation - Arrow keys | done | **YES** - better UX |
| fn-7.27 | Resizable Panel Dividers - Drag handles | done | **YES** - ResizeDivider component |

### radflow-tauri Tasks

Has fn-5 (First-Run Wizard), fn-9 (Context Engineering) work not in radflow-fn7.

---

## Merge Recommendation Summary

### From radflow-fn7 (KEEP)

1. **fn-7.19 clipboard output logic** - Full CSS rule output (this IS the fn-9 approach)
2. **PreviewCanvas.tsx** - Full iframe preview with bridge connection
3. **SearchOverlay.tsx** - Complete search implementation
4. **ResizeDivider.tsx** - Draggable panel dividers
5. **useSearch.ts** - Search hook
6. **useUndoRedo.ts** - Undo/redo hook (for style injection, NOT file writes)
7. **UndoRedoControls.tsx** - UI controls
8. **fuzzySearch.ts** - Search utility
9. **cssStateDetection.ts** - CSS pseudo-state detection
10. **BreakpointSelector** (from TitleBar) - Full version with shortcuts
11. **previewSlice.ts** - Breakpoints, viewport width, bridge state, view modes
12. **undoSlice.ts** - Undo/redo state (for style injection)
13. **Welcome Screen** (fn-7.24) - Project picker, recent projects

### From radflow-fn7 (REMOVE/DON'T MERGE)

1. **ModeToggle component** - No toggle needed, clipboard is the only mode
2. **useDirectEdit.ts** - Obsolete per fn-9
3. **directEditSlice.ts** - Obsolete per fn-9
4. **directEditEnabled state** - Obsolete per fn-9
5. **directWriteMode state** - Obsolete per fn-9
6. **fn-7.20 code** - Direct file writes removed

### From radflow-tauri (KEEP)

1. **FirstRunWizard.tsx** + wizard steps (initial setup)
2. **useDevServer.ts**
3. **useFileWrite.ts** (stub - returns "feature sunset" errors)
4. **bridgeSlice.ts**
5. **projectSlice.ts**
6. **selectionSlice.ts**
7. **wizardSlice.ts**
8. **Clipboard-only textEditSlice.ts**
9. **fn-9 cleanup work** (all of it)

### NEW: Dev Mode Default Project

Add a dev mode that:
- Skips wizard/welcome screen during development
- Auto-opens a default testing project
- Configured via env var or tauri dev flag

---

## Merge Steps (Proposed)

1. Copy from fn7 to tauri:
   - `components/search/SearchOverlay.tsx`
   - `components/layout/ResizeDivider.tsx`
   - `components/UndoRedoControls.tsx`
   - `hooks/useSearch.ts`
   - `hooks/useUndoRedo.ts`
   - `utils/fuzzySearch.ts`

2. Merge PreviewCanvas:
   - Take fn7's iframe-based implementation
   - Remove any directEdit references

3. Merge EditorLayout:
   - Add ResizeDivider support from fn7
   - Keep tauri's simpler structure otherwise

4. Merge TitleBar:
   - Take fn7's BreakpointSelector (full version)
   - Add UndoRedoControls
   - Keep tauri's clipboard-only indicator (no ModeToggle)

5. Merge appStore:
   - Add fn7's breakpoint, viewport, style undo/redo, panel width state
   - Keep all tauri slices
   - Remove all direct-edit state

6. Verify TypeScript compiles
7. Test functionality

---

## Questions to Decide

1. ~~Do we need `cssStateDetection.ts`?~~ **YES** - detects :hover, :focus, :active states
2. ~~Do we need `previewSlice.ts`?~~ **YES** - has breakpoints, viewport, bridge state
3. ~~What tasks in fn-7.21 - fn-7.27 have useful code?~~ **Answered above**
4. Should undo/redo apply to clipboard edits or just style injection? (Recommend: style injection only)
5. ~~Welcome Screen vs First-Run Wizard~~ **KEEP BOTH**:
   - First-Run Wizard (fn-5): Initial setup, project detection
   - Welcome Screen (fn-7.24): Project picker, recent projects
   - **Dev mode**: Auto-open default testing project (skip wizard/welcome)
6. Should we proceed with the merge, or continue with fn-9 first?

---

## Analysis: previewSlice.ts vs tauri slices

**previewSlice.ts** from radflow-fn7 contains:
- Breakpoints (DEFAULT_BREAKPOINTS, active breakpoint, custom width)
- Viewport width state
- Bridge connection (targetUrl, bridgeStatus, bridgeVersion, componentMap)
- Selection (selectedRadflowId, hoveredRadflowId)
- View modes (grid, focused, variants)
- Actions for all the above

**Overlap with radflow-tauri**:
- `bridgeSlice.ts` - may duplicate bridge connection state
- `selectionSlice.ts` - may duplicate selection state

**Recommendation**: Merge previewSlice but check for conflicts with existing slices
