"use client";

import { memo, Suspense } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { PlaygroundNode } from "../types";
import { registry } from "../registry";
import { getViolationsForComponent } from "../lib/violations";
import { ViolationBadge } from "../components/ViolationBadge";

function ComponentNodeInner({ data }: NodeProps<PlaygroundNode>) {
  const entry = registry.find((e) => e.id === data.registryId);

  if (!entry) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-status-error bg-surface-primary p-4 text-sm text-status-error">
        Unknown component: {data.registryId}
      </div>
    );
  }

  const { Component } = entry;
  const props = { ...entry.defaultProps, ...data.props };
  const violations = getViolationsForComponent(entry.sourcePath);

  return (
    <div className="group relative flex flex-col rounded-md border border-edge-primary bg-surface-primary shadow-resting">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-edge-primary px-3 py-2">
        <span className="font-heading text-xs uppercase tracking-tight text-content-secondary">
          {data.label}
        </span>
        <div className="flex items-center gap-1.5">
          {violations && <ViolationBadge violations={violations} compact />}
          <span className="rounded-sm bg-surface-secondary px-1.5 py-0.5 font-mono text-xs text-content-muted">
            {data.source}
          </span>
        </div>
      </div>

      {/* Preview */}
      <div className="flex min-h-[200px] items-center justify-center p-4">
        {Component ? (
          <Suspense
            fallback={
              <div className="text-sm text-content-muted">Loading…</div>
            }
          >
            <Component {...props} />
          </Suspense>
        ) : (
          <div className="text-sm text-content-muted">No renderable demo</div>
        )}
      </div>

      {/* Handles for edges */}
      <Handle type="target" position={Position.Left} className="!bg-edge-primary" />
      <Handle type="source" position={Position.Right} className="!bg-edge-primary" />
    </div>
  );
}

export const ComponentNode = memo(ComponentNodeInner);
