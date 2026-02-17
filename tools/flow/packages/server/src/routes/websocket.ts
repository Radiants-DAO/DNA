import type { Peer } from "crossws";
import type { ProjectWatcher, FileChangeEvent } from "../watcher.js";
import type { ContextStore, ElementContext, MutationDiff, AnimationState } from "../services/context-store.js";
import type { RegisterTabPayload, SessionUpdatePayload, HumanThreadReplyPayload, ClientType, SessionId } from "@flow/shared";

export type WsMessageType =
  | "file-change"
  | "element-context"
  | "component-tree"
  | "mutation-diff"
  | "animation-state"
  | "extracted-styles"
  | "session-update"
  | "register-tab"
  | "human-thread-reply"
  | "agent-feedback"
  | "agent-resolve"
  | "agent-thread-reply"
  | "ping"
  | "pong";

export interface WsMessage {
  type: WsMessageType;
  payload: unknown;
}

export function createWebSocketHandler(
  watcher: ProjectWatcher,
  contextStore: ContextStore
) {
  const peers = new Set<Peer>();
  const peerTabIds = new Map<Peer, number>();
  /** Maps peer → its sessionId (set on register-tab) */
  const peerSessionIds = new Map<Peer, SessionId>();

  // Forward file changes to all connected peers
  watcher.on("change", (event: FileChangeEvent) => {
    broadcast({ type: "file-change", payload: event });
  });

  function broadcast(message: WsMessage): void {
    const data = JSON.stringify(message);
    for (const peer of peers) {
      try {
        peer.send(data);
      } catch {
        peers.delete(peer);
      }
    }
  }

  function broadcastToTab(tabId: number, message: WsMessage): void {
    const data = JSON.stringify(message);
    for (const peer of peers) {
      if (peerTabIds.get(peer) !== tabId) continue;
      try {
        peer.send(data);
      } catch {
        peers.delete(peer);
        peerTabIds.delete(peer);
        peerSessionIds.delete(peer);
      }
    }
  }

  /**
   * Validate that a peer's sessionId is the owner of the given tabId.
   * Sends an error response and returns false if ownership validation fails.
   * Returns true if no sessionId is present (backward compatibility) or if ownership matches.
   */
  function validateOwnership(peer: Peer, tabId: number, sessionId?: SessionId): boolean {
    if (!sessionId) return true; // backward compat: legacy clients without sessionId
    if (!contextStore.isSessionOwner(tabId, sessionId)) {
      peer.send(JSON.stringify({
        type: "error",
        payload: { code: "SESSION_OWNERSHIP_CONFLICT", tabId, message: `Session ${sessionId} does not own tab ${tabId}` },
      }));
      return false;
    }
    return true;
  }

  return {
    open(peer: Peer) {
      peers.add(peer);
    },

    message(peer: Peer, rawMessage: { text: () => string }) {
      try {
        const msg: WsMessage = JSON.parse(rawMessage.text());

        switch (msg.type) {
          case "ping":
            peer.send(JSON.stringify({ type: "pong", payload: null }));
            break;

          case "register-tab": {
            const payload = msg.payload as RegisterTabPayload & Partial<{ tabId: number }>;
            const tabId = payload.tabId;
            if (typeof tabId !== "number") break;

            const sessionId: SessionId | undefined = payload.sessionId;
            const clientType: ClientType = payload.clientType ?? 'extension';

            if (sessionId) {
              const registered = contextStore.registerSession(tabId, sessionId, clientType);
              if (!registered) {
                peer.send(JSON.stringify({
                  type: "error",
                  payload: {
                    code: "SESSION_OWNERSHIP_CONFLICT",
                    tabId,
                    message: `Tab ${tabId} is already owned by a different session`,
                  },
                }));
                break;
              }
              peerSessionIds.set(peer, sessionId);
            }

            peerTabIds.set(peer, tabId);
            break;
          }

          case "element-context": {
            const ctx = msg.payload as ElementContext;
            contextStore.setElementContext(ctx.selector, ctx);
            break;
          }

          case "component-tree": {
            contextStore.setComponentTree(msg.payload as Record<string, unknown>[]);
            break;
          }

          case "mutation-diff": {
            const diff = msg.payload as MutationDiff;
            contextStore.addMutation(diff);
            break;
          }

          case "animation-state": {
            const state = msg.payload as AnimationState;
            contextStore.setAnimationState(state.selector, state);
            break;
          }

          case "extracted-styles": {
            const data = msg.payload as { selector: string; styles: Record<string, unknown> };
            contextStore.setExtractedStyles(data.selector, data.styles);
            break;
          }

          case "session-update": {
            const session = msg.payload as SessionUpdatePayload & Partial<{
              compiledMarkdown: string;
              annotations: unknown[];
              textEdits: unknown[];
              mutationDiffs: unknown[];
              animationDiffs: unknown[];
              comments: unknown[];
              promptSteps: unknown[];
            }>;

            if (!validateOwnership(peer, session.tabId, session.sessionId)) break;

            peerTabIds.set(peer, session.tabId);
            if (session.sessionId) {
              contextStore.touchSession(session.tabId);
            }
            contextStore.setSession(session.tabId, {
              compiledMarkdown: session.compiledMarkdown,
              annotations: session.annotations,
              textEdits: session.textEdits,
              mutationDiffs: session.mutationDiffs,
              animationDiffs: session.animationDiffs,
              comments: session.comments ?? [],
              promptSteps: session.promptSteps,
              lastUpdated: Date.now(),
            });
            break;
          }

          case "human-thread-reply": {
            const { tabId, feedbackId, content, sessionId } = msg.payload as HumanThreadReplyPayload & Partial<{
              feedbackId: string;
              content: string;
              sessionId: SessionId;
            }>;

            if (!validateOwnership(peer, tabId, sessionId)) break;

            peerTabIds.set(peer, tabId);
            if (sessionId) {
              contextStore.touchSession(tabId);
            }
            contextStore.addThreadReply(tabId, feedbackId, { role: 'human', content });
            break;
          }
        }
      } catch {
        // Ignore malformed messages
      }
    },

    close(peer: Peer) {
      peers.delete(peer);
      peerTabIds.delete(peer);
      peerSessionIds.delete(peer);
    },

    /** Expose broadcast for direct use by other services */
    broadcast,
    broadcastToTab,
    peers,
  };
}
