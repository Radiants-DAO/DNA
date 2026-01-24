import type { StateCreator } from "zustand";
import type { AppState, RadflowId, SourceLocation } from "../types";

/**
 * A single style edit with source location for file write.
 */
export interface StyleEdit {
  id: string;
  radflowId: RadflowId;
  componentName: string;
  source: SourceLocation;
  property: string;
  oldValue: string;
  newValue: string;
  timestamp: number;
}

/**
 * Edits slice state and actions.
 *
 * Implementation: fn-5.6
 */
export interface EditsSlice {
  // State
  pendingStyleEdits: StyleEdit[];
  editsByFile: Map<string, StyleEdit[]>;

  // Actions
  addStyleEdit: (
    edit: Omit<StyleEdit, "id" | "timestamp">
  ) => void;
  removeStyleEdit: (id: string) => void;
  removeStyleEditsByRadflowId: (radflowId: RadflowId) => void;
  undoLastStyleEdit: () => StyleEdit | null;
  clearAllStyleEdits: () => void;

  // Getters
  getStyleEditsByFile: () => Map<string, StyleEdit[]>;
  getStyleEditsForComponent: (radflowId: RadflowId) => StyleEdit[];
  getStyleEditCount: () => number;
}

/**
 * Generate a simple unique ID.
 */
function generateId(): string {
  return `edit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Group edits by source file path.
 */
function groupEditsByFile(edits: StyleEdit[]): Map<string, StyleEdit[]> {
  const grouped = new Map<string, StyleEdit[]>();
  for (const edit of edits) {
    const filePath = edit.source.filePath;
    const existing = grouped.get(filePath) || [];
    grouped.set(filePath, [...existing, edit]);
  }
  return grouped;
}

export const createEditsSlice: StateCreator<
  AppState,
  [],
  [],
  EditsSlice
> = (set, get) => ({
  // Initial state
  pendingStyleEdits: [],
  editsByFile: new Map(),

  // Actions
  addStyleEdit: (editData) => {
    const edit: StyleEdit = {
      ...editData,
      id: generateId(),
      timestamp: Date.now(),
    };

    set((state) => {
      const newEdits = [...state.pendingStyleEdits, edit];
      return {
        pendingStyleEdits: newEdits,
        editsByFile: groupEditsByFile(newEdits),
      };
    });
  },

  removeStyleEdit: (id) => {
    set((state) => {
      const newEdits = state.pendingStyleEdits.filter((e) => e.id !== id);
      return {
        pendingStyleEdits: newEdits,
        editsByFile: groupEditsByFile(newEdits),
      };
    });
  },

  removeStyleEditsByRadflowId: (radflowId) => {
    set((state) => {
      const newEdits = state.pendingStyleEdits.filter(
        (e) => e.radflowId !== radflowId
      );
      return {
        pendingStyleEdits: newEdits,
        editsByFile: groupEditsByFile(newEdits),
      };
    });
  },

  undoLastStyleEdit: () => {
    const edits = get().pendingStyleEdits;
    if (edits.length === 0) return null;

    const lastEdit = edits[edits.length - 1];
    set((state) => {
      const newEdits = state.pendingStyleEdits.slice(0, -1);
      return {
        pendingStyleEdits: newEdits,
        editsByFile: groupEditsByFile(newEdits),
      };
    });

    return lastEdit;
  },

  clearAllStyleEdits: () => {
    set({
      pendingStyleEdits: [],
      editsByFile: new Map(),
    });
  },

  // Getters
  getStyleEditsByFile: () => {
    return get().editsByFile;
  },

  getStyleEditsForComponent: (radflowId) => {
    return get().pendingStyleEdits.filter((e) => e.radflowId === radflowId);
  },

  getStyleEditCount: () => {
    return get().pendingStyleEdits.length;
  },
});
