import type { StateCreator } from "zustand";
import type { AppState, StyleChange } from "../types";

/**
 * Undo/Redo Slice
 *
 * Manages undo/redo stacks for style injection changes.
 * These are live CSS changes applied to elements in the preview iframe,
 * NOT file writes (those are handled via clipboard context output per fn-9).
 *
 * From: fn-7.21 (Undo/Redo Stack - Local session history)
 */

const DEFAULT_MAX_HISTORY = 100;

export interface UndoSlice {
  /** Stack of changes that can be undone */
  styleUndoStack: StyleChange[];
  /** Stack of undone changes that can be redone */
  styleRedoStack: StyleChange[];
  /** Maximum number of changes to keep in history */
  maxStyleHistory: number;

  /** Push a new style change to the undo stack */
  pushStyleChange: (change: Omit<StyleChange, "id" | "timestamp">) => void;
  /** Undo the last style change */
  undoStyleChange: () => StyleChange | null;
  /** Redo the last undone style change */
  redoStyleChange: () => StyleChange | null;
  /** Clear both undo and redo stacks */
  clearStyleHistory: () => void;
  /** Get the count of undoable changes */
  getStyleUndoCount: () => number;
  /** Get the count of redoable changes */
  getStyleRedoCount: () => number;
  /** Check if undo is available */
  canUndoStyle: () => boolean;
  /** Check if redo is available */
  canRedoStyle: () => boolean;
}

export const createUndoSlice: StateCreator<
  AppState,
  [],
  [],
  UndoSlice
> = (set, get) => ({
  styleUndoStack: [],
  styleRedoStack: [],
  maxStyleHistory: DEFAULT_MAX_HISTORY,

  pushStyleChange: (change) => {
    const newChange: StyleChange = {
      ...change,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    set((state) => {
      // Add to undo stack, clear redo stack (new change invalidates redo)
      let newUndoStack = [...state.styleUndoStack, newChange];

      // Trim to max history size
      if (newUndoStack.length > state.maxStyleHistory) {
        newUndoStack = newUndoStack.slice(-state.maxStyleHistory);
      }

      return {
        styleUndoStack: newUndoStack,
        styleRedoStack: [], // Clear redo on new change
      };
    });
  },

  undoStyleChange: () => {
    const { styleUndoStack } = get();
    if (styleUndoStack.length === 0) {
      return null;
    }

    const lastChange = styleUndoStack[styleUndoStack.length - 1];

    set((state) => ({
      styleUndoStack: state.styleUndoStack.slice(0, -1),
      styleRedoStack: [...state.styleRedoStack, lastChange],
    }));

    return lastChange;
  },

  redoStyleChange: () => {
    const { styleRedoStack } = get();
    if (styleRedoStack.length === 0) {
      return null;
    }

    const lastUndone = styleRedoStack[styleRedoStack.length - 1];

    set((state) => ({
      styleRedoStack: state.styleRedoStack.slice(0, -1),
      styleUndoStack: [...state.styleUndoStack, lastUndone],
    }));

    return lastUndone;
  },

  clearStyleHistory: () => {
    set({ styleUndoStack: [], styleRedoStack: [] });
  },

  getStyleUndoCount: () => get().styleUndoStack.length,

  getStyleRedoCount: () => get().styleRedoStack.length,

  canUndoStyle: () => get().styleUndoStack.length > 0,

  canRedoStyle: () => get().styleRedoStack.length > 0,
});
