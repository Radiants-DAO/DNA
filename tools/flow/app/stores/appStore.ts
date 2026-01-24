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
  createViolationsSlice,
  createWatcherSlice,
  createBridgeSlice,
  createProjectSlice,
  createSelectionSlice,
  createEditsSlice,
  createViewportSlice,
  createUndoSlice,
  createTargetProjectSlice,
  createThemeSlice,
  createCommentSlice,
  createSmartAnnotateSlice,
  createOutputSlice,
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
          ...createViolationsSlice(...args),
          ...createWatcherSlice(...args),
          ...createBridgeSlice(...args),
          ...createProjectSlice(...args),
          ...createSelectionSlice(...args),
          ...createEditsSlice(...args),
          ...createViewportSlice(...args),
          ...createUndoSlice(...args),
          ...createTargetProjectSlice(...args),
          ...createThemeSlice(...args),
          ...createCommentSlice(...args),
          ...createSmartAnnotateSlice(...args),
          ...createOutputSlice(...args),
        }),
        {
          name: "radflow-app-store",
          // Only persist UI state, not fetched data
          partialize: (state) => ({
            // UI preferences
            // Note: editorMode is persisted but we reset "comment" to "normal" on hydration
            // since activeFeedbackType is not persisted (session-only)
            editorMode: state.editorMode === "comment" ? "normal" : state.editorMode,
            sidebarWidth: state.sidebarWidth,
            sidebarCollapsed: state.sidebarCollapsed,
            panelWidth: state.panelWidth,
            activePanel: state.activePanel,
            showViolationsOnly: state.showViolationsOnly,
            // Viewport preferences (fn-7.22)
            activeBreakpoint: state.activeBreakpoint,
            customWidth: state.customWidth,
            previewViewMode: state.previewViewMode,
            // Dogfood mode (fn-1-z7k)
            dogfoodMode: state.dogfoodMode,
            // Output mode preferences (fn-2-gnc.8)
            panelMode: state.panelMode,
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
  ViolationsSlice,
  WatcherSlice,
  BridgeSlice,
  ProjectSlice,
  SelectionSlice,
  EditsSlice,
  ViewportSlice,
  UndoSlice,
  TargetProjectSlice,
  TargetProject,
  ThemeSlice,
  DiscoveredTheme,
  DiscoveredApp,
  HealthResponse,
  CommentSlice,
  Feedback,
  FeedbackType,
  EditorMode,
  PanelType,
  TextEdit,
  SelectionRect,
  FileEvent,
  RadflowId,
  SourceLocation,
  SerializedComponentEntry,
  BridgeConnectionStatus,
  BridgeSelection,
  ServerLog,
  StyleEdit,
  Breakpoint,
  PreviewViewMode,
  StyleChange,
} from "./types";

// Output types (fn-2-gnc.8)
export type {
  OutputSlice,
  OutputTarget,
  PanelMode,
  PersistResult,
  IDesignOutput,
  CompileOptions,
  PersistOptions,
} from "../types/output";
