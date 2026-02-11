import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MutationMessage } from '@flow/shared';
import { createUnifiedMutationEngine } from '../unifiedMutationEngine';
import { initMutationMessageHandler } from '../mutationMessageHandler';

type MessageListener = (message: MutationMessage) => void;

function createMockPort() {
  let listener: MessageListener | null = null;
  const posted: unknown[] = [];

  const port = {
    onMessage: {
      addListener: (cb: MessageListener) => {
        listener = cb;
      },
    },
    postMessage: (message: unknown) => {
      posted.push(message);
    },
  } as unknown as chrome.runtime.Port;

  return {
    port,
    emit: (message: MutationMessage) => listener?.(message),
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
});
