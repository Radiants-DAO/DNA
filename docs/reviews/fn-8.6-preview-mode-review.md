# fn-8.6 Review: Preview Mode

**Spec:** `/docs/features/06-tools-and-modes.md` (lines 376-405)
**Scope:** Preview Mode and Responsive Preview
**Date:** 2026-01-16
**Reviewer:** fn-8.6 task

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Completion** | ~40% |
| **Gaps Found** | 4 (P0: 2, P1: 1, P2: 1, P3: 0) |
| **Smoke Test** | PARTIAL |

Preview Mode's activation/deactivation mechanics work correctly (P key, Escape, mode indicators), but the feature **doesn't render target project content**. The iframe-based preview architecture exists (`PreviewShell.tsx`, 211 lines) but isn't connected to Preview Mode. App.tsx renders placeholder text instead of the actual target project's dev server content.

**Critical architectural gap:** RadFlow is a design tool for editing external projects. Preview Mode should show the target project's page without DevTools overlays - instead it shows placeholder text. The PreviewShell component implements this architecture but is unused.

---

## Smoke Test Results

| Test | Status | Notes |
|------|--------|-------|
| Enter Preview mode with P key | PASS | `useKeyboardShortcuts.ts:59-62` |
| DevTools panels hide | PASS | `App.tsx:29-41` - renders separate layout |
| All overlays removed | PASS | Preview mode renders without EditorLayout |
| Page renders clean | FAIL | Shows placeholder text, not target project content |
| Keyboard shortcut active for exit | PASS | Escape returns to normal mode |
| Preview button in toolbar | PASS | `ModeToolbar.tsx:75-81` - shows P shortcut |
| Floating exit indicator | PASS | `ModeToolbar.tsx:198-223` - bottom-right corner |
| Responsive device presets | NOT IMPLEMENTED | No implementation found - cannot test |
| Custom viewport width | NOT IMPLEMENTED | No implementation found - cannot test |

---

## Detailed Gap Analysis

### P0 (Critical) - 2 Issues

#### GAP-1: Preview Mode Doesn't Use PreviewShell Component

**Condition:** `PreviewShell.tsx` (211 lines) implements full iframe-based preview with bridge connection, but Preview Mode in `App.tsx:29-41` renders placeholder text instead of using PreviewShell.

```tsx
// App.tsx:29-38 - What Preview Mode currently does
if (isPreviewMode) {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="p-8">
        <p className="text-center text-text-muted">
          Preview mode - Page renders clean without DevTools UI
        </p>
      </div>
      <PreviewModeIndicator />
    </main>
  );
}
```

**Criteria:** Spec lines 376-390 describe Preview Mode showing "the page" clean without DevTools chrome. Since RadFlow edits external projects, "the page" means the target project's dev server content rendered via iframe.

**Effect:**
- Existing preview infrastructure (PreviewShell with iframe, bridge connection, status indicators) is completely unused
- Preview Mode is non-functional - users see placeholder instead of their project
- Responsive Preview (GAP-3) cannot be implemented without this connection
- The spec's intent ("View the page without DevTools chrome") is not met

**Recommendation:**
1. Refactor `App.tsx` to render `PreviewShell` in both normal and preview modes
2. Preview mode: PreviewShell without DevTools overlays (no Component ID pills, no property panels)
3. Normal mode: PreviewShell with overlays integrated
4. Pass target dev server URL from project state to PreviewShell
5. This unblocks Responsive Preview implementation (GAP-3)

**Priority:** P0 - Blocks all preview functionality
**Estimated Fix:** 4-6 hours (architectural refactor)
**Blocks:** GAP-3 (Responsive Preview)

---

#### GAP-2: Preview Mode Shows Placeholder Instead of Target Project Content

**Condition:** `App.tsx:32-36` shows placeholder text instead of the target project's actual page content:

```tsx
<div className="p-8">
  <p className="text-center text-text-muted">
    Preview mode - Page renders clean without DevTools UI
  </p>
</div>
```

Normal mode also doesn't show target project content - `PreviewCanvas.tsx` shows a placeholder component grid.

**Criteria:** Spec line 387: "Page renders clean" - this refers to the **target project's page** (the project being edited), not RadFlow's own UI. The spec assumes Preview Mode shows the same content as normal mode, just without the editor chrome.

**Effect:** Users cannot preview their actual project. The entire Preview Mode feature is non-functional for its intended purpose. Neither normal mode nor preview mode renders the target project's live dev server in an iframe.

**Recommendation:**
1. Normal mode should render PreviewShell with target dev server URL
2. Preview mode should render same PreviewShell but without DevTools overlays
3. Both modes need the iframe-based architecture that PreviewShell.tsx already implements
4. Connect to project state to get dev server URL (from projectSlice)

**Priority:** P0 - Preview Mode is completely non-functional without this
**Estimated Fix:** Included in GAP-1 fix (same architectural change)
**Dependencies:** Same fix as GAP-1

---

### P1 (High) - 1 Issue

#### GAP-3: Responsive Preview Not Implemented

**Condition:** No responsive preview functionality exists. Searched for "Responsive", "DevicePreset", "viewport" - no matching files. Spec requires device presets and custom width input.

**Criteria:** Spec lines 392-405 define Responsive Preview:
- Implementation via iframes with localhost
- Device Presets:
  - Phone (375px)
  - Phone Large (428px)
  - Tablet (768px)
  - Desktop (1280px)
  - Wide (1536px)
  - Custom width input

**Effect:** Users cannot preview their design at different viewport widths. This is important for responsive design work - designers need to see how components look on mobile vs desktop.

**Recommendation:**
1. Add viewport width state to uiSlice
2. Create DevicePresetSelector component in preview toolbar
3. Wrap PreviewShell iframe in a container with controlled width
4. Add custom width input option
5. Use iframe approach as spec suggests for true responsive simulation

**Priority:** P1 - Important design workflow feature
**Estimated Fix:** 3-4 hours AFTER GAP-1 is fixed
**Dependencies:** Requires GAP-1 (PreviewShell integration) to be completed first

---

### P2 (Medium) - 1 Issue

#### GAP-4: No Previous Mode Tracking (Exit Behavior Inconsistency)

**Condition:** Two inconsistent exit behaviors exist with no previous mode tracking:
- Escape key: `useKeyboardShortcuts.ts:74-76` always returns to "normal" mode
- Exit button: `ModeToolbar.tsx:209` always returns to "component-id" mode

```typescript
// useKeyboardShortcuts.ts:74-76
if (editorMode !== "normal") {
  setEditorMode("normal");
}

// ModeToolbar.tsx:209
onClick={() => setEditorMode("component-id")}
```

**Criteria:** Better UX would restore previous mode on exit, with consistent behavior between keyboard and mouse.

**Effect:**
- User in Component ID mode presses P to preview, then Escape - now in Normal mode (lost context)
- Inconsistent behavior: Escape vs click return to different modes
- Extra keypress needed to return to workflow

**Recommendation:**
1. Add `previousEditorMode` to uiSlice state
2. Track mode changes: `setEditorMode` saves current mode to `previousEditorMode`
3. Both Escape and Exit button should restore `previousEditorMode`
4. Special case: if previous was "preview", default to "normal"

**Priority:** P2 - UX friction, not blocking
**Estimated Fix:** 45 minutes (single state change + two call sites)

---

## Intentional Deviations (Documented/Justified)

| Deviation | Justification |
|-----------|---------------|
| Floating indicator instead of hidden toolbar | Better UX - user always knows how to exit |

---

## Spec Issues (Spec Needs Update)

| Issue | Location | Recommendation |
|-------|----------|----------------|
| Ambiguous "page" reference | Lines 376-390 | Clarify: "Target project's page renders clean in iframe without DevTools overlays" |
| Spec is very brief (15 lines) | Lines 376-390 | Consider expanding with specific behaviors |
| Doesn't specify exit behavior | Lines 376-390 | Add "Escape returns to previous mode" or similar |
| Doesn't mention indicator UI | Lines 376-390 | Implementation has floating indicator - spec should document |

---

## Implementation Quality Notes

### Architectural Foundations (Working)
1. **Mode state management** - uiSlice properly syncs editorMode with individual mode flags
2. **Keyboard shortcuts** - P to enter, Escape to exit (both work correctly)
3. **PreviewShell component** - Full iframe infrastructure exists (211 lines, unused)
4. **Floating indicator** - Nice UX showing how to exit, positioned out of way
5. **Toolbar integration** - Preview button with shortcut hint in ModeToolbar

### Critical Gaps
1. **PreviewShell not connected** - The iframe preview component exists but isn't used
2. **No target project rendering** - Neither mode shows actual project content
3. **Placeholder content** - Both normal and preview modes show placeholders
4. **Responsive Preview missing** - Device presets not implemented

---

## Follow-up Tasks Recommended

1. **fn-8.6.0** - Integrate PreviewShell into App.tsx for both modes (P0, GAP-1 + GAP-2, BLOCKS ALL)
2. **fn-8.6.1** - Implement Responsive Preview with device presets (P1, GAP-3, depends on fn-8.6.0)
3. **fn-8.6.2** - Track and restore previous mode on exit (P2, GAP-4)

---

## Files Reviewed

| File | Purpose | Lines |
|------|---------|-------|
| `src/stores/types.ts` | EditorMode type, UiSlice interface | 193-207 |
| `src/stores/slices/uiSlice.ts` | Preview mode state management | 51 |
| `src/hooks/useKeyboardShortcuts.ts` | P and Escape shortcuts | 114 |
| `src/App.tsx` | Preview mode conditional render | 52 |
| `src/components/ModeToolbar.tsx` | Preview button + indicator | 223 |
| `src/components/layout/EditorLayout.tsx` | Normal mode layout | 46 |
| `src/components/layout/PreviewCanvas.tsx` | Canvas component (placeholder) | 130 |
| `src/components/PreviewShell.tsx` | Iframe preview shell (UNUSED) | 211 |
| `docs/features/06-tools-and-modes.md` | Specification | 511 |
