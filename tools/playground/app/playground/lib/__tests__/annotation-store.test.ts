import { beforeEach, describe, expect, it } from "vitest";
import { annotationStore } from "../../api/agent/annotation-store";
import {
  signalStore,
  type PlaygroundSignalEvent,
} from "../../api/agent/signal-store";

beforeEach(() => {
  annotationStore.clearAll();
});

describe("annotationStore", () => {
  it("starts with no annotations", () => {
    expect(annotationStore.getAll()).toEqual([]);
  });

  it("adds an annotation and retrieves it", () => {
    const annotation = annotationStore.add({
      componentId: "button",
      intent: "fix",
      priority: "P1",
      message: "Border radius should use radius-sm token",
    });

    expect(annotation.id).toBeDefined();
    expect(annotation.status).toBe("pending");
    expect(annotation.createdAt).toBeGreaterThan(0);

    const all = annotationStore.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].componentId).toBe("button");
  });

  it("filters by component", () => {
    annotationStore.add({
      componentId: "button",
      intent: "fix",
      priority: "P1",
      message: "Fix border",
    });
    annotationStore.add({
      componentId: "card",
      intent: "change",
      priority: "P3",
      message: "Try warmer bg",
    });

    expect(annotationStore.getForComponent("button")).toHaveLength(1);
    expect(annotationStore.getForComponent("card")).toHaveLength(1);
    expect(annotationStore.getForComponent("toast")).toHaveLength(0);
  });

  it("filters by status", () => {
    const a = annotationStore.add({
      componentId: "button",
      intent: "fix",
      priority: "P1",
      message: "Fix border",
    });

    annotationStore.resolve(a.id, "Fixed with radius-sm");

    expect(annotationStore.getPending()).toHaveLength(0);
    expect(annotationStore.getPending("button")).toHaveLength(0);
    expect(annotationStore.getAll()).toHaveLength(1);
    expect(annotationStore.getAll()[0].status).toBe("resolved");
    expect(annotationStore.getAll()[0].resolution).toBe("Fixed with radius-sm");
  });

  it("dismisses an annotation", () => {
    const a = annotationStore.add({
      componentId: "button",
      intent: "question",
      priority: "P3",
      message: "Should this be rounded?",
    });

    annotationStore.dismiss(a.id, "Not applicable");

    const all = annotationStore.getAll();
    expect(all[0].status).toBe("dismissed");
    expect(all[0].resolution).toBe("Not applicable");
  });

  it("throws on resolve/dismiss with invalid id", () => {
    expect(() => annotationStore.resolve("nonexistent", "done")).toThrow(
      "Annotation not found",
    );
    expect(() => annotationStore.dismiss("nonexistent", "skip")).toThrow(
      "Annotation not found",
    );
  });

  it("stores x/y coordinates when provided", () => {
    const annotation = annotationStore.add({
      componentId: "button",
      intent: "fix",
      priority: "P1",
      message: "This corner radius",
      x: 85.5,
      y: 12.3,
    });

    expect(annotation.x).toBe(85.5);
    expect(annotation.y).toBe(12.3);
  });

  it("leaves x/y undefined when not provided", () => {
    const annotation = annotationStore.add({
      componentId: "button",
      intent: "change",
      priority: "P3",
      message: "No position",
    });

    expect(annotation.x).toBeUndefined();
    expect(annotation.y).toBeUndefined();
  });

  it("emits annotations-changed signal on add", () => {
    const events: PlaygroundSignalEvent[] = [];
    const unsub = signalStore.subscribe((e) => events.push(e));

    annotationStore.add({
      componentId: "button",
      intent: "fix",
      priority: "P1",
      message: "Test signal emission",
    });

    unsub();
    expect(events).toContainEqual({
      type: "annotations-changed",
      componentId: "button",
    });
  });

  it("supports null priority (unprioritized)", () => {
    const annotation = annotationStore.add({
      componentId: "button",
      intent: "change",
      priority: null,
      message: "Unprioritized annotation",
    });

    expect(annotation.priority).toBeNull();
    expect(annotation.status).toBe("pending");

    const all = annotationStore.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].priority).toBeNull();
  });

  it("emits annotations-changed signal on resolve", () => {
    const a = annotationStore.add({
      componentId: "card",
      intent: "change",
      priority: "P3",
      message: "Signal test",
    });

    const events: PlaygroundSignalEvent[] = [];
    const unsub = signalStore.subscribe((e) => events.push(e));

    annotationStore.resolve(a.id, "Done");

    unsub();
    expect(events).toContainEqual({
      type: "annotations-changed",
      componentId: "card",
    });
  });
});
