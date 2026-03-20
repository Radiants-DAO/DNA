import { describe, expect, it } from "vitest";
import { buildRegistryMetadata } from "@rdna/radiants/registry/build-registry-metadata";
import { getManifestEntry } from "../../../generated/registry";

describe("radiants manifest sync", () => {
  it("every shared Radiants entry resolves manifest metadata by name", () => {
    for (const entry of buildRegistryMetadata()) {
      const hit = getManifestEntry("@rdna/radiants", entry.name);
      expect(hit?.name).toBe(entry.name);
    }
  });

  it("manifest carries canonical category for Radiants entries", () => {
    const button = getManifestEntry("@rdna/radiants", "Button");
    expect(button?.category).toBeDefined();
    expect(button?.category).toBe("action");
  });

  it("manifest carries renderMode for Radiants entries", () => {
    const button = getManifestEntry("@rdna/radiants", "Button");
    expect(button?.renderMode).toBe("inline");
  });
});
