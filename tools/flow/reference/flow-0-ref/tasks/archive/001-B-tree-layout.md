# Sub-Task 001-B: Tree Layout Algorithm

## Parent Task
001-spatial-file-viewer.md

---

## Overview

Horizontal tree layout algorithm for positioning file nodes on the spatial canvas. Runs in the React frontend, consumes FileNode data from Rust commands.

---

## Location

**Algorithm:** `/tools/flow/app/utils/spatial/treeLayout.ts`
**Hook:** `/tools/flow/app/hooks/useSpatialLayout.ts`
**Types:** `/tools/flow/app/types/spatial.ts`

---

## Data Structures

```typescript
// /app/types/spatial.ts
import { z } from "zod";

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
```

---

## Algorithm

### Phase 1: Measure Subtree Heights

```typescript
function measureSubtreeHeight(
  node: FileNode,
  expandedPaths: Set<string>,
  config: TreeLayoutConfig
): number {
  // Collapsed folders = single node height
  if (node.nodeType === "Directory" && !expandedPaths.has(node.path)) {
    return config.nodeHeight;
  }

  // Leaf nodes
  if (!node.children?.length) {
    return config.nodeHeight;
  }

  // Visible children (with truncation)
  const visibleCount = Math.min(node.children.length, config.maxVisibleChildren);
  const hasTruncation = node.children.length > config.maxVisibleChildren;

  let totalHeight = 0;
  for (let i = 0; i < visibleCount; i++) {
    totalHeight += measureSubtreeHeight(node.children[i], expandedPaths, config);
  }

  if (hasTruncation) {
    totalHeight += config.nodeHeight; // Truncation node
  }

  const gaps = (visibleCount + (hasTruncation ? 1 : 0) - 1) * config.verticalGap;
  return Math.max(config.nodeHeight, totalHeight + gaps);
}
```

### Phase 2: Position Nodes

```typescript
function positionNodes(
  node: FileNode,
  startX: number,
  startY: number,
  availableHeight: number,
  expandedPaths: Set<string>,
  subtreeHeights: Map<string, number>,
  config: TreeLayoutConfig,
  results: LayoutNode[]
): void {
  const subtreeHeight = subtreeHeights.get(node.path) ?? config.nodeHeight;
  const isCollapsed = node.nodeType === "Directory" && !expandedPaths.has(node.path);
  const nodeY = startY + (availableHeight - config.nodeHeight) / 2;

  results.push({
    id: node.id,
    x: startX,
    y: nodeY,
    width: config.nodeWidth,
    height: config.nodeHeight,
    fileNode: node,
    subtreeHeight,
    isCollapsed,
  });

  if (isCollapsed || !node.children?.length) return;

  const childX = startX + config.nodeWidth + config.horizontalGap;
  let childY = startY;

  const visibleCount = Math.min(node.children.length, config.maxVisibleChildren);
  const truncatedCount = node.children.length - visibleCount;

  for (let i = 0; i < visibleCount; i++) {
    const child = node.children[i];
    const childHeight = subtreeHeights.get(child.path) ?? config.nodeHeight;
    positionNodes(child, childX, childY, childHeight, expandedPaths, subtreeHeights, config, results);
    childY += childHeight + config.verticalGap;
  }

  if (truncatedCount > 0) {
    results.push({
      id: `${node.id}__truncation`,
      x: childX,
      y: childY,
      width: config.nodeWidth,
      height: config.nodeHeight,
      fileNode: node,
      subtreeHeight: config.nodeHeight,
      isCollapsed: false,
      isTruncationNode: true,
      truncatedCount,
    });
  }
}
```

---

## Hook: useSpatialLayout

```typescript
// /app/hooks/useSpatialLayout.ts
import { useMemo } from "react";
import { useAppStore } from "../stores/appStore";

export function useSpatialLayout() {
  const fileTree = useAppStore((s) => s.fileTree);
  const expandedPaths = useAppStore((s) => s.expandedPaths);
  const layoutConfig = useAppStore((s) => s.spatialLayoutConfig);

  const layoutNodes = useMemo(() => {
    if (!fileTree) return [];
    return calculateTreeLayout(fileTree, expandedPaths, layoutConfig);
  }, [fileTree, expandedPaths, layoutConfig]);

  const canvasBounds = useMemo(() => {
    return calculateCanvasBounds(layoutNodes, 40);
  }, [layoutNodes]);

  return { layoutNodes, canvasBounds };
}
```

---

## Canvas Bounds

```typescript
function calculateCanvasBounds(
  nodes: LayoutNode[],
  padding: number
): { width: number; height: number } {
  if (!nodes.length) {
    return { width: window.innerWidth, height: window.innerHeight };
  }

  let maxX = 0, maxY = 0;
  for (const node of nodes) {
    maxX = Math.max(maxX, node.x + node.width + padding);
    maxY = Math.max(maxY, node.y + node.height + padding);
  }

  return {
    width: Math.max(maxX, window.innerWidth),
    height: Math.max(maxY, window.innerHeight),
  };
}
```

---

## Panning (Canvas Only)

No individual node dragging. Canvas pans via:
- Middle-mouse drag
- Two-finger trackpad
- Matches Flow's existing canvas patterns

---

## Acceptance Criteria

1. [ ] `calculateTreeLayout()` positions nodes horizontally
2. [ ] Root on left, children expand rightward
3. [ ] Collapsed folders show single node
4. [ ] Layout recalculates on expand/collapse
5. [ ] "+N More Files" truncation nodes positioned correctly
6. [ ] Subtrees centered within allocated space
7. [ ] Canvas bounds extend to fit all nodes
8. [ ] Memoized for performance (useMemo)
9. [ ] Zod schema validates config

---

## Dependencies

- Zod (existing in Flow)
- React hooks (existing)
