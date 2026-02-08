/**
 * Bridge Slice - Ported from Flow 0
 *
 * Manages bridge connection + component ID mode.
 * Tauri bridge functionality is replaced with content bridge messaging stubs.
 */

import type { StateCreator } from "zustand";
import type {
  AppState,
  BridgeConnectionStatus,
  BridgeComment,
  BridgeSelection,
  RadflowId,
  SerializedComponentEntry,
  SelectionRect,
  ComponentInfo,
} from "../types";

export interface BridgeSlice {
  // Connection state
  bridgeStatus: BridgeConnectionStatus;
  bridgeVersion: string | null;
  bridgeError: string | null;
  lastPingAt: number | null;
  reconnectAttempts: number;

  // Component data from bridge
  bridgeComponentMap: SerializedComponentEntry[];
  bridgeComponentLookup: Map<RadflowId, SerializedComponentEntry>;

  // Selection/hover state
  bridgeSelection: BridgeSelection | null;
  bridgeHoveredId: RadflowId | null;

  // Bridge comment dispatch (set by content bridge when connected)
  bridgeSendComment: ((comment: BridgeComment) => boolean) | null;
  bridgeRemoveComment: ((commentId: string) => boolean) | null;
  bridgeClearComments: (() => boolean) | null;
  setBridgeCommentMethods: (methods: {
    sendComment: ((comment: BridgeComment) => boolean) | null;
    removeComment: ((commentId: string) => boolean) | null;
    clearComments: (() => boolean) | null;
  }) => void;

  // Bridge actions
  setBridgeStatus: (status: BridgeConnectionStatus) => void;
  setBridgeConnected: (version: string) => void;
  setBridgeError: (error: string) => void;
  setBridgeDisconnected: () => void;
  incrementReconnectAttempts: () => void;
  updateBridgeComponentMap: (entries: SerializedComponentEntry[]) => void;
  setBridgeSelection: (selection: BridgeSelection) => void;
  setBridgeHoveredId: (id: RadflowId | null) => void;
  clearBridgeSelection: () => void;
  getBridgeComponent: (id: RadflowId) => SerializedComponentEntry | null;

  // Component ID mode state
  selectedComponents: ComponentInfo[];
  hoveredComponent: ComponentInfo | null;
  selectionRect: SelectionRect | null;
  showViolationsOnly: boolean;

  // Component ID mode actions
  selectComponent: (component: ComponentInfo) => void;
  addToSelection: (component: ComponentInfo) => void;
  selectAllOfType: (componentName: string) => void;
  deselectComponent: (component: ComponentInfo) => void;
  clearSelection: () => void;
  setHoveredComponent: (component: ComponentInfo | null) => void;
  setSelectionRect: (rect: SelectionRect | null) => void;
  selectComponentsInRect: (rect: SelectionRect) => void;
  setShowViolationsOnly: (show: boolean) => void;
  copySelectionToClipboard: () => Promise<void>;
  copyAllOfTypeToClipboard: (componentName: string) => Promise<void>;
}

export const createBridgeSlice: StateCreator<
  AppState,
  [],
  [],
  BridgeSlice
> = (set, get) => ({
  // Connection state
  bridgeStatus: "disconnected",
  bridgeVersion: null,
  bridgeError: null,
  lastPingAt: null,
  reconnectAttempts: 0,

  // Component data from bridge
  bridgeComponentMap: [],
  bridgeComponentLookup: new Map(),

  // Selection/hover state
  bridgeSelection: null,
  bridgeHoveredId: null,

  // Bridge comment dispatch
  bridgeSendComment: null,
  bridgeRemoveComment: null,
  bridgeClearComments: null,

  setBridgeCommentMethods: ({ sendComment, removeComment, clearComments }) => {
    set({
      bridgeSendComment: sendComment,
      bridgeRemoveComment: removeComment,
      bridgeClearComments: clearComments,
    });
  },

  // Component ID mode state
  selectedComponents: [],
  hoveredComponent: null,
  selectionRect: null,
  showViolationsOnly: false,

  // Bridge actions
  setBridgeStatus: (status) => {
    set({ bridgeStatus: status });
  },

  setBridgeConnected: (version) => {
    set({
      bridgeStatus: "connected",
      bridgeVersion: version,
      bridgeError: null,
      lastPingAt: Date.now(),
      reconnectAttempts: 0,
    });
  },

  setBridgeError: (error) => {
    set({
      bridgeStatus: "error",
      bridgeError: error,
    });
  },

  setBridgeDisconnected: () => {
    set({
      bridgeStatus: "disconnected",
      bridgeVersion: null,
      bridgeError: null,
      bridgeComponentMap: [],
      bridgeComponentLookup: new Map(),
      bridgeSelection: null,
      bridgeHoveredId: null,
      bridgeSendComment: null,
      bridgeRemoveComment: null,
      bridgeClearComments: null,
    });
  },

  incrementReconnectAttempts: () => {
    set((state) => ({
      reconnectAttempts: state.reconnectAttempts + 1,
    }));
  },

  updateBridgeComponentMap: (entries) => {
    const lookup = new Map<RadflowId, SerializedComponentEntry>();
    for (const entry of entries) {
      lookup.set(entry.radflowId, entry);
    }

    set({
      bridgeComponentMap: entries,
      bridgeComponentLookup: lookup,
      lastPingAt: Date.now(),
    });
  },

  setBridgeSelection: (selection) => {
    set({ bridgeSelection: selection });
  },

  setBridgeHoveredId: (id) => {
    set({ bridgeHoveredId: id });
  },

  clearBridgeSelection: () => {
    set({ bridgeSelection: null });
  },

  getBridgeComponent: (id) => {
    return get().bridgeComponentLookup.get(id) ?? null;
  },

  // Component ID mode actions
  selectComponent: (component) => {
    set({ selectedComponents: [component] });
  },

  addToSelection: (component) => {
    const { selectedComponents } = get();
    const isAlreadySelected = selectedComponents.some(
      (c) => c.file === component.file && c.line === component.line
    );
    if (isAlreadySelected) {
      set({
        selectedComponents: selectedComponents.filter(
          (c) => !(c.file === component.file && c.line === component.line)
        ),
      });
    } else {
      set({ selectedComponents: [...selectedComponents, component] });
    }
  },

  selectAllOfType: (componentName) => {
    const { components } = get();
    const matchingComponents = components.filter((c) => c.name === componentName);
    set({ selectedComponents: matchingComponents });
  },

  deselectComponent: (component) => {
    const { selectedComponents } = get();
    set({
      selectedComponents: selectedComponents.filter(
        (c) => !(c.file === component.file && c.line === component.line)
      ),
    });
  },

  clearSelection: () => set({ selectedComponents: [], selectionRect: null }),

  setHoveredComponent: (component) => set({ hoveredComponent: component }),

  setSelectionRect: (rect) => set({ selectionRect: rect }),

  selectComponentsInRect: (_rect) => {
    // STUB: Rect-based selection not yet implemented
    // In a real implementation, this would:
    // 1. Get bounding boxes for all components
    // 2. Filter to components within the rect bounds
    // 3. Set those as selectedComponents
    console.warn("[selectComponentsInRect] Stub: rect-based selection not implemented");
    const { components } = get();
    // Fallback: select all components
    set({ selectedComponents: components, selectionRect: null });
  },

  setShowViolationsOnly: (show) => set({ showViolationsOnly: show }),

  copySelectionToClipboard: async () => {
    const { selectedComponents } = get();
    if (selectedComponents.length === 0) return;

    const text = selectedComponents
      .map((c) => {
        const fileName = c.file.split("/").pop() || c.file;
        return `${c.name} @ ${fileName}:${c.line}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  },

  copyAllOfTypeToClipboard: async (componentName) => {
    const { components } = get();
    const matchingComponents = components.filter((c) => c.name === componentName);
    if (matchingComponents.length === 0) return;

    const firstFile = matchingComponents[0].file;
    const routeMatch = firstFile.match(/app\/([^/]+)/);
    const route = routeMatch ? `/${routeMatch[1]}` : firstFile.split("/").slice(-2, -1)[0];

    const lines = matchingComponents.map((c) => c.line).join(", ");
    const fileName = firstFile.split("/").pop() || firstFile;
    const text = `ALL ${componentName} on ${route} (${matchingComponents.length} instances)\n-> ${fileName}:${lines}`;

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  },
});
