"use client";

import { memo, Suspense, useState, useEffect, type ComponentType } from "react";
import { Handle, Position, useViewport, type NodeProps } from "@xyflow/react";
import type { PlaygroundNode } from "../types";
import { registryById } from "../registry";
import { getViolationsForComponent } from "../lib/violations";
import { ViolationBadge } from "../components/ViolationBadge";
import { useForcedState } from "../ForcedStateContext";

// ---------------------------------------------------------------------------
// Iteration sub-card (dynamically loaded from iterations/)
// ---------------------------------------------------------------------------

function IterationCard({
  fileName,
  onTrash,
  onAdopt,
}: {
  fileName: string;
  onTrash: (f: string) => void;
  onAdopt: (f: string) => void;
}) {
  const [mod, setMod] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import(`../iterations/${fileName}`)
      .then((m) => setMod(m as Record<string, unknown>))
      .catch((e) => setError(e.message));
  }, [fileName]);

  if (error) {
    return (
      <div className="rounded-sm border border-status-error/30 bg-surface-primary p-3">
        <span className="font-mono text-xs text-status-error">
          Failed: {fileName}
        </span>
      </div>
    );
  }

  if (!mod) {
    return (
      <div className="flex h-24 items-center justify-center rounded-sm border border-[rgba(254,248,226,0.12)] bg-surface-primary">
        <span className="text-xs text-content-muted">Loading...</span>
      </div>
    );
  }

  const Comp =
    mod.default ??
    Object.values(mod).find(
      (v) => typeof v === "function" || (typeof v === "object" && v !== null),
    );

  return (
    <div className="group rounded-sm border border-[rgba(254,248,226,0.12)] bg-surface-primary">
      {/* Sub-card header */}
      <div className="flex items-center justify-between border-b border-[rgba(254,248,226,0.12)] px-2 py-1">
        <span className="font-mono text-xs text-content-muted">
          {fileName.replace(".tsx", "")}
        </span>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onAdopt(fileName)}
            className="cursor-pointer rounded-xs px-1.5 py-0.5 text-xs text-content-primary hover:bg-surface-tertiary"
            title="Adopt this variant"
          >
            Adopt
          </button>
          <button
            onClick={() => onTrash(fileName)}
            className="cursor-pointer rounded-xs px-1.5 py-0.5 text-xs text-status-error hover:bg-surface-tertiary"
            title="Delete this variant"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex min-h-24 items-center justify-center p-3">
        {Comp ? (
          <Suspense
            fallback={
              <span className="text-xs text-content-muted">...</span>
            }
          >
            <IterationRenderer component={Comp} />
          </Suspense>
        ) : (
          <span className="text-xs text-content-muted">
            No renderable export
          </span>
        )}
      </div>
    </div>
  );
}

/** Render an iteration component — handles namespace objects and plain functions */
function IterationRenderer({ component: Comp }: { component: unknown }) {
  if (typeof Comp === "object" && Comp !== null) {
    const ns = Comp as Record<
      string,
      ComponentType<Record<string, unknown>>
    >;
    if (ns.Root && ns.Content && ns.Title && ns.Description) {
      const Root = ns.Root;
      const Content = ns.Content;
      const Title = ns.Title;
      const Description = ns.Description;
      return (
        <div className="w-full">
          <Root>
            <Content>
              <Title>
                {"Sample title" as unknown as React.ReactNode}
              </Title>
              <Description>
                {"This is a preview of the variant." as unknown as React.ReactNode}
              </Description>
            </Content>
          </Root>
        </div>
      );
    }
  }

  if (typeof Comp === "function") {
    const Simple = Comp as ComponentType<Record<string, unknown>>;
    return <Simple>Variant preview</Simple>;
  }

  return <span className="text-xs text-content-muted">Cannot preview</span>;
}

// ---------------------------------------------------------------------------
// Main node
// ---------------------------------------------------------------------------

function ComponentNodeInner({ data }: NodeProps<PlaygroundNode>) {
  const entry = registryById.get(data.registryId);
  const forcedState = useForcedState();
  const { zoom } = useViewport();
  const [iterations, setIterations] = useState(data.iterations);

  const handleTrash = (fileName: string) => {
    setIterations((prev) => prev.filter((f) => f !== fileName));
    // TODO: call API to delete file on disk
  };

  const handleAdopt = async (fileName: string) => {
    try {
      const res = await fetch("/playground/api/adopt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentId: data.registryId,
          iterationFile: fileName,
        }),
      });
      const result = await res.json();
      if (!res.ok) console.error("Adopt failed:", result.error);
    } catch (e) {
      console.error("Adopt error:", e);
    }
  };

  if (!entry) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-status-error bg-[#0F0E0C] p-4 text-sm text-status-error">
        Unknown component: {data.registryId}
      </div>
    );
  }

  const { Component, rawComponent } = entry;
  const props = { ...entry.defaultProps, ...data.props };
  const violations = getViolationsForComponent(entry.sourcePath);
  const hasVariants =
    entry.variants && entry.variants.length > 0 && rawComponent;
  const stateAttr = forcedState !== "default" ? forcedState : undefined;

  return (
    <div className="relative">
      {/* External label — counter-scaled so it stays readable at any zoom */}
      <div
        className="absolute bottom-full left-0 flex items-center gap-1.5 pb-1.5"
        style={{ transform: `scale(${1 / zoom})`, transformOrigin: "bottom left" }}
      >
        <span className="whitespace-nowrap rounded-sm bg-[#0F0E0C] px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-[#FEF8E2]">
          {data.label}
        </span>
        {violations && <ViolationBadge violations={violations} compact />}
      </div>

      <div
        className="flex w-[22rem] flex-col rounded-md border border-[rgba(254,248,226,0.15)] bg-[#0F0E0C]"
        style={{ boxShadow: "0 0 0 1px rgba(252,225,132,0.06), 0 0 12px rgba(252,225,132,0.08)" }}
      >
      {/* Sub-cards */}
      <div className="flex flex-col gap-2 p-2" data-force-state={stateAttr}>
        {/* Default render */}
        {Component && (
          <div className="rounded-sm border border-[rgba(254,248,226,0.12)] bg-surface-primary">
            <div className="flex items-center border-b border-[rgba(254,248,226,0.12)] px-2 py-1">
              <span className="font-mono text-xs text-content-muted">
                default
              </span>
            </div>
            <div className="flex min-h-32 items-center justify-center p-3">
              <Suspense
                fallback={
                  <div className="text-xs text-content-muted">Loading...</div>
                }
              >
                <Component {...props} />
              </Suspense>
            </div>
          </div>
        )}

        {/* Curated variants */}
        {hasVariants &&
          entry.variants!.map((v) => (
            <div
              key={v.label}
              className="rounded-sm border border-[rgba(254,248,226,0.12)] bg-surface-primary"
            >
              <div className="flex items-center border-b border-[rgba(254,248,226,0.12)] px-2 py-1">
                <span className="font-mono text-xs text-content-muted">
                  {v.label}
                </span>
              </div>
              <div className="flex min-h-24 items-center justify-center p-3">
                <Suspense
                  fallback={
                    <span className="text-xs text-content-muted">...</span>
                  }
                >
                  {rawComponent &&
                    (() => {
                      const Variant = rawComponent;
                      return <Variant {...v.props} />;
                    })()}
                </Suspense>
              </div>
            </div>
          ))}

        {/* Iteration variants */}
        {iterations.length > 0 && (
          <>
            <div className="px-1 pt-1">
              <span className="font-mono text-xs uppercase tracking-tight text-[#FEF8E2]">
                Potential Variants ({iterations.length})
              </span>
            </div>
            {iterations.map((fileName) => (
              <IterationCard
                key={fileName}
                fileName={fileName}
                onTrash={handleTrash}
                onAdopt={handleAdopt}
              />
            ))}
          </>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-edge-primary"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-edge-primary"
      />
      </div>
    </div>
  );
}

export const ComponentNode = memo(ComponentNodeInner);
