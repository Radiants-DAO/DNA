import { describe, expect, it } from "vitest";
import { parsePlaygroundSignalEvent } from "../playground-signal-event";

describe("parsePlaygroundSignalEvent", () => {
  it("parses work-signal payloads", () => {
    expect(
      parsePlaygroundSignalEvent('{"type":"work-signals","active":["button"]}'),
    ).toEqual({ type: "work-signals", active: ["button"] });
  });

  it("parses iteration refresh payloads", () => {
    expect(
      parsePlaygroundSignalEvent('{"type":"iterations-changed","componentId":"button"}'),
    ).toEqual({ type: "iterations-changed", componentId: "button" });
  });

  it("parses annotation change payloads", () => {
    expect(
      parsePlaygroundSignalEvent('{"type":"annotations-changed","componentId":"button"}'),
    ).toEqual({ type: "annotations-changed", componentId: "button" });
  });

  it("returns null for invalid data", () => {
    expect(parsePlaygroundSignalEvent(": heartbeat")).toBeNull();
    expect(parsePlaygroundSignalEvent('{"type":"unknown"}')).toBeNull();
  });
});
