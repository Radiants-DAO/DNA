import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSidecarClient } from "../sidecar-client.js";

describe("SidecarClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts disconnected", () => {
    const client = createSidecarClient(3737);
    expect(client.connected).toBe(false);
    expect(client.health).toBeNull();
  });

  it("connects when health check succeeds", async () => {
    const mockHealth = {
      status: "ok",
      version: "0.1.0",
      root: "/tmp/project",
      capabilities: ["mcp-tools"],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHealth),
      })
    );

    // Stub WebSocket
    vi.stubGlobal(
      "WebSocket",
      vi.fn().mockImplementation(() => ({
        onclose: null,
        onerror: null,
        close: vi.fn(),
      }))
    );

    const client = createSidecarClient(3737);
    const statusChanges: boolean[] = [];
    client.onStatusChange((connected) => statusChanges.push(connected));

    client.startPolling();
    await vi.advanceTimersByTimeAsync(100);

    expect(client.connected).toBe(true);
    expect(client.health?.version).toBe("0.1.0");
    expect(statusChanges).toContain(true);

    client.stopPolling();
  });

  it("disconnects when health check fails", async () => {
    // Start connected
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "ok",
            version: "0.1.0",
            root: "/tmp",
            capabilities: [],
          }),
      })
    );
    vi.stubGlobal(
      "WebSocket",
      vi.fn().mockImplementation(() => ({
        onclose: null,
        onerror: null,
        close: vi.fn(),
      }))
    );

    const client = createSidecarClient(3737);
    client.startPolling();
    await vi.advanceTimersByTimeAsync(100);
    expect(client.connected).toBe(true);

    // Now fail
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection refused")));
    await vi.advanceTimersByTimeAsync(5100);

    expect(client.connected).toBe(false);
    client.stopPolling();
  });

  it("notifies listeners on status change", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "ok",
            version: "0.1.0",
            root: "/tmp",
            capabilities: [],
          }),
      })
    );
    vi.stubGlobal(
      "WebSocket",
      vi.fn().mockImplementation(() => ({
        onclose: null,
        onerror: null,
        close: vi.fn(),
      }))
    );

    const client = createSidecarClient(3737);
    const changes: Array<{ connected: boolean; health: unknown }> = [];
    client.onStatusChange((connected, health) => changes.push({ connected, health }));

    client.startPolling();
    await vi.advanceTimersByTimeAsync(100);

    expect(changes.length).toBe(1);
    expect(changes[0].connected).toBe(true);

    // Disconnect
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fail")));
    await vi.advanceTimersByTimeAsync(5100);

    expect(changes.length).toBe(2);
    expect(changes[1].connected).toBe(false);

    client.stopPolling();
  });

  it("uses custom port", () => {
    const client = createSidecarClient(4000);
    expect(client.port).toBe(4000);
  });

  it("calls onMessage listeners when WS receives a message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "ok",
            version: "0.1.0",
            root: "/tmp",
            capabilities: [],
          }),
      })
    );

    let capturedOnMessage: ((event: { data: string }) => void) | null = null;
    const wsMockImpl = vi.fn().mockImplementation(() => {
      const instance = {
        onopen: null as (() => void) | null,
        onclose: null as (() => void) | null,
        onerror: null as (() => void) | null,
        onmessage: null as ((event: { data: string }) => void) | null,
        close: vi.fn(),
      };
      // Capture onmessage when it's assigned
      Object.defineProperty(instance, 'onmessage', {
        set(handler) { capturedOnMessage = handler; },
        get() { return capturedOnMessage; },
      });
      return instance;
    });
    vi.stubGlobal("WebSocket", wsMockImpl);

    const client = createSidecarClient(3737);
    const received: unknown[] = [];
    client.onMessage((msg) => received.push(msg));

    client.startPolling();
    await vi.advanceTimersByTimeAsync(100);

    // Simulate incoming message
    const agentMsg = { type: "agent-feedback", payload: { tabId: 1, content: "looks good" } };
    capturedOnMessage!({ data: JSON.stringify(agentMsg) });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(agentMsg);

    client.stopPolling();
  });

  it("unsubscribes from onMessage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "ok", version: "0.1.0", root: "/tmp", capabilities: [] }),
      })
    );

    let capturedOnMessage: ((event: { data: string }) => void) | null = null;
    const wsMockImpl = vi.fn().mockImplementation(() => {
      const instance = {
        onopen: null as (() => void) | null,
        onclose: null as (() => void) | null,
        onerror: null as (() => void) | null,
        onmessage: null as ((event: { data: string }) => void) | null,
        close: vi.fn(),
      };
      Object.defineProperty(instance, 'onmessage', {
        set(handler) { capturedOnMessage = handler; },
        get() { return capturedOnMessage; },
      });
      return instance;
    });
    vi.stubGlobal("WebSocket", wsMockImpl);

    const client = createSidecarClient(3737);
    const received: unknown[] = [];
    const unsub = client.onMessage((msg) => received.push(msg));

    client.startPolling();
    await vi.advanceTimersByTimeAsync(100);

    capturedOnMessage!({ data: JSON.stringify({ type: "pong", payload: {} }) });
    expect(received).toHaveLength(1);

    unsub();
    capturedOnMessage!({ data: JSON.stringify({ type: "pong", payload: {} }) });
    expect(received).toHaveLength(1); // No new messages after unsub

    client.stopPolling();
  });

  it("does not create WebSocket until connected", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fail")));
    const wsMock = vi.fn();
    vi.stubGlobal("WebSocket", wsMock);

    const client = createSidecarClient(3737);
    client.startPolling();
    await vi.advanceTimersByTimeAsync(100);

    expect(wsMock).not.toHaveBeenCalled();
    expect(client.ws).toBeNull();

    client.stopPolling();
  });
});
