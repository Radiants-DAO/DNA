import type { AgentToExtensionMessage, SessionId, ClientType } from '@flow/shared';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const SIDECAR_WS_URL = 'ws://localhost:3737/__flow/ws';

type SidecarStatus = 'disconnected' | 'connecting' | 'connected';
type StatusListener = (status: SidecarStatus) => void;
type IncomingMessageListener = (message: AgentToExtensionMessage) => void;
export type HumanReplyDelivery = 'sent' | 'queued';

let currentStatus: SidecarStatus = 'disconnected';
const listeners = new Set<StatusListener>();
const incomingListeners = new Set<IncomingMessageListener>();
let registeredTabId: number | null = null;
/** Stable session ID generated once per tab, survives reconnects */
let tabSessionId: SessionId | null = null;
const queuedHumanReplies: string[] = [];
const MAX_QUEUED_HUMAN_REPLIES = 100;

function generateSessionId(): SessionId {
  return crypto.randomUUID();
}

/**
 * Get or create a sessionId for the current tab. The sessionId is stable
 * across WebSocket reconnects but reset when the extension process restarts.
 */
function ensureSessionId(): SessionId {
  if (!tabSessionId) {
    tabSessionId = generateSessionId();
  }
  return tabSessionId;
}

function setStatus(status: SidecarStatus) {
  currentStatus = status;
  for (const listener of listeners) {
    listener(status);
  }
}

export function onSidecarStatus(listener: StatusListener): () => void {
  listeners.add(listener);
  // Immediately fire with current status
  listener(currentStatus);
  return () => listeners.delete(listener);
}

export function getSidecarStatus(): SidecarStatus {
  return currentStatus;
}

export function onAgentMessage(listener: IncomingMessageListener): () => void {
  incomingListeners.add(listener);
  return () => incomingListeners.delete(listener);
}

function sendTabRegistration(): void {
  if (registeredTabId == null) return;
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(
    JSON.stringify({
      type: 'register-tab',
      payload: {
        tabId: registeredTabId,
        sessionId: ensureSessionId(),
        clientType: 'extension' as ClientType,
      },
    }),
  );
}

function queueHumanReply(serialized: string): void {
  if (queuedHumanReplies.length >= MAX_QUEUED_HUMAN_REPLIES) {
    queuedHumanReplies.shift();
  }
  queuedHumanReplies.push(serialized);
}

function flushQueuedHumanReplies(): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  while (queuedHumanReplies.length > 0) {
    const next = queuedHumanReplies.shift();
    if (next) ws.send(next);
  }
}

export function connectToSidecar(tabId?: number): void {
  if (typeof tabId === 'number') {
    registeredTabId = tabId;
  }

  if (ws?.readyState === WebSocket.CONNECTING) {
    return;
  }

  if (ws?.readyState === WebSocket.OPEN) {
    sendTabRegistration();
    return;
  }

  setStatus('connecting');

  try {
    ws = new WebSocket(SIDECAR_WS_URL);

    ws.onopen = () => {
      setStatus('connected');
      sendTabRegistration();
      flushQueuedHumanReplies();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'agent-feedback' || msg.type === 'agent-resolve' || msg.type === 'agent-thread-reply') {
          for (const listener of incomingListeners) {
            listener(msg as AgentToExtensionMessage);
          }
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      ws = null;
      setStatus('disconnected');
      // Reconnect after 5s
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connectToSidecar, 5000);
    };

    ws.onerror = () => {
      ws?.close();
    };
  } catch {
    setStatus('disconnected');
  }
}

export function pushSessionToSidecar(
  tabId: number,
  compiledMarkdown: string,
  sessionData: {
    annotations: unknown[];
    textEdits: unknown[];
    mutationDiffs: unknown[];
    animationDiffs: unknown[];
    promptDraft?: unknown[];
    promptSteps: unknown[];
    comments: unknown[];
  },
): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  // Wrap under `payload` to match the server's WsMessage protocol: { type, payload }
  ws.send(
    JSON.stringify({
      type: 'session-update',
      payload: {
        tabId,
        sessionId: ensureSessionId(),
        compiledMarkdown,
        ...sessionData,
      },
    }),
  );
}

export function pushHumanReply(tabId: number, feedbackId: string, content: string): HumanReplyDelivery {
  const serialized = JSON.stringify({
    type: 'human-thread-reply',
    payload: { tabId, sessionId: ensureSessionId(), feedbackId, content },
  });

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(serialized);
    return 'sent';
  }

  queueHumanReply(serialized);
  return 'queued';
}

export function disconnectFromSidecar(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
  queuedHumanReplies.length = 0;
  tabSessionId = null;
  setStatus('disconnected');
}
