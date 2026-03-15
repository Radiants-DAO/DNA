"use client";

import { memo, Suspense, useState, useEffect, type ComponentType } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { VariantNodeData } from "../types";

type VariantModule = { default: Record<string, ComponentType<Record<string, unknown>>> };

interface IterationPreviewProps {
  fileName: string;
  onTrash: (fileName: string) => void;
  onAdopt: (fileName: string) => void;
}

function IterationPreview({ fileName, onTrash, onAdopt }: IterationPreviewProps) {
  const [Mod, setMod] = useState<VariantModule | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import(`../iterations/${fileName}`)
      .then((m) => setMod(m as VariantModule))
      .catch((e) => setError(e.message));
  }, [fileName]);

  if (error) {
    return (
      <div className="rounded-xs border border-status-error bg-surface-primary p-3">
        <span className="font-mono text-xs text-status-error">Failed: {fileName}</span>
      </div>
    );
  }

  if (!Mod) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xs border border-edge-muted bg-surface-primary p-3">
        <span className="text-xs text-content-muted">Loading...</span>
      </div>
    );
  }

  // Render the default export — try common namespace patterns
  const Comp = Mod.default;

  return (
    <div className="group relative rounded-xs border border-edge-muted bg-surface-primary">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-edge-muted px-2 py-1">
        <span className="font-mono text-xs text-content-muted">{fileName.replace('.tsx', '')}</span>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onAdopt(fileName)}
            className="rounded-xs px-1.5 py-0.5 text-xs text-content-primary hover:bg-surface-tertiary cursor-pointer"
            title="Adopt this variant"
          >
            Adopt
          </button>
          <button
            onClick={() => onTrash(fileName)}
            className="rounded-xs px-1.5 py-0.5 text-xs text-status-error hover:bg-surface-tertiary cursor-pointer"
            title="Delete this variant"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex min-h-24 items-center justify-center p-3">
        <Suspense fallback={<span className="text-xs text-content-muted">...</span>}>
          <IterationRenderer component={Comp} />
        </Suspense>
      </div>
    </div>
  );
}

/** Try to render a namespace component with a sensible default composition */
function IterationRenderer({ component: Comp }: { component: Record<string, ComponentType<Record<string, unknown>>> }) {
  // If it has Root/Content/Title/Description, render a standard composition
  if (Comp.Root && Comp.Content && Comp.Title && Comp.Description) {
    const Root = Comp.Root;
    const Content = Comp.Content;
    const Title = Comp.Title;
    const Description = Comp.Description;
    return (
      <div className="w-full">
        <Root>
          <Content>
            <Title>{"Sample title" as unknown as React.ReactNode}</Title>
            <Description>{"This is a preview of the variant." as unknown as React.ReactNode}</Description>
          </Content>
        </Root>
      </div>
    );
  }

  // Fallback: try rendering as a simple component
  if (typeof Comp === "function") {
    const Simple = Comp as unknown as ComponentType<Record<string, unknown>>;
    return <Simple>Variant preview</Simple>;
  }

  return <span className="text-xs text-content-muted">Cannot preview</span>;
}

function VariantNodeInner({ data }: NodeProps<{ componentId: string; label: string; iterations: string[] }>) {
  const [iterations, setIterations] = useState(data.iterations);

  const handleTrash = async (fileName: string) => {
    setIterations((prev) => prev.filter((f) => f !== fileName));
    // TODO: call API to delete file on disk
  };

  const handleAdopt = async (fileName: string) => {
    try {
      const res = await fetch("/playground/api/adopt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId: data.componentId, iterationFile: fileName }),
      });
      const result = await res.json();
      if (!res.ok) {
        console.error("Adopt failed:", result.error);
      }
    } catch (e) {
      console.error("Adopt error:", e);
    }
  };

  return (
    <div className="flex w-[22rem] flex-col rounded-md border border-edge-muted bg-[#0F0E0C]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-edge-muted px-3 py-2">
        <span className="font-mono text-xs uppercase tracking-tight text-[#FEF8E2]">
          Potential Variants ({iterations.length})
        </span>
        <span className="font-mono text-xs text-content-muted">{data.label}</span>
      </div>

      {/* Iteration previews */}
      <div className="flex flex-col gap-2 p-2">
        {iterations.length === 0 ? (
          <div className="flex h-16 items-center justify-center">
            <span className="text-xs text-content-muted">No variants yet</span>
          </div>
        ) : (
          iterations.map((fileName) => (
            <IterationPreview
              key={fileName}
              fileName={fileName}
              onTrash={handleTrash}
              onAdopt={handleAdopt}
            />
          ))
        )}
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Left} className="!bg-edge-primary" />
    </div>
  );
}

export const VariantNode = memo(VariantNodeInner);
