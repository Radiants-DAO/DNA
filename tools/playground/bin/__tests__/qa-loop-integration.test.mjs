import { describe, it, expect } from "vitest";
import { buildTestMatrix } from "../lib/prop-matrix.mjs";
import { readManifest, readFullComponent } from "../lib/manifest.mjs";

describe("visual QA loop integration", () => {
  it("generates a non-empty matrix for Button", () => {
    const button = readFullComponent("Button");
    expect(button).not.toBeNull();

    const matrix = buildTestMatrix(button);

    expect(matrix.length).toBeGreaterThan(0);
    expect(matrix[0]).toHaveProperty("label");
    expect(matrix[0]).toHaveProperty("props");
    expect(matrix[0]).toHaveProperty("colorMode");
    expect(matrix[0]).toHaveProperty("state");
    expect(matrix[0]).toHaveProperty("qaFlags");
  });

  it("generates matrices for all renderable components", () => {
    const manifest = readManifest();
    const components = Object.values(manifest).flatMap((pkg) => pkg.components);

    let skipped = 0;
    for (const component of components) {
      const matrix = buildTestMatrix(component);
      if (matrix.length === 0) {
        skipped++;
        continue;
      }
      expect(matrix[0]).toHaveProperty("label");
      expect(matrix[0]).toHaveProperty("props");
      expect(matrix[0]).toHaveProperty("colorMode");
      expect(matrix[0]).toHaveProperty("qaFlags");
    }

    // At least most components should produce a non-empty matrix
    expect(skipped).toBeLessThan(components.length / 2);
  });

  it("enriches matrix when Phase 2 contract fields are present", () => {
    const matrix = buildTestMatrix({
      props: { mode: { type: "enum", values: ["solid", "flat"] } },
      pixelCorners: true,
      shadowSystem: "pixel",
      styleOwnership: [
        { attribute: "data-variant", themeOwned: ["default", "raised"] },
      ],
      a11y: { contrastRequirement: "AA" },
      states: ["hover", "pressed"],
    });

    expect(
      matrix.some((m) => m.qaFlags.includes("pixel-corners")),
    ).toBe(true);
    expect(
      matrix.some((m) => m.qaFlags.includes("contrast-AA")),
    ).toBe(true);
    expect(
      matrix.some(
        (m) => m.dataAttributes["data-variant"] === "raised",
      ),
    ).toBe(true);
    expect(matrix.some((m) => m.state === "hover")).toBe(true);
    expect(matrix.some((m) => m.state === "pressed")).toBe(true);
  });

  it("forced states appear in unpruned matrices", () => {
    // Use a simpler component so the matrix isn't pruned
    const matrix = buildTestMatrix({
      props: { mode: { type: "enum", values: ["solid"] } },
      states: ["hover", "pressed"],
    });
    // 1 mode * 2 colorModes * 3 states = 6, well under MAX_MATRIX
    expect(matrix.some((m) => m.state === "hover")).toBe(true);
    expect(matrix.some((m) => m.state === "pressed")).toBe(true);
  });

  it("Button states are present in manifest", () => {
    const button = readFullComponent("Button");
    expect(button).not.toBeNull();
    expect(button.states).toContain("hover");
    expect(button.states).toContain("pressed");
  });

  it("matrix labels are unique", () => {
    const button = readFullComponent("Button");
    const matrix = buildTestMatrix(button);
    const labels = matrix.map((m) => m.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
