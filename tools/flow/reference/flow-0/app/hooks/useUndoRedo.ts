import { useEffect, useCallback, useRef } from "react";
import { useAppStore, StyleChange } from "../stores/appStore";

/**
 * Configuration for the undo/redo hook.
 */
export interface UseUndoRedoOptions {
  /**
   * Callback to apply a style change to an element.
   * Called when undo/redo needs to update the DOM.
   */
  onApplyStyle?: (selector: string, property: string, value: string | null) => void;
  /**
   * Whether to enable keyboard shortcuts. Default: true
   */
  enableShortcuts?: boolean;
}

/**
 * Hook for managing undo/redo of style injection changes.
 *
 * Provides:
 * - Keyboard shortcuts (Cmd/Ctrl+Z for undo, Cmd/Ctrl+Shift+Z for redo)
 * - Methods to push, undo, redo changes
 * - State for UI indicators (counts, can undo/redo)
 *
 * @example
 * ```tsx
 * const { undo, redo, pushChange, undoCount, canUndo, canRedo } = useUndoRedo({
 *   onApplyStyle: (selector, property, value) => {
 *     // Apply style to iframe element
 *     const iframe = iframeRef.current;
 *     const element = iframe?.contentDocument?.querySelector(selector);
 *     if (element) {
 *       (element as HTMLElement).style[property as any] = value ?? '';
 *     }
 *   },
 * });
 * ```
 */
export function useUndoRedo(options: UseUndoRedoOptions = {}) {
  const { onApplyStyle, enableShortcuts = true } = options;

  // Store refs for callback stability
  const onApplyStyleRef = useRef(onApplyStyle);
  onApplyStyleRef.current = onApplyStyle;

  // Get store actions and state
  const pushStyleChange = useAppStore((s) => s.pushStyleChange);
  const undoStyleChange = useAppStore((s) => s.undoStyleChange);
  const redoStyleChange = useAppStore((s) => s.redoStyleChange);
  const clearStyleHistory = useAppStore((s) => s.clearStyleHistory);
  const styleUndoStack = useAppStore((s) => s.styleUndoStack);
  const styleRedoStack = useAppStore((s) => s.styleRedoStack);

  const undoCount = styleUndoStack.length;
  const redoCount = styleRedoStack.length;
  const canUndo = undoCount > 0;
  const canRedo = redoCount > 0;

  /**
   * Push a new style change and optionally apply it.
   */
  const pushChange = useCallback(
    (change: Omit<StyleChange, "id" | "timestamp">) => {
      pushStyleChange(change);
      // The change has already been applied when the user made it,
      // so we don't need to apply it again here
    },
    [pushStyleChange]
  );

  /**
   * Undo the last style change.
   */
  const undo = useCallback(() => {
    const change = undoStyleChange();
    if (change && onApplyStyleRef.current) {
      // Apply the old value to revert the change
      onApplyStyleRef.current(
        change.elementSelector,
        change.property,
        change.oldValue
      );
    }
    return change;
  }, [undoStyleChange]);

  /**
   * Redo the last undone style change.
   */
  const redo = useCallback(() => {
    const change = redoStyleChange();
    if (change && onApplyStyleRef.current) {
      // Apply the new value to re-apply the change
      onApplyStyleRef.current(
        change.elementSelector,
        change.property,
        change.newValue
      );
    }
    return change;
  }, [redoStyleChange]);

  /**
   * Clear all history (called on session end).
   */
  const clearHistory = useCallback(() => {
    clearStyleHistory();
  }, [clearStyleHistory]);

  // Keyboard shortcut handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMeta = event.metaKey || event.ctrlKey;

      if (isMeta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          // Cmd/Ctrl+Shift+Z = Redo
          redo();
        } else {
          // Cmd/Ctrl+Z = Undo
          undo();
        }
      }
    },
    [undo, redo]
  );

  // Register keyboard shortcuts
  useEffect(() => {
    if (!enableShortcuts) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enableShortcuts, handleKeyDown]);

  return {
    // Actions
    pushChange,
    undo,
    redo,
    clearHistory,
    // State
    undoCount,
    redoCount,
    canUndo,
    canRedo,
    // Raw stacks (for debugging/advanced use)
    undoStack: styleUndoStack,
    redoStack: styleRedoStack,
  };
}
