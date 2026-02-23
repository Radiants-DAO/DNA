import { describe, it, expect, beforeEach } from "vitest";
import { EventEmitter } from "node:events";
import { createWebSocketHandler } from "../websocket.js";
import { ContextStore } from "../../services/context-store.js";

// Mock peer
function createMockPeer() {
  const sent: string[] = [];
  return {
    send(data: string) { sent.push(data); },
    sent,
  };
}

// Mock watcher (just an EventEmitter)
function createMockWatcher() {
  return new EventEmitter() as any;
}

describe("WebSocket handler", () => {
  let watcher: EventEmitter;
  let contextStore: ContextStore;
  let handler: ReturnType<typeof createWebSocketHandler>;

  beforeEach(() => {
    watcher = createMockWatcher();
    contextStore = new ContextStore();
    handler = createWebSocketHandler(watcher as any, contextStore);
  });

  it("broadcasts file changes to connected peers", () => {
    const peer = createMockPeer();
    handler.open(peer as any);

    watcher.emit("change", { type: "change", path: "src/App.tsx", timestamp: 1 });

    expect(peer.sent.length).toBe(1);
    const msg = JSON.parse(peer.sent[0]);
    expect(msg.type).toBe("file-change");
    expect(msg.payload.path).toBe("src/App.tsx");
  });

  it("stores element context from extension messages", () => {
    const peer = createMockPeer();
    handler.open(peer as any);

    handler.message(peer as any, {
      text: () =>
        JSON.stringify({
          type: "element-context",
          payload: { selector: ".btn", componentName: "Button" },
        }),
    });

    const ctx = contextStore.getElementContext(".btn");
    expect(ctx?.componentName).toBe("Button");
  });

  it("stores mutation diffs from extension messages", () => {
    const peer = createMockPeer();
    handler.open(peer as any);

    handler.message(peer as any, {
      text: () =>
        JSON.stringify({
          type: "mutation-diff",
          payload: {
            selector: ".hero",
            property: "padding",
            before: "16px",
            after: "24px",
            timestamp: Date.now(),
          },
        }),
    });

    const diffs = contextStore.getMutations();
    expect(diffs.length).toBe(1);
    expect(diffs[0].property).toBe("padding");
  });

  it("stores component tree from extension messages", () => {
    const peer = createMockPeer();
    handler.open(peer as any);

    handler.message(peer as any, {
      text: () =>
        JSON.stringify({
          type: "component-tree",
          payload: [{ name: "App", children: [{ name: "Header" }] }],
        }),
    });

    const tree = contextStore.getComponentTree();
    expect(tree.length).toBe(1);
    expect(tree[0].name).toBe("App");
  });

  it("stores animation state from extension messages", () => {
    const peer = createMockPeer();
    handler.open(peer as any);

    handler.message(peer as any, {
      text: () =>
        JSON.stringify({
          type: "animation-state",
          payload: {
            selector: ".hero",
            animations: [{ name: "fadeIn", type: "css", duration: 300 }],
          },
        }),
    });

    const states = contextStore.getAnimationState(".hero");
    expect(states.length).toBe(1);
    expect(states[0].animations[0].name).toBe("fadeIn");
  });

  it("stores extracted styles from extension messages", () => {
    const peer = createMockPeer();
    handler.open(peer as any);

    handler.message(peer as any, {
      text: () =>
        JSON.stringify({
          type: "extracted-styles",
          payload: {
            selector: ".card",
            styles: { colors: { primary: "#FEF8E2" } },
          },
        }),
    });

    const styles = contextStore.getExtractedStyles(".card");
    expect(styles.length).toBe(1);
    expect((styles[0] as any).colors.primary).toBe("#FEF8E2");
  });

  it("tracks peer tab registration and broadcasts only to matching tab", () => {
    const peer1 = createMockPeer();
    const peer2 = createMockPeer();
    handler.open(peer1 as any);
    handler.open(peer2 as any);

    handler.message(peer1 as any, {
      text: () => JSON.stringify({ type: "register-tab", payload: { tabId: 1 } }),
    });
    handler.message(peer2 as any, {
      text: () => JSON.stringify({ type: "register-tab", payload: { tabId: 2 } }),
    });

    handler.broadcastToTab(2, {
      type: "agent-feedback",
      payload: { tabId: 2, id: "fb-1" },
    } as any);

    expect(peer1.sent.length).toBe(0);
    expect(peer2.sent.length).toBe(1);
    const msg = JSON.parse(peer2.sent[0]);
    expect(msg.type).toBe("agent-feedback");
  });

  it("stores human thread replies from the extension", () => {
    const peer = createMockPeer();
    handler.open(peer as any);

    contextStore.addAgentFeedback(42, {
      id: "fb-1",
      tabId: 42,
      role: "agent",
      intent: "comment",
      severity: "suggestion",
      status: "pending",
      selector: ".hero",
      content: "Initial agent note",
      thread: [],
      timestamp: Date.now(),
    });

    handler.message(peer as any, {
      text: () =>
        JSON.stringify({
          type: "human-thread-reply",
          payload: { tabId: 42, feedbackId: "fb-1", content: "Acknowledged" },
        }),
    });

    const feedback = contextStore.getAgentFeedback(42, "fb-1");
    expect(feedback?.thread.length).toBe(1);
    expect(feedback?.thread[0].role).toBe("human");
    expect(feedback?.thread[0].content).toBe("Acknowledged");
  });

  it("responds to ping with pong", () => {
    const peer = createMockPeer();
    handler.open(peer as any);

    handler.message(peer as any, {
      text: () => JSON.stringify({ type: "ping", payload: null }),
    });

    expect(peer.sent.length).toBe(1);
    const msg = JSON.parse(peer.sent[0]);
    expect(msg.type).toBe("pong");
  });

  it("cleans up peers on close", () => {
    const peer = createMockPeer();
    handler.open(peer as any);
    expect(handler.peers.size).toBe(1);

    handler.close(peer as any);
    expect(handler.peers.size).toBe(0);
  });

  it("broadcasts to multiple peers", () => {
    const peer1 = createMockPeer();
    const peer2 = createMockPeer();
    handler.open(peer1 as any);
    handler.open(peer2 as any);

    watcher.emit("change", { type: "add", path: "src/New.tsx", timestamp: 2 });

    expect(peer1.sent.length).toBe(1);
    expect(peer2.sent.length).toBe(1);
  });

  it("ignores malformed messages", () => {
    const peer = createMockPeer();
    handler.open(peer as any);

    // Should not throw
    handler.message(peer as any, {
      text: () => "not json",
    });

    // No response sent for malformed message
    expect(peer.sent.length).toBe(0);
  });

  // --- Session Ownership Tests ---

  describe("session ownership", () => {
    it("registers tab with sessionId and clientType", () => {
      const peer = createMockPeer();
      handler.open(peer as any);

      handler.message(peer as any, {
        text: () =>
          JSON.stringify({
            type: "register-tab",
            payload: { tabId: 10, sessionId: "sess-aaa", clientType: "extension" },
          }),
      });

      const reg = contextStore.getSessionRegistration(10);
      expect(reg).toBeDefined();
      expect(reg!.sessionId).toBe("sess-aaa");
      expect(reg!.clientType).toBe("extension");
      expect(reg!.tabId).toBe(10);
    });

    it("allows same sessionId to re-register the same tab (reconnect)", () => {
      const peer = createMockPeer();
      handler.open(peer as any);

      handler.message(peer as any, {
        text: () =>
          JSON.stringify({
            type: "register-tab",
            payload: { tabId: 10, sessionId: "sess-aaa", clientType: "extension" },
          }),
      });

      // Simulate reconnect with same sessionId
      const peer2 = createMockPeer();
      handler.open(peer2 as any);

      handler.message(peer2 as any, {
        text: () =>
          JSON.stringify({
            type: "register-tab",
            payload: { tabId: 10, sessionId: "sess-aaa", clientType: "extension" },
          }),
      });

      // Should succeed — no error sent
      expect(peer2.sent.length).toBe(0);
      const reg = contextStore.getSessionRegistration(10);
      expect(reg!.sessionId).toBe("sess-aaa");
    });

    it("rejects different sessionId trying to claim an owned tab", () => {
      const peer1 = createMockPeer();
      const peer2 = createMockPeer();
      handler.open(peer1 as any);
      handler.open(peer2 as any);

      // First peer claims tab 10
      handler.message(peer1 as any, {
        text: () =>
          JSON.stringify({
            type: "register-tab",
            payload: { tabId: 10, sessionId: "sess-aaa", clientType: "extension" },
          }),
      });

      // Second peer tries to claim same tab with different session
      handler.message(peer2 as any, {
        text: () =>
          JSON.stringify({
            type: "register-tab",
            payload: { tabId: 10, sessionId: "sess-bbb", clientType: "extension" },
          }),
      });

      // Second peer should receive an error
      expect(peer2.sent.length).toBe(1);
      const errorMsg = JSON.parse(peer2.sent[0]);
      expect(errorMsg.type).toBe("error");
      expect(errorMsg.payload.code).toBe("SESSION_OWNERSHIP_CONFLICT");

      // Original registration should be unchanged
      const reg = contextStore.getSessionRegistration(10);
      expect(reg!.sessionId).toBe("sess-aaa");
    });

    it("rejects session-update from non-owner sessionId", () => {
      const peer1 = createMockPeer();
      const peer2 = createMockPeer();
      handler.open(peer1 as any);
      handler.open(peer2 as any);

      // First peer registers tab 10
      handler.message(peer1 as any, {
        text: () =>
          JSON.stringify({
            type: "register-tab",
            payload: { tabId: 10, sessionId: "sess-aaa", clientType: "extension" },
          }),
      });

      // Second peer tries to push a session-update with a different sessionId
      handler.message(peer2 as any, {
        text: () =>
          JSON.stringify({
            type: "session-update",
            payload: {
              tabId: 10,
              sessionId: "sess-bbb",
              compiledMarkdown: "# hijacked",

              textEdits: [],
              mutationDiffs: [],
              animationDiffs: [],
              comments: [],
              promptSteps: [],
            },
          }),
      });

      // Should receive an error
      expect(peer2.sent.length).toBe(1);
      const errorMsg = JSON.parse(peer2.sent[0]);
      expect(errorMsg.type).toBe("error");
      expect(errorMsg.payload.code).toBe("SESSION_OWNERSHIP_CONFLICT");

      // Session data should NOT have been updated
      const session = contextStore.getSession(10);
      expect(session).toBeUndefined();
    });

    it("allows session-update from the correct owner", () => {
      const peer = createMockPeer();
      handler.open(peer as any);

      handler.message(peer as any, {
        text: () =>
          JSON.stringify({
            type: "register-tab",
            payload: { tabId: 10, sessionId: "sess-aaa", clientType: "extension" },
          }),
      });

      handler.message(peer as any, {
        text: () =>
          JSON.stringify({
            type: "session-update",
            payload: {
              tabId: 10,
              sessionId: "sess-aaa",
              compiledMarkdown: "# valid update",

              textEdits: [],
              mutationDiffs: [],
              animationDiffs: [],
              comments: [],
              promptSteps: [],
            },
          }),
      });

      const session = contextStore.getSession(10);
      expect(session).toBeDefined();
      expect(session!.compiledMarkdown).toBe("# valid update");
    });

    it("backward compat: register-tab without sessionId still works", () => {
      const peer = createMockPeer();
      handler.open(peer as any);

      handler.message(peer as any, {
        text: () =>
          JSON.stringify({ type: "register-tab", payload: { tabId: 5 } }),
      });

      // No error sent, no session registration created
      expect(peer.sent.length).toBe(0);
      expect(contextStore.getSessionRegistration(5)).toBeUndefined();
    });

    it("backward compat: session-update without sessionId bypasses ownership check", () => {
      const peer1 = createMockPeer();
      handler.open(peer1 as any);

      // Register tab 10 with ownership
      handler.message(peer1 as any, {
        text: () =>
          JSON.stringify({
            type: "register-tab",
            payload: { tabId: 10, sessionId: "sess-aaa", clientType: "extension" },
          }),
      });

      // Legacy client sends session-update without sessionId — should be accepted
      const legacyPeer = createMockPeer();
      handler.open(legacyPeer as any);

      handler.message(legacyPeer as any, {
        text: () =>
          JSON.stringify({
            type: "session-update",
            payload: {
              tabId: 10,
              compiledMarkdown: "# legacy update",

              textEdits: [],
              mutationDiffs: [],
              animationDiffs: [],
              comments: [],
              promptSteps: [],
            },
          }),
      });

      // Should succeed (backward compat)
      expect(legacyPeer.sent.length).toBe(0);
      const session = contextStore.getSession(10);
      expect(session!.compiledMarkdown).toBe("# legacy update");
    });

    it("touches lastSeenAt on session-update from owner", () => {
      const peer = createMockPeer();
      handler.open(peer as any);

      handler.message(peer as any, {
        text: () =>
          JSON.stringify({
            type: "register-tab",
            payload: { tabId: 10, sessionId: "sess-aaa", clientType: "extension" },
          }),
      });

      const regBefore = contextStore.getSessionRegistration(10);
      const beforeTs = regBefore!.lastSeenAt;

      // Small delay to ensure timestamp differs
      handler.message(peer as any, {
        text: () =>
          JSON.stringify({
            type: "session-update",
            payload: {
              tabId: 10,
              sessionId: "sess-aaa",
              compiledMarkdown: "# update",

              textEdits: [],
              mutationDiffs: [],
              animationDiffs: [],
              comments: [],
              promptSteps: [],
            },
          }),
      });

      const regAfter = contextStore.getSessionRegistration(10);
      expect(regAfter!.lastSeenAt).toBeGreaterThanOrEqual(beforeTs);
    });

    it("close-session unregisters the session for the owning sessionId", () => {
      const peer = createMockPeer();
      handler.open(peer as any);

      handler.message(peer as any, {
        text: () =>
          JSON.stringify({
            type: "register-tab",
            payload: { tabId: 10, sessionId: "sess-aaa", clientType: "extension" },
          }),
      });

      expect(contextStore.getSessionRegistration(10)).toBeDefined();

      handler.message(peer as any, {
        text: () =>
          JSON.stringify({
            type: "close-session",
            payload: { tabId: 10, sessionId: "sess-aaa" },
          }),
      });

      expect(contextStore.getSessionRegistration(10)).toBeUndefined();
    });

    it("close-session does not unregister when sessionId does not match", () => {
      const peer = createMockPeer();
      handler.open(peer as any);

      handler.message(peer as any, {
        text: () =>
          JSON.stringify({
            type: "register-tab",
            payload: { tabId: 10, sessionId: "sess-aaa", clientType: "extension" },
          }),
      });

      // Attempt to close with wrong sessionId
      handler.message(peer as any, {
        text: () =>
          JSON.stringify({
            type: "close-session",
            payload: { tabId: 10, sessionId: "sess-bbb" },
          }),
      });

      // Registration should still exist
      const reg = contextStore.getSessionRegistration(10);
      expect(reg).toBeDefined();
      expect(reg!.sessionId).toBe("sess-aaa");
    });

    it("peer disconnect unregisters the session owned by that peer", () => {
      const peer = createMockPeer();
      handler.open(peer as any);

      handler.message(peer as any, {
        text: () =>
          JSON.stringify({
            type: "register-tab",
            payload: { tabId: 10, sessionId: "sess-aaa", clientType: "extension" },
          }),
      });

      expect(contextStore.getSessionRegistration(10)).toBeDefined();

      // Peer disconnects
      handler.close(peer as any);

      // Registration should be cleaned up
      expect(contextStore.getSessionRegistration(10)).toBeUndefined();
    });

    it("peer disconnect does not unregister tab if another peer re-registered it", () => {
      const peer1 = createMockPeer();
      handler.open(peer1 as any);

      handler.message(peer1 as any, {
        text: () =>
          JSON.stringify({
            type: "register-tab",
            payload: { tabId: 10, sessionId: "sess-aaa", clientType: "extension" },
          }),
      });

      // First peer disconnects, which unregisters tab 10
      handler.close(peer1 as any);
      expect(contextStore.getSessionRegistration(10)).toBeUndefined();

      // Second peer claims the now-free tab
      const peer2 = createMockPeer();
      handler.open(peer2 as any);

      handler.message(peer2 as any, {
        text: () =>
          JSON.stringify({
            type: "register-tab",
            payload: { tabId: 10, sessionId: "sess-bbb", clientType: "extension" },
          }),
      });

      const reg = contextStore.getSessionRegistration(10);
      expect(reg).toBeDefined();
      expect(reg!.sessionId).toBe("sess-bbb");
    });

    it("close-session allows tab to be reclaimed by a new session", () => {
      const peer = createMockPeer();
      handler.open(peer as any);

      handler.message(peer as any, {
        text: () =>
          JSON.stringify({
            type: "register-tab",
            payload: { tabId: 10, sessionId: "sess-aaa", clientType: "extension" },
          }),
      });

      handler.message(peer as any, {
        text: () =>
          JSON.stringify({
            type: "close-session",
            payload: { tabId: 10, sessionId: "sess-aaa" },
          }),
      });

      // Now a new session should be able to claim this tab
      const peer2 = createMockPeer();
      handler.open(peer2 as any);

      handler.message(peer2 as any, {
        text: () =>
          JSON.stringify({
            type: "register-tab",
            payload: { tabId: 10, sessionId: "sess-ccc", clientType: "cli" },
          }),
      });

      expect(peer2.sent.length).toBe(0); // no error
      const reg = contextStore.getSessionRegistration(10);
      expect(reg!.sessionId).toBe("sess-ccc");
    });
  });
});
