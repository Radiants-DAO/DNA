import { describe, expect, it } from 'vitest';
import { create } from 'zustand';
import type { CommentSlice } from '../../types';
import { createCommentSlice } from '../commentSlice';

type TestState = CommentSlice & {
  editorMode: 'cursor' | 'component-id' | 'text-edit' | 'comment';
  activePanel: 'colors' | 'typography' | 'spacing' | 'layout' | 'feedback' | null;
};

function createTestStore() {
  return create<TestState>()((set, get, store) => ({
    editorMode: 'cursor',
    activePanel: null,
    ...(createCommentSlice as unknown as (
      setState: typeof set,
      getState: typeof get,
      storeApi: typeof store,
    ) => CommentSlice)(set, get, store),
  }));
}

describe('commentSlice', () => {
  it('preserves caller-provided ids for comment/badge synchronization', () => {
    const store = createTestStore();

    store.getState().addComment({
      id: 'comment-fixed-id',
      type: 'comment',
      elementSelector: '#target',
      componentName: 'Button',
      devflowId: null,
      source: null,
      content: 'Keep this id stable',
      coordinates: { x: 10, y: 20 },
    });

    expect(store.getState().comments).toHaveLength(1);
    expect(store.getState().comments[0].id).toBe('comment-fixed-id');
  });
});
