/**
 * UI State Slice - Ported from Flow 0
 *
 * Manages editor mode, panels, dev flags, and output mode.
 * Output file writing has been stubbed for the extension context.
 */

import type { StateCreator } from "zustand";
import type {
  AppState,
  EditorMode,
  ModeBarPosition,
  PanelType,
  PanelMode,
  OutputTarget,
  PersistResult,
} from "../types";

const DEFAULT_BAR_POSITION: ModeBarPosition = "bottom-center";

export interface UiStateSlice {
  // Editor mode
  editorMode: EditorMode;
  activeToolId: string | null;
  devMode: boolean;
  dogfoodMode: boolean;
  barPosition: ModeBarPosition;

  // Panels
  activePanel: PanelType | null;

  // Output
  panelMode: PanelMode;
  currentTarget: OutputTarget;
  targetOverridden: boolean;
  lastPersistResult: PersistResult | null;
  isPersisting: boolean;

  // Editor mode actions
  setEditorMode: (mode: EditorMode, toolId?: string) => void;
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
}

// Import the function from types
import { panelModeToOutputTarget as toOutputTarget } from "../types";

export const createUiStateSlice: StateCreator<
  AppState,
  [],
  [],
  UiStateSlice
> = (set, get) => ({
  // Editor mode state
  editorMode: "cursor",
  activeToolId: null,
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
  setEditorMode: (mode: EditorMode, toolId?: string) => {
    try {
      set({ editorMode: mode, activeToolId: toolId ?? null });

      // Clear feedback/comment state when switching to non-comment modes
      // Use slice methods instead of direct state mutation to maintain slice isolation
      if (mode !== "comment") {
        get().setActiveFeedbackType(null);
        get().setHoveredCommentElement(null);
        get().clearSelectedCommentElements();
      }

      // Clear component-id selection state when leaving that mode
      // Use slice methods instead of direct state mutation to maintain slice isolation
      if (mode !== "component-id") {
        get().clearSelection();
        get().setHoveredComponent(null);
      }
    } catch (err) {
      console.error("[setEditorMode] Error during mode transition:", err);
      // Ensure we at least land on cursor mode
      set({ editorMode: "cursor" });
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
        : toOutputTarget(mode);

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
      currentTarget: toOutputTarget(state.panelMode),
    }));
  },

  setIsPersisting: (isPersisting: boolean) => {
    set({ isPersisting });
  },

  setLastPersistResult: (result: PersistResult | null) => {
    set({ lastPersistResult: result });
  },
});
