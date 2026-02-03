/**
 * StyleValue Type System for RadFlow
 *
 * Ported from Webstudio's css-engine with modifications for RadFlow's needs.
 * Original source: https://github.com/webstudio-is/webstudio
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * Copyright (c) Webstudio, Inc.
 * Modifications copyright (c) RadFlow
 */

import { z } from "zod";

// =============================================================================
// Unit Types
// =============================================================================

/**
 * CSS units supported by the style system.
 * "number" represents unitless numeric values (e.g., line-height: 1.5)
 */
export type Unit =
  // Absolute lengths
  | "px"
  | "cm"
  | "mm"
  | "in"
  | "pt"
  | "pc"
  // Relative lengths
  | "em"
  | "rem"
  | "ex"
  | "ch"
  | "lh"
  | "rlh"
  // Viewport-relative lengths
  | "vw"
  | "vh"
  | "vmin"
  | "vmax"
  | "vi"
  | "vb"
  | "svw"
  | "svh"
  | "lvw"
  | "lvh"
  | "dvw"
  | "dvh"
  // Container-relative lengths
  | "cqw"
  | "cqh"
  | "cqi"
  | "cqb"
  | "cqmin"
  | "cqmax"
  // Percentage and unitless
  | "%"
  | "number"
  // Angle units
  | "deg"
  | "rad"
  | "grad"
  | "turn"
  // Time units
  | "s"
  | "ms"
  // Frequency units
  | "Hz"
  | "kHz"
  // Resolution units
  | "dpi"
  | "dpcm"
  | "dppx"
  // Flex units
  | "fr";

const UnitSchema = z.string() as z.ZodType<Unit>;

// =============================================================================
// Value Types
// =============================================================================

/**
 * Numeric value with a CSS unit
 * Examples: 10px, 1.5em, 100%, 2 (unitless)
 */
export const UnitValue = z.object({
  type: z.literal("unit"),
  unit: UnitSchema,
  value: z.number(),
  hidden: z.boolean().optional(),
});
export type UnitValue = z.infer<typeof UnitValue>;

/**
 * CSS keyword value
 * Examples: auto, inherit, initial, none, flex, block
 */
export const KeywordValue = z.object({
  type: z.literal("keyword"),
  value: z.string(),
  hidden: z.boolean().optional(),
});
export type KeywordValue = z.infer<typeof KeywordValue>;

/**
 * Valid but unparsed CSS value - used as a fallback for complex values
 * that can't be fully parsed into structured types
 */
export const UnparsedValue = z.object({
  type: z.literal("unparsed"),
  value: z.string(),
  hidden: z.boolean().optional(),
});
export type UnparsedValue = z.infer<typeof UnparsedValue>;

/**
 * Font family value - array of font names
 * Example: ["Inter", "system-ui", "sans-serif"]
 */
export const FontFamilyValue = z.object({
  type: z.literal("fontFamily"),
  value: z.array(z.string()),
  hidden: z.boolean().optional(),
});
export type FontFamilyValue = z.infer<typeof FontFamilyValue>;

/**
 * Legacy RGB color value (deprecated in favor of ColorValue)
 */
export const RgbValue = z.object({
  type: z.literal("rgb"),
  r: z.number(),
  g: z.number(),
  b: z.number(),
  alpha: z.number(),
  hidden: z.boolean().optional(),
});
export type RgbValue = z.infer<typeof RgbValue>;

/**
 * Color spaces supported by the design tokens specification
 */
export type ColorSpace =
  | "srgb"
  | "p3"
  | "srgb-linear"
  | "hsl"
  | "hwb"
  | "lab"
  | "lch"
  | "oklab"
  | "oklch"
  | "a98rgb"
  | "prophoto"
  | "rec2020"
  | "xyz-d65"
  | "xyz-d50";

/**
 * Color value with explicit color space
 * Components are interpreted based on the color space
 */
export const ColorValue = z.object({
  type: z.literal("color"),
  colorSpace: z.union([
    z.literal("srgb"),
    z.literal("p3"),
    z.literal("srgb-linear"),
    z.literal("hsl"),
    z.literal("hwb"),
    z.literal("lab"),
    z.literal("lch"),
    z.literal("oklab"),
    z.literal("oklch"),
    z.literal("a98rgb"),
    z.literal("prophoto"),
    z.literal("rec2020"),
    z.literal("xyz-d65"),
    z.literal("xyz-d50"),
  ]),
  components: z.tuple([z.number(), z.number(), z.number()]),
  alpha: z.number(),
  hidden: z.boolean().optional(),
});
export type ColorValue = z.infer<typeof ColorValue>;

/**
 * CSS function value (e.g., calc(), clamp(), min(), max())
 * Note: var() has its own dedicated type
 */
export type FunctionValue = {
  type: "function";
  name: string;
  args: StyleValue;
  hidden?: boolean;
};

export const FunctionValue: z.ZodType<FunctionValue> = z.object({
  type: z.literal("function"),
  name: z.string(),
  args: z.lazy(() => StyleValue),
  hidden: z.boolean().optional(),
});

/**
 * Image value - either an asset reference or a URL
 */
export const ImageValue = z.object({
  type: z.literal("image"),
  value: z.union([
    z.object({ type: z.literal("asset"), value: z.string() }),
    z.object({ type: z.literal("url"), url: z.string() }),
  ]),
  hidden: z.boolean().optional(),
});
export type ImageValue = z.infer<typeof ImageValue>;

/**
 * Guaranteed invalid value - initial value for custom properties
 * https://www.w3.org/TR/css-variables-1/#guaranteed-invalid
 */
export const GuaranteedInvalidValue = z.object({
  type: z.literal("guaranteedInvalid"),
  hidden: z.boolean().optional(),
});
export type GuaranteedInvalidValue = z.infer<typeof GuaranteedInvalidValue>;

/**
 * Invalid value - represents a value that failed validation
 * Preserved for display purposes
 */
export const InvalidValue = z.object({
  type: z.literal("invalid"),
  value: z.string(),
  hidden: z.boolean().optional(),
});
export type InvalidValue = z.infer<typeof InvalidValue>;

/**
 * Unset value (deprecated - use GuaranteedInvalidValue instead)
 * @deprecated
 */
export const UnsetValue = z.object({
  type: z.literal("unset"),
  value: z.literal(""),
  hidden: z.boolean().optional(),
});
export type UnsetValue = z.infer<typeof UnsetValue>;

/**
 * Valid fallback types for var() references
 */
export const VarFallback = z.union([
  UnparsedValue,
  KeywordValue,
  UnitValue,
  ColorValue,
  RgbValue,
]);
export type VarFallback = z.infer<typeof VarFallback>;

/**
 * CSS variable reference with optional fallback
 * Example: var(--color-primary, #000)
 */
export const VarValue = z.object({
  type: z.literal("var"),
  value: z.string(), // Variable name without -- prefix
  fallback: VarFallback.optional(),
  hidden: z.boolean().optional(),
});
export type VarValue = z.infer<typeof VarValue>;

/**
 * Items that can appear in a tuple (space-separated values)
 */
export const TupleValueItem = z.union([
  UnitValue,
  KeywordValue,
  UnparsedValue,
  ImageValue,
  ColorValue,
  RgbValue,
  FunctionValue,
  VarValue,
]);
export type TupleValueItem = z.infer<typeof TupleValueItem>;

/**
 * Tuple value - space-separated values
 * Example: "10px 20px" for padding, "1px solid red" for border
 */
export const TupleValue = z.object({
  type: z.literal("tuple"),
  value: z.array(TupleValueItem),
  hidden: z.boolean().optional(),
});
export type TupleValue = z.infer<typeof TupleValue>;

/**
 * Shadow value - structured representation of box-shadow/text-shadow
 */
export const ShadowValue = z.object({
  type: z.literal("shadow"),
  hidden: z.boolean().optional(),
  position: z.union([z.literal("inset"), z.literal("outset")]),
  offsetX: z.union([UnitValue, VarValue]),
  offsetY: z.union([UnitValue, VarValue]),
  blur: z.union([UnitValue, VarValue]).optional(),
  spread: z.union([UnitValue, VarValue]).optional(),
  color: z.union([ColorValue, RgbValue, KeywordValue, VarValue]).optional(),
});
export type ShadowValue = z.infer<typeof ShadowValue>;

/**
 * Items that can appear in a layers value (comma-separated)
 */
export const LayerValueItem = z.union([
  UnitValue,
  KeywordValue,
  UnparsedValue,
  ImageValue,
  TupleValue,
  ShadowValue,
  ColorValue,
  RgbValue,
  InvalidValue,
  FunctionValue,
  VarValue,
]);
export type LayerValueItem = z.infer<typeof LayerValueItem>;

/**
 * Layers value - comma-separated values
 * Used for background layers, multiple shadows, etc.
 */
export const LayersValue = z.object({
  type: z.literal("layers"),
  value: z.array(LayerValueItem),
  hidden: z.boolean().optional(),
});
export type LayersValue = z.infer<typeof LayersValue>;

// =============================================================================
// Main StyleValue Union
// =============================================================================

/**
 * Discriminated union of all possible CSS style values
 */
export const StyleValue = z.union([
  ImageValue,
  LayersValue,
  UnitValue,
  KeywordValue,
  FontFamilyValue,
  ColorValue,
  RgbValue,
  UnparsedValue,
  TupleValue,
  FunctionValue,
  GuaranteedInvalidValue,
  InvalidValue,
  UnsetValue,
  VarValue,
  ShadowValue,
]);
export type StyleValue = z.infer<typeof StyleValue>;

// =============================================================================
// Type Guards
// =============================================================================

export function isUnitValue(value: StyleValue): value is UnitValue {
  return value.type === "unit";
}

export function isKeywordValue(value: StyleValue): value is KeywordValue {
  return value.type === "keyword";
}

export function isColorValue(value: StyleValue): value is ColorValue {
  return value.type === "color";
}

export function isRgbValue(value: StyleValue): value is RgbValue {
  return value.type === "rgb";
}

export function isVarValue(value: StyleValue): value is VarValue {
  return value.type === "var";
}

export function isFunctionValue(value: StyleValue): value is FunctionValue {
  return value.type === "function";
}

export function isLayersValue(value: StyleValue): value is LayersValue {
  return value.type === "layers";
}

export function isTupleValue(value: StyleValue): value is TupleValue {
  return value.type === "tuple";
}

export function isImageValue(value: StyleValue): value is ImageValue {
  return value.type === "image";
}

export function isShadowValue(value: StyleValue): value is ShadowValue {
  return value.type === "shadow";
}

export function isUnparsedValue(value: StyleValue): value is UnparsedValue {
  return value.type === "unparsed";
}

export function isFontFamilyValue(value: StyleValue): value is FontFamilyValue {
  return value.type === "fontFamily";
}

export function isInvalidValue(value: StyleValue): value is InvalidValue {
  return value.type === "invalid";
}

export function isGuaranteedInvalidValue(
  value: StyleValue
): value is GuaranteedInvalidValue {
  return value.type === "guaranteedInvalid";
}

export function isUnsetValue(value: StyleValue): value is UnsetValue {
  return value.type === "unset";
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Convert a StyleValue to a valid VarFallback, serializing complex values to unparsed
 */
export function toVarFallback(styleValue: StyleValue): VarFallback {
  if (
    styleValue.type === "unparsed" ||
    styleValue.type === "keyword" ||
    styleValue.type === "unit" ||
    styleValue.type === "color" ||
    styleValue.type === "rgb"
  ) {
    return styleValue;
  }

  // Import dynamically to avoid circular dependency
  // Complex values get serialized to unparsed
  return {
    type: "unparsed",
    value: "", // Will be filled by styleValueToCss
  };
}

// =============================================================================
// CSS Property Types
// =============================================================================

/**
 * Custom CSS property (CSS variable)
 */
export type CustomProperty = `--${string}`;

/**
 * Standard CSS property name (camelCase)
 */
export type StyleProperty = string | CustomProperty;

/**
 * Map of CSS properties to their values
 */
export type StyleMap = Map<string, StyleValue>;
