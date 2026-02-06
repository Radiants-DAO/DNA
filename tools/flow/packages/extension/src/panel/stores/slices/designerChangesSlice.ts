import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { DesignerChange } from '@flow/shared';

export interface DesignerChangesSlice {
  designerChanges: DesignerChange[];
  addDesignerChange: (data: Omit<DesignerChange, 'id' | 'timestamp'>) => void;
  updateDesignerChange: (id: string, updates: Partial<DesignerChange>) => void;
  removeDesignerChange: (id: string) => void;
  clearDesignerChanges: () => void;
}

export const createDesignerChangesSlice: StateCreator<AppState, [], [], DesignerChangesSlice> = (set) => ({
  designerChanges: [],

  addDesignerChange: (data) => {
    const change: DesignerChange = { ...data, id: crypto.randomUUID(), timestamp: Date.now() };
    set((s) => ({ designerChanges: [...s.designerChanges, change] }));
  },

  updateDesignerChange: (id, updates) => {
    set((s) => ({
      designerChanges: s.designerChanges.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  removeDesignerChange: (id) => {
    set((s) => ({ designerChanges: s.designerChanges.filter((c) => c.id !== id) }));
  },

  clearDesignerChanges: () => set({ designerChanges: [] }),
});
