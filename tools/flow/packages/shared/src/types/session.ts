/**
 * Session ownership types for the sidecar WebSocket protocol.
 *
 * Each browser tab generates a unique `sessionId` (UUID) when the panel opens.
 * The server associates this sessionId with a tabId to enforce ownership:
 * only the peer that registered a tab can push updates to that tab's session.
 *
 * `clientType` identifies what kind of client is connecting over WebSocket.
 */

/** Client types that can connect to the sidecar WebSocket */
export type ClientType = 'extension' | 'cli' | 'standalone';

/** Opaque session identifier (UUID v4 string) */
export type SessionId = string;

/**
 * Payload for the `register-tab` WebSocket message.
 * Sent by the extension when the DevTools panel connects to the sidecar.
 */
export interface RegisterTabPayload {
  tabId: number;
  sessionId: SessionId;
  clientType: ClientType;
}

/**
 * Payload for the `session-update` WebSocket message.
 * Sent by the extension whenever the compiled prompt changes.
 */
export interface SessionUpdatePayload {
  tabId: number;
  sessionId: SessionId;
  compiledMarkdown: string;
  annotations: unknown[];
  textEdits: unknown[];
  mutationDiffs: unknown[];
  animationDiffs: unknown[];
  comments: unknown[];
  promptSteps: unknown[];
}

/**
 * Payload for the `human-thread-reply` WebSocket message.
 */
export interface HumanThreadReplyPayload {
  tabId: number;
  sessionId: SessionId;
  feedbackId: string;
  content: string;
}

/**
 * Server-side record of a registered session.
 * Tracks which sessionId owns which tabId and when it was last seen.
 */
export interface SessionRegistration {
  tabId: number;
  sessionId: SessionId;
  clientType: ClientType;
  registeredAt: number;
  lastSeenAt: number;
}
