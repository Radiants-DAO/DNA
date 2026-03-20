import { describe, expect, it } from "vitest";
import { defineComponentMeta } from "../define-component-meta";

describe("defineComponentMeta", () => {
  it("supports registry metadata alongside schema and dna fields", () => {
    const meta = defineComponentMeta<Record<string, unknown>>()({
      name: "Badge",
      description: "Badge",
      props: {},
      registry: { category: "feedback" },
    });

    expect(meta.registry?.category).toBe("feedback");
  });

  it("supports forced state declarations and typed example props", () => {
    const meta = defineComponentMeta<{ mode?: "solid"; disabled?: boolean }>()({
      name: "Button",
      description: "Button",
      props: {},
      registry: {
        category: "action",
        states: ["hover", "pressed", "focus"],
        exampleProps: { mode: "solid", disabled: false },
      },
    });

    expect(meta.registry?.states).toContain("hover");
    expect(meta.registry?.exampleProps?.mode).toBe("solid");
  });
});
