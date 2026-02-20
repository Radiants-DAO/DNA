const DEFAULT_PORT = 3737;
const HEALTH_PATH = "/__flow/health";
const POLL_INTERVAL = 5000;

export interface SidecarHealth {
  status: "ok";
  version: string;
  root: string;
  capabilities: string[];
}

/** Message types that can be sent to the sidecar */
export type SidecarMessageType =
  | "element-context"
  | "extracted-styles"
  | "animation-state"
  | "mutation-diff"
  | "component-tree"
  | "register-tab"
  | "session-update"
  | "human-thread-reply"
  | "close-session"
  | "ping";

export interface SidecarMessage {
  type: SidecarMessageType;
  payload: unknown;
}

/** Message types received from the sidecar */
export type IncomingSidecarMessageType =
  | 'agent-feedback'
  | 'agent-resolve'
  | 'agent-thread-reply'
  | 'file-change'
  | 'pong'
  | 'error';

export interface IncomingSidecarMessage {
  type: IncomingSidecarMessageType;
  payload: unknown;
}

export type MessageListener = (message: IncomingSidecarMessage) => void;

export interface SidecarClient {
  connected: boolean;
  health: SidecarHealth | null;
  port: number;
  ws: WebSocket | null;
  startPolling(): void;
  stopPolling(): void;
  onStatusChange(callback: (connected: boolean, health: SidecarHealth | null) => void): void;
  /** Subscribe to incoming messages from the sidecar. Returns unsubscribe fn. */
  onMessage(callback: MessageListener): () => void;
  /** Send a message to the sidecar if connected */
  send(message: SidecarMessage): boolean;
}

export function createSidecarClient(port = DEFAULT_PORT): SidecarClient {
  let connected = false;
  let health: SidecarHealth | null = null;
  let ws: WebSocket | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;
  const statusListeners: Array<(connected: boolean, health: SidecarHealth | null) => void> = [];
  const messageListeners: Set<MessageListener> = new Set();

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
          notifyStatus();
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
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as IncomingSidecarMessage;
          for (const cb of messageListeners) {
            cb(msg);
          }
        } catch {
          // Ignore malformed messages
        }
      };
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
      notifyStatus();
    }
  }

  function notifyStatus(): void {
    for (const cb of statusListeners) cb(connected, health);
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
      statusListeners.push(callback);
    },

    onMessage(callback: MessageListener): () => void {
      messageListeners.add(callback);
      return () => { messageListeners.delete(callback); };
    },

    send(message: SidecarMessage): boolean {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return false;
      }
      try {
        ws.send(JSON.stringify(message));
        return true;
      } catch {
        return false;
      }
    },
  };
}
