import type { StateCreator } from "zustand";
import type { AppState, BridgeSlice, BridgeConnectionStatus, BridgeSelection, RadflowId, SerializedComponentEntry, SourceLocation } from "../types";

/**
 * Bridge Slice
 *
 * Manages connection state and communication with the RadFlow bridge
 * running in the target project's iframe.
 *
 * Implementation: fn-5.3
 */
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

  // Actions
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
    });
  },

  incrementReconnectAttempts: () => {
    set((state) => ({
      reconnectAttempts: state.reconnectAttempts + 1,
    }));
  },

  updateBridgeComponentMap: (entries) => {
    // Build lookup map for fast access
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
});
