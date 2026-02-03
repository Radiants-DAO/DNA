import type { StateCreator } from "zustand";
import type { AppState, RadflowId, SourceLocation, StyleChange, SerializedComponentEntry } from "../types";

/**
 * Editing Slice
 *
 * Merged from selectionSlice + editsSlice + undoSlice.
 * Manages component selection, style edit accumulation, and undo/redo.
 */

// ---- Types (from editsSlice) ----

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

// ---- Helpers ----

function generateId(): string {
  return `edit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function groupEditsByFile(edits: StyleEdit[]): Map<string, StyleEdit[]> {
  const grouped = new Map<string, StyleEdit[]>();
  for (const edit of edits) {
    const filePath = edit.source.filePath;
    const existing = grouped.get(filePath) || [];
    grouped.set(filePath, [...existing, edit]);
  }
  return grouped;
}

const DEFAULT_MAX_HISTORY = 100;

// ---- Slice Interface ----

export interface EditingSlice {
  // Selection state (from selectionSlice)
  selectedEntry: SerializedComponentEntry | null;
  multiSelectEnabled: boolean;
  selectedIds: Set<RadflowId>;

  // Selection actions
  selectById: (radflowId: RadflowId) => void;
  addToMultiSelect: (radflowId: RadflowId) => void;
  removeFromMultiSelect: (radflowId: RadflowId) => void;
  toggleMultiSelect: (radflowId: RadflowId) => void;
  clearMultiSelect: () => void;
  setMultiSelectEnabled: (enabled: boolean) => void;
  getSelectedSource: () => SourceLocation | null;
  getSelectedFallbackSelectors: () => string[];
  isSelected: (radflowId: RadflowId) => boolean;

  // Edit accumulation state (from editsSlice)
  pendingStyleEdits: StyleEdit[];
  editsByFile: Map<string, StyleEdit[]>;

  // Edit accumulation actions
  addStyleEdit: (edit: Omit<StyleEdit, "id" | "timestamp">) => void;
  removeStyleEdit: (id: string) => void;
  removeStyleEditsByRadflowId: (radflowId: RadflowId) => void;
  undoLastStyleEdit: () => StyleEdit | null;
  clearAllStyleEdits: () => void;
  getStyleEditsByFile: () => Map<string, StyleEdit[]>;
  getStyleEditsForComponent: (radflowId: RadflowId) => StyleEdit[];
  getStyleEditCount: () => number;

  // Undo/redo state (from undoSlice)
  styleUndoStack: StyleChange[];
  styleRedoStack: StyleChange[];
  maxStyleHistory: number;

  // Undo/redo actions
  pushStyleChange: (change: Omit<StyleChange, "id" | "timestamp">) => void;
  undoStyleChange: () => StyleChange | null;
  redoStyleChange: () => StyleChange | null;
  clearStyleHistory: () => void;
  getStyleUndoCount: () => number;
  getStyleRedoCount: () => number;
  canUndoStyle: () => boolean;
  canRedoStyle: () => boolean;
}

export const createEditingSlice: StateCreator<
  AppState,
  [],
  [],
  EditingSlice
> = (set, get) => ({
  // Selection state
  selectedEntry: null,
  multiSelectEnabled: false,
  selectedIds: new Set(),

  // Selection actions
  selectById: (radflowId) => {
    const entry = get().bridgeComponentLookup.get(radflowId);
    if (entry) {
      const source = entry.source;
      const fallbackSelectors = entry.fallbackSelectors;
      set({
        selectedEntry: entry,
        bridgeSelection: { radflowId, source, fallbackSelectors },
      });
    }
  },

  addToMultiSelect: (radflowId) => {
    const currentIds = get().selectedIds;
    if (!currentIds.has(radflowId)) {
      const newIds = new Set(currentIds);
      newIds.add(radflowId);
      set({ selectedIds: newIds });
    }
  },

  removeFromMultiSelect: (radflowId) => {
    const currentIds = get().selectedIds;
    if (currentIds.has(radflowId)) {
      const newIds = new Set(currentIds);
      newIds.delete(radflowId);
      set({ selectedIds: newIds });
    }
  },

  toggleMultiSelect: (radflowId) => {
    const currentIds = get().selectedIds;
    const newIds = new Set(currentIds);
    if (newIds.has(radflowId)) {
      newIds.delete(radflowId);
    } else {
      newIds.add(radflowId);
    }
    set({ selectedIds: newIds });
  },

  clearMultiSelect: () => {
    set({ selectedIds: new Set() });
  },

  setMultiSelectEnabled: (enabled) => {
    set({
      multiSelectEnabled: enabled,
      selectedIds: enabled ? get().selectedIds : new Set(),
    });
  },

  getSelectedSource: () => {
    const selection = get().bridgeSelection;
    return selection?.source ?? null;
  },

  getSelectedFallbackSelectors: () => {
    const selection = get().bridgeSelection;
    return selection?.fallbackSelectors ?? [];
  },

  isSelected: (radflowId) => {
    const state = get();
    if (state.multiSelectEnabled) {
      return state.selectedIds.has(radflowId);
    }
    return state.bridgeSelection?.radflowId === radflowId;
  },

  // Edit accumulation state
  pendingStyleEdits: [],
  editsByFile: new Map(),

  // Edit accumulation actions
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

  getStyleEditsByFile: () => {
    return get().editsByFile;
  },

  getStyleEditsForComponent: (radflowId) => {
    return get().pendingStyleEdits.filter((e) => e.radflowId === radflowId);
  },

  getStyleEditCount: () => {
    return get().pendingStyleEdits.length;
  },

  // Undo/redo state
  styleUndoStack: [],
  styleRedoStack: [],
  maxStyleHistory: DEFAULT_MAX_HISTORY,

  // Undo/redo actions
  pushStyleChange: (change) => {
    const newChange: StyleChange = {
      ...change,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    set((state) => {
      let newUndoStack = [...state.styleUndoStack, newChange];

      if (newUndoStack.length > state.maxStyleHistory) {
        newUndoStack = newUndoStack.slice(-state.maxStyleHistory);
      }

      return {
        styleUndoStack: newUndoStack,
        styleRedoStack: [],
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
