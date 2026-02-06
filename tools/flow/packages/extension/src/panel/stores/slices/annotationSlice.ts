import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { Annotation } from '@flow/shared';

export interface AnnotationSlice {
  annotations: Annotation[];
  isAnnotationMode: boolean;

  toggleAnnotationMode: () => void;
  addAnnotation: (data: Omit<Annotation, 'id' | 'timestamp'>) => void;
  updateAnnotation: (id: string, text: string) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
}

export const createAnnotationSlice: StateCreator<AppState, [], [], AnnotationSlice> = (set) => ({
  annotations: [],
  isAnnotationMode: false,

  toggleAnnotationMode: () => set((s) => ({ isAnnotationMode: !s.isAnnotationMode })),

  addAnnotation: (data) => {
    const annotation: Annotation = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    set((s) => ({ annotations: [...s.annotations, annotation] }));
  },

  updateAnnotation: (id, text) => {
    set((s) => ({
      annotations: s.annotations.map((a) => (a.id === id ? { ...a, text } : a)),
    }));
  },

  removeAnnotation: (id) => {
    set((s) => ({ annotations: s.annotations.filter((a) => a.id !== id) }));
  },

  clearAnnotations: () => set({ annotations: [] }),
});
