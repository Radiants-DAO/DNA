# fn-8.3 Review: Component ID Mode

**Spec:** `/docs/features/06-tools-and-modes.md` (lines 47-265)
**Scope:** Component ID Mode only (not Text Edit, Property Panels, etc.)
**Date:** 2026-01-16
**Reviewer:** fn-8.3 task

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Completion** | ~75% |
| **Gaps Found** | 12 (P0: 0, P1: 4, P2: 5, P3: 3) |
| **Smoke Test** | PARTIAL PASS |

Component ID Mode has a solid implementation with the core value proposition working (select component → copy file:line to clipboard). Key gaps are in DOM correlation (currently uses mock data), layers panel bidirectional sync, and some advanced selection behaviors.

---

## Smoke Test Results

| Test | Status | Notes |
|------|--------|-------|
| Enter mode with V key | PASS | `useKeyboardShortcuts.ts:51` handles V key |
| Cursor changes to crosshair | PASS | `ComponentIdMode.tsx:332` sets cursor |
| Mode indicator visible | PASS | `ComponentIdMode.tsx:527-529` shows pill |
| Hover shows component pill | PARTIAL | Shows pill but uses mock data, not real DOM correlation |
| Click copies to clipboard | PASS | `ComponentIdMode.tsx:143-163` |
| Shift+Click multi-select | PASS | `ComponentIdMode.tsx:287-288` |
| Shift+Cmd+Click select all of type | PASS | `ComponentIdMode.tsx:283-285` |
| Layers panel highlights on hover | PASS | `LayersPanel.tsx:117-125` |
| Rectangle selection | PARTIAL | UI renders but doesn't find components in rect |
| Violations mode toggle | PASS | `ComponentIdMode.tsx:530-542` |

---

## Detailed Gap Analysis

### P1 (High) - 4 Issues

#### GAP-1: DOM Element to Component Correlation Missing

**Condition:** `findComponentAtPoint()` at `ComponentIdMode.tsx:108-123` returns mock data (first component) instead of correlating actual DOM elements to SWC-parsed component data.

**Criteria:** Spec states "Element pills appear on or near elements" (line 79-80) and "Line numbers are live and accurate" (line 244-252). This requires real DOM → component mapping.

**Effect:** Users cannot hover over actual page elements to see their component info. The mode is non-functional for its core purpose in real usage.

**Recommendation:** Implement DOM element correlation via:
1. Data attributes injected by SWC transform (`data-radflow-file`, `data-radflow-line`)
2. Query DOM at mouse position for these attributes
3. Look up component info from store

**Priority:** P1 - Blocks core value proposition
**Estimated Fix:** 4-6 hours

---

#### GAP-2: Rectangle Selection Incomplete

**Condition:** Rectangle selection UI renders (`ComponentIdMode.tsx:378-389`) but `handleMouseUp` (lines 233-263) logs rectangle but doesn't query DOM for elements within bounds.

**Criteria:** Spec states "Draw rectangle to select multiple elements. All elements within rectangle selected." (lines 192-195)

**Effect:** Users see selection rectangle but no components get selected.

**Recommendation:** After computing `rect`, query DOM with `document.querySelectorAll('[data-radflow-file]')` and filter by bounding box intersection.

**Priority:** P1 - Advertised feature doesn't work
**Estimated Fix:** 2-3 hours

---

#### GAP-3: Hierarchy Context Menu Flat Instead of Tree

**Condition:** `buildHierarchy()` at `ComponentIdMode.tsx:92-104` returns flat list of components from same file, not actual parent-child tree.

**Criteria:** Spec shows tree structure (lines 197-211):
```
Modal
└─ Card
   └─ ● Button (current)
      └─ Text
```

**Effect:** Right-click menu shows all components in file without hierarchy, making it hard to navigate complex nested structures.

**Recommendation:** Use SWC parent-child relationship data (if available) or DOM tree traversal to build actual hierarchy.

**Priority:** P1 - Significantly degrades navigation UX
**Estimated Fix:** 3-4 hours

---

#### GAP-4: Layers Panel Canvas Bidirectionality Incomplete

**Condition:** Layers panel hover syncs TO canvas (`setHoveredComponent` at `LayersPanel.tsx:97-104`) but canvas hover doesn't scroll layers panel to show hovered component.

**Criteria:** Spec states "Bidirectional: hover in canvas ↔ highlight in layers panel" (line 143-144). Implies scrolling into view.

**Effect:** When hovering components on canvas, the corresponding item in layers panel may be offscreen and not visible without manual scrolling.

**Recommendation:** Add `useEffect` in `LayersPanel` that scrolls hovered component into view when `hoveredComponent` changes (from canvas hover).

**Priority:** P1 - Bidirectional sync is explicitly stated requirement
**Estimated Fix:** 1-2 hours

---

### P2 (Medium) - 5 Issues

#### GAP-5: Clipboard Format Missing Full Path for React Components

**Condition:** `formatClipboardText` at `ComponentIdMode.tsx:126-130` uses only filename, not full path:
```typescript
const fileName = component.file.split("/").pop() || component.file;
return `${component.name} @ ${fileName}:${component.line}`;
```

**Criteria:** Spec shows `AnimatedStatCard @ app/dashboard/page.tsx:47` (line 59) with relative path, not just filename.

**Effect:** LLMs may not find the correct file when multiple files have same name (e.g., `page.tsx` in different routes).

**Recommendation:** Use relative path from project root, not just filename. Format: `ComponentName @ path/to/file.tsx:line`

**Priority:** P2 - Workaround exists (filename often unique enough)
**Estimated Fix:** 30 min

---

#### GAP-6: HTML Element Content Preview Missing

**Condition:** Current clipboard format for all elements is `ComponentName @ file:line`. Spec has special format for HTML elements.

**Criteria:** Spec states for HTML elements: `<tagName> @ path/to/file.tsx:lineNumber "content preview"` (lines 223-228)

**Effect:** Multiple `<div>` or `<h1>` elements at different lines are indistinguishable without content preview.

**Recommendation:** For non-component elements (tag names like `div`, `h1`, etc.), include first ~30 chars of text content.

**Priority:** P2 - Usability improvement for HTML elements
**Estimated Fix:** 1 hour

---

#### GAP-7: Escape Key Clears Selection Instead of Exiting Mode

**Condition:** In `useKeyboardShortcuts.ts:69-76`:
```typescript
if (editorMode === "component-id") {
  clearSelection();
}
if (editorMode !== "normal") {
  setEditorMode("normal");
}
```

**Criteria:** Spec says "Escape: Exit mode" (line 261). Doesn't specify clearing selection.

**Effect:** Pressing Escape loses selected components AND exits mode, which may not be desired. User might want to exit mode but keep selection for reference.

**Recommendation:** Consider two-stage: first Escape clears selection (if any), second Escape exits mode. Or: preserve selection on mode exit.

**Priority:** P2 - Unexpected behavior, minor UX issue
**Estimated Fix:** 30 min

---

#### GAP-8: Element Highlight Outline Missing

**Condition:** Hovering shows tooltip/pill but no outline on the actual element.

**Criteria:** Spec states "Hover State: Pill becomes fully opaque, Element gets subtle highlight outline" (lines 87-89)

**Effect:** Without highlight outline, users rely solely on the pill position to know which element is targeted, which can be ambiguous on dense layouts.

**Recommendation:** Add CSS overlay or border to DOM element matching `hoveredComponent`. May require injecting styles via bridge.

**Priority:** P2 - Visual feedback improvement
**Estimated Fix:** 2 hours

---

#### GAP-9: Violation Icon Positioning in Pills

**Condition:** Violation indicators are shown in tooltip (`ComponentIdMode.tsx:406-418`) as text counts, not icons.

**Criteria:** Spec shows warning icon `⚠` and error icon `🔴` on element pills (lines 102-108, 119-131).

**Effect:** Violations less visually prominent than spec shows.

**Recommendation:** Add warning/error icons to component pills, not just counts. Use SVG icons for clarity.

**Priority:** P2 - Visual consistency with spec
**Estimated Fix:** 1 hour

---

### P3 (Low) - 3 Issues

#### GAP-10: Pill Positioning Not Specified

**Condition:** Tooltip positioned at cursor + 12px offset (`tooltipPosition.x + 12`, line 398).

**Criteria:** Spec says "Positioned to not obscure element content" (line 84). Current cursor-following approach may obscure element.

**Effect:** Minor usability issue - pill follows cursor which may cover the element being inspected.

**Recommendation:** Position pill at element's top-left corner or use smart positioning that avoids overlap.

**Priority:** P3 - Polish
**Estimated Fix:** 1-2 hours

---

#### GAP-11: Mode Indicator Missing Shortcut Hint

**Condition:** Mode indicator shows "Component ID Mode" (`ComponentIdMode.tsx:527-529`) but no hint about how to exit.

**Criteria:** Spec shows "Keyboard shortcut still active for exit" (line 388 for Preview, applies to all modes).

**Effect:** New users may not know how to exit mode.

**Recommendation:** Add "(Esc to exit)" or keyboard hint to mode indicator pill.

**Priority:** P3 - Onboarding improvement
**Estimated Fix:** 15 min

---

#### GAP-12: Layers Panel Missing Collapse State Persistence

**Condition:** `expandedNodes` state is local to component (`useState<Set<string>>`), not persisted.

**Criteria:** Implied by VS Code-like explorer behavior (line 147) - expanded state should persist across mode toggles.

**Effect:** Expanded files collapse when exiting/re-entering component ID mode.

**Recommendation:** Move `expandedNodes` to store or localStorage.

**Priority:** P3 - Minor UX improvement
**Estimated Fix:** 30 min

---

## Intentional Deviations (Documented/Justified)

| Deviation | Justification |
|-----------|---------------|
| SWC parsing from Rust instead of browser-based | Tauri architecture spec (`10-tauri-architecture.md`) specifies Rust backend for parsing |
| Layers panel shows file grouping instead of pure component tree | Practical choice for navigating large codebases; file-based grouping matches VS Code pattern |

---

## Spec Issues (Spec Needs Update)

| Issue | Location | Recommendation |
|-------|----------|----------------|
| "notify" crate mentioned | Line 248 | Update to "tauri-plugin-fs" per CLAUDE.md |
| "tantivy" mentioned | Line 499 | Update to "fuzzy-matcher" per CLAUDE.md |

---

## Implementation Quality Notes

### Strengths
1. **Clean separation of concerns** - Store slice (`componentIdSlice.ts`) handles state, component handles UI
2. **Comprehensive event handling** - Click, Shift+Click, Cmd+Shift+Click, right-click all properly wired
3. **Violations integration** - Filter toggle and per-component counts working
4. **Toast feedback** - Copy confirmation toasts provide good UX feedback

### Areas for Improvement
1. **Mock data dependency** - Real DOM correlation needed for production use
2. **Test coverage** - No unit tests visible for selection logic
3. **Accessibility** - No keyboard-only navigation path in layers panel

---

## Follow-up Tasks Recommended

1. **fn-8.3.1** - Implement DOM element correlation (P1, GAP-1)
2. **fn-8.3.2** - Complete rectangle selection (P1, GAP-2)
3. **fn-8.3.3** - Build actual component hierarchy tree (P1, GAP-3)
4. **fn-8.3.4** - Add layers panel scroll-into-view sync (P1, GAP-4)
5. **fn-8.3.5** - Fix clipboard format to use relative paths (P2, GAP-5)

---

## Files Reviewed

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/ComponentIdMode.tsx` | Main mode overlay | 558 |
| `src/stores/slices/componentIdSlice.ts` | State management | 127 |
| `src/hooks/useKeyboardShortcuts.ts` | Keyboard shortcuts | 115 |
| `src/components/ModeToolbar.tsx` | Mode toggle UI | 224 |
| `src/components/LayersPanel.tsx` | Component tree panel | 210 |
| `src/stores/types.ts` | Type definitions | 394 |
| `docs/features/06-tools-and-modes.md` | Specification | 511 |
