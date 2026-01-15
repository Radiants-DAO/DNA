import { useEffect, useCallback } from "react";
import { useAppStore } from "../stores/appStore";

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
 *
 * Note: Text Edit mode handles its own Escape key to copy edits to clipboard.
 */
export function useKeyboardShortcuts() {
  const setEditorMode = useAppStore((s) => s.setEditorMode);
  const editorMode = useAppStore((s) => s.editorMode);
  const copySelectionToClipboard = useAppStore((s) => s.copySelectionToClipboard);
  const textEditMode = useAppStore((s) => s.textEditMode);

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
            // Exit any mode back to component-id (default)
            if (editorMode !== "component-id") {
              setEditorMode("component-id");
            }
            return;
        }
      }

      // Cmd/Ctrl shortcuts
      if (isMeta) {
        switch (event.key.toLowerCase()) {
          case "c":
            // Let browser handle if text is selected, otherwise copy component selection
            if (!window.getSelection()?.toString()) {
              event.preventDefault();
              copySelectionToClipboard();
            }
            return;
          case "z":
            if (event.shiftKey) {
              // Cmd+Shift+Z = Redo
              // TODO: Integrate with undo/redo system when implemented
              console.log("[Shortcut] Redo");
            } else {
              // Cmd+Z = Undo
              // TODO: Integrate with undo/redo system when implemented
              console.log("[Shortcut] Undo");
            }
            return;
        }
      }
    },
    [setEditorMode, editorMode, copySelectionToClipboard, textEditMode]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
