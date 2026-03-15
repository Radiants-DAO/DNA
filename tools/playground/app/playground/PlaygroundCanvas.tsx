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
  addEdge,
  BackgroundVariant,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ComponentNode } from "./nodes/ComponentNode";
import type { PlaygroundNode, PlaygroundEdge, ComponentNodeData, RegistryEntry } from "./types";

// ---------------------------------------------------------------------------
// Group container node — background + border with counter-scaled label
// ---------------------------------------------------------------------------

type GroupNodeData = { label: string; width: number; height: number };

function GroupNode({ data }: { data: GroupNodeData }) {
  const { zoom } = useViewport();
  return (
    <div
      className="pointer-events-none rounded-lg border border-[rgba(254,248,226,0.08)] bg-[#141310]"
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
const NODE_GAP_X = 40;
const NODE_GAP_Y = 32;
const GROUP_GAP = 100;
const GROUP_COLS = 3;
const GROUP_PAD = 24;
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
// Initial layout — places nodes with rough estimated heights.
// The LayoutEngine below will re-layout once actual measurements arrive.
// ---------------------------------------------------------------------------

interface GroupMeta {
  name: string;
  entryIds: string[];
}

function buildInitialNodes(
  entries: RegistryEntry[],
  iterationMap: Record<string, string[]>,
): { nodes: CanvasNode[]; groupMeta: GroupMeta[] } {
  // Group entries
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
    const groupX = 80;
    const contentStartY = cursorY + GROUP_PAD;
    const usedCols = Math.min(groupEntries.length, GROUP_COLS);
    const colHeights = new Array(GROUP_COLS).fill(0) as number[];
    const entryIds: string[] = [];

    for (let i = 0; i < groupEntries.length; i++) {
      const entry = groupEntries[i];
      const col = i % GROUP_COLS;
      const x = groupX + GROUP_PAD + col * (NODE_WIDTH + NODE_GAP_X);
      const y = contentStartY + colHeights[col];

      entryIds.push(entry.id);
      nodes.push({
        id: entry.id,
        type: "component" as const,
        position: { x, y },
        data: {
          registryId: entry.id,
          label: entry.label,
          props: { ...entry.defaultProps },
          iterations: iterationMap[entry.id] ?? [],
        } satisfies ComponentNodeData,
      });

      // Rough estimate for initial pass — will be corrected
      const variantCount = entry.variants?.length ?? 0;
      const iterCount = (iterationMap[entry.id] ?? []).length;
      const estimatedHeight = 200 + variantCount * 160 + iterCount * 160;
      colHeights[col] += estimatedHeight + NODE_GAP_Y;
    }

    const tallestCol = Math.max(...colHeights);
    const groupWidth = usedCols * NODE_WIDTH + (usedCols - 1) * NODE_GAP_X + GROUP_PAD * 2;
    const groupHeight = tallestCol + GROUP_PAD;

    nodes.push({
      id: `__group__${groupName}`,
      type: "group" as const,
      position: { x: groupX, y: cursorY },
      data: { label: groupName, width: groupWidth, height: groupHeight },
      selectable: false,
      draggable: false,
      zIndex: -1,
    });

    groupMeta.push({ name: groupName, entryIds });
    cursorY += groupHeight + GROUP_GAP;
  }

  return { nodes, groupMeta };
}

// ---------------------------------------------------------------------------
// LayoutEngine — lives inside <ReactFlow>, re-lays out after measurement
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

    // Re-layout with real heights
    setNodes((prev) => {
      const updated = [...prev];
      const nodeMap = new Map(updated.map((n, i) => [n.id, i]));
      let cursorY = 80;

      for (const group of groupMeta) {
        const groupX = 80;
        const contentStartY = cursorY + GROUP_PAD;
        const usedCols = Math.min(group.entryIds.length, GROUP_COLS);
        const colHeights = new Array(GROUP_COLS).fill(0) as number[];

        for (let i = 0; i < group.entryIds.length; i++) {
          const id = group.entryIds[i];
          const col = i % GROUP_COLS;
          const x = groupX + GROUP_PAD + col * (NODE_WIDTH + NODE_GAP_X);
          const y = contentStartY + colHeights[col];

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
            position: { x: groupX, y: cursorY },
            data: { ...gNode.data, width: groupWidth, height: groupHeight },
          };
        }

        cursorY += groupHeight + GROUP_GAP;
      }

      return updated;
    });

    // Fit after layout settles
    requestAnimationFrame(() => fitView({ padding: 0.1, duration: 300 }));
  }, [nodesInitialized, groupMeta, getNodes, setNodes, fitView]);

  // Reset when groupMeta changes (new entries/package switch)
  useEffect(() => {
    didLayout.current = false;
  }, [groupMeta]);

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
