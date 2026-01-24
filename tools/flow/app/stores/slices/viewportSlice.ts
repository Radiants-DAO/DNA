import type { StateCreator } from "zustand";
import type { AppState, Breakpoint, PreviewViewMode, CanvasRect } from "../types";

/**
 * Viewport Slice
 *
 * Manages responsive viewport settings:
 * - Tailwind breakpoint presets
 * - Custom width support
 * - View mode (grid, focused, variants)
 * - Canvas rect tracking for overlay positioning (fn-2-gnc.10)
 * - Canvas scale factor for zoom support
 * - Edit mode pointer events toggle
 *
 * Extracted from fn7 previewSlice, bridge connection handled by bridgeSlice.
 * Canvas rect tracking based on Webstudio patterns (AGPL-3.0).
 */

/**
 * Default Tailwind breakpoints.
 * Used as fallback when no project-specific breakpoints are detected.
 */
const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { name: "sm", width: 640 },
  { name: "md", width: 768 },
  { name: "lg", width: 1024 },
  { name: "xl", width: 1280 },
  { name: "2xl", width: 1536 },
];

export interface ViewportSlice {
  // Viewport state
  breakpoints: Breakpoint[];
  activeBreakpoint: string | null; // null = full width
  customWidth: number | null;
  viewportWidth: number | null; // null = 100%

  // Target URL (dev server URL for iframe)
  targetUrl: string | null;

  // Preview view mode
  previewViewMode: PreviewViewMode;
  variantComponent: string | null;
  refreshKey: number;

  // Canvas rect tracking (fn-2-gnc.10)
  // Used by overlay system for positioning selection/hover indicators
  canvasRect: CanvasRect | null;
  canvasScale: number; // 1 = 100%, 0.5 = 50%, 2 = 200%
  canvasEditMode: boolean; // true = editing (overlays receive events), false = preview

  // Actions
  setBreakpoints: (breakpoints: Breakpoint[]) => void;
  setActiveBreakpoint: (name: string | null) => void;
  setCustomWidth: (width: number | null) => void;
  selectBreakpointByIndex: (index: number) => void;
  resetBreakpoints: () => void;
  setTargetUrl: (url: string | null) => void;
  setPreviewViewMode: (mode: PreviewViewMode) => void;
  setVariantComponent: (name: string | null) => void;
  refreshPreview: () => void;

  // Canvas rect actions (fn-2-gnc.10)
  setCanvasRect: (rect: CanvasRect) => void;
  setCanvasScale: (scale: number) => void;
  setCanvasEditMode: (editing: boolean) => void;
}

export const createViewportSlice: StateCreator<
  AppState,
  [],
  [],
  ViewportSlice
> = (set, get) => ({
  // Viewport state
  breakpoints: DEFAULT_BREAKPOINTS,
  activeBreakpoint: null, // null = full width
  customWidth: null,
  viewportWidth: null, // null = 100%

  // Target URL
  targetUrl: null,

  // Preview state
  previewViewMode: "grid",
  variantComponent: null,
  refreshKey: 0,

  // Canvas rect tracking (fn-2-gnc.10)
  canvasRect: null,
  canvasScale: 1,
  canvasEditMode: true, // Default to editing mode

  // Viewport actions
  setBreakpoints: (breakpoints) => {
    set({ breakpoints });
  },

  setActiveBreakpoint: (name) => {
    const { breakpoints } = get();

    if (name === null) {
      // Full width mode
      set({
        activeBreakpoint: null,
        customWidth: null,
        viewportWidth: null,
      });
      return;
    }

    const breakpoint = breakpoints.find((bp) => bp.name === name);
    if (breakpoint) {
      set({
        activeBreakpoint: name,
        customWidth: null,
        viewportWidth: breakpoint.width,
      });
    }
  },

  setCustomWidth: (width) => {
    if (width === null) {
      set({ customWidth: null });
      return;
    }

    // Clamp between reasonable bounds
    const clampedWidth = Math.max(320, Math.min(3840, width));
    set({
      activeBreakpoint: null,
      customWidth: clampedWidth,
      viewportWidth: clampedWidth,
    });
  },

  selectBreakpointByIndex: (index) => {
    const { breakpoints, setActiveBreakpoint } = get();

    // Index 0 = full width
    if (index === 0) {
      setActiveBreakpoint(null);
      return;
    }

    // Index 1-5 = breakpoints (0-indexed in array)
    const breakpointIndex = index - 1;
    if (breakpointIndex >= 0 && breakpointIndex < breakpoints.length) {
      setActiveBreakpoint(breakpoints[breakpointIndex].name);
    }
  },

  resetBreakpoints: () => {
    set({ breakpoints: DEFAULT_BREAKPOINTS });
  },

  setTargetUrl: (url) => {
    set({ targetUrl: url });
  },

  setPreviewViewMode: (mode) => {
    set({ previewViewMode: mode });
  },

  setVariantComponent: (name) => {
    set({
      variantComponent: name,
      previewViewMode: name ? "variants" : "grid",
    });
  },

  refreshPreview: () => {
    set((state) => ({ refreshKey: state.refreshKey + 1 }));
  },

  // Canvas rect actions (fn-2-gnc.10)
  setCanvasRect: (rect) => {
    set({ canvasRect: rect });
  },

  setCanvasScale: (scale) => {
    // Clamp scale between reasonable bounds (25% to 400%)
    const clampedScale = Math.max(0.25, Math.min(4, scale));
    set({ canvasScale: clampedScale });
  },

  setCanvasEditMode: (editing) => {
    set({ canvasEditMode: editing });
  },
});
