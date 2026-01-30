import type { StateCreator } from "zustand";
import type { AppState, EditorMode, ModeBarPosition, PanelType } from "../types";
import type {
  OutputSlice,
  PanelMode,
  OutputTarget,
  PersistResult,
  IDesignOutput,
} from "../../types/output";
import { panelModeToOutputTarget } from "../../types/output";
import { clipboardOutput } from "../../utils/output/clipboardOutput";
import { fileOutput } from "../../utils/output/fileOutput";

/**
 * UI State Slice
 *
 * Merged from uiSlice + panelsSlice + outputSlice.
 * Manages editor mode, panels, dev flags, and output mode.
 */

const DEFAULT_BAR_POSITION: ModeBarPosition = "bottom-center";

export interface UiStateSlice {
  // Editor mode (from uiSlice)
  editorMode: EditorMode;
  devMode: boolean;
  dogfoodMode: boolean;
  barPosition: ModeBarPosition;

  // Panels (from panelsSlice)
  activePanel: PanelType | null;

  // Output (from outputSlice)
  panelMode: PanelMode;
  currentTarget: OutputTarget;
  targetOverridden: boolean;
  lastPersistResult: PersistResult | null;
  isPersisting: boolean;

  // Editor mode actions
  setEditorMode: (mode: EditorMode) => void;
  setDevMode: (enabled: boolean) => void;
  setDogfoodMode: (enabled: boolean) => void;
  setBarPosition: (position: ModeBarPosition) => void;

  // Panel actions
  setActivePanel: (panel: PanelType | null) => void;

  // Output actions
  setPanelMode: (mode: PanelMode) => void;
  setOutputTarget: (target: OutputTarget) => void;
  clearTargetOverride: () => void;
  setIsPersisting: (isPersisting: boolean) => void;
  setLastPersistResult: (result: PersistResult | null) => void;
  getOutputImplementation: () => IDesignOutput;
}

export const createUiStateSlice: StateCreator<
  AppState,
  [],
  [],
  UiStateSlice
> = (set, get) => ({
  // Editor mode state
  editorMode: "cursor",
  devMode: false,
  dogfoodMode: false,
  barPosition: DEFAULT_BAR_POSITION,

  // Panels state
  activePanel: null,

  // Output state
  panelMode: "default",
  currentTarget: "clipboard",
  targetOverridden: false,
  lastPersistResult: null,
  isPersisting: false,

  // Editor mode actions
  setEditorMode: (mode: EditorMode) => {
    set({ editorMode: mode });

    // Clear feedback/comment state when switching to non-comment modes
    if (mode !== "comment") {
      set({
        activeFeedbackType: null,
        hoveredCommentElement: null,
        selectedCommentElements: [],
      });
    }

    // Clear component-id selection state when leaving that mode
    if (mode !== "component-id") {
      set({
        selectedComponents: [],
        hoveredComponent: null,
        selectionRect: null,
      });
    }
  },

  setDevMode: (enabled) => set({ devMode: enabled }),
  setDogfoodMode: (enabled) => set({ dogfoodMode: enabled }),
  setBarPosition: (position: ModeBarPosition) => set({ barPosition: position }),

  // Panel actions
  setActivePanel: (panel) => set({ activePanel: panel }),

  // Output actions
  setPanelMode: (mode: PanelMode) => {
    set((state) => {
      const newTarget = state.targetOverridden
        ? state.currentTarget
        : panelModeToOutputTarget(mode);

      return {
        panelMode: mode,
        currentTarget: newTarget,
      };
    });
  },

  setOutputTarget: (target: OutputTarget) => {
    set({
      currentTarget: target,
      targetOverridden: true,
    });
  },

  clearTargetOverride: () => {
    set((state) => ({
      targetOverridden: false,
      currentTarget: panelModeToOutputTarget(state.panelMode),
    }));
  },

  setIsPersisting: (isPersisting: boolean) => {
    set({ isPersisting });
  },

  setLastPersistResult: (result: PersistResult | null) => {
    set({ lastPersistResult: result });
  },

  getOutputImplementation: (): IDesignOutput => {
    const { currentTarget } = get();

    switch (currentTarget) {
      case "clipboard":
        return clipboardOutput;
      case "file":
        return fileOutput;
      case "both":
        return clipboardOutput;
    }
  },
});
