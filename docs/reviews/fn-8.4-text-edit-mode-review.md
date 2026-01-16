# fn-8.4 Review: Text Edit Mode

**Spec:** `/docs/features/06-tools-and-modes.md` (lines 268-304)
**Scope:** Text Edit Mode only (not Component ID, Property Panels, etc.)
**Date:** 2026-01-16
**Reviewer:** fn-8.4 task

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Completion** | ~85% |
| **Gaps Found** | 8 (P0: 0, P1: 2, P2: 4, P3: 2) |
| **Smoke Test** | PARTIAL PASS |

Text Edit Mode has a robust implementation with both clipboard and direct write modes working. Core editing features including rich text formatting (bold/italic/underline) are implemented. Key gaps include missing support for several rich text content types (headings, lists, links, blockquotes, code blocks), element-to-component correlation uses mock data, and double-click activation doesn't match spec.

---

## Smoke Test Results

| Test | Status | Notes |
|------|--------|-------|
| Enter mode with T key | PASS | `useKeyboardShortcuts.ts:55-58` handles T key |
| Cursor changes to text cursor | PASS | `TextEditMode.tsx:316` sets cursor to "text" |
| Mode indicator visible | PASS | `TextEditMode.tsx:363-390` shows pill with toggle |
| Click text element to edit | PASS | Single click activates editing (spec says double-click) |
| Double-click to edit | FAIL | Not implemented - single click used instead |
| Bold/Italic/Underline formatting | PASS | `TextEditMode.tsx:241-254` via Cmd+B/I/U |
| Changes accumulate (clipboard mode) | PASS | `textEditSlice.ts:38-47` stores pending edits |
| Direct write mode toggle | PASS | `TextEditMode.tsx:367-389` toggle button |
| Undo/Redo (direct mode) | PASS | `textEditSlice.ts:118-192` |
| Exit mode with Escape | PASS | `TextEditMode.tsx:258-279` |
| Conflict detection | PASS | `textEditSlice.ts:198-226` checks external mods |

---

## Detailed Gap Analysis

### P1 (High) - 2 Issues

#### GAP-1: Missing Rich Text Content Types

**Condition:** `TextEditMode.tsx` only supports bold, italic, and underline via `document.execCommand()` (lines 241-254). No support for headings, lists, links, blockquotes, or code blocks.

**Criteria:** Spec states "Rich Text Capabilities" including:
- Headings (H1-H6)
- Ordered and unordered lists
- Links
- Blockquotes
- Code blocks

(Spec lines 276-287)

**Effect:** Users cannot format text with headings, lists, or code blocks - only basic bold/italic/underline. This significantly limits the editing capabilities for rich content like documentation or marketing pages.

**Recommendation:**
1. Add heading support: H1-H6 buttons or dropdown (Cmd+1 through Cmd+6)
2. Add list support: ordered/unordered toggles (Cmd+Shift+7/8)
3. Add link insertion dialog (Cmd+K)
4. Add blockquote toggle
5. Consider using a proper rich text editor library (TipTap, Lexical) for comprehensive support

**Priority:** P1 - Major feature gap for "full prose editor" claim
**Estimated Fix:** 4-6 hours (basic implementation) or 2-3 days (proper library)

---

#### GAP-2: Component Correlation Uses Mock Data

**Condition:** `findComponentForElement()` at `TextEditMode.tsx:51-58` returns first component from store, not the actual component for the element:

```typescript
const findComponentForElement = useCallback(
  (element: HTMLElement): ComponentInfo | null => {
    if (components.length > 0) {
      return components[0];
    }
    return null;
  },
  [components]
);
```

**Criteria:** Spec states changes should write to correct file/line location. Without proper correlation, clipboard format and direct writes target wrong location.

**Effect:** In clipboard mode, edits show wrong file:line in output. In direct write mode, changes would write to wrong file entirely. Feature is non-functional for production use.

**Recommendation:** Implement DOM element correlation:
1. Use data attributes (`data-radflow-file`, `data-radflow-line`) on elements
2. Walk up DOM tree to find annotated ancestor
3. Map to correct ComponentInfo from store

Note: This is the same GAP-1 issue identified in Component ID Mode (fn-8.3). Should be fixed in shared utility.

**Priority:** P1 - Blocks production use of both clipboard and direct write
**Estimated Fix:** 2-3 hours (shares work with Component ID fix)

---

### P2 (Medium) - 4 Issues

#### GAP-3: Single Click Instead of Double Click

**Condition:** `handleClick` at `TextEditMode.tsx:165-179` activates editing on single click, not double-click.

**Criteria:** Spec states "Double-click text element to edit" (line 273, per smoke test checklist in epic spec)

**Effect:** Users may accidentally enter edit mode when clicking for other purposes. Double-click is more intentional and matches common text editor patterns (Word, Google Docs).

**Recommendation:** Change to `handleDoubleClick` event listener instead of `handleClick`. Keep single-click for selection/hover only.

**Priority:** P2 - Interaction pattern differs from spec, but functional
**Estimated Fix:** 30 min

---

#### GAP-4: No Rich Text Output Format

**Condition:** `copyEditsToClipboard` at `textEditSlice.ts:57-75` outputs plain text diff format:
```
// ComponentName @ file:line
- "original"
+ "new"
```

**Criteria:** Spec says "Rich text editing" implying formatted output. Current format loses any bold/italic formatting applied during editing.

**Effect:** Rich text edits (bold, italic) are recorded only as text changes, losing formatting semantics. LLMs don't know which text became bold.

**Recommendation:**
1. Track formatting changes separately (e.g., "make bold: 'important text'")
2. Or output HTML/Markdown: `**important text**` or `<strong>important text</strong>`

**Priority:** P2 - Formatting changes work visually but clipboard loses context
**Estimated Fix:** 1-2 hours

---

#### GAP-5: Edit Mode Indicator Missing Escape Hint

**Condition:** Mode indicator at `TextEditMode.tsx:363-366` shows "Text Edit Mode" but no hint about how to exit:
```tsx
<div className="bg-purple-600/90 text-white px-3 py-1.5 rounded-full">
  Text Edit Mode
</div>
```

**Criteria:** Spec states "Press Escape to exit" (line 299). Users need visible hint.

**Effect:** New users may not know Escape exits the mode, leading to confusion.

**Recommendation:** Add "(Esc to exit)" similar to Preview mode indicator at `ModeToolbar.tsx:206-220`.

**Priority:** P2 - Onboarding/discoverability issue
**Estimated Fix:** 10 min

---

#### GAP-6: Unsaved Direct Edit Prompt Missing

**Condition:** On Escape with direct writes, the code exits immediately without checking for unsaved state. The spec mentions "Unsaved direct edits prompted for save" but no dialog exists.

**Criteria:** Spec states "Unsaved direct edits prompted for save" (line 302)

**Effect:** Since direct writes are immediate (written to file on each edit), this may not be an issue in practice. However, if an edit is in progress (contentEditable active), Escape just finishes editing and exits without confirmation.

**Recommendation:**
1. If direct write mode AND active editor has changes, show confirmation dialog before exiting
2. Or mark this as "Intentional Deviation" since each keystroke is saved immediately

**Priority:** P2 - Edge case, may be intentional design choice
**Estimated Fix:** 1 hour (if needed)

---

### P3 (Low) - 2 Issues

#### GAP-7: Text Element Detection Overly Broad

**Condition:** `isEditableText` at `TextEditMode.tsx:62-85` checks a broad list of tags including `div`:
```typescript
const textTags = [
  "p", "span", "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "li", "td", "th", "label", "button", "div",
];
```

**Criteria:** Spec says "Edit text content directly on the page" (line 270). Including `div` may allow editing structural elements that shouldn't be edited.

**Effect:** Users can click into layout divs that happen to have text, potentially breaking layouts or editing unintended content.

**Recommendation:** Be more restrictive - only allow semantic text elements (p, h1-h6, span with direct text) or elements explicitly marked as editable.

**Priority:** P3 - Edge case, current behavior works for most cases
**Estimated Fix:** 30 min

---

#### GAP-8: Clipboard Mode Exit Toast Position Duplicated

**Condition:** Exit toast rendering code appears twice - once at lines 343-357 (when `!textEditMode && showExitToast`) and again at lines 559-572 (when `showExitToast`).

**Criteria:** Clean code structure

**Effect:** Potential for duplicate toasts or confusion about which renders when. The first renders only when mode is off, second is inside the main render when mode is on. Minor code smell.

**Recommendation:** Consolidate toast rendering to single location.

**Priority:** P3 - Code quality
**Estimated Fix:** 15 min

---

## Intentional Deviations (Documented/Justified)

| Deviation | Justification |
|-----------|---------------|
| Rich text via `execCommand` API | Simpler than full editor library; covers MVP formatting needs |
| Rust backend for file writes | Aligns with Tauri architecture spec - Rust handles file operations |
| localStorage for mode preference | Quick persistence without backend; fits desktop app pattern |

---

## Spec Issues (Spec Needs Update)

| Issue | Location | Recommendation |
|-------|----------|----------------|
| "Double-click to edit" vs single-click | Line 273 (epic smoke test) | Either update spec to match current (single-click) or fix implementation |
| Rich text scope unclear | Lines 276-287 | Clarify MVP vs future: which formats are required for v1? |

---

## Implementation Quality Notes

### Strengths
1. **Dual output modes** - Clipboard and direct write toggle is well-implemented with clear visual distinction
2. **Undo/redo system** - Full undo stack with file modification tracking for conflict detection
3. **Conflict handling** - External file modification detection with user choice dialog (overwrite/reload/cancel)
4. **Clean state management** - Zustand slice with clear separation of concerns
5. **Rich feedback** - Toasts for edit counts, undo/redo status, and errors

### Areas for Improvement
1. **Mock data dependency** - Same issue as Component ID Mode; needs real DOM correlation
2. **Limited rich text** - Only basic formatting; spec promises more
3. **No test coverage** - No unit tests visible for text edit logic

---

## Follow-up Tasks Recommended

1. **fn-8.4.1** - Add headings/lists/links rich text support (P1, GAP-1)
2. **fn-8.4.2** - Implement DOM element correlation (P1, GAP-2, shared with fn-8.3)
3. **fn-8.4.3** - Change to double-click activation (P2, GAP-3)
4. **fn-8.4.4** - Add escape hint to mode indicator (P2, GAP-5)
5. **fn-8.4.5** - Track rich text formatting in clipboard output (P2, GAP-4)

---

## Files Reviewed

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/TextEditMode.tsx` | Main mode component | 576 |
| `src/stores/slices/textEditSlice.ts` | State management | 265 |
| `src-tauri/src/commands/text_edit.rs` | Rust file write commands | 192 |
| `src/hooks/useKeyboardShortcuts.ts` | Keyboard shortcuts | 115 |
| `src/components/ModeToolbar.tsx` | Mode toggle UI | 224 |
| `docs/features/06-tools-and-modes.md` | Specification | 511 |
