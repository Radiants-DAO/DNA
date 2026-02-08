/**
 * App Store - unified Zustand store combining all slices
 *
 * Ported from Flow 0 with Tauri dependencies removed.
 * Combines all slices into a single store with devtools and persist middleware.
 */

import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import type { AppState } from "./types";
import {
  createCanvasSlice,
  createUiStateSlice,
  createTokensSlice,
  createComponentsSlice,
  createBridgeSlice,
  createEditingSlice,
  createCommentSlice,
  createSpatialViewportSlice,
  createComponentCanvasSlice,
  createAssetsSlice,
  createWorkspaceSlice,
  createMutationSlice,
  createPromptOutputSlice,
  createPromptBuilderSlice,
  createAnnotationSlice,
  createTextEditsSlice,
  createDesignerChangesSlice,
  createAnimationDiffsSlice,
  createModeSlice,
} from "./slices";

/**
 * Main application store combining all slices (18 slices).
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
          ...createBridgeSlice(...args),
          ...createEditingSlice(...args),
          ...createCommentSlice(...args),
          ...createSpatialViewportSlice(...args),
          ...createComponentCanvasSlice(...args),
          ...createAssetsSlice(...args),
          ...createWorkspaceSlice(...args),
          ...createMutationSlice(...args),
          ...createPromptOutputSlice(...args),
          ...createPromptBuilderSlice(...args),
          ...createAnnotationSlice(...args),
          ...createTextEditsSlice(...args),
          ...createDesignerChangesSlice(...args),
          ...createAnimationDiffsSlice(...args),
          ...createModeSlice(...args),
        }),
        {
          name: "flow-extension-store",
          partialize: (state) => ({
            // Persist only UI preferences, not session data
            editorMode: state.editorMode === "comment" ? "cursor" : state.editorMode,
            activePanel: state.activePanel,
            showViolationsOnly: state.showViolationsOnly,
            activeBreakpoint: state.activeBreakpoint,
            customWidth: state.customWidth,
            previewViewMode: state.previewViewMode,
            dogfoodMode: state.dogfoodMode,
            panelMode: state.panelMode,
            barPosition: state.barPosition,
            colorMode: state.colorMode,
          }),
        }
      )
    ),
    { name: "FlowExtension", enabled: process.env.NODE_ENV === "development" }
  )
);

// Re-export types for convenience
export type { AppState } from "./types";
export type {
  CanvasSlice,
  UiStateSlice,
  TokensSlice,
  ComponentsSlice,
  BridgeSlice,
  EditingSlice,
  SpatialViewportSlice,
  ComponentCanvasSlice,
  AssetsSlice,
  WorkspaceSlice,
  MutationSlice,
  PromptOutputSlice,
  PromptBuilderSlice,
  AnnotationSlice,
  TextEditsSlice,
  DesignerChangesSlice,
  AnimationDiffsSlice,
  ModeSlice,
  EditorMode,
  ModeBarPosition,
  PanelType,
  TextEdit,
  SelectionRect,
  RadflowId,
  SourceLocation,
  SerializedComponentEntry,
  BridgeConnectionStatus,
  BridgeSelection,
  Breakpoint,
  PreviewViewMode,
  StyleChange,
  Feedback,
  FeedbackType,
  CommentSlice,
  ThemeTokens,
  ComponentInfo,
  ViolationInfo,
  ComponentMeta,
  StyleEdit,
  // Canvas types
  ComponentSchema,
  DnaConfig,
  ComponentCanvasNode,
  ComponentConnection,
  ConnectionType,
  NodePreviewState,
  PagePreviewConfig,
  // Asset types
  IconAsset,
  LogoAsset,
  ImageAsset,
  AssetLibrary,
  // Workspace types
  ThemeEntry,
  AppEntry,
  RecentWorkspace,
  WorkspaceContext,
  // Output types
  OutputTarget,
  PersistResult,
  PanelMode,
} from "./types";
