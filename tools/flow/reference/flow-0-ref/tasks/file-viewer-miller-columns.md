# File Viewer: Miller Columns + Git Status

## Status: Backlog

## Overview
Convert the spatial file viewer from a tree layout to a **Miller Columns** layout (like macOS Finder column view), with git status indicated by colored glows.

## Visual Design

### Layout
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Column 1     │ │ Column 2     │ │ Column 3     │
│ (root)       │ │ (selected)   │ │ (selected)   │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ 📁 app     > │ │ 📁 components│ │ 📄 Button.tsx│
│ 📁 docs      │ │ 📁 hooks     │ │ 📄 Card.tsx  │
│ 📄 README.md │ │ 📄 App.tsx   │ │ 📄 Input.tsx │
└──────────────┘ └──────────────┘ └──────────────┘
```

- Columns scroll horizontally within the canvas
- Column width auto-sizes to longest item (min 200px, max 350px)
- Divider lines between columns (subtle)

### Git Status Glows (from radiants dark.css)
| Status | Glow Color | Variable |
|--------|------------|----------|
| New/untracked | Green | `--glow-green` |
| Modified (uncommitted) | Yellow | `--glow-sun-yellow` |
| Staged | Blue | `--glow-sky-blue` |
| Deleted | Red | `--glow-sun-red` |

## Interaction

### Mouse
- **Click folder** → Select + expand (show children in next column)
- **Click file** → Select + copy path
- **Cmd+Click** → Toggle selection
- **Shift+Click** → Toggle selection

### Keyboard (Finder-style)
- **↑/↓** → Move within current column
- **←** → Go to parent column
- **→** → Enter selected folder
- **Enter** → Copy path (file) or expand (folder)
- **Cmd+C** → Copy selected path(s)

## Implementation Tasks

1. **Layout Algorithm** - Rewrite `treeLayout.ts` → `millerLayout.ts`
2. **State Changes** - Add column path tracking to store
3. **Git Status Backend** - Add Rust command using git2 crate
4. **Git Status Frontend** - Fetch status, pass to FileNode for glows
5. **FileNode Updates** - Add gitStatus prop, apply glow CSS
6. **Keyboard Navigation** - Update for column-based movement

## Files to Modify
- `app/utils/spatial/treeLayout.ts`
- `app/stores/slices/spatialViewportSlice.ts`
- `app/hooks/useSpatialKeyboard.ts`
- `app/components/spatial/FileNode.tsx`
- `app/components/spatial/SpatialCanvas.tsx`
- `app/index.css`
- `tauri/src/commands/spatial.rs`
