/**
 * Layers Value Utilities
 *
 * Utility functions for manipulating LayersValue (comma-separated CSS values).
 * Used for box-shadow, background, and other layered CSS properties.
 *
 * Ported from Flow 0 for the browser extension.
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * Copyright (c) Flow
 */

import type {
  LayersValue,
  LayerValueItem,
  ShadowValue,
  UnitValue,
  ColorValue,
  VarValue,
  FunctionValue,
} from "../types/styleValue";
import { styleValueToCss } from "./styleValueToCss";

// =============================================================================
// Layer Manipulation Functions
// =============================================================================

/**
 * Add a layer to the end of a LayersValue
 */
export function addLayer(layers: LayersValue, layer: LayerValueItem): LayersValue {
  return {
    type: "layers",
    value: [...layers.value, layer],
  };
}

/**
 * Insert a layer at a specific index
 */
export function insertLayer(
  layers: LayersValue,
  layer: LayerValueItem,
  index: number
): LayersValue {
  const newValue = [...layers.value];
  newValue.splice(index, 0, layer);
  return {
    type: "layers",
    value: newValue,
  };
}

/**
 * Remove a layer by index
 */
export function removeLayer(layers: LayersValue, index: number): LayersValue {
  if (index < 0 || index >= layers.value.length) {
    return layers;
  }
  return {
    type: "layers",
    value: layers.value.filter((_, i) => i !== index),
  };
}

/**
 * Update a layer at a specific index
 */
export function updateLayer(
  layers: LayersValue,
  index: number,
  layer: LayerValueItem
): LayersValue {
  if (index < 0 || index >= layers.value.length) {
    return layers;
  }
  const newValue = [...layers.value];
  newValue[index] = layer;
  return {
    type: "layers",
    value: newValue,
  };
}

/**
 * Reorder layers by moving a layer from one index to another
 */
export function reorderLayers(
  layers: LayersValue,
  fromIndex: number,
  toIndex: number
): LayersValue {
  if (
    fromIndex < 0 ||
    fromIndex >= layers.value.length ||
    toIndex < 0 ||
    toIndex >= layers.value.length
  ) {
    return layers;
  }

  const newValue = [...layers.value];
  const [removed] = newValue.splice(fromIndex, 1);
  newValue.splice(toIndex, 0, removed);

  return {
    type: "layers",
    value: newValue,
  };
}

/**
 * Create an empty LayersValue
 */
export function createEmptyLayers(): LayersValue {
  return {
    type: "layers",
    value: [],
  };
}

// =============================================================================
// Shadow Layer Utilities
// =============================================================================

/**
 * Create a default shadow value
 */
export function createDefaultShadow(): ShadowValue {
  return {
    type: "shadow",
    position: "outset",
    offsetX: { type: "unit", unit: "px", value: 0 },
    offsetY: { type: "unit", unit: "px", value: 4 },
    blur: { type: "unit", unit: "px", value: 6 },
    spread: { type: "unit", unit: "px", value: 0 },
    color: {
      type: "color",
      colorSpace: "srgb",
      components: [0, 0, 0],
      alpha: 0.1,
    },
  };
}

/**
 * Create a shadow value from parameters
 */
export function createShadow(params: {
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  spread?: number;
  color?: { r: number; g: number; b: number; alpha: number };
  inset?: boolean;
}): ShadowValue {
  const { offsetX = 0, offsetY = 4, blur = 6, spread = 0, color, inset = false } = params;

  return {
    type: "shadow",
    position: inset ? "inset" : "outset",
    offsetX: { type: "unit", unit: "px", value: offsetX },
    offsetY: { type: "unit", unit: "px", value: offsetY },
    blur: { type: "unit", unit: "px", value: blur },
    spread: { type: "unit", unit: "px", value: spread },
    color: color
      ? {
          type: "color",
          colorSpace: "srgb",
          components: [color.r / 255, color.g / 255, color.b / 255],
          alpha: color.alpha,
        }
      : {
          type: "color",
          colorSpace: "srgb",
          components: [0, 0, 0],
          alpha: 0.1,
        },
  };
}

/**
 * Extract numeric value from UnitValue, returning default for VarValue or undefined
 */
export function getUnitValueNumber(
  value: UnitValue | VarValue | undefined,
  defaultVal: number = 0
): number {
  if (!value) return defaultVal;
  if (value.type === "unit") return value.value;
  // VarValue - return default since we can't resolve the variable
  return defaultVal;
}

/**
 * Check if a shadow value component is a VarValue
 */
export function isVarValueComponent(value: UnitValue | VarValue | undefined): value is VarValue {
  return value?.type === "var";
}

/**
 * Convert shadow to CSS string using the centralized styleValueToCss utility
 */
export function shadowToCss(shadow: ShadowValue): string {
  return styleValueToCss(shadow);
}

// =============================================================================
// Gradient Utilities
// =============================================================================

export type GradientType = "linear" | "radial" | "conic";

export interface GradientStop {
  color: ColorValue;
  position: number; // 0-100
}

/**
 * GradientConfig represents a CSS gradient in a structured format.
 */
export interface GradientConfig {
  type: GradientType;
  angle?: number; // For linear gradients (0-360)
  stops: GradientStop[];
}

/**
 * Create a default gradient configuration
 */
export function createDefaultGradient(): GradientConfig {
  return {
    type: "linear",
    angle: 90,
    stops: [
      {
        color: {
          type: "color",
          colorSpace: "srgb",
          components: [1, 1, 1],
          alpha: 1,
        },
        position: 0,
      },
      {
        color: {
          type: "color",
          colorSpace: "srgb",
          components: [0, 0, 0],
          alpha: 1,
        },
        position: 100,
      },
    ],
  };
}

/**
 * Add a color stop to a gradient
 */
export function addGradientStop(
  gradient: GradientConfig,
  stop: GradientStop
): GradientConfig {
  const newStops = [...gradient.stops, stop].sort((a, b) => a.position - b.position);
  return {
    ...gradient,
    stops: newStops,
  };
}

/**
 * Remove a color stop from a gradient
 */
export function removeGradientStop(
  gradient: GradientConfig,
  index: number
): GradientConfig {
  if (gradient.stops.length <= 2 || index < 0 || index >= gradient.stops.length) {
    return gradient;
  }
  return {
    ...gradient,
    stops: gradient.stops.filter((_, i) => i !== index),
  };
}

/**
 * Update a color stop in a gradient
 */
export function updateGradientStop(
  gradient: GradientConfig,
  index: number,
  stop: Partial<GradientStop>
): GradientConfig {
  if (index < 0 || index >= gradient.stops.length) {
    return gradient;
  }
  const newStops = [...gradient.stops];
  newStops[index] = { ...newStops[index], ...stop };
  // Re-sort if position changed
  if (stop.position !== undefined) {
    newStops.sort((a, b) => a.position - b.position);
  }
  return {
    ...gradient,
    stops: newStops,
  };
}

/**
 * Convert a GradientConfig to a FunctionValue for use in LayersValue.
 */
export function gradientToFunctionValue(gradient: GradientConfig): FunctionValue {
  const functionName = `${gradient.type}-gradient`;

  return {
    type: "function",
    name: functionName,
    args: {
      type: "unparsed",
      value: buildGradientArgsString(gradient),
    },
  };
}

/**
 * Build the inner arguments string for a gradient function
 */
function buildGradientArgsString(gradient: GradientConfig): string {
  const parts: string[] = [];

  // Add direction for linear gradients
  if (gradient.type === "linear") {
    parts.push(`${gradient.angle ?? 90}deg`);
  } else if (gradient.type === "conic") {
    parts.push(`from ${gradient.angle ?? 0}deg`);
  } else if (gradient.type === "radial") {
    parts.push("circle");
  }

  // Add color stops
  for (const stop of gradient.stops) {
    const colorCss = styleValueToCss(stop.color);
    parts.push(`${colorCss} ${stop.position}%`);
  }

  return parts.join(", ");
}

/**
 * Convert gradient configuration to CSS string
 */
export function gradientToCss(gradient: GradientConfig): string {
  const functionValue = gradientToFunctionValue(gradient);
  return styleValueToCss(functionValue);
}

/**
 * Convert layers value to CSS string for box-shadow
 */
export function layersToBoxShadowCss(layers: LayersValue): string {
  return styleValueToCss(layers);
}
