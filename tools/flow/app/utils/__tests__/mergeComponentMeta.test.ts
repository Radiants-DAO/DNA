/**
 * Tests for Hybrid Component Discovery - Merge Function
 *
 * Covers all edge cases from fn-2-gnc.11 spec:
 * - Matching static + runtime components
 * - Runtime-only components (dynamic)
 * - Static-only components (unrendered)
 * - Multiple instances of same component
 * - Component name differences (displayName vs export name)
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { describe, it, expect } from "vitest";
import type { ComponentInfo } from "../../bindings";
import type { SerializedComponentEntry, SourceLocation } from "../../stores/types";
import {
  mergeComponentMeta,
  getComponentKey,
  getKeyFromSource,
  getKeyFromComponentInfo,
  toComponentInstance,
  fromComponentInfo,
  fromRuntimeEntry,
  createMergedComponentMap,
  createRadflowIdMap,
  findByRadflowId,
  findByFileAndLine,
  getRenderedComponents,
  getUnrenderedComponents,
  getMergeStats,
} from "../mergeComponentMeta";

// =============================================================================
// Test Fixtures
// =============================================================================

function createStaticComponent(
  name: string,
  file: string,
  line: number,
  props: Array<{ name: string; type: string; required?: boolean }> = []
): ComponentInfo {
  return {
    name,
    file,
    line,
    defaultExport: false,
    unionTypes: [],
    props: props.map((p) => ({
      name: p.name,
      type: p.type,
      required: p.required ?? true,
      default: null,
      doc: null,
      controlType: null,
      options: null,
    })),
  };
}

function createRuntimeEntry(
  radflowId: string,
  name: string,
  source: SourceLocation | null,
  props: Record<string, unknown> = {}
): SerializedComponentEntry {
  return {
    radflowId,
    name,
    displayName: null,
    selector: `[data-radflow-id="${radflowId}"]`,
    fallbackSelectors: [],
    source,
    fiberType: "function",
    props,
    parentId: null,
    childIds: [],
  };
}

function createSource(filePath: string, line: number): SourceLocation {
  return {
    filePath,
    relativePath: filePath.replace("/Users/test/", ""),
    line,
    column: 1,
  };
}

// =============================================================================
// Key Generation Tests
// =============================================================================

describe("Key Generation", () => {
  it("generates consistent keys from file and line", () => {
    const key = getComponentKey("/src/Button.tsx", 10);
    expect(key).toBe("/src/Button.tsx:10");
  });

  it("generates key from SourceLocation", () => {
    const source = createSource("/src/Button.tsx", 10);
    const key = getKeyFromSource(source);
    expect(key).toBe("/src/Button.tsx:10");
  });

  it("generates key from ComponentInfo", () => {
    const info = createStaticComponent("Button", "/src/Button.tsx", 10);
    const key = getKeyFromComponentInfo(info);
    expect(key).toBe("/src/Button.tsx:10");
  });

  it("different lines produce different keys", () => {
    const key1 = getComponentKey("/src/Button.tsx", 10);
    const key2 = getComponentKey("/src/Button.tsx", 20);
    expect(key1).not.toBe(key2);
  });

  it("different files produce different keys", () => {
    const key1 = getComponentKey("/src/Button.tsx", 10);
    const key2 = getComponentKey("/src/Card.tsx", 10);
    expect(key1).not.toBe(key2);
  });
});

// =============================================================================
// Conversion Tests
// =============================================================================

describe("Conversion Utilities", () => {
  describe("toComponentInstance", () => {
    it("converts SerializedComponentEntry to ComponentInstance", () => {
      const entry = createRuntimeEntry(
        "rf_abc123",
        "Button",
        createSource("/src/Button.tsx", 10),
        { variant: "primary" }
      );

      const instance = toComponentInstance(entry);

      expect(instance.radflowId).toBe("rf_abc123");
      expect(instance.selector).toBe('[data-radflow-id="rf_abc123"]');
      expect(instance.fiberType).toBe("function");
      expect(instance.props).toEqual({ variant: "primary" });
    });
  });

  describe("fromComponentInfo", () => {
    it("converts ComponentInfo to ComponentMeta", () => {
      const info = createStaticComponent("Button", "/src/Button.tsx", 10, [
        { name: "variant", type: "string" },
        { name: "onClick", type: "() => void" },
      ]);

      const meta = fromComponentInfo(info);

      expect(meta.name).toBe("Button");
      expect(meta.file).toBe("/src/Button.tsx");
      expect(meta.line).toBe(10);
      expect(meta.props).toHaveLength(2);
      expect(meta.instances).toEqual([]);
    });
  });

  describe("fromRuntimeEntry", () => {
    it("creates ComponentMeta from runtime entry", () => {
      const entry = createRuntimeEntry(
        "rf_abc123",
        "Button",
        createSource("/src/Button.tsx", 10)
      );

      const meta = fromRuntimeEntry(entry);

      expect(meta).not.toBeNull();
      expect(meta!.name).toBe("Button");
      expect(meta!.file).toBe("/src/Button.tsx");
      expect(meta!.line).toBe(10);
      expect(meta!.props).toEqual([]);
      expect(meta!.instances).toHaveLength(1);
    });

    it("returns null for entries without source", () => {
      const entry = createRuntimeEntry("rf_abc123", "Button", null);
      const meta = fromRuntimeEntry(entry);
      expect(meta).toBeNull();
    });

    it("uses displayName over name when available", () => {
      const entry: SerializedComponentEntry = {
        ...createRuntimeEntry("rf_abc123", "Button", createSource("/src/Button.tsx", 10)),
        displayName: "PrimaryButton",
      };

      const meta = fromRuntimeEntry(entry);
      expect(meta!.name).toBe("PrimaryButton");
    });
  });
});

// =============================================================================
// Merge Function Tests
// =============================================================================

describe("mergeComponentMeta", () => {
  describe("matching static + runtime", () => {
    it("merges component found in both static and runtime", () => {
      const staticMeta = [
        createStaticComponent("Button", "/src/Button.tsx", 10, [
          { name: "variant", type: "string" },
        ]),
      ];

      const runtimeEntries = [
        createRuntimeEntry(
          "rf_abc123",
          "Button",
          createSource("/src/Button.tsx", 10),
          { variant: "primary" }
        ),
      ];

      const merged = mergeComponentMeta(staticMeta, runtimeEntries);

      expect(merged).toHaveLength(1);
      expect(merged[0].name).toBe("Button");
      expect(merged[0].props).toHaveLength(1);
      expect(merged[0].instances).toHaveLength(1);
      expect(merged[0].instances[0].props).toEqual({ variant: "primary" });
    });

    it("handles multiple instances of same component", () => {
      const staticMeta = [
        createStaticComponent("Button", "/src/Button.tsx", 10),
      ];

      const runtimeEntries = [
        createRuntimeEntry("rf_1", "Button", createSource("/src/Button.tsx", 10)),
        createRuntimeEntry("rf_2", "Button", createSource("/src/Button.tsx", 10)),
        createRuntimeEntry("rf_3", "Button", createSource("/src/Button.tsx", 10)),
      ];

      const merged = mergeComponentMeta(staticMeta, runtimeEntries);

      expect(merged).toHaveLength(1);
      expect(merged[0].instances).toHaveLength(3);
      expect(merged[0].instances.map((i) => i.radflowId)).toEqual([
        "rf_1",
        "rf_2",
        "rf_3",
      ]);
    });

    it("matches by file:line when names differ", () => {
      // Static analysis finds "Button" as export name
      const staticMeta = [
        createStaticComponent("Button", "/src/Button.tsx", 10, [
          { name: "variant", type: "string" },
        ]),
      ];

      // Runtime finds "PrimaryButton" as displayName
      const runtimeEntries: SerializedComponentEntry[] = [
        {
          ...createRuntimeEntry("rf_abc123", "PrimaryButton", createSource("/src/Button.tsx", 10)),
          displayName: "PrimaryButton",
        },
      ];

      const merged = mergeComponentMeta(staticMeta, runtimeEntries);

      expect(merged).toHaveLength(1);
      // Static name wins (has type info)
      expect(merged[0].name).toBe("Button");
      expect(merged[0].props).toHaveLength(1);
      expect(merged[0].instances).toHaveLength(1);
    });
  });

  describe("static-only components", () => {
    it("includes components found only in static analysis", () => {
      const staticMeta = [
        createStaticComponent("Button", "/src/Button.tsx", 10),
        createStaticComponent("Card", "/src/Card.tsx", 5),
      ];

      const runtimeEntries = [
        createRuntimeEntry("rf_1", "Button", createSource("/src/Button.tsx", 10)),
      ];

      const merged = mergeComponentMeta(staticMeta, runtimeEntries);

      expect(merged).toHaveLength(2);

      const button = merged.find((m) => m.name === "Button");
      const card = merged.find((m) => m.name === "Card");

      expect(button!.instances).toHaveLength(1);
      expect(card!.instances).toHaveLength(0);
    });

    it("includes all unrendered components", () => {
      const staticMeta = [
        createStaticComponent("A", "/src/A.tsx", 1),
        createStaticComponent("B", "/src/B.tsx", 1),
        createStaticComponent("C", "/src/C.tsx", 1),
      ];

      const merged = mergeComponentMeta(staticMeta, []);

      expect(merged).toHaveLength(3);
      merged.forEach((m) => {
        expect(m.instances).toHaveLength(0);
      });
    });
  });

  describe("runtime-only components", () => {
    it("includes components found only at runtime", () => {
      const staticMeta: ComponentInfo[] = [];

      const runtimeEntries = [
        createRuntimeEntry("rf_1", "DynamicComp", createSource("/src/Dynamic.tsx", 20)),
      ];

      const merged = mergeComponentMeta(staticMeta, runtimeEntries);

      expect(merged).toHaveLength(1);
      expect(merged[0].name).toBe("DynamicComp");
      expect(merged[0].props).toEqual([]); // No static info
      expect(merged[0].instances).toHaveLength(1);
    });

    it("skips runtime entries without source info", () => {
      const staticMeta: ComponentInfo[] = [];

      const runtimeEntries = [
        createRuntimeEntry("rf_1", "NodeModulesComp", null), // node_modules
        createRuntimeEntry("rf_2", "UserComp", createSource("/src/User.tsx", 10)),
      ];

      const merged = mergeComponentMeta(staticMeta, runtimeEntries);

      expect(merged).toHaveLength(1);
      expect(merged[0].name).toBe("UserComp");
    });

    it("handles multiple instances of runtime-only component", () => {
      const runtimeEntries = [
        createRuntimeEntry("rf_1", "Dynamic", createSource("/src/Dynamic.tsx", 20)),
        createRuntimeEntry("rf_2", "Dynamic", createSource("/src/Dynamic.tsx", 20)),
      ];

      const merged = mergeComponentMeta([], runtimeEntries);

      expect(merged).toHaveLength(1);
      expect(merged[0].instances).toHaveLength(2);
    });
  });

  describe("complex scenarios", () => {
    it("handles mix of all three types", () => {
      const staticMeta = [
        createStaticComponent("Button", "/src/Button.tsx", 10),
        createStaticComponent("Card", "/src/Card.tsx", 5),
        createStaticComponent("Unused", "/src/Unused.tsx", 1),
      ];

      const runtimeEntries = [
        createRuntimeEntry("rf_1", "Button", createSource("/src/Button.tsx", 10)),
        createRuntimeEntry("rf_2", "Card", createSource("/src/Card.tsx", 5)),
        createRuntimeEntry("rf_3", "Dynamic", createSource("/src/Dynamic.tsx", 20)),
      ];

      const merged = mergeComponentMeta(staticMeta, runtimeEntries);

      expect(merged).toHaveLength(4);

      const button = merged.find((m) => m.name === "Button");
      const card = merged.find((m) => m.name === "Card");
      const unused = merged.find((m) => m.name === "Unused");
      const dynamic = merged.find((m) => m.name === "Dynamic");

      expect(button!.instances).toHaveLength(1);
      expect(card!.instances).toHaveLength(1);
      expect(unused!.instances).toHaveLength(0);
      expect(dynamic!.instances).toHaveLength(1);
    });

    it("handles components with same name in different files", () => {
      const staticMeta = [
        createStaticComponent("Button", "/src/ui/Button.tsx", 10),
        createStaticComponent("Button", "/src/legacy/Button.tsx", 5),
      ];

      const runtimeEntries = [
        createRuntimeEntry("rf_1", "Button", createSource("/src/ui/Button.tsx", 10)),
      ];

      const merged = mergeComponentMeta(staticMeta, runtimeEntries);

      expect(merged).toHaveLength(2);

      const uiButton = merged.find((m) => m.file.includes("ui"));
      const legacyButton = merged.find((m) => m.file.includes("legacy"));

      expect(uiButton!.instances).toHaveLength(1);
      expect(legacyButton!.instances).toHaveLength(0);
    });
  });
});

// =============================================================================
// Lookup Utility Tests
// =============================================================================

describe("Lookup Utilities", () => {
  const merged = mergeComponentMeta(
    [createStaticComponent("Button", "/src/Button.tsx", 10)],
    [
      createRuntimeEntry("rf_1", "Button", createSource("/src/Button.tsx", 10)),
      createRuntimeEntry("rf_2", "Button", createSource("/src/Button.tsx", 10)),
    ]
  );

  describe("createMergedComponentMap", () => {
    it("creates map indexed by file:line", () => {
      const map = createMergedComponentMap(merged);

      expect(map.size).toBe(1);
      expect(map.has("/src/Button.tsx:10")).toBe(true);
      expect(map.get("/src/Button.tsx:10")!.name).toBe("Button");
    });
  });

  describe("createRadflowIdMap", () => {
    it("creates map indexed by radflowId", () => {
      const map = createRadflowIdMap(merged);

      expect(map.size).toBe(2);
      expect(map.has("rf_1")).toBe(true);
      expect(map.has("rf_2")).toBe(true);
      // Both point to same ComponentMeta
      expect(map.get("rf_1")).toBe(map.get("rf_2"));
    });
  });

  describe("findByRadflowId", () => {
    it("finds component by radflowId", () => {
      const found = findByRadflowId(merged, "rf_1");
      expect(found).not.toBeUndefined();
      expect(found!.name).toBe("Button");
    });

    it("returns undefined for unknown radflowId", () => {
      const found = findByRadflowId(merged, "rf_unknown");
      expect(found).toBeUndefined();
    });
  });

  describe("findByFileAndLine", () => {
    it("finds component by file and line", () => {
      const found = findByFileAndLine(merged, "/src/Button.tsx", 10);
      expect(found).not.toBeUndefined();
      expect(found!.name).toBe("Button");
    });

    it("returns undefined for unknown location", () => {
      const found = findByFileAndLine(merged, "/src/Unknown.tsx", 1);
      expect(found).toBeUndefined();
    });
  });
});

// =============================================================================
// Filter Utility Tests
// =============================================================================

describe("Filter Utilities", () => {
  const merged = mergeComponentMeta(
    [
      createStaticComponent("Rendered", "/src/Rendered.tsx", 10),
      createStaticComponent("Unrendered", "/src/Unrendered.tsx", 20),
    ],
    [createRuntimeEntry("rf_1", "Rendered", createSource("/src/Rendered.tsx", 10))]
  );

  describe("getRenderedComponents", () => {
    it("returns only components with instances", () => {
      const rendered = getRenderedComponents(merged);

      expect(rendered).toHaveLength(1);
      expect(rendered[0].name).toBe("Rendered");
    });
  });

  describe("getUnrenderedComponents", () => {
    it("returns only components without instances", () => {
      const unrendered = getUnrenderedComponents(merged);

      expect(unrendered).toHaveLength(1);
      expect(unrendered[0].name).toBe("Unrendered");
    });
  });
});

// =============================================================================
// Statistics Tests
// =============================================================================

describe("getMergeStats", () => {
  it("calculates correct statistics", () => {
    // Static components with props (so they can be distinguished from runtime-only)
    const staticMeta = [
      createStaticComponent("A", "/src/A.tsx", 1, [{ name: "label", type: "string" }]),
      createStaticComponent("B", "/src/B.tsx", 1, [{ name: "value", type: "number" }]),
      createStaticComponent("C", "/src/C.tsx", 1, [{ name: "active", type: "boolean" }]),
    ];

    const runtimeEntries = [
      createRuntimeEntry("rf_1", "A", createSource("/src/A.tsx", 1)),
      createRuntimeEntry("rf_2", "A", createSource("/src/A.tsx", 1)),
      createRuntimeEntry("rf_3", "B", createSource("/src/B.tsx", 1)),
      createRuntimeEntry("rf_4", "Dynamic", createSource("/src/Dynamic.tsx", 1)),
    ];

    const merged = mergeComponentMeta(staticMeta, runtimeEntries);
    const stats = getMergeStats(3, 4, merged);

    expect(stats.total).toBe(4); // A, B, C, Dynamic
    expect(stats.merged).toBe(2); // A and B (static + runtime, have props)
    expect(stats.staticOnly).toBe(1); // C (unrendered)
    expect(stats.runtimeOnly).toBe(1); // Dynamic (no static info, no props)
    expect(stats.totalInstances).toBe(4); // rf_1, rf_2, rf_3, rf_4
  });

  it("handles empty merge", () => {
    const stats = getMergeStats(0, 0, []);

    expect(stats.total).toBe(0);
    expect(stats.merged).toBe(0);
    expect(stats.staticOnly).toBe(0);
    expect(stats.runtimeOnly).toBe(0);
    expect(stats.totalInstances).toBe(0);
  });
});
