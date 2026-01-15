import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import type { AppState } from "./types";
import {
  createComponentIdSlice,
  createTextEditSlice,
  createPanelsSlice,
  createTokensSlice,
  createUiSlice,
  createComponentsSlice,
} from "./slices";

/**
 * Main application store combining all slices.
 *
 * Architecture:
 * - Slices: Each feature area has its own slice for modularity
 * - Persist: UI preferences saved to localStorage (partialize excludes fetched data)
 * - DevTools: Enabled in development for debugging
 * - SubscribeWithSelector: Enables efficient subscriptions to specific state parts
 */
export const useAppStore = create<AppState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (...args) => ({
          ...createComponentIdSlice(...args),
          ...createTextEditSlice(...args),
          ...createPanelsSlice(...args),
          ...createTokensSlice(...args),
          ...createUiSlice(...args),
          ...createComponentsSlice(...args),
        }),
        {
          name: "radflow-app-store",
          // Only persist UI state, not fetched data
          partialize: (state) => ({
            // UI preferences
            editorMode: state.editorMode,
            sidebarWidth: state.sidebarWidth,
            sidebarCollapsed: state.sidebarCollapsed,
            panelWidth: state.panelWidth,
            activePanel: state.activePanel,
            directWriteMode: state.directWriteMode,
          }),
        }
      )
    ),
    { name: "RadFlow", enabled: import.meta.env.DEV }
  )
);

// Re-export types for convenience
export type { AppState } from "./types";
export type {
  ComponentIdSlice,
  TextEditSlice,
  PanelsSlice,
  TokensSlice,
  UiSlice,
  ComponentsSlice,
  EditorMode,
  PanelType,
  TextEdit,
} from "./types";
