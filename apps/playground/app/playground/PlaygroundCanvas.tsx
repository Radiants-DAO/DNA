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

const NODE_WIDTH = 320;
const NODE_GAP_X = 40;
const NODE_GAP_Y = 40;
const COLS = 4;

/** Build a grid of nodes from registry entries */
function buildNodes(entries: RegistryEntry[]): PlaygroundNode[] {
  return entries.map((entry, i) => ({
    id: entry.id,
    type: "component" as const,
    position: {
      x: 80 + (i % COLS) * (NODE_WIDTH + NODE_GAP_X),
      y: 80 + Math.floor(i / COLS) * (280 + NODE_GAP_Y),
    },
    data: {
      registryId: entry.id,
      label: entry.label,
      props: { ...entry.defaultProps },
    } satisfies ComponentNodeData,
    style: { width: NODE_WIDTH },
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
        const x = node.position.x + (NODE_WIDTH / 2);
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
