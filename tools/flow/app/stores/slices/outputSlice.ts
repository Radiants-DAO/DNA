/**
 * Output Slice
 *
 * Manages output mode state for dual-mode output (clipboard vs file).
 * Tracks current panel mode and output target.
 *
 * Panel Mode Mapping:
 * | Panel Mode          | Output Target | Behavior                        |
 * |---------------------|---------------|---------------------------------|
 * | Default (Figma-like) | clipboard    | Copy to clipboard only          |
 * | Focus (all props)    | clipboard    | Copy to clipboard only          |
 * | Advanced             | file         | Direct file write + CSS editor  |
 *
 * Implementation: fn-2-gnc.8
 */

import type { StateCreator } from "zustand";
import type { AppState } from "../types";
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
 * Create the output slice.
 *
 * This slice manages:
 * - Panel mode (default/focus/advanced)
 * - Current output target (clipboard/file/both)
 * - Target override state
 * - Persist operation state
 */
export const createOutputSlice: StateCreator<
  AppState,
  [],
  [],
  OutputSlice
> = (set, get) => ({
  // Initial state
  panelMode: "default",
  currentTarget: "clipboard",
  targetOverridden: false,
  lastPersistResult: null,
  isPersisting: false,

  // Actions
  setPanelMode: (mode: PanelMode) => {
    set((state) => {
      // If target is not overridden, update it based on panel mode
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
        // For "both", return clipboard as primary (file is stub anyway)
        return clipboardOutput;
    }
  },
});
