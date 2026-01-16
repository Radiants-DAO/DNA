# fn-8.8 Review: Typography Editor

**Spec:** `/docs/features/02-typography-editor.md`
**Scope:** Styleguide view for HTML elements + font management + typography property editing
**Date:** 2026-01-16
**Reviewer:** fn-8.8 task

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Completion** | ~15% |
| **Gaps Found** | 14 (P0: 3, P1: 5, P2: 4, P3: 2) |
| **Smoke Test** | FAIL |

The Typography Editor specification describes a comprehensive system for managing base HTML element styles (h1-h6, p, a, li, etc.) and fonts. The implementation (`TypographyPanel.tsx`) is a **property panel** for editing font properties on selected components—not a styleguide view for base elements. The spec's core features are almost entirely missing:

**Critical gaps:**
- **No Styleguide View** - The spec describes a living styleguide showing all HTML elements with actual theme styles. Not implemented.
- **No Font Manager** - The spec describes viewing, adding (via link or upload), and managing fonts. Not implemented.
- **No Base Element Editing** - Cannot edit h1-h6, p, a, etc. at the base level (in `@layer base`). Only component-level property editing exists.
- **No Persistence** - Element style changes should write to `typography.css` via `@layer base`. Not implemented.

**What exists:**
- `TypographyPanel.tsx` (571 lines) - A property panel that shows font-related controls (family, size, weight, line-height, letter-spacing, text-align) with token pickers. This is useful for component-level styling but is NOT the Typography Editor described in the spec.
- `typography.css` and `fonts.css` exist in the theme package with proper structure, but there's no UI to edit them.

---

## Smoke Test Results

| Test | Status | Notes |
|------|--------|-------|
| Styleguide renders HTML elements | NOT IMPLEMENTED | No styleguide component exists |
| Click element shows properties | NOT IMPLEMENTED | TypographyPanel requires component selection, not element selection |
| Font dropdown populated from theme | PARTIAL | `TypographyPanel.tsx:75-95` extracts font tokens, but no fonts from @font-face |
| Font family edit | PARTIAL | Can select token, copies to clipboard. No file write. |
| Font size edit | PARTIAL | Can select token, copies to clipboard. No file write. |
| Font weight edit | PASS | Select dropdown, copies to clipboard (`applyWeight` lines 168-185) |
| Text alignment edit | PASS | Button group, copies to clipboard (`applyAlignment` lines 188-205) |
| Token search filters results | PASS | Search input at lines 120-128, `filteredTokens` useMemo |
| Direct write mode toggle | PASS | Toggle button lines 226-246 in header |
| Toast shows on action | PASS | Toast component lines 414-418 |
| Controls disabled without selection | PASS | `hasSelection` check throughout panel |
| Changes write to typography.css | FAIL | **No write implementation** - only clipboard copy |
| Font Manager - view fonts | NOT IMPLEMENTED | No font list UI |
| Font Manager - add font via URL | NOT IMPLEMENTED | No add font UI |
| Font Manager - upload font file | NOT IMPLEMENTED | No upload UI |
| Font roles (headings/body/mono) | NOT IMPLEMENTED | No font role UI |
| Direct text editing on page | NOT IMPLEMENTED | (This may be in TextEditMode, not Typography Editor) |
| Tag conversion (h1 → h2, etc.) | NOT IMPLEMENTED | No tag conversion UI |

---

## Detailed Gap Analysis

### P0 (Critical) - 3 Issues

#### GAP-1: No Styleguide View Component

**Condition:** The spec's primary feature—a living styleguide view—does not exist. No component renders HTML elements with theme styles.

**Criteria:** Spec section "Styleguide View" (lines 19-71):
- "All styleable text elements displayed as a living styleguide"
- "Each element renders with actual theme styles"
- Shows H1-H6, p, a, ul/ol/li, strong, em, blockquote, code, pre, label, figcaption
- "Click any element in styleguide → Properties Panel shows its styles"

**Effect:** Users have no visual reference for how base HTML elements will render. The entire concept of editing base element styles (the core purpose of the Typography Editor) is not available. Users cannot see the typographic hierarchy of their design system.

**Recommendation:**
1. Create `StyleguideView.tsx` component
2. Render all HTML elements from spec table (lines 24-39)
3. Load actual styles from theme's `typography.css`
4. Connect to Properties Panel for editing
5. Show element selector state when clicked

**Priority:** P0 - The defining feature of Typography Editor
**Estimated Fix:** 4-6 hours

---

#### GAP-2: No Base Element Style Editing/Persistence

**Condition:** While the Rust backend has write commands for style edits (`file_write.rs:write_style_edits`) and text changes (`text_edit.rs:write_text_change`), there is no token-specific or typography-specific write command. The existing `parse_tokens` in `tokens.rs` only reads @theme blocks—there's no `update_element_style` or `write_typography` command for modifying `@layer base` rules.

```typescript
// TypographyPanel.tsx - Only copies to clipboard
const applyToken = useCallback(async (token: Token) => {
  // ...
  if (directWriteMode && selectedComponents.length > 0) {
    showNotification(`Would write: ${cssLine}`);  // Placeholder, no implementation
  } else {
    await navigator.clipboard.writeText(cssLine);  // Just clipboard copy
  }
}, [...]);
```

**Criteria:** Spec section "Persistence" (lines 203-217):
- "Element styles save to `@layer base { h1 { } }` in typography.css"
- "Font faces save to `@font-face { }` in fonts.css"
- "Change Tracking: Pending changes indicated"
- "Save commits all changes"

**Effect:** Typography Editor is read-only. Users can view fonts (from tokens) but cannot actually edit base element styles. This defeats the purpose of having a Typography Editor.

**Recommendation:**
1. Add `update_element_style(css_path, element, property, value)` command to a new `typography.rs`
2. Follow the pattern from `write_text_change` for line-level replacement
3. Or extend `write_style_edits` pattern for CSS typography updates
4. Add pending changes tracking (like VariablesPanel)
5. Add Save/Reset buttons

**Priority:** P0 - Core write functionality missing
**Estimated Fix:** 6-8 hours
- 2 hours: Rust command implementation (parse + write)
- 1 hour: TypeScript bindings + store integration
- 2-3 hours: UI wiring + testing
- 1 hour: Error handling + edge cases

---

#### GAP-3: No Font Manager

**Condition:** The Font Manager feature is completely missing. Users cannot view, add, or manage fonts.

**Criteria:** Spec section "Font Manager" (lines 135-178):
- "View fonts currently in theme" with weights listed
- "Add Font via Link (Google Fonts, CDN)"
- "Add Font via Upload (.woff2, .woff, .ttf files)"
- "Font Roles: Headings, Body, Mono dropdowns"
- "Changing role updates all elements using that role"

Current font.css exists but is not exposed in UI:
```css
/* packages/theme-rad-os/fonts.css */
@font-face {
  font-family: 'Mondwest';
  src: url('/fonts/Mondwest-Regular.woff2') format('woff2');
  font-weight: 400;
  /* ... */
}
```

**Effect:** Users cannot:
- See what fonts are available in the theme
- Add new fonts (local or Google Fonts)
- Manage font roles (which font for headings vs body)

**Recommendation:**
1. Create `FontManager.tsx` component
2. Parse `fonts.css` to list available fonts + weights
3. Implement font upload flow (file picker → asset copy → @font-face generation)
4. Implement Google Fonts link flow
5. Add font role management UI

**Priority:** P0 - Major feature section entirely missing
**Estimated Fix:** 8-10 hours

---

### P1 (High) - 5 Issues

---

#### GAP-5: No Properties Panel for Base Elements

**Condition:** The spec describes a Properties Panel that appears when clicking elements in the styleguide. This context-aware panel shows different controls based on element type.

**Criteria:** Spec section "Properties Panel" (lines 74-131):
- "For Text Elements (h1-h6, p, etc.)" - 8 properties listed
- "For Links (a)" - Same plus text-decoration and hover state
- "For Lists (ul, ol)" - List style options
- "For Code (code, pre)" - Background and mono font options
- "Tag Conversion dropdown" - Change element type

**Effect:** No element-specific property editing. Users cannot edit link hover states, list styles, code backgrounds, etc.

**Recommendation:**
1. Create `ElementPropertiesPanel.tsx`
2. Detect selected element type
3. Show context-appropriate controls per spec table
4. Include tag conversion dropdown

**Priority:** P1 - Key editing interface
**Estimated Fix:** 4-5 hours

---

#### GAP-6: No Token Scale Options (From Spec)

**Condition:** The spec defines specific scale options for properties. The implementation uses arbitrary token filtering. Additionally, tokens.css has 8 font sizes (2xs through 4xl) but doesn't have semantic line-height or letter-spacing tokens.

**Criteria:** Spec line 86-90:
- Font size: "From scale (xs, sm, base, lg, xl)"
- Line height: "From scale (tight, normal, relaxed)"
- Letter spacing: "From scale (tight, normal, wide)"

**Current tokens.css:**
```css
--text-xs: clamp(0.625rem, 0.58rem + 0.15vw, 0.75rem);
--text-sm: clamp(0.75rem, 0.7rem + 0.17vw, 0.875rem);
/* ... 8 sizes total, but no --line-height-* or --letter-spacing-* tokens */
```

**Effect:** Token picker shows all font-related tokens rather than curated scale options. Users must know token naming conventions. Some scale tokens don't exist yet.

**Recommendation:**
1. First, decide if tokens.css should add semantic line-height/letter-spacing tokens:
   ```css
   --line-height-tight: 1.2;
   --line-height-normal: 1.5;
   --line-height-relaxed: 1.75;
   --letter-spacing-tight: -0.02em;
   --letter-spacing-normal: 0;
   --letter-spacing-wide: 0.05em;
   ```
2. Then filter token picker to show only scale tokens
3. Or, if tokens don't exist, generate scale options in UI

**Priority:** P1 - Requires token architecture decision
**Estimated Fix:** 3-4 hours (includes token definition if needed)

---

#### GAP-7: No Color Token Picker for Text

**Condition:** The spec includes "Color: Token picker (Content tokens only)" for text elements. Not implemented.

**Criteria:** Spec line 91: "Color | Token picker | Content tokens only"

**Effect:** Users cannot change text colors from the Typography Panel. They must use the Colors Panel separately.

**Recommendation:**
1. Add color property row to TypographyPanel (or ElementPropertiesPanel)
2. Filter tokens to show only `--content-*` tokens
3. Integrate with existing color picker pattern from ColorsPanel

**Priority:** P1 - Missing property control
**Estimated Fix:** 1-2 hours

---

#### GAP-8: No Tag Conversion UI

**Condition:** The spec describes tag conversion (h1 → h2, p → span, etc.) both in Properties Panel and via right-click context menu. Not implemented.

**Criteria:** Spec lines 104-121 (Properties Panel) and 195-200 (On Page):
- "Element: [h1 ▼]" dropdown with h1-h6, p, span options
- "Select new tag → Source file updates"
- "Right-click text element → change tag type"

**Effect:** Users cannot convert element types. If they need an h2 instead of h1, they must manually edit source.

**Recommendation:**
1. Add tag dropdown to Properties Panel
2. Implement `writeTextChange` variant for tag conversion (update opening/closing tags)
3. Consider context menu integration for on-page conversion

**Priority:** P1 - Key editing feature
**Estimated Fix:** 3-4 hours

---

#### GAP-9: No Rust Backend for Typography/Font Parsing

**Condition:** The Rust backend has `parse_tokens` for @theme blocks but nothing for @font-face or @layer base rules.

```rust
// src-tauri/src/commands/tokens.rs - Only parses @theme
if name.as_ref() == "theme" { ... }
// No handling for @font-face or @layer base
```

**Criteria:** Spec "Rust Backend Integration" (lines 269-284):
- `parse_font_file(path)` → Font metadata (family, weights, styles)
- `add_font_to_theme(file, theme_id)` → Copy file, update CSS
- `generate_font_face(font_config)` → CSS @font-face string

**Effect:** No backend support for Font Manager or base style editing.

**Recommendation:**
1. Add `parse_typography(css_path)` command - extract @layer base rules
2. Add `parse_fonts(css_path)` command - extract @font-face declarations
3. Add `update_typography(css_path, element, styles)` command
4. Consider `ttf-parser` crate for font file metadata extraction

**Priority:** P1 - Backend foundation needed
**Estimated Fix:** 4-6 hours

---

### P2 (Medium) - 4 Issues

#### GAP-4: TypographyPanel Is Component-Level, Not Base-Level

**Condition:** `TypographyPanel.tsx` is designed for component-level styling, not base element editing.

```typescript
// TypographyPanel.tsx:54 - Requires component selection
const selectedComponents = useAppStore((s) => s.selectedComponents);
// ...
const hasSelection = selectedComponents.length > 0;
// Line 247-251: Shows "Select a component to edit typography"
```

**Criteria:** Spec clearly distinguishes:
- "Typography Editor owns: HTML element base styles (h1-h6, p, a, li, etc.)"
- "What it doesn't own: Component-specific text styles (Component Browser)"

The current panel is for component-specific styles, which the spec says belongs in Component Browser.

**Effect:** Architectural observation—the panel serves a different purpose than the spec describes. However, the current panel is functional and useful for component styling; it doesn't block implementing the spec's Typography Editor (they can coexist).

**Recommendation:**
1. Keep current `TypographyPanel.tsx` for component-level styling
2. Create new `TypographyEditor.tsx` that operates on base elements (per spec)
3. Update spec to clarify: Component Browser owns component text styles, Typography Editor owns base HTML element styles

**Priority:** P2 - Architectural alignment (not blocking, but clarifies scope)
**Estimated Fix:** 2-3 hours (refactoring scope)

---

#### GAP-10: No Text Transform Controls

**Condition:** Spec includes text-transform buttons: `[Aa] [AA] [aa]`. Not implemented.

**Criteria:** Spec line 89: "Text transform | Buttons | `[Aa] [AA] [aa]`"

Current TypographyPanel has text-align buttons but not text-transform.

**Effect:** Users cannot set uppercase/lowercase/capitalize from the panel.

**Recommendation:** Add text-transform button group similar to text-align.

**Priority:** P2 - Missing control
**Estimated Fix:** 30 minutes

---

#### GAP-11: No Link-Specific Controls

**Condition:** Links need special handling (underline toggle, hover state section). Not implemented.

**Criteria:** Spec lines 93-95:
- "For Links (a): Same as above, plus:"
- "Text decoration toggle (underline on/off)"
- "Hover state section"

**Effect:** Users cannot style links specifically (underline, hover effects).

**Recommendation:**
1. Detect when selected element is `<a>`
2. Show additional controls: text-decoration toggle, hover state subsection

**Priority:** P2 - Element-specific feature
**Estimated Fix:** 1-2 hours

---

#### GAP-12: No Code/Pre-Specific Controls

**Condition:** Code elements need different controls (background, mono fonts). Not implemented.

**Criteria:** Spec lines 100-102:
- "For Code (code, pre):"
- "Background (surface tokens)"
- "Font family (mono fonts)"

**Effect:** Users cannot style code blocks appropriately (background color, mono font selection).

**Recommendation:**
1. Detect when selected element is `<code>` or `<pre>`
2. Show background token picker (surface tokens only)
3. Filter font dropdown to mono fonts only

**Priority:** P2 - Element-specific feature
**Estimated Fix:** 1 hour

---

### P3 (Low) - 2 Issues

#### GAP-13: No Font Preview Before Applying

**Condition:** Spec's "Ideal Behaviors" section mentions font preview. Not implemented.

**Criteria:** Spec line 223: "Preview fonts before applying"

**Effect:** Users cannot preview how text will look with a different font before committing.

**Recommendation:** Show live preview in token picker or dedicated preview area.

**Priority:** P3 - Enhancement
**Estimated Fix:** 2 hours

---

#### GAP-14: No Contrast Preview

**Condition:** Spec mentions contrast preview when changing text colors. Not implemented.

**Criteria:** Spec line 229: "Show contrast ratio when changing text colors"

**Effect:** Users may create inaccessible text/background combinations without warning.

**Recommendation:** Integrate WCAG contrast checking (related to Variables Editor GAP-5).

**Priority:** P3 - Accessibility enhancement
**Estimated Fix:** 2 hours (if contrast utility from Variables Editor exists)

---

## Intentional Deviations (Documented/Justified)

| Deviation | Justification |
|-----------|---------------|
| None identified | N/A |

The current implementation doesn't appear to be an intentional deviation—it's simply a different feature (component property panel) than what the spec describes (base element styleguide + editor).

---

## Spec Issues (Spec Needs Update)

| Issue | Location | Recommendation |
|-------|----------|----------------|
| Direct Text Editing ownership | Lines 181-200 | "Direct Text Editing" section may belong in TextEditMode spec, not Typography Editor. Clarify ownership. |
| "Prompt the agent" language | Line 131 | "Want custom styling? → Prompt the agent" - AI integration is out of scope (per 09-ai-integration exclusion). Remove or clarify. |
| Joystix font in spec example | Lines 141-175 | Spec shows "Joystix Monospace" but theme has "PixelCode" for mono. Update spec to match actual theme. |
| Typography.css structure undefined | Lines 203-217 | Spec says "Element styles save to @layer base { h1 { } } in typography.css" but doesn't specify: (1) Is typography.css in theme package or target project? (2) How are @layer base rules organized? Clarify file architecture. |

---

## Relationship to Variables Editor (fn-8.7)

Both Typography Editor and Variables Editor share similar gaps:

| Gap | Variables Editor | Typography Editor |
|-----|------------------|-------------------|
| No write command | GAP-1 (P0) | GAP-2 (P0) |
| Pending changes UI exists | ✅ Implemented | ✅ Implemented |
| No undo stack | GAP-9 (P2) | Not applicable (no edits yet) |
| No contrast checking | GAP-5 (P1) | GAP-14 (P3) |
| Missing token categories | GAP-2 (P0) - Animation/Effects | GAP-6 (P1) - Line-height/Letter-spacing |

**Recommendation:** Implement token write infrastructure once, share between both editors. The `update_token` command pattern can serve both Variables Editor and Typography Editor persistence needs.

---

## Implementation Quality Notes

### Current TypographyPanel Strengths

1. **Token integration** - Extracts font tokens from store correctly (`fontTokens` useMemo, lines 75-95)
2. **Property filtering** - Filters tokens by property type (lines 98-131)
3. **Clean UI** - Well-structured property rows, dropdown, button groups
4. **Direct write mode toggle** - Has infrastructure for clipboard vs direct write (though write not implemented)
5. **Search** - Token search functionality works (lines 120-128)

### Critical Gaps

1. **Wrong feature** - Current panel is for component-level styling, not base element editing
2. **No styleguide** - The core visual reference is missing
3. **No font management** - Cannot view, add, or manage fonts
4. **No persistence** - Cannot save changes to typography.css
5. **No Rust backend** - No commands for typography/font parsing

---

## Follow-up Tasks Recommended

1. **fn-8.8.0** - Create StyleguideView component (P0, GAP-1)
2. **fn-8.8.1** - Implement Rust typography parsing commands (P1, GAP-9) **[BLOCKS: 8.8.3]**
3. **fn-8.8.2** - Create FontManager component (P0, GAP-3)
4. **fn-8.8.3** - Implement base element style persistence (P0, GAP-2) **[DEPENDS: 8.8.1]**
5. **fn-8.8.4** - Create ElementPropertiesPanel with context-aware controls (P1, GAP-5)
6. **fn-8.8.5** - Refactor current TypographyPanel for component-level use (P2, GAP-4)
7. **fn-8.8.6** - Add token scale filtering + define missing tokens (P1, GAP-6)
8. **fn-8.8.7** - Add color token picker for text (P1, GAP-7)
9. **fn-8.8.8** - Implement tag conversion (P1, GAP-8)
10. **fn-8.8.9** - Add text-transform buttons (P2, GAP-10)
11. **fn-8.8.10** - Add link-specific controls (P2, GAP-11)
12. **fn-8.8.11** - Add code/pre-specific controls (P2, GAP-12)

---

## Files Reviewed

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/TypographyPanel.tsx` | Component typography property panel | 571 |
| `packages/theme-rad-os/typography.css` | Base element styles (target for edits) | 163 |
| `packages/theme-rad-os/fonts.css` | @font-face declarations | 31 |
| `src-tauri/src/commands/tokens.rs` | Token parsing (no typography support) | 238 |
| `src/bindings.ts` | Tauri command bindings | 483 |
| `docs/features/02-typography-editor.md` | Specification | 289 |
