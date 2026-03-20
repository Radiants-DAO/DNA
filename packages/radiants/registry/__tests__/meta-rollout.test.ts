import { describe, expect, it } from "vitest";
import { buildRegistryMetadata } from "../build-registry-metadata";

describe("meta rollout", () => {
  it("produces more than 20 entries from canonical metadata", () => {
    const entries = buildRegistryMetadata();
    expect(entries.length).toBeGreaterThan(20);
  });

  it("every non-excluded component has a category", () => {
    const entries = buildRegistryMetadata();
    for (const entry of entries) {
      expect(entry.category).toBeTruthy();
    }
  });

  it("every non-excluded component has a sourcePath", () => {
    const entries = buildRegistryMetadata();
    for (const entry of entries) {
      expect(entry.sourcePath).toBeTruthy();
    }
  });
});
