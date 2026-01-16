# fn-8.9 Review: Component Browser

**Spec:** `/docs/features/03-component-browser.md`
**Scope:** Component discovery, browsing, preview, inspection, and editing
**Date:** 2026-01-16
**Reviewer:** fn-8.9 task

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Completion** | ~25% |
| **Gaps Found** | 15 (P0: 3, P1: 6, P2: 4, P3: 2) |
| **Smoke Test** | PARTIAL |

The Component Browser specification describes a comprehensive system for discovering, previewing, inspecting, and editing components from the active theme. The current implementation has:

**What's Implemented:**
- **Rust Backend (components.rs)** - TSX parsing via SWC with props extraction, union type detection, default values, and line numbers
- **ComponentsPanel.tsx** - Basic list view with search, grouping by folder, and copy-to-clipboard
- **Tauri Commands** - `scan_components(dir)` and `parse_component(path)` exposed and working

**Critical Gaps:**
- **No Live Preview** - Spec describes live React component rendering with props playground. Not implemented.
- **No Component Manifest** - Optional manifest for richer metadata not supported.
- **No Style Editing** - Cannot edit component styles or bind tokens. Not implemented.
- **No Variant/Size Display** - Cannot view all variants or sizes side-by-side. Not implemented.
- **No Persistence** - Style changes should write to component TSX files. Not implemented.

---

## Smoke Test Results

| Test | Status | Notes |
|------|--------|-------|
| Theme scanning discovers components | PASS | `scan_components` recursively scans TSX files (components.rs:427-472) |
| Component name extracted | PASS | PascalCase function names detected (components.rs:232-238) |
| File path captured | PASS | Absolute path stored in ComponentInfo.file |
| Props interface parsed | PASS | Interface extraction works (components.rs:205-230) |
| Default prop values extracted | PASS | Destructuring defaults captured (components.rs:249-269) |
| Variant definitions detected | PASS | Union types extracted (components.rs:175-203) |
| Component list displays | PASS | ComponentsPanel.tsx renders grouped list |
| Search filters results | PASS | Real-time filtering by name/path (ComponentsPanel.tsx:274-282) |
| Grouped by category | PASS | Folder-based grouping (ComponentsPanel.tsx:285-317) |
| Collapsible sections | PASS | CollapsibleSection component (ComponentsPanel.tsx:108-134) |
| Component count per section | PASS | Count shown in section header |
| Click copies to clipboard | PASS | handleCopy function (ComponentsPanel.tsx:248-253) |
| Index updates on file change | NOT VERIFIED | File watcher exists but auto-rescan on change not confirmed |
| Component manifest support | NOT IMPLEMENTED | No manifest parsing |
| Live component preview | NOT IMPLEMENTED | No React component rendering |
| Props playground | NOT IMPLEMENTED | No interactive prop controls |
| Variant display | NOT IMPLEMENTED | No multi-variant view |
| Size display | NOT IMPLEMENTED | No size variations view |
| Style editing | NOT IMPLEMENTED | No visual style editing |
| Token binding | NOT IMPLEMENTED | No token picker for component styles |
| Pending changes tracking | NOT IMPLEMENTED | No change tracking |
| Save writes to file | NOT IMPLEMENTED | No persistence |

---

## Detailed Gap Analysis

### P0 (Critical) - 3 Issues

#### GAP-1: No Live Component Preview

**Condition:** The spec's core feature—live rendering of React components with actual theme styles—is completely missing. Users cannot see how components actually look.

**Criteria:** Spec section "Live Rendering" (lines 95-102):
- "Real React component mounted"
- "Full interactivity"
- "Actual theme styles applied"
- "State changes work"

And "Preview" section (lines 93-136) describing variant display, size display, and props playground.

**Effect:** The Component Browser is currently just a component list, not a visual browser. Users cannot:
- See how components render
- Interact with component states
- Preview different variants/sizes
- Test props interactively

**Recommendation:**
1. Create `ComponentPreview.tsx` using an iframe or React portal approach (Storybook-style isolation)
2. Load component dynamically from file path
3. Apply theme styles via CSS injection
4. Add props playground controls

**Priority:** P0 - Defining feature of Component Browser
**Estimated Fix:** 10-15 hours
- 4-5 hours: Iframe/isolation architecture
- 3-4 hours: Dynamic component loading
- 2-3 hours: Props playground UI
- 2-3 hours: Theme style injection

---

#### GAP-2: No Component Style Editing

**Condition:** The spec describes visual style editing for components with token binding. Not implemented.

**Criteria:** Spec section "Editing" (lines 170-204):
- "Style Editing: Modify component styles visually"
- "Editable: Colors, Spacing, Typography, Effects"
- "Token Binding: Connect styles to design tokens"
- "Variant Editing: Modify variant-specific styles"

**Effect:** Users cannot edit component styles from the Component Browser. They must manually edit source files.

**Recommendation:**
1. Create `ComponentStyleEditor.tsx` panel
2. Parse component file for style properties (may need enhanced TSX parsing)
3. Implement style property controls (reuse from TypographyPanel/ColorsPanel)
4. Add token picker integration
5. Implement write-back to component TSX file

**Priority:** P0 - Core editing feature
**Estimated Fix:** 12-16 hours

---

#### GAP-3: No Persistence/Write-Back

**Condition:** Style changes cannot be saved to component files. No write commands exist for component-level edits.

**Criteria:** Spec section "Persistence" (lines 206-225):
- "Component style changes → component TSX file"
- "Token binding changes → component TSX file"
- "New variants → component TSX file"
- "Pending changes indicated"
- "Save commits to file"

**Effect:** Even if editing UI existed, changes couldn't be persisted.

**Recommendation:**
1. Add `update_component_style(path, line, property, value)` Rust command
2. Extend TSX parser to identify style locations in JSX
3. Implement write logic similar to `write_style_edits` pattern
4. Add pending changes state to store
5. Add Save/Reset buttons

**Priority:** P0 - Required for editing to work
**Estimated Fix:** 8-10 hours

---

### P1 (High) - 6 Issues

#### GAP-4: No Component Manifest Support

**Condition:** The spec describes an optional manifest for richer metadata. Not implemented.

**Criteria:** Spec section "Component Manifest (Optional)" (lines 30-44):
- "Component categorization"
- "Variant enumeration"
- "Size options"
- "Compound component relationships"
- "Preview hints"

Currently components are discovered via file scanning only (lines 45-48).

**Effect:** Theme authors cannot provide structured metadata. All information must be inferred from code parsing, which has limitations.

**Recommendation:**
1. Define manifest JSON schema (e.g., `components.manifest.json`)
2. Add `parse_manifest(path)` Rust command
3. Merge manifest metadata with scanned components
4. Use manifest categories instead of folder inference

**Priority:** P1 - Enables richer component metadata
**Estimated Fix:** 4-6 hours

---

#### GAP-5: No Variant Display

**Condition:** Cannot view all variants of a component side-by-side.

**Criteria:** Spec section "Variant Display" (lines 104-110):
- "Each variant rendered separately"
- "Variant name labeled"
- "Side-by-side comparison"
- "Consistent preview container"

The Rust backend extracts union types (including variants), but the UI doesn't display them as renderable variations.

**Effect:** Users must manually toggle variant props to see different states. No visual comparison possible.

**Recommendation:**
1. For components with `variant` prop union type, auto-generate preview for each value
2. Layout in grid or horizontal scroll
3. Label each with variant name

**Priority:** P1 - Key preview feature
**Estimated Fix:** 4-5 hours (after GAP-1 resolved)

---

#### GAP-6: No Size Display

**Condition:** Cannot view size variations of a component.

**Criteria:** Spec section "Size Display" (lines 112-120):
- "Each size rendered"
- "Size name labeled"
- "Actual dimensions visible"
- "Relative scale apparent"

**Effect:** Users must manually change size props to compare sizes.

**Recommendation:**
1. For components with `size` prop union type, auto-generate preview for each value
2. Show actual rendered dimensions
3. Display in comparison grid

**Priority:** P1 - Key preview feature
**Estimated Fix:** 2-3 hours (after GAP-1 resolved)

---

#### GAP-7: No Props Playground

**Condition:** Cannot interactively modify component props.

**Criteria:** Spec section "Props Playground" (lines 122-135):
- "Boolean toggles"
- "Enum dropdowns"
- "Text inputs"
- "Reset to defaults"
- "Preview updates immediately"
- "Shows which props are modified"

**Effect:** Users cannot experiment with prop combinations. Must edit code to test.

**Recommendation:**
1. Generate controls based on prop types from ComponentInfo
2. For union types → dropdown
3. For boolean → toggle
4. For string/number → input
5. Bind to preview component props
6. Track modified vs default state

**Priority:** P1 - Core interactivity feature
**Estimated Fix:** 6-8 hours (after GAP-1 resolved)

---

#### GAP-8: No Props Reference Panel

**Condition:** Component props documentation is minimal in UI.

**Criteria:** Spec section "Props Reference" (lines 150-159):
- "Prop name"
- "Type"
- "Default value"
- "Required/optional"
- "Description (if available)"

Current UI shows `(X props)` count and nothing more.

**Effect:** Users must look at source code to understand prop types and requirements.

**Recommendation:**
1. Add expandable props table in ComponentRow or detail panel
2. Show type, default, required status
3. Parse JSDoc comments for descriptions (enhance Rust parser)

**Priority:** P1 - Documentation feature
**Estimated Fix:** 3-4 hours

---

#### GAP-9: Missing Required/Optional Prop Detection

**Condition:** The Rust parser extracts props but doesn't indicate if they're required or optional.

**Criteria:** Spec section "Props Reference" line 157: "Required/optional"

TypeScript interfaces use `?` to mark optional props. This information is not captured.

```typescript
interface ButtonProps {
  variant?: ButtonVariant;  // Optional (has ?)
  children: React.ReactNode; // Required (no ?)
}
```

**Effect:** Cannot display required vs optional in Props Reference.

**Recommendation:**
1. Modify `PropInfo` struct to include `required: bool`
2. Check for `optional` field in `TsPropertySignature` during extraction
3. Expose in TypeScript bindings

**Priority:** P1 - Completes prop parsing
**Estimated Fix:** 1-2 hours

---

### P2 (Medium) - 4 Issues

#### GAP-10: No Source Link/External Editor Integration

**Condition:** Cannot open component in external editor.

**Criteria:** Spec section "Source Link" (lines 161-167):
- "Click to reveal file path"
- "Copy path to clipboard" ✓ (Implemented)
- "Open in external editor (if configured)"

Copy path works. External editor integration does not exist.

**Effect:** Users must manually navigate to file in their IDE.

**Recommendation:**
1. Add "Open in Editor" button
2. Use system default handler or configurable editor command
3. Include line number in editor command (e.g., `code --goto file.tsx:12`)

**Priority:** P2 - Quality of life feature
**Estimated Fix:** 2-3 hours

---

#### GAP-11: No File Watcher Auto-Refresh

**Condition:** Component index may not auto-update on file changes.

**Criteria:** Spec section "Index Updates" (lines 47-54):
- "File watcher detects changes"
- "Index updates on component file save"
- "Sub-second refresh"

A file watcher exists (`start_watcher` command), but auto-rescan of components on TSX file changes is not confirmed.

**Effect:** Users must manually click "Rescan" after editing component files.

**Recommendation:**
1. Subscribe to watcher events for `.tsx` file changes
2. Trigger `scanComponents` on relevant file events
3. Debounce to prevent excessive rescans

**Priority:** P2 - Usability improvement
**Estimated Fix:** 2-3 hours

---

#### GAP-12: No Component Selection in Preview Canvas

**Condition:** Clicking a component in the list doesn't select/highlight it in the preview canvas.

**Criteria:** Spec "Browsing" section implies components can be selected for inspection/editing. ComponentsPanel.tsx line 256-259 has TODO:
```typescript
// TODO: Integrate with preview canvas selection
```

**Effect:** No visual connection between component list and canvas.

**Recommendation:**
1. Implement `handleSelect` to dispatch selection event
2. Highlight component instances in preview canvas (may require bridge integration)
3. Scroll canvas to component if off-screen

**Priority:** P2 - UX feature
**Estimated Fix:** 4-5 hours

---

#### GAP-13: Folder-Based Categories Only

**Condition:** Components are categorized by folder structure, not semantic categories.

**Criteria:** Spec section "Organization" (lines 62-67):
- "Grouped by category (from manifest or folder)"

Currently only folder-based (ComponentsPanel.tsx:288-310). Manifest categories not supported.

**Effect:** If folder structure doesn't match logical categories, grouping is suboptimal.

**Recommendation:**
1. Support manifest-based categories (after GAP-4)
2. Allow manual category override in manifest
3. Fall back to folder inference when no manifest

**Priority:** P2 - Depends on GAP-4
**Estimated Fix:** 1-2 hours (after GAP-4)

---

### P3 (Low) - 2 Issues

#### GAP-14: No Tag Search

**Condition:** Cannot search by custom tags.

**Criteria:** Spec section "Search Scope" (lines 71-76):
- "Tags (if manifest provides)"

Search currently covers name and file path only.

**Effect:** Cannot find components by semantic tags like "form", "navigation", "overlay".

**Recommendation:**
1. Add tags array to manifest schema
2. Include tags in search index
3. Show tag chips on component rows

**Priority:** P3 - Enhancement after manifest support
**Estimated Fix:** 1-2 hours (after GAP-4)

---

#### GAP-15: No Filter UI

**Condition:** Cannot filter component list by category, variant availability, etc.

**Criteria:** Spec section "Filtering" (lines 82-90):
- "By category"
- "By variant availability"
- "By size availability"
- "Custom tags"

Only search exists, no discrete filters.

**Effect:** Must scroll through all components or use search text.

**Recommendation:**
1. Add filter dropdown/chips above component list
2. Filter by category (already have grouping)
3. Filter by "has variants" / "has sizes"

**Priority:** P3 - Enhancement
**Estimated Fix:** 2-3 hours

---

## Intentional Deviations (Documented/Justified)

| Deviation | Justification |
|-----------|---------------|
| ComponentsPanel in left panel | Spec doesn't specify placement. Left panel makes sense for browsing. |
| Mock data fallback | Graceful degradation when no project open. Good UX decision. |

---

## Spec Issues (Spec Needs Update)

| Issue | Location | Recommendation |
|-------|----------|----------------|
| "Theme" vs "Project" terminology | Throughout | Spec says "theme" but implementation scans any project. Clarify scope. |
| Manifest schema undefined | Lines 30-44 | Define JSON schema for `components.manifest.json` |
| Compound component syntax | Line 37 | How to specify Card/Card.Header relationships in manifest? |
| Live rendering isolation | Lines 95-102 | How to isolate component rendering? Iframe? Portal? Shadow DOM? |
| Style location in JSX | Lines 170-200 | How to identify which styles are editable in JSX? className vs style vs styled-components? |

---

## Implementation Quality Notes

### Current Strengths

1. **Solid Rust parser** - `components.rs` correctly extracts props, union types, defaults, line numbers using SWC
2. **Type-safe bindings** - tauri-specta generates TypeScript types automatically
3. **Good UI foundation** - ComponentsPanel has search, grouping, collapsible sections
4. **Error handling** - Loading/error states handled gracefully
5. **Mock data fallback** - Good UX when no project selected

### Critical Gaps

1. **No preview** - The "Browser" is really just a "List"
2. **No editing** - Read-only component discovery
3. **No manifest** - Limited to code inference
4. **No write commands** - Cannot persist changes

---

## Relationship to Other Features

| Feature | Relationship |
|---------|--------------|
| Variables Editor (fn-8.7) | Token binding should use same token picker pattern |
| Typography Editor (fn-8.8) | Style editing could share property control components |
| Tools & Modes (fn-8.3-8.6) | Component ID Mode already selects components in preview |
| File Watcher | Existing watcher can trigger component rescan |

---

## Follow-up Tasks Recommended

1. **fn-8.9.1** - Implement live component preview iframe (P0, GAP-1) **[BLOCKS: 5,6,7,12]**
2. **fn-8.9.2** - Add component style editing UI (P0, GAP-2) **[DEPENDS: 8.9.1]**
3. **fn-8.9.3** - Implement component write commands in Rust (P0, GAP-3) **[DEPENDS: 8.9.2]**
4. **fn-8.9.4** - Add component manifest support (P1, GAP-4) **[BLOCKS: 13,14]**
5. **fn-8.9.5** - Implement variant display (P1, GAP-5) **[DEPENDS: 8.9.1]**
6. **fn-8.9.6** - Implement size display (P1, GAP-6) **[DEPENDS: 8.9.1]**
7. **fn-8.9.7** - Implement props playground (P1, GAP-7) **[DEPENDS: 8.9.1]**
8. **fn-8.9.8** - Add props reference panel (P1, GAP-8)
9. **fn-8.9.9** - Add required/optional prop detection (P1, GAP-9)
10. **fn-8.9.10** - Add external editor integration (P2, GAP-10)
11. **fn-8.9.11** - Wire file watcher to component rescan (P2, GAP-11)
12. **fn-8.9.12** - Integrate component selection with preview canvas (P2, GAP-12) **[DEPENDS: 8.9.1]**
13. **fn-8.9.13** - Support manifest-based categories (P2, GAP-13) **[DEPENDS: 8.9.4]**
14. **fn-8.9.14** - Add tag search support (P3, GAP-14) **[DEPENDS: 8.9.4]**
15. **fn-8.9.15** - Add filter UI (P3, GAP-15)

---

## Files Reviewed

| File | Purpose | Lines |
|------|---------|-------|
| `src-tauri/src/commands/components.rs` | TSX parser, component scanning | 552 |
| `src-tauri/src/types/mod.rs` | ComponentInfo, PropInfo, UnionTypeInfo types | 81 |
| `src/components/ComponentsPanel.tsx` | Component list UI | 424 |
| `src/bindings.ts` | Generated Tauri command bindings | 483 |
| `src/stores/appStore.ts` | App state (components slice) | 94 |
| `docs/features/03-component-browser.md` | Specification | 327 |
