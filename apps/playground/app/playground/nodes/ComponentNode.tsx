"use client";

import { memo, Suspense } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { PlaygroundNode } from "../types";
import { registryById } from "../registry";
import { getViolationsForComponent } from "../lib/violations";
import { ViolationBadge } from "../components/ViolationBadge";
import { useForcedState } from "../ForcedStateContext";
import { VariantRow } from "./VariantRow";

function ComponentNodeInner({ data }: NodeProps<PlaygroundNode>) {
  const entry = registryById.get(data.registryId);
  const forcedState = useForcedState();

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
  const hasVariants = entry.variants && entry.variants.length > 0 && entry.rawComponent;
  const stateAttr = forcedState !== "default" ? forcedState : undefined;

  return (
    <div
      className="relative flex w-max min-w-[20rem] flex-col rounded-md border border-edge-primary bg-surface-primary shadow-resting"
      data-force-state={stateAttr}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-edge-primary px-3 py-2">
        <span className="font-heading text-xs uppercase tracking-tight text-content-secondary">
          {data.label}
        </span>
        {violations && <ViolationBadge violations={violations} compact />}
      </div>

      {/* Preview */}
      <div className="flex min-h-48 items-center justify-center p-4">
        {Component ? (
          <Suspense
            fallback={
              <div className="text-sm text-content-muted">Loading...</div>
            }
          >
            <Component {...props} />
          </Suspense>
        ) : (
          <div className="text-sm text-content-muted">No renderable demo</div>
        )}
      </div>

      {/* Variant row — only for inline components with curated variants */}
      {hasVariants && (
        <VariantRow
          variants={entry.variants!}
          component={entry.rawComponent!}
        />
      )}

      {/* Handles for edges */}
      <Handle type="target" position={Position.Left} className="!bg-edge-primary" />
      <Handle type="source" position={Position.Right} className="!bg-edge-primary" />
    </div>
  );
}

export const ComponentNode = memo(ComponentNodeInner);
