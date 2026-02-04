/**
 * Zustand slice for mutation diff accumulation.
 *
 * Accumulates diffs received from the content script, supports clear/revert actions,
 * and exposes grouped-by-element views.
 */

import type { StateCreator } from 'zustand';
import type { MutationDiff } from '@flow/shared';

export interface MutationSlice {
  /** All accumulated mutation diffs */
  mutationDiffs: MutationDiff[];

  /** Add a diff from the content script */
  addMutationDiff: (diff: MutationDiff) => void;

  /** Remove a specific diff (after revert) */
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

  addMutationDiff: (diff) =>
    set((state) => ({
      mutationDiffs: [...state.mutationDiffs, diff],
    })),

  removeMutationDiff: (mutationId) =>
    set((state) => ({
      mutationDiffs: state.mutationDiffs.filter((d) => d.id !== mutationId),
    })),

  clearMutationDiffs: () => set({ mutationDiffs: [] }),

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
