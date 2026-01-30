import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import type { AppState } from "./types";
import {
  createCanvasSlice,
  createUiStateSlice,
  createTokensSlice,
  createComponentsSlice,
  createWatcherSlice,
  createBridgeSlice,
  createProjectSlice,
  createEditingSlice,
  createCommentSlice,
  createSpatialViewportSlice,
  createComponentCanvasSlice,
  createAssetsSlice,
  createWorkspaceSlice,
} from "./slices";

/**
 * Main application store combining all slices (13 slices, consolidated from 20).
 */
export const useAppStore = create<AppState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (...args) => ({
          ...createCanvasSlice(...args),
          ...createUiStateSlice(...args),
          ...createTokensSlice(...args),
          ...createComponentsSlice(...args),
          ...createWatcherSlice(...args),
          ...createBridgeSlice(...args),
          ...createProjectSlice(...args),
          ...createEditingSlice(...args),
          ...createCommentSlice(...args),
          ...createSpatialViewportSlice(...args),
          ...createComponentCanvasSlice(...args),
          ...createAssetsSlice(...args),
          ...createWorkspaceSlice(...args),
        }),
        {
          name: "radflow-app-store",
          partialize: (state) => ({
            editorMode: state.editorMode === "comment" ? "cursor" : state.editorMode,
            activePanel: state.activePanel,
            showViolationsOnly: state.showViolationsOnly,
            activeBreakpoint: state.activeBreakpoint,
            customWidth: state.customWidth,
            previewViewMode: state.previewViewMode,
            dogfoodMode: state.dogfoodMode,
            panelMode: state.panelMode,
            barPosition: state.barPosition,
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
  CanvasSlice,
  UiStateSlice,
  ComponentsSlice,
  BridgeSlice,
  EditingSlice,
  TokensSlice,
  EditorMode,
  ModeBarPosition,
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
  Breakpoint,
  PreviewViewMode,
  StyleChange,
  Feedback,
  FeedbackType,
  CommentSlice,
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

// Workspace types
export type {
  WorkspaceSlice,
  WorkspaceContext,
  ThemeEntry,
  AppEntry,
  RecentWorkspace,
} from "./slices/workspaceSlice";

// Component Canvas types (fn-5-component-canvas)
export type { ComponentCanvasSlice } from "./slices/componentCanvasSlice";
export type {
  ComponentSchema,
  PropDefinition,
  SlotDefinition,
  SchemaExample,
  DnaConfig,
  ComponentCanvasNode,
  ComponentCanvasBounds,
  ComponentCanvasLayoutConfig,
  SchemaScanResult,
} from "../types/componentCanvas";

// Editing types (re-export StyleEdit from editingSlice)
export type { StyleEdit } from "./slices/editingSlice";
