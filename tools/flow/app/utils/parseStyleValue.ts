/**
 * CSS String to StyleValue Parser
 *
 * Parses CSS value strings into the StyleValue discriminated union types.
 * This is the TypeScript-side parser approach (Option B from ADR-6).
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * Copyright (c) RadFlow
 */

import type {
  StyleValue,
  UnitValue,
  KeywordValue,
  ColorValue,
  RgbValue,
  VarValue,
  FunctionValue,
  TupleValue,
  LayersValue,
  UnparsedValue,
  Unit,
  ColorSpace,
  VarFallback,
} from "../types/styleValue";

// =============================================================================
// Unit Parsing
// =============================================================================

/**
 * All valid CSS units for parsing
 */
const CSS_UNITS: readonly string[] = [
  // Absolute lengths
  "px",
  "cm",
  "mm",
  "in",
  "pt",
  "pc",
  // Relative lengths
  "em",
  "rem",
  "ex",
  "ch",
  "lh",
  "rlh",
  // Viewport-relative
  "vw",
  "vh",
  "vmin",
  "vmax",
  "vi",
  "vb",
  "svw",
  "svh",
  "lvw",
  "lvh",
  "dvw",
  "dvh",
  // Container-relative
  "cqw",
  "cqh",
  "cqi",
  "cqb",
  "cqmin",
  "cqmax",
  // Percentage
  "%",
  // Angle
  "deg",
  "rad",
  "grad",
  "turn",
  // Time
  "s",
  "ms",
  // Frequency
  "Hz",
  "kHz",
  // Resolution
  "dpi",
  "dpcm",
  "dppx",
  // Flex
  "fr",
] as const;

// Create a regex pattern for matching units
const UNIT_PATTERN = new RegExp(
  `^(-?(?:\\d+\\.?\\d*|\\.\\d+))(${CSS_UNITS.join("|")})?$`
);

/**
 * Parse a CSS unit value string
 * @example parseUnitValue("10px") => { type: "unit", value: 10, unit: "px" }
 * @example parseUnitValue("1.5") => { type: "unit", value: 1.5, unit: "number" }
 */
export function parseUnitValue(css: string): UnitValue | null {
  const trimmed = css.trim();
  const match = trimmed.match(UNIT_PATTERN);

  if (!match) {
    return null;
  }

  const [, numStr, unit] = match;
  const value = parseFloat(numStr);

  if (isNaN(value)) {
    return null;
  }

  return {
    type: "unit",
    value,
    unit: (unit as Unit) || "number",
  };
}

// =============================================================================
// Color Parsing
// =============================================================================

/**
 * Parse a hex color string
 * @example parseHexColor("#ff0000") => { type: "color", colorSpace: "srgb", ... }
 */
export function parseHexColor(css: string): ColorValue | null {
  const trimmed = css.trim().toLowerCase();
  const match = trimmed.match(/^#([0-9a-f]{3,8})$/);

  if (!match) {
    return null;
  }

  const hex = match[1];
  let r: number, g: number, b: number, a = 1;

  if (hex.length === 3) {
    // #rgb
    r = parseInt(hex[0] + hex[0], 16) / 255;
    g = parseInt(hex[1] + hex[1], 16) / 255;
    b = parseInt(hex[2] + hex[2], 16) / 255;
  } else if (hex.length === 4) {
    // #rgba
    r = parseInt(hex[0] + hex[0], 16) / 255;
    g = parseInt(hex[1] + hex[1], 16) / 255;
    b = parseInt(hex[2] + hex[2], 16) / 255;
    a = parseInt(hex[3] + hex[3], 16) / 255;
  } else if (hex.length === 6) {
    // #rrggbb
    r = parseInt(hex.slice(0, 2), 16) / 255;
    g = parseInt(hex.slice(2, 4), 16) / 255;
    b = parseInt(hex.slice(4, 6), 16) / 255;
  } else if (hex.length === 8) {
    // #rrggbbaa
    r = parseInt(hex.slice(0, 2), 16) / 255;
    g = parseInt(hex.slice(2, 4), 16) / 255;
    b = parseInt(hex.slice(4, 6), 16) / 255;
    a = parseInt(hex.slice(6, 8), 16) / 255;
  } else {
    return null;
  }

  return {
    type: "color",
    colorSpace: "srgb",
    components: [r, g, b],
    alpha: a,
  };
}

/**
 * Parse alpha value from CSS (percentage or decimal)
 */
function parseAlpha(alphaStr: string | undefined): number {
  if (!alphaStr) {
    return 1;
  }
  const trimmed = alphaStr.trim();
  if (trimmed.endsWith("%")) {
    return parseFloat(trimmed) / 100;
  }
  return parseFloat(trimmed);
}

/**
 * Parse an rgb/rgba color string
 * @example parseRgbColor("rgb(255 128 0)") => { type: "color", colorSpace: "srgb", ... }
 */
export function parseRgbColor(css: string): ColorValue | null {
  const trimmed = css.trim().toLowerCase();

  // Modern syntax: rgb(255 128 0 / 0.5) or rgb(255, 128, 0, 0.5)
  const modernMatch = trimmed.match(
    /^rgba?\(\s*(\d+(?:\.\d+)?%?)\s*[,\s]\s*(\d+(?:\.\d+)?%?)\s*[,\s]\s*(\d+(?:\.\d+)?%?)(?:\s*[,\/]\s*(\d+(?:\.\d+)?%?))?\s*\)$/
  );

  if (!modernMatch) {
    return null;
  }

  const [, r, g, b, a] = modernMatch;

  // Parse components (handle both 0-255 and percentage)
  const parseComponent = (val: string): number => {
    if (val.endsWith("%")) {
      return parseFloat(val) / 100;
    }
    return parseFloat(val) / 255;
  };

  return {
    type: "color",
    colorSpace: "srgb",
    components: [parseComponent(r), parseComponent(g), parseComponent(b)],
    alpha: parseAlpha(a),
  };
}

/**
 * Parse an hsl/hsla color string
 * @example parseHslColor("hsl(180 50% 50%)") => { type: "color", colorSpace: "hsl", ... }
 */
export function parseHslColor(css: string): ColorValue | null {
  const trimmed = css.trim().toLowerCase();

  const match = trimmed.match(
    /^hsla?\(\s*(-?\d+(?:\.\d+)?(?:deg|rad|grad|turn)?)\s*[,\s]\s*(\d+(?:\.\d+)?)%\s*[,\s]\s*(\d+(?:\.\d+)?)%(?:\s*[,\/]\s*(\d+(?:\.\d+)?%?))?\s*\)$/
  );

  if (!match) {
    return null;
  }

  const [, h, s, l, a] = match;

  // Parse hue (convert to degrees if needed)
  let hue = parseFloat(h);
  if (h.includes("rad")) {
    hue = (hue * 180) / Math.PI;
  } else if (h.includes("grad")) {
    hue = (hue * 360) / 400;
  } else if (h.includes("turn")) {
    hue = hue * 360;
  }

  return {
    type: "color",
    colorSpace: "hsl",
    components: [hue, parseFloat(s), parseFloat(l)],
    alpha: parseAlpha(a),
  };
}

/**
 * Parse oklch color string
 * @example parseOklchColor("oklch(0.7 0.15 180)") => { type: "color", colorSpace: "oklch", ... }
 */
export function parseOklchColor(css: string): ColorValue | null {
  const trimmed = css.trim().toLowerCase();

  const match = trimmed.match(
    /^oklch\(\s*(\d+(?:\.\d+)?%?)\s+(\d+(?:\.\d+)?%?)\s+(-?\d+(?:\.\d+)?(?:deg|rad|grad|turn)?)(?:\s*\/\s*(\d+(?:\.\d+)?%?))?\s*\)$/
  );

  if (!match) {
    return null;
  }

  const [, l, c, h, a] = match;

  // Parse lightness
  let lightness = parseFloat(l);
  if (l.endsWith("%")) {
    lightness = lightness / 100;
  }

  // Parse chroma
  let chroma = parseFloat(c);
  if (c.endsWith("%")) {
    chroma = chroma / 100 * 0.4; // Max chroma is approximately 0.4
  }

  // Parse hue (convert to degrees if needed)
  let hue = parseFloat(h);
  if (h.includes("rad")) {
    hue = (hue * 180) / Math.PI;
  } else if (h.includes("grad")) {
    hue = (hue * 360) / 400;
  } else if (h.includes("turn")) {
    hue = hue * 360;
  }

  return {
    type: "color",
    colorSpace: "oklch",
    components: [lightness, chroma, hue],
    alpha: parseAlpha(a),
  };
}

/**
 * Parse oklab color string
 */
export function parseOklabColor(css: string): ColorValue | null {
  const trimmed = css.trim().toLowerCase();

  const match = trimmed.match(
    /^oklab\(\s*(\d+(?:\.\d+)?%?)\s+(-?\d+(?:\.\d+)?%?)\s+(-?\d+(?:\.\d+)?%?)(?:\s*\/\s*(\d+(?:\.\d+)?%?))?\s*\)$/
  );

  if (!match) {
    return null;
  }

  const [, l, aComp, bComp, alpha] = match;

  // Parse lightness (0-1 or percentage)
  let lightness = parseFloat(l);
  if (l.endsWith("%")) {
    lightness = lightness / 100;
  }

  // Parse a and b components (-0.4 to 0.4 range typically)
  let aVal = parseFloat(aComp);
  if (aComp.endsWith("%")) {
    aVal = aVal / 100 * 0.4;
  }

  let bVal = parseFloat(bComp);
  if (bComp.endsWith("%")) {
    bVal = bVal / 100 * 0.4;
  }

  return {
    type: "color",
    colorSpace: "oklab",
    components: [lightness, aVal, bVal],
    alpha: parseAlpha(alpha),
  };
}

/**
 * Parse lab color string
 */
export function parseLabColor(css: string): ColorValue | null {
  const trimmed = css.trim().toLowerCase();

  const match = trimmed.match(
    /^lab\(\s*(\d+(?:\.\d+)?%?)\s+(-?\d+(?:\.\d+)?%?)\s+(-?\d+(?:\.\d+)?%?)(?:\s*\/\s*(\d+(?:\.\d+)?%?))?\s*\)$/
  );

  if (!match) {
    return null;
  }

  const [, l, a, b, alpha] = match;

  return {
    type: "color",
    colorSpace: "lab",
    components: [parseFloat(l), parseFloat(a), parseFloat(b)],
    alpha: parseAlpha(alpha),
  };
}

/**
 * Parse lch color string
 */
export function parseLchColor(css: string): ColorValue | null {
  const trimmed = css.trim().toLowerCase();

  const match = trimmed.match(
    /^lch\(\s*(\d+(?:\.\d+)?%?)\s+(\d+(?:\.\d+)?%?)\s+(-?\d+(?:\.\d+)?(?:deg|rad|grad|turn)?)(?:\s*\/\s*(\d+(?:\.\d+)?%?))?\s*\)$/
  );

  if (!match) {
    return null;
  }

  const [, l, c, h, alpha] = match;

  // Parse hue
  let hue = parseFloat(h);
  if (h.includes("rad")) {
    hue = (hue * 180) / Math.PI;
  } else if (h.includes("grad")) {
    hue = (hue * 360) / 400;
  } else if (h.includes("turn")) {
    hue = hue * 360;
  }

  return {
    type: "color",
    colorSpace: "lch",
    components: [parseFloat(l), parseFloat(c), hue],
    alpha: parseAlpha(alpha),
  };
}

/**
 * Parse hwb color string
 */
export function parseHwbColor(css: string): ColorValue | null {
  const trimmed = css.trim().toLowerCase();

  const match = trimmed.match(
    /^hwb\(\s*(-?\d+(?:\.\d+)?(?:deg|rad|grad|turn)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%(?:\s*\/\s*(\d+(?:\.\d+)?%?))?\s*\)$/
  );

  if (!match) {
    return null;
  }

  const [, h, w, b, alpha] = match;

  // Parse hue
  let hue = parseFloat(h);
  if (h.includes("rad")) {
    hue = (hue * 180) / Math.PI;
  } else if (h.includes("grad")) {
    hue = (hue * 360) / 400;
  } else if (h.includes("turn")) {
    hue = hue * 360;
  }

  return {
    type: "color",
    colorSpace: "hwb",
    components: [hue, parseFloat(w), parseFloat(b)],
    alpha: parseAlpha(alpha),
  };
}

/**
 * Parse color() function with arbitrary color space
 */
export function parseColorFunction(css: string): ColorValue | null {
  const trimmed = css.trim().toLowerCase();

  const match = trimmed.match(
    /^color\(\s*([\w-]+)\s+(-?\d+(?:\.\d+)?%?)\s+(-?\d+(?:\.\d+)?%?)\s+(-?\d+(?:\.\d+)?%?)(?:\s*\/\s*(\d+(?:\.\d+)?%?))?\s*\)$/
  );

  if (!match) {
    return null;
  }

  const [, colorSpace, c1, c2, c3, alpha] = match;

  // Validate color space
  const validSpaces: ColorSpace[] = [
    "srgb",
    "p3",
    "srgb-linear",
    "a98rgb",
    "prophoto",
    "rec2020",
    "xyz-d65",
    "xyz-d50",
  ];

  if (!validSpaces.includes(colorSpace as ColorSpace)) {
    return null;
  }

  // Parse components (handle percentage)
  const parseComp = (val: string): number => {
    if (val.endsWith("%")) {
      return parseFloat(val) / 100;
    }
    return parseFloat(val);
  };

  return {
    type: "color",
    colorSpace: colorSpace as ColorSpace,
    components: [parseComp(c1), parseComp(c2), parseComp(c3)],
    alpha: parseAlpha(alpha),
  };
}

/**
 * Parse any CSS color string
 */
export function parseColor(css: string): ColorValue | null {
  const trimmed = css.trim().toLowerCase();

  // Hex colors
  if (trimmed.startsWith("#")) {
    return parseHexColor(trimmed);
  }

  // RGB/RGBA
  if (trimmed.startsWith("rgb")) {
    return parseRgbColor(trimmed);
  }

  // HSL/HSLA
  if (trimmed.startsWith("hsl")) {
    return parseHslColor(trimmed);
  }

  // HWB
  if (trimmed.startsWith("hwb")) {
    return parseHwbColor(trimmed);
  }

  // OKLCH
  if (trimmed.startsWith("oklch")) {
    return parseOklchColor(trimmed);
  }

  // OKLAB
  if (trimmed.startsWith("oklab")) {
    return parseOklabColor(trimmed);
  }

  // LAB
  if (trimmed.startsWith("lab")) {
    return parseLabColor(trimmed);
  }

  // LCH
  if (trimmed.startsWith("lch")) {
    return parseLchColor(trimmed);
  }

  // color() function
  if (trimmed.startsWith("color(")) {
    return parseColorFunction(trimmed);
  }

  return null;
}

// =============================================================================
// CSS Variable Parsing
// =============================================================================

/**
 * Parse a CSS var() reference
 * @example parseVarValue("var(--color-primary)") => { type: "var", value: "color-primary" }
 * @example parseVarValue("var(--x, 10px)") => { type: "var", value: "x", fallback: { type: "unit", ... } }
 */
export function parseVarValue(css: string): VarValue | null {
  const trimmed = css.trim();

  // Match var(--name) or var(--name, fallback)
  const match = trimmed.match(/^var\(\s*--([a-zA-Z0-9_-]+)\s*(?:,\s*(.+))?\s*\)$/);

  if (!match) {
    return null;
  }

  const [, name, fallbackStr] = match;

  const result: VarValue = {
    type: "var",
    value: name,
  };

  if (fallbackStr) {
    // Parse the fallback value
    const fallback = parseStyleValue(fallbackStr.trim());
    if (
      fallback &&
      (fallback.type === "unparsed" ||
        fallback.type === "keyword" ||
        fallback.type === "unit" ||
        fallback.type === "color" ||
        fallback.type === "rgb")
    ) {
      result.fallback = fallback as VarFallback;
    } else if (fallback) {
      // Complex fallback - store as unparsed
      result.fallback = { type: "unparsed", value: fallbackStr.trim() };
    }
  }

  return result;
}

// =============================================================================
// CSS Function Parsing
// =============================================================================

/**
 * Common CSS functions that take StyleValue arguments
 */
const CSS_FUNCTIONS = [
  "calc",
  "clamp",
  "min",
  "max",
  "round",
  "mod",
  "rem",
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "atan2",
  "pow",
  "sqrt",
  "hypot",
  "log",
  "exp",
  "abs",
  "sign",
  // Transform functions
  "translateX",
  "translateY",
  "translateZ",
  "translate",
  "translate3d",
  "scaleX",
  "scaleY",
  "scaleZ",
  "scale",
  "scale3d",
  "rotateX",
  "rotateY",
  "rotateZ",
  "rotate",
  "rotate3d",
  "skewX",
  "skewY",
  "skew",
  "matrix",
  "matrix3d",
  "perspective",
  // Filter functions
  "blur",
  "brightness",
  "contrast",
  "grayscale",
  "hue-rotate",
  "invert",
  "opacity",
  "saturate",
  "sepia",
  "drop-shadow",
];

/**
 * Parse a CSS function call
 * @example parseFunctionValue("calc(100% - 20px)") => { type: "function", name: "calc", args: ... }
 */
export function parseFunctionValue(css: string): FunctionValue | null {
  const trimmed = css.trim();

  // Match function(args)
  const match = trimmed.match(/^([a-zA-Z-]+)\((.+)\)$/s);

  if (!match) {
    return null;
  }

  const [, name, argsStr] = match;

  // Don't parse var() as a generic function - it has its own type
  if (name === "var") {
    return null;
  }

  // Parse the arguments as a StyleValue
  const args = parseStyleValue(argsStr.trim());

  if (!args) {
    // If we can't parse the args, store them as unparsed
    return {
      type: "function",
      name,
      args: { type: "unparsed", value: argsStr.trim() },
    };
  }

  return {
    type: "function",
    name,
    args,
  };
}

// =============================================================================
// Complex Value Parsing
// =============================================================================

/**
 * Split a CSS value string by commas, respecting nested parentheses
 */
function splitByComma(css: string): string[] {
  const result: string[] = [];
  let current = "";
  let depth = 0;

  for (const char of css) {
    if (char === "(") {
      depth++;
      current += char;
    } else if (char === ")") {
      depth--;
      current += char;
    } else if (char === "," && depth === 0) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

/**
 * Split a CSS value string by spaces, respecting nested parentheses
 */
function splitBySpace(css: string): string[] {
  const result: string[] = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < css.length; i++) {
    const char = css[i];

    // Handle string literals
    if ((char === '"' || char === "'") && (i === 0 || css[i - 1] !== "\\")) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      current += char;
    } else if (inString) {
      current += char;
    } else if (char === "(") {
      depth++;
      current += char;
    } else if (char === ")") {
      depth--;
      current += char;
    } else if (/\s/.test(char) && depth === 0) {
      if (current.trim()) {
        result.push(current.trim());
      }
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

/**
 * Parse a comma-separated layers value (e.g., multiple backgrounds or shadows)
 */
export function parseLayersValue(css: string): LayersValue | null {
  const parts = splitByComma(css);

  if (parts.length < 2) {
    return null;
  }

  const layers = parts.map((part) => parseStyleValue(part.trim()));

  // Filter out null values but ensure we have valid layers
  const validLayers = layers.filter((l): l is NonNullable<typeof l> => l !== null);

  if (validLayers.length === 0) {
    return null;
  }

  return {
    type: "layers",
    value: validLayers as LayersValue["value"],
  };
}

/**
 * Parse a space-separated tuple value (e.g., padding shorthand)
 */
export function parseTupleValue(css: string): TupleValue | null {
  const parts = splitBySpace(css);

  if (parts.length < 2) {
    return null;
  }

  const items = parts.map((part) => parseStyleValue(part.trim()));

  // Filter out null values
  const validItems = items.filter((i): i is NonNullable<typeof i> => i !== null);

  if (validItems.length === 0) {
    return null;
  }

  return {
    type: "tuple",
    value: validItems as TupleValue["value"],
  };
}

// =============================================================================
// Main Parser
// =============================================================================

/**
 * CSS keywords that should be recognized
 */
const CSS_KEYWORDS = new Set([
  // Global values
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer",
  // Common values
  "auto",
  "none",
  "normal",
  // Display
  "block",
  "inline",
  "inline-block",
  "flex",
  "inline-flex",
  "grid",
  "inline-grid",
  "contents",
  "flow-root",
  // Position
  "static",
  "relative",
  "absolute",
  "fixed",
  "sticky",
  // Flex
  "row",
  "row-reverse",
  "column",
  "column-reverse",
  "nowrap",
  "wrap",
  "wrap-reverse",
  "stretch",
  "flex-start",
  "flex-end",
  "center",
  "space-between",
  "space-around",
  "space-evenly",
  "baseline",
  // Grid
  "start",
  "end",
  // Overflow
  "visible",
  "hidden",
  "scroll",
  "clip",
  // Text
  "left",
  "right",
  "justify",
  "capitalize",
  "uppercase",
  "lowercase",
  "underline",
  "overline",
  "line-through",
  "solid",
  "double",
  "dotted",
  "dashed",
  "wavy",
  // Font
  "normal",
  "italic",
  "oblique",
  "bold",
  "bolder",
  "lighter",
  // Visibility
  "collapse",
  // Box-sizing
  "content-box",
  "border-box",
  // Cursor
  "pointer",
  "default",
  "text",
  "move",
  "not-allowed",
  "grab",
  "grabbing",
  "crosshair",
  "help",
  "wait",
  "progress",
  // Background
  "repeat",
  "repeat-x",
  "repeat-y",
  "no-repeat",
  "cover",
  "contain",
  "local",
  "scroll",
  "fixed",
  // Border
  "thin",
  "medium",
  "thick",
  // Color keywords
  "transparent",
  "currentColor",
  "currentcolor",
]);

/**
 * Parse any CSS value string into a StyleValue
 *
 * @param css - The CSS value string to parse
 * @returns Parsed StyleValue or null if parsing failed
 *
 * @example
 * parseStyleValue("10px") // { type: "unit", value: 10, unit: "px" }
 * parseStyleValue("auto") // { type: "keyword", value: "auto" }
 * parseStyleValue("#ff0000") // { type: "color", colorSpace: "srgb", ... }
 * parseStyleValue("var(--x)") // { type: "var", value: "x" }
 */
export function parseStyleValue(css: string): StyleValue | null {
  if (!css || typeof css !== "string") {
    return null;
  }

  const trimmed = css.trim();

  if (trimmed === "") {
    return null;
  }

  // Try parsing as var() first (most common in design systems)
  if (trimmed.startsWith("var(")) {
    const varValue = parseVarValue(trimmed);
    if (varValue) {
      return varValue;
    }
  }

  // Try parsing as a color
  const colorValue = parseColor(trimmed);
  if (colorValue) {
    return colorValue;
  }

  // Try parsing as a unit value
  const unitValue = parseUnitValue(trimmed);
  if (unitValue) {
    return unitValue;
  }

  // Check if it's a known CSS keyword
  if (CSS_KEYWORDS.has(trimmed.toLowerCase())) {
    return {
      type: "keyword",
      value: trimmed.toLowerCase(),
    };
  }

  // Try parsing as a function (calc, clamp, etc.)
  if (trimmed.includes("(") && trimmed.endsWith(")")) {
    const funcValue = parseFunctionValue(trimmed);
    if (funcValue) {
      return funcValue;
    }
  }

  // Try parsing as comma-separated layers
  if (trimmed.includes(",")) {
    const layersValue = parseLayersValue(trimmed);
    if (layersValue) {
      return layersValue;
    }
  }

  // Try parsing as space-separated tuple
  if (trimmed.includes(" ")) {
    const tupleValue = parseTupleValue(trimmed);
    if (tupleValue) {
      return tupleValue;
    }
  }

  // Fall back to unparsed value
  return {
    type: "unparsed",
    value: trimmed,
  };
}
