"use client";

import { useCallback, useEffect, useImperativeHandle, forwardRef, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type OnConnect,
  addEdge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ComponentNode } from "./nodes/ComponentNode";
import type { PlaygroundNode, PlaygroundEdge, ComponentNodeData, RegistryEntry } from "./types";

const nodeTypes = { component: ComponentNode };

const NODE_WIDTH_DEFAULT = 320;
const NODE_WIDTH_VARIANTS = 480;
const NODE_GAP_X = 40;
const NODE_GAP_Y = 40;
const COLS = 4;

/** Node width based on whether entry has variants */
function nodeWidth(entry: RegistryEntry): number {
  return entry.variants && entry.variants.length > 0 && entry.rawComponent
    ? NODE_WIDTH_VARIANTS
    : NODE_WIDTH_DEFAULT;
}

/** Build a grid of nodes from registry entries */
function buildNodes(entries: RegistryEntry[]): PlaygroundNode[] {
  // Lay out nodes in rows, accounting for varying widths
  const nodes: PlaygroundNode[] = [];
  let x = 80;
  let y = 80;
  let col = 0;

  for (const entry of entries) {
    const w = nodeWidth(entry);

    if (col >= COLS) {
      col = 0;
      x = 80;
      y += 320 + NODE_GAP_Y;
    }

    nodes.push({
      id: entry.id,
      type: "component" as const,
      position: { x, y },
      data: {
        registryId: entry.id,
        label: entry.label,
        props: { ...entry.defaultProps },
      } satisfies ComponentNodeData,
      style: { width: w },
    });

    x += w + NODE_GAP_X;
    col++;
  }

  return nodes;
}

export interface PlaygroundCanvasHandle {
  focusNode: (registryId: string) => void;
}

interface PlaygroundCanvasProps {
  entries: RegistryEntry[];
}

export const PlaygroundCanvas = forwardRef<PlaygroundCanvasHandle, PlaygroundCanvasProps>(
  function PlaygroundCanvas({ entries }, ref) {
    const { fitView, setCenter, getNode } = useReactFlow();
    const [nodes, setNodes, onNodesChange] = useNodesState<PlaygroundNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<PlaygroundEdge>([]);
    const prevPackageRef = useRef<string>("");

    // Populate canvas when entries change (package switch)
    useEffect(() => {
      const packageKey = entries.map((e) => e.id).join(",");
      if (packageKey === prevPackageRef.current) return;
      prevPackageRef.current = packageKey;

      setNodes(buildNodes(entries));
      setEdges([]);

      // Fit view after nodes render
      requestAnimationFrame(() => {
        fitView({ padding: 0.1, duration: 300 });
      });
    }, [entries, setNodes, setEdges, fitView]);

    const onConnect: OnConnect = useCallback(
      (params) => setEdges((eds) => addEdge(params, eds)),
      [setEdges],
    );

    const focusNode = useCallback(
      (registryId: string) => {
        const node = getNode(registryId);
        if (!node) return;
        const w = (node.style?.width as number) ?? NODE_WIDTH_DEFAULT;
        const x = node.position.x + w / 2;
        const y = node.position.y + 140;
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
          proOptions={{ hideAttribution: true }}
          className="bg-surface-secondary"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            className="!text-edge-primary opacity-30"
          />
          <Controls className="!border-edge-primary !bg-surface-primary !text-content-primary [&>button]:!border-edge-primary [&>button]:!bg-surface-primary" />
        </ReactFlow>
      </div>
    );
  },
);
