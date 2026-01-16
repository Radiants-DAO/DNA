# fn-8.12 Review: Canvas Editor

**Spec:** `/docs/features/08-canvas-editor.md`
**Scope:** Canvas as context collector, component browsing, violations, LLM context copying
**Date:** 2026-01-16
**Reviewer:** fn-8.12 task

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Completion** | ~35% |
| **Gaps Found** | 12 (P0: 2, P1: 4, P2: 4, P3: 2) |
| **Smoke Test** | PARTIAL |

The Canvas Editor specification describes a **context collection tool** for LLM-assisted editing. The key insight (per interview summary) is that the canvas is NOT a Figma-style editor—it's a way to navigate design systems spatially and select components/tokens to feed as context to LLMs like Claude Code.

**MVP Scope:** "Page Editor" with component browsing in tabs/sidebar (current RadFlow style).
**Future Scope:** Spatial infinite canvas with zoom/pan (explicitly deferred).

**What's Implemented:**
- **ComponentsPanel.tsx** - Component list with category grouping, search, copy
- **PreviewCanvas.tsx** - Basic component grid view (placeholder previews)
- **ViolationDetector (Rust)** - Detects hardcoded colors, inline styles, arbitrary values
- **violationsSlice.ts** - Frontend state management for violations
- **scan_violations/detect_violations commands** - Rust commands for violation scanning

**Critical Gaps:**
- **No Violations Tab/UI** - Violation detection exists but no UI to view/filter violations
- **No LLM Context Copy Format** - No "Copy for LLM" action producing the spec's output format
- **Multi-select incomplete** - Selection state not integrated with violations
- **Components not connected to violations** - No violation badges on components

---

## Smoke Test Results

**Legend:**
- **UI EXISTS** - Component renders (but may use mock data)
- **MOCK ONLY** - Uses hardcoded data, not connected to real source
- **FUNCTIONAL** - Connected to real data sources and working
- **NOT IMPLEMENTED** - Feature does not exist

### MVP: Tabulated Component Browser

| Test | Status | Notes |
|------|--------|-------|
| Component list renders | FUNCTIONAL | ComponentsPanel.tsx:352-420 |
| Filter by search query | FUNCTIONAL | ComponentsPanel.tsx:274-282 |
| Category grouping | FUNCTIONAL | ComponentsPanel.tsx:285-317 |
| Click to copy component name | FUNCTIONAL | ComponentsPanel.tsx:248-253 |
| File:line display | FUNCTIONAL | ComponentsPanel.tsx:187-189 shows relative path + line |
| Shift-click multi-select | NOT IMPLEMENTED | No multi-select state |
| Violations tab | NOT IMPLEMENTED | No dedicated violations UI |
| Filter by violation status | NOT IMPLEMENTED | No filter integration |
| Copy context for LLM | NOT IMPLEMENTED | No spec-format copy action |

### Violation Detection (Rust Backend)

| Test | Status | Notes |
|------|--------|-------|
| scan_violations() command | FUNCTIONAL | violations.rs:166-171 |
| detect_violations() command | FUNCTIONAL | violations.rs:175-179 |
| Detect inline styles | FUNCTIONAL | violations.rs:54-64 |
| Detect hardcoded colors | FUNCTIONAL | violations.rs:66-77 |
| Detect arbitrary spacing | FUNCTIONAL | violations.rs:79-90 |
| Detect hex in style objects | FUNCTIONAL | violations.rs:92-106 |
| ViolationInfo type | FUNCTIONAL | types/mod.rs:50-62 |
| Frontend violations store | FUNCTIONAL | violationsSlice.ts:1-63 |
| Violations UI display | NOT IMPLEMENTED | No component shows violations |
| Violation badges on components | NOT IMPLEMENTED | No visual indicator |

### Future: Spatial Canvas (Explicitly Deferred)

| Test | Status | Notes |
|------|--------|-------|
| Infinite canvas | NOT IMPLEMENTED | Deferred per spec |
| Zoom/pan navigation | NOT IMPLEMENTED | Deferred per spec |
| Mini-map | NOT IMPLEMENTED | Deferred per spec |
| Live React previews | NOT IMPLEMENTED | Deferred per spec |
| Area drag selection | NOT IMPLEMENTED | Deferred per spec |

---

## Priority Criteria

- **P0 (Critical):** Blocks core workflow, feature cannot work without this (~2-6 hours to fix)
- **P1 (High):** Required for MVP user experience, core spec feature (~2-8 hours)
- **P2 (Medium):** Enhances UX but not required for launch, has workarounds (~1-4 hours)
- **P3 (Low):** Polish, optimization, nice-to-have (~1-4 hours)

---

## Detailed Gap Analysis

### P0 (Critical) - 2 Issues

#### GAP-0: No Violations UI

**Condition:** Violation detection is fully implemented in Rust but there's no UI to view, filter, or act on violations.

**Criteria:** Spec section "Violations Tab" (lines 53-56):
```
### Violations Tab
- Components with hardcoded colors
- Components with inline styles
- Components with non-semantic tokens
- Click to select, add prompt for LLM to fix
```

The Rust backend has:
- `scan_violations()` command (violations.rs:166-171)
- `detect_violations()` command (violations.rs:175-179)
- `ViolationInfo` type with severity, message, suggestion (types/mod.rs:50-62)

The frontend has:
- `violationsSlice.ts` with `scanViolations()`, `getViolationsForComponent()` actions

But **no component displays violations**. The detection is unused.

**Effect:** Users cannot:
- See which components have violations
- Filter to show only problematic components
- Take action to fix violations

The entire violation workflow specified is non-functional despite the backend being ready.

**Recommendation:**
1. Create `ViolationsPanel.tsx` component
2. Call `scanViolations()` on project load
3. List violations grouped by file or component
4. Allow filtering by severity (warning/error)
5. Click violation to navigate to component
6. Add "Copy context for LLM fix" action

**Priority:** P0 - Core feature, backend exists but invisible
**Estimated Fix:** 4-6 hours

---

#### GAP-1: No LLM Context Copy Format

**Condition:** The spec defines a specific output format for copying component context to LLMs, but this isn't implemented.

**Criteria:** Spec section "Output Format" (lines 57-63):
```
### Output Format
When copying selected components:
```
Button @ components/Button/Button.tsx:12
Card @ components/Card/Card.tsx:8
```
Enough info for LLM to find and modify.
```

Current copy behavior (ComponentsPanel.tsx:248-253):
```typescript
const handleCopy = useCallback((text: string) => {
  navigator.clipboard.writeText(text);  // Copies just component name
}, []);
```

This copies only the component name, not the file path and line number.

**Effect:** Users must manually construct LLM context. The core value proposition of the canvas ("select components, copy context, prompt LLM") is broken.

**Recommendation:**
1. Change copy to use spec format: `{name} @ {file}:{line}`
2. Add "Copy for LLM" button that formats selected components
3. For multi-select, format as newline-separated list
4. Optionally include violation info in context

```typescript
const handleCopyForLLM = (components: ComponentInfo[]) => {
  const context = components
    .map(c => `${c.name} @ ${c.file}:${c.line}`)
    .join('\n');
  navigator.clipboard.writeText(context);
};
```

**Priority:** P0 - Core workflow
**Estimated Fix:** 1-2 hours

---

### P1 (High) - 4 Issues

#### GAP-2: No Multi-Select for Components

**Condition:** Spec requires shift-click multi-select, but only single selection exists.

**Criteria:** Spec section "Components Tab" (lines 44-49):
```
- Click to select (Component ID mode)
- Shift-click for multi-select
- Copy context for LLM
```

And spec section "Core Use Case" (lines 28-35):
```
3. Multi-select components (shift-click, drag)
4. Copy context (file paths, component info)
5. Paste into Claude Code with prompt
```

Current implementation (ComponentsPanel.tsx:256-259):
```typescript
const handleSelect = useCallback((component: ComponentInfo) => {
  console.log("Selected component:", component.name);
  // TODO: Integrate with preview canvas selection
}, []);
```

Only single selection with console.log. No selection state, no multi-select.

**Effect:** Users cannot select multiple components to copy context for batch LLM operations.

**Recommendation:**
1. Add `selectedComponents: ComponentInfo[]` state
2. Handle shift-click to add/remove from selection
3. Show selected state visually (background color, checkmark)
4. Add "Copy All Selected" action
5. Optionally connect to ComponentIdMode's selection state

**Priority:** P1 - Core workflow for batch operations
**Estimated Fix:** 3-4 hours

---

#### GAP-3: No Violation Badges on Components

**Condition:** Components should show violation status, but violations aren't connected to component display.

**Criteria:** Spec section "Component Cards" (lines 79-84):
```
Each card shows:
- Live rendered preview
- Component name
- Variant indicator
- Violation badge (if applicable)
```

And spec section "Selection" (lines 86-91):
```
- Click to select one
- Shift-click to add to selection
- Click+drag rectangle for area select
- Selected components highlighted
- Copy context for LLM
```

The violationsSlice has `getViolationsForComponent(file, line)` but ComponentsPanel doesn't use it.

**Effect:** Users cannot see at a glance which components have violations. Must check violations separately.

**Recommendation:**
1. In ComponentRow, call `getViolationsForComponent()`
2. Show badge/icon if violations exist
3. Color code: red for errors, yellow for warnings
4. Tooltip showing violation count and types

```typescript
function ComponentRow({ component }) {
  const violations = useAppStore(s =>
    s.getViolationsForComponent(component.file, component.line)
  );
  // Show badge if violations.length > 0
}
```

**Priority:** P1 - Important visual feedback
**Dependencies:** Works now with existing store method
**Estimated Fix:** 2-3 hours

---

#### GAP-4: Filter by Violation Status

**Condition:** Cannot filter component list to show only components with violations.

**Criteria:** Spec section "Components Tab" (lines 44-49):
```
- Filter by category
- Filter by violation status
```

And spec section "Violation Workflow" (lines 121-125):
```
1. Filter to show violations
2. Select offending components
3. Copy context
4. Prompt LLM: "Fix these hardcoded colors to use semantic tokens"
```

Current filtering (ComponentsPanel.tsx:274-282) only supports text search:
```typescript
const filteredComponents = useMemo(() => {
  if (!searchQuery.trim()) return displayComponents;
  const query = searchQuery.toLowerCase();
  return displayComponents.filter((comp) =>
    comp.name.toLowerCase().includes(query) ||
    comp.file.toLowerCase().includes(query)
  );
}, [displayComponents, searchQuery]);
```

No violation-based filtering.

**Effect:** Users cannot quickly find problematic components. Must scroll through entire list.

**Recommendation:**
1. Add `filterMode: 'all' | 'violations' | 'clean'` state
2. Add filter toggle buttons below search
3. When 'violations' selected, only show components with violations
4. Show count of violations in filter button

**Priority:** P1 - Core workflow for violation fixing
**Dependencies:** Requires GAP-3 (violation-component connection)
**Estimated Fix:** 2-3 hours

---

#### GAP-5: Preview Canvas Not Connected

**Condition:** PreviewCanvas exists but isn't connected to real components.

**Criteria:** Spec section "MVP: Tabulated Component Browser" (lines 40-63) describes components tab with previews.

Current PreviewCanvas (PreviewCanvas.tsx:76-104) uses hardcoded mock data:
```typescript
const components = [
  { id: "button", name: "Button", category: "Core" },
  { id: "input", name: "Input", category: "Core" },
  // ... hardcoded
];
```

Not connected to `useAppStore` components or project data.

**Effect:** Preview shows static mock data regardless of actual project components.

**Recommendation:**
1. Connect to `useAppStore(s => s.components)`
2. Use real component data for grid
3. Sync selection between ComponentsPanel and PreviewCanvas
4. Show actual component previews (even if placeholders initially)

**Priority:** P1 - Integration gap
**Estimated Fix:** 2-3 hours

---

### P2 (Medium) - 4 Issues

#### GAP-6: No File Watcher Violation Updates

**Condition:** Violations are scanned once but not updated when files change.

**Criteria:** Spec section "Violation Detection" (lines 105-112):
```
**Technical approach:** File watcher + incremental analysis

1. Watch component files for changes
2. Analyze changed files with SWC (Rust backend)
3. Detect hardcoded colors, inline styles, non-semantic tokens
4. Update violation index incrementally
5. Surface in UI for filtering/selection
```

Violation scanning exists but isn't connected to file watcher. Changes require manual rescan.

**Effect:** Violation list becomes stale as files change. Users see outdated violation status.

**Recommendation:**
1. Connect to `watcherSlice` file change events
2. On `.tsx` file change, re-run `detect_violations()` for that file
3. Update `violationsByFile` map incrementally
4. Debounce to avoid excessive rescans

**Priority:** P2 - Enhancement, manual rescan works
**Estimated Fix:** 3-4 hours

---

#### GAP-7: Rust Commands Not Using SWC for Violations

**Condition:** Spec mentions SWC for violation detection, but implementation uses regex.

**Criteria:** Spec section "Violation Detection" (line 108):
```
2. Analyze changed files with SWC (Rust backend)
```

And spec section "Rust Backend Integration" (lines 189-191):
```
| Component Analyzer | AST analysis for violations (SWC) |
```

Current implementation (violations.rs:21-35) uses regex:
```rust
pub struct ViolationDetector {
    inline_style_regex: Regex,
    hardcoded_color_regex: Regex,
    arbitrary_value_regex: Regex,
    hex_color_regex: Regex,
}
```

**Effect:** Regex-based detection has limitations:
- Can have false positives in comments/strings
- Cannot understand JSX structure
- Less accurate than AST-based analysis

**Recommendation:**
1. Integrate `swc_ecma_parser` (already in dependencies per rust-patterns.md)
2. Parse TSX to AST
3. Walk AST to find style props, className values
4. More accurate detection

**Priority:** P2 - Current regex works for common cases
**Estimated Fix:** 6-8 hours

---

#### GAP-8: No Violation Suggestions UI

**Condition:** ViolationInfo includes suggestions but they're not displayed.

**Criteria:** ViolationInfo type (types/mod.rs:59-60):
```rust
pub suggestion: Option<String>,
```

Each violation includes a suggestion like "Use a semantic color token instead" but there's no UI to show it.

**Effect:** Users see violations but don't get guidance on how to fix them.

**Recommendation:**
1. In ViolationsPanel, show suggestion on hover or expand
2. Consider "Copy suggestion as prompt" action
3. Format as: "Fix: {file}:{line} - {message}. Suggestion: {suggestion}"

**Priority:** P2 - Enhancement, info exists
**Estimated Fix:** 1-2 hours

---

#### GAP-9: No Violation Severity Filtering

**Condition:** Violations have severity (warning/error) but cannot filter by severity.

**Criteria:** ViolationSeverity enum (types/mod.rs:43-48):
```rust
pub enum ViolationSeverity {
    Warning,
    Error,
}
```

Cannot filter to show only errors or only warnings.

**Effect:** All violations shown equally. Cannot prioritize errors over warnings.

**Recommendation:**
1. Add severity filter to ViolationsPanel
2. Allow: All, Errors Only, Warnings Only
3. Show counts for each severity
4. Visual distinction (red for error, yellow for warning)

**Priority:** P2 - Nice to have
**Estimated Fix:** 1-2 hours

---

### P3 (Low) - 2 Issues

#### GAP-10: Spatial Canvas (Future Feature - Deferred)

**Condition:** The spatial infinite canvas is explicitly marked as future scope.

**Criteria:** Spec section "Future: Spatial Canvas" (lines 68-101):
```
When canvas is built, same functions in spatial layout.
```

And spec section "Research Notes" (lines 172-174):
```
**Future Feature** - Not MVP. Build after Page Editor is complete.
```

This is **intentionally not implemented**. The spec explicitly defers it.

**Effect:** No spatial navigation. Users use tab/list-based browsing instead.

**Recommendation:** Track as future feature. No action needed for MVP.

**Priority:** P3 - Explicitly deferred
**Estimated Fix:** 40+ hours (when building canvas)

---

#### GAP-11: Live React Previews (Research Needed)

**Condition:** Spec mentions live component previews but approach is TBD.

**Criteria:** Spec section "Canvas View" (lines 71-75):
```
- Live React preview in each card (approach TBD - needs research)
```

And spec section "Live React Previews" (lines 153-161):
```
**Decision: Needs research**

Options:
- iframes per component (isolated but heavy)
- Preview server with screenshots
- Shadow DOM mounting
- Hybrid approach
```

Current PreviewCanvas shows placeholder divs, not live React components.

**Effect:** No actual component rendering. Preview is fake.

**Recommendation:** Research task, not implementation task. When building spatial canvas, evaluate options.

**Priority:** P3 - Research needed, deferred to canvas work
**Estimated Fix:** Unknown (research-dependent)

---

## Intentional Deviations (Documented/Justified)

| Deviation | Justification |
|-----------|---------------|
| No spatial canvas | Explicitly MVP vs Future scope per spec interview summary |
| Regex-based violation detection | Works for common cases, SWC enhancement is P2 |
| Tab-based browsing vs canvas | MVP approach per spec lines 38-39 |

---

## Spec Issues (Spec Needs Update)

| Issue | Location | Recommendation |
|-------|----------|----------------|
| Commands naming inconsistent | Lines 197-201 | Spec says `analyze_component(path)`, implemented as `detect_violations(path)` |
| Watch command not specified | Lines 199 | `watch_components()` mentioned but no detail on events/format |
| Output format ambiguity | Lines 59-61 | What's `components/Button/Button.tsx` - relative to what? |
| Page thumbnails section | Lines 97-101 | How do pages relate to canvas when canvas is deferred? |

---

## Implementation Quality Notes

### Current Strengths

1. **Violation detection complete** - Rust backend fully functional with tests
2. **ViolationInfo well-designed** - Includes file, line, severity, message, suggestion
3. **Frontend state ready** - violationsSlice has all needed actions
4. **ComponentsPanel solid** - Good UX for listing, searching, categorizing
5. **Type safety** - specta bindings work, TypeScript types generated

### Critical Gaps

1. **No violation UI** - Detection exists but invisible
2. **No LLM context format** - Core workflow broken
3. **No multi-select** - Batch operations impossible
4. **Components not connected to violations** - Two systems don't talk
5. **Preview uses mock data** - Not connected to real components

---

## Relationship to Other Features

| Feature | Relationship |
|---------|--------------|
| Component ID Mode (fn-8.3) | Selection state could be shared |
| Component Browser (fn-8.9) | ComponentsPanel IS the component browser |
| File Watcher (watcher.rs) | Should trigger violation rescans |
| TSX Parser (components.rs) | Components discovered here, violations checked separately |

---

## Integration Test Plan

Once gaps are addressed, verify the complete feature works end-to-end:

### Prerequisites
1. Project with some violation-containing components:
```tsx
// TestComponent.tsx
export function Test() {
  return <div style={{color: '#FF0000'}} className="p-[13px]">Bad</div>;
}
```

### Test Cases

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Open project | Violations scanned on load |
| 2 | View Violations tab | Shows all detected violations |
| 3 | Click violation | Navigates to component |
| 4 | Filter by violations | Component list shows only violators |
| 5 | Multi-select components | Multiple components highlighted |
| 6 | Copy for LLM | Clipboard has spec format output |
| 7 | Edit file, add violation | Violation list updates (watcher) |
| 8 | Edit file, fix violation | Violation removed from list |
| 9 | Filter by severity | Shows only errors or warnings |
| 10 | Violation badge on component | Icon/badge visible in list |

### Error Cases

| # | Test | Expected Result |
|---|------|-----------------|
| E1 | No violations found | "No violations" message |
| E2 | Scan fails | Error shown, retry available |
| E3 | File deleted during scan | Graceful handling |

---

## Follow-up Tasks Recommended

### Dependency Graph

```
GAP-1 (Copy Format) ────────> (Independent, quick win)

GAP-0 (Violations UI) ──┬──> GAP-3 (Badges) ──> GAP-4 (Filter)
                        └──> GAP-8 (Suggestions)
                        └──> GAP-9 (Severity Filter)

GAP-2 (Multi-Select) ──────> (Independent)

GAP-5 (Preview Connect) ───> (Independent)

GAP-6 (Watcher) ───────────> (Requires GAP-0)

GAP-7 (SWC) ───────────────> (Enhancement, lower priority)
```

### Task List

1. **fn-canvas-0** - Implement LLM context copy format (P0, GAP-1) **[QUICK WIN]**
2. **fn-canvas-1** - Create ViolationsPanel.tsx (P0, GAP-0) **[BLOCKS: 3,4,7,8]**
3. **fn-canvas-2** - Add multi-select to ComponentsPanel (P1, GAP-2)
4. **fn-canvas-3** - Add violation badges to ComponentRow (P1, GAP-3) **[DEPENDS: 2]**
5. **fn-canvas-4** - Add violation status filter (P1, GAP-4) **[DEPENDS: 3]**
6. **fn-canvas-5** - Connect PreviewCanvas to real components (P1, GAP-5)
7. **fn-canvas-6** - Add file watcher violation updates (P2, GAP-6) **[DEPENDS: 2]**
8. **fn-canvas-7** - Show violation suggestions in UI (P2, GAP-8) **[DEPENDS: 2]**
9. **fn-canvas-8** - Add severity filtering (P2, GAP-9) **[DEPENDS: 2]**
10. **fn-canvas-9** - SWC-based violation detection (P2, GAP-7) **[OPTIONAL]**
11. **fn-canvas-10** - Future: Spatial canvas (P3, GAP-10) **[DEFERRED]**
12. **fn-canvas-11** - Future: Live React previews (P3, GAP-11) **[DEFERRED]**

---

## Files Reviewed

| File | Purpose | Lines |
|------|---------|-------|
| `docs/features/08-canvas-editor.md` | Specification | 222 |
| `src/components/ComponentsPanel.tsx` | Component list UI | 424 |
| `src/components/layout/PreviewCanvas.tsx` | Preview grid | 130 |
| `src-tauri/src/commands/violations.rs` | Violation detection | 250 |
| `src-tauri/src/types/mod.rs` | Type definitions | 81 |
| `src/stores/slices/violationsSlice.ts` | Frontend violations state | 63 |
| `src/bindings.ts` | Tauri command bindings | 483 |
