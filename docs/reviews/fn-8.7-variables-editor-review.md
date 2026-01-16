# fn-8.7 Review: Variables Editor (Tokens Editor)

**Spec:** `/docs/features/01-variables-editor.md`
**Scope:** Design tokens viewer/editor for colors, shadows, radius, spacing, animation, and effects
**Date:** 2026-01-16
**Reviewer:** fn-8.7 task

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Completion** | ~35% |
| **Gaps Found** | 12 (P0: 2, P1: 5, P2: 3, P3: 2) |
| **Smoke Test** | PARTIAL |

The Variables Editor has a **solid foundation** with working token parsing (Rust backend via lightningcss), display (VariablesPanel.tsx), and inline editing UI. However, the implementation covers only the **read path** - tokens are parsed and displayed but **cannot be saved back**. The spec defines a sophisticated token editing workflow including pending changes, save/reset/reload actions, semantic token mapping via drag-and-drop, color modes (light/dark), contrast validation, and several token categories that aren't implemented (animation tokens, effects tokens).

**Architecture status:**
- **Working:** Token parsing (Rust), token display (4 categories), inline edit UI, pending changes tracking, reload action
- **Missing:** Token persistence (no `update_token` command), semantic token mapping, color modes, contrast validation, animation/effects tokens, preview drawer

---

## Smoke Test Results

| Test | Status | Notes |
|------|--------|-------|
| Tokens load from theme | PASS | `tokensSlice.ts:15-25` parses via Rust `parseTokens` |
| Color tokens display with swatches | PASS | `VariablesPanel.tsx:171-193` - ColorTokenRow component |
| Spacing tokens with visualization | PASS | `VariablesPanel.tsx:201-228` - bar width visualization |
| Border radius preview | PASS | `VariablesPanel.tsx:236-258` - shows rounded square |
| Shadow previews | PASS | `VariablesPanel.tsx:266-286` - shows shadow on element |
| Edit value inline (click to edit) | PASS | `InlineEdit` component, lines 88-159 |
| Enter commits, Escape cancels | PASS | `handleKeyDown` lines 104-114 |
| Pending changes counter | PASS | `VariablesPanel.tsx:593-605` - shows count |
| Reset pending changes | PASS | Button clears `pendingChanges` Map |
| Save commits changes | FAIL | **No save implementation** - no `update_token` command |
| Light/dark mode selector | NOT IMPLEMENTED | Not found in codebase |
| Drag-and-drop semantic mapping | NOT IMPLEMENTED | Not found in codebase |
| Animation token editing | NOT IMPLEMENTED | No animation token support |
| Effects token editing | NOT IMPLEMENTED | No blur/focus ring support |
| Preview drawer | NOT IMPLEMENTED | No preview drawer component |
| Contrast accessibility check | NOT IMPLEMENTED | No WCAG checking |

---

## Detailed Gap Analysis

### P0 (Critical) - 2 Issues

#### GAP-1: Cannot Save Token Changes (Missing Write Command)

**Condition:** The Rust backend only has `parse_tokens` command. There is no `update_token` command to write changes back to CSS files.

```typescript
// bindings.ts - Available token commands
async parseTokens(cssPath: string) : Promise<Result<ThemeTokens, string>>
// No update_token, no write_tokens, no save_tokens
```

```rust
// src-tauri/src/commands/tokens.rs - Only parsing
pub fn parse_tokens(css_path: String) -> Result<ThemeTokens, String>
// No update_token function defined
```

**Criteria:** Spec section "Persistence" (lines 213-244):
- "Save Action: Committing changes writes to source files"
- "Single action saves all pending changes"
- "Changes write to appropriate source locations"

**Effect:** The entire Variables Editor is read-only. Users can view tokens and even make inline edits, but the edits exist only in React state (`pendingChanges` Map) and are lost on refresh. This defeats the core purpose of the editor.

**Recommendation:**
1. Implement Rust `update_token(css_path, name, value)` command in `tokens.rs`
2. Add to lib.rs command registration
3. Regenerate bindings
4. Add "Save" button to VariablesPanel that calls `update_token` for each pending change
5. Consider batch command `update_tokens(css_path, changes: HashMap<String, String>)` for efficiency

**Priority:** P0 - Core functionality non-existent
**Estimated Fix:** 4-6 hours (Rust implementation + frontend wiring)

---

#### GAP-2: No Token Category Support for Animation and Effects

**Condition:** `TOKEN_CATEGORIES` only includes 4 types. Spec defines 6 categories.

```typescript
// VariablesPanel.tsx:42-47 - Current categories
const TOKEN_CATEGORIES: TokenCategory[] = [
  { label: "Colors", prefix: "--color-", type: "color" },
  { label: "Spacing", prefix: "--spacing-", type: "spacing" },
  { label: "Radius", prefix: "--radius-", type: "radius" },
  { label: "Shadows", prefix: "--shadow-", type: "shadow" },
];
// Missing: Animation, Effects
```

**Criteria:** Spec section "Token Architecture" defines:
- Animation Tokens (lines 82-95): `duration-fast`, `duration-base`, `timing-default`, etc.
- Effects Tokens (lines 97-114): `blur-none`, `blur-sm`, `focus-ring-width`, etc.

**Effect:**
- Animation tokens (duration, timing functions) not displayed or editable
- Effects tokens (backdrop blur, focus ring) not displayed or editable
- Theme motion feel and accessibility focus rings cannot be managed
- Spec states "Animation timing is part of theme identity" - but it's invisible in the editor

**Recommendation:**
1. Add to `TOKEN_CATEGORIES`:
   ```typescript
   { label: "Animation", prefix: "--duration-", type: "animation" },
   { label: "Animation", prefix: "--timing-", type: "animation" },
   { label: "Effects", prefix: "--blur-", type: "effects" },
   { label: "Effects", prefix: "--focus-ring-", type: "effects" },
   ```
2. Create `AnimationTokenRow` component with duration slider/visualizer
3. Create `EffectsTokenRow` component with blur preview, focus ring preview

**Priority:** P0 - Two entire token categories are missing from the editor
**Estimated Fix:** 3-4 hours

---

### P1 (High) - 5 Issues

#### GAP-3: No Color Modes (Light/Dark) Support

**Condition:** No light/dark mode switching UI. Token editing assumes single mode.

**Criteria:** Spec section "Color Modes" (lines 163-180):
- "Mode selector switches the editing context"
- "Token values may differ between modes"
- "Changes persist to the appropriate mode definition"

**Effect:** Users cannot edit light vs dark mode tokens separately. Modern design systems require per-mode token definitions (e.g., `--color-surface: #fff` in light, `--color-surface: #1a1a1a` in dark).

**Recommendation:**
1. Add color mode state to tokensSlice: `currentColorMode: 'light' | 'dark'`
2. Add mode toggle UI in VariablesPanel header
3. Filter/display tokens based on mode
4. Requires CSS parsing to understand mode context (could use `@media (prefers-color-scheme)` or separate token files)

**Priority:** P1 - Major design system feature
**Estimated Fix:** 4-6 hours

---

#### GAP-4: No Semantic Token Drag-and-Drop Mapping

**Condition:** Semantic tokens cannot be remapped to different base colors via drag-and-drop.

**Criteria:** Spec section "Drag-and-Drop Token Mapping" (lines 140-149):
- "Drag a semantic token over base color swatches"
- "Valid drop targets highlight"
- "Dropping creates a new mapping"
- "Visual preview shows result before dropping"

**Effect:** Users must manually type var() references to remap tokens. Spec describes intuitive visual remapping where dragging `surface-primary` onto a base color swatch creates the mapping.

**Recommendation:**
1. Add `react-dnd` or native drag/drop support
2. Make semantic tokens draggable
3. Make base color swatches drop targets
4. Show preview on hover before drop
5. Update token mapping on drop (requires GAP-1 save functionality)

**Priority:** P1 - Distinguishing UX feature per spec
**Estimated Fix:** 4-6 hours (depends on GAP-1)

---

#### GAP-5: No Contrast Accessibility Checking

**Condition:** No WCAG contrast validation. Spec explicitly requires this.

**Criteria:** Spec section "Validation" (lines 263-280):
- "Surface + Content combinations checked for WCAG compliance"
- "Warning indicators for low-contrast pairings"
- "Suggestions for improving contrast"

Spec "Research Notes" mentions:
- "WCAG Contrast Calculation"
- "Relative luminance formula"
- "Contrast ratio algorithm (WCAG 2.1 AA/AAA thresholds)"

**Effect:** Users can create inaccessible color combinations without warning. This is a core accessibility feature for design system tools.

**Recommendation:**
1. Implement Rust `validate_contrast(fg, bg)` command (mentioned in spec line 358)
2. Add contrast indicator next to surface/content token pairs
3. Show warning badge for ratios below WCAG thresholds
4. Color-code: green (AAA), yellow (AA only), red (fail)

**Priority:** P1 - Accessibility requirement
**Estimated Fix:** 3-4 hours (Rust + frontend)

---

#### GAP-6: No Preview Drawer

**Condition:** No preview panel showing tokens in realistic contexts.

**Criteria:** Spec section "Live Preview" (lines 185-207):
- "A dedicated preview panel shows design tokens in realistic contexts"
- "See how colors work together before committing"
- "Updates in real-time as values change"
- "Shows multiple token categories in use"

**Effect:** Users edit tokens in isolation without seeing how they combine. The preview drawer is essential for validating color harmonies, surface/content pairs, and shadow elevations in context.

**Recommendation:**
1. Create `TokenPreviewDrawer` component
2. Show sample UI elements using current tokens (cards, buttons, text blocks)
3. Update preview in real-time as `pendingChanges` change
4. Toggle show/hide independent of editing

**Priority:** P1 - Essential editing feedback
**Estimated Fix:** 3-4 hours

---

#### GAP-7: No Token Relationship Visualization

**Condition:** No visual indication of how semantic tokens relate to base colors.

**Criteria:** Spec lines 200-207:
- "Visual lines or indicators show token derivation"
- "Changing a base color shows all affected semantic tokens"
- "Orphaned tokens (pointing to deleted colors) are highlighted"

**Effect:** Users cannot see token dependency graph. If `--color-primary` is referenced by 10 semantic tokens, editing it should show the impact. Currently, there's no visibility into these relationships.

**Recommendation:**
1. Parse `var()` references during token loading
2. Build dependency graph: `baseColor -> [semanticTokens]`
3. On hover/edit of base color, highlight all dependent tokens
4. Show orphan warnings for broken references

**Priority:** P1 - Critical for understanding token architecture
**Estimated Fix:** 3-4 hours

---

### P2 (Medium) - 3 Issues

#### GAP-8: ColorsPanel Not Integrated with VariablesPanel

**Condition:** Two separate components handle colors: `ColorsPanel.tsx` (for property editing) and `VariablesPanel.tsx` (for token viewing). They don't share state well.

```typescript
// ColorsPanel.tsx - Extracts tokens for color picking
const colorTokens = useMemo((): ColorToken[] => {...})

// VariablesPanel.tsx - Also extracts tokens for editing
const parsedTokens = useCallback((): Map<string, ParsedToken[]> => {...})
```

**Criteria:** Spec describes Variables Editor as the central place for token management. Property panels should reference the same token data.

**Effect:** Potential inconsistency between token display in Variables Editor and token picker in Colors Panel. Duplicate parsing logic.

**Recommendation:**
1. Unify token parsing into tokensSlice (already partially there)
2. ColorsPanel should consume from store, not re-parse
3. Consider combining VariablesPanel into a "Design Tokens" tab with sub-sections

**Priority:** P2 - Code quality / consistency
**Estimated Fix:** 2 hours

---

#### GAP-9: No Undo Stack for Individual Changes

**Condition:** Only "Reset All" exists. No per-change undo.

**Criteria:** Spec "Ideal Behaviors" (line 294):
- "Individual changes should be undoable, not just the entire pending set"
- "Users should be able to step back through their editing session"

**Effect:** Editing multiple tokens and making one mistake requires resetting everything. Standard UX expectation is Cmd+Z for single-step undo.

**Recommendation:**
1. Add change history array: `editHistory: Array<{name, oldValue, newValue}>`
2. Implement `undo()` that pops last change
3. Wire to Cmd+Z keyboard shortcut
4. Consider redo stack as well

**Priority:** P2 - UX polish
**Estimated Fix:** 2 hours

---

#### GAP-10: Reload Action Doesn't Warn About Pending Changes

**Condition:** `handleReload` clears pending changes without confirmation.

```typescript
// VariablesPanel.tsx:402-408
const handleReload = useCallback(() => {
  if (currentProject?.path) {
    const cssPath = `${currentProject.path}/src/styles/globals.css`;
    loadTokens(cssPath);
    setPendingChanges(new Map()); // Silently clears!
  }
}, [currentProject?.path, loadTokens]);
```

**Criteria:** Spec line 249: "Warns if pending changes would be lost"

**Effect:** User with unsaved work accidentally clicks refresh and loses all changes without warning.

**Recommendation:**
1. Check `pendingChanges.size > 0` before reload
2. Show confirmation dialog: "You have N pending changes. Reload will discard them."
3. Offer "Save & Reload" option

**Priority:** P2 - Data loss prevention
**Estimated Fix:** 30 minutes

---

### P3 (Low) - 2 Issues

#### GAP-11: No Smart Defaults for New Colors

**Condition:** No name suggestion when adding new colors.

**Criteria:** Spec "Ideal Behaviors" (line 291):
- "When adding new colors, the system should suggest names based on the color value"
- "e.g., suggesting 'blue-500' for a medium blue"

**Effect:** Manual naming required. Minor UX enhancement.

**Recommendation:** Use color analysis library to suggest names based on hue/saturation/lightness.

**Priority:** P3 - Nice-to-have UX
**Estimated Fix:** 2 hours

---

#### GAP-12: No Color Harmony Tools

**Condition:** No palette generation tools.

**Criteria:** Spec "Ideal Behaviors" (lines 296-298):
- "Color Harmony Tools"
- "Complementary, analogous, triadic relationships"

**Effect:** Users must calculate harmonious colors manually or use external tools.

**Recommendation:** Add harmony generator dropdown with preset algorithms.

**Priority:** P3 - Enhancement
**Estimated Fix:** 2-3 hours

---

## Intentional Deviations (Documented/Justified)

| Deviation | Justification |
|-----------|---------------|
| Custom color picker in ColorsPanel uses react-colorful | Spec mentions native macOS picker, but web-based picker is cross-platform and works well |
| Mock data shown when no tokens loaded | Good UX - shows what the panel will look like when populated |

---

## Spec Issues (Spec Needs Update)

| Issue | Location | Recommendation |
|-------|----------|----------------|
| Spacing ownership unclear | Line 16 | Spec says "Spacing (Tailwind handles this)" but TOKEN_CATEGORIES includes spacing. Clarify if editor should show spacing or not |
| Token file structure not specified | Lines 226-232 | Where exactly do tokens live? Single CSS file? Multiple? Clarify source file architecture |
| Native vs web color picker | Line 321 | Spec questions native vs custom - implementation chose react-colorful, spec should document decision |

---

## Implementation Quality Notes

### Strengths
1. **Rust backend parsing** - lightningcss-based parsing is robust, handles @theme inline/public
2. **Component architecture** - Clean separation of token row components by type
3. **InlineEdit component** - Reusable, handles keyboard and blur correctly
4. **Pending changes tracking** - React state properly tracks uncommitted edits
5. **Collapsible sections** - Good UX for organizing token categories
6. **Error/loading states** - Proper handling of async token loading

### Critical Gaps
1. **No write path** - Tokens cannot be saved (read-only editor)
2. **Missing token categories** - Animation and Effects not supported
3. **No color modes** - Light/dark switching not implemented
4. **No accessibility features** - Contrast checking missing

---

## Follow-up Tasks Recommended

1. **fn-8.7.0** - Implement `update_token` Rust command for saving (P0, GAP-1, BLOCKS ALL EDITING)
2. **fn-8.7.1** - Add Animation and Effects token categories (P0, GAP-2)
3. **fn-8.7.2** - Implement light/dark mode switching (P1, GAP-3)
4. **fn-8.7.3** - Implement drag-and-drop semantic token mapping (P1, GAP-4, depends on fn-8.7.0)
5. **fn-8.7.4** - Add WCAG contrast validation (P1, GAP-5)
6. **fn-8.7.5** - Create Token Preview Drawer (P1, GAP-6)
7. **fn-8.7.6** - Add token relationship visualization (P1, GAP-7)
8. **fn-8.7.7** - Unify ColorsPanel and VariablesPanel token handling (P2, GAP-8)
9. **fn-8.7.8** - Implement undo stack for individual changes (P2, GAP-9)
10. **fn-8.7.9** - Add reload confirmation dialog (P2, GAP-10)

---

## Files Reviewed

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/VariablesPanel.tsx` | Main tokens display/edit UI | 635 |
| `src/components/ColorsPanel.tsx` | Property panel color picker | 536 |
| `src/stores/slices/tokensSlice.ts` | Token state management | 29 |
| `src-tauri/src/commands/tokens.rs` | Rust token parsing | 238 |
| `src/bindings.ts` | Generated Tauri bindings | 483 |
| `docs/features/01-variables-editor.md` | Specification | 364 |
