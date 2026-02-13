---
id: fn-5
title: Component Canvas
status: planning
priority: high
created: 2026-01-27
tags: [canvas, components, visualization, drag-drop]
dependencies: [fn-4-m3u]
---

# Component Canvas

Interactive canvas for browsing, organizing, and visualizing design system components.

## Overview

The Component Canvas transforms the static ComponentsPanel list into an interactive spatial canvas where users can:
- Browse components in a visual layout
- Drag and reposition components
- See composition relationships (which components use which)
- View import dependencies and usage statistics
- Jump to specific components from the panel

## Entry Points

| Trigger | Behavior |
|---------|----------|
| ComponentsPanel click | Opens canvas, animates to focus on clicked component |
| Dedicated mode toggle | Switches main view to full canvas mode |
| Keyboard shortcut | `Cmd+Shift+C` toggles canvas mode |

## ComponentNode Design

Based on existing ComponentList from `rad-os/devtools/tabs/ComponentsTab/ComponentList.tsx`:

```
┌─────────────────────────────────────┐
│ ◆ Button                      ⋮ │
│ components/ui/Button.tsx          │
│                                     │
│ Props: 8  Variants: 4  Used: 12   │
│                                     │
│ Uses: Icon, Spinner, Text         │
└─────────────────────────────────────┘
```

### Node Content
- **Icon**: Component type indicator (◆ for UI, ◇ for layout, etc.)
- **Name**: Component name (uppercase, bold)
- **Path**: File path relative to project root
- **Badges**:
  - Props count
  - Variants count (if union types detected)
  - Usage count (pages/components that import it)
- **Composition list**: Inline list of child components used

### Visual States
| State | Appearance |
|-------|------------|
| Default | Dark bg, subtle border |
| Hover | Border brightens, slight shadow |
| Selected | Blue border, blue tint bg |
| Dragging | Scale 1.02, deeper shadow, 50% opacity |
| Highlighted | Amber border, pulse glow |
| Focused | Blue ring (keyboard nav) |

## Canvas Behavior

### Physics (from robot.co reference)
- Spring grid: stiffness 0.08, damping 0.75
- Velocity friction: 0.975 (base) → 0.94 (high speed)
- Bounce on boundaries: damping 0.45
- Drop momentum: velocity-based

### Drag & Drop
1. Click + hold on node starts drag
2. Node follows cursor with slight lag (spring)
3. Grid shows snap points on hover
4. Release drops with momentum
5. Bounce sound on edge collision

### Position Persistence
Positions saved to `.flow/canvas-layout.json`:
```json
{
  "componentCanvas": {
    "Button": { "x": 100, "y": 200 },
    "Card": { "x": 400, "y": 200 }
  },
  "savedAt": "2026-01-27T...",
  "version": 1
}
```

## Relationship Visualization

### Connection Types
| Type | Color | Style | Shows |
|------|-------|-------|-------|
| Composition | Blue #3b82f6 | Solid | Components used inside |
| Import | Green #22c55e | Dashed | Import dependencies |
| Usage | Amber #f59e0b | Dotted | Where component is used |

### Animated Flow Lines
- Dashed pattern animates in direction of relationship
- Parent → Child for composition
- Source → Consumer for usage
- Highlight on hover to trace full path

### Visibility Controls
```tsx
<ConnectionFilters>
  <Toggle label="Composition" default={true} />
  <Toggle label="Imports" default={false} />
  <Toggle label="Usage" default={false} />
</ConnectionFilters>
```

## Sound Effects

Using shared `useCanvasSounds` hook:
- `drop`: Node released after drag (volume: 0.15)
- `bounce`: Edge collision (volume: 0.1)
- `select`: Node selected (volume: 0.08)
- `expand`: Composition list expanded (volume: 0.06)

## Integration with ComponentsPanel

### Current Panel Behavior
- Lists components by category/folder
- Shows name, path, props
- "Copy Cursor Command" button

### Enhanced Integration
1. **Click component** → Canvas opens, camera animates to component
2. **Hover in panel** → Corresponding node pulses on canvas
3. **Search in panel** → Non-matching nodes dim on canvas
4. **Context menu** → "Show in Canvas" / "Show Dependencies"

## Rendering Strategy

**Direct rendering** (not Shadow DOM) because:
- Components live in parent repo, already have context
- No need for style isolation
- Can reuse existing React render tree
- Shadow DOM adds complexity without benefit here

For preview thumbnails:
- Server-side render snapshot on component save
- Cache as base64 PNG
- Update on file change (via Tauri watcher)

## Auto-Layout Algorithms

### Initial Layout
When opening canvas for first time:
1. Group by folder/category
2. Tree layout within groups
3. Horizontal flow between groups
4. Avoid overlaps with force-directed nudge

### "Reset Layout" Action
- Re-runs auto-layout
- Animates nodes to new positions
- Clears saved positions (with confirmation)

## Tasks

### Phase 1: Foundation
- [ ] Create ComponentNode component
- [ ] Implement drag with physics
- [ ] Add position persistence
- [ ] Connect to ComponentsPanel

### Phase 2: Relationships
- [ ] Parse component imports (SWC)
- [ ] Build composition graph
- [ ] Track usage across files
- [ ] Render animated connection lines

### Phase 3: Polish
- [ ] Add sound effects
- [ ] Implement auto-layout
- [ ] Add keyboard navigation
- [ ] Add "Reset Layout" action

## Files to Create

```
app/components/canvas/
├── ComponentCanvas.tsx      # Main canvas component
├── ComponentNode.tsx        # Individual component card
├── ComponentConnections.tsx # Relationship lines
├── CanvasControls.tsx       # Zoom, filter, reset controls
└── index.ts

app/hooks/
├── useComponentGraph.ts     # Build/query component relationships
└── useCanvasLayout.ts       # Auto-layout algorithms

app/stores/slices/
└── componentCanvasSlice.ts  # Canvas state (positions, selection)
```

## Implementation Status

### Completed: Project Integration (Epics 0-4, 6.1, 7)

The following foundational work was implemented to feed real project data into all panels. This is prerequisite infrastructure for the Component Canvas visual mode (Phase 1-3 above, deferred to `tasks/002-component-canvas.md`).

#### Rust Backend

| File | What was added |
|------|----------------|
| `tauri/src/commands/tokens.rs` | `parse_theme_tokens(theme_path)` — parses `tokens.css` + `dark.css` (`.dark {}` selector blocks via lightningcss) |
| `tauri/src/commands/assets.rs` | `scan_theme_assets(theme_path)` — scans `assets/icons/`, `assets/logos/`, `assets/images/` returning `AssetLibrary` |
| `tauri/src/commands/project.rs` | `detect_project(path)` — identifies apps vs themes in monorepo, resolves `@rdna/*` deps to theme paths |
| `tauri/src/types/mod.rs` | `ThemeTokensBundle`, `DarkTokens`, `AssetLibrary`, `IconAsset`, `LogoAsset`, `ImageAsset`, `ThemeInfo` types |

#### Zustand Store Slices

| File | What was added |
|------|----------------|
| `app/stores/slices/tokensSlice.ts` | `darkTokens`, `colorMode`, `loadThemeTokens()`, `setColorMode()`, `getActiveTokens()` — merges light+dark tokens |
| `app/stores/slices/assetsSlice.ts` | New slice: `loadThemeAssets()`, `loadProjectAssets()`, `getMergedIcons/Logos/Images()`, recently-used tracking |
| `app/stores/slices/componentCanvasSlice.ts` | `scanComponentSchemas()` now triggers parallel `loadThemeTokens()` + `loadThemeAssets()` + `setSpatialRootPath()` |
| `app/stores/slices/projectSlice.ts` | `detect_project` wired to `setSpatialRootPath()` for auto spatial browser root |

#### UI Components

| File | What changed |
|------|-------------|
| `app/components/VariablesPanel.tsx` | Loads tokens from `getActiveTokens()`, sun/moon toggle for light/dark mode, amber dot on tokens with dark overrides, tokens grouped by prefix |
| `app/components/AssetsPanel.tsx` | Replaced all mock data (25 hardcoded icons) with real store data (145+ icons from theme), `convertFileSrc` for SVG previews, loading/empty/error states |
| `app/components/ComponentsPanel.tsx` | Merged theme + project components with `SourceBadge` (blue "Theme" / green "Project"), header shows count breakdown, deduplication with theme precedence |

#### Data Flow

```
Open Project / Scan Theme
  → detect_project (Rust) → ThemeInfo
  → loadThemeTokens(themePath) → tokens + darkTokens in store
  → loadThemeAssets(themePath) → icons/logos/images in store
  → scanComponentSchemas(themePath) → schemas + dnaConfigs in store
  → setSpatialRootPath(path) → spatial browser auto-roots
  → All panels read from store → real data displayed
```

### Remaining (Deferred)

| Item | Status | Blocker |
|------|--------|---------|
| Component Canvas visual mode (Phase 1-3) | Not started | See `tasks/002-component-canvas.md` |
| Layers panel (live DOM) | Not started | Needs bridge DOM tree endpoint |
| Theme-aware file highlighting | Not started | Polish task |
| Quick access paths in spatial browser | Not started | Polish task |

## Related

- [[fn-4-m3u]] - Spatial File Viewer (shares canvas core)
- [[component-canvas.md]] - Original spec (vault/radflow/02-Features/)
- robot.co reference - `/reference/echo/robot-components/app/nodegrid/page.tsx`
