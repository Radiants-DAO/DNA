import type { StateCreator } from "zustand";
import type { AppState, RadflowId, SourceLocation, SerializedComponentEntry } from "../types";

/**
 * Selection state for the preview shell.
 *
 * This slice provides a higher-level API for working with selected
 * components, building on top of the bridge connection state.
 *
 * Implementation: fn-5.5
 */

export interface SelectionSlice {
  // Selected component (computed from bridgeSelection)
  selectedEntry: SerializedComponentEntry | null;

  // Multi-selection support (future use)
  multiSelectEnabled: boolean;
  selectedIds: Set<RadflowId>;

  // Actions
  selectById: (radflowId: RadflowId) => void;
  addToMultiSelect: (radflowId: RadflowId) => void;
  removeFromMultiSelect: (radflowId: RadflowId) => void;
  toggleMultiSelect: (radflowId: RadflowId) => void;
  clearMultiSelect: () => void;
  setMultiSelectEnabled: (enabled: boolean) => void;

  // Computed getters
  getSelectedSource: () => SourceLocation | null;
  getSelectedFallbackSelectors: () => string[];
  isSelected: (radflowId: RadflowId) => boolean;
}

export const createSelectionSlice: StateCreator<
  AppState,
  [],
  [],
  SelectionSlice
> = (set, get) => ({
  // State
  selectedEntry: null,
  multiSelectEnabled: false,
  selectedIds: new Set(),

  // Actions
  selectById: (radflowId) => {
    const entry = get().bridgeComponentLookup.get(radflowId);
    if (entry) {
      const source = entry.source;
      const fallbackSelectors = entry.fallbackSelectors;
      set({
        selectedEntry: entry,
        bridgeSelection: { radflowId, source, fallbackSelectors },
      });
    }
  },

  addToMultiSelect: (radflowId) => {
    const currentIds = get().selectedIds;
    if (!currentIds.has(radflowId)) {
      const newIds = new Set(currentIds);
      newIds.add(radflowId);
      set({ selectedIds: newIds });
    }
  },

  removeFromMultiSelect: (radflowId) => {
    const currentIds = get().selectedIds;
    if (currentIds.has(radflowId)) {
      const newIds = new Set(currentIds);
      newIds.delete(radflowId);
      set({ selectedIds: newIds });
    }
  },

  toggleMultiSelect: (radflowId) => {
    const currentIds = get().selectedIds;
    const newIds = new Set(currentIds);
    if (newIds.has(radflowId)) {
      newIds.delete(radflowId);
    } else {
      newIds.add(radflowId);
    }
    set({ selectedIds: newIds });
  },

  clearMultiSelect: () => {
    set({ selectedIds: new Set() });
  },

  setMultiSelectEnabled: (enabled) => {
    set({
      multiSelectEnabled: enabled,
      // Clear multi-selection when disabling
      selectedIds: enabled ? get().selectedIds : new Set(),
    });
  },

  // Computed getters
  getSelectedSource: () => {
    const selection = get().bridgeSelection;
    return selection?.source ?? null;
  },

  getSelectedFallbackSelectors: () => {
    const selection = get().bridgeSelection;
    return selection?.fallbackSelectors ?? [];
  },

  isSelected: (radflowId) => {
    const state = get();
    if (state.multiSelectEnabled) {
      return state.selectedIds.has(radflowId);
    }
    return state.bridgeSelection?.radflowId === radflowId;
  },
});
