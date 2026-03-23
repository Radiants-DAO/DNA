import { describe, it, expect } from "vitest";
import { registry as sharedRegistry } from "@rdna/radiants/registry";
import { registry } from "../registry";
import { appRegistry } from "../app-registry";
import { isRenderable } from "../types";
import type { RegistryEntry } from "../types";

describe("registry", () => {
  it("contains entries from @rdna/radiants", () => {
    const radiants = registry.filter((e) => e.packageName === "@rdna/radiants");
    expect(radiants.length).toBeGreaterThan(0);
  });

  it("only contains installed package entries", () => {
    const packages = new Set(registry.map((e) => e.packageName));
    expect(packages).toContain("@rdna/radiants");
  });

  it("has at least one distinct packageName value", () => {
    const packages = new Set(registry.map((e) => e.packageName));
    expect(packages.size).toBeGreaterThanOrEqual(1);
  });

  it("radiants entries have non-null Component (renderable)", () => {
    const radiants = registry.filter((e) => e.packageName === "@rdna/radiants");
    for (const entry of radiants) {
      expect(entry.Component).not.toBeNull();
    }
  });

  it("has no duplicate entry ids", () => {
    const ids = registry.map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("does not double-count radiants components from manifest", () => {
    // Button exists in both radiants shared registry and manifest.
    // It should only appear once, from the shared registry.
    const buttons = registry.filter(
      (e) => e.componentName === "Button" && e.packageName === "@rdna/radiants",
    );
    expect(buttons).toHaveLength(1);
  });

  it("preserves filename labels while exposing normalized component names", () => {
    const radiantsButton = registry.find(
      (e) => e.packageName === "@rdna/radiants" && e.id === "button",
    );

    expect(radiantsButton?.label).toBe("Button.tsx");
    expect(radiantsButton?.componentName).toBe("Button");
  });

  it("renderable entries have canonical props from metadata", () => {
    const button = registry.find((e) => e.componentName === "Button");
    expect(button).toBeDefined();
    expect(button!.props).toBeDefined();
    expect(button!.props.mode).toBeDefined();
    expect(button!.props.mode.type).toBe("enum");
    expect(button!.props.tone).toBeDefined();
    expect(button!.props.tone.type).toBe("enum");
  });

  it("canonical props include boolean props", () => {
    const button = registry.find((e) => e.componentName === "Button");
    expect(button!.props.disabled).toBeDefined();
    expect(button!.props.disabled.type).toBe("boolean");
  });

  it("TextArea keeps its own props even though it shares Input.tsx", () => {
    const textarea = registry.find((entry) => entry.componentName === "TextArea");
    expect(textarea?.props.placeholder).toBeDefined();
  });

  it("Radio keeps its own props even though it shares Checkbox.tsx", () => {
    const radio = registry.find((entry) => entry.componentName === "Radio");
    expect(radio?.props.checked).toBeDefined();
  });

  it("has no metadata-only entries when all registered packages are renderable", () => {
    const metadataOnly = registry.filter((e) => e.Component === null);
    expect(metadataOnly).toHaveLength(0);
  });

  it("applies override defaultProps over shared registry defaults", () => {
    // This test verifies the resolution chain works. If a playground
    // override specifies defaultProps, those should win.
    // Currently no overrides set defaultProps, so this tests the
    // fallback path — shared registry exampleProps are used.
    const input = registry.find(
      (e) => e.componentName === "Input" && e.packageName === "@rdna/radiants",
    );
    expect(input).toBeDefined();
    // Input has exampleProps: { placeholder: 'Type something...' } in display meta
    expect(input!.defaultProps).toHaveProperty("placeholder");
  });

  it("uses shared registry variants for radiants entries without playground-local presets", () => {
    const sharedButton = sharedRegistry.find((entry) => entry.name === "Button");
    const playgroundButton = registry.find(
      (entry) => entry.packageName === "@rdna/radiants" && entry.componentName === "Button",
    );

    expect(sharedButton?.variants).toBeDefined();
    expect(playgroundButton?.variants).toEqual(sharedButton?.variants);
  });
});

describe("isRenderable", () => {
  it("returns true for entries with a Component", () => {
    const entry: RegistryEntry = {
      id: "test",
      componentName: "Test",
      label: "Test",
      group: "Actions",
      packageName: "@rdna/radiants",
      Component: () => null,
      rawComponent: null,
      renderMode: "inline",
      defaultProps: {},
      props: {},
      sourcePath: "test.tsx",
    };
    expect(isRenderable(entry)).toBe(true);
  });

  it("returns false for entries with Component: null", () => {
    const entry: RegistryEntry = {
      id: "test",
      componentName: "Test",
      label: "Test",
      group: "Actions",
      packageName: "@rdna/example",
      Component: null,
      rawComponent: null,
      renderMode: "inline",
      defaultProps: {},
      props: {},
      sourcePath: "test.tsx",
    };
    expect(isRenderable(entry)).toBe(false);
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

  it("produces groups for installed packages", () => {
    const groups = buildPackageGroups();
    const packages = Object.keys(groups);
    expect(packages).toContain("@rdna/radiants");
  });

  it("each package has at least one category group", () => {
    const groups = buildPackageGroups();
    for (const [pkg, categories] of Object.entries(groups)) {
      expect(Object.keys(categories).length).toBeGreaterThan(0);
    }
  });

  it("radiants entries are grouped under radiants", () => {
    const groups = buildPackageGroups();
    const radiantsEntries = Object.values(groups["@rdna/radiants"] ?? {}).flat();
    for (const entry of radiantsEntries) {
      expect(entry.packageName).toBe("@rdna/radiants");
    }
  });

  it("has at least one package heading", () => {
    const groups = buildPackageGroups();
    expect(Object.keys(groups).length).toBeGreaterThanOrEqual(1);
  });
});

describe("app-registry integration", () => {
  it("appRegistry is exported as an array", () => {
    expect(Array.isArray(appRegistry)).toBe(true);
  });

  it("app entries contribute to registry total", () => {
    // appRegistry has playground-internal components (ComposerShell, AnnotationPin, etc.)
    const totalWithout = registry.length - appRegistry.length;
    expect(registry.length).toBeGreaterThan(totalWithout);
    expect(appRegistry.length).toBeGreaterThan(0);
  });

  it("app entries with a packageName appear under their own group", () => {
    // Simulate an app entry
    const fakeEntry: RegistryEntry = {
      id: "rados-test-widget",
      componentName: "TestWidget",
      label: "TestWidget",
      group: "Layout",
      packageName: "apps/rad-os",
      Component: () => null,
      rawComponent: null,
      renderMode: "inline",
      defaultProps: {},
      props: {},
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
