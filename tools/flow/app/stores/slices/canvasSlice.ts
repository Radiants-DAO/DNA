import type { StateCreator } from "zustand";
import type { AppState, Breakpoint, PreviewViewMode, CanvasRect, TextEdit } from "../types";

/**
 * Canvas Slice
 *
 * Merged from viewportSlice + textEditSlice.
 * Manages viewport/breakpoint settings, canvas rect tracking, and text edits.
 */

const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { name: "sm", width: 640 },
  { name: "md", width: 768 },
  { name: "lg", width: 1024 },
  { name: "xl", width: 1280 },
  { name: "2xl", width: 1536 },
];

export interface CanvasSlice {
  // Viewport state
  breakpoints: Breakpoint[];
  activeBreakpoint: string | null;
  customWidth: number | null;
  viewportWidth: number | null;

  // Target URL (dev server URL for iframe)
  targetUrl: string | null;

  // Preview view mode
  previewViewMode: PreviewViewMode;
  variantComponent: string | null;
  refreshKey: number;

  // Canvas rect tracking (fn-2-gnc.10)
  canvasRect: CanvasRect | null;
  canvasScale: number;

  // Text edit state
  pendingEdits: TextEdit[];

  // Viewport actions
  setBreakpoints: (breakpoints: Breakpoint[]) => void;
  setActiveBreakpoint: (name: string | null) => void;
  setCustomWidth: (width: number | null) => void;
  selectBreakpointByIndex: (index: number) => void;
  resetBreakpoints: () => void;
  setTargetUrl: (url: string | null) => void;
  setPreviewViewMode: (mode: PreviewViewMode) => void;
  setVariantComponent: (name: string | null) => void;
  refreshPreview: () => void;

  // Canvas rect actions
  setCanvasRect: (rect: CanvasRect) => void;
  setCanvasScale: (scale: number) => void;

  // Text edit actions
  addPendingEdit: (edit: Omit<TextEdit, "id" | "timestamp">) => void;
  removePendingEdit: (id: string) => void;
  clearPendingEdits: () => void;
  copyEditsToClipboard: () => Promise<void>;
}

export const createCanvasSlice: StateCreator<
  AppState,
  [],
  [],
  CanvasSlice
> = (set, get) => ({
  // Viewport state
  breakpoints: DEFAULT_BREAKPOINTS,
  activeBreakpoint: null,
  customWidth: null,
  viewportWidth: null,

  // Target URL
  targetUrl: null,

  // Preview state
  previewViewMode: "grid",
  variantComponent: null,
  refreshKey: 0,

  // Canvas rect tracking
  canvasRect: null,
  canvasScale: 1,

  // Text edit state
  pendingEdits: [],

  // Viewport actions
  setBreakpoints: (breakpoints) => {
    set({ breakpoints });
  },

  setActiveBreakpoint: (name) => {
    const { breakpoints } = get();

    if (name === null) {
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

    const clampedWidth = Math.max(320, Math.min(3840, width));
    set({
      activeBreakpoint: null,
      customWidth: clampedWidth,
      viewportWidth: clampedWidth,
    });
  },

  selectBreakpointByIndex: (index) => {
    const { breakpoints, setActiveBreakpoint } = get();

    if (index === 0) {
      setActiveBreakpoint(null);
      return;
    }

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

  // Canvas rect actions
  setCanvasRect: (rect) => {
    set({ canvasRect: rect });
  },

  setCanvasScale: (scale) => {
    const clampedScale = Math.max(0.25, Math.min(4, scale));
    set({ canvasScale: clampedScale });
  },


  // Text edit actions
  addPendingEdit: (edit) => {
    const newEdit: TextEdit = {
      ...edit,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    set((state) => ({
      pendingEdits: [...state.pendingEdits, newEdit],
    }));
  },

  removePendingEdit: (id) => {
    set((state) => ({
      pendingEdits: state.pendingEdits.filter((e) => e.id !== id),
    }));
  },

  clearPendingEdits: () => set({ pendingEdits: [] }),

  copyEditsToClipboard: async () => {
    const { pendingEdits } = get();
    if (pendingEdits.length === 0) return;

    const text = pendingEdits
      .map(
        (edit) =>
          `// ${edit.componentName} @ ${edit.file}:${edit.line}\n` +
          `- "${edit.originalText}"\n+ "${edit.newText}"`
      )
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy edits to clipboard:", err);
    }
  },
});
