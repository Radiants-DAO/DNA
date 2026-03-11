"use client";

import { useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
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

const NODE_GAP_X = 40;
const NODE_GAP_Y = 40;
const COLS = 3;
const COL_WIDTH = 600;
const PRO_OPTIONS = { hideAttribution: true } as const;

/** Build a grid of nodes from registry entries */
function buildNodes(entries: RegistryEntry[]): PlaygroundNode[] {
  return entries.map((entry, i) => ({
    id: entry.id,
    type: "component" as const,
    position: {
      x: 80 + (i % COLS) * (COL_WIDTH + NODE_GAP_X),
      y: 80 + Math.floor(i / COLS) * (320 + NODE_GAP_Y),
    },
    data: {
      registryId: entry.id,
      label: entry.label,
      props: { ...entry.defaultProps },
    } satisfies ComponentNodeData,
  }));
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
    // Populate canvas when entries change (package switch)
    useEffect(() => {
      setNodes(buildNodes(entries));
      setEdges([]);

      const raf = requestAnimationFrame(() => {
        fitView({ padding: 0.1, duration: 300 });
      });
      return () => cancelAnimationFrame(raf);
    }, [entries, setNodes, setEdges, fitView]);

    const onConnect: OnConnect = useCallback(
      (params) => setEdges((eds) => addEdge(params, eds)),
      [setEdges],
    );

    const focusNode = useCallback(
      (registryId: string) => {
        const node = getNode(registryId);
        if (!node) return;
        const w = node.measured?.width ?? COL_WIDTH;
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
