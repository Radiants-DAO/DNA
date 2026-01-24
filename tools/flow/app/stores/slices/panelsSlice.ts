import type { StateCreator } from "zustand";
import type { AppState, PanelsSlice } from "../types";

const DEFAULT_PANEL_WIDTH = 320;

export const createPanelsSlice: StateCreator<
  AppState,
  [],
  [],
  PanelsSlice
> = (set) => ({
  activePanel: null,
  panelWidth: DEFAULT_PANEL_WIDTH,

  setActivePanel: (panel) => set({ activePanel: panel }),
  setPanelWidth: (width) => set({ panelWidth: Math.max(200, Math.min(600, width)) }),
  resetPanelWidth: () => set({ panelWidth: DEFAULT_PANEL_WIDTH }),
});
