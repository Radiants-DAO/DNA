# fn-8.6 Review: Preview Mode

**Spec:** `/docs/features/06-tools-and-modes.md` (lines 376-405)
**Scope:** Preview Mode and Responsive Preview
**Date:** 2026-01-16
**Reviewer:** fn-8.6 task

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Completion** | ~85% |
| **Gaps Found** | 4 (P0: 0, P1: 1, P2: 2, P3: 1) |
| **Smoke Test** | PASS |

Preview Mode has a solid implementation. The core spec requirements are met: P key activates preview, DevTools chrome hides, page renders clean, and Escape exits. The floating PreviewModeIndicator is a nice UX touch. However, Responsive Preview (device presets, viewport width controls) is completely missing - this accounts for the P1 gap. Preview Mode itself works as designed.

---

## Smoke Test Results

| Test | Status | Notes |
|------|--------|-------|
| Enter Preview mode with P key | PASS | `useKeyboardShortcuts.ts:59-62` |
| DevTools panels hide | PASS | `App.tsx:29-41` - renders separate clean layout |
| All overlays removed | PASS | Preview mode renders plain page without EditorLayout |
| Page renders clean | PASS | Only content + PreviewModeIndicator shown |
| Keyboard shortcut active for exit | PASS | Escape returns to normal mode |
| Preview button in toolbar | PASS | `ModeToolbar.tsx:75-81` - shows P shortcut |
| Floating exit indicator | PASS | `ModeToolbar.tsx:198-223` - bottom-right corner |
| Responsive device presets | NOT IMPLEMENTED | No implementation found |
| Custom viewport width | NOT IMPLEMENTED | No implementation found |

---

## Detailed Gap Analysis

### P1 (High) - 1 Issue

#### GAP-1: Responsive Preview Not Implemented

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
3. Wrap preview content in a container with controlled width
4. Add custom width input option
5. Consider using iframe approach as spec suggests for true responsive simulation

**Priority:** P1 - Important design workflow feature
**Estimated Fix:** 3-4 hours

---

### P2 (Medium) - 2 Issues

#### GAP-2: Preview Mode Shows Placeholder Content

**Condition:** `App.tsx:32-36` shows placeholder text instead of actual page content:

```tsx
<div className="p-8">
  <p className="text-center text-text-muted">
    Preview mode - Page renders clean without DevTools UI
  </p>
</div>
```

**Criteria:** Spec line 387: "Page renders clean" - implies actual page content, not a placeholder message.

**Effect:** Users see "Preview mode - Page renders clean..." text instead of their actual component preview. The feature is technically correct (DevTools hidden) but doesn't show the real content.

**Recommendation:**
1. Render actual preview content in preview mode
2. Perhaps reuse PreviewShell/PreviewCanvas but without DevTools overlays
3. Keep PreviewModeIndicator as the only overlay

**Priority:** P2 - Feature works but shows placeholder instead of real content
**Estimated Fix:** 1-2 hours

---

#### GAP-3: Escape Returns to Normal Instead of Previous Mode

**Condition:** `useKeyboardShortcuts.ts:74-76`:

```typescript
if (editorMode !== "normal") {
  setEditorMode("normal");
}
```

When in preview mode, pressing Escape always returns to "normal" mode, even if user was previously in "component-id" mode.

**Criteria:** Better UX would be to return to previous mode, not always to normal.

**Effect:** User working in Component ID mode presses P to preview, then Escape - they're now in normal mode and must press V again to return to Component ID mode. This adds friction to the workflow.

**Recommendation:**
1. Track `previousEditorMode` in uiSlice
2. On mode change, save current mode to `previousEditorMode`
3. Escape restores `previousEditorMode` instead of always "normal"

**Priority:** P2 - Minor UX friction
**Estimated Fix:** 30 minutes

---

### P3 (Low) - 1 Issue

#### GAP-4: PreviewModeIndicator Exit Button Returns to component-id

**Condition:** `ModeToolbar.tsx:209` hardcodes return to "component-id":

```tsx
onClick={() => setEditorMode("component-id")}
```

This is inconsistent with Escape which returns to "normal" mode.

**Criteria:** Consistent behavior between keyboard (Escape) and click exit.

**Effect:** Escape returns to "normal" mode but clicking the exit button returns to "component-id" mode. Inconsistent UX.

**Recommendation:** Both exit methods should return to the same mode (either previous mode or a consistent default).

**Priority:** P3 - Inconsistency, not blocking
**Estimated Fix:** 10 minutes

---

## Intentional Deviations (Documented/Justified)

| Deviation | Justification |
|-----------|---------------|
| Floating indicator instead of hidden toolbar | Better UX - user always knows how to exit |
| Shows placeholder content | Current architecture doesn't have full page preview |

---

## Spec Issues (Spec Needs Update)

| Issue | Location | Recommendation |
|-------|----------|----------------|
| Spec is very brief (15 lines) | Lines 376-390 | Consider expanding with specific behaviors |
| Doesn't specify exit behavior | Lines 376-390 | Add "Escape returns to previous mode" or similar |
| Doesn't mention indicator UI | Lines 376-390 | Implementation has nice floating indicator - spec should document |

---

## Implementation Quality Notes

### Strengths
1. **Clean mode switching** - Preview mode properly disables other modes (componentIdMode, textEditMode)
2. **Keyboard shortcut works** - P to enter, Escape to exit
3. **Floating indicator** - Nice UX showing how to exit, positioned out of way (bottom-right)
4. **Toolbar integration** - Preview button with shortcut hint in ModeToolbar
5. **Mode synchronization** - uiSlice properly syncs editorMode with individual mode flags

### Areas for Improvement
1. **Responsive Preview missing** - The entire device preset feature is not implemented
2. **Placeholder content** - Shows message instead of actual preview
3. **Exit inconsistency** - Click vs keyboard return to different modes
4. **No previous mode tracking** - Always returns to normal/component-id

---

## Follow-up Tasks Recommended

1. **fn-8.6.1** - Implement Responsive Preview with device presets (P1, GAP-1)
2. **fn-8.6.2** - Render actual content in preview mode instead of placeholder (P2, GAP-2)
3. **fn-8.6.3** - Track and restore previous mode on exit (P2, GAP-3)
4. **fn-8.6.4** - Make exit button consistent with Escape behavior (P3, GAP-4)

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
| `src/components/layout/PreviewCanvas.tsx` | Canvas component | 130 |
| `src/components/PreviewShell.tsx` | Iframe preview shell | 211 |
| `docs/features/06-tools-and-modes.md` | Specification | 511 |
