import type { Node, Edge } from "@xyflow/react";
import type { ComponentType } from "react";

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
  defaultProps: Record<string, unknown>;
  sourcePath: string;
  schemaPath?: string;
  propsInterface?: string;
  /** Token bindings from dna.json, if available */
  tokenBindings?: Record<string, Record<string, string>> | null;
}

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
  /** "baseline" source from workspace, or "candidate" generated variation */
  source: "baseline" | "candidate";
  /** Path to the iteration file when source === "candidate" */
  iterationPath?: string;
};

export type PlaygroundNode = Node<ComponentNodeData, "component">;
export type PlaygroundEdge = Edge;

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

export interface ComparisonPair {
  componentId: string;
  props: Record<string, unknown>;
  baselineLabel: string;
  candidateLabel: string;
  /** Resolved candidate component — null means no candidate available */
  CandidateComponent: ComponentType<Record<string, unknown>> | null;
  /** Iteration filename for the candidate (for violation lookup) */
  candidateFileName?: string;
}

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
