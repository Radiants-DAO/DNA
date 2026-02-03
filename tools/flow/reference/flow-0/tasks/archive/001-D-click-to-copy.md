# Sub-Task 001-D: Click-to-Copy & Multi-Select

## Parent Task
001-spatial-file-viewer.md

---

## Overview

Selection system and clipboard operations for the spatial file viewer. Integrates with Flow's existing output patterns.

---

## Location

**Slice:** `/tools/flow/app/stores/slices/spatialSelectionSlice.ts`
**Hook:** `/tools/flow/app/hooks/useSpatialSelection.ts`

---

## Zustand Slice

```typescript
// /app/stores/slices/spatialSelectionSlice.ts
import { StateCreator } from "zustand";
import { AppState } from "../types";

export interface SpatialSelectionSlice {
  // State
  selectedPaths: Set<string>;
  lastSelectedPath: string | null;
  focusedPath: string | null;  // For keyboard navigation

  // Actions
  selectPath: (path: string, modifiers: SelectModifiers) => void;
  selectRange: (fromPath: string, toPath: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setFocusedPath: (path: string | null) => void;
  moveFocusUp: () => void;
  moveFocusDown: () => void;

  // Computed
  isSelected: (path: string) => boolean;
  getSelectedNodes: () => FileNode[];
}

interface SelectModifiers {
  shift: boolean;
  cmd: boolean;
}

export const createSpatialSelectionSlice: StateCreator<
  AppState,
  [],
  [],
  SpatialSelectionSlice
> = (set, get) => ({
  selectedPaths: new Set(),
  lastSelectedPath: null,

  selectPath: (path, { shift, cmd }) => {
    set((state) => {
      const next = new Set(state.selectedPaths);

      if (cmd) {
        // Toggle selection
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
      } else if (shift && state.lastSelectedPath) {
        // Range selection
        const range = getPathRange(
          get().visibleNodes,
          state.lastSelectedPath,
          path
        );
        range.forEach((p) => next.add(p));
      } else {
        // Single selection
        next.clear();
        next.add(path);
      }

      return {
        selectedPaths: next,
        lastSelectedPath: path,
      };
    });
  },

  selectAll: () => {
    const filePaths = get()
      .visibleNodes
      .filter((n) => n.fileNode.nodeType === "File")
      .map((n) => n.fileNode.path);
    set({ selectedPaths: new Set(filePaths) });
  },

  clearSelection: () => {
    set({ selectedPaths: new Set(), lastSelectedPath: null });
  },

  isSelected: (path) => get().selectedPaths.has(path),

  getSelectedNodes: () => {
    const paths = get().selectedPaths;
    return get()
      .visibleNodes
      .filter((n) => paths.has(n.fileNode.path))
      .map((n) => n.fileNode);
  },
});
```

---

## Clipboard Operations

### Single Copy

```typescript
async function copyPath(path: string): Promise<void> {
  await navigator.clipboard.writeText(path);
  // Play sound (matches Flow patterns)
  playClickSound();
}
```

### Batch Copy

```typescript
async function copySelectedPaths(): Promise<void> {
  const nodes = get().getSelectedNodes();
  const paths = nodes
    .filter((n) => n.nodeType === "File")
    .map((n) => n.path)
    .join("\n");

  await navigator.clipboard.writeText(paths);

  // Show toast
  showToast({
    message: `Copied ${nodes.length} path${nodes.length > 1 ? "s" : ""} to clipboard`,
    type: "success",
  });
}
```

---

## Visual Feedback

### Copy Flash (in FileNode)

```tsx
const [showCopyFeedback, setShowCopyFeedback] = useState(false);

const handleCopy = async () => {
  await copyPath(node.fileNode.path);
  setShowCopyFeedback(true);
  setTimeout(() => setShowCopyFeedback(false), 400);
};
```

### Toast (Flow's existing pattern)

```typescript
// Use Flow's existing toast system
import { useToast } from "../hooks/useToast";

const { showToast } = useToast();

showToast({
  message: "Copied: /path/to/file.ts",
  type: "success",
  duration: 2000,
});
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Copy selected path(s) |
| `Cmd+C` | Copy selected path(s) |
| `Cmd+A` | Select all visible files |
| `Escape` | Clear selection |

```typescript
// In useSpatialKeyboard hook
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      copySelectedPaths();
    }
    if (e.key === "c" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      copySelectedPaths();
    }
    if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      selectAll();
    }
    if (e.key === "Escape") {
      clearSelection();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);
```

---

## Range Selection Helper

**Important:** Nodes must be sorted by visual position (top-to-bottom, left-to-right) before range selection. The layout algorithm returns nodes in tree traversal order, not visual order.

```typescript
/**
 * Sort nodes by visual position for range selection
 * Primary: x position (columns), Secondary: y position (rows within column)
 */
function sortByVisualOrder(nodes: LayoutNode[]): LayoutNode[] {
  return [...nodes].sort((a, b) => {
    // Group by column (x position with tolerance for same column)
    const colA = Math.floor(a.x / 50);
    const colB = Math.floor(b.x / 50);
    if (colA !== colB) return colA - colB;
    // Within same column, sort by y
    return a.y - b.y;
  });
}

function getPathRange(
  visibleNodes: LayoutNode[],
  fromPath: string,
  toPath: string
): string[] {
  // Sort by visual order before finding range
  const sorted = sortByVisualOrder(visibleNodes);

  const fromIndex = sorted.findIndex((n) => n.fileNode.path === fromPath);
  const toIndex = sorted.findIndex((n) => n.fileNode.path === toPath);

  if (fromIndex === -1 || toIndex === -1) return [toPath];

  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);

  return sorted
    .slice(start, end + 1)
    .map((n) => n.fileNode.path);
}
```

---

## Acceptance Criteria

1. [ ] Zustand slice manages selection state
2. [ ] Plain click selects single (clears others)
3. [ ] Cmd/Ctrl+click toggles selection
4. [ ] Shift+click selects range (using visual order, not tree order)
5. [ ] Enter/Cmd+C copies selected paths
6. [ ] Cmd+A selects all visible files
7. [ ] Escape clears selection
8. [ ] Batch copy joins paths with newlines
9. [ ] Toast shows copy feedback
10. [ ] Green flash on node when copied
11. [ ] focusedPath state for keyboard navigation
12. [ ] Arrow key focus movement follows visual order

---

## Dependencies

- Zustand (existing in Flow)
- Flow's toast system (existing)
