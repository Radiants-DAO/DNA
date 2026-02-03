/**
 * Color Space Conversions using Culori
 *
 * Provides bidirectional color space conversions between sRGB and
 * perceptually uniform color spaces (oklch, oklab, lab, lch).
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * Copyright (c) RadFlow
 */

import {
  converter,
  formatHex,
  formatRgb,
  clampChroma,
  displayable,
  parse as culoriParse,
  type Color,
  type Rgb,
  type Oklch,
  type Oklab,
  type Lab,
  type Lch,
  type Hsl,
} from "culori";
import type { ColorValue, ColorSpace } from "../types/styleValue";

// =============================================================================
// Converters
// =============================================================================

const toRgb = converter("rgb");
const toOklch = converter("oklch");
const toOklab = converter("oklab");
const toLab = converter("lab");
const toLch = converter("lch");
const toHsl = converter("hsl");
const toP3 = converter("p3");

// =============================================================================
// ColorValue <-> Culori Color Conversion
// =============================================================================

/**
 * Convert a ColorValue to a Culori Color object
 */
export function colorValueToCulori(value: ColorValue): Color | undefined {
  const { colorSpace, components, alpha } = value;
  const [c1, c2, c3] = components;

  switch (colorSpace) {
    case "srgb":
      return { mode: "rgb", r: c1, g: c2, b: c3, alpha };
    case "oklch":
      return { mode: "oklch", l: c1, c: c2, h: c3, alpha };
    case "oklab":
      return { mode: "oklab", l: c1, a: c2, b: c3, alpha };
    case "lab":
      return { mode: "lab", l: c1, a: c2, b: c3, alpha };
    case "lch":
      return { mode: "lch", l: c1, c: c2, h: c3, alpha };
    case "hsl":
      return { mode: "hsl", h: c1, s: c2 / 100, l: c3 / 100, alpha };
    case "hwb":
      return { mode: "hwb", h: c1, w: c2 / 100, b: c3 / 100, alpha };
    case "p3":
      return { mode: "p3", r: c1, g: c2, b: c3, alpha };
    case "srgb-linear":
      return { mode: "lrgb", r: c1, g: c2, b: c3, alpha };
    case "a98rgb":
      return { mode: "a98", r: c1, g: c2, b: c3, alpha };
    case "prophoto":
      return { mode: "prophoto", r: c1, g: c2, b: c3, alpha };
    case "rec2020":
      return { mode: "rec2020", r: c1, g: c2, b: c3, alpha };
    case "xyz-d65":
      return { mode: "xyz65", x: c1, y: c2, z: c3, alpha };
    case "xyz-d50":
      return { mode: "xyz50", x: c1, y: c2, z: c3, alpha };
    default:
      return undefined;
  }
}

/**
 * Convert a Culori Color to a ColorValue
 */
export function culoriToColorValue(
  color: Color,
  targetSpace: ColorSpace = "srgb"
): ColorValue {
  const alpha = color.alpha ?? 1;

  switch (targetSpace) {
    case "srgb": {
      const rgb = toRgb(color);
      if (!rgb) {
        return { type: "color", colorSpace: "srgb", components: [0, 0, 0], alpha: 1 };
      }
      return {
        type: "color",
        colorSpace: "srgb",
        components: [rgb.r, rgb.g, rgb.b],
        alpha,
      };
    }
    case "oklch": {
      const oklch = toOklch(color);
      if (!oklch) {
        return { type: "color", colorSpace: "oklch", components: [0, 0, 0], alpha: 1 };
      }
      return {
        type: "color",
        colorSpace: "oklch",
        components: [oklch.l, oklch.c, oklch.h ?? 0],
        alpha,
      };
    }
    case "oklab": {
      const oklab = toOklab(color);
      if (!oklab) {
        return { type: "color", colorSpace: "oklab", components: [0, 0, 0], alpha: 1 };
      }
      return {
        type: "color",
        colorSpace: "oklab",
        components: [oklab.l, oklab.a, oklab.b],
        alpha,
      };
    }
    case "lab": {
      const lab = toLab(color);
      if (!lab) {
        return { type: "color", colorSpace: "lab", components: [0, 0, 0], alpha: 1 };
      }
      return {
        type: "color",
        colorSpace: "lab",
        components: [lab.l, lab.a, lab.b],
        alpha,
      };
    }
    case "lch": {
      const lch = toLch(color);
      if (!lch) {
        return { type: "color", colorSpace: "lch", components: [0, 0, 0], alpha: 1 };
      }
      return {
        type: "color",
        colorSpace: "lch",
        components: [lch.l, lch.c, lch.h ?? 0],
        alpha,
      };
    }
    case "hsl": {
      const hsl = toHsl(color);
      if (!hsl) {
        return { type: "color", colorSpace: "hsl", components: [0, 0, 50], alpha: 1 };
      }
      return {
        type: "color",
        colorSpace: "hsl",
        components: [hsl.h ?? 0, (hsl.s ?? 0) * 100, (hsl.l ?? 0.5) * 100],
        alpha,
      };
    }
    case "p3": {
      const p3 = toP3(color);
      if (!p3) {
        return { type: "color", colorSpace: "p3", components: [0, 0, 0], alpha: 1 };
      }
      return {
        type: "color",
        colorSpace: "p3",
        components: [p3.r, p3.g, p3.b],
        alpha,
      };
    }
    default:
      // Fall back to sRGB for unsupported spaces
      return culoriToColorValue(color, "srgb");
  }
}

// =============================================================================
// Conversion Functions
// =============================================================================

/**
 * Convert a hex color to any color space
 */
export function hexToColorValue(hex: string, targetSpace: ColorSpace = "srgb"): ColorValue | null {
  const color = culoriParse(hex);
  if (!color) {
    return null;
  }
  return culoriToColorValue(color, targetSpace);
}

/**
 * Convert a ColorValue to hex string
 */
export function colorValueToHex(value: ColorValue): string {
  const color = colorValueToCulori(value);
  if (!color) {
    return "#000000";
  }
  const rgb = toRgb(color);
  if (!rgb) {
    return "#000000";
  }
  return formatHex(rgb) ?? "#000000";
}

/**
 * Convert a ColorValue to RGB string (for CSS)
 */
export function colorValueToRgbString(value: ColorValue): string {
  const color = colorValueToCulori(value);
  if (!color) {
    return "rgb(0, 0, 0)";
  }
  const rgb = toRgb(color);
  if (!rgb) {
    return "rgb(0, 0, 0)";
  }
  return formatRgb(rgb) ?? "rgb(0, 0, 0)";
}

/**
 * Convert a ColorValue to its CSS string representation
 */
export function colorValueToCss(value: ColorValue): string {
  const { colorSpace, components, alpha } = value;
  const [c1, c2, c3] = components;
  const alphaStr = alpha < 1 ? ` / ${alpha.toFixed(2)}` : "";

  switch (colorSpace) {
    case "srgb": {
      const r = Math.round(c1 * 255);
      const g = Math.round(c2 * 255);
      const b = Math.round(c3 * 255);
      if (alpha < 1) {
        return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
      }
      return `rgb(${r}, ${g}, ${b})`;
    }
    case "oklch":
      return `oklch(${c1.toFixed(3)} ${c2.toFixed(3)} ${c3.toFixed(1)}${alphaStr})`;
    case "oklab":
      return `oklab(${c1.toFixed(3)} ${c2.toFixed(3)} ${c3.toFixed(3)}${alphaStr})`;
    case "lab":
      return `lab(${c1.toFixed(1)} ${c2.toFixed(1)} ${c3.toFixed(1)}${alphaStr})`;
    case "lch":
      return `lch(${c1.toFixed(1)} ${c2.toFixed(1)} ${c3.toFixed(1)}${alphaStr})`;
    case "hsl":
      return `hsl(${c1.toFixed(0)} ${c2.toFixed(0)}% ${c3.toFixed(0)}%${alphaStr})`;
    case "hwb":
      return `hwb(${c1.toFixed(0)} ${c2.toFixed(0)}% ${c3.toFixed(0)}%${alphaStr})`;
    case "p3":
      return `color(display-p3 ${c1.toFixed(3)} ${c2.toFixed(3)} ${c3.toFixed(3)}${alphaStr})`;
    default:
      return colorValueToHex(value);
  }
}

/**
 * Convert a ColorValue from one color space to another
 */
export function convertColorSpace(
  value: ColorValue,
  targetSpace: ColorSpace
): ColorValue {
  if (value.colorSpace === targetSpace) {
    return value;
  }
  const color = colorValueToCulori(value);
  if (!color) {
    return value;
  }
  return culoriToColorValue(color, targetSpace);
}

// =============================================================================
// Gamut Mapping
// =============================================================================

/**
 * Check if a color is displayable in sRGB gamut
 */
export function isInSrgbGamut(value: ColorValue): boolean {
  const color = colorValueToCulori(value);
  if (!color) {
    return false;
  }
  return displayable(color);
}

/**
 * Clamp a color to the sRGB gamut while preserving perceptual attributes
 * Uses OKLCH gamut mapping for best results
 */
export function clampToSrgbGamut(value: ColorValue): ColorValue {
  const color = colorValueToCulori(value);
  if (!color) {
    return value;
  }

  // If already in gamut, return as-is
  if (displayable(color)) {
    return value;
  }

  // Use Culori's clampChroma which reduces chroma in OKLCH space
  // until the color is in gamut - this preserves lightness and hue
  const clamped = clampChroma(color, "oklch");
  if (!clamped) {
    return value;
  }

  return culoriToColorValue(clamped, value.colorSpace);
}

/**
 * Get gamut mapping info for UI display
 */
export function getGamutInfo(value: ColorValue): {
  inGamut: boolean;
  gamutWarning: string | null;
  clampedValue: ColorValue | null;
} {
  const inGamut = isInSrgbGamut(value);

  if (inGamut) {
    return { inGamut: true, gamutWarning: null, clampedValue: null };
  }

  const clamped = clampToSrgbGamut(value);

  return {
    inGamut: false,
    gamutWarning: "Color is outside sRGB gamut. It may appear differently in some browsers.",
    clampedValue: clamped,
  };
}

// =============================================================================
// Specific Color Space Conversions (convenience functions)
// =============================================================================

/**
 * Convert hex to OKLCH ColorValue
 */
export function hexToOklch(hex: string): ColorValue | null {
  return hexToColorValue(hex, "oklch");
}

/**
 * Convert OKLCH ColorValue to hex
 */
export function oklchToHex(l: number, c: number, h: number, alpha = 1): string {
  const value: ColorValue = {
    type: "color",
    colorSpace: "oklch",
    components: [l, c, h],
    alpha,
  };
  return colorValueToHex(value);
}

/**
 * Convert hex to LAB ColorValue
 */
export function hexToLab(hex: string): ColorValue | null {
  return hexToColorValue(hex, "lab");
}

/**
 * Convert hex to LCH ColorValue
 */
export function hexToLch(hex: string): ColorValue | null {
  return hexToColorValue(hex, "lch");
}

/**
 * Convert hex to OKLAB ColorValue
 */
export function hexToOklab(hex: string): ColorValue | null {
  return hexToColorValue(hex, "oklab");
}

// =============================================================================
// Parse CSS Color String
// =============================================================================

/**
 * Parse any CSS color string to a ColorValue using Culori
 * This provides more robust parsing than the custom regex-based parser
 */
export function parseCssColor(css: string): ColorValue | null {
  const color = culoriParse(css);
  if (!color) {
    return null;
  }

  // Determine the color space from the parsed color mode
  const modeToSpace: Record<string, ColorSpace> = {
    rgb: "srgb",
    oklch: "oklch",
    oklab: "oklab",
    lab: "lab",
    lch: "lch",
    hsl: "hsl",
    hwb: "hwb",
    p3: "p3",
    lrgb: "srgb-linear",
    a98: "a98rgb",
    prophoto: "prophoto",
    rec2020: "rec2020",
    xyz65: "xyz-d65",
    xyz50: "xyz-d50",
  };

  const targetSpace = modeToSpace[color.mode] || "srgb";
  return culoriToColorValue(color, targetSpace);
}

// =============================================================================
// Color Delta (Perceptual Difference)
// =============================================================================

/**
 * Calculate perceptual difference between two colors using OKLCH
 * Returns a value where 0 = identical, larger = more different
 */
export function colorDifference(a: ColorValue, b: ColorValue): number {
  const colorA = colorValueToCulori(a);
  const colorB = colorValueToCulori(b);

  if (!colorA || !colorB) {
    return Infinity;
  }

  const oklchA = toOklch(colorA);
  const oklchB = toOklch(colorB);

  if (!oklchA || !oklchB) {
    return Infinity;
  }

  // Simple Euclidean distance in OKLCH space
  // Weight components appropriately (L is 0-1, C is 0-0.4ish, H is 0-360)
  const dL = (oklchA.l - oklchB.l) * 100;
  const dC = (oklchA.c - oklchB.c) * 250;
  const dH = ((oklchA.h ?? 0) - (oklchB.h ?? 0)) / 3.6;

  return Math.sqrt(dL * dL + dC * dC + dH * dH);
}
