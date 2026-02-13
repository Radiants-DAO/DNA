import type { AgentToExtensionMessage } from '@flow/shared';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const SIDECAR_WS_URL = 'ws://localhost:3737/__flow/ws';

type SidecarStatus = 'disconnected' | 'connecting' | 'connected';
type StatusListener = (status: SidecarStatus) => void;
type IncomingMessageListener = (message: AgentToExtensionMessage) => void;

let currentStatus: SidecarStatus = 'disconnected';
const listeners = new Set<StatusListener>();
const incomingListeners = new Set<IncomingMessageListener>();

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

export function connectToSidecar(): void {
  if (ws?.readyState === WebSocket.OPEN) return;

  setStatus('connecting');

  try {
    ws = new WebSocket(SIDECAR_WS_URL);

    ws.onopen = () => {
      setStatus('connected');
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
        compiledMarkdown,
        ...sessionData,
      },
    }),
  );
}

export function pushHumanReply(tabId: number, feedbackId: string, content: string): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(
    JSON.stringify({
      type: 'human-thread-reply',
      payload: { tabId, feedbackId, content },
    }),
  );
}

export function disconnectFromSidecar(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
  setStatus('disconnected');
}
