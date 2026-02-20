import type { ClientType, SessionId } from '@flow/shared';

const DEFAULT_PORT = 3737;
const HEALTH_PATH = "/__flow/health";
const POLL_INTERVAL = 5000;
const MAX_QUEUED_REPLIES = 100;

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

  // ── Session management ──
  /** Register a tab with the sidecar (creates or reuses session). */
  registerTab(tabId: number): void;
  /** Push compiled session data to the sidecar. */
  pushSessionUpdate(tabId: number, compiledMarkdown: string, sessionData: Record<string, unknown>): void;
  /** Send a human reply to an agent feedback thread. Queues if disconnected. */
  pushHumanReply(tabId: number, feedbackId: string, content: string): void;
  /** Close a tab's session with the sidecar. */
  closeSession(tabId: number): void;
  /** Get the sessionId for a tab, or null if not registered. */
  getSessionId(tabId: number): SessionId | null;
}

export function createSidecarClient(port = DEFAULT_PORT): SidecarClient {
  let connected = false;
  let health: SidecarHealth | null = null;
  let ws: WebSocket | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;
  const statusListeners: Array<(connected: boolean, health: SidecarHealth | null) => void> = [];
  const messageListeners: Set<MessageListener> = new Set();

  // Session state
  const tabSessions = new Map<number, SessionId>();
  const queuedReplies: string[] = [];

  function ensureSessionId(tabId: number): SessionId {
    let sessionId = tabSessions.get(tabId);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      tabSessions.set(tabId, sessionId);
    }
    return sessionId;
  }

  function sendRaw(data: string): boolean {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(data);
      return true;
    } catch {
      return false;
    }
  }

  function flushQueuedReplies(): void {
    while (queuedReplies.length > 0) {
      const next = queuedReplies.shift();
      if (next && !sendRaw(next)) {
        // Put it back and stop flushing
        queuedReplies.unshift(next);
        break;
      }
    }
  }

  function reRegisterAllTabs(): void {
    for (const [tabId] of tabSessions) {
      sendRaw(JSON.stringify({
        type: 'register-tab',
        payload: {
          tabId,
          sessionId: ensureSessionId(tabId),
          clientType: 'extension' as ClientType,
        },
      }));
    }
  }

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
      ws.onopen = () => {
        reRegisterAllTabs();
        flushQueuedReplies();
      };
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
      return sendRaw(JSON.stringify(message));
    },

    // ── Session management ──

    registerTab(tabId: number): void {
      const sessionId = ensureSessionId(tabId);
      sendRaw(JSON.stringify({
        type: 'register-tab',
        payload: { tabId, sessionId, clientType: 'extension' as ClientType },
      }));
    },

    pushSessionUpdate(tabId: number, compiledMarkdown: string, sessionData: Record<string, unknown>): void {
      const sessionId = tabSessions.get(tabId);
      if (!sessionId) return;
      sendRaw(JSON.stringify({
        type: 'session-update',
        payload: { tabId, sessionId, compiledMarkdown, ...sessionData },
      }));
    },

    pushHumanReply(tabId: number, feedbackId: string, content: string): void {
      const sessionId = tabSessions.get(tabId);
      if (!sessionId) return;
      const serialized = JSON.stringify({
        type: 'human-thread-reply',
        payload: { tabId, sessionId, feedbackId, content },
      });
      if (!sendRaw(serialized)) {
        if (queuedReplies.length >= MAX_QUEUED_REPLIES) {
          queuedReplies.shift();
        }
        queuedReplies.push(serialized);
      }
    },

    closeSession(tabId: number): void {
      const sessionId = tabSessions.get(tabId);
      if (!sessionId) return;
      sendRaw(JSON.stringify({
        type: 'close-session',
        payload: { tabId, sessionId },
      }));
      tabSessions.delete(tabId);
    },

    getSessionId(tabId: number): SessionId | null {
      return tabSessions.get(tabId) ?? null;
    },
  };
}
