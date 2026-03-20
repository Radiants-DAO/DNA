import { describe, expect, it } from "vitest";
import { buildRegistryMetadata } from "../build-registry-metadata";

describe("meta pilot", () => {
  it("reads registry facts for Button and Badge from co-located meta files", () => {
    const entries = buildRegistryMetadata();
    expect(entries.find((e) => e.name === "Button")?.category).toBe("action");
    expect(entries.find((e) => e.name === "Badge")?.category).toBe("feedback");
  });

  it("Button has states defined in canonical meta", () => {
    const entries = buildRegistryMetadata();
    const button = entries.find((e) => e.name === "Button");
    expect(button?.states).toBeDefined();
    expect(button?.states).toContain("hover");
  });

  it("Badge has variants defined in canonical meta", () => {
    const entries = buildRegistryMetadata();
    const badge = entries.find((e) => e.name === "Badge");
    expect(badge?.variants).toBeDefined();
    expect(badge?.variants!.length).toBeGreaterThan(0);
  });
});
