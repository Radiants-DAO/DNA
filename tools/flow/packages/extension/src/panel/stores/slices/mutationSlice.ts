/**
 * Zustand slice for mutation state from the unified engine.
 *
 * Receives net diffs + undo/redo state from the content script's unified engine
 * via mutation:state events. Exposes grouped-by-element views.
 */

import type { StateCreator } from 'zustand';
import type { MutationDiff } from '@flow/shared';

export interface MutationSlice {
  /** Net diffs from engine — one per element+property, first oldValue → last newValue */
  mutationDiffs: MutationDiff[];
  /** Engine undo/redo state */
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;

  /** Replace all diffs with net diffs from engine state broadcast */
  setMutationState: (state: {
    netDiffs: MutationDiff[];
    canUndo: boolean;
    canRedo: boolean;
    undoCount: number;
    redoCount: number;
  }) => void;

  /** Add a single diff (legacy compat) */
  addMutationDiff: (diff: MutationDiff) => void;

  /** Remove a specific diff (legacy compat) */
  removeMutationDiff: (mutationId: string) => void;

  /** Clear all diffs */
  clearMutationDiffs: () => void;

  /** Get diffs grouped by element selector */
  getMutationsByElement: () => Map<string, MutationDiff[]>;
}

export const createMutationSlice: StateCreator<
  MutationSlice,
  [],
  [],
  MutationSlice
> = (set, get) => ({
  mutationDiffs: [],
  canUndo: false,
  canRedo: false,
  undoCount: 0,
  redoCount: 0,

  setMutationState: ({ netDiffs, canUndo, canRedo, undoCount, redoCount }) =>
    set({
      mutationDiffs: netDiffs,
      canUndo,
      canRedo,
      undoCount,
      redoCount,
    }),

  addMutationDiff: (diff) =>
    set((state) => ({
      mutationDiffs: [...state.mutationDiffs, diff],
    })),

  removeMutationDiff: (mutationId) =>
    set((state) => ({
      mutationDiffs: state.mutationDiffs.filter((d) => d.id !== mutationId),
    })),

  clearMutationDiffs: () => set({ mutationDiffs: [], canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 }),

  getMutationsByElement: () => {
    const grouped = new Map<string, MutationDiff[]>();
    for (const diff of get().mutationDiffs) {
      const key = diff.element.selector;
      const existing = grouped.get(key) ?? [];
      existing.push(diff);
      grouped.set(key, existing);
    }
    return grouped;
  },
});
