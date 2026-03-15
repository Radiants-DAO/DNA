import type { Node, Edge } from "@xyflow/react";
import type { ComponentType } from "react";
import type { VariantDemo } from "@rdna/radiants/registry";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export interface RegistryEntry {
  id: string;
  label: string;
  group: string;
  /** Package this component belongs to (e.g. "@rdna/radiants") */
  packageName: string;
  /** The renderable component — null for metadata-only entries (no shared registry) */
  Component: ComponentType<Record<string, unknown>> | null;
  /** The raw component for rendering individual variant props (inline mode only) */
  rawComponent: ComponentType<Record<string, unknown>> | null;
  /** How the registry renders this component */
  renderMode: "inline" | "custom";
  /** Curated variants with label + props */
  variants?: VariantDemo[];
  defaultProps: Record<string, unknown>;
  sourcePath: string;
  schemaPath?: string;
  propsInterface?: string;
  /** Token bindings from dna.json, if available */
  tokenBindings?: Record<string, Record<string, string>> | null;
}

// ---------------------------------------------------------------------------
// Forced pseudo-states for design inspection
// ---------------------------------------------------------------------------

export type ForcedState = "default" | "hover" | "active" | "focus" | "disabled";

/** Type guard: entry has a renderable Component */
export function isRenderable(
  entry: RegistryEntry,
): entry is RegistryEntry & { Component: ComponentType<Record<string, unknown>> } {
  return entry.Component !== null;
}

// ---------------------------------------------------------------------------
// Violations
// ---------------------------------------------------------------------------

export type ViolationSeverity = "error" | "warn";

// ---------------------------------------------------------------------------
// Canvas nodes
// ---------------------------------------------------------------------------

export type ComponentNodeData = {
  registryId: string;
  label: string;
  props: Record<string, unknown>;
};

export type PlaygroundNode = Node<ComponentNodeData, "component">;
export type PlaygroundEdge = Edge;

// ---------------------------------------------------------------------------
// Iteration metadata (returned by the generate status API)
// ---------------------------------------------------------------------------

export interface IterationFile {
  fileName: string;
  componentId: string;
}

// ---------------------------------------------------------------------------
// Canvas persistence
// ---------------------------------------------------------------------------

export interface CanvasState {
  nodes: PlaygroundNode[];
  edges: PlaygroundEdge[];
  counter: number;
}
