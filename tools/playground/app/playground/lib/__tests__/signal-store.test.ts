import { beforeEach, describe, expect, it } from "vitest";
import { signalStore, type PlaygroundSignalEvent } from "../../api/agent/signal-store";

beforeEach(() => {
  signalStore.clearAll();
});

describe("signalStore", () => {
  it("starts with no active signals", () => {
    expect(signalStore.getActive()).toEqual([]);
  });

  it("broadcasts active signal snapshots", () => {
    const events: PlaygroundSignalEvent[] = [];
    const unsubscribe = signalStore.subscribe((event) => events.push(event));

    signalStore.workStart("button");
    signalStore.workEnd("button");

    unsubscribe();

    expect(events).toEqual([
      { type: "work-signals", active: ["button"] },
      { type: "work-signals", active: [] },
    ]);
  });

  it("broadcasts iteration refresh events", () => {
    const events: PlaygroundSignalEvent[] = [];
    const unsubscribe = signalStore.subscribe((event) => events.push(event));

    signalStore.iterationsChanged("button");

    unsubscribe();

    expect(events).toEqual([
      { type: "iterations-changed", componentId: "button" },
    ]);
  });
});
