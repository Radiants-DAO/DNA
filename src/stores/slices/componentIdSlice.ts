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
    }
  },

  selectComponent: (component) => {
    const { selectedComponents } = get();
    // Check if already selected by matching file + line
    const isSelected = selectedComponents.some(
      (c) => c.file === component.file && c.line === component.line
    );
    if (!isSelected) {
      set({ selectedComponents: [...selectedComponents, component] });
    }
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
      .map((c) => `${c.name} @ ${c.file}:${c.line}`)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  },
});
