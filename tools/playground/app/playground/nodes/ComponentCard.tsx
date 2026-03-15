"use client";

import { memo, Suspense, useState, useEffect, type ComponentType } from "react";
import type { RegistryEntry } from "../types";
import { getViolationsForComponent } from "../lib/violations";
import { ViolationBadge } from "../components/ViolationBadge";
import { useForcedState } from "../ForcedStateContext";
import { DitherSkeleton } from "@rdna/dithwather-react";
import { useWorkSignalSet } from "../work-signal-context";

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
      <div className="flex h-24 items-center justify-center rounded-sm border border-edge-primary bg-surface-primary">
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
    <div className="group/iter rounded-sm border border-edge-primary bg-surface-primary">
      <div className="flex items-center justify-between border-b border-edge-primary px-2 py-1">
        <span className="font-mono text-xs text-content-muted">
          {fileName.replace(".tsx", "")}
        </span>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/iter:opacity-100">
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex min-h-24 items-center justify-center p-3">
        {Comp ? (
          <Suspense fallback={<span className="text-xs text-content-muted">...</span>}>
            <IterationRenderer component={Comp} />
          </Suspense>
        ) : (
          <span className="text-xs text-content-muted">No renderable export</span>
        )}
      </div>
    </div>
  );
}

function IterationRenderer({ component: Comp }: { component: unknown }) {
  if (typeof Comp === "object" && Comp !== null) {
    const ns = Comp as Record<string, ComponentType<Record<string, unknown>>>;
    if (ns.Root && ns.Content && ns.Title && ns.Description) {
      const Root = ns.Root;
      const Content = ns.Content;
      const Title = ns.Title;
      const Description = ns.Description;
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
  }

  if (typeof Comp === "function") {
    const Simple = Comp as ComponentType<Record<string, unknown>>;
    return <Simple>Variant preview</Simple>;
  }

  return <span className="text-xs text-content-muted">Cannot preview</span>;
}

// ---------------------------------------------------------------------------
// ComponentCard — plain div, no ReactFlow dependency
// ---------------------------------------------------------------------------

interface ComponentCardProps {
  entry: RegistryEntry;
  iterations: string[];
}

function ComponentCardInner({ entry, iterations }: ComponentCardProps) {
  const forcedState = useForcedState();
  const workSignals = useWorkSignalSet();
  const isWorking = workSignals.has(entry.id);

  const handleTrash = async (fileName: string) => {
    try {
      const res = await fetch(`/playground/api/generate/${encodeURIComponent(fileName)}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        console.error("Trash failed:", result.error);
      }
    } catch (error) {
      console.error("Trash error:", error);
    }
  };

  const handleAdopt = async (fileName: string) => {
    try {
      const res = await fetch("/playground/api/adopt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId: entry.id, iterationFile: fileName }),
      });
      const result = await res.json();
      if (!res.ok) console.error("Adopt failed:", result.error);
    } catch (e) {
      console.error("Adopt error:", e);
    }
  };

  const { Component, rawComponent } = entry;
  const props = { ...entry.defaultProps };
  const violations = getViolationsForComponent(entry.sourcePath);
  const hasVariants = entry.variants && entry.variants.length > 0 && rawComponent;
  const stateAttr = forcedState !== "default" ? forcedState : undefined;

  return (
    <div className="relative">
      {isWorking && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-xs">
          <DitherSkeleton
            width="100%"
            height="100%"
            bgColor="#0F0E0C"
            color="#FEF8E2"
            opacity={0.15}
            speed={2000}
            algorithm="bayer4x4"
            pixelScale={3}
          />
        </div>
      )}

      <div
        className="flex w-[22rem] flex-col rounded-xs border border-[rgba(254,248,226,0.15)] bg-[#0F0E0C]"
        style={{
          boxShadow: isWorking
            ? "0 0 0 1px rgba(252,225,132,0.12), 0 0 24px rgba(252,225,132,0.15)"
            : "0 0 0 1px rgba(252,225,132,0.06), 0 0 12px rgba(252,225,132,0.08)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(254,248,226,0.15)] px-3 py-2">
          <span className="font-mono text-xs uppercase tracking-tight text-[#FEF8E2]">
            {entry.label}
          </span>
          {violations && <ViolationBadge violations={violations} compact />}
        </div>

        {/* Sub-cards */}
        <div className="flex flex-col gap-2 p-2" data-force-state={stateAttr}>
          {/* Default render */}
          {Component && (
            <div className="rounded-sm border border-edge-primary bg-surface-primary">
              <div className="flex items-center border-b border-edge-primary px-2 py-1">
                <span className="font-mono text-xs text-content-muted">default</span>
              </div>
              <div className="flex min-h-32 items-center justify-center p-3">
                <Suspense fallback={<div className="text-xs text-content-muted">Loading...</div>}>
                  <Component {...props} />
                </Suspense>
              </div>
            </div>
          )}

          {/* Curated variants */}
          {hasVariants &&
            entry.variants!.map((v) => (
              <div key={v.label} className="rounded-sm border border-edge-primary bg-surface-primary">
                <div className="flex items-center border-b border-edge-primary px-2 py-1">
                  <span className="font-mono text-xs text-content-muted">{v.label}</span>
                </div>
                <div className="flex min-h-24 items-center justify-center p-3">
                  <Suspense fallback={<span className="text-xs text-content-muted">...</span>}>
                    {rawComponent && (() => { const V = rawComponent; return <V {...v.props} />; })()}
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
      </div>
    </div>
  );
}

export const ComponentCard = memo(ComponentCardInner);
