import type { StateCreator } from "zustand";
import type { AppState, ComponentIdSlice } from "../types";
import type { ComponentInfo } from "../../bindings";

export const createComponentIdSlice: StateCreator<
  AppState,
  [],
  [],
  ComponentIdSlice
> = (set, get) => ({
  componentIdMode: false,
  selectedComponents: [],
  hoveredComponent: null,

  setComponentIdMode: (active) => {
    set({ componentIdMode: active });
    // Exit other modes when entering component ID mode
    if (active) {
      set({ textEditMode: false, previewMode: false, editorMode: "component-id" });
    } else {
      // Clear selection when exiting mode
      set({ selectedComponents: [], hoveredComponent: null });
    }
  },

  selectComponent: (component) => {
    // Single selection mode - replace existing selection
    set({ selectedComponents: [component] });
  },

  deselectComponent: (component) => {
    const { selectedComponents } = get();
    set({
      selectedComponents: selectedComponents.filter(
        (c) => !(c.file === component.file && c.line === component.line)
      ),
    });
  },

  clearSelection: () => set({ selectedComponents: [] }),

  setHoveredComponent: (component) => set({ hoveredComponent: component }),

  copySelectionToClipboard: async () => {
    const { selectedComponents } = get();
    if (selectedComponents.length === 0) return;

    // Format: ComponentName @ file.tsx:line
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
});
