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
});
