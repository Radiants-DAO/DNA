/**
 * StyleValue to CSS Serializer
 *
 * Converts StyleValue discriminated union types to valid CSS strings.
 * Ported from Webstudio's css-engine with modifications for RadFlow's needs.
 *
 * Original source: https://github.com/webstudio-is/webstudio
 * packages/css-engine/src/core/to-value.ts
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * Copyright (c) Webstudio, Inc.
 * Modifications copyright (c) RadFlow
 */

import type { StyleValue } from "../types/styleValue";

/**
 * Optional transformer function that can modify values before serialization
 */
export type TransformValue = (
  styleValue: StyleValue
) => undefined | StyleValue;

/**
 * Escape special characters in URLs for CSS url() function
 */
const sanitizeCssUrl = (str: string): string => JSON.stringify(str);

/**
 * Convert a StyleValue to a valid CSS string
 *
 * @param styleValue - The StyleValue to convert
 * @param transformValue - Optional transformer for custom value handling
 * @returns CSS string representation
 *
 * @example
 * styleValueToCss({ type: "unit", value: 10, unit: "px" }) // "10px"
 * styleValueToCss({ type: "keyword", value: "auto" }) // "auto"
 * styleValueToCss({ type: "var", value: "color-primary" }) // "var(--color-primary)"
 */
export function styleValueToCss(
  styleValue: undefined | StyleValue,
  transformValue?: TransformValue
): string {
  if (styleValue === undefined) {
    return "";
  }

  // Allow custom transformation of values
  const transformedValue = transformValue?.(styleValue);
  const value = transformedValue ?? styleValue;

  // Unit value: 10px, 1.5em, 100%, 2 (unitless)
  if (value.type === "unit") {
    return value.value + (value.unit === "number" ? "" : value.unit);
  }

  // Font family: "Inter", system-ui, sans-serif
  if (value.type === "fontFamily") {
    const families: string[] = [];
    for (const family of value.value) {
      // Quote font names that contain spaces
      families.push(family.includes(" ") ? `"${family}"` : family);
    }
    return families.join(", ");
  }

  // CSS variable reference: var(--color-primary, #000)
  if (value.type === "var") {
    if (value.hidden) {
      return "";
    }
    let fallbacksString = "";
    if (value.fallback) {
      fallbacksString = `, ${styleValueToCss(value.fallback, transformValue)}`;
    }
    return `var(--${value.value}${fallbacksString})`;
  }

  // Keyword: auto, inherit, initial, none
  if (value.type === "keyword") {
    if (value.hidden === true) {
      return "";
    }
    return value.value;
  }

  // Invalid value - return as-is for display
  if (value.type === "invalid") {
    return value.value;
  }

  // Unset value (deprecated)
  if (value.type === "unset") {
    return value.value;
  }

  // Legacy RGB color: rgb(255 128 0 / 1)
  if (value.type === "rgb") {
    return `rgb(${value.r} ${value.g} ${value.b} / ${value.alpha})`;
  }

  // Color with color space
  if (value.type === "color") {
    let [c1, c2, c3] = value.components;
    const alpha = value.alpha;

    // Use specific CSS functions when available
    switch (value.colorSpace) {
      case "srgb": {
        // Convert 0-1 range to 0-255 for RGB
        c1 = Math.round(c1 * 255);
        c2 = Math.round(c2 * 255);
        c3 = Math.round(c3 * 255);
        return `rgb(${c1} ${c2} ${c3} / ${alpha})`;
      }
      case "hsl":
        return `hsl(${c1} ${c2}% ${c3}% / ${alpha})`;
      case "hwb":
        return `hwb(${c1} ${c2}% ${c3}% / ${alpha})`;
      case "lab":
        return `lab(${c1}% ${c2} ${c3} / ${alpha})`;
      case "lch":
        return `lch(${c1}% ${c2} ${c3} / ${alpha})`;
      case "oklab":
        return `oklab(${c1} ${c2} ${c3} / ${alpha})`;
      case "oklch":
        return `oklch(${c1} ${c2} ${c3} / ${alpha})`;
      // Fall back to color() function for less common color spaces
      case "p3":
      case "srgb-linear":
      case "a98rgb":
      case "prophoto":
      case "rec2020":
      case "xyz-d65":
      case "xyz-d50":
      default:
        return `color(${value.colorSpace} ${c1} ${c2} ${c3} / ${alpha})`;
    }
  }

  // Image: url("image.png") or none
  if (value.type === "image") {
    if (value.hidden || value.value.type !== "url") {
      return "none";
    }
    return `url(${sanitizeCssUrl(value.value.url)})`;
  }

  // Unparsed CSS value
  if (value.type === "unparsed") {
    if (value.hidden === true) {
      return "none";
    }
    return value.value;
  }

  // Layers: comma-separated values (backgrounds, shadows)
  if (value.type === "layers") {
    const valueString = value.value
      .filter((layer) => layer.hidden !== true)
      .map((layer) => styleValueToCss(layer, transformValue))
      .join(", ");
    return valueString === "" ? "none" : valueString;
  }

  // Tuple: space-separated values (padding, margin, border)
  if (value.type === "tuple") {
    if (value.hidden === true) {
      return "none";
    }
    return value.value
      .filter((v) => v.hidden !== true)
      .map((v) => styleValueToCss(v, transformValue))
      .join(" ");
  }

  // Shadow: structured shadow value
  if (value.type === "shadow") {
    let shadow = `${styleValueToCss(value.offsetX)} ${styleValueToCss(value.offsetY)}`;
    if (value.blur) {
      shadow += ` ${styleValueToCss(value.blur)}`;
    }
    if (value.spread) {
      shadow += ` ${styleValueToCss(value.spread)}`;
    }
    if (value.color) {
      shadow += ` ${styleValueToCss(value.color)}`;
    }
    if (value.position === "inset") {
      shadow += ` inset`;
    }
    return shadow;
  }

  // Function: calc(), clamp(), min(), max()
  if (value.type === "function") {
    if (value.hidden === true) {
      return "";
    }
    return `${value.name}(${styleValueToCss(value.args, transformValue)})`;
  }

  // Guaranteed invalid - return empty string
  if (value.type === "guaranteedInvalid") {
    return "";
  }

  // Exhaustive check - should never reach here
  const _exhaustive: never = value;
  return "";
}

/**
 * Check if a CSS string could be a color value
 */
export function looksLikeColor(css: string): boolean {
  const trimmed = css.trim().toLowerCase();
  return (
    trimmed.startsWith("#") ||
    trimmed.startsWith("rgb") ||
    trimmed.startsWith("hsl") ||
    trimmed.startsWith("hwb") ||
    trimmed.startsWith("lab") ||
    trimmed.startsWith("lch") ||
    trimmed.startsWith("oklab") ||
    trimmed.startsWith("oklch") ||
    trimmed.startsWith("color(")
  );
}
