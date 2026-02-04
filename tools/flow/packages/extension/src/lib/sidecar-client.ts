const DEFAULT_PORT = 3737;
const HEALTH_PATH = "/__flow/health";
const POLL_INTERVAL = 5000;

export interface SidecarHealth {
  status: "ok";
  version: string;
  root: string;
  capabilities: string[];
}

export interface SidecarClient {
  connected: boolean;
  health: SidecarHealth | null;
  port: number;
  ws: WebSocket | null;
  startPolling(): void;
  stopPolling(): void;
  onStatusChange(callback: (connected: boolean, health: SidecarHealth | null) => void): void;
}

export function createSidecarClient(port = DEFAULT_PORT): SidecarClient {
  let connected = false;
  let health: SidecarHealth | null = null;
  let ws: WebSocket | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;
  const listeners: Array<(connected: boolean, health: SidecarHealth | null) => void> = [];

  async function checkHealth(): Promise<void> {
    try {
      const res = await fetch(`http://localhost:${port}${HEALTH_PATH}`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        health = await res.json();
        if (!connected) {
          connected = true;
          connectWebSocket();
          notify();
        }
      } else {
        disconnect();
      }
    } catch {
      disconnect();
    }
  }

  function connectWebSocket(): void {
    if (ws) return;
    try {
      ws = new WebSocket(`ws://localhost:${port}/__flow/ws`);
      ws.onclose = () => {
        ws = null;
      };
      ws.onerror = () => {
        ws?.close();
        ws = null;
      };
    } catch {
      ws = null;
    }
  }

  function disconnect(): void {
    if (connected) {
      connected = false;
      health = null;
      ws?.close();
      ws = null;
      notify();
    }
  }

  function notify(): void {
    for (const cb of listeners) cb(connected, health);
  }

  return {
    get connected() { return connected; },
    get health() { return health; },
    port,
    get ws() { return ws; },

    startPolling() {
      checkHealth();
      interval = setInterval(checkHealth, POLL_INTERVAL);
    },

    stopPolling() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    },

    onStatusChange(callback) {
      listeners.push(callback);
    },
  };
}
