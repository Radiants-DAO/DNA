import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSidecarClient } from '../sidecar-client.js';

describe('SidecarClient session management', () => {
  let sentMessages: string[];
  let mockWs: {
    onopen: (() => void) | null;
    onmessage: ((event: { data: string }) => void) | null;
    onclose: (() => void) | null;
    onerror: (() => void) | null;
    readyState: number;
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    sentMessages = [];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ok', version: '0.1.0', root: '/tmp', capabilities: [] }),
    }));

    vi.stubGlobal('WebSocket', vi.fn().mockImplementation(() => {
      mockWs = {
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null,
        readyState: 1, // OPEN
        send: vi.fn((data: string) => sentMessages.push(data)),
        close: vi.fn(),
      };
      // Simulate open after creation
      setTimeout(() => mockWs.onopen?.(), 0);
      return mockWs;
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('registerTab sends register-tab message', async () => {
    const client = createSidecarClient(3737);
    client.startPolling();
    await vi.advanceTimersByTimeAsync(100);

    client.registerTab(42);

    const msgs = sentMessages.map((s) => JSON.parse(s));
    const reg = msgs.find((m) => m.type === 'register-tab');
    expect(reg).toBeDefined();
    expect(reg.payload.tabId).toBe(42);
    expect(reg.payload.clientType).toBe('extension');
    expect(typeof reg.payload.sessionId).toBe('string');

    client.stopPolling();
  });

  it('getSessionId returns sessionId after registerTab', async () => {
    const client = createSidecarClient(3737);
    client.startPolling();
    await vi.advanceTimersByTimeAsync(100);

    expect(client.getSessionId(42)).toBeNull();
    client.registerTab(42);
    expect(client.getSessionId(42)).toBeTruthy();

    client.stopPolling();
  });

  it('pushSessionUpdate sends session-update with sessionId', async () => {
    const client = createSidecarClient(3737);
    client.startPolling();
    await vi.advanceTimersByTimeAsync(100);

    client.registerTab(42);
    client.pushSessionUpdate(42, '## Test', { annotations: [], comments: [] });

    const msgs = sentMessages.map((s) => JSON.parse(s));
    const update = msgs.find((m) => m.type === 'session-update');
    expect(update).toBeDefined();
    expect(update.payload.tabId).toBe(42);
    expect(update.payload.compiledMarkdown).toBe('## Test');
    expect(update.payload.sessionId).toBe(client.getSessionId(42));

    client.stopPolling();
  });

  it('pushSessionUpdate is a no-op for unregistered tab', async () => {
    const client = createSidecarClient(3737);
    client.startPolling();
    await vi.advanceTimersByTimeAsync(100);

    client.pushSessionUpdate(99, '## Test', {});
    const msgs = sentMessages.map((s) => JSON.parse(s));
    expect(msgs.find((m) => m.type === 'session-update')).toBeUndefined();

    client.stopPolling();
  });

  it('pushHumanReply queues when disconnected', async () => {
    const client = createSidecarClient(3737);
    // Register tab without starting polling (no WS)
    client.registerTab(42);

    // Note: registerTab created session but WS isn't open yet
    // Actually since we didn't start polling, there's no WS.
    // But registerTab still creates a session ID.

    // The send will fail since there's no WS, so it should queue
    client.pushHumanReply(42, 'feedback-1', 'Great fix!');

    // No messages sent (no WS)
    expect(sentMessages).toHaveLength(0);
  });

  it('closeSession sends close-session and removes tab', async () => {
    const client = createSidecarClient(3737);
    client.startPolling();
    await vi.advanceTimersByTimeAsync(100);

    client.registerTab(42);
    const sessionId = client.getSessionId(42);
    client.closeSession(42);

    const msgs = sentMessages.map((s) => JSON.parse(s));
    const close = msgs.find((m) => m.type === 'close-session');
    expect(close).toBeDefined();
    expect(close.payload.tabId).toBe(42);
    expect(close.payload.sessionId).toBe(sessionId);

    // Session is cleaned up
    expect(client.getSessionId(42)).toBeNull();

    client.stopPolling();
  });

  it('re-registers all tabs on reconnect', async () => {
    const client = createSidecarClient(3737);
    client.startPolling();
    await vi.advanceTimersByTimeAsync(100);

    client.registerTab(1);
    client.registerTab(2);
    sentMessages.length = 0; // Clear initial registration messages

    // Simulate WS reconnect by triggering onopen again
    mockWs.onopen?.();

    const msgs = sentMessages.map((s) => JSON.parse(s));
    const regs = msgs.filter((m) => m.type === 'register-tab');
    expect(regs).toHaveLength(2);
    const tabIds = regs.map((r) => r.payload.tabId).sort();
    expect(tabIds).toEqual([1, 2]);

    client.stopPolling();
  });
});
