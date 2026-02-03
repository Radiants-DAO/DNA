# Sub-Task 001-E: Connection Lines

## Parent Task
001-spatial-file-viewer.md

---

## Overview

SVG connection lines between parent folders and child nodes. Renders behind file nodes on the spatial canvas.

---

## Location

**Component:** `/tools/flow/app/components/spatial/ConnectionLines.tsx`

---

## Approach: SVG Bezier Curves

Uses smooth cubic Bezier curves for visual flow:

```
Parent ───╮
          ╰─── Child
```

---

## Component

```tsx
interface ConnectionLinesProps {
  layoutNodes: LayoutNode[];
  highlightedPaths: Set<string>;  // For search results
}

export function ConnectionLines({
  layoutNodes,
  highlightedPaths,
}: ConnectionLinesProps) {
  const connections = useMemo(() => {
    return generateConnections(layoutNodes);
  }, [layoutNodes]);

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: 1 }}
    >
      {connections.map((conn) => (
        <ConnectionPath
          key={conn.id}
          {...conn}
          isHighlighted={
            highlightedPaths.has(conn.childPath) ||
            highlightedPaths.has(conn.parentPath)
          }
        />
      ))}
    </svg>
  );
}
```

---

## Connection Generation

```typescript
interface Connection {
  id: string;
  parentPath: string;
  childPath: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

function generateConnections(layoutNodes: LayoutNode[]): Connection[] {
  const connections: Connection[] = [];
  const nodeMap = new Map(layoutNodes.map((n) => [n.fileNode.path, n]));

  for (const node of layoutNodes) {
    if (node.isTruncationNode) continue;

    const parentPath = getParentPath(node.fileNode.path);
    const parent = nodeMap.get(parentPath);

    if (parent && !parent.isCollapsed) {
      connections.push({
        id: `${parentPath}:${node.fileNode.path}`,
        parentPath,
        childPath: node.fileNode.path,
        fromX: parent.x + parent.width,
        fromY: parent.y + parent.height / 2,
        toX: node.x,
        toY: node.y + node.height / 2,
      });
    }
  }

  return connections;
}
```

---

## Path Component

```tsx
interface ConnectionPathProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isHighlighted: boolean;
}

function ConnectionPath({
  fromX,
  fromY,
  toX,
  toY,
  isHighlighted,
}: ConnectionPathProps) {
  const d = useMemo(() => {
    const cpOffset = Math.abs(toX - fromX) / 2;
    return `M ${fromX} ${fromY} C ${fromX + cpOffset} ${fromY}, ${toX - cpOffset} ${toY}, ${toX} ${toY}`;
  }, [fromX, fromY, toX, toY]);

  return (
    <path
      d={d}
      fill="none"
      stroke={isHighlighted ? "var(--color-primary)" : "var(--color-border)"}
      strokeWidth={isHighlighted ? 2 : 1.5}
      strokeLinecap="round"
      className="transition-colors duration-150"
    />
  );
}
```

---

## Styling

```css
/* Uses Flow's CSS variables */
--color-border: rgba(255, 255, 255, 0.08);
--color-primary: #3b82f6;
```

**States:**
- Default: `--color-border` (subtle)
- Highlighted: `--color-primary` (search result path)

---

## Z-Index Layering

```
z-index: 0  - Canvas background
z-index: 1  - Connection lines (SVG)
z-index: 2  - File nodes
z-index: 10 - Overlays, search
```

---

## Performance

- Memoize `generateConnections` with `useMemo`
- Memoize individual path `d` attributes
- Only re-render when `layoutNodes` changes
- For large trees (500+ connections): consider virtualization

---

## Acceptance Criteria

1. [ ] SVG renders behind file nodes (z-index: 1)
2. [ ] Bezier curves from parent right-edge to child left-edge
3. [ ] Lines only for expanded parent-child relationships
4. [ ] Highlighted state for search result paths
5. [ ] Uses Flow's color variables
6. [ ] Memoized for performance
7. [ ] Smooth transitions on highlight

### Accessibility Criteria

8. [ ] SVG has `aria-hidden="true"` (decorative, not interactive)
9. [ ] Connection lines are purely visual; tree structure conveyed via ARIA

---

## Dependencies

- React (existing)
- Flow's CSS variables (existing)
