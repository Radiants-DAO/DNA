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
  devMode: false,
  dogfoodMode: false,

  setEditorMode: (mode: EditorMode) => {
    set({ editorMode: mode });

    // Sync with specific mode flags
    // For non-comment modes: clear activeFeedbackType and selection state
    // For comment mode: don't mutate activeFeedbackType (set separately via setActiveFeedbackType)
    switch (mode) {
      case "normal":
        set({
          componentIdMode: false,
          textEditMode: false,
          previewMode: false,
          activeFeedbackType: null,
          hoveredCommentElement: null,
          selectedCommentElements: [],
        });
        break;
      case "component-id":
        set({
          componentIdMode: true,
          textEditMode: false,
          previewMode: false,
          activeFeedbackType: null,
          hoveredCommentElement: null,
          selectedCommentElements: [],
        });
        break;
      case "text-edit":
        set({
          componentIdMode: false,
          textEditMode: true,
          previewMode: false,
          activeFeedbackType: null,
          hoveredCommentElement: null,
          selectedCommentElements: [],
        });
        break;
      case "preview":
        set({
          componentIdMode: false,
          textEditMode: false,
          previewMode: true,
          activeFeedbackType: null,
          hoveredCommentElement: null,
          selectedCommentElements: [],
        });
        break;
      case "comment":
        // activeFeedbackType should be set separately via setActiveFeedbackType
        // This case handles when editorMode is restored from persistence
        set({
          componentIdMode: false,
          textEditMode: false,
          previewMode: false,
        });
        break;
    }
  },

  setPreviewMode: (enabled) => {
    set({ previewMode: enabled });
    if (enabled) {
      set({
        componentIdMode: false,
        textEditMode: false,
        editorMode: "preview",
        activeFeedbackType: null,
        hoveredCommentElement: null,
        selectedCommentElements: [],
      });
    }
  },

  setSidebarWidth: (width) =>
    set({ sidebarWidth: Math.max(200, Math.min(400, width)) }),

  resetSidebarWidth: () => set({ sidebarWidth: DEFAULT_SIDEBAR_WIDTH }),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setDevMode: (enabled) => set({ devMode: enabled }),

  setDogfoodMode: (enabled) => set({ dogfoodMode: enabled }),
});
