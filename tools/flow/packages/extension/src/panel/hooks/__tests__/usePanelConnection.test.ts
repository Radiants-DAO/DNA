import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CommentSubmittedMessage, CommentEditedMessage } from '@flow/shared';

// ── Mocks ──

// Capture the onContentMessage callback so we can simulate messages
let contentMessageCallback: ((msg: unknown) => void) | null = null;

vi.mock('../../api/contentBridge', () => ({
  initContentBridge: vi.fn(() => ({
    onDisconnect: { addListener: vi.fn() },
    postMessage: vi.fn(),
  })),
  disconnectContentBridge: vi.fn(),
  onContentMessage: vi.fn((cb: (msg: unknown) => void) => {
    contentMessageCallback = cb;
    return () => { contentMessageCallback = null; };
  }),
}));

vi.mock('../useMutationBridge', () => ({
  useMutationBridge: () => ({
    applyStyle: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    clearAll: vi.fn(),
  }),
}));

vi.mock('../useTextEditBridge', () => ({
  useTextEditBridge: vi.fn(),
}));

vi.mock('../usePromptAutoCompile', () => ({
  usePromptAutoCompile: vi.fn(),
}));

vi.mock('../useSessionSync', () => ({
  useSessionSync: vi.fn(),
}));

vi.mock('../useSessionAutoSave', () => ({
  useSessionAutoSave: vi.fn(),
}));

vi.mock('../useSessionRestore', () => ({
  useSessionRestore: vi.fn(),
}));

vi.mock('../../../utils/runtimeSafety', () => ({
  isRuntimeMessagingError: () => false,
  safePortPostMessage: vi.fn(),
}));

vi.stubGlobal('chrome', {
  runtime: {
    connect: vi.fn(() => ({
      onMessage: { addListener: vi.fn() },
      onDisconnect: { addListener: vi.fn() },
      postMessage: vi.fn(),
    })),
  },
  devtools: undefined,
  storage: { session: { get: vi.fn(), set: vi.fn() } },
});

import { renderHook } from '@testing-library/react';
import { usePanelConnection } from '../usePanelConnection';
import { useAppStore } from '../../stores/appStore';

describe('usePanelConnection comment contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    contentMessageCallback = null;
    useAppStore.setState({
      comments: [],
      agentFeedback: [],
    });
  });

  afterEach(() => {
    contentMessageCallback = null;
  });

  it('adds a comment to the store on comment:submitted', () => {
    renderHook(() => usePanelConnection(1));

    const msg: CommentSubmittedMessage = {
      type: 'comment:submitted',
      payload: {
        id: 'c1',
        type: 'comment',
        selector: '#btn',
        componentName: 'Button',
        content: 'Needs more padding',
        coordinates: { x: 100, y: 200 },
      },
    };

    contentMessageCallback?.(msg);

    const comments = useAppStore.getState().comments;
    expect(comments).toHaveLength(1);
    expect(comments[0]).toMatchObject({
      id: 'c1',
      type: 'comment',
      elementSelector: '#btn',
      componentName: 'Button',
      content: 'Needs more padding',
    });
  });

  it('does not duplicate a comment with the same id', () => {
    useAppStore.setState({
      comments: [{
        id: 'c1',
        type: 'comment' as const,
        elementSelector: '#btn',
        componentName: 'Button',
        devflowId: null,
        source: null,
        content: 'Original',
        coordinates: { x: 0, y: 0 },
        timestamp: Date.now(),
      }],
    });

    renderHook(() => usePanelConnection(1));

    const msg: CommentSubmittedMessage = {
      type: 'comment:submitted',
      payload: {
        id: 'c1',
        type: 'comment',
        selector: '#btn',
        componentName: 'Button',
        content: 'Duplicate attempt',
        coordinates: { x: 100, y: 200 },
      },
    };

    contentMessageCallback?.(msg);

    const comments = useAppStore.getState().comments;
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe('Original');
  });

  it('updates comment content on comment:edited', () => {
    useAppStore.setState({
      comments: [{
        id: 'c1',
        type: 'comment' as const,
        elementSelector: '#btn',
        componentName: 'Button',
        devflowId: null,
        source: null,
        content: 'Original text',
        coordinates: { x: 0, y: 0 },
        timestamp: Date.now(),
      }],
    });

    renderHook(() => usePanelConnection(1));

    const msg: CommentEditedMessage = {
      type: 'comment:edited',
      payload: {
        id: 'c1',
        content: 'Updated text',
      },
    };

    contentMessageCallback?.(msg);

    const comments = useAppStore.getState().comments;
    expect(comments[0].content).toBe('Updated text');
  });
});
