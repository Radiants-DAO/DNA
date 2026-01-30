/**
 * Component Canvas Types
 *
 * Types for the Component Canvas feature which displays component schemas
 * and DNA configs in a spatial canvas view.
 *
 * fn-5-component-canvas
 */

// ============================================================================
// Schema Types (matching Rust backend)
// ============================================================================

/**
 * Component prop definition from schema.json
 */
export interface PropDefinition {
  /** TypeScript type string (e.g., "string", "boolean", "'primary' | 'secondary'") */
  type: string;
  /** Enum values if type is union of literals */
  values?: string[];
  /** Default value */
  default?: unknown;
  /** Description of the prop */
  description?: string;
}

/**
 * Component slot definition from schema.json
 */
export interface SlotDefinition {
  /** Description of what the slot accepts */
  description?: string;
}

/**
 * Example usage from schema.json
 */
export interface SchemaExample {
  /** Name of the example (e.g., "Primary Button", "Disabled State") */
  name: string;
  /** JSX code string */
  code: string;
}

/**
 * Component schema from *.schema.json files
 *
 * Defines the interface for AI-assisted development workflows.
 * Follows the DNA spec Section 7.
 */
export interface ComponentSchema {
  /** Component name (e.g., "Button", "Card") */
  name: string;
  /** Human-readable description */
  description: string;
  /** Path to the schema file */
  filePath: string;
  /** Prop definitions */
  props: Record<string, PropDefinition>;
  /** Slot definitions (can be array of names or object with descriptions) */
  slots: Record<string, SlotDefinition> | string[];
  /** Usage examples */
  examples: SchemaExample[];
  /** Subcomponents if this is a compound component */
  subcomponents?: string[];
}

/**
 * DNA config from *.dna.json files
 *
 * Defines token bindings per variant for a component.
 * Follows the DNA spec Section 7.
 */
export interface DnaConfig {
  /** Component name this config applies to */
  component: string;
  /** Path to the DNA config file */
  filePath: string;
  /** Token bindings per variant: variant -> cssProperty -> tokenValue */
  tokenBindings: Record<string, Record<string, string>>;
  /** State-based overrides: state -> cssProperty -> tokenValue */
  states?: Record<string, Record<string, string>>;
}

// ============================================================================
// Canvas Node Types
// ============================================================================

/**
 * A component rendered on the canvas
 */
export interface ComponentCanvasNode {
  /** Unique identifier */
  id: string;
  /** The component schema */
  schema: ComponentSchema;
  /** Associated DNA config (optional, component may not have DNA bindings) */
  dna?: DnaConfig;
  /** X position on canvas */
  x: number;
  /** Y position on canvas */
  y: number;
  /** Node width */
  width: number;
  /** Node height */
  height: number;
}

/**
 * Bounding box for the entire component canvas
 */
export interface ComponentCanvasBounds {
  /** Total width of all content */
  width: number;
  /** Total height of all content */
  height: number;
  /** Minimum X coordinate (leftmost node edge) */
  minX: number;
  /** Minimum Y coordinate (topmost node edge) */
  minY: number;
}

// ============================================================================
// Layout Configuration
// ============================================================================

/**
 * Configuration for component canvas layout algorithm
 */
export interface ComponentCanvasLayoutConfig {
  /** Horizontal gap between nodes */
  horizontalGap: number;
  /** Vertical gap between nodes */
  verticalGap: number;
  /** Default node width */
  nodeWidth: number;
  /** Default node height */
  nodeHeight: number;
  /** Initial offset from canvas origin (x) */
  rootOffsetX: number;
  /** Initial offset from canvas origin (y) */
  rootOffsetY: number;
  /** Maximum nodes per row before wrapping */
  maxNodesPerRow: number;
}

/**
 * Default layout configuration
 */
export const DEFAULT_COMPONENT_CANVAS_LAYOUT: ComponentCanvasLayoutConfig = {
  horizontalGap: 32,
  verticalGap: 24,
  nodeWidth: 280,
  nodeHeight: 200,
  rootOffsetX: 48,
  rootOffsetY: 48,
  maxNodesPerRow: 4,
};

// ============================================================================
// Scan Result Types (from Rust backend)
// ============================================================================

/**
 * Result of scanning a theme directory for schemas
 */
export interface SchemaScanResult {
  /** Found component schemas */
  schemas: ComponentSchema[];
  /** Found DNA configs */
  dnaConfigs: DnaConfig[];
  /** Scan duration in milliseconds */
  scanTimeMs: number;
  /** Any errors encountered during scan */
  errors?: string[];
}

// ============================================================================
// Connection Types (Phase 2 - Relationship Lines)
// ============================================================================

/** Type of relationship between two component nodes */
export type ConnectionType = "composition" | "tokenShare" | "variant";

/** A connection between two component canvas nodes */
export interface ComponentConnection {
  /** Unique ID: `${type}-${sourceId}-${targetId}` */
  id: string;
  /** Source node ID */
  sourceId: string;
  /** Target node ID */
  targetId: string;
  /** Relationship type */
  type: ConnectionType;
  /** Shared token name (for tokenShare type) or variant name */
  label?: string;
}

/** Color mapping for connection types */
export const CONNECTION_COLORS: Record<ConnectionType, string> = {
  composition: "#3b82f6", // blue
  tokenShare: "#22c55e",  // green
  variant: "#f59e0b",     // amber
};

// ============================================================================
// Preview Types (Phase 2 - Live Preview)
// ============================================================================

/** Preview state for a component node */
export interface NodePreviewState {
  /** Whether preview is enabled for this node */
  enabled: boolean;
  /** Whether the iframe has loaded */
  loaded: boolean;
  /** Reported dimensions from the rendered component */
  dimensions?: { width: number; height: number };
}

// ============================================================================
// Page Preview Node (Phase 2 - Canvas Page Preview)
// ============================================================================

/**
 * A special canvas node that shows the full page preview.
 * Displayed as a larger card alongside component nodes.
 */
export interface PagePreviewConfig {
  /** Whether the page preview card is shown on the canvas */
  enabled: boolean;
  /** URL to display in the page preview iframe */
  url: string | null;
  /** Position on canvas */
  x: number;
  y: number;
  /** Dimensions (larger than component nodes) */
  width: number;
  height: number;
}

export const DEFAULT_PAGE_PREVIEW: PagePreviewConfig = {
  enabled: false,
  url: null,
  x: 48,
  y: 48,
  width: 480,
  height: 360,
};
