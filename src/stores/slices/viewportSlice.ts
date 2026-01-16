import type { StateCreator } from "zustand";
import type { AppState, Breakpoint, PreviewViewMode } from "../types";

/**
 * Viewport Slice
 *
 * Manages responsive viewport settings:
 * - Tailwind breakpoint presets
 * - Custom width support
 * - View mode (grid, focused, variants)
 *
 * Extracted from fn7 previewSlice, bridge connection handled by bridgeSlice.
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
});
