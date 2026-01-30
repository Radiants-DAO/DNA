import { StateCreator } from "zustand";
import type { AppState } from "../types";
import type {
  ComponentSchema,
  DnaConfig,
  ComponentCanvasNode,
  ComponentConnection,
  ConnectionType,
  NodePreviewState,
  PagePreviewConfig,
} from "../../types/componentCanvas";

/**
 * Component Canvas Slice
 *
 * Manages state for the Component Canvas feature which displays
 * component schemas and DNA configs in a spatial canvas view.
 *
 * fn-5-component-canvas
 */
export interface ComponentCanvasSlice {
  // ============================================================================
  // State
  // ============================================================================

  /** Whether the component canvas view is active */
  componentCanvasActive: boolean;

  /** Loaded component schemas from theme */
  componentSchemas: ComponentSchema[];

  /** Loaded DNA configs from theme */
  dnaConfigs: DnaConfig[];

  /** Nodes rendered on the canvas (computed from schemas + dna) */
  componentCanvasNodes: ComponentCanvasNode[];

  /** Currently selected node IDs */
  componentCanvasSelectedIds: Set<string>;

  /** Currently focused node ID (for keyboard navigation) */
  componentCanvasFocusedId: string | null;

  /** Path to the theme being visualized */
  componentCanvasThemePath: string | null;

  /** Current pan offset */
  componentCanvasPan: { x: number; y: number };

  /** Current zoom level (1 = 100%) */
  componentCanvasZoom: number;

  /** Whether a scan is in progress */
  componentCanvasLoading: boolean;

  /** Error message from last operation */
  componentCanvasError: string | null;

  /** Computed connections between nodes */
  componentConnections: ComponentConnection[];

  /** Which connection types are visible */
  componentConnectionVisibility: Record<ConnectionType, boolean>;

  /** Node ID currently hovered (for highlighting connections) */
  componentCanvasHoveredId: string | null;

  /** Per-node preview state: nodeId -> PreviewState */
  componentNodePreviews: Map<string, NodePreviewState>;

  /** Whether a dev server is available for previews */
  componentPreviewServerUrl: string | null;

  /** Page preview card config */
  pagePreviewConfig: PagePreviewConfig;

  // ============================================================================
  // View Toggle Actions
  // ============================================================================

  /** Set whether component canvas is active */
  setComponentCanvasActive: (active: boolean) => void;

  /** Toggle component canvas view */
  toggleComponentCanvas: () => void;

  // ============================================================================
  // Theme/Scan Actions
  // ============================================================================

  /** Set the theme path to visualize */
  setComponentCanvasThemePath: (path: string | null) => void;

  /** Scan a theme directory for component schemas and DNA configs */
  scanComponentSchemas: (themePath: string) => Promise<void>;

  // ============================================================================
  // Selection Actions
  // ============================================================================

  /** Select a single node (clears previous selection) */
  selectComponentNode: (id: string) => void;

  /** Toggle node selection (Cmd/Ctrl+click) */
  toggleComponentNodeSelection: (id: string) => void;

  /** Add node to selection (Shift+click) */
  addComponentNodeToSelection: (id: string) => void;

  /** Clear all selection */
  clearComponentCanvasSelection: () => void;

  /** Select all nodes */
  selectAllComponentNodes: () => void;

  /** Set focused node for keyboard navigation */
  setComponentCanvasFocusedId: (id: string | null) => void;

  // ============================================================================
  // Viewport Actions
  // ============================================================================

  /** Set pan offset */
  setComponentCanvasPan: (pan: { x: number; y: number }) => void;

  /** Update pan offset by delta */
  updateComponentCanvasPan: (delta: { x: number; y: number }) => void;

  /** Set zoom level */
  setComponentCanvasZoom: (zoom: number) => void;

  /** Reset viewport to default */
  resetComponentCanvasViewport: () => void;

  /** Pan to center a specific node */
  panToComponentNode: (id: string) => void;

  // ============================================================================
  // Layout Actions
  // ============================================================================

  /** Recalculate node positions based on current schemas */
  layoutComponentNodes: () => void;

  /** Set hovered node ID */
  setComponentCanvasHoveredId: (id: string | null) => void;

  /** Toggle connection type visibility */
  toggleConnectionVisibility: (type: ConnectionType) => void;

  /** Recompute connections from current schemas + dna configs */
  computeConnections: () => void;

  // ============================================================================
  // Preview Actions
  // ============================================================================

  /** Toggle preview for a node */
  toggleNodePreview: (nodeId: string) => void;

  /** Set preview loaded state */
  setNodePreviewLoaded: (nodeId: string, loaded: boolean) => void;

  /** Set preview dimensions */
  setNodePreviewDimensions: (nodeId: string, dimensions: { width: number; height: number }) => void;

  /** Set preview server URL */
  setComponentPreviewServerUrl: (url: string | null) => void;

  /** Toggle page preview card */
  togglePagePreview: () => void;

  /** Set page preview URL */
  setPagePreviewUrl: (url: string | null) => void;

  // ============================================================================
  // Getters
  // ============================================================================

  /** Get a node by ID */
  getComponentCanvasNode: (id: string) => ComponentCanvasNode | null;

  /** Get selected nodes */
  getSelectedComponentNodes: () => ComponentCanvasNode[];

  /** Get DNA config for a schema by component name */
  getDnaConfigForSchema: (componentName: string) => DnaConfig | null;
}

/**
 * Default layout configuration
 */
const DEFAULT_LAYOUT = {
  horizontalGap: 32,
  verticalGap: 24,
  nodeWidth: 280,
  nodeHeight: 200,
  rootOffsetX: 48,
  rootOffsetY: 48,
  maxNodesPerRow: 4,
};

/**
 * Calculate grid layout for nodes
 */
function calculateGridLayout(
  schemas: ComponentSchema[],
  dnaConfigs: DnaConfig[]
): ComponentCanvasNode[] {
  const nodes: ComponentCanvasNode[] = [];
  const dnaMap = new Map(dnaConfigs.map((d) => [d.component, d]));

  schemas.forEach((schema, index) => {
    const row = Math.floor(index / DEFAULT_LAYOUT.maxNodesPerRow);
    const col = index % DEFAULT_LAYOUT.maxNodesPerRow;

    const x =
      DEFAULT_LAYOUT.rootOffsetX +
      col * (DEFAULT_LAYOUT.nodeWidth + DEFAULT_LAYOUT.horizontalGap);
    const y =
      DEFAULT_LAYOUT.rootOffsetY +
      row * (DEFAULT_LAYOUT.nodeHeight + DEFAULT_LAYOUT.verticalGap);

    nodes.push({
      id: `component-${schema.name}`,
      schema,
      dna: dnaMap.get(schema.name),
      x,
      y,
      width: DEFAULT_LAYOUT.nodeWidth,
      height: DEFAULT_LAYOUT.nodeHeight,
    });
  });

  return nodes;
}

export const createComponentCanvasSlice: StateCreator<
  AppState,
  [],
  [],
  ComponentCanvasSlice
> = (set, get) => ({
  // ============================================================================
  // Initial State
  // ============================================================================

  componentCanvasActive: false,
  componentSchemas: [],
  dnaConfigs: [],
  componentCanvasNodes: [],
  componentCanvasSelectedIds: new Set<string>(),
  componentCanvasFocusedId: null,
  componentCanvasThemePath: null,
  componentCanvasPan: { x: 0, y: 0 },
  componentCanvasZoom: 1,
  componentCanvasLoading: false,
  componentCanvasError: null,
  componentConnections: [],
  componentConnectionVisibility: { composition: true, tokenShare: true, variant: true },
  componentCanvasHoveredId: null,
  componentNodePreviews: new Map(),
  componentPreviewServerUrl: null,
  pagePreviewConfig: { enabled: false, url: null, x: 48, y: 48, width: 480, height: 360 },

  // ============================================================================
  // View Toggle Actions
  // ============================================================================

  setComponentCanvasActive: (active) => set({ componentCanvasActive: active }),

  toggleComponentCanvas: () =>
    set((state) => ({ componentCanvasActive: !state.componentCanvasActive })),

  // ============================================================================
  // Theme/Scan Actions
  // ============================================================================

  setComponentCanvasThemePath: (path) =>
    set({ componentCanvasThemePath: path }),

  scanComponentSchemas: async (themePath) => {
    set({
      componentCanvasLoading: true,
      componentCanvasError: null,
      componentCanvasThemePath: themePath,
    });

    try {
      // Import Tauri invoke
      const { invoke } = await import("@tauri-apps/api/core");

      // Type for raw schema from Rust (uses JSON strings for specta compatibility)
      interface RawSchema {
        name: string;
        description: string;
        filePath: string;
        propsJson: string;
        slotsJson: string;
        examples: Array<{ name: string; code: string }>;
        subcomponents: string[] | null;
      }

      // Type for raw DNA config from Rust
      interface RawDnaConfig {
        component: string;
        description: string | null;
        filePath: string;
        tokenBindingsJson: string;
        statesJson: string | null;
      }

      // Type for scan result from Rust
      interface ScanResult {
        schemas: RawSchema[];
        dnaConfigs: RawDnaConfig[];
        totalSchemas: number;
        totalDnaConfigs: number;
        scanTimeMs: number;
      }

      // Call Rust backend to scan for schemas
      const result = await invoke<ScanResult>("scan_schemas", { path: themePath });

      const rawSchemas = result.schemas || [];
      const rawDnaConfigs = result.dnaConfigs || [];

      // Parse JSON strings from Rust backend and transform to TypeScript types
      // Wrap JSON.parse in try/catch with sensible defaults and error logging
      const schemas: ComponentSchema[] = rawSchemas.map((s) => {
        let props: Record<string, unknown> = {};
        let slots: Record<string, unknown> = {};

        try {
          props = JSON.parse(s.propsJson || "{}");
        } catch (e) {
          console.error(
            `Failed to parse props JSON for schema "${s.name}":`,
            e
          );
        }

        try {
          slots = JSON.parse(s.slotsJson || "{}");
        } catch (e) {
          console.error(
            `Failed to parse slots JSON for schema "${s.name}":`,
            e
          );
        }

        return {
          name: s.name,
          description: s.description,
          filePath: s.filePath,
          props,
          slots,
          examples: s.examples,
          subcomponents: s.subcomponents ?? undefined,
        };
      });

      const dnaConfigs: DnaConfig[] = rawDnaConfigs.map((d) => {
        let tokenBindings: Record<string, unknown> = {};
        let states: Record<string, unknown> | undefined = undefined;

        try {
          tokenBindings = JSON.parse(d.tokenBindingsJson || "{}");
        } catch (e) {
          console.error(
            `Failed to parse tokenBindings JSON for DNA config "${d.component}":`,
            e
          );
        }

        if (d.statesJson) {
          try {
            states = JSON.parse(d.statesJson);
          } catch (e) {
            console.error(
              `Failed to parse states JSON for DNA config "${d.component}":`,
              e
            );
          }
        }

        return {
          component: d.component,
          filePath: d.filePath,
          tokenBindings,
          states,
        };
      });

      // Calculate node positions
      const nodes = calculateGridLayout(schemas, dnaConfigs);

      set({
        componentSchemas: schemas,
        dnaConfigs: dnaConfigs,
        componentCanvasNodes: nodes,
        componentCanvasLoading: false,
      });

      // Compute connections after scan completes
      get().computeConnections();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to scan schemas";
      set({
        componentCanvasLoading: false,
        componentCanvasError: message,
      });
    }
  },

  // ============================================================================
  // Selection Actions
  // ============================================================================

  selectComponentNode: (id) =>
    set({
      componentCanvasSelectedIds: new Set([id]),
      componentCanvasFocusedId: id,
    }),

  toggleComponentNodeSelection: (id) =>
    set((state) => {
      const newSelected = new Set(state.componentCanvasSelectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return {
        componentCanvasSelectedIds: newSelected,
        componentCanvasFocusedId: id,
      };
    }),

  addComponentNodeToSelection: (id) =>
    set((state) => {
      const newSelected = new Set(state.componentCanvasSelectedIds);
      newSelected.add(id);
      return {
        componentCanvasSelectedIds: newSelected,
        componentCanvasFocusedId: id,
      };
    }),

  clearComponentCanvasSelection: () =>
    set({ componentCanvasSelectedIds: new Set<string>() }),

  selectAllComponentNodes: () =>
    set((state) => ({
      componentCanvasSelectedIds: new Set(
        state.componentCanvasNodes.map((n) => n.id)
      ),
    })),

  setComponentCanvasFocusedId: (id) => set({ componentCanvasFocusedId: id }),

  // ============================================================================
  // Viewport Actions
  // ============================================================================

  setComponentCanvasPan: (pan) => set({ componentCanvasPan: pan }),

  updateComponentCanvasPan: (delta) =>
    set((state) => ({
      componentCanvasPan: {
        x: state.componentCanvasPan.x + delta.x,
        y: state.componentCanvasPan.y + delta.y,
      },
    })),

  setComponentCanvasZoom: (zoom) =>
    set({ componentCanvasZoom: Math.max(0.25, Math.min(2, zoom)) }),

  resetComponentCanvasViewport: () =>
    set({
      componentCanvasPan: { x: 0, y: 0 },
      componentCanvasZoom: 1,
    }),

  panToComponentNode: (id) => {
    const state = get();
    const node = state.componentCanvasNodes.find((n) => n.id === id);
    if (!node) return;

    // Calculate viewport center offset
    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth : 1200;
    const viewportHeight =
      typeof window !== "undefined" ? window.innerHeight : 800;

    set({
      componentCanvasPan: {
        x: -(node.x - viewportWidth / 2 + node.width / 2),
        y: -(node.y - viewportHeight / 2 + node.height / 2),
      },
    });
  },

  // ============================================================================
  // Layout Actions
  // ============================================================================

  layoutComponentNodes: () => {
    const state = get();
    const nodes = calculateGridLayout(state.componentSchemas, state.dnaConfigs);
    set({ componentCanvasNodes: nodes });
  },

  setComponentCanvasHoveredId: (id) => set({ componentCanvasHoveredId: id }),

  toggleConnectionVisibility: (type) =>
    set((state) => ({
      componentConnectionVisibility: {
        ...state.componentConnectionVisibility,
        [type]: !state.componentConnectionVisibility[type],
      },
    })),

  computeConnections: () => {
    const state = get();
    const connections: ComponentConnection[] = [];
    const nodeMap = new Map(state.componentCanvasNodes.map((n) => [n.schema.name, n]));

    // 1. Composition connections (from schema.subcomponents)
    for (const node of state.componentCanvasNodes) {
      if (node.schema.subcomponents) {
        for (const sub of node.schema.subcomponents) {
          const target = nodeMap.get(sub);
          if (target) {
            connections.push({
              id: `composition-${node.id}-${target.id}`,
              sourceId: node.id,
              targetId: target.id,
              type: "composition",
            });
          }
        }
      }
    }

    // 2. Token share connections (from dna.tokenBindings)
    const tokenToComponents = new Map<string, Set<string>>();
    for (const node of state.componentCanvasNodes) {
      if (!node.dna) continue;
      for (const variant of Object.values(node.dna.tokenBindings)) {
        for (const tokenValue of Object.values(variant)) {
          if (!tokenToComponents.has(tokenValue)) {
            tokenToComponents.set(tokenValue, new Set());
          }
          tokenToComponents.get(tokenValue)!.add(node.id);
        }
      }
    }

    for (const [token, componentIds] of tokenToComponents) {
      const ids = Array.from(componentIds);
      if (ids.length < 2) continue;
      for (let i = 1; i < ids.length; i++) {
        const connId = `tokenShare-${ids[0]}-${ids[i]}`;
        if (!connections.find((c) => c.id === connId)) {
          connections.push({
            id: connId,
            sourceId: ids[0],
            targetId: ids[i],
            type: "tokenShare",
            label: token,
          });
        }
      }
    }

    // 3. Variant connections (same variant names across components)
    const variantToComponents = new Map<string, Set<string>>();
    for (const node of state.componentCanvasNodes) {
      if (!node.dna) continue;
      for (const variantName of Object.keys(node.dna.tokenBindings)) {
        if (!variantToComponents.has(variantName)) {
          variantToComponents.set(variantName, new Set());
        }
        variantToComponents.get(variantName)!.add(node.id);
      }
    }

    for (const [variant, componentIds] of variantToComponents) {
      const ids = Array.from(componentIds);
      if (ids.length < 2) continue;
      for (let i = 1; i < ids.length; i++) {
        const connId = `variant-${ids[0]}-${ids[i]}`;
        if (!connections.find((c) => c.id === connId)) {
          connections.push({
            id: connId,
            sourceId: ids[0],
            targetId: ids[i],
            type: "variant",
            label: variant,
          });
        }
      }
    }

    set({ componentConnections: connections });
  },

  // ============================================================================
  // Preview Actions
  // ============================================================================

  toggleNodePreview: (nodeId) =>
    set((state) => {
      const previews = new Map(state.componentNodePreviews);
      const existing = previews.get(nodeId);
      if (existing?.enabled) {
        previews.delete(nodeId);
      } else {
        previews.set(nodeId, { enabled: true, loaded: false });
      }
      return { componentNodePreviews: previews };
    }),

  setNodePreviewLoaded: (nodeId, loaded) =>
    set((state) => {
      const previews = new Map(state.componentNodePreviews);
      const existing = previews.get(nodeId);
      if (existing) {
        previews.set(nodeId, { ...existing, loaded });
      }
      return { componentNodePreviews: previews };
    }),

  setNodePreviewDimensions: (nodeId, dimensions) =>
    set((state) => {
      const previews = new Map(state.componentNodePreviews);
      const existing = previews.get(nodeId);
      if (existing) {
        previews.set(nodeId, { ...existing, dimensions });
      }
      return { componentNodePreviews: previews };
    }),

  setComponentPreviewServerUrl: (url) => set({ componentPreviewServerUrl: url }),

  togglePagePreview: () =>
    set((state) => ({
      pagePreviewConfig: {
        ...state.pagePreviewConfig,
        enabled: !state.pagePreviewConfig.enabled,
      },
    })),

  setPagePreviewUrl: (url) =>
    set((state) => ({
      pagePreviewConfig: {
        ...state.pagePreviewConfig,
        url,
        enabled: url ? true : state.pagePreviewConfig.enabled,
      },
    })),

  // ============================================================================
  // Getters
  // ============================================================================

  getComponentCanvasNode: (id) => {
    return get().componentCanvasNodes.find((n) => n.id === id) || null;
  },

  getSelectedComponentNodes: () => {
    const state = get();
    return state.componentCanvasNodes.filter((n) =>
      state.componentCanvasSelectedIds.has(n.id)
    );
  },

  getDnaConfigForSchema: (componentName) => {
    return get().dnaConfigs.find((d) => d.component === componentName) || null;
  },
});
