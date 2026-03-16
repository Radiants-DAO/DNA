"use client";

import { useCallback, useEffect, useEffectEvent, useImperativeHandle, forwardRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useViewport,
  type OnConnect,
  addEdge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ComponentCard } from "./nodes/ComponentCard";
import { registryById } from "./registry";
import type { PlaygroundNode, PlaygroundEdge, GroupNodeData, RegistryEntry } from "./types";
import { isRenderable } from "./types";
import { usePlaygroundSignals } from "./hooks/usePlaygroundSignals";
import { WorkSignalContext } from "./work-signal-context";
import { usePlaygroundAnnotations } from "./hooks/usePlaygroundAnnotations";
import { AnnotationContext } from "./annotation-context";

// ---------------------------------------------------------------------------
// Group node — renders its components as plain div children via flexbox
// ---------------------------------------------------------------------------

function GroupNode({ data }: { data: GroupNodeData }) {
  const { zoom } = useViewport();
  const iterationMap = useIterationMap();

  return (
    <div className="relative">
      {/* Counter-scaled badge */}
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
        <span className="rounded-sm border border-[rgba(254,248,226,0.15)] bg-[#0F0E0C] px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-[#FEF8E2]">
          {data.groupName}
        </span>
      </div>

      {/* Container with vertical stack of component cards */}
      <div className="inline-flex rounded-xs border border-[rgba(254,248,226,0.08)] bg-[#141310] p-[60px]">
        <div className="flex flex-col gap-[60px]">
          {data.entryIds.map((id) => {
            const entry = registryById.get(id);
            if (!entry) return null;
            return (
              <ComponentCard
                key={id}
                entry={entry}
                iterations={iterationMap[id] ?? []}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { section: GroupNode };

const GROUP_GAP = 140;
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
// Iteration map context — shared between group nodes
// ---------------------------------------------------------------------------

import { createContext, useContext } from "react";

const IterationMapContext = createContext<Record<string, string[]>>({});
const useIterationMap = () => useContext(IterationMapContext);

// ---------------------------------------------------------------------------
// Build one node per group
// ---------------------------------------------------------------------------

function buildGroupNodes(entries: RegistryEntry[]): PlaygroundNode[] {
  const groups = new Map<string, string[]>();
  for (const entry of entries) {
    const g = entry.group || "Components";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(entry.id);
  }

  const sortedGroups = [...groups.entries()].sort(
    (a, b) => (GROUP_ORDER.indexOf(a[0]) >>> 0) - (GROUP_ORDER.indexOf(b[0]) >>> 0),
  );

  // Lay groups out horizontally with generous spacing
  let cursorX = 80;
  const GROUP_WIDTH = 500;

  return sortedGroups.map(([groupName, entryIds]) => {
    const node: PlaygroundNode = {
      id: `__group__${groupName}`,
      type: "section" as const,
      position: { x: cursorX, y: 80 },
      data: { groupName, entryIds },
    };
    cursorX += GROUP_WIDTH + GROUP_GAP;
    return node;
  });
}

// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------

export interface PlaygroundCanvasHandle {
  focusNode: (registryId: string, variantLabel?: string) => void;
}

interface PlaygroundCanvasProps {
  entries: RegistryEntry[];
}

export const PlaygroundCanvas = forwardRef<PlaygroundCanvasHandle, PlaygroundCanvasProps>(
  function PlaygroundCanvas({ entries }, ref) {
    const { fitView, setCenter, getNode, getViewport } = useReactFlow();
    const [nodes, setNodes, onNodesChange] = useNodesState<PlaygroundNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<PlaygroundEdge>([]);
    const [iterationMap, setIterationMap] = useState<Record<string, string[]>>({});

    const refreshIterations = useEffectEvent(() => {
      fetch("/playground/api/generate")
        .then((res) => (res.ok ? res.json() : { byComponent: {} }))
        .then((data) => setIterationMap(data.byComponent ?? {}))
        .catch(() => setIterationMap({}));
    });

    useEffect(() => {
      refreshIterations();
    }, [entries]);

    const { countForComponent, annotationsForComponent, refresh: refreshAnnotations } = usePlaygroundAnnotations();

    const workSignals = usePlaygroundSignals((event) => {
      if (event.type === "iterations-changed") {
        refreshIterations();
      }

      if (event.type === "annotations-changed") {
        refreshAnnotations();
      }
    });

    // Build group nodes
    useEffect(() => {
      const renderableEntries = entries.filter(isRenderable);
      setNodes(buildGroupNodes(renderableEntries));
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
      (registryId: string, variantLabel?: string) => {
        // Find the group that contains this entry
        const node = nodes.find((n) => n.data.entryIds.includes(registryId));
        if (!node) return;
        const resolved = getNode(node.id);
        if (!resolved) return;

        const groupEl = document.querySelector(`[data-id="${node.id}"]`) as HTMLElement | null;
        const cardEl = groupEl?.querySelector(`[data-registry-id="${registryId}"]`) as HTMLElement | null;

        // If a variant was specified, find it inside the card
        let targetEl: HTMLElement | null = null;
        if (variantLabel && cardEl) {
          targetEl = cardEl.querySelector(`[data-variant-label="${variantLabel}"]`) as HTMLElement | null;
        }
        // Fall back to card, then group
        targetEl = targetEl ?? cardEl ?? groupEl;

        let x: number;
        let y: number;

        if (targetEl && groupEl) {
          const groupRect = groupEl.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();
          const scale = getViewport().zoom;

          const offsetX = (targetRect.left - groupRect.left) / scale;
          const offsetY = (targetRect.top - groupRect.top) / scale;
          const targetW = targetRect.width / scale;
          const targetH = targetRect.height / scale;

          x = resolved.position.x + offsetX + targetW / 2;
          y = resolved.position.y + offsetY + targetH / 2;
        } else {
          const w = resolved.measured?.width ?? 800;
          const h = resolved.measured?.height ?? 400;
          x = resolved.position.x + w / 2;
          y = resolved.position.y + h / 2;
        }

        setCenter(x, y, { zoom: 1.5, duration: 400 });

        // Flash highlight on the target element
        if (targetEl) {
          targetEl.style.outline = "2px solid var(--color-sun-yellow, #FCE184)";
          targetEl.style.outlineOffset = "4px";
          targetEl.style.borderRadius = "4px";
          setTimeout(() => {
            targetEl.style.outline = "";
            targetEl.style.outlineOffset = "";
            targetEl.style.borderRadius = "";
          }, 1200);
        }
      },
      [nodes, getNode, setCenter, getViewport],
    );

    useImperativeHandle(ref, () => ({ focusNode }), [focusNode]);

    return (
      <WorkSignalContext.Provider value={workSignals}>
        <AnnotationContext.Provider value={{ countForComponent, annotationsForComponent }}>
          <IterationMapContext.Provider value={iterationMap}>
            <div className="flex-1">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.05}
                maxZoom={2}
                panOnScroll
                zoomOnScroll={false}
                zoomOnPinch
                proOptions={PRO_OPTIONS}
                className="!bg-[#0F0E0C] [&_.react-flow__node]:!bg-transparent [&_.react-flow__node]:!shadow-none [&_.react-flow__node]:!border-none [&_.react-flow__node]:!rounded-none"
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
          </IterationMapContext.Provider>
        </AnnotationContext.Provider>
      </WorkSignalContext.Provider>
    );
  },
);
