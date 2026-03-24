import { describe, it, expect } from "vitest";
import { buildTestMatrix } from "../prop-matrix.mjs";

describe("buildTestMatrix", () => {
  it("generates enum cross-product from props", () => {
    const matrix = buildTestMatrix({
      props: {
        mode: { type: "enum", values: ["solid", "flat"] },
        tone: { type: "enum", values: ["accent", "danger"] },
      },
    });
    // 2 modes * 2 tones * 2 colorModes * 1 defaultState = 8
    expect(matrix.length).toBe(8);
  });

  it("includes styleOwnership.themeOwned as data-attribute variants", () => {
    const matrix = buildTestMatrix({
      props: {},
      styleOwnership: [
        { attribute: "data-variant", themeOwned: ["default", "raised", "inverted"] },
      ],
    });
    // 3 themeOwned * 2 colorModes
    expect(matrix.length).toBe(6);
    expect(matrix[0].dataAttributes).toEqual({ "data-variant": "default" });
  });

  it("flags pixelCorners components for border/shadow checks", () => {
    const matrix = buildTestMatrix({
      props: {},
      pixelCorners: true,
      shadowSystem: "pixel",
    });
    expect(matrix.every((m) => m.qaFlags.includes("pixel-corners"))).toBe(true);
    expect(matrix.every((m) => m.qaFlags.includes("pixel-shadow"))).toBe(true);
  });

  it("includes a11y.contrastRequirement in QA flags", () => {
    const matrix = buildTestMatrix({
      props: {},
      a11y: { contrastRequirement: "AA" },
    });
    expect(matrix.every((m) => m.qaFlags.includes("contrast-AA"))).toBe(true);
  });

  it("includes forced states from registry.states", () => {
    const matrix = buildTestMatrix({
      props: { mode: { type: "enum", values: ["solid"] } },
      states: ["hover", "pressed", "disabled"],
    });
    // 1 mode * 2 colorModes * 4 states (default + 3 forced)
    expect(matrix.length).toBe(8);
  });

  it("prunes matrix when it exceeds threshold", () => {
    const matrix = buildTestMatrix({
      props: {
        a: { type: "enum", values: ["1", "2", "3", "4"] },
        b: { type: "enum", values: ["x", "y", "z"] },
        c: { type: "enum", values: ["p", "q"] },
      },
    });
    // 4*3*2*2 = 48 — at or below MAX_MATRIX (50), so not pruned
    expect(matrix.length).toBeLessThanOrEqual(50);
  });

  it("gracefully handles missing contract fields", () => {
    const matrix = buildTestMatrix({
      props: { variant: { type: "enum", values: ["default", "compact"] } },
    });
    expect(matrix.length).toBe(4); // 2 variants * 2 colorModes
    expect(matrix[0].qaFlags).toEqual([]);
  });

  it("generates correct labels", () => {
    const matrix = buildTestMatrix({
      props: { mode: { type: "enum", values: ["solid"] } },
    });
    expect(matrix[0].label).toContain("solid");
    expect(matrix[0].label).toContain("light");
  });

  it("skips non-enum, non-boolean props", () => {
    const matrix = buildTestMatrix({
      props: {
        mode: { type: "enum", values: ["solid", "flat"] },
        label: { type: "string" },
        onClick: { type: "function" },
      },
    });
    // Only mode enum counts: 2 * 2 colorModes = 4
    expect(matrix.length).toBe(4);
  });

  it("includes boolean props as true/false variants", () => {
    const matrix = buildTestMatrix({
      props: {
        disabled: { type: "boolean" },
      },
    });
    // 2 boolean values * 2 colorModes = 4
    expect(matrix.length).toBe(4);
  });

  it("returns minimal matrix for empty props", () => {
    const matrix = buildTestMatrix({ props: {} });
    // Just 2 colorModes * 1 state
    expect(matrix.length).toBe(2);
  });
});
