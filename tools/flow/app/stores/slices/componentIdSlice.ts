import type { StateCreator } from "zustand";
import type { AppState, ComponentIdSlice, SelectionRect } from "../types";
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
  selectionRect: null,
  showViolationsOnly: false,

  setComponentIdMode: (active) => {
    set({ componentIdMode: active });
    // Exit other modes when entering component ID mode
    if (active) {
      set({ textEditMode: false, previewMode: false, editorMode: "component-id" });
    } else {
      // Clear selection when exiting mode
      set({ selectedComponents: [], hoveredComponent: null, selectionRect: null });
    }
  },

  selectComponent: (component) => {
    // Single selection mode - replace existing selection
    set({ selectedComponents: [component] });
  },

  addToSelection: (component) => {
    const { selectedComponents } = get();
    // Check if already selected
    const isAlreadySelected = selectedComponents.some(
      (c) => c.file === component.file && c.line === component.line
    );
    if (isAlreadySelected) {
      // Toggle off if already selected
      set({
        selectedComponents: selectedComponents.filter(
          (c) => !(c.file === component.file && c.line === component.line)
        ),
      });
    } else {
      // Add to selection
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

  selectComponentsInRect: (rect) => {
    // This would need DOM element positions to work properly
    // For now, we'll implement the state management and UI will handle the actual selection
    const { components } = get();
    // In a real implementation, we'd query the DOM for elements within the rect
    // and match them to components. For now, this is a placeholder that
    // selects all components (the UI layer will handle the actual filtering)
    set({ selectedComponents: components, selectionRect: null });
  },

  setShowViolationsOnly: (show) => set({ showViolationsOnly: show }),

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

  copyAllOfTypeToClipboard: async (componentName) => {
    const { components } = get();
    const matchingComponents = components.filter((c) => c.name === componentName);
    if (matchingComponents.length === 0) return;

    // Get current page/route from the first component's file
    const firstFile = matchingComponents[0].file;
    const routeMatch = firstFile.match(/app\/([^/]+)/);
    const route = routeMatch ? `/${routeMatch[1]}` : firstFile.split("/").slice(-2, -1)[0];

    // Format: ALL ComponentName on /route (N instances)
    // → file.tsx:line1, line2, line3, ...
    const lines = matchingComponents.map((c) => c.line).join(", ");
    const fileName = firstFile.split("/").pop() || firstFile;
    const text = `ALL ${componentName} on ${route} (${matchingComponents.length} instances)\n→ ${fileName}:${lines}`;

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  },
});
