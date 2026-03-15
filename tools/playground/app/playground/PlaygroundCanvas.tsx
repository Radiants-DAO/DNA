"use client";

import { useCallback, useEffect, useImperativeHandle, forwardRef, useState } from "react";
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
import { VariantNode } from "./nodes/VariantNode";
import type { PlaygroundNode, PlaygroundEdge, ComponentNodeData, VariantNodeData, RegistryEntry } from "./types";

const nodeTypes = { component: ComponentNode, variants: VariantNode };

const NODE_GAP_X = 40;
const NODE_GAP_Y = 40;
const COLS = 3;
const COL_WIDTH = 600;
const PRO_OPTIONS = { hideAttribution: true } as const;

const VARIANT_OFFSET_X = 440; // horizontal offset from parent component node

/** Build a grid of nodes from registry entries */
function buildComponentNodes(entries: RegistryEntry[]): PlaygroundNode[] {
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

/** Create variant nodes + edges for components that have iterations */
function buildVariantNodesAndEdges(
  componentNodes: PlaygroundNode[],
  iterationMap: Record<string, string[]>,
): { variantNodes: PlaygroundNode[]; variantEdges: PlaygroundEdge[] } {
  const variantNodes: PlaygroundNode[] = [];
  const variantEdges: PlaygroundEdge[] = [];

  for (const cNode of componentNodes) {
    const iterations = iterationMap[cNode.id];
    if (!iterations || iterations.length === 0) continue;

    const variantId = `${cNode.id}__variants`;
    variantNodes.push({
      id: variantId,
      type: "variants" as const,
      position: {
        x: cNode.position.x + VARIANT_OFFSET_X,
        y: cNode.position.y,
      },
      data: {
        componentId: cNode.id,
        label: (cNode.data as ComponentNodeData).label,
        iterations,
      } satisfies VariantNodeData,
    });

    variantEdges.push({
      id: `${cNode.id}->variants`,
      source: cNode.id,
      target: variantId,
      animated: true,
    });
  }

  return { variantNodes, variantEdges };
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
    const [iterationMap, setIterationMap] = useState<Record<string, string[]>>({});

    // Fetch available iterations from the generate API
    useEffect(() => {
      fetch("/playground/api/generate")
        .then((res) => (res.ok ? res.json() : { byComponent: {} }))
        .then((data) => setIterationMap(data.byComponent ?? {}))
        .catch(() => setIterationMap({}));
    }, [entries]);

    // Populate canvas when entries or iterations change
    useEffect(() => {
      const componentNodes = buildComponentNodes(entries);
      const { variantNodes, variantEdges } = buildVariantNodesAndEdges(componentNodes, iterationMap);
      setNodes([...componentNodes, ...variantNodes]);
      setEdges(variantEdges);

      const raf = requestAnimationFrame(() => {
        fitView({ padding: 0.1, duration: 300 });
      });
      return () => cancelAnimationFrame(raf);
    }, [entries, iterationMap, setNodes, setEdges, fitView]);

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
          className="!bg-[#0F0E0C]"
        >
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
