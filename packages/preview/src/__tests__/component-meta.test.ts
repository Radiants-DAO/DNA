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
        states: [
          { name: "hover", driver: "wrapper" },
          { name: "pressed", driver: "wrapper" },
          { name: "disabled", driver: "prop", prop: "disabled", value: true },
        ],
        exampleProps: { mode: "solid", disabled: false },
      },
    });

    expect(meta.registry?.states?.[0]?.name).toBe("hover");
    expect(meta.registry?.states?.[2]?.prop).toBe("disabled");
    expect(meta.registry?.exampleProps?.mode).toBe("solid");
  });

  it("supports phase-2 contract fields alongside preview metadata", () => {
    const meta = defineComponentMeta<Record<string, unknown>>()({
      name: "Card",
      description: "Card",
      props: {},
      replaces: [{ element: "section", import: "@rdna/radiants/components/core" }],
      pixelCorners: true,
      shadowSystem: "pixel",
      wraps: "@base-ui/react/toggle",
      styleOwnership: [
        {
          attribute: "data-variant",
          themeOwned: ["default", "raised"],
          consumerExtensible: ["custom"],
        },
      ],
      a11y: {
        role: "button",
        requiredAttributes: ["aria-pressed"],
        contrastRequirement: "AA",
      },
    });

    expect(meta.replaces?.[0]?.element).toBe("section");
    expect(meta.styleOwnership?.[0]?.attribute).toBe("data-variant");
    expect(meta.a11y?.requiredAttributes).toContain("aria-pressed");
  });

  it("supports structuralRules once eslint-contract consumes them", () => {
    const meta = defineComponentMeta<Record<string, unknown>>()({
      name: "Card",
      description: "Card",
      props: {},
      structuralRules: [
        {
          ruleId: "rdna/no-pixel-border",
          reason: "pixel corners own the border layer",
        },
      ],
    });

    expect(meta.structuralRules?.[0]?.ruleId).toBe("rdna/no-pixel-border");
  });

  it("supports composition rules for slot contracts", () => {
    const meta = defineComponentMeta<Record<string, unknown>>()({
      name: "AppShell",
      description: "App shell",
      props: {},
      composition: {
        required: ["header", "content"],
        optional: ["footer"],
        order: ["header", "content", "footer"],
      },
    });

    expect(meta.composition?.required).toEqual(["header", "content"]);
    expect(meta.composition?.optional).toEqual(["footer"]);
    expect(meta.composition?.order).toEqual(["header", "content", "footer"]);
  });

  it("supports density tiers for data-density contracts", () => {
    const meta = defineComponentMeta<Record<string, unknown>>()({
      name: "Panel",
      description: "Panel",
      props: {},
      density: {
        attribute: "data-density",
        modes: ["comfortable", "compact"],
        default: "comfortable",
      },
    });

    expect(meta.density?.attribute).toBe("data-density");
    expect(meta.density?.modes).toEqual(["comfortable", "compact"]);
    expect(meta.density?.default).toBe("comfortable");
  });
});
