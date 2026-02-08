/**
 * Panel Hooks - Ported from Flow 0
 *
 * Canvas interaction, gesture handling, and bridge communication hooks.
 */

// Bridge and communication
export { useBridgeConnection } from "./useBridgeConnection";
export type { BridgeStatus, SerializedComponentEntry, BridgeSelection } from "./useBridgeConnection";
export { useMutationBridge } from "./useMutationBridge";
export { useTextEditBridge } from "./useTextEditBridge";

// Canvas measurement and gestures
export { useCanvasRect } from "./useCanvasRect";
export type { CanvasRect } from "./useCanvasRect";
export { useCanvasGestures } from "./useCanvasGestures";
export type {
  GestureState,
  UseCanvasGesturesOptions,
  UseCanvasGesturesResult,
} from "./useCanvasGestures";
export { useCanvasPhysics, DEFAULT_PHYSICS_CONFIG } from "./useCanvasPhysics";
export type {
  PhysicsConfig,
  UseCanvasPhysicsOptions,
  UseCanvasPhysicsResult,
} from "./useCanvasPhysics";
export { useCanvasSounds } from "./useCanvasSounds";

// Pan, zoom, and selection
export { usePanZoom } from "./usePanZoom";
export { useMarqueeSelection } from "./useMarqueeSelection";
export type { MarqueeRect, MarqueeSelectionState } from "./useMarqueeSelection";

// Spatial file tree
export { useSpatialLayout } from "./useSpatialLayout";
export { useSpatialKeyboard } from "./useSpatialKeyboard";

// Style editing
export { useStyleInjection } from "./useStyleInjection";
export type {
  StyleEdit,
  UseStyleInjectionOptions,
  UseStyleInjectionReturn,
} from "./useStyleInjection";
export { useScrub } from "./useScrub";
export type { UseScrubOptions, UseScrubReturn, ScrubInputProps } from "./useScrub";
export { useUndoRedo } from "./useUndoRedo";
export type { StyleChange, UseUndoRedoOptions } from "./useUndoRedo";

// File operations (stubbed for extension)
export { useFileWatcher } from "./useFileWatcher";
export type { FileEvent } from "./useFileWatcher";
export { useDevServer, useDevServerReady } from "./useDevServer";
export type { ServerState, ServerStatus } from "./useDevServer";
export { useFileWrite } from "./useFileWrite";
export type { DiffEntry, DiffPreviewResult, WriteResult } from "./useFileWrite";
