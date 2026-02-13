import { StateCreator } from "zustand";
import type { AppState } from "../types";
import type { FileNode, PanOffset, LayoutNode } from "../../types/spatial";
import { FEEDBACK_TIMINGS } from "../../utils/spatial/constants";
import { mergeChildren } from "../../utils/spatial/treeHelpers";

/**
 * Sort nodes by visual position for range selection and keyboard navigation.
 * Primary: x position (columns), Secondary: y position (rows within column)
 */
function sortByVisualOrder(nodes: LayoutNode[]): LayoutNode[] {
  return [...nodes]
    .filter((n) => !n.isTruncationNode)
    .sort((a, b) => {
      // Group by column (x position with tolerance for same column)
      const colA = Math.floor(a.x / 50);
      const colB = Math.floor(b.x / 50);
      if (colA !== colB) return colA - colB;
      // Within same column, sort by y
      return a.y - b.y;
    });
}

export interface SpatialViewportSlice {
  // View toggle (independent of editorMode)
  spatialBrowserActive: boolean;

  // File tree state
  spatialFileTree: FileNode | null;
  spatialExpandedPaths: Set<string>;
  spatialSelectedPaths: Set<string>;
  spatialFocusedPath: string | null;
  spatialRootPath: string | null;
  spatialShowHiddenFiles: boolean;

  // Viewport state
  spatialPanOffset: PanOffset;
  spatialIsPanning: boolean;
  spatialSearchOpen: boolean;
  spatialSearchQuery: string;
  spatialSelectedResultIndex: number;
  spatialHighlightedPath: string | null;

  // View toggle actions
  setSpatialBrowserActive: (active: boolean) => void;
  toggleSpatialBrowser: () => void;

  // File tree actions
  setSpatialFileTree: (tree: FileNode | null) => void;
  setSpatialRootPath: (path: string | null) => void;
  spatialExpandPath: (path: string, children: FileNode[]) => void;
  spatialCollapsePath: (path: string) => void;
  spatialTogglePath: (path: string, children?: FileNode[]) => void;
  spatialSelectPath: (path: string) => void;
  spatialAddToSelection: (path: string) => void;
  spatialToggleSelection: (path: string) => void;
  spatialSelectRange: (fromPath: string, toPath: string, layoutNodes: LayoutNode[]) => void;
  spatialSetSelectedPaths: (paths: Set<string>, additive?: boolean) => void;
  spatialClearSelection: () => void;
  setSpatialFocusedPath: (path: string | null) => void;
  setSpatialShowHiddenFiles: (show: boolean) => void;

  // Viewport actions
  setSpatialPanOffset: (offset: PanOffset) => void;
  updateSpatialPanOffset: (delta: PanOffset) => void;
  setSpatialIsPanning: (isPanning: boolean) => void;
  panToNode: (path: string, layoutNodes: LayoutNode[]) => void;
  resetSpatialPan: () => void;
  openSpatialSearch: () => void;
  closeSpatialSearch: () => void;
  setSpatialSearchQuery: (query: string) => void;
  selectNextSpatialResult: (maxResults: number) => void;
  selectPreviousSpatialResult: () => void;
  setSpatialHighlightedPath: (path: string | null) => void;

  // Selection helpers
  spatialSelectAllFiles: (layoutNodes: LayoutNode[]) => void;
  spatialMoveFocusUp: (layoutNodes: LayoutNode[]) => void;
  spatialMoveFocusDown: (layoutNodes: LayoutNode[]) => void;
  spatialGetSelectedNodes: (layoutNodes: LayoutNode[]) => FileNode[];

  // Enhanced keyboard navigation
  spatialMoveFocusToFirst: (layoutNodes: LayoutNode[]) => void;
  spatialMoveFocusToLast: (layoutNodes: LayoutNode[]) => void;
  spatialMoveFocusToParent: (layoutNodes: LayoutNode[]) => void;
  spatialMoveFocusToFirstChild: (layoutNodes: LayoutNode[]) => void;
  spatialGetFocusedNode: (layoutNodes: LayoutNode[]) => LayoutNode | null;
}

export const createSpatialViewportSlice: StateCreator<
  AppState,
  [],
  [],
  SpatialViewportSlice
> = (set, get) => ({
  // View toggle (independent of editorMode)
  spatialBrowserActive: false,

  // File tree state
  spatialFileTree: null,
  spatialExpandedPaths: new Set<string>(),
  spatialSelectedPaths: new Set<string>(),
  spatialFocusedPath: null,
  spatialRootPath: null,
  spatialShowHiddenFiles: false,

  // Viewport state
  spatialPanOffset: { x: 0, y: 0 },
  spatialIsPanning: false,
  spatialSearchOpen: false,
  spatialSearchQuery: "",
  spatialSelectedResultIndex: 0,
  spatialHighlightedPath: null,

  // View toggle actions
  setSpatialBrowserActive: (active) => set({ spatialBrowserActive: active }),
  toggleSpatialBrowser: () => set((state) => ({ spatialBrowserActive: !state.spatialBrowserActive })),

  // File tree actions
  setSpatialFileTree: (tree) => set({ spatialFileTree: tree }),

  setSpatialRootPath: (path) => set({ spatialRootPath: path }),

  spatialExpandPath: (path, children) =>
    set((state) => {
      const newExpanded = new Set(state.spatialExpandedPaths);
      newExpanded.add(path);
      return {
        spatialExpandedPaths: newExpanded,
        spatialFileTree: mergeChildren(state.spatialFileTree, path, children),
      };
    }),

  spatialCollapsePath: (path) =>
    set((state) => {
      const newExpanded = new Set(state.spatialExpandedPaths);
      newExpanded.delete(path);
      return { spatialExpandedPaths: newExpanded };
    }),

  spatialTogglePath: (path, children) => {
    const state = get();
    if (state.spatialExpandedPaths.has(path)) {
      get().spatialCollapsePath(path);
    } else if (children) {
      get().spatialExpandPath(path, children);
    }
  },

  spatialSelectPath: (path) =>
    set({
      spatialSelectedPaths: new Set([path]),
      spatialFocusedPath: path,
    }),

  spatialAddToSelection: (path) =>
    set((state) => {
      const newSelected = new Set(state.spatialSelectedPaths);
      newSelected.add(path);
      return { spatialSelectedPaths: newSelected, spatialFocusedPath: path };
    }),

  spatialToggleSelection: (path) =>
    set((state) => {
      const newSelected = new Set(state.spatialSelectedPaths);
      if (newSelected.has(path)) {
        newSelected.delete(path);
      } else {
        newSelected.add(path);
      }
      return { spatialSelectedPaths: newSelected, spatialFocusedPath: path };
    }),

  spatialSelectRange: (fromPath, toPath, layoutNodes) =>
    set((state) => {
      // Sort nodes by visual order (x then y)
      const sorted = [...layoutNodes].sort((a, b) =>
        a.x !== b.x ? a.x - b.x : a.y - b.y
      );
      const fromIndex = sorted.findIndex((n) => n.fileNode.path === fromPath);
      const toIndex = sorted.findIndex((n) => n.fileNode.path === toPath);
      if (fromIndex === -1 || toIndex === -1) return state;

      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);
      const rangePaths = sorted.slice(start, end + 1).map((n) => n.fileNode.path);

      return {
        spatialSelectedPaths: new Set([...state.spatialSelectedPaths, ...rangePaths]),
        spatialFocusedPath: toPath,
      };
    }),

  spatialSetSelectedPaths: (paths, additive = false) =>
    set((state) => {
      if (additive) {
        // Toggle mode: add paths not selected, remove paths already selected
        const newSelected = new Set(state.spatialSelectedPaths);
        paths.forEach((path) => {
          if (newSelected.has(path)) {
            newSelected.delete(path); // Deselect if already selected
          } else {
            newSelected.add(path); // Select if not selected
          }
        });
        return { spatialSelectedPaths: newSelected };
      }
      // Replace selection
      return { spatialSelectedPaths: new Set(paths) };
    }),

  spatialClearSelection: () => set({ spatialSelectedPaths: new Set<string>() }),

  setSpatialFocusedPath: (path) => set({ spatialFocusedPath: path }),

  setSpatialShowHiddenFiles: (show) => set({ spatialShowHiddenFiles: show }),

  // Viewport actions
  setSpatialPanOffset: (offset) => set({ spatialPanOffset: offset }),

  updateSpatialPanOffset: (delta) =>
    set((state) => ({
      spatialPanOffset: {
        x: state.spatialPanOffset.x + delta.x,
        y: state.spatialPanOffset.y + delta.y,
      },
    })),

  setSpatialIsPanning: (isPanning) => set({ spatialIsPanning: isPanning }),

  panToNode: (path, layoutNodes) => {
    const node = layoutNodes.find((n) => n.fileNode.path === path);
    if (!node) return;

    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
    const availableWidth = viewportWidth - 300;
    const availableHeight = viewportHeight - 100;

    set({
      spatialPanOffset: {
        x: -(node.x - availableWidth / 2 + node.width / 2),
        y: -(node.y - availableHeight / 2 + node.height / 2),
      },
    });
  },

  resetSpatialPan: () => set({ spatialPanOffset: { x: 0, y: 0 } }),

  openSpatialSearch: () =>
    set({
      spatialSearchOpen: true,
      spatialSearchQuery: "",
      spatialSelectedResultIndex: 0,
    }),

  closeSpatialSearch: () =>
    set({
      spatialSearchOpen: false,
      spatialHighlightedPath: null,
    }),

  setSpatialSearchQuery: (query) =>
    set({
      spatialSearchQuery: query,
      spatialSelectedResultIndex: 0,
    }),

  selectNextSpatialResult: (maxResults) =>
    set((state) => ({
      spatialSelectedResultIndex: Math.min(
        state.spatialSelectedResultIndex + 1,
        maxResults - 1
      ),
    })),

  selectPreviousSpatialResult: () =>
    set((state) => ({
      spatialSelectedResultIndex: Math.max(0, state.spatialSelectedResultIndex - 1),
    })),

  setSpatialHighlightedPath: (path) => {
    set({ spatialHighlightedPath: path });

    if (path) {
      setTimeout(() => {
        if (get().spatialHighlightedPath === path) {
          set({ spatialHighlightedPath: null });
        }
      }, FEEDBACK_TIMINGS.highlightPulseMs);
    }
  },

  // Selection helpers
  spatialSelectAllFiles: (layoutNodes) => {
    const filePaths = layoutNodes
      .filter((n) => !n.isTruncationNode && n.fileNode.nodeType === "File")
      .map((n) => n.fileNode.path);
    set({ spatialSelectedPaths: new Set(filePaths) });
  },

  spatialMoveFocusUp: (layoutNodes) => {
    const state = get();
    const sorted = sortByVisualOrder(layoutNodes);
    const currentIndex = sorted.findIndex(
      (n) => n.fileNode.path === state.spatialFocusedPath
    );
    if (currentIndex <= 0) return;
    const newPath = sorted[currentIndex - 1].fileNode.path;
    set({ spatialFocusedPath: newPath, spatialSelectedPaths: new Set([newPath]) });
  },

  spatialMoveFocusDown: (layoutNodes) => {
    const state = get();
    const sorted = sortByVisualOrder(layoutNodes);
    const currentIndex = sorted.findIndex(
      (n) => n.fileNode.path === state.spatialFocusedPath
    );
    if (currentIndex === -1 || currentIndex >= sorted.length - 1) {
      // If no focus, focus first node
      if (sorted.length > 0 && currentIndex === -1) {
        const newPath = sorted[0].fileNode.path;
        set({ spatialFocusedPath: newPath, spatialSelectedPaths: new Set([newPath]) });
      }
      return;
    }
    const newPath = sorted[currentIndex + 1].fileNode.path;
    set({ spatialFocusedPath: newPath, spatialSelectedPaths: new Set([newPath]) });
  },

  spatialGetSelectedNodes: (layoutNodes) => {
    const paths = get().spatialSelectedPaths;
    return layoutNodes
      .filter((n) => paths.has(n.fileNode.path))
      .map((n) => n.fileNode);
  },

  // Enhanced keyboard navigation
  spatialMoveFocusToFirst: (layoutNodes) => {
    const sorted = sortByVisualOrder(layoutNodes);
    if (sorted.length === 0) return;
    const newPath = sorted[0].fileNode.path;
    set({ spatialFocusedPath: newPath, spatialSelectedPaths: new Set([newPath]) });
  },

  spatialMoveFocusToLast: (layoutNodes) => {
    const sorted = sortByVisualOrder(layoutNodes);
    if (sorted.length === 0) return;
    const newPath = sorted[sorted.length - 1].fileNode.path;
    set({ spatialFocusedPath: newPath, spatialSelectedPaths: new Set([newPath]) });
  },

  spatialMoveFocusToParent: (layoutNodes) => {
    const state = get();
    if (!state.spatialFocusedPath) return;

    // Find parent path by removing last segment
    const parts = state.spatialFocusedPath.split("/");
    if (parts.length <= 1) return; // Already at root

    const parentPath = parts.slice(0, -1).join("/");

    // Check if parent exists in layout nodes
    const parentNode = layoutNodes.find((n) => n.fileNode.path === parentPath);
    if (parentNode) {
      set({ spatialFocusedPath: parentPath, spatialSelectedPaths: new Set([parentPath]) });
    }
  },

  spatialMoveFocusToFirstChild: (layoutNodes) => {
    const state = get();
    if (!state.spatialFocusedPath) return;

    // Find the focused node
    const focusedNode = layoutNodes.find(
      (n) => n.fileNode.path === state.spatialFocusedPath
    );
    if (!focusedNode) return;

    // Only directories can have children
    if (focusedNode.fileNode.nodeType !== "Directory") return;

    // If collapsed, cannot navigate to children
    if (!state.spatialExpandedPaths.has(state.spatialFocusedPath)) return;

    // Find first child (path starts with focused path + /)
    const children = layoutNodes.filter((n) => {
      const path = n.fileNode.path;
      return (
        path.startsWith(state.spatialFocusedPath + "/") &&
        path.split("/").length === state.spatialFocusedPath!.split("/").length + 1
      );
    });

    if (children.length === 0) return;

    // Sort children by visual order and pick first
    const sortedChildren = sortByVisualOrder(children);
    if (sortedChildren.length > 0) {
      const newPath = sortedChildren[0].fileNode.path;
      set({ spatialFocusedPath: newPath, spatialSelectedPaths: new Set([newPath]) });
    }
  },

  spatialGetFocusedNode: (layoutNodes) => {
    const state = get();
    if (!state.spatialFocusedPath) return null;
    return layoutNodes.find((n) => n.fileNode.path === state.spatialFocusedPath) || null;
  },
});
