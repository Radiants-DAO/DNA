import type { StateCreator } from "zustand";
import type { AppState, TextEditSlice, TextEdit, DirectWriteRecord } from "../types";
import { commands } from "../../bindings";

export const createTextEditSlice: StateCreator<
  AppState,
  [],
  [],
  TextEditSlice
> = (set, get) => ({
  textEditMode: false,
  directWriteMode: false,
  pendingEdits: [],
  undoStack: [],
  redoStack: [],
  fileModifications: new Map(),
  conflictFile: null,
  conflictChoice: null,

  setTextEditMode: (active) => {
    set({ textEditMode: active });
    // Exit other modes when entering text edit mode
    if (active) {
      set({ componentIdMode: false, previewMode: false, editorMode: "text-edit" });
    }
  },

  setDirectWriteMode: (enabled) => {
    set({ directWriteMode: enabled });
    // Persist preference to localStorage
    try {
      localStorage.setItem("radflow:directWriteMode", JSON.stringify(enabled));
    } catch (e) {
      console.error("Failed to persist directWriteMode:", e);
    }
  },

  addPendingEdit: (edit) => {
    const newEdit: TextEdit = {
      ...edit,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    set((state) => ({
      pendingEdits: [...state.pendingEdits, newEdit],
    }));
  },

  removePendingEdit: (id) => {
    set((state) => ({
      pendingEdits: state.pendingEdits.filter((e) => e.id !== id),
    }));
  },

  clearPendingEdits: () => set({ pendingEdits: [] }),

  copyEditsToClipboard: async () => {
    const { pendingEdits } = get();
    if (pendingEdits.length === 0) return;

    // Format edits for clipboard (useful for LLM context)
    const text = pendingEdits
      .map(
        (edit) =>
          `// ${edit.componentName} @ ${edit.file}:${edit.line}\n` +
          `- "${edit.originalText}"\n+ "${edit.newText}"`
      )
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy edits to clipboard:", err);
    }
  },

  writeTextChange: async (file, line, originalText, newText) => {
    const { fileModifications } = get();

    // Check for external modifications first
    const hasConflict = await get().checkFileConflict(file);
    if (hasConflict) {
      return { success: false, error: "File has been modified externally" };
    }

    try {
      const result = await commands.writeTextChange(file, line, originalText, newText);

      if (result.success && result.modifiedAt) {
        // Record the change for undo
        const record: DirectWriteRecord = {
          id: crypto.randomUUID(),
          file,
          line,
          originalText,
          newText,
          timestamp: Date.now(),
          fileModifiedAt: result.modifiedAt,
        };

        // Update state
        set((state) => ({
          undoStack: [...state.undoStack, record],
          redoStack: [], // Clear redo stack on new change
          fileModifications: new Map(state.fileModifications).set(file, result.modifiedAt!),
        }));

        return { success: true };
      }

      return { success: false, error: result.error || "Unknown error" };
    } catch (err) {
      console.error("Failed to write text change:", err);
      return { success: false, error: String(err) };
    }
  },

  undo: async () => {
    const { undoStack } = get();
    if (undoStack.length === 0) {
      return { success: false, error: "Nothing to undo" };
    }

    const lastChange = undoStack[undoStack.length - 1];

    try {
      // Revert the change (swap new and original)
      const result = await commands.revertTextChange(
        lastChange.file,
        lastChange.line,
        lastChange.newText,
        lastChange.originalText
      );

      if (result.success && result.modifiedAt) {
        // Move from undo stack to redo stack
        set((state) => ({
          undoStack: state.undoStack.slice(0, -1),
          redoStack: [...state.redoStack, lastChange],
          fileModifications: new Map(state.fileModifications).set(
            lastChange.file,
            result.modifiedAt!
          ),
        }));

        return { success: true };
      }

      return { success: false, error: result.error || "Unknown error" };
    } catch (err) {
      console.error("Failed to undo:", err);
      return { success: false, error: String(err) };
    }
  },

  redo: async () => {
    const { redoStack } = get();
    if (redoStack.length === 0) {
      return { success: false, error: "Nothing to redo" };
    }

    const lastUndone = redoStack[redoStack.length - 1];

    try {
      // Re-apply the change
      const result = await commands.writeTextChange(
        lastUndone.file,
        lastUndone.line,
        lastUndone.originalText,
        lastUndone.newText
      );

      if (result.success && result.modifiedAt) {
        // Move from redo stack back to undo stack
        set((state) => ({
          redoStack: state.redoStack.slice(0, -1),
          undoStack: [...state.undoStack, { ...lastUndone, fileModifiedAt: result.modifiedAt! }],
          fileModifications: new Map(state.fileModifications).set(
            lastUndone.file,
            result.modifiedAt!
          ),
        }));

        return { success: true };
      }

      return { success: false, error: result.error || "Unknown error" };
    } catch (err) {
      console.error("Failed to redo:", err);
      return { success: false, error: String(err) };
    }
  },

  clearUndoHistory: () => {
    set({ undoStack: [], redoStack: [], fileModifications: new Map() });
  },

  checkFileConflict: async (file) => {
    const { fileModifications } = get();
    const lastKnown = fileModifications.get(file);

    // If we haven't tracked this file yet, no conflict
    if (!lastKnown) {
      return false;
    }

    try {
      const info = await commands.getFileInfo(file);
      if (!info.exists) {
        // File was deleted externally
        set({ conflictFile: file });
        return true;
      }

      // Check if file was modified since our last write
      if (info.modifiedAt > lastKnown) {
        set({ conflictFile: file });
        return true;
      }

      return false;
    } catch (err) {
      console.error("Failed to check file info:", err);
      return false;
    }
  },

  setConflictChoice: (choice) => {
    set({ conflictChoice: choice });
  },

  resolveConflict: () => {
    const { conflictChoice, conflictFile, fileModifications } = get();

    if (conflictChoice === "overwrite" && conflictFile) {
      // Update our tracking to current time - allow next write
      commands.getFileInfo(conflictFile).then((info) => {
        if (info.exists) {
          set({
            fileModifications: new Map(fileModifications).set(conflictFile, info.modifiedAt),
            conflictFile: null,
            conflictChoice: null,
          });
        }
      });
    } else if (conflictChoice === "reload" || conflictChoice === "cancel") {
      // Clear conflict state - user will reload or cancel the edit
      set({ conflictFile: null, conflictChoice: null });
    }
  },
});

// Initialize directWriteMode from localStorage
export function initDirectWriteMode(): boolean {
  try {
    const stored = localStorage.getItem("radflow:directWriteMode");
    if (stored !== null) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to read directWriteMode from localStorage:", e);
  }
  return false;
}
