import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PanelToBackgroundMessage } from '@flow/shared';

const commentBadgeMocks = vi.hoisted(() => ({
  addCommentBadge: vi.fn(),
  updateCommentBadge: vi.fn(),
  removeCommentBadge: vi.fn(),
  clearCommentBadges: vi.fn(),
  repositionCommentBadges: vi.fn(),
  openCommentComposer: vi.fn(),
  setCommentBadgeCallbacks: vi.fn(),
}));

vi.mock('../commentBadges', () => ({
  addCommentBadge: commentBadgeMocks.addCommentBadge,
  updateCommentBadge: commentBadgeMocks.updateCommentBadge,
  removeCommentBadge: commentBadgeMocks.removeCommentBadge,
  clearCommentBadges: commentBadgeMocks.clearCommentBadges,
  repositionCommentBadges: commentBadgeMocks.repositionCommentBadges,
  openCommentComposer: commentBadgeMocks.openCommentComposer,
  setCommentBadgeCallbacks: commentBadgeMocks.setCommentBadgeCallbacks,
}));

import { initPanelRouter } from '../panelRouter';

type PanelMessageListener = (msg: PanelToBackgroundMessage) => void;
type DisconnectListener = () => void;

function createMockPort() {
  let messageListener: PanelMessageListener | null = null;
  const disconnectListeners: DisconnectListener[] = [];
  const postMessage = vi.fn();

  const port = {
    onMessage: {
      addListener: (listener: PanelMessageListener) => {
        messageListener = listener;
      },
    },
    onDisconnect: {
      addListener: (listener: DisconnectListener) => {
        disconnectListeners.push(listener);
      },
    },
    postMessage,
  } as unknown as chrome.runtime.Port;

  return {
    port,
    postMessage,
    emit: (msg: PanelToBackgroundMessage) => {
      messageListener?.(msg);
    },
    disconnect: () => {
      for (const listener of disconnectListeners) listener();
    },
  };
}

describe('panelRouter comment message wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes comment add, update, remove, and clear to badge helpers', async () => {
    const mock = createMockPort();
    initPanelRouter(mock.port);

    mock.emit({
      type: 'panel:comment',
      payload: {
        id: 'comment-1',
        type: 'comment',
        selector: '#target',
        componentName: 'Button',
        content: 'Initial content',
      },
    });
    await Promise.resolve();

    expect(commentBadgeMocks.addCommentBadge).toHaveBeenCalledWith({
      id: 'comment-1',
      selector: '#target',
      index: 0,
      type: 'comment',
      content: 'Initial content',
      componentName: 'Button',
      coordinates: undefined,
    });
    expect(mock.postMessage).toHaveBeenCalledWith({
      type: 'comment:result',
      payload: { id: 'comment-1', success: true },
    });

    mock.emit({
      type: 'panel:comment-update',
      payload: { id: 'comment-1', content: 'Updated content' },
    });
    await Promise.resolve();
    expect(commentBadgeMocks.updateCommentBadge).toHaveBeenCalledWith('comment-1', {
      content: 'Updated content',
    });

    mock.emit({
      type: 'panel:comment-remove',
      payload: { id: 'comment-1' },
    });
    await Promise.resolve();
    expect(commentBadgeMocks.removeCommentBadge).toHaveBeenCalledWith('comment-1');

    mock.emit({
      type: 'panel:comment-clear',
      payload: {},
    });
    await Promise.resolve();
    expect(commentBadgeMocks.clearCommentBadges).toHaveBeenCalledTimes(1);

    // Ensure module-level listeners are reset for subsequent tests.
    mock.disconnect();
  });

  it('emits canonical comment:submitted and comment:edited via badge callbacks', () => {
    const mock = createMockPort();
    initPanelRouter(mock.port);

    // Extract the callbacks that initPanelRouter registered
    const callbacksArg = commentBadgeMocks.setCommentBadgeCallbacks.mock.calls[0][0] as {
      onCreate: (payload: Record<string, unknown>) => void;
      onUpdate: (payload: Record<string, unknown>) => void;
    };

    // Simulate on-page comment creation (the real source path)
    callbacksArg.onCreate({
      id: 'on-page-1',
      type: 'comment',
      selector: '#hero',
      componentName: 'Hero',
      content: 'Created on page',
      coordinates: { x: 50, y: 100 },
    });

    expect(mock.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'comment:submitted',
        payload: expect.objectContaining({ id: 'on-page-1' }),
      })
    );

    // Simulate on-page comment edit
    callbacksArg.onUpdate({ id: 'on-page-1', content: 'Edited on page' });

    expect(mock.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'comment:edited',
        payload: expect.objectContaining({ id: 'on-page-1', content: 'Edited on page' }),
      })
    );

    mock.disconnect();
  });

  it('cleans up reposition listeners on disconnect', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const firstPort = createMockPort();
    initPanelRouter(firstPort.port);

    expect(addEventListenerSpy.mock.calls.filter((call) => call[0] === 'scroll')).toHaveLength(1);
    expect(addEventListenerSpy.mock.calls.filter((call) => call[0] === 'resize')).toHaveLength(1);

    firstPort.disconnect();

    expect(removeEventListenerSpy.mock.calls.some((call) => call[0] === 'scroll')).toBe(true);
    expect(removeEventListenerSpy.mock.calls.some((call) => call[0] === 'resize')).toBe(true);

    const secondPort = createMockPort();
    initPanelRouter(secondPort.port);

    expect(addEventListenerSpy.mock.calls.filter((call) => call[0] === 'scroll')).toHaveLength(2);
    expect(addEventListenerSpy.mock.calls.filter((call) => call[0] === 'resize')).toHaveLength(2);

    secondPort.disconnect();
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
