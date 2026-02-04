import type { Peer } from "crossws";
import type { ProjectWatcher, FileChangeEvent } from "../watcher.js";
import type { ContextStore, ElementContext, MutationDiff, AnimationState } from "../services/context-store.js";

export type WsMessageType =
  | "file-change"
  | "element-context"
  | "component-tree"
  | "mutation-diff"
  | "animation-state"
  | "extracted-styles"
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
        }
      } catch {
        // Ignore malformed messages
      }
    },

    close(peer: Peer) {
      peers.delete(peer);
    },

    /** Expose broadcast for direct use by other services */
    broadcast,
    peers,
  };
}
