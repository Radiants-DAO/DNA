import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { AnimationDiff } from '@flow/shared';

export interface AnimationDiffsSlice {
  animationDiffs: AnimationDiff[];
  addAnimationDiff: (diff: AnimationDiff) => void;
  removeAnimationDiff: (id: string) => void;
  clearAnimationDiffs: () => void;
}

export const createAnimationDiffsSlice: StateCreator<AppState, [], [], AnimationDiffsSlice> = (set) => ({
  animationDiffs: [],

  addAnimationDiff: (diff) => set((s) => ({ animationDiffs: [...s.animationDiffs, diff] })),
  removeAnimationDiff: (id) =>
    set((s) => ({ animationDiffs: s.animationDiffs.filter((d) => d.id !== id) })),
  clearAnimationDiffs: () => set({ animationDiffs: [] }),
});
