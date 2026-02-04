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
