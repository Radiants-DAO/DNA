import type { StateCreator } from "zustand";
import type { AppState, UiSlice, EditorMode } from "../types";

const DEFAULT_SIDEBAR_WIDTH = 280;

export const createUiSlice: StateCreator<
  AppState,
  [],
  [],
  UiSlice
> = (set) => ({
  editorMode: "normal",
  previewMode: false,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  sidebarCollapsed: false,

  setEditorMode: (mode: EditorMode) => {
    set({ editorMode: mode });
    // Sync with specific mode flags
    switch (mode) {
      case "normal":
        set({ componentIdMode: false, textEditMode: false, previewMode: false });
        break;
      case "component-id":
        set({ componentIdMode: true, textEditMode: false, previewMode: false });
        break;
      case "text-edit":
        set({ componentIdMode: false, textEditMode: true, previewMode: false });
        break;
      case "preview":
        set({ componentIdMode: false, textEditMode: false, previewMode: true });
        break;
    }
  },

  setPreviewMode: (enabled) => {
    set({ previewMode: enabled });
    if (enabled) {
      set({ componentIdMode: false, textEditMode: false, editorMode: "preview" });
    }
  },

  setSidebarWidth: (width) =>
    set({ sidebarWidth: Math.max(200, Math.min(400, width)) }),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
});
