import { useEffect, useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import type { LayoutNode } from "../types/spatial";

interface UseSpatialKeyboardOptions {
  layoutNodes: LayoutNode[];
  enabled?: boolean;
  /** Callback to expand a folder (async, needs backend call) */
  onExpand?: (path: string) => void;
  /** Callback to collapse a folder */
  onCollapse?: (path: string) => void;
  /** Callback when a file is "activated" (Enter on a file) */
  onActivateFile?: (path: string) => void;
  /** Callback to scroll/pan to ensure a node is visible */
  onEnsureVisible?: (path: string) => void;
}

/**
 * Keyboard shortcuts for the spatial file viewer:
 * - Cmd+C: Copy selected path(s)
 * - Cmd+A: Select all visible files
 * - Escape: Clear selection
 * - Arrow Up/Down: Navigate focus through visible nodes
 * - Arrow Left: Collapse folder OR move to parent
 * - Arrow Right: Expand folder OR move to first child
 * - Enter: Toggle expand/collapse on folder, or activate file
 * - Home: Jump to first visible node
 * - End: Jump to last visible node
 * - Cmd+F: Open search (disabled for now - see task 006)
 */
export function useSpatialKeyboard({
  layoutNodes,
  enabled = true,
  onExpand,
  onCollapse,
  onActivateFile,
  onEnsureVisible,
}: UseSpatialKeyboardOptions): void {
  const selectedPaths = useAppStore((s) => s.spatialSelectedPaths);
  const expandedPaths = useAppStore((s) => s.spatialExpandedPaths);
  const focusedPath = useAppStore((s) => s.spatialFocusedPath);
  const spatialClearSelection = useAppStore((s) => s.spatialClearSelection);
  const spatialSelectAllFiles = useAppStore((s) => s.spatialSelectAllFiles);
  const spatialMoveFocusUp = useAppStore((s) => s.spatialMoveFocusUp);
  const spatialMoveFocusDown = useAppStore((s) => s.spatialMoveFocusDown);
  const spatialMoveFocusToFirst = useAppStore((s) => s.spatialMoveFocusToFirst);
  const spatialMoveFocusToLast = useAppStore((s) => s.spatialMoveFocusToLast);
  const spatialMoveFocusToParent = useAppStore((s) => s.spatialMoveFocusToParent);
  const spatialMoveFocusToFirstChild = useAppStore((s) => s.spatialMoveFocusToFirstChild);
  const spatialGetSelectedNodes = useAppStore((s) => s.spatialGetSelectedNodes);
  const spatialGetFocusedNode = useAppStore((s) => s.spatialGetFocusedNode);

  const copySelectedPaths = useCallback(async () => {
    const nodes = spatialGetSelectedNodes(layoutNodes);
    if (nodes.length === 0) return;

    const paths = nodes
      .filter((n) => n.nodeType === "File")
      .map((n) => n.path)
      .join("\n");

    if (!paths) return;

    try {
      await navigator.clipboard.writeText(paths);
      // TODO: Add toast notification when toast system is available
      // showToast({ message: `Copied ${nodes.length} path(s)`, type: "success" });
    } catch {
      // Clipboard write failed silently
    }
  }, [layoutNodes, spatialGetSelectedNodes]);

  // Helper to ensure focused node is visible after navigation
  const ensureFocusedVisible = useCallback(
    (path: string) => {
      if (onEnsureVisible) {
        onEnsureVisible(path);
      }
    },
    [onEnsureVisible]
  );

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Cmd+C: Copy selected paths
      if (e.key === "c" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        copySelectedPaths();
        return;
      }

      // Cmd+A: Select all visible files
      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        spatialSelectAllFiles(layoutNodes);
        return;
      }

      // Escape: Clear selection
      if (e.key === "Escape") {
        spatialClearSelection();
        return;
      }

      // Arrow Up: Move focus to previous sibling
      if (e.key === "ArrowUp") {
        e.preventDefault();
        spatialMoveFocusUp(layoutNodes);
        if (focusedPath) {
          // Get the new focused path after the move
          const state = useAppStore.getState();
          if (state.spatialFocusedPath) {
            ensureFocusedVisible(state.spatialFocusedPath);
          }
        }
        return;
      }

      // Arrow Down: Move focus to next sibling
      if (e.key === "ArrowDown") {
        e.preventDefault();
        spatialMoveFocusDown(layoutNodes);
        // Ensure new focus is visible
        const state = useAppStore.getState();
        if (state.spatialFocusedPath) {
          ensureFocusedVisible(state.spatialFocusedPath);
        }
        return;
      }

      // Arrow Left: Collapse folder OR move to parent
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const focusedNode = spatialGetFocusedNode(layoutNodes);
        if (!focusedNode) return;

        // If focused node is an expanded directory, collapse it
        if (
          focusedNode.fileNode.nodeType === "Directory" &&
          expandedPaths.has(focusedNode.fileNode.path)
        ) {
          onCollapse?.(focusedNode.fileNode.path);
        } else {
          // Otherwise, move to parent
          spatialMoveFocusToParent(layoutNodes);
          const state = useAppStore.getState();
          if (state.spatialFocusedPath) {
            ensureFocusedVisible(state.spatialFocusedPath);
          }
        }
        return;
      }

      // Arrow Right: Expand folder OR move to first child
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const focusedNode = spatialGetFocusedNode(layoutNodes);
        if (!focusedNode) return;

        // If focused node is a collapsed directory, expand it
        if (
          focusedNode.fileNode.nodeType === "Directory" &&
          !expandedPaths.has(focusedNode.fileNode.path)
        ) {
          onExpand?.(focusedNode.fileNode.path);
        } else if (
          focusedNode.fileNode.nodeType === "Directory" &&
          expandedPaths.has(focusedNode.fileNode.path)
        ) {
          // Already expanded, move to first child
          spatialMoveFocusToFirstChild(layoutNodes);
          const state = useAppStore.getState();
          if (state.spatialFocusedPath) {
            ensureFocusedVisible(state.spatialFocusedPath);
          }
        }
        return;
      }

      // Enter: Toggle expand/collapse on folder, or activate file
      if (e.key === "Enter") {
        e.preventDefault();
        const focusedNode = spatialGetFocusedNode(layoutNodes);
        if (!focusedNode) {
          // No focused node - copy selected paths as fallback behavior
          if (selectedPaths.size > 0) {
            copySelectedPaths();
          }
          return;
        }

        if (focusedNode.fileNode.nodeType === "Directory") {
          // Toggle expand/collapse
          if (expandedPaths.has(focusedNode.fileNode.path)) {
            onCollapse?.(focusedNode.fileNode.path);
          } else {
            onExpand?.(focusedNode.fileNode.path);
          }
        } else {
          // Activate file
          onActivateFile?.(focusedNode.fileNode.path);
        }
        return;
      }

      // Home: Jump to first visible node
      if (e.key === "Home") {
        e.preventDefault();
        spatialMoveFocusToFirst(layoutNodes);
        const state = useAppStore.getState();
        if (state.spatialFocusedPath) {
          ensureFocusedVisible(state.spatialFocusedPath);
        }
        return;
      }

      // End: Jump to last visible node
      if (e.key === "End") {
        e.preventDefault();
        spatialMoveFocusToLast(layoutNodes);
        const state = useAppStore.getState();
        if (state.spatialFocusedPath) {
          ensureFocusedVisible(state.spatialFocusedPath);
        }
        return;
      }

      // Cmd+F: Open search (placeholder for future task 006)
      // if (e.key === "f" && (e.metaKey || e.ctrlKey)) {
      //   e.preventDefault();
      //   openSpatialSearch();
      //   return;
      // }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    selectedPaths,
    expandedPaths,
    focusedPath,
    layoutNodes,
    copySelectedPaths,
    spatialClearSelection,
    spatialSelectAllFiles,
    spatialMoveFocusUp,
    spatialMoveFocusDown,
    spatialMoveFocusToFirst,
    spatialMoveFocusToLast,
    spatialMoveFocusToParent,
    spatialMoveFocusToFirstChild,
    spatialGetFocusedNode,
    onExpand,
    onCollapse,
    onActivateFile,
    ensureFocusedVisible,
  ]);
}
