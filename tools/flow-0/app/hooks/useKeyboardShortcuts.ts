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
 * | C | Comment mode toggle (press again to return to cursor) |
 * | Q | Question mode toggle (press again to return to cursor) |
 * | Escape | Exit current mode (returns to cursor) |
 * | Cmd+C | Copy selection |
 * | Cmd+Shift+C | Copy feedback to clipboard |
 * | Cmd+Shift+X | Copy feedback and clear (in comment mode) |
 * | Cmd+Z | Undo |
 * | Cmd+Shift+Z | Redo |
 * | Cmd+F | Open search overlay |
 * | Cmd+B | Toggle Spatial Browser view |
 * | Cmd+1 | Search scope: Elements (when search is open) |
 * | Cmd+2 | Search scope: Components (when search is open) |
 * | Cmd+3 | Search scope: Layers (when search is open) |
 * | Cmd+4 | Search scope: Assets (when search is open) |
 *
 * Note: Text Edit mode handles its own Escape key to copy edits to clipboard.
 * Note: C/Q are radio toggles - pressing while in that mode exits to cursor.
 * Note: In comment mode with popover open, C/Q switch type without closing.
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
  // Derive textEditMode from editorMode (no longer a separate boolean)
  const textEditMode = editorMode === "text-edit";
  const activeFeedbackType = useAppStore((s) => s.activeFeedbackType);
  const setActiveFeedbackType = useAppStore((s) => s.setActiveFeedbackType);
  const selectedCommentElements = useAppStore((s) => s.selectedCommentElements);
  const copyCommentsToClipboard = useAppStore((s) => s.copyCommentsToClipboard);
  const clearComments = useAppStore((s) => s.clearComments);
  // Spatial browser toggle (view mode, independent of editorMode)
  const toggleSpatialBrowser = useAppStore((s) => s.toggleSpatialBrowser);

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
            // Radio toggle behavior for P key - toggle preview mode on/off
            if (editorMode === "preview") {
              setEditorMode("cursor");
            } else {
              setEditorMode("preview");
            }
            return;
          case "c":
            event.preventDefault();
            // Radio toggle behavior for C key:
            // - If popover is open (has selection), switch to comment type
            // - If already in comment mode with comment type, return to cursor
            // - Otherwise, enter comment mode with comment type
            if (editorMode === "comment" && selectedCommentElements.length > 0) {
              // Popover open - just switch the type without closing
              setActiveFeedbackType("comment");
            } else if (editorMode === "comment" && activeFeedbackType === "comment") {
              // Already in comment mode with comment type - toggle off to cursor
              setEditorMode("cursor");
            } else {
              // Enter comment mode or switch from question mode
              setActiveFeedbackType("comment");
            }
            return;
          case "q":
            event.preventDefault();
            // Radio toggle behavior for Q key:
            // - If popover is open (has selection), switch to question type
            // - If already in comment mode with question type, return to cursor
            // - Otherwise, enter comment mode with question type
            if (editorMode === "comment" && selectedCommentElements.length > 0) {
              // Popover open - just switch the type without closing
              setActiveFeedbackType("question");
            } else if (editorMode === "comment" && activeFeedbackType === "question") {
              // Already in question mode - toggle off to cursor
              setEditorMode("cursor");
            } else {
              // Enter question mode or switch from comment mode
              setActiveFeedbackType("question");
            }
            return;
          case "escape":
            // Text Edit mode handles its own Escape
            if (textEditMode) {
              return;
            }
            event.preventDefault();
            // In component-id mode, clear selection then exit to cursor
            // In other modes, return to cursor mode
            if (editorMode === "component-id") {
              clearSelection();
            }
            if (editorMode !== "cursor") {
              setEditorMode("cursor");
            }
            return;
        }
      }

      // Cmd/Ctrl shortcuts
      if (isMeta) {
        switch (event.key.toLowerCase()) {
          case "b":
            // Cmd+B = Toggle Spatial Browser view
            event.preventDefault();
            toggleSpatialBrowser();
            return;
          case "f":
            // Cmd+F = Open search overlay
            event.preventDefault();
            onOpenSearch?.();
            return;
          case "c":
            // Cmd+Shift+C = Copy comments to clipboard
            if (event.shiftKey) {
              event.preventDefault();
              copyCommentsToClipboard();
              return;
            }
            // Let browser handle if text is selected, otherwise copy component selection
            if (!window.getSelection()?.toString()) {
              event.preventDefault();
              copySelectionToClipboard();
            }
            return;
          case "x":
            // Cmd+Shift+X = Copy comments and clear (in comment mode)
            if (event.shiftKey && editorMode === "comment") {
              event.preventDefault();
              copyCommentsToClipboard();
              clearComments();
              return;
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
    [setEditorMode, editorMode, copySelectionToClipboard, clearSelection, textEditMode, activeFeedbackType, setActiveFeedbackType, selectedCommentElements, copyCommentsToClipboard, clearComments, toggleSpatialBrowser, undoStyle, redoStyle, onOpenSearch, onSetSearchScope, isSearchOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
