import { describe, it, expect } from "vitest";
import { colorValueToCss, hexToColorValue, colorValueToHex, convertColorSpace, isInSrgbGamut } from "../utils/colorConversions";

describe("colorConversions", () => {
  it("formats rgb colors", () => {
    expect(
      colorValueToCss({ type: "color", colorSpace: "srgb", components: [1, 0, 0], alpha: 1 })
    ).toContain("rgb");
  });

  it("converts hex to ColorValue", () => {
    const result = hexToColorValue("#ff0000", "srgb");
    expect(result).not.toBeNull();
    expect(result?.colorSpace).toBe("srgb");
    expect(result?.components[0]).toBeCloseTo(1, 1);
  });

  it("converts ColorValue to hex", () => {
    const hex = colorValueToHex({ type: "color", colorSpace: "srgb", components: [1, 0, 0], alpha: 1 });
    expect(hex.toLowerCase()).toBe("#ff0000");
  });

  it("converts between color spaces", () => {
    const srgb = { type: "color" as const, colorSpace: "srgb" as const, components: [1, 0, 0] as [number, number, number], alpha: 1 };
    const oklch = convertColorSpace(srgb, "oklch");
    expect(oklch.colorSpace).toBe("oklch");
    expect(oklch.components[0]).toBeGreaterThan(0); // L should be positive
  });

  it("checks sRGB gamut", () => {
    const inGamut = { type: "color" as const, colorSpace: "srgb" as const, components: [0.5, 0.5, 0.5] as [number, number, number], alpha: 1 };
    expect(isInSrgbGamut(inGamut)).toBe(true);
  });
});
