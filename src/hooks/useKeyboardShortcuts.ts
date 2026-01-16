import { useEffect, useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import { useUndoRedo } from "./useUndoRedo";
import type { SearchScope } from "./useSearch";

/**
 * Keyboard shortcuts for mode switching and common actions.
 *
 * | Shortcut | Action |
 * |----------|--------|
 * | V | Component ID mode |
 * | T | Text Edit mode |
 * | P | Preview mode |
 * | Escape | Exit current mode (returns to component-id) |
 * | Cmd+C | Copy selection |
 * | Cmd+Z | Undo |
 * | Cmd+Shift+Z | Redo |
 * | Cmd+F | Open search overlay |
 * | Cmd+1 | Search scope: Elements (when search is open) |
 * | Cmd+2 | Search scope: Components (when search is open) |
 * | Cmd+3 | Search scope: Layers (when search is open) |
 * | Cmd+4 | Search scope: Assets (when search is open) |
 *
 * Note: Text Edit mode handles its own Escape key to copy edits to clipboard.
 */

export interface UseKeyboardShortcutsOptions {
  /** Callback to open search overlay */
  onOpenSearch?: () => void;
  /** Callback to set search scope */
  onSetSearchScope?: (scope: SearchScope) => void;
  /** Whether search overlay is currently open */
  isSearchOpen?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { onOpenSearch, onSetSearchScope, isSearchOpen } = options;
  const setEditorMode = useAppStore((s) => s.setEditorMode);
  const editorMode = useAppStore((s) => s.editorMode);
  const copySelectionToClipboard = useAppStore((s) => s.copySelectionToClipboard);
  const clearSelection = useAppStore((s) => s.clearSelection);
  const textEditMode = useAppStore((s) => s.textEditMode);

  // Style undo/redo (disable internal shortcuts, we handle them here)
  const { undo: undoStyle, redo: redoStyle } = useUndoRedo({ enableShortcuts: false });

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape even in contentEditable (text edit mode handles it)
        if (event.key !== "Escape") {
          return;
        }
        // Text Edit mode handles its own Escape key
        if (textEditMode) {
          return;
        }
      }

      const isMeta = event.metaKey || event.ctrlKey;

      // Mode switching (single keys, no modifiers)
      if (!isMeta && !event.altKey && !event.shiftKey) {
        switch (event.key.toLowerCase()) {
          case "v":
            event.preventDefault();
            setEditorMode("component-id");
            return;
          case "t":
            event.preventDefault();
            setEditorMode("text-edit");
            return;
          case "p":
            event.preventDefault();
            setEditorMode("preview");
            return;
          case "escape":
            // Text Edit mode handles its own Escape
            if (textEditMode) {
              return;
            }
            event.preventDefault();
            // In component-id mode, clear selection then exit to normal
            // In other modes, return to normal mode
            if (editorMode === "component-id") {
              clearSelection();
            }
            if (editorMode !== "normal") {
              setEditorMode("normal");
            }
            return;
        }
      }

      // Cmd/Ctrl shortcuts
      if (isMeta) {
        switch (event.key.toLowerCase()) {
          case "f":
            // Cmd+F = Open search overlay
            event.preventDefault();
            onOpenSearch?.();
            return;
          case "c":
            // Let browser handle if text is selected, otherwise copy component selection
            if (!window.getSelection()?.toString()) {
              event.preventDefault();
              copySelectionToClipboard();
            }
            return;
          case "z":
            event.preventDefault();
            if (event.shiftKey) {
              // Cmd+Shift+Z = Redo style change
              redoStyle();
            } else {
              // Cmd+Z = Undo style change
              undoStyle();
            }
            return;
          case "1":
            // Cmd+1 = Search scope: Elements
            if (isSearchOpen) {
              event.preventDefault();
              onSetSearchScope?.("elements");
            }
            return;
          case "2":
            // Cmd+2 = Search scope: Components
            if (isSearchOpen) {
              event.preventDefault();
              onSetSearchScope?.("components");
            }
            return;
          case "3":
            // Cmd+3 = Search scope: Layers
            if (isSearchOpen) {
              event.preventDefault();
              onSetSearchScope?.("layers");
            }
            return;
          case "4":
            // Cmd+4 = Search scope: Assets
            if (isSearchOpen) {
              event.preventDefault();
              onSetSearchScope?.("assets");
            }
            return;
        }
      }
    },
    [setEditorMode, editorMode, copySelectionToClipboard, clearSelection, textEditMode, undoStyle, redoStyle, onOpenSearch, onSetSearchScope, isSearchOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
