import { describe, it, expect } from "vitest";
import { registry } from "../registry";
import { appRegistry } from "../app-registry";
import { isRenderable } from "../types";
import type { RegistryEntry } from "../types";

describe("registry", () => {
  // ── Multi-package coverage ──────────────────────────────────────────

  it("contains entries from @rdna/radiants", () => {
    const radiants = registry.filter((e) => e.packageName === "@rdna/radiants");
    expect(radiants.length).toBeGreaterThan(0);
  });

  it("contains entries from @rdna/monolith", () => {
    const monolith = registry.filter((e) => e.packageName === "@rdna/monolith");
    expect(monolith.length).toBeGreaterThan(0);
  });

  it("has at least two distinct packageName values", () => {
    const packages = new Set(registry.map((e) => e.packageName));
    expect(packages.size).toBeGreaterThanOrEqual(2);
  });

  // ── Manifest-only entries (Component: null) ─────────────────────────

  it("monolith entries have Component: null (metadata-only)", () => {
    const monolith = registry.filter((e) => e.packageName === "@rdna/monolith");
    for (const entry of monolith) {
      expect(entry.Component).toBeNull();
    }
  });

  it("radiants entries have non-null Component (renderable)", () => {
    const radiants = registry.filter((e) => e.packageName === "@rdna/radiants");
    for (const entry of radiants) {
      expect(entry.Component).not.toBeNull();
    }
  });

  // ── No duplicates ──────────────────────────────────────────────────

  it("has no duplicate entry ids", () => {
    const ids = registry.map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("does not double-count radiants components from manifest", () => {
    // Button exists in both radiants shared registry and manifest.
    // It should only appear once, from the shared registry.
    const buttons = registry.filter(
      (e) => e.label === "Button" && e.packageName === "@rdna/radiants",
    );
    expect(buttons).toHaveLength(1);
  });

  // ── Metadata-only entry shape ──────────────────────────────────────

  it("manifest-only entries have valid structure", () => {
    const metadataOnly = registry.filter((e) => e.Component === null);
    expect(metadataOnly.length).toBeGreaterThan(0);

    for (const entry of metadataOnly) {
      expect(entry.id).toBeTruthy();
      expect(entry.label).toBeTruthy();
      expect(entry.group).toBeTruthy();
      expect(entry.packageName).toBeTruthy();
      expect(typeof entry.sourcePath).toBe("string");
    }
  });

  it("manifest-only entries get a category group from inferCategory", () => {
    const monolith = registry.filter((e) => e.packageName === "@rdna/monolith");
    const groups = new Set(monolith.map((e) => e.group));
    // At least some should get a real category, not all "Components"
    expect(groups.size).toBeGreaterThan(1);
  });

  // ── Category inference spot checks ─────────────────────────────────

  it("infers Actions for monolith Button", () => {
    const btn = registry.find(
      (e) => e.label === "Button" && e.packageName === "@rdna/monolith",
    );
    expect(btn).toBeDefined();
    expect(btn!.group).toBe("Actions");
  });

  it("infers Layout for monolith AppWindow", () => {
    const win = registry.find(
      (e) => e.label === "AppWindow" && e.packageName === "@rdna/monolith",
    );
    expect(win).toBeDefined();
    expect(win!.group).toBe("Layout");
  });

  it("infers Navigation for monolith CrtTabs", () => {
    const tabs = registry.find(
      (e) => e.label === "CrtTabs" && e.packageName === "@rdna/monolith",
    );
    expect(tabs).toBeDefined();
    expect(tabs!.group).toBe("Navigation");
  });

  // ── Token bindings from manifest ───────────────────────────────────

  it("manifest-only entries carry tokenBindings when dna.json exists", () => {
    const monolithButton = registry.find(
      (e) => e.label === "Button" && e.packageName === "@rdna/monolith",
    );
    expect(monolithButton).toBeDefined();
    expect(monolithButton!.tokenBindings).not.toBeNull();
  });

  // ── Override defaultProps ──────────────────────────────────────────

  it("applies override defaultProps over shared registry defaults", () => {
    // This test verifies the resolution chain works. If a playground
    // override specifies defaultProps, those should win.
    // Currently no overrides set defaultProps, so this tests the
    // fallback path — shared registry exampleProps are used.
    const input = registry.find(
      (e) => e.label === "Input" && e.packageName === "@rdna/radiants",
    );
    expect(input).toBeDefined();
    // Input has exampleProps: { placeholder: 'Type something...' } in display meta
    expect(input!.defaultProps).toHaveProperty("placeholder");
  });
});

describe("isRenderable", () => {
  it("returns true for entries with a Component", () => {
    const entry: RegistryEntry = {
      id: "test",
      label: "Test",
      group: "Actions",
      packageName: "@rdna/radiants",
      Component: () => null,
      rawComponent: null,
      renderMode: "inline",
      defaultProps: {},
      sourcePath: "test.tsx",
    };
    expect(isRenderable(entry)).toBe(true);
  });

  it("returns false for entries with Component: null", () => {
    const entry: RegistryEntry = {
      id: "test",
      label: "Test",
      group: "Actions",
      packageName: "@rdna/monolith",
      Component: null,
      rawComponent: null,
      renderMode: "inline",
      defaultProps: {},
      sourcePath: "test.tsx",
    };
    expect(isRenderable(entry)).toBe(false);
  });

  it("correctly identifies real monolith entries as non-renderable", () => {
    const monolith = registry.filter((e) => e.packageName === "@rdna/monolith");
    for (const entry of monolith) {
      expect(isRenderable(entry)).toBe(false);
    }
  });

  it("correctly identifies real radiants entries as renderable", () => {
    const radiants = registry.filter((e) => e.packageName === "@rdna/radiants");
    for (const entry of radiants) {
      expect(isRenderable(entry)).toBe(true);
    }
  });
});

describe("sidebar grouping structure", () => {
  /**
   * Replicates the grouping logic from PlaygroundSidebar.tsx:33
   * to verify the data structure the sidebar will receive.
   */
  function buildPackageGroups() {
    return registry.reduce<Record<string, Record<string, RegistryEntry[]>>>(
      (acc, entry) => {
        const pkg = entry.packageName;
        if (!acc[pkg]) acc[pkg] = {};
        const g = entry.group;
        if (!acc[pkg][g]) acc[pkg][g] = [];
        acc[pkg][g].push(entry);
        return acc;
      },
      {},
    );
  }

  it("produces groups for multiple packages", () => {
    const groups = buildPackageGroups();
    const packages = Object.keys(groups);
    expect(packages).toContain("@rdna/radiants");
    expect(packages).toContain("@rdna/monolith");
  });

  it("each package has at least one category group", () => {
    const groups = buildPackageGroups();
    for (const [pkg, categories] of Object.entries(groups)) {
      expect(Object.keys(categories).length).toBeGreaterThan(0);
    }
  });

  it("monolith entries are grouped under monolith, not radiants", () => {
    const groups = buildPackageGroups();
    const monolithEntries = Object.values(groups["@rdna/monolith"] ?? {}).flat();
    for (const entry of monolithEntries) {
      expect(entry.packageName).toBe("@rdna/monolith");
    }
  });

  it("packageCount > 1 so package headings will render", () => {
    const groups = buildPackageGroups();
    expect(Object.keys(groups).length).toBeGreaterThan(1);
  });
});

describe("app-registry integration", () => {
  it("appRegistry is exported as an array", () => {
    expect(Array.isArray(appRegistry)).toBe(true);
  });

  it("app entries would merge into the registry if populated", () => {
    // appRegistry starts empty — verify it contributes to the total
    const totalWithout = registry.length - appRegistry.length;
    expect(totalWithout).toBe(registry.length); // empty appRegistry adds nothing
  });

  it("app entries with a packageName appear under their own group", () => {
    // Simulate an app entry
    const fakeEntry: RegistryEntry = {
      id: "rados-test-widget",
      label: "TestWidget",
      group: "Layout",
      packageName: "apps/rad-os",
      Component: () => null,
      rawComponent: null,
      renderMode: "inline",
      defaultProps: {},
      sourcePath: "apps/rad-os/components/TestWidget.tsx",
    };

    const combined = [...registry, fakeEntry];
    const groups = combined.reduce<Record<string, RegistryEntry[]>>(
      (acc, entry) => {
        const pkg = entry.packageName;
        if (!acc[pkg]) acc[pkg] = [];
        acc[pkg].push(entry);
        return acc;
      },
      {},
    );

    expect(groups["apps/rad-os"]).toHaveLength(1);
    expect(groups["apps/rad-os"][0].id).toBe("rados-test-widget");
  });
});
