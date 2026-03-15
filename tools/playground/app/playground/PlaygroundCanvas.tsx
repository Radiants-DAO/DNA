"use client";

import { useCallback, useEffect, useImperativeHandle, forwardRef, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useNodesInitialized,
  useViewport,
  type OnConnect,
  type NodeDragHandler,
  addEdge,
  BackgroundVariant,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ComponentNode } from "./nodes/ComponentNode";
import type { PlaygroundNode, PlaygroundEdge, ComponentNodeData, RegistryEntry } from "./types";

// ---------------------------------------------------------------------------
// Group container node — overflow hidden, counter-scaled badge label
// ---------------------------------------------------------------------------

type GroupNodeData = { label: string; width: number; height: number };

function GroupNode({ data }: { data: GroupNodeData }) {
  const { zoom } = useViewport();
  return (
    <div
      className="overflow-hidden rounded-lg border border-[rgba(254,248,226,0.08)] bg-[#141310]"
      style={{ width: data.width, height: data.height }}
    >
      {/* Counter-scaled badge pinned to top-left */}
      <div
        className="absolute select-none"
        style={{
          transform: `scale(${1 / zoom})`,
          transformOrigin: "bottom left",
          bottom: "100%",
          left: 0,
          paddingBottom: 4,
        }}
      >
        <span className="rounded-sm bg-[#0F0E0C] border border-[rgba(254,248,226,0.15)] px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-[#FEF8E2]">
          {data.label}
        </span>
      </div>
    </div>
  );
}

const nodeTypes = {
  component: ComponentNode,
  group: GroupNode,
};

type CanvasNode = PlaygroundNode | Node<GroupNodeData, "group">;

const NODE_WIDTH = 352; // 22rem
const NODE_GAP_X = 60;
const NODE_GAP_Y = 80;
const GROUP_GAP = 140;
const GROUP_COLS = 3;
const GROUP_PAD = 60;
const PRO_OPTIONS = { hideAttribution: true } as const;

/** Preferred group display order */
const GROUP_ORDER = [
  "Actions",
  "Forms",
  "Feedback",
  "Navigation",
  "Layout",
  "Overlays",
  "Data Display",
  "Dev Tools",
  "Components",
];

// ---------------------------------------------------------------------------
// Initial layout — groups first, then children with parentId
// ---------------------------------------------------------------------------

interface GroupMeta {
  name: string;
  entryIds: string[];
}

function buildInitialNodes(
  entries: RegistryEntry[],
  iterationMap: Record<string, string[]>,
): { nodes: CanvasNode[]; groupMeta: GroupMeta[] } {
  const groups = new Map<string, RegistryEntry[]>();
  for (const entry of entries) {
    const g = entry.group || "Components";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(entry);
  }

  const sortedGroups = [...groups.entries()].sort(
    (a, b) => (GROUP_ORDER.indexOf(a[0]) >>> 0) - (GROUP_ORDER.indexOf(b[0]) >>> 0),
  );

  const nodes: CanvasNode[] = [];
  const groupMeta: GroupMeta[] = [];
  let cursorY = 80;

  for (const [groupName, groupEntries] of sortedGroups) {
    const groupId = `__group__${groupName}`;
    const usedCols = Math.min(groupEntries.length, GROUP_COLS);
    const colHeights = new Array(GROUP_COLS).fill(0) as number[];
    const entryIds: string[] = [];

    // First pass: compute estimated column heights for group sizing
    for (let i = 0; i < groupEntries.length; i++) {
      const entry = groupEntries[i];
      const variantCount = entry.variants?.length ?? 0;
      const iterCount = (iterationMap[entry.id] ?? []).length;
      const estimatedHeight = 200 + variantCount * 160 + iterCount * 160;
      const col = i % GROUP_COLS;
      colHeights[col] += estimatedHeight + NODE_GAP_Y;
    }

    const tallestCol = Math.max(...colHeights);
    const groupWidth = usedCols * NODE_WIDTH + (usedCols - 1) * NODE_GAP_X + GROUP_PAD * 2;
    const groupHeight = tallestCol + GROUP_PAD;

    // Group node MUST come before its children in the array
    nodes.push({
      id: groupId,
      type: "group" as const,
      position: { x: 80, y: cursorY },
      data: { label: groupName, width: groupWidth, height: groupHeight },
      selectable: false,
      draggable: false,
      zIndex: -1,
    });

    // Reset for child placement
    colHeights.fill(0);

    for (let i = 0; i < groupEntries.length; i++) {
      const entry = groupEntries[i];
      const col = i % GROUP_COLS;
      // Positions are relative to parent group
      const x = GROUP_PAD + col * (NODE_WIDTH + NODE_GAP_X);
      const y = GROUP_PAD + colHeights[col];

      entryIds.push(entry.id);
      nodes.push({
        id: entry.id,
        type: "component" as const,
        position: { x, y },
        parentId: groupId,
        data: {
          registryId: entry.id,
          label: entry.label,
          props: { ...entry.defaultProps },
          iterations: iterationMap[entry.id] ?? [],
        } satisfies ComponentNodeData,
      });

      const variantCount = entry.variants?.length ?? 0;
      const iterCount = (iterationMap[entry.id] ?? []).length;
      const estimatedHeight = 200 + variantCount * 160 + iterCount * 160;
      colHeights[col] += estimatedHeight + NODE_GAP_Y;
    }

    groupMeta.push({ name: groupName, entryIds });
    cursorY += groupHeight + GROUP_GAP;
  }

  return { nodes, groupMeta };
}

// ---------------------------------------------------------------------------
// LayoutEngine — re-lays out after measurement with real heights
// ---------------------------------------------------------------------------

function LayoutEngine({
  groupMeta,
  setNodes,
}: {
  groupMeta: GroupMeta[];
  setNodes: (updater: (prev: CanvasNode[]) => CanvasNode[]) => void;
}) {
  const nodesInitialized = useNodesInitialized();
  const { getNodes, fitView } = useReactFlow();
  const didLayout = useRef(false);

  useEffect(() => {
    if (!nodesInitialized || didLayout.current || groupMeta.length === 0) return;
    didLayout.current = true;

    const allNodes = getNodes();
    const measured = new Map<string, { w: number; h: number }>();
    for (const n of allNodes) {
      if (n.measured?.width && n.measured?.height) {
        measured.set(n.id, { w: n.measured.width, h: n.measured.height });
      }
    }

    setNodes((prev) => {
      const updated = [...prev];
      const nodeMap = new Map(updated.map((n, i) => [n.id, i]));
      let cursorY = 80;

      for (const group of groupMeta) {
        const usedCols = Math.min(group.entryIds.length, GROUP_COLS);
        const colHeights = new Array(GROUP_COLS).fill(0) as number[];

        // Position children relative to group
        for (let i = 0; i < group.entryIds.length; i++) {
          const id = group.entryIds[i];
          const col = i % GROUP_COLS;
          const x = GROUP_PAD + col * (NODE_WIDTH + NODE_GAP_X);
          const y = GROUP_PAD + colHeights[col];

          const idx = nodeMap.get(id);
          if (idx !== undefined) {
            updated[idx] = { ...updated[idx], position: { x, y } };
          }

          const m = measured.get(id);
          const h = m ? m.h : 200;
          colHeights[col] += h + NODE_GAP_Y;
        }

        const tallestCol = Math.max(...colHeights);
        const groupWidth = usedCols * NODE_WIDTH + (usedCols - 1) * NODE_GAP_X + GROUP_PAD * 2;
        const groupHeight = tallestCol + GROUP_PAD;

        const groupId = `__group__${group.name}`;
        const gIdx = nodeMap.get(groupId);
        if (gIdx !== undefined) {
          const gNode = updated[gIdx] as Node<GroupNodeData, "group">;
          updated[gIdx] = {
            ...gNode,
            position: { x: 80, y: cursorY },
            data: { ...gNode.data, width: groupWidth, height: groupHeight },
          };
        }

        cursorY += groupHeight + GROUP_GAP;
      }

      return updated;
    });

    requestAnimationFrame(() => fitView({ padding: 0.1, duration: 300 }));
  }, [nodesInitialized, groupMeta, getNodes, setNodes, fitView]);

  useEffect(() => {
    didLayout.current = false;
  }, [groupMeta]);

  return null;
}

// ---------------------------------------------------------------------------
// Helpers: absolute position + hit-test against group bounds
// ---------------------------------------------------------------------------

/** Get a node's absolute position (accounts for parentId offset) */
function getAbsolutePosition(
  node: CanvasNode,
  allNodes: CanvasNode[],
): { x: number; y: number } {
  if (!node.parentId) return { ...node.position };
  const parent = allNodes.find((n) => n.id === node.parentId);
  if (!parent) return { ...node.position };
  return {
    x: parent.position.x + node.position.x,
    y: parent.position.y + node.position.y,
  };
}

/** Find the group node whose bounds contain the given point, if any */
function findGroupAtPoint(
  x: number,
  y: number,
  nodeW: number,
  nodeH: number,
  allNodes: CanvasNode[],
  excludeGroupId?: string,
): Node<GroupNodeData, "group"> | null {
  const cx = x + nodeW / 2;
  const cy = y + nodeH / 2;
  for (const n of allNodes) {
    if (n.type !== "group" || n.id === excludeGroupId) continue;
    const g = n as Node<GroupNodeData, "group">;
    const gx = g.position.x;
    const gy = g.position.y;
    if (cx >= gx && cx <= gx + g.data.width && cy >= gy && cy <= gy + g.data.height) {
      return g;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------

export interface PlaygroundCanvasHandle {
  focusNode: (registryId: string) => void;
}

interface PlaygroundCanvasProps {
  entries: RegistryEntry[];
}

export const PlaygroundCanvas = forwardRef<PlaygroundCanvasHandle, PlaygroundCanvasProps>(
  function PlaygroundCanvas({ entries }, ref) {
    const { fitView, setCenter, getNode } = useReactFlow();
    const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<PlaygroundEdge>([]);
    const [iterationMap, setIterationMap] = useState<Record<string, string[]>>({});
    const [groupMeta, setGroupMeta] = useState<GroupMeta[]>([]);

    // Fetch available iterations from the generate API
    useEffect(() => {
      fetch("/playground/api/generate")
        .then((res) => (res.ok ? res.json() : { byComponent: {} }))
        .then((data) => setIterationMap(data.byComponent ?? {}))
        .catch(() => setIterationMap({}));
    }, [entries]);

    // Build initial layout when entries or iterations change
    useEffect(() => {
      const { nodes: initialNodes, groupMeta: meta } = buildInitialNodes(entries, iterationMap);
      setNodes(initialNodes);
      setEdges([]);
      setGroupMeta(meta);

      const raf = requestAnimationFrame(() => {
        fitView({ padding: 0.1, duration: 300 });
      });
      return () => cancelAnimationFrame(raf);
    }, [entries, iterationMap, setNodes, setEdges, setGroupMeta, fitView]);

    const onConnect: OnConnect = useCallback(
      (params) => setEdges((eds) => addEdge(params, eds)),
      [setEdges],
    );

    // Detach from group when dragged out, re-attach when dragged into a group
    const handleNodeDragStop: NodeDragHandler<CanvasNode> = useCallback(
      (_event, draggedNode) => {
        if (draggedNode.type === "group") return;

        setNodes((prev) => {
          const all = [...prev];
          const idx = all.findIndex((n) => n.id === draggedNode.id);
          if (idx === -1) return prev;

          const node = all[idx];
          const nodeW = node.measured?.width ?? NODE_WIDTH;
          const nodeH = node.measured?.height ?? 200;
          const abs = getAbsolutePosition(node, all);

          if (node.parentId) {
            // Check if still inside current parent
            const parent = all.find((n) => n.id === node.parentId) as
              | Node<GroupNodeData, "group">
              | undefined;
            if (parent) {
              const cx = abs.x + nodeW / 2;
              const cy = abs.y + nodeH / 2;
              const inside =
                cx >= parent.position.x &&
                cx <= parent.position.x + parent.data.width &&
                cy >= parent.position.y &&
                cy <= parent.position.y + parent.data.height;

              if (inside) return prev; // still inside, no change
            }

            // Detach — convert to absolute position
            all[idx] = { ...node, parentId: undefined, position: abs };

            // Check if it landed in a different group
            const newGroup = findGroupAtPoint(abs.x, abs.y, nodeW, nodeH, all, node.parentId);
            if (newGroup) {
              all[idx] = {
                ...all[idx],
                parentId: newGroup.id,
                position: {
                  x: abs.x - newGroup.position.x,
                  y: abs.y - newGroup.position.y,
                },
              };
            }
          } else {
            // No parent — check if dragged into a group
            const targetGroup = findGroupAtPoint(abs.x, abs.y, nodeW, nodeH, all);
            if (targetGroup) {
              all[idx] = {
                ...node,
                parentId: targetGroup.id,
                position: {
                  x: abs.x - targetGroup.position.x,
                  y: abs.y - targetGroup.position.y,
                },
              };
            }
          }

          return all;
        });
      },
      [setNodes],
    );

    const focusNode = useCallback(
      (registryId: string) => {
        const node = getNode(registryId);
        if (!node) return;
        const w = node.measured?.width ?? NODE_WIDTH;
        const h = node.measured?.height ?? 280;
        const x = node.position.x + w / 2;
        const y = node.position.y + h / 2;
        setCenter(x, y, { zoom: 1, duration: 400 });
      },
      [getNode, setCenter],
    );

    useImperativeHandle(ref, () => ({ focusNode }), [focusNode]);

    return (
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={handleNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          panOnScroll
          zoomOnScroll={false}
          zoomOnPinch
          proOptions={PRO_OPTIONS}
          className="!bg-[#0F0E0C]"
        >
          <LayoutEngine groupMeta={groupMeta} setNodes={setNodes} />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            className="!text-[rgba(254,248,226,0.2)]"
          />
          <Controls className="!border-[rgba(254,248,226,0.2)] !bg-[#0F0E0C] !text-[#FEF8E2] [&>button]:!border-[rgba(254,248,226,0.2)] [&>button]:!bg-[#0F0E0C]" />
        </ReactFlow>
      </div>
    );
  },
);
