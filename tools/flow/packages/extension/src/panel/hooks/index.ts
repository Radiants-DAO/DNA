/**
 * Panel Hooks - Ported from Flow 0
 *
 * Canvas interaction, gesture handling, and bridge communication hooks.
 */

// Bridge and communication
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

// Pan and zoom
export { usePanZoom } from "./usePanZoom";

// Style editing
export { useStyleInjection } from "./useStyleInjection";
export type {
  StyleEdit,
  UseStyleInjectionOptions,
  UseStyleInjectionReturn,
} from "./useStyleInjection";
export { useScrub } from "./useScrub";
export type { UseScrubOptions, UseScrubReturn, ScrubInputProps } from "./useScrub";
