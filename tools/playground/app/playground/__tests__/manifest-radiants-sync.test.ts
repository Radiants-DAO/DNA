import { describe, expect, it } from "vitest";
import { buildRegistryMetadata } from "@rdna/radiants/registry";
import { getManifestEntry } from "../../../generated/registry";
import { pickContractFields } from "../../../../../packages/radiants/registry/contract-fields.ts";
import { buildManifestContractFields } from "../../../scripts/generate-registry.ts";

describe("radiants manifest sync", () => {
  it("reuses the same sparse contract projection for manifest serialization", () => {
    const fixture = {
      name: "Separator",
      description: "Separator",
      props: {},
      replaces: [{ element: "hr", import: "@rdna/radiants/components/core" }],
      wraps: "@base-ui/react/separator",
    };

    expect(buildManifestContractFields(fixture)).toEqual(
      pickContractFields(fixture),
    );
  });

  it("keeps manifest contract projection sparse when fields are absent", () => {
    expect(buildManifestContractFields({ name: "Plain", description: "Plain", props: {} })).toEqual({});
  });

  it("every shared Radiants entry resolves manifest metadata by name", () => {
    for (const entry of buildRegistryMetadata()) {
      const hit = getManifestEntry("@rdna/radiants", entry.name);
      expect(hit?.name, `${entry.name}: not in manifest`).toBe(entry.name);
    }
  });

  it("manifest category matches registry for every entry", () => {
    for (const entry of buildRegistryMetadata()) {
      const hit = getManifestEntry("@rdna/radiants", entry.name);
      expect(hit?.category, `${entry.name}: category mismatch`).toBe(entry.category);
    }
  });

  it("manifest renderMode matches registry for every entry", () => {
    for (const entry of buildRegistryMetadata()) {
      const hit = getManifestEntry("@rdna/radiants", entry.name);
      expect(hit?.renderMode, `${entry.name}: renderMode mismatch`).toBe(entry.renderMode);
    }
  });

  it("manifest paths match registry for every entry", () => {
    for (const entry of buildRegistryMetadata()) {
      const hit = getManifestEntry("@rdna/radiants", entry.name);
      expect(hit?.sourcePath ?? "", `${entry.name}: sourcePath mismatch`).toBe(entry.sourcePath);
      expect(hit?.schemaPath, `${entry.name}: schemaPath mismatch`).toBe(entry.schemaPath);
    }
  });

  it("manifest tags match registry for every entry", () => {
    for (const entry of buildRegistryMetadata()) {
      const hit = getManifestEntry("@rdna/radiants", entry.name);
      // Both should produce the same tags array from the same *.meta.ts source
      expect(hit?.tags ?? [], `${entry.name}: tags mismatch`).toEqual(entry.tags ?? []);
    }
  });

  it("manifest exampleProps match registry for every entry that has them", () => {
    for (const entry of buildRegistryMetadata()) {
      if (!entry.exampleProps) continue;
      const hit = getManifestEntry("@rdna/radiants", entry.name);
      expect(hit?.exampleProps, `${entry.name}: exampleProps mismatch`).toEqual(entry.exampleProps);
    }
  });

  it("manifest states match registry for every entry that has them", () => {
    for (const entry of buildRegistryMetadata()) {
      if (!entry.states) continue;
      const hit = getManifestEntry("@rdna/radiants", entry.name);
      expect(hit?.states, `${entry.name}: states mismatch`).toEqual(entry.states);
    }
  });

  it("manifest controlledProps match registry for every entry that has them", () => {
    for (const entry of buildRegistryMetadata()) {
      if (!entry.controlledProps) continue;
      const hit = getManifestEntry("@rdna/radiants", entry.name);
      expect(hit?.controlledProps, `${entry.name}: controlledProps mismatch`).toEqual(entry.controlledProps);
    }
  });
});
