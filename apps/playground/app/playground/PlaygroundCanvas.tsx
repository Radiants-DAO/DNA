"use client";

import { useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type OnConnect,
  addEdge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ComponentNode } from "./nodes/ComponentNode";
import { registry } from "./registry";
import { loadCanvasState, saveCanvasState } from "./lib/storage";
import type { PlaygroundNode, PlaygroundEdge, ComponentNodeData } from "./types";

const nodeTypes = { component: ComponentNode };

const DEFAULT_NODE_WIDTH = 320;
const DEFAULT_NODE_HEIGHT = 280;

export interface PlaygroundCanvasHandle {
  addComponentNode: (registryId: string, position?: { x: number; y: number }) => void;
}

export const PlaygroundCanvas = forwardRef<PlaygroundCanvasHandle>(
  function PlaygroundCanvas(_props, ref) {
    const counterRef = useRef(0);
    const [nodes, setNodes, onNodesChange] = useNodesState<PlaygroundNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<PlaygroundEdge>([]);

    // Load persisted state on mount
    useEffect(() => {
      const saved = loadCanvasState();
      if (saved) {
        setNodes(saved.nodes);
        setEdges(saved.edges);
        counterRef.current = saved.counter;
      }
    }, [setNodes, setEdges]);

    // Persist on change
    useEffect(() => {
      saveCanvasState({
        nodes,
        edges,
        counter: counterRef.current,
      });
    }, [nodes, edges]);

    const onConnect: OnConnect = useCallback(
      (params) => setEdges((eds) => addEdge(params, eds)),
      [setEdges],
    );

    const addComponentNode = useCallback(
      (registryId: string, position?: { x: number; y: number }) => {
        const entry = registry.find((e) => e.id === registryId);
        if (!entry) return;

        const id = `node-${++counterRef.current}`;
        const newNode: PlaygroundNode = {
          id,
          type: "component",
          position: position ?? {
            x: 80 + (counterRef.current % 4) * (DEFAULT_NODE_WIDTH + 40),
            y: 80 + Math.floor(counterRef.current / 4) * (DEFAULT_NODE_HEIGHT + 40),
          },
          data: {
            registryId,
            label: entry.label,
            props: { ...entry.defaultProps },
            source: "baseline",
          } satisfies ComponentNodeData,
          style: { width: DEFAULT_NODE_WIDTH },
        };

        setNodes((nds) => [...nds, newNode]);
      },
      [setNodes],
    );

    useImperativeHandle(ref, () => ({ addComponentNode }), [addComponentNode]);

    const onDragOver = useCallback((event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
      (event: React.DragEvent) => {
        event.preventDefault();
        const registryId = event.dataTransfer.getData(
          "application/x-playground-component",
        );
        if (!registryId) return;

        const bounds = (event.target as HTMLElement)
          .closest(".react-flow")
          ?.getBoundingClientRect();
        if (!bounds) return;

        const position = {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        };

        addComponentNode(registryId, position);
      },
      [addComponentNode],
    );

    return (
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
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
