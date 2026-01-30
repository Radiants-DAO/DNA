# Task 001: Spatial File Viewer (Flow Integration)

## Overview

A spatial file viewer mode within the Flow app. Visualizes project file trees as an interactive horizontal canvas - optimized for AI workflow context gathering. Clicking files copies paths for quick context building.

## Integration Target

**Location:** `/Users/rivermassey/Desktop/dev/DNA/tools/flow/`

This becomes a new **editor mode** within Flow, alongside existing modes (normal, component-id, text-edit, comment, smart-annotate).

---

## Architecture

### Tech Stack (Matches Flow)
- **Frontend:** React 19 + Zustand slices + Tailwind v4
- **Backend:** Tauri 2.x + Rust commands
- **Build:** Vite
- **Validation:** Zod schemas

### State Management
New Zustand slices in `/app/stores/slices/`:
- `fileTreeSlice.ts` - File/folder data, lazy loading
- `spatialSelectionSlice.ts` - Selected paths (multi-select)
- `spatialViewportSlice.ts` - Pan, canvas state
- `expandedFoldersSlice.ts` - Collapse/expand state

### Rust Commands
New commands in `/src-tauri/src/`:
- `scan_directory` - List directory contents (1 level)
- `expand_folder` - Lazy load folder children
- `search_files` - Fuzzy search within tree
- `watch_directory` - File system watching

---

## Core Requirements

### Editor Mode: "spatial-browser"
- New mode in `ViewportSlice.editorMode`
- Toggle via keyboard shortcut or UI
- Replaces PreviewCanvas with SpatialCanvas when active

### Layout: Horizontal Tree
- Root directory on **left**, children expand **rightward**
- All folders **collapsed by default** with child count badge
- Click folder → expands 1 level (lazy loading)
- Connecting lines between parent-child nodes

### File Nodes
- **Icon** based on file type
- **Name** + **size** (files) or **child count + total size** (folders)
- Click file → **copy absolute path** to clipboard
- Click folder → **expand/collapse**

### Progressive Expansion
- Root shows 1 level deep initially
- "+N More Files" truncation for large folders (20 max visible)
- Auto-collapse: node_modules, .git, dist, build, .next

### Multi-Select & Batch Copy
- Shift+click: range selection
- Cmd/Ctrl+click: toggle selection
- Enter: copy all selected paths (newline-separated)

### Search
- Cmd+F: fuzzy search across entire tree
- Results pan canvas to match, expand parents, pulse highlight

### Keyboard Navigation
- Arrow keys navigate tree
- Enter copies, Space expands/collapses
- Cmd+A selects all visible

---

## File Structure (Within Flow)

```
tools/flow/
├── app/
│   ├── components/
│   │   └── spatial/                    # NEW
│   │       ├── SpatialCanvas.tsx       # Main canvas component
│   │       ├── FileNode.tsx            # File/folder node
│   │       ├── TruncationNode.tsx      # "+N More" node
│   │       ├── ConnectionLines.tsx     # SVG lines
│   │       ├── SpatialControls.tsx     # Path input, toggles
│   │       └── SpatialSearch.tsx       # Search overlay
│   ├── stores/
│   │   └── slices/
│   │       ├── fileTreeSlice.ts        # NEW
│   │       ├── spatialSelectionSlice.ts # NEW
│   │       ├── spatialViewportSlice.ts # NEW
│   │       └── expandedFoldersSlice.ts # NEW
│   ├── hooks/
│   │   ├── useSpatialLayout.ts         # NEW - tree layout algorithm
│   │   ├── useSpatialKeyboard.ts       # NEW - keyboard nav
│   │   └── useSpatialSearch.ts         # NEW - fuzzy search
│   ├── types/
│   │   └── spatial.ts                  # NEW - FileTreeNode, etc.
│   └── utils/
│       └── spatial/                    # NEW
│           ├── treeLayout.ts           # Layout algorithm
│           └── fuzzySearch.ts          # Search algorithm
├── src-tauri/
│   └── src/
│       ├── commands/
│       │   └── spatial.rs              # NEW - filesystem commands
│       └── lib.rs                      # Register new commands
└── ...
```

---

## Acceptance Criteria

1. [ ] New editor mode "spatial-browser" accessible via UI/keyboard
2. [ ] Canvas displays file tree with horizontal layout
3. [ ] Folders collapsed by default, show child count + size
4. [ ] Click folder expands 1 level (lazy via Rust command)
5. [ ] Click file copies path to clipboard with feedback
6. [ ] Multi-select with Shift/Cmd+click, batch copy
7. [ ] Search with Cmd+F, canvas jump, parent expansion
8. [ ] Keyboard navigation (arrows, Enter, Space)
9. [ ] Auto-collapse for node_modules, .git, etc.
10. [ ] "+N More Files" truncation for large folders
11. [ ] State persists via Zustand middleware
12. [ ] Integrates with existing Flow UI (TitleBar, StatusBar)

---

## Sub-Tasks

| ID | Task | Description | Dependencies |
|----|------|-------------|--------------|
| **001-0** | **Types & Utilities** | **Shared types, mergeChildren, viewport slice** | **Done** |
| 001-A | Rust Commands | Tauri commands for filesystem ops | **Done** |
| 001-B | Tree Layout | Horizontal layout algorithm | **Done** |
| 001-C | FileNode Component | File/folder node with states | **Done** |
| 001-D | Click-to-Copy | Multi-select + batch copy | **Done** |
| 001-E | Connection Lines | SVG parent-child lines | **Done** |
| 001-F | Controls | Path input, toggles, auto-collapse | **Done** |
| 001-G | Integration | Wire into Flow, Zustand slices | **Done** |
| ~~001-H~~ | ~~Search~~ | *Moved to **006-spatial-search.md*** | - |

### Recommended Build Order

```
Phase 1: 001-0 (Types & Utilities)
Phase 2: 001-A (Rust) + 001-B (Layout) [parallel]
Phase 3: 001-C + 001-E + 001-F [parallel]
Phase 4: 001-D + 001-H [parallel]
Phase 5: 001-G (Integration)
```

---

---

## Echo Reference Patterns

Patterns to reuse from `/reference/echo/robot-components/`:

### Sound Effects (~90% copy)
Copy `src/utils/SoundEffects.ts` to `app/utils/sounds.ts`. Use:
- `playClickSound()` → copy feedback
- `playQuickStartClick()` → folder expand/collapse

### Physics (Canvas Pan Only)
Adapt `PhysicsPanel` momentum calculation for canvas panning:
```typescript
const PAN_CONFIG = {
  baseFriction: 0.975,
  highSpeedFriction: 0.94,
  minVelocity: 0.15,
  maxVelocity: 40,
};
```
**Note:** No boundary bouncing (infinite canvas), no individual node dragging.

### Visual Transitions
From `page.tsx`:
- Shadow config: `idleShadow`/`dragShadow` patterns
- Spring configs: `{ stiffness: 400, damping: 28 }`
- Scale pulse: `{ scale: [1, 1.015, 1], transition: { duration: 0.3, ease: 'easeOut' } }`

### Color Mapping
```css
/* Echo → Flow mapping */
neutral-900 (#171717) → --color-background
neutral-800 (#262626) → --color-surface
neutral-700 (#404040) → --color-surface-elevated
blue-600 (#2563eb)    → --color-primary
green-400 (#4ade80)   → --color-success
```

---

## Out of Scope (Future)

- File previews (code syntax, images)
- File operations (move, copy, delete)
- Git status indicators
- File content search
