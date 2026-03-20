import { describe, expect, it } from "vitest";
import { buildRegistryMetadata } from "@rdna/radiants/registry";
import { getManifestEntry } from "../../../generated/registry";

describe("radiants manifest sync", () => {
  it("every shared Radiants entry resolves manifest metadata by name", () => {
    for (const entry of buildRegistryMetadata()) {
      const hit = getManifestEntry("@rdna/radiants", entry.name);
      expect(hit?.name).toBe(entry.name);
    }
  });

  it("manifest category matches registry category for every Radiants entry", () => {
    for (const entry of buildRegistryMetadata()) {
      const hit = getManifestEntry("@rdna/radiants", entry.name);
      expect(hit?.category).toBe(entry.category);
    }
  });

  it("manifest renderMode matches registry renderMode for every Radiants entry", () => {
    for (const entry of buildRegistryMetadata()) {
      const hit = getManifestEntry("@rdna/radiants", entry.name);
      expect(hit?.renderMode).toBe(entry.renderMode);
    }
  });

  // Spot-checks for canonical (migrated) components
  it("manifest carries tags from canonical meta for Button", () => {
    const button = getManifestEntry("@rdna/radiants", "Button");
    expect(button?.tags).toBeDefined();
    expect(button?.tags).toContain("cta");
    expect(button?.tags).toContain("action");
  });

  it("manifest carries exampleProps from canonical meta for Button", () => {
    const button = getManifestEntry("@rdna/radiants", "Button");
    expect(button?.exampleProps?.children).toBe("Button");
    expect(button?.exampleProps?.icon).toBe("go-forward");
  });

  it("manifest carries states from canonical meta for Button", () => {
    const button = getManifestEntry("@rdna/radiants", "Button");
    expect(button?.states).toBeDefined();
    expect(button?.states).toContain("hover");
    expect(button?.states).toContain("disabled");
  });

  it("manifest carries tags from canonical meta for Badge", () => {
    const badge = getManifestEntry("@rdna/radiants", "Badge");
    expect(badge?.tags).toBeDefined();
    expect(badge?.category).toBe("feedback");
  });
});
