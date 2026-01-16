# Tools & Modes

## Interview Summary (2026-01-14)

### MVP Scope

**All modes are MVP.** Priority focus:

| Priority | Feature | Status |
|----------|---------|--------|
| 1 | Component ID Mode | MVP - Core value proposition |
| 2 | Text Edit Mode | MVP - Rich text editing |
| 3 | Visual Property Panels | MVP - Colors → Typography → Spacing → Layout |
| 4 | Preview Mode | MVP |
| 5 | Inspect Mode | Nice-to-have |
| 6 | Responsive Preview | Via iframes/localhost |
| 7 | Help Mode | Skip for MVP |

### Key Decisions

- **Core value**: Component ID → Clipboard (select component, get perfect LLM context)
- **Done criteria**: Feature parity with current RadFlow
- **Panel layout**: Fixed right sidebar
- **Page navigation**: Tabs at top
- **Edit target**: Tokens preferred, inline fallback
- **Output modes**: Both direct file write AND clipboard (toggle)
- **Undo**: Full undo history (Cmd+Z)
- **Entry point**: Project picker on startup
- **Test target**: theme-rad-os package

### Port Strategy

- Port UI components from current RadFlow
- Keep Zustand for state management
- Evaluate per-component what needs rebuilding for Tauri
- Text Edit Mode is good quality, port as-is
- Component ID Mode needs completion (not feature-complete in current RadFlow)

---

## Purpose

Tools and Modes provide specialized interaction paradigms for specific tasks. They transform how the user interacts with the page, enabling inspection, editing, and exploration that wouldn't be possible in the default state.

---

## Component ID Mode

### Purpose
Provide a universal addressing system for page elements that enables precise AI-assisted editing. The goal is minimal tokens, maximum precision — an LLM should know exactly where to edit without searching.

**This is the #1 priority feature - the core value proposition.**

### Core Principle
**Visual:** Minimal — small pills showing element type (`<Button>`, `AnimatedStatCard`)
**Clipboard:** Complete — full file path + line number for direct navigation

```
AnimatedStatCard @ app/dashboard/page.tsx:47
```

This format tells an LLM exactly where to go. No DOM paths, no CSS classes, no noise.

---

### Activation
Enter Component ID Mode through toolbar or keyboard shortcut (V for select).

**Indicators:**
- Cursor changes to crosshair
- Mode indicator visible in toolbar
- Subtle overlay on interactive elements

---

### Visual Display

**Element Pills**
Small, unobtrusive tags appear on or near elements.

**Display:**
- Component name for React components: `AnimatedStatCard`
- HTML tag for non-components: `<div>`, `<button>`, `<h1>`
- Positioned to not obscure element content
- Semi-transparent until hovered

**Hover State:**
- Pill becomes fully opaque
- Element gets subtle highlight outline
- No tooltip clutter — the pill IS the identifier

**Violation Highlighting:**
- Elements with violations get visual indicators (warning/error icons)
- Helps identify design system issues at a glance

---

### Violations Mode

Toggleable mode for auditing design system compliance.

**Violation Severity Levels:**

| Level | Icon | Examples |
|-------|------|----------|
| Warning (yellow) | ⚠ | `style={{color: 'red'}}`, `className="text-[#FF0000]"` |
| Error (red) | 🔴 | Non-token values: `p-[13px]`, `gap-[7px]` |

**Mode Behavior:**
1. Toggle "Violations Mode" on via toolbar or shortcut
2. Violations panel shows list of all issues on current page
3. Click violation → jump to component (highlights in canvas + layers)
4. Warning/error icons overlay on violating components in canvas
5. Summary shows count: "⚠ 3 warnings, 🔴 2 errors"

**Violations Panel:**
```
┌─ Violations ───────────────────────────┐
│ ⚠ 3 warnings, 🔴 2 errors              │
│                                        │
│ 🔴 Button @ page.tsx:47               │
│    Non-token spacing: p-[13px]         │
│                                        │
│ 🔴 Card @ page.tsx:89                 │
│    Non-token color: text-[#333]        │
│                                        │
│ ⚠ Header @ page.tsx:23                │
│    Inline style: style={{margin: 10}}  │
│                                        │
│ [Copy Fix Prompt]  (future)            │
└────────────────────────────────────────┘
```

**Future Enhancement:**
"Copy Fix Prompt" generates LLM context to fix all violations in one sweep

---

### Selection Behaviors

**Hover — Preview Selection**
- Element gets outline with component name label
- Layers panel (right sidebar) highlights corresponding item
- Bidirectional: hover in canvas ↔ highlight in layers panel

**Layers Panel (Right Sidebar)**
- Tree structure mirroring code/folder hierarchy (like VS Code explorer)
- Expandable/collapsible nodes
- Shows component names and HTML elements
- Click to select, hover to highlight in canvas

```
Layers Panel:
┌─────────────────────────────┐
│ ▼ Page                      │
│   ▼ Header                  │
│     Logo                    │
│     Navigation              │
│   ▼ Main                    │
│     ▼ Card                  │
│       ● Button ← selected   │
│         Text                │
│   Footer                    │
└─────────────────────────────┘
```

**Single Click — Select One**
- Element highlighted
- Location copied to clipboard
- Toast confirms: "Copied: AnimatedStatCard @ page.tsx:47"

**Shift+Click — Add to Selection**
- Add element to current selection
- All selected elements copied as list
- Visual indicator on all selected elements

```
AnimatedStatCard @ app/dashboard/page.tsx:47
MetricsCard @ app/dashboard/page.tsx:52
Button @ app/dashboard/page.tsx:61
```

**Shift+Cmd+Click — Select All of Type**
- Select all instances of that component/element on current page
- Clipboard contains summary format:

```
ALL AnimatedStatCard on /dashboard (4 instances)
→ app/dashboard/page.tsx:47, 89, 134, 201
```

**Click+Drag — Rectangle Selection**
- Draw rectangle to select multiple elements
- All elements within rectangle selected
- Same clipboard format as Shift+Click

**Right-Click — Hierarchy Navigation**
- Opens context menu showing component tree (like VS Code explorer / browser DevTools)
- Mirrors traditional code/folder hierarchy structure
- Current component marked with visual indicator (●)
- Click any item to select it directly

```
Right-click context menu (tree structure):
┌────────────────────────────┐
│ Modal                      │
│ └─ Card                    │
│    └─ ● Button (current)   │
│       └─ Text              │
└────────────────────────────┘
```

---

### Clipboard Format

**React Component:**
```
ComponentName @ path/to/file.tsx:lineNumber
```

**HTML Element (non-component):**
```
<tagName> @ path/to/file.tsx:lineNumber "content preview"
```

The content preview (first ~30 chars) helps disambiguate multiple same-tag elements.

**Multiple Selection:**
```
ComponentA @ file.tsx:12
ComponentB @ file.tsx:34
<h1> @ file.tsx:56 "Welcome to RadFlow"
```

**All of Type:**
```
ALL ComponentName on /pagePath (count instances)
→ file.tsx:12, 34, 56, 78
```

---

### Line Number Accuracy

Line numbers are **live and accurate** because:
- Rust backend maintains file index (SWC parsing)
- File watcher updates index on external changes
- Line numbers recalculated on file change
- Sub-second accuracy after external edits

If a file changes between copy and paste, line numbers reflect the new state (not stale data).

---

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| V | Enter select/Component ID mode |
| Escape | Exit mode |
| Cmd+C | Copy selection |
| Shift+Click | Add to selection |
| Shift+Cmd+Click | Select all of type |

---

## Text Edit Mode

### Purpose
Edit text content directly on the page with a full prose editor.

### Activation
Enter Text Edit Mode through toolbar or keyboard shortcut (T for text).

### Rich Text Capabilities

**Supported Content:**
- Headings (H1-H6)
- Paragraphs
- Bold, italic, underline
- Links
- Ordered and unordered lists
- Blockquotes
- Code blocks

### Edit Output

**Behavior (Edit Accumulation):**
- Each text edit accumulates in the edit store
- Multiple edits create multiple entries
- Copy exports all as LLM-ready prompt
- Full undo history for accumulated edits (Cmd+Z)

### Exit Behavior
- Press Escape to exit
- Accumulated edits retained
- Cmd+C copies all accumulated edits

---

## Visual Property Panels

### Purpose
Webflow-style panels for quick visual edits without prompting LLM.

### Panel Priority Order

1. **Colors Panel**
   - Background color (token picker)
   - Text color (token picker)
   - Border color (token picker)
   - Shows token names (--color-primary), not resolved values

2. **Typography Panel**
   - Font family (from tokens)
   - Font size (from scale)
   - Font weight
   - Line height
   - Letter spacing
   - Text alignment

3. **Spacing Panel**
   - Padding (all sides, individual)
   - Margin (all sides, individual)
   - Gap (for flex/grid)
   - Uses spacing scale tokens

4. **Layout Panel**
   - Display (flex, grid, block)
   - Flex direction, wrap, align, justify
   - Grid columns, rows, gap

### Edit Behavior

**Token Preference:**
- Always show token picker first
- Use design system tokens when available
- Allow inline/custom values as fallback

**Output Options:**
- All changes accumulate
- Copy exports as LLM-ready prompt
- Formats: Prompt, Code, Diff

**Undo:**
- Full Cmd+Z undo history for accumulated edits

### Reference
See Webflow panel screenshots: `/webflow-panels/design-panels/`

---

## Inspect Mode (Nice-to-Have)

### Purpose
Visualize spacing, layout, and measurements — like Figma's inspect tools.

### Spacing Visualization
- Padding shown as inner overlay
- Margin shown as outer overlay
- Gap values between flex/grid children

### Measurement Tool (Alt+Hover)
- Hold Alt and hover to see distances
- Red measurement lines to parent edges, siblings, viewport

### Token Reference
Show which design tokens are applied to selected element.

---

## Preview Mode

### Purpose
View the page without DevTools chrome. See the design as users will see it.

### Activation
Toggle preview mode on/off.

**Behavior:**
- DevTools panel hides
- All overlays removed
- Page renders clean
- Keyboard shortcut still active for exit

---

## Responsive Preview

### Implementation
Use iframes with localhost to preview at different viewport sizes.

### Device Presets
- Phone (375px)
- Phone Large (428px)
- Tablet (768px)
- Desktop (1280px)
- Wide (1536px)
- Custom width input

---

## Component Browser

### Purpose
Browse and filter project components in categorized list.

### Display
- Grouped by category (buttons, cards, inputs, etc.)
- Searchable/filterable
- Shows violation status
- Click to navigate to component

### Integration with Component ID Mode
- Selected components can be copied to clipboard
- Multi-select for batch context

---

## Assets Panel

### Purpose
Full media library for project assets.

### Supported Types
- Images (png, jpg, svg, webp)
- Icons (svg)
- Fonts
- Videos
- Audio
- Documents

### Features
- Upload/import
- Search/filter
- Drag to insert in page
- Asset details (size, format, usage)

---

## Application Structure

### Entry Point
Project picker on startup - choose which project folder to open.

### Layout
- Fixed right sidebar for panels
- Tabs at top for open pages
- Toolbar for mode toggles

### Page Navigation
Browser-style tabs for switching between open pages.

---

## Research Required

### Tauri Integration
- How to load target project's pages in webview
- Rust backend ↔ React frontend communication patterns
- File watching and live reload

### Storybook Evaluation
Explore Storybook for:
- Component rendering approach (isolation)
- Props editing UI (controls/knobs)
- Docs generation patterns
- General inspiration for component tooling

### Current RadFlow Evaluation
- What ports directly to Tauri
- What needs Rust backend integration
- What needs rebuilding

---

## Keyboard Shortcuts Summary

| Shortcut | Action | Status |
|----------|--------|--------|
| V | Select/Component ID mode | Implemented |
| T | Text edit mode | Implemented |
| P | Preview mode | Implemented |
| Escape | Exit current mode | Implemented |
| Cmd+C | Copy selection | Implemented |
| Cmd+Z | Undo | Placeholder |
| Cmd+Shift+Z | Redo | Placeholder |
| Shift+Click | Add to selection | Pending |

---

## Technical Implementation

### Rust Backend (via Tauri)
- SWC: Parse components, extract line numbers
- lightningcss: Parse tokens for property panels
- tantivy: Search components and assets
- notify: File watching for live updates

### React Frontend
- Port UI from current RadFlow
- Zustand for state management
- Tailwind v4 for styling

### Test Target
Primary testing against theme-rad-os package.
