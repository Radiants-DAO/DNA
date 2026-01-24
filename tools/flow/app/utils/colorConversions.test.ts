/**
 * Tests for Color Space Conversions using Culori
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * Copyright (c) RadFlow
 */

import { describe, it, expect } from "vitest";
import {
  hexToColorValue,
  colorValueToHex,
  colorValueToCss,
  convertColorSpace,
  isInSrgbGamut,
  clampToSrgbGamut,
  hexToOklch,
  oklchToHex,
  hexToLab,
  hexToLch,
  parseCssColor,
  colorDifference,
} from "./colorConversions";
import type { ColorValue } from "../types/styleValue";

describe("colorConversions", () => {
  describe("hexToColorValue", () => {
    it("converts hex to srgb ColorValue", () => {
      const result = hexToColorValue("#ff0000", "srgb");
      expect(result).not.toBeNull();
      expect(result!.colorSpace).toBe("srgb");
      expect(result!.components[0]).toBeCloseTo(1, 2); // red
      expect(result!.components[1]).toBeCloseTo(0, 2); // green
      expect(result!.components[2]).toBeCloseTo(0, 2); // blue
    });

    it("converts hex to oklch ColorValue", () => {
      const result = hexToColorValue("#ff0000", "oklch");
      expect(result).not.toBeNull();
      expect(result!.colorSpace).toBe("oklch");
      // Red in OKLCH: L ~0.628, C ~0.258, H ~29
      expect(result!.components[0]).toBeCloseTo(0.628, 2); // lightness
      expect(result!.components[1]).toBeGreaterThan(0.2); // chroma
      expect(result!.components[2]).toBeCloseTo(29, 0); // hue
    });

    it("handles 3-digit hex", () => {
      const result = hexToColorValue("#f00", "srgb");
      expect(result).not.toBeNull();
      expect(result!.components[0]).toBeCloseTo(1, 2);
    });
  });

  describe("colorValueToHex", () => {
    it("converts srgb ColorValue to hex", () => {
      const value: ColorValue = {
        type: "color",
        colorSpace: "srgb",
        components: [1, 0, 0],
        alpha: 1,
      };
      const result = colorValueToHex(value);
      expect(result.toLowerCase()).toBe("#ff0000");
    });

    it("converts oklch ColorValue to hex", () => {
      // Known OKLCH red
      const value: ColorValue = {
        type: "color",
        colorSpace: "oklch",
        components: [0.628, 0.258, 29],
        alpha: 1,
      };
      const result = colorValueToHex(value);
      // Should be close to red
      expect(result.startsWith("#")).toBe(true);
    });
  });

  describe("colorValueToCss", () => {
    it("generates oklch CSS string", () => {
      const value: ColorValue = {
        type: "color",
        colorSpace: "oklch",
        components: [0.7, 0.15, 195],
        alpha: 1,
      };
      const result = colorValueToCss(value);
      expect(result).toMatch(/oklch\(0\.700 0\.150 195\.0\)/);
    });

    it("generates oklch CSS string with alpha", () => {
      const value: ColorValue = {
        type: "color",
        colorSpace: "oklch",
        components: [0.7, 0.15, 195],
        alpha: 0.5,
      };
      const result = colorValueToCss(value);
      expect(result).toMatch(/oklch\(0\.700 0\.150 195\.0 \/ 0\.50\)/);
    });

    it("generates lab CSS string", () => {
      const value: ColorValue = {
        type: "color",
        colorSpace: "lab",
        components: [50, 25, -25],
        alpha: 1,
      };
      const result = colorValueToCss(value);
      expect(result).toMatch(/lab\(50\.0 25\.0 -25\.0\)/);
    });

    it("generates rgb CSS string", () => {
      const value: ColorValue = {
        type: "color",
        colorSpace: "srgb",
        components: [1, 0.5, 0],
        alpha: 1,
      };
      const result = colorValueToCss(value);
      expect(result).toBe("rgb(255, 128, 0)");
    });
  });

  describe("convertColorSpace", () => {
    it("converts srgb to oklch", () => {
      const srgb: ColorValue = {
        type: "color",
        colorSpace: "srgb",
        components: [1, 0, 0],
        alpha: 1,
      };
      const oklch = convertColorSpace(srgb, "oklch");
      expect(oklch.colorSpace).toBe("oklch");
      expect(oklch.components[0]).toBeCloseTo(0.628, 2);
    });

    it("converts oklch to srgb", () => {
      const oklch: ColorValue = {
        type: "color",
        colorSpace: "oklch",
        components: [0.628, 0.258, 29],
        alpha: 1,
      };
      const srgb = convertColorSpace(oklch, "srgb");
      expect(srgb.colorSpace).toBe("srgb");
      expect(srgb.components[0]).toBeCloseTo(1, 1); // red
    });

    it("preserves alpha through conversions", () => {
      const srgb: ColorValue = {
        type: "color",
        colorSpace: "srgb",
        components: [1, 0, 0],
        alpha: 0.5,
      };
      const oklch = convertColorSpace(srgb, "oklch");
      expect(oklch.alpha).toBe(0.5);
    });
  });

  describe("gamut mapping", () => {
    it("detects in-gamut colors", () => {
      const inGamut: ColorValue = {
        type: "color",
        colorSpace: "srgb",
        components: [0.5, 0.5, 0.5],
        alpha: 1,
      };
      expect(isInSrgbGamut(inGamut)).toBe(true);
    });

    it("detects out-of-gamut colors", () => {
      // High chroma OKLCH color likely out of sRGB
      const outOfGamut: ColorValue = {
        type: "color",
        colorSpace: "oklch",
        components: [0.7, 0.35, 145], // Very high chroma green
        alpha: 1,
      };
      expect(isInSrgbGamut(outOfGamut)).toBe(false);
    });

    it("clamps out-of-gamut colors", () => {
      const outOfGamut: ColorValue = {
        type: "color",
        colorSpace: "oklch",
        components: [0.7, 0.35, 145],
        alpha: 1,
      };
      const clamped = clampToSrgbGamut(outOfGamut);
      expect(isInSrgbGamut(clamped)).toBe(true);
      // Clamped should preserve lightness and hue, reduce chroma
      expect(clamped.components[0]).toBeCloseTo(0.7, 1); // lightness preserved
      expect(clamped.components[1]).toBeLessThan(0.35); // chroma reduced
    });
  });

  describe("parseCssColor", () => {
    it("parses oklch strings", () => {
      const result = parseCssColor("oklch(0.7 0.15 195)");
      expect(result).not.toBeNull();
      expect(result!.colorSpace).toBe("oklch");
      expect(result!.components[0]).toBeCloseTo(0.7, 2);
      expect(result!.components[1]).toBeCloseTo(0.15, 2);
      expect(result!.components[2]).toBeCloseTo(195, 0);
    });

    it("parses oklch with alpha", () => {
      const result = parseCssColor("oklch(0.7 0.15 195 / 0.5)");
      expect(result).not.toBeNull();
      expect(result!.alpha).toBeCloseTo(0.5, 2);
    });

    it("parses lab strings", () => {
      const result = parseCssColor("lab(50 25 -25)");
      expect(result).not.toBeNull();
      expect(result!.colorSpace).toBe("lab");
    });

    it("parses lch strings", () => {
      const result = parseCssColor("lch(50 30 180)");
      expect(result).not.toBeNull();
      expect(result!.colorSpace).toBe("lch");
    });

    it("parses hex strings", () => {
      const result = parseCssColor("#ff5500");
      expect(result).not.toBeNull();
      expect(result!.colorSpace).toBe("srgb");
    });

    it("parses rgb strings", () => {
      const result = parseCssColor("rgb(255, 128, 0)");
      expect(result).not.toBeNull();
      expect(result!.colorSpace).toBe("srgb");
    });
  });

  describe("colorDifference", () => {
    it("returns 0 for identical colors", () => {
      const color: ColorValue = {
        type: "color",
        colorSpace: "srgb",
        components: [1, 0, 0],
        alpha: 1,
      };
      expect(colorDifference(color, color)).toBe(0);
    });

    it("returns small value for similar colors", () => {
      const color1: ColorValue = {
        type: "color",
        colorSpace: "srgb",
        components: [1, 0, 0],
        alpha: 1,
      };
      const color2: ColorValue = {
        type: "color",
        colorSpace: "srgb",
        components: [0.98, 0.02, 0.02],
        alpha: 1,
      };
      expect(colorDifference(color1, color2)).toBeLessThan(5);
    });

    it("returns large value for different colors", () => {
      const red: ColorValue = {
        type: "color",
        colorSpace: "srgb",
        components: [1, 0, 0],
        alpha: 1,
      };
      const blue: ColorValue = {
        type: "color",
        colorSpace: "srgb",
        components: [0, 0, 1],
        alpha: 1,
      };
      expect(colorDifference(red, blue)).toBeGreaterThan(20);
    });
  });

  describe("convenience functions", () => {
    it("hexToOklch converts correctly", () => {
      const result = hexToOklch("#ff0000");
      expect(result).not.toBeNull();
      expect(result!.colorSpace).toBe("oklch");
    });

    it("oklchToHex converts correctly", () => {
      const hex = oklchToHex(0.7, 0.15, 195);
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("hexToLab converts correctly", () => {
      const result = hexToLab("#808080");
      expect(result).not.toBeNull();
      expect(result!.colorSpace).toBe("lab");
      // Gray should have L ~54, a ~0, b ~0
      expect(result!.components[0]).toBeCloseTo(54, 0);
      expect(result!.components[1]).toBeCloseTo(0, 1);
      expect(result!.components[2]).toBeCloseTo(0, 1);
    });

    it("hexToLch converts correctly", () => {
      const result = hexToLch("#ff0000");
      expect(result).not.toBeNull();
      expect(result!.colorSpace).toBe("lch");
    });
  });

  describe("roundtrip conversions", () => {
    it("hex -> oklch -> hex preserves color", () => {
      const original = "#3498db";
      const oklch = hexToColorValue(original, "oklch");
      expect(oklch).not.toBeNull();
      const backToHex = colorValueToHex(oklch!);
      // Should be very close to original
      const diff = colorDifference(
        hexToColorValue(original, "srgb")!,
        hexToColorValue(backToHex, "srgb")!
      );
      expect(diff).toBeLessThan(1);
    });

    it("oklch(0.7 0.15 195) parses and converts back", () => {
      const css = "oklch(0.7 0.15 195)";
      const parsed = parseCssColor(css);
      expect(parsed).not.toBeNull();
      expect(parsed!.colorSpace).toBe("oklch");

      const cssOutput = colorValueToCss(parsed!);
      expect(cssOutput).toContain("oklch");
      expect(cssOutput).toContain("0.700");
      expect(cssOutput).toContain("0.150");
      expect(cssOutput).toContain("195");
    });
  });
});
