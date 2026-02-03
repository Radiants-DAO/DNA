# Task 002: Component Canvas

## Overview

A visual canvas for exploring and managing UI components from the design system. Displays components as interactive nodes with live previews, showing relationships (props, composition, variants). Enables batch operations like "select these and create a variant group."

## Integration Target

**Location:** `/Users/rivermassey/Desktop/dev/DNA/tools/flow/`

New editor mode within Flow, reusing canvas infrastructure from the spatial file viewer.

---

## Architecture

### Reusable from File Viewer (001)
- `usePanZoom` hook - pan/zoom with pinch support
- `Minimap` component - overview navigation
- `ZoomControls` component - +/- buttons, fit
- `useMarqueeSelection` hook - rectangle multi-select
- CSS dot grid background
- Visual node states (hover, selected, focused)

### New Components
- `ComponentNode` - Node with live component preview
- `ComponentCanvas` - Main canvas (similar to SpatialCanvas)
- `RelationshipLines` - Prop/composition connections
- `VariantPanel` - Create/manage variant groups

### State Management
New/extended Zustand slices:
- `componentCanvasSlice.ts` - Component nodes, selection, relationships
- Extend `uiSlice.ts` - New editor mode "component-canvas"

---

## Core Requirements

### Component Nodes

```
┌─────────────────────────────┐
│  Button                     │  ← Name
├─────────────────────────────┤
│  ┌─────────────────────┐    │
│  │    [Click me]       │    │  ← Live preview
│  └─────────────────────┘    │
├─────────────────────────────┤
│  variants: 3 | props: 8     │  ← Metadata
└─────────────────────────────┘
```

- **Live preview** renders actual component
- **Metadata bar** shows variant count, prop count
- **Visual states** from file viewer (hover glow, selected ring, focused outline)
- **Resizable** preview area (drag corner)

### Layout Options

| Mode | Description | Use Case |
|------|-------------|----------|
| **Grid** | Auto-arranged grid | Overview of all components |
| **Grouped** | Clustered by category/folder | Organized exploration |
| **Manual** | User-positioned, persisted | Custom arrangement |
| **Force-directed** | Physics-based by relationships | Discover connections |

Default: **Grid** with option to switch.

### Relationships

Show connections between components:
- **Composition** - Component A contains Component B (solid line)
- **Props** - Component A passes props to B (dashed line)
- **Variants** - Grouped variants (enclosed region)

Lines use same Bezier curves as file viewer ConnectionLines.

### Interactions

**Mouse:**
- Click node → Select
- Double-click → Open component editor / zoom to fit
- Cmd+Click → Toggle multi-select
- Shift+Drag → Marquee selection
- Alt+Drag → Pan canvas

**Keyboard:**
- Arrow keys → Navigate between nodes
- Enter → Open selected component
- Cmd+G → Group selected into variant
- Cmd+A → Select all
- Escape → Clear selection

### Batch Operations

With multiple nodes selected:
- **Create Variant Group** → Groups selected as variants of base component
- **Export Selection** → Export selected components
- **Compare** → Side-by-side comparison view

---

## Data Source

### Option A: Schema Files (Recommended)
Parse `*.schema.json` files from component directories:
```json
{
  "name": "Button",
  "props": { "variant": "string", "size": "string" },
  "variants": ["primary", "secondary", "ghost"]
}
```

### Option B: Runtime Introspection
Use React DevTools-style introspection to discover components.

### Option C: Manual Registry
User maintains a `components.json` manifest.

**Recommendation:** Start with Option A (schema files), since DNA already uses this pattern.

---

## Sub-Tasks

| ID | Task | Description | Dependencies |
|----|------|-------------|--------------|
| 002-A | ComponentNode | Node component with live preview | - |
| 002-B | Grid Layout | Auto-grid positioning algorithm | - |
| 002-C | ComponentCanvas | Main canvas, wire up infrastructure | 002-A, 002-B |
| 002-D | Schema Parser | Parse component schemas for data | - |
| 002-E | Relationship Lines | Composition/prop connections | 002-C |
| 002-F | Variant Grouping | Select + group into variants | 002-C |
| 002-G | Layout Modes | Grid, grouped, manual, force | 002-C |
| 002-H | Integration | Editor mode, keyboard shortcuts | 002-C |

### Recommended Build Order

```
Phase 1: 002-A (ComponentNode) + 002-D (Schema Parser) [parallel]
Phase 2: 002-B (Grid Layout)
Phase 3: 002-C (Canvas Integration)
Phase 4: 002-E (Relationships) + 002-F (Variants) [parallel]
Phase 5: 002-G (Layout Modes) + 002-H (Integration) [parallel]
```

---

## File Structure

```
tools/flow/
├── app/
│   ├── components/
│   │   └── component-canvas/           # NEW
│   │       ├── ComponentCanvas.tsx     # Main canvas
│   │       ├── ComponentNode.tsx       # Node with preview
│   │       ├── RelationshipLines.tsx   # Connection lines
│   │       ├── VariantGroup.tsx        # Grouped variant region
│   │       └── index.ts
│   ├── stores/
│   │   └── slices/
│   │       └── componentCanvasSlice.ts # NEW
│   ├── hooks/
│   │   ├── useComponentLayout.ts       # NEW - layout algorithms
│   │   └── useComponentKeyboard.ts     # NEW - keyboard nav
│   ├── types/
│   │   └── component-canvas.ts         # NEW - ComponentNode types
│   └── utils/
│       └── component-canvas/           # NEW
│           ├── gridLayout.ts           # Grid positioning
│           ├── forceLayout.ts          # Force-directed (future)
│           └── schemaParser.ts         # Parse .schema.json
```

---

## Acceptance Criteria

1. [ ] New editor mode "component-canvas" accessible via UI/keyboard
2. [ ] Components display as nodes with live previews
3. [ ] Grid layout positions components automatically
4. [ ] Click to select, marquee for multi-select
5. [ ] Relationship lines show component composition
6. [ ] Select multiple + Cmd+G creates variant group
7. [ ] Pan/zoom works (reuses file viewer infrastructure)
8. [ ] Minimap shows full canvas overview
9. [ ] Keyboard navigation between nodes
10. [ ] Integrates with existing Flow UI

---

## Visual Reference

```
┌────────────────────────────────────────────────────────────────┐
│ Component Canvas                                    [Grid ▾]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐                 │
│   │ Button  │────▶│  Card   │     │  Input  │                 │
│   │ [btn]   │     │ [card]  │     │ [____]  │                 │
│   │ 3 vars  │     │ 2 vars  │     │ 4 vars  │                 │
│   └─────────┘     └─────────┘     └─────────┘                 │
│        │                                                       │
│        ▼                                                       │
│   ┌─────────┐                                                  │
│   │IconBtn  │                                                  │
│   │  [⚡]   │                                                  │
│   │ 1 var   │                                                  │
│   └─────────┘                                                  │
│                                                                │
│                                              ┌────────┐        │
│                                              │minimap │        │
│                                              └────────┘        │
└────────────────────────────────────────────────────────────────┘
```

---

## Implementation Log

### Completed: Data Infrastructure (pre-requisite for visual canvas)

The following was built as part of the Project Integration plan. These provide the data layer that the Component Canvas visual mode will consume.

**componentCanvasSlice.ts** — `app/stores/slices/componentCanvasSlice.ts`
- State: `componentSchemas`, `dnaConfigs`, `componentCanvasNodes`, selection (Set), viewport (pan/zoom), loading/error
- `scanComponentSchemas(themePath)` — calls Rust `scan_schemas`, parses JSON strings from specta, calculates grid layout, triggers parallel token/asset loading
- `calculateGridLayout()` — positions nodes in 4-column grid (280×200 nodes, 32px h-gap, 24px v-gap)
- Selection: single, toggle (Cmd+click), add (Shift+click), clear, select-all
- Viewport: pan, zoom (0.25–2×), reset, pan-to-node

**Types** — `app/types/componentCanvas.ts`
- `ComponentSchema`: name, description, filePath, props, slots, examples, subcomponents
- `DnaConfig`: component, filePath, tokenBindings, states
- `ComponentCanvasNode`: id, schema, dna?, x, y, width, height

**Rust backend** — `tauri/src/commands/mod.rs`
- `scan_schemas(path)` — walks theme directory for `*.schema.json` + `*.dna.json`, returns `ScanResult` with raw JSON strings
- Returns `RawSchema` / `RawDnaConfig` with JSON string fields for specta compatibility

**ComponentsPanel integration** — `app/components/ComponentsPanel.tsx`
- Merges theme components (from themeLoader) + project components (from componentMetas store)
- `SourceBadge` component: blue "Theme" / green "Project"
- Deduplication: theme components take precedence by name
- Header shows: "12 theme, 5 project"

### What's needed for visual canvas (002-A through 002-H)

The store slice and types are ready. The visual canvas work (ComponentNode with live preview, canvas rendering, relationship lines, layout modes) has not been started. The data flow is:

```
componentCanvasNodes (from store)
  → ComponentCanvas.tsx (renders nodes on pan/zoom canvas)
  → ComponentNode.tsx (renders each node with live preview)
  → RelationshipLines.tsx (connects nodes based on schema.subcomponents)
```

The grid layout in `componentCanvasSlice.ts:calculateGridLayout()` provides initial positioning. Layout modes (force-directed, grouped) would replace or extend this function.

---

## Out of Scope (Future)

- Drag-and-drop component reordering in code
- Live prop editing on canvas
- Component performance profiling
- Storybook integration
- Figma sync
