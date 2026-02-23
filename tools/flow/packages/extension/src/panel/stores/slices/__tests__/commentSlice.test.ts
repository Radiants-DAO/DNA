import { describe, expect, it, vi, beforeEach } from 'vitest';
import { create } from 'zustand';
import type { CommentSlice } from '../../types';
import type { PanelToBackgroundMessage } from '@flow/shared';

// Mock sendToContent before importing the slice
const mockSendToContent = vi.fn();
vi.mock('../../../api/contentBridge', () => ({
  sendToContent: (...args: unknown[]) => mockSendToContent(...args),
}));

// Import after mock setup
const { createCommentSlice } = await import('../commentSlice');

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
  beforeEach(() => {
    mockSendToContent.mockClear();
  });

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

  it('setActiveFeedbackType dispatches panel:set-feedback-type to content script', () => {
    const store = createTestStore();

    store.getState().setActiveFeedbackType('comment');

    expect(mockSendToContent).toHaveBeenCalledWith({
      type: 'panel:set-feedback-type',
      payload: { type: 'comment' },
    });
    expect(store.getState().activeFeedbackType).toBe('comment');
    expect(store.getState().editorMode).toBe('comment');
    expect(store.getState().activePanel).toBe('feedback');
  });

  it('setActiveFeedbackType dispatches question type', () => {
    const store = createTestStore();

    store.getState().setActiveFeedbackType('question');

    expect(mockSendToContent).toHaveBeenCalledWith({
      type: 'panel:set-feedback-type',
      payload: { type: 'question' },
    });
    expect(store.getState().activeFeedbackType).toBe('question');
  });

  it('setActiveFeedbackType(null) resets and dispatches null type', () => {
    const store = createTestStore();

    // Activate first
    store.getState().setActiveFeedbackType('comment');
    mockSendToContent.mockClear();

    // Reset
    store.getState().setActiveFeedbackType(null);

    expect(mockSendToContent).toHaveBeenCalledWith({
      type: 'panel:set-feedback-type',
      payload: { type: null },
    });
    expect(store.getState().activeFeedbackType).toBeNull();
    expect(store.getState().hoveredCommentElement).toBeNull();
    expect(store.getState().selectedCommentElements).toEqual([]);
  });
});
