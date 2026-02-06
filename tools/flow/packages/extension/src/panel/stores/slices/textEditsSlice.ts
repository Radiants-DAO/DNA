import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { TextEdit } from '@flow/shared';

export interface TextEditsSlice {
  textEdits: TextEdit[];
  addTextEdit: (data: Omit<TextEdit, 'id' | 'timestamp'>) => void;
  updateTextEdit: (id: string, updates: Partial<TextEdit>) => void;
  removeTextEdit: (id: string) => void;
  clearTextEdits: () => void;
}

export const createTextEditsSlice: StateCreator<AppState, [], [], TextEditsSlice> = (set) => ({
  textEdits: [],

  addTextEdit: (data) => {
    const edit: TextEdit = { ...data, id: crypto.randomUUID(), timestamp: Date.now() };
    set((s) => ({ textEdits: [...s.textEdits, edit] }));
  },

  updateTextEdit: (id, updates) => {
    set((s) => ({
      textEdits: s.textEdits.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  },

  removeTextEdit: (id) => {
    set((s) => ({ textEdits: s.textEdits.filter((e) => e.id !== id) }));
  },

  clearTextEdits: () => set({ textEdits: [] }),
});
