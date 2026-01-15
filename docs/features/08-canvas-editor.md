# Canvas Editor

## Interview Summary (2026-01-14)

**Key Decision: Canvas is a CONTEXT COLLECTOR, not a Figma-style editor.**

The canvas provides spatial navigation of the design system for humans with spatial memory. Its primary purpose is to help users SELECT components/tokens to feed as context to LLMs like Claude Code. Editing happens via LLM commands, not direct manipulation on canvas.

### MVP vs Future

| Scope | What | UI Form |
|-------|------|---------|
| **MVP** | Component list, filtering, violations, selection for LLM | Tabs/sidebar (current RadFlow style) |
| **Future** | Same functions in spatial layout | Infinite canvas with zoom/pan |

**MVP is the Page Editor** - port of current RadFlow with component browsing in tabs/sidebar.

**Future is the spatial canvas** - same functions but with Figma-style spatial navigation.

---

## Purpose

The Canvas Editor is a spatial interface for navigating a project's design system. It enables quick context gathering for LLM-assisted editing.

**Key Principle:** The canvas is a context collection tool. It helps you select components/tokens, copy their context, and prompt LLMs to make changes. Direct editing on canvas is minimal.

**Core Use Case:**
1. Navigate design system spatially (zoom, pan)
2. Filter by category, violations, etc.
3. Multi-select components (shift-click, drag)
4. Copy context (file paths, component info)
5. Paste into Claude Code with prompt
6. LLM makes the changes

---

## MVP: Tabulated Component Browser

For MVP, canvas functions live in tabs/sidebar within the Page Editor.

### Components Tab
- List of all components from theme
- Filter by category
- Filter by violation status
- Click to select (Component ID mode)
- Shift-click for multi-select
- Copy context for LLM

### Violations Tab
- Components with hardcoded colors
- Components with inline styles
- Components with non-semantic tokens
- Click to select, add prompt for LLM to fix

### Output Format
When copying selected components:
```
Button @ components/Button/Button.tsx:12
Card @ components/Card/Card.tsx:8
```
Enough info for LLM to find and modify.

---

## Future: Spatial Canvas

When canvas is built, same functions in spatial layout.

### Canvas View
- Grid of component cards
- Live React preview in each card (approach TBD - needs research)
- Pagination above a certain limit
- Zoom/pan navigation
- Mini-map for large libraries

### Component Cards
Each card shows:
- Live rendered preview
- Component name
- Variant indicator
- Violation badge (if applicable)

### Selection
- Click to select one
- Shift-click to add to selection
- Click+drag rectangle for area select
- Selected components highlighted
- Copy context for LLM

### Filtering
- By category (buttons, cards, inputs)
- By violation status
- By token usage
- Active filters shown as chips

### Pages Section
- Page thumbnails on canvas
- Click to enter Page Editor
- Pages as navigation, not editing

---

## Violation Detection

**Technical approach:** File watcher + incremental analysis

1. Watch component files for changes
2. Analyze changed files with SWC (Rust backend)
3. Detect hardcoded colors, inline styles, non-semantic tokens
4. Update violation index incrementally
5. Surface in UI for filtering/selection

### Detected Violations
- Hardcoded color values (not tokens)
- Inline styles instead of className
- Non-standard spacing values
- Missing semantic tokens

### Violation Workflow
1. Filter to show violations
2. Select offending components
3. Copy context
4. Prompt LLM: "Fix these hardcoded colors to use semantic tokens"
5. LLM makes changes

---

## Canvas vs Page Editor

| Aspect | Canvas (Future) | Page Editor (MVP) |
|--------|-----------------|-------------------|
| Purpose | Component library overview | Page-level editing |
| View | Spatial grid of all components | Single page viewport |
| Entry | Default home view (future) | Click page or component |
| Editing | Context selection for LLMs | Component ID mode, text edit |
| Contains | Components + page thumbnails | One page at a time |

**Relationship:** Canvas contains pages as thumbnails. Click page thumbnail to enter Page Editor.

---

## Technical Decisions (Future)

### Canvas Library
**Decision: Deferred** until canvas work starts.

Options to evaluate:
- react-konva
- xyflow
- fabric.js
- Custom CSS grid with zoom/pan

### Live React Previews
**Decision: Needs research**

Options:
- iframes per component (isolated but heavy)
- Preview server with screenshots
- Shadow DOM mounting
- Hybrid approach

### Performance
- Pagination above component limit (not infinite scroll)
- Virtual rendering only if needed
- Lazy loading for large libraries

---

## Research Notes

### Complexity Assessment
**Future Feature** - Not MVP. Build after Page Editor is complete.

### Research Required (When Building Canvas)
- Live React component rendering approach
- Canvas library evaluation
- Zoom/pan interaction patterns
- Multi-select UX

### Search Terms
```
"react infinite canvas library"
"react component preview iframe vs shadow dom"
"css grid zoom pan javascript"
"virtual grid large dataset react"
```

### Rust Backend Integration

| Module | Purpose |
|--------|---------|
| Component Analyzer | AST analysis for violations (SWC) |
| File Watcher | Incremental violation index updates |
| Property Extractor | Extract style properties for filtering |

**Commands Needed:**
- `analyze_component(path)` -> Violations list
- `watch_components()` -> File change events
- `get_violation_index()` -> All current violations

---

## Open Questions (For Future)

- Live preview rendering approach?
- Canvas library choice?
- How to handle 500+ components?
- Obsidian integration scope?

---

## Deferred Features

These are in the original spec but explicitly future/aspirational:

- Sorting by background/text color
- Obsidian vault integration
- Docs section on canvas
- Manual group positioning
- Properties panel on canvas (editing happens via LLM)
