/**
 * Component Canvas Slice - Ported from Flow 0
 *
 * Manages state for the Component Canvas feature which displays
 * component schemas and DNA configs in a spatial canvas view.
 *
 * Schema scanning is stubbed for the extension context.
 */

import type { StateCreator } from "zustand";
import type {
  AppState,
  ComponentSchema,
  DnaConfig,
  ComponentCanvasNode,
  ComponentConnection,
  ConnectionType,
  NodePreviewState,
  PagePreviewConfig,
} from "../types";

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

export interface ComponentCanvasSlice {
  // State
  componentCanvasActive: boolean;
  componentSchemas: ComponentSchema[];
  dnaConfigs: DnaConfig[];
  componentCanvasNodes: ComponentCanvasNode[];
  componentCanvasSelectedIds: Set<string>;
  componentCanvasFocusedId: string | null;
  componentCanvasThemePath: string | null;
  componentCanvasPan: { x: number; y: number };
  componentCanvasZoom: number;
  componentCanvasLoading: boolean;
  componentCanvasError: string | null;
  componentConnections: ComponentConnection[];
  componentConnectionVisibility: Record<ConnectionType, boolean>;
  componentCanvasHoveredId: string | null;
  componentNodePreviews: Map<string, NodePreviewState>;
  componentPreviewServerUrl: string | null;
  pagePreviewConfig: PagePreviewConfig;

  // View Toggle Actions
  setComponentCanvasActive: (active: boolean) => void;
  toggleComponentCanvas: () => void;

  // Theme/Scan Actions
  setComponentCanvasThemePath: (path: string | null) => void;
  scanComponentSchemas: (themePath: string) => Promise<void>;

  // Extension-specific: set schemas directly
  setSchemasFromBridge: (schemas: ComponentSchema[], dnaConfigs: DnaConfig[]) => void;

  // Selection Actions
  selectComponentNode: (id: string) => void;
  toggleComponentNodeSelection: (id: string) => void;
  addComponentNodeToSelection: (id: string) => void;
  clearComponentCanvasSelection: () => void;
  selectAllComponentNodes: () => void;
  setComponentCanvasFocusedId: (id: string | null) => void;

  // Viewport Actions
  setComponentCanvasPan: (pan: { x: number; y: number }) => void;
  updateComponentCanvasPan: (delta: { x: number; y: number }) => void;
  setComponentCanvasZoom: (zoom: number) => void;
  resetComponentCanvasViewport: () => void;
  panToComponentNode: (id: string) => void;

  // Layout Actions
  layoutComponentNodes: () => void;
  setComponentCanvasHoveredId: (id: string | null) => void;
  toggleConnectionVisibility: (type: ConnectionType) => void;
  computeConnections: () => void;

  // Preview Actions
  toggleNodePreview: (nodeId: string) => void;
  setNodePreviewLoaded: (nodeId: string, loaded: boolean) => void;
  setNodePreviewDimensions: (nodeId: string, dimensions: { width: number; height: number }) => void;
  setComponentPreviewServerUrl: (url: string | null) => void;
  togglePagePreview: () => void;
  setPagePreviewUrl: (url: string | null) => void;

  // Getters
  getComponentCanvasNode: (id: string) => ComponentCanvasNode | null;
  getSelectedComponentNodes: () => ComponentCanvasNode[];
  getDnaConfigForSchema: (componentName: string) => DnaConfig | null;
}

export const createComponentCanvasSlice: StateCreator<
  AppState,
  [],
  [],
  ComponentCanvasSlice
> = (set, get) => ({
  // Initial State
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

  // View Toggle Actions
  setComponentCanvasActive: (active) => set({ componentCanvasActive: active }),

  toggleComponentCanvas: () =>
    set((state) => ({ componentCanvasActive: !state.componentCanvasActive })),

  // Theme/Scan Actions
  setComponentCanvasThemePath: (path) =>
    set({ componentCanvasThemePath: path }),

  // Stubbed for extension - use setSchemasFromBridge instead
  scanComponentSchemas: async (themePath) => {
    set({
      componentCanvasLoading: true,
      componentCanvasError: null,
      componentCanvasThemePath: themePath,
    });

    // In the extension context, schemas are loaded via content bridge
    set({
      componentCanvasLoading: false,
      componentCanvasError: "Direct schema scanning not supported in extension. Use setSchemasFromBridge instead.",
    });
  },

  // Extension-specific: set schemas directly
  setSchemasFromBridge: (schemas: ComponentSchema[], dnaConfigs: DnaConfig[]) => {
    const nodes = calculateGridLayout(schemas, dnaConfigs);

    set({
      componentSchemas: schemas,
      dnaConfigs,
      componentCanvasNodes: nodes,
      componentCanvasLoading: false,
      componentCanvasError: null,
    });

    // Compute connections after setting schemas
    get().computeConnections();
  },

  // Selection Actions
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

  // Viewport Actions
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

  // Layout Actions
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

  // Preview Actions
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

  // Getters
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
