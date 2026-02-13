import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MutationMessage } from '@flow/shared';
import { createUnifiedMutationEngine } from '../unifiedMutationEngine';
import { initMutationMessageHandler } from '../mutationMessageHandler';

type MessageListener = (message: MutationMessage) => void;
type DisconnectListener = () => void;

function createMockPort() {
  let listener: MessageListener | null = null;
  const disconnectListeners: DisconnectListener[] = [];
  const posted: unknown[] = [];

  const port = {
    onMessage: {
      addListener: (cb: MessageListener) => {
        listener = cb;
      },
    },
    onDisconnect: {
      addListener: (cb: DisconnectListener) => {
        disconnectListeners.push(cb);
      },
    },
    postMessage: (message: unknown) => {
      posted.push(message);
    },
  } as unknown as chrome.runtime.Port;

  return {
    port,
    emit: (message: MutationMessage) => listener?.(message),
    disconnect: () => disconnectListeners.forEach((cb) => cb()),
    posted,
  };
}

describe('mutationMessageHandler (unified)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  it('routes mutation:apply by selector and broadcasts debounced mutation:state', () => {
    const mock = createMockPort();
    const engine = createUnifiedMutationEngine();
    initMutationMessageHandler(mock.port, engine);

    const el = document.createElement('div');
    el.id = 'test-apply';
    document.body.appendChild(el);

    mock.emit({
      kind: 'mutation:apply',
      selector: '#test-apply',
      styleChanges: { color: 'blue' },
    });

    expect(el.style.color).toBe('blue');

    // Debounced state broadcast
    vi.advanceTimersByTime(200);
    expect(mock.posted.some((m) => (m as { kind?: string }).kind === 'mutation:state')).toBe(true);
  });

  it('handles mutation:undo and mutation:redo with immediate state feedback', () => {
    const mock = createMockPort();
    const engine = createUnifiedMutationEngine();
    initMutationMessageHandler(mock.port, engine);

    const el = document.createElement('div');
    el.id = 'test-undo-redo';
    el.style.color = 'red';
    document.body.appendChild(el);

    mock.emit({
      kind: 'mutation:apply',
      selector: '#test-undo-redo',
      styleChanges: { color: 'blue' },
    });
    vi.advanceTimersByTime(200);
    mock.posted.length = 0;

    mock.emit({ kind: 'mutation:undo' });
    expect(el.style.color).toBe('red');
    expect(mock.posted.at(-1)).toMatchObject({ kind: 'mutation:state', canRedo: true });

    mock.emit({ kind: 'mutation:redo' });
    // Redo re-applies the computed color value from the diff
    expect(['blue', 'rgb(0, 0, 255)']).toContain(el.style.color);
    expect(mock.posted.at(-1)).toMatchObject({ kind: 'mutation:state', canUndo: true });
  });

  it('maps legacy mutation:revert to undo/clear behavior', () => {
    const mock = createMockPort();
    const engine = createUnifiedMutationEngine();
    initMutationMessageHandler(mock.port, engine);

    const el = document.createElement('div');
    el.id = 'test-legacy';
    el.style.color = 'red';
    document.body.appendChild(el);

    mock.emit({
      kind: 'mutation:apply',
      selector: '#test-legacy',
      styleChanges: { color: 'blue' },
    });
    mock.emit({ kind: 'mutation:revert', mutationId: 'legacy-id' });
    expect(el.style.color).toBe('red');

    mock.emit({ kind: 'mutation:revert', mutationId: 'all' });
    expect(mock.posted.at(-1)).toMatchObject({ kind: 'mutation:state' });
  });

  it('drops prior engine subscription when re-initialized', () => {
    const mockA = createMockPort();
    const mockB = createMockPort();

    const unsubscribeA = vi.fn();
    const unsubscribeB = vi.fn();

    const makeEngine = (subscribeImpl: () => () => void) =>
      ({
        applyStyle: vi.fn(() => null),
        applyText: vi.fn(() => null),
        beginBatch: vi.fn(),
        commitBatch: vi.fn(),
        cancelBatch: vi.fn(),
        undo: vi.fn(() => false),
        redo: vi.fn(() => false),
        getDiffs: vi.fn(() => []),
        getNetDiffs: vi.fn(() => []),
        clearAll: vi.fn(),
        subscribe: vi.fn(subscribeImpl),
        get canUndo() { return false; },
        get canRedo() { return false; },
        get undoCount() { return 0; },
        get redoCount() { return 0; },
      }) as unknown as ReturnType<typeof createUnifiedMutationEngine>;

    const engineA = makeEngine(() => unsubscribeA);
    const engineB = makeEngine(() => unsubscribeB);

    initMutationMessageHandler(mockA.port, engineA);
    initMutationMessageHandler(mockB.port, engineB);

    expect(unsubscribeA).toHaveBeenCalledTimes(1);
    expect(unsubscribeB).not.toHaveBeenCalled();
  });

  it('unsubscribes engine listener on disconnect', () => {
    const mock = createMockPort();
    const unsubscribe = vi.fn();

    const engine = ({
      applyStyle: vi.fn(() => null),
      applyText: vi.fn(() => null),
      beginBatch: vi.fn(),
      commitBatch: vi.fn(),
      cancelBatch: vi.fn(),
      undo: vi.fn(() => false),
      redo: vi.fn(() => false),
      getDiffs: vi.fn(() => []),
      getNetDiffs: vi.fn(() => []),
      clearAll: vi.fn(),
      subscribe: vi.fn(() => unsubscribe),
      get canUndo() { return false; },
      get canRedo() { return false; },
      get undoCount() { return 0; },
      get redoCount() { return 0; },
    }) as unknown as ReturnType<typeof createUnifiedMutationEngine>;

    initMutationMessageHandler(mock.port, engine);
    mock.disconnect();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
