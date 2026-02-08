import { useEffect, useCallback, useRef, useState } from "react";

/**
 * Style change record for undo/redo
 */
export interface StyleChange {
  id: string;
  elementSelector: string;
  property: string;
  oldValue: string | null;
  newValue: string;
  timestamp: number;
}

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
 * Ported from Flow 0 - Provides:
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

  // Local undo/redo stacks since we don't have the full Zustand store
  const [styleUndoStack, setStyleUndoStack] = useState<StyleChange[]>([]);
  const [styleRedoStack, setStyleRedoStack] = useState<StyleChange[]>([]);

  const undoCount = styleUndoStack.length;
  const redoCount = styleRedoStack.length;
  const canUndo = undoCount > 0;
  const canRedo = redoCount > 0;

  /**
   * Push a new style change and optionally apply it.
   */
  const pushChange = useCallback(
    (change: Omit<StyleChange, "id" | "timestamp">) => {
      const fullChange: StyleChange = {
        ...change,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
      };
      setStyleUndoStack((prev) => [...prev, fullChange]);
      // Clear redo stack when new change is pushed
      setStyleRedoStack([]);
    },
    []
  );

  /**
   * Undo the last style change.
   */
  const undo = useCallback(() => {
    const change = styleUndoStack[styleUndoStack.length - 1];
    if (!change) return null;

    // Move from undo to redo stack
    setStyleUndoStack((prev) => prev.slice(0, -1));
    setStyleRedoStack((prev) => [...prev, change]);

    // Apply the old value to revert the change
    if (onApplyStyleRef.current) {
      onApplyStyleRef.current(
        change.elementSelector,
        change.property,
        change.oldValue
      );
    }
    return change;
  }, [styleUndoStack]);

  /**
   * Redo the last undone style change.
   */
  const redo = useCallback(() => {
    const change = styleRedoStack[styleRedoStack.length - 1];
    if (!change) return null;

    // Move from redo to undo stack
    setStyleRedoStack((prev) => prev.slice(0, -1));
    setStyleUndoStack((prev) => [...prev, change]);

    // Apply the new value to re-apply the change
    if (onApplyStyleRef.current) {
      onApplyStyleRef.current(
        change.elementSelector,
        change.property,
        change.newValue
      );
    }
    return change;
  }, [styleRedoStack]);

  /**
   * Clear all history (called on session end).
   */
  const clearHistory = useCallback(() => {
    setStyleUndoStack([]);
    setStyleRedoStack([]);
  }, []);

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
