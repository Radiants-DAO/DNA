import { useMemo, memo } from "react";
import type {
  ComponentCanvasNode,
  ComponentConnection,
  ConnectionType,
} from "../../types/componentCanvas";
import { CONNECTION_COLORS } from "../../types/componentCanvas";

interface ConnectionPathProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: ConnectionType;
  isHighlighted: boolean;
  label?: string;
}

const ConnectionPath = memo(function ConnectionPath({
  fromX,
  fromY,
  toX,
  toY,
  type,
  isHighlighted,
}: ConnectionPathProps) {
  const d = useMemo(() => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const controlOffset = Math.max(Math.abs(dx), Math.abs(dy)) * 0.4;
    // Horizontal-biased Bezier for grid layout
    return `M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY}, ${toX - controlOffset} ${toY}, ${toX} ${toY}`;
  }, [fromX, fromY, toX, toY]);

  const color = CONNECTION_COLORS[type];
  const opacity = isHighlighted ? 0.9 : 0.3;
  const strokeWidth = isHighlighted ? 2.5 : 1.5;
  const isDashed = type === "tokenShare";

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeOpacity={opacity}
      strokeLinecap="round"
      strokeDasharray={isDashed ? "6 4" : undefined}
      className={`transition-all duration-150 ${isDashed && isHighlighted ? "animate-dash-flow" : ""}`}
    />
  );
});

interface ComponentConnectionsProps {
  nodes: ComponentCanvasNode[];
  connections: ComponentConnection[];
  visibility: Record<ConnectionType, boolean>;
  hoveredNodeId: string | null;
  selectedIds: Set<string>;
}

export function ComponentConnections({
  nodes,
  connections,
  visibility,
  hoveredNodeId,
  selectedIds,
}: ComponentConnectionsProps) {
  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  // Filter by visibility
  const visibleConnections = useMemo(
    () => connections.filter((c) => visibility[c.type]),
    [connections, visibility]
  );

  // Determine which connections are highlighted (connected to hovered or selected node)
  const highlightedIds = useMemo(() => {
    const activeId = hoveredNodeId;
    if (!activeId && selectedIds.size === 0) return new Set<string>();

    const ids = new Set<string>();
    for (const conn of visibleConnections) {
      if (
        conn.sourceId === activeId ||
        conn.targetId === activeId ||
        selectedIds.has(conn.sourceId) ||
        selectedIds.has(conn.targetId)
      ) {
        ids.add(conn.id);
      }
    }
    return ids;
  }, [visibleConnections, hoveredNodeId, selectedIds]);

  if (visibleConnections.length === 0) return null;

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: 1 }}
    >
      {visibleConnections.map((conn) => {
        const source = nodeMap.get(conn.sourceId);
        const target = nodeMap.get(conn.targetId);
        if (!source || !target) return null;

        // Connect from right-center of source to left-center of target
        const fromX = source.x + source.width;
        const fromY = source.y + source.height / 2;
        const toX = target.x;
        const toY = target.y + target.height / 2;

        return (
          <ConnectionPath
            key={conn.id}
            fromX={fromX}
            fromY={fromY}
            toX={toX}
            toY={toY}
            type={conn.type}
            isHighlighted={highlightedIds.has(conn.id)}
            label={conn.label}
          />
        );
      })}
    </svg>
  );
}

export default ComponentConnections;
