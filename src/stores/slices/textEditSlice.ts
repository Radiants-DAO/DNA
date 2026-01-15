import type { StateCreator } from "zustand";
import type { AppState, TextEditSlice, TextEdit } from "../types";

export const createTextEditSlice: StateCreator<
  AppState,
  [],
  [],
  TextEditSlice
> = (set, get) => ({
  textEditMode: false,
  directWriteMode: false,
  pendingEdits: [],

  setTextEditMode: (active) => {
    set({ textEditMode: active });
    // Exit other modes when entering text edit mode
    if (active) {
      set({ componentIdMode: false, previewMode: false, editorMode: "text-edit" });
    }
  },

  setDirectWriteMode: (enabled) => set({ directWriteMode: enabled }),

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
});
