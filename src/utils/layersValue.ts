/**
 * Layers Value Utilities
 *
 * Utility functions for manipulating LayersValue (comma-separated CSS values).
 * Used for box-shadow, background, and other layered CSS properties.
 *
 * Part of fn-2-gnc.6: Build Shadow and Gradient Editors
 */

import type {
  LayersValue,
  LayerValueItem,
  ShadowValue,
  UnitValue,
  ColorValue,
  KeywordValue,
} from "../types/styleValue";

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
 * Extract numeric value from UnitValue or return default
 */
export function getUnitValueNumber(value: UnitValue | undefined, defaultVal: number = 0): number {
  if (!value || value.type !== "unit") return defaultVal;
  return value.value;
}

/**
 * Convert shadow to CSS string
 */
export function shadowToCss(shadow: ShadowValue): string {
  const parts: string[] = [];

  if (shadow.position === "inset") {
    parts.push("inset");
  }

  // X and Y offsets
  const x = shadow.offsetX.type === "unit" ? `${shadow.offsetX.value}${shadow.offsetX.unit}` : "0px";
  const y = shadow.offsetY.type === "unit" ? `${shadow.offsetY.value}${shadow.offsetY.unit}` : "0px";
  parts.push(x, y);

  // Blur
  if (shadow.blur && shadow.blur.type === "unit") {
    parts.push(`${shadow.blur.value}${shadow.blur.unit}`);
  }

  // Spread
  if (shadow.spread && shadow.spread.type === "unit") {
    parts.push(`${shadow.spread.value}${shadow.spread.unit}`);
  }

  // Color
  if (shadow.color) {
    if (shadow.color.type === "color") {
      const [r, g, b] = shadow.color.components;
      const a = shadow.color.alpha;
      parts.push(`rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`);
    } else if (shadow.color.type === "rgb") {
      parts.push(`rgba(${shadow.color.r}, ${shadow.color.g}, ${shadow.color.b}, ${shadow.color.alpha})`);
    } else if (shadow.color.type === "keyword") {
      parts.push(shadow.color.value);
    }
  }

  return parts.join(" ");
}

// =============================================================================
// Gradient Utilities
// =============================================================================

export type GradientType = "linear" | "radial" | "conic";

export interface GradientStop {
  color: ColorValue;
  position: number; // 0-100
}

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
 * Ensures at least 2 stops remain
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
 * Convert gradient configuration to CSS string
 */
export function gradientToCss(gradient: GradientConfig): string {
  const stopStrings = gradient.stops.map((stop) => {
    const [r, g, b] = stop.color.components;
    const a = stop.color.alpha;
    const colorStr = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    return `${colorStr} ${stop.position}%`;
  });

  switch (gradient.type) {
    case "linear":
      return `linear-gradient(${gradient.angle ?? 90}deg, ${stopStrings.join(", ")})`;
    case "radial":
      return `radial-gradient(circle, ${stopStrings.join(", ")})`;
    case "conic":
      return `conic-gradient(from ${gradient.angle ?? 0}deg, ${stopStrings.join(", ")})`;
    default:
      return `linear-gradient(90deg, ${stopStrings.join(", ")})`;
  }
}

/**
 * Convert layers value to CSS string for box-shadow
 */
export function layersToBoxShadowCss(layers: LayersValue): string {
  return layers.value
    .map((layer) => {
      if (layer.type === "shadow") {
        return shadowToCss(layer);
      }
      // Fallback for unparsed values
      if (layer.type === "unparsed") {
        return layer.value;
      }
      return "";
    })
    .filter(Boolean)
    .join(", ");
}
