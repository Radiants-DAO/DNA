import { describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { createPromptBuilderSlice, type PromptBuilderSlice } from '../promptBuilderSlice';

describe('promptBuilderSlice', () => {
  it('starts with an empty prompt draft', () => {
    const store = create<PromptBuilderSlice>()(createPromptBuilderSlice);
    expect(store.getState().promptDraft).toEqual([]);
  });

  it('supports text and chip draft CRUD actions', () => {
    const store = create<PromptBuilderSlice>()(createPromptBuilderSlice);
    const api = store.getState();

    api.insertPromptDraftText('Change');
    api.insertPromptDraftChip({
      kind: 'element',
      label: '#hero > h1',
      selector: '#hero > h1',
    });

    const afterInsert = store.getState().promptDraft;
    expect(afterInsert).toHaveLength(2);
    expect(afterInsert[0].type).toBe('text');
    expect(afterInsert[1].type).toBe('chip');

    const textNode = afterInsert.find((node) => node.type === 'text');
    expect(textNode).toBeDefined();
    if (!textNode || textNode.type !== 'text') return;

    store.getState().updatePromptDraftText(textNode.id, 'Update');
    const updated = store.getState().promptDraft.find((node) => node.id === textNode.id);
    expect(updated && updated.type === 'text' ? updated.text : '').toBe('Update');

    const chipNode = store.getState().promptDraft.find((node) => node.type === 'chip');
    expect(chipNode).toBeDefined();
    if (!chipNode || chipNode.type !== 'chip') return;

    store.getState().removePromptDraftNode(chipNode.id);
    expect(store.getState().promptDraft).toHaveLength(1);
    expect(store.getState().promptDraft[0].type).toBe('text');
  });

  it('clears the prompt draft', () => {
    const store = create<PromptBuilderSlice>()(createPromptBuilderSlice);
    store.getState().insertPromptDraftText('Hello');
    expect(store.getState().promptDraft).toHaveLength(1);
    store.getState().clearPromptDraft();
    expect(store.getState().promptDraft).toHaveLength(0);
  });
});
