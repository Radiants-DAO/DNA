import { describe, it, expect } from 'vitest';
import { create } from 'zustand';
import { createMutationSlice, type MutationSlice } from '../mutationSlice';
import type { MutationDiff } from '@flow/shared';

const makeDiff = (
  id: string,
  selector: string,
  property: string
): MutationDiff => ({
  id,
  element: { selector },
  type: 'style',
  changes: [{ property, oldValue: '0px', newValue: '10px' }],
  timestamp: new Date().toISOString(),
});

describe('mutationSlice', () => {
  it('starts with empty diffs', () => {
    const store = create<MutationSlice>()(createMutationSlice);
    expect(store.getState().mutationDiffs).toHaveLength(0);
  });

  it('accumulates diffs', () => {
    const store = create<MutationSlice>()(createMutationSlice);
    store.getState().addMutationDiff(makeDiff('1', '.a', 'margin'));
    store.getState().addMutationDiff(makeDiff('2', '.b', 'padding'));
    expect(store.getState().mutationDiffs).toHaveLength(2);
  });

  it('removes a specific diff', () => {
    const store = create<MutationSlice>()(createMutationSlice);
    store.getState().addMutationDiff(makeDiff('1', '.a', 'margin'));
    store.getState().addMutationDiff(makeDiff('2', '.b', 'padding'));
    store.getState().removeMutationDiff('1');
    expect(store.getState().mutationDiffs).toHaveLength(1);
    expect(store.getState().mutationDiffs[0].id).toBe('2');
  });

  it('clears all diffs', () => {
    const store = create<MutationSlice>()(createMutationSlice);
    store.getState().addMutationDiff(makeDiff('1', '.a', 'margin'));
    store.getState().addMutationDiff(makeDiff('2', '.b', 'padding'));
    store.getState().clearMutationDiffs();
    expect(store.getState().mutationDiffs).toHaveLength(0);
  });

  it('groups diffs by element selector', () => {
    const store = create<MutationSlice>()(createMutationSlice);
    store.getState().addMutationDiff(makeDiff('1', '.a', 'margin'));
    store.getState().addMutationDiff(makeDiff('2', '.a', 'padding'));
    store.getState().addMutationDiff(makeDiff('3', '.b', 'color'));

    const grouped = store.getState().getMutationsByElement();
    expect(grouped.get('.a')).toHaveLength(2);
    expect(grouped.get('.b')).toHaveLength(1);
  });

  it('returns empty map when no diffs', () => {
    const store = create<MutationSlice>()(createMutationSlice);
    const grouped = store.getState().getMutationsByElement();
    expect(grouped.size).toBe(0);
  });
});
