# Sub-Task 001-0: Shared Types & Utilities

## Parent Task
001-spatial-file-viewer.md

---

## Overview

Foundation task defining shared types, utility functions, and the viewport slice. **Must be completed before all other sub-tasks.**

---

## Location

**Types:** `/tools/flow/app/types/spatial.ts`
**Utilities:** `/tools/flow/app/utils/spatial/treeHelpers.ts`
**Slice:** `/tools/flow/app/stores/slices/spatialViewportSlice.ts`

---

## Shared Types

```typescript
// /app/types/spatial.ts
import { z } from "zod";

// ============================================================================
// FILE NODE TYPES (mirrors Rust types from specta)
// ============================================================================

export type NodeType = "File" | "Directory";

export interface FileNode {
  id: string;
  name: string;
  path: string;
  nodeType: NodeType;
  extension: string | null;
  size: number;
  sizeFormatted: string;
  totalSize: number | null;      // For directories
  childCount: number | null;     // For directories
  modified: string;              // ISO timestamp
  isHidden: boolean;
  isReadable: boolean;
  isAutoCollapsed: boolean;      // node_modules, .git, etc.
  children?: FileNode[];         // Populated on expand
}

// ============================================================================
// LAYOUT TYPES
// ============================================================================

export const TreeLayoutConfigSchema = z.object({
  horizontalGap: z.number().default(200),
  verticalGap: z.number().default(20),
  nodeWidth: z.number().default(200),
  nodeHeight: z.number().default(64),
  rootOffsetX: z.number().default(40),
  rootOffsetY: z.number().default(40),
  maxVisibleChildren: z.number().default(20),
});

export type TreeLayoutConfig = z.infer<typeof TreeLayoutConfigSchema>;

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fileNode: FileNode;
  subtreeHeight: number;
  isCollapsed: boolean;
  isTruncationNode?: boolean;
  truncatedCount?: number;
}

// ============================================================================
// SELECTION TYPES
// ============================================================================

export interface SelectModifiers {
  shift: boolean;
  cmd: boolean;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface SearchMatch {
  node: FileNode;
  score: number;
  matchedIndices: number[];
  pathSegments: string[];
}

// ============================================================================
// VIEWPORT TYPES
// ============================================================================

export interface PanOffset {
  x: number;
  y: number;
}

export interface CanvasBounds {
  width: number;
  height: number;
}
```

---

## Tree Helper Utilities

```typescript
// /app/utils/spatial/treeHelpers.ts

import type { FileNode } from "../../types/spatial";

/**
 * Get the parent path from a file path
 */
export function getParentPath(path: string): string {
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash <= 0) return "/";
  return path.substring(0, lastSlash);
}

/**
 * Get all ancestor paths for a given path (for search result expansion)
 */
export function getAncestorPaths(path: string): string[] {
  const ancestors: string[] = [];
  let current = getParentPath(path);

  while (current && current !== "/") {
    ancestors.push(current);
    current = getParentPath(current);
  }

  return ancestors;
}

/**
 * Merge children into an existing file tree (for lazy loading)
 * Returns a new tree with the children inserted at the specified path
 */
export function mergeChildren(
  tree: FileNode | null,
  targetPath: string,
  children: FileNode[]
): FileNode | null {
  if (!tree) return null;

  // If this is the target node, add children
  if (tree.path === targetPath) {
    return {
      ...tree,
      children,
      childCount: children.length,
    };
  }

  // If this node has children, recursively search
  if (tree.children) {
    const updatedChildren = tree.children.map((child) =>
      mergeChildren(child, targetPath, children) ?? child
    );

    // Check if any child was actually updated
    const wasUpdated = updatedChildren.some(
      (child, i) => child !== tree.children![i]
    );

    if (wasUpdated) {
      return {
        ...tree,
        children: updatedChildren,
      };
    }
  }

  // No change needed
  return tree;
}

/**
 * Find a node in the tree by path
 */
export function findNodeByPath(
  tree: FileNode | null,
  targetPath: string
): FileNode | null {
  if (!tree) return null;
  if (tree.path === targetPath) return tree;

  if (tree.children) {
    for (const child of tree.children) {
      const found = findNodeByPath(child, targetPath);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Remove stale paths from a Set (cleanup after tree changes)
 */
export function cleanupStalePaths(
  paths: Set<string>,
  tree: FileNode | null
): Set<string> {
  const validPaths = new Set<string>();

  for (const path of paths) {
    if (findNodeByPath(tree, path)) {
      validPaths.add(path);
    }
  }

  return validPaths;
}

/**
 * Sort layout nodes by visual position (for range selection)
 * Primary: x position (columns), Secondary: y position (rows)
 */
export function sortByVisualOrder(nodes: LayoutNode[]): LayoutNode[] {
  return [...nodes].sort((a, b) => {
    // Group by column (x position with tolerance)
    const colA = Math.floor(a.x / 50);
    const colB = Math.floor(b.x / 50);
    if (colA !== colB) return colA - colB;
    // Within same column, sort by y
    return a.y - b.y;
  });
}
```

---

## Spatial Viewport Slice

```typescript
// /app/stores/slices/spatialViewportSlice.ts

import { StateCreator } from "zustand";
import type { AppState } from "../types";
import type { PanOffset, LayoutNode } from "../../types/spatial";

export interface SpatialViewportSlice {
  // State
  panOffset: PanOffset;
  isPanning: boolean;

  // Search state (colocated for simplicity)
  isSearchOpen: boolean;
  searchQuery: string;
  selectedResultIndex: number;
  highlightedPath: string | null;

  // Actions
  setPanOffset: (offset: PanOffset) => void;
  setIsPanning: (isPanning: boolean) => void;
  panToNode: (path: string, layoutNodes: LayoutNode[]) => void;
  resetPan: () => void;

  // Search actions
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
  selectNextResult: () => void;
  selectPreviousResult: () => void;
  setHighlightedPath: (path: string | null) => void;
}

export const createSpatialViewportSlice: StateCreator<
  AppState,
  [],
  [],
  SpatialViewportSlice
> = (set, get) => ({
  // Initial state
  panOffset: { x: 0, y: 0 },
  isPanning: false,
  isSearchOpen: false,
  searchQuery: "",
  selectedResultIndex: 0,
  highlightedPath: null,

  // Pan actions
  setPanOffset: (offset) => {
    set({ panOffset: offset });
  },

  setIsPanning: (isPanning) => {
    set({ isPanning });
  },

  panToNode: (path, layoutNodes) => {
    const node = layoutNodes.find((n) => n.fileNode.path === path);
    if (!node) return;

    // Center the node in the viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    set({
      panOffset: {
        x: -(node.x - viewportWidth / 2 + node.width / 2),
        y: -(node.y - viewportHeight / 2 + node.height / 2),
      },
    });
  },

  resetPan: () => {
    set({ panOffset: { x: 0, y: 0 } });
  },

  // Search actions
  openSearch: () => {
    set({ isSearchOpen: true, searchQuery: "", selectedResultIndex: 0 });
  },

  closeSearch: () => {
    set({ isSearchOpen: false, highlightedPath: null });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query, selectedResultIndex: 0 });
  },

  selectNextResult: () => {
    set((state) => ({
      selectedResultIndex: state.selectedResultIndex + 1,
    }));
  },

  selectPreviousResult: () => {
    set((state) => ({
      selectedResultIndex: Math.max(0, state.selectedResultIndex - 1),
    }));
  },

  setHighlightedPath: (path) => {
    set({ highlightedPath: path });

    // Auto-clear highlight after animation
    if (path) {
      setTimeout(() => {
        const current = get().highlightedPath;
        if (current === path) {
          set({ highlightedPath: null });
        }
      }, 2000);
    }
  },
});
```

---

## Performance Constants

```typescript
// /app/utils/spatial/constants.ts

export const SPATIAL_PERFORMANCE = {
  /** Maximum nodes before layout warns */
  LAYOUT_WARN_THRESHOLD: 500,
  /** Target layout time in ms */
  LAYOUT_BUDGET_MS: 16,
  /** Maximum SVG connections before virtualization recommended */
  SVG_WARN_THRESHOLD: 500,
};

export const DEFAULT_LAYOUT_CONFIG: TreeLayoutConfig = {
  horizontalGap: 200,
  verticalGap: 20,
  nodeWidth: 200,
  nodeHeight: 64,
  rootOffsetX: 40,
  rootOffsetY: 40,
  maxVisibleChildren: 20,
};

export const AUTO_COLLAPSE_PATTERNS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "__pycache__",
  "target",
  ".turbo",
];
```

---

## Acceptance Criteria

1. [ ] All shared types exported from `app/types/spatial.ts`
2. [ ] `mergeChildren` correctly inserts children at target path
3. [ ] `mergeChildren` returns new tree (immutable update)
4. [ ] `getAncestorPaths` returns all parent folders
5. [ ] `findNodeByPath` traverses tree correctly
6. [ ] `cleanupStalePaths` removes invalid paths
7. [ ] `sortByVisualOrder` sorts by x then y
8. [ ] `spatialViewportSlice` manages pan offset
9. [ ] `spatialViewportSlice` manages search state
10. [ ] `panToNode` centers node in viewport
11. [ ] Performance constants defined
12. [ ] Zod schema validates layout config

---

## Dependencies

- Zod (existing in Flow)
- Zustand (existing in Flow)

---

## Notes

This task MUST be completed before:
- 001-A (Rust types mirror these TypeScript types)
- 001-B (Layout uses TreeLayoutConfig and LayoutNode)
- 001-C (FileNode component uses FileNode type)
- 001-D (Selection uses SelectModifiers)
- 001-G (Integration imports all slices)
- 001-H (Search uses SearchMatch)
