import type { Node, Edge } from "@xyflow/react";
import type { ComponentType } from "react";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export interface RegistryEntry {
  id: string;
  label: string;
  group: string;
  Component: ComponentType<Record<string, unknown>>;
  defaultProps: Record<string, unknown>;
  sourcePath: string;
  schemaPath?: string;
  propsInterface?: string;
}

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
