import { useMemo, memo } from "react";
import type { LayoutNode } from "../../types/spatial";

interface Connection {
  id: string;
  parentPath: string;
  childPath: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

function getParentPath(path: string): string {
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash <= 0) return "";
  return path.slice(0, lastSlash);
}

function generateConnections(layoutNodes: LayoutNode[]): Connection[] {
  const connections: Connection[] = [];
  const nodeMap = new Map(layoutNodes.map((n) => [n.fileNode.path, n]));

  for (const node of layoutNodes) {
    if (node.isTruncationNode) continue;

    const parentPath = getParentPath(node.fileNode.path);
    const parent = nodeMap.get(parentPath);

    if (parent && !parent.isCollapsed) {
      // Vertical layout: connect from bottom-center of parent to top-center of child
      connections.push({
        id: `${parentPath}:${node.fileNode.path}`,
        parentPath,
        childPath: node.fileNode.path,
        fromX: parent.x + parent.width / 2,
        fromY: parent.y + parent.height,
        toX: node.x + node.width / 2,
        toY: node.y,
      });
    }
  }

  return connections;
}

interface ConnectionPathProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isHighlighted: boolean;
}

const ConnectionPath = memo(function ConnectionPath({
  fromX,
  fromY,
  toX,
  toY,
  isHighlighted,
}: ConnectionPathProps) {
  // Calculate control point offset for Bezier curve (vertical layout)
  const d = useMemo(() => {
    const controlPointOffset = Math.abs(toY - fromY) / 2;
    return `M ${fromX} ${fromY} C ${fromX} ${fromY + controlPointOffset}, ${toX} ${toY - controlPointOffset}, ${toX} ${toY}`;
  }, [fromX, fromY, toX, toY]);

  return (
    <path
      d={d}
      fill="none"
      stroke={isHighlighted ? "#3b82f6" : "rgba(255, 255, 255, 0.08)"}
      strokeWidth={isHighlighted ? 2 : 1.5}
      strokeLinecap="round"
      className="transition-colors duration-150"
    />
  );
});

interface ConnectionLinesProps {
  layoutNodes: LayoutNode[];
  highlightedPaths: Set<string>;
}

export function ConnectionLines({
  layoutNodes,
  highlightedPaths,
}: ConnectionLinesProps) {
  const connections = useMemo(() => {
    return generateConnections(layoutNodes);
  }, [layoutNodes]);

  if (connections.length === 0) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: 1 }}
    >
      {connections.map((conn) => (
        <ConnectionPath
          key={conn.id}
          fromX={conn.fromX}
          fromY={conn.fromY}
          toX={conn.toX}
          toY={conn.toY}
          isHighlighted={
            highlightedPaths.has(conn.childPath) ||
            highlightedPaths.has(conn.parentPath)
          }
        />
      ))}
    </svg>
  );
}

export default ConnectionLines;
