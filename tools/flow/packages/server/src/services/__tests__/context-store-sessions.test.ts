import { describe, it, expect, beforeEach } from "vitest";
import { ContextStore } from "../context-store.js";

describe("ContextStore session registration", () => {
  let store: ContextStore;

  beforeEach(() => {
    store = new ContextStore();
  });

  it("registers a new session for a tab", () => {
    const ok = store.registerSession(1, "sess-aaa", "extension");
    expect(ok).toBe(true);

    const reg = store.getSessionRegistration(1);
    expect(reg).toBeDefined();
    expect(reg!.tabId).toBe(1);
    expect(reg!.sessionId).toBe("sess-aaa");
    expect(reg!.clientType).toBe("extension");
    expect(reg!.registeredAt).toBeGreaterThan(0);
    expect(reg!.lastSeenAt).toBeGreaterThanOrEqual(reg!.registeredAt);
  });

  it("allows the same sessionId to re-register the same tab", () => {
    store.registerSession(1, "sess-aaa", "extension");
    const ok = store.registerSession(1, "sess-aaa", "extension");
    expect(ok).toBe(true);
  });

  it("rejects a different sessionId for an owned tab", () => {
    store.registerSession(1, "sess-aaa", "extension");
    const ok = store.registerSession(1, "sess-bbb", "extension");
    expect(ok).toBe(false);

    // Original owner unchanged
    const reg = store.getSessionRegistration(1);
    expect(reg!.sessionId).toBe("sess-aaa");
  });

  it("isSessionOwner returns true when no registration exists", () => {
    expect(store.isSessionOwner(99, "any-session")).toBe(true);
  });

  it("isSessionOwner returns true for matching sessionId", () => {
    store.registerSession(1, "sess-aaa", "extension");
    expect(store.isSessionOwner(1, "sess-aaa")).toBe(true);
  });

  it("isSessionOwner returns false for non-matching sessionId", () => {
    store.registerSession(1, "sess-aaa", "extension");
    expect(store.isSessionOwner(1, "sess-bbb")).toBe(false);
  });

  it("touchSession updates lastSeenAt", () => {
    store.registerSession(1, "sess-aaa", "extension");
    const before = store.getSessionRegistration(1)!.lastSeenAt;

    store.touchSession(1);

    const after = store.getSessionRegistration(1)!.lastSeenAt;
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it("unregisterSession removes the registration", () => {
    store.registerSession(1, "sess-aaa", "extension");
    store.unregisterSession(1);

    expect(store.getSessionRegistration(1)).toBeUndefined();
  });

  it("unregistered tab can be claimed by a new session", () => {
    store.registerSession(1, "sess-aaa", "extension");
    store.unregisterSession(1);

    const ok = store.registerSession(1, "sess-bbb", "cli");
    expect(ok).toBe(true);

    const reg = store.getSessionRegistration(1);
    expect(reg!.sessionId).toBe("sess-bbb");
    expect(reg!.clientType).toBe("cli");
  });

  it("getAllSessionRegistrations returns all registered sessions", () => {
    store.registerSession(1, "sess-aaa", "extension");
    store.registerSession(2, "sess-bbb", "cli");

    const all = store.getAllSessionRegistrations();
    expect(all.length).toBe(2);
    expect(all.map(r => r.tabId).sort()).toEqual([1, 2]);
  });

  it("preserves registeredAt on re-registration", () => {
    store.registerSession(1, "sess-aaa", "extension");
    const originalRegisteredAt = store.getSessionRegistration(1)!.registeredAt;

    // Re-register same session
    store.registerSession(1, "sess-aaa", "extension");

    const reg = store.getSessionRegistration(1);
    expect(reg!.registeredAt).toBe(originalRegisteredAt);
  });
});
