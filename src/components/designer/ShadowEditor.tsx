/**
 * ShadowEditor Component
 *
 * Editor for layered box-shadow values with:
 * - List of shadow layers
 * - Per-layer controls: X, Y, Blur, Spread, Color, Inset toggle
 * - Add/Remove/Reorder controls
 * - Live composite preview
 *
 * Inspired by Webstudio's layered shadow editor patterns.
 * See: https://github.com/webstudio-is/webstudio
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * Copyright (c) RadFlow
 */

import { useState, useCallback, useMemo } from "react";
import type {
  LayersValue,
  ShadowValue,
  UnitValue,
  ColorValue,
  RgbValue,
  KeywordValue,
  VarValue,
} from "../../types/styleValue";
import {
  addLayer,
  removeLayer,
  updateLayer,
  reorderLayers,
  createDefaultShadow,
  layersToBoxShadowCss,
  getUnitValueNumber,
  isVarValueComponent,
} from "../../utils/layersValue";

// =============================================================================
// Types
// =============================================================================

export interface ShadowEditorProps {
  /** Current shadow layers value */
  value: LayersValue;
  /** Called when shadow value changes */
  onChange: (value: LayersValue) => void;
  /** Whether editor is disabled */
  disabled?: boolean;
}

interface ShadowLayerProps {
  shadow: ShadowValue;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onChange: (shadow: ShadowValue) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disabled?: boolean;
}

// Shadow color can be ColorValue, RgbValue, KeywordValue, or VarValue
type ShadowColorType = ColorValue | RgbValue | KeywordValue | VarValue;

// =============================================================================
// Utilities - Use shared color conversion utilities where possible
// =============================================================================

function createUnitValue(value: number, unit: string = "px"): UnitValue {
  return { type: "unit", unit: unit as UnitValue["unit"], value };
}

/**
 * Convert shadow color to hex string for display
 * Returns a fallback for VarValue and KeywordValue since we can't resolve them
 */
function shadowColorToHex(color: ShadowColorType | undefined): string {
  if (!color) return "#000000";

  switch (color.type) {
    case "color": {
      const [r, g, b] = color.components;
      const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    case "rgb": {
      const toHex = (n: number) => n.toString(16).padStart(2, "0");
      return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
    }
    case "keyword":
      // Can't convert keywords to hex - return black as fallback
      return "#000000";
    case "var":
      // Can't resolve CSS variables - return black as fallback
      return "#000000";
    default:
      return "#000000";
  }
}

function hexToColorValue(hex: string, alpha: number = 1): ColorValue {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { type: "color", colorSpace: "srgb", components: [0, 0, 0], alpha };
  }
  return {
    type: "color",
    colorSpace: "srgb",
    components: [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
    ],
    alpha,
  };
}

/**
 * Get alpha value from shadow color
 * Returns 1 for types that don't have alpha (keyword, var)
 */
function getShadowColorAlpha(color: ShadowColorType | undefined): number {
  if (!color) return 1;

  switch (color.type) {
    case "color":
      return color.alpha;
    case "rgb":
      return color.alpha;
    case "keyword":
    case "var":
      return 1;
    default:
      return 1;
  }
}

/**
 * Check if a shadow color is a CSS variable (cannot be edited inline)
 */
function isVarColor(color: ShadowColorType | undefined): color is VarValue {
  return color?.type === "var";
}

// =============================================================================
// ShadowLayer Component
// =============================================================================

function ShadowLayer({
  shadow,
  index,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  disabled,
}: ShadowLayerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Check if any component is using a CSS variable (display indicator)
  const hasVarOffset = isVarValueComponent(shadow.offsetX) || isVarValueComponent(shadow.offsetY);
  const hasVarBlur = isVarValueComponent(shadow.blur);
  const hasVarSpread = isVarValueComponent(shadow.spread);
  const hasVarColor = isVarColor(shadow.color);

  const handleValueChange = useCallback(
    (field: keyof ShadowValue, value: number | boolean | string) => {
      const newShadow = { ...shadow };

      switch (field) {
        case "offsetX":
          newShadow.offsetX = createUnitValue(value as number);
          break;
        case "offsetY":
          newShadow.offsetY = createUnitValue(value as number);
          break;
        case "blur":
          newShadow.blur = createUnitValue(value as number);
          break;
        case "spread":
          newShadow.spread = createUnitValue(value as number);
          break;
        case "position":
          newShadow.position = value ? "inset" : "outset";
          break;
      }

      onChange(newShadow);
    },
    [shadow, onChange]
  );

  const handleColorChange = useCallback(
    (hex: string) => {
      const alpha = getShadowColorAlpha(shadow.color);
      const newShadow = {
        ...shadow,
        color: hexToColorValue(hex, alpha),
      };
      onChange(newShadow);
    },
    [shadow, onChange]
  );

  const handleAlphaChange = useCallback(
    (alpha: number) => {
      const currentColor = shadow.color;
      if (currentColor && currentColor.type === "color") {
        const newShadow = {
          ...shadow,
          color: { ...currentColor, alpha },
        };
        onChange(newShadow);
      }
    },
    [shadow, onChange]
  );

  const colorHex = shadowColorToHex(shadow.color);
  const colorAlpha = getShadowColorAlpha(shadow.color);

  return (
    <div className="bg-background/30 rounded-lg border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs text-text hover:text-primary transition-colors"
          disabled={disabled}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform ${isExpanded ? "" : "-rotate-90"}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span>Shadow {index + 1}</span>
          {shadow.position === "inset" && (
            <span className="text-[10px] text-text-muted bg-white/10 px-1.5 rounded">inset</span>
          )}
        </button>

        <div className="flex items-center gap-1">
          {/* Reorder buttons */}
          <button
            onClick={onMoveUp}
            disabled={disabled || isFirst}
            className="p-1 rounded hover:bg-white/5 text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move up"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
          <button
            onClick={onMoveDown}
            disabled={disabled || isLast}
            className="p-1 rounded hover:bg-white/5 text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move down"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {/* Remove button */}
          <button
            onClick={onRemove}
            disabled={disabled}
            className="p-1 rounded hover:bg-red-500/20 text-text-muted hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Remove shadow"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Controls */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* X/Y Offset */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
                X Offset {hasVarOffset && <span className="text-primary">(var)</span>}
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={getUnitValueNumber(shadow.offsetX)}
                  onChange={(e) => handleValueChange("offsetX", parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                  className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono disabled:opacity-50"
                />
                <span className="h-7 flex items-center px-1.5 text-[10px] text-text-muted bg-background/30 rounded-md">
                  px
                </span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
                Y Offset
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={getUnitValueNumber(shadow.offsetY)}
                  onChange={(e) => handleValueChange("offsetY", parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                  className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono disabled:opacity-50"
                />
                <span className="h-7 flex items-center px-1.5 text-[10px] text-text-muted bg-background/30 rounded-md">
                  px
                </span>
              </div>
            </div>
          </div>

          {/* Blur/Spread */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
                Blur {hasVarBlur && <span className="text-primary">(var)</span>}
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min="0"
                  value={getUnitValueNumber(shadow.blur)}
                  onChange={(e) => handleValueChange("blur", Math.max(0, parseFloat(e.target.value) || 0))}
                  disabled={disabled}
                  className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono disabled:opacity-50"
                />
                <span className="h-7 flex items-center px-1.5 text-[10px] text-text-muted bg-background/30 rounded-md">
                  px
                </span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
                Spread {hasVarSpread && <span className="text-primary">(var)</span>}
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={getUnitValueNumber(shadow.spread)}
                  onChange={(e) => handleValueChange("spread", parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                  className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono disabled:opacity-50"
                />
                <span className="h-7 flex items-center px-1.5 text-[10px] text-text-muted bg-background/30 rounded-md">
                  px
                </span>
              </div>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
              Color {hasVarColor && <span className="text-primary">(var: {(shadow.color as VarValue).value})</span>}
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => handleColorChange(e.target.value)}
                disabled={disabled}
                className="w-8 h-7 rounded border border-white/10 cursor-pointer disabled:opacity-50"
              />
              <input
                type="text"
                value={colorHex}
                onChange={(e) => handleColorChange(e.target.value)}
                disabled={disabled}
                className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono disabled:opacity-50"
              />
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(colorAlpha * 100)}
                  onChange={(e) => handleAlphaChange(parseInt(e.target.value) / 100)}
                  disabled={disabled}
                  className="w-16 h-1.5 bg-white/10 rounded disabled:opacity-50"
                />
                <span className="text-[10px] text-text-muted w-8">
                  {Math.round(colorAlpha * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Inset Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleValueChange("position", shadow.position !== "inset")}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                shadow.position === "inset"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted border border-white/8 hover:text-text"
              } disabled:opacity-50`}
            >
              Inset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ShadowEditor Component
// =============================================================================

export function ShadowEditor({ value, onChange, disabled }: ShadowEditorProps) {
  // Get only shadow layers
  const shadowLayers = useMemo(() => {
    return value.value
      .map((layer, index) => ({ layer, index }))
      .filter(({ layer }) => layer.type === "shadow") as { layer: ShadowValue; index: number }[];
  }, [value]);

  // Preview CSS
  const previewCss = useMemo(() => layersToBoxShadowCss(value), [value]);

  const handleAddShadow = useCallback(() => {
    const newLayers = addLayer(value, createDefaultShadow());
    onChange(newLayers);
  }, [value, onChange]);

  const handleRemoveShadow = useCallback(
    (originalIndex: number) => {
      const newLayers = removeLayer(value, originalIndex);
      onChange(newLayers);
    },
    [value, onChange]
  );

  const handleUpdateShadow = useCallback(
    (originalIndex: number, shadow: ShadowValue) => {
      const newLayers = updateLayer(value, originalIndex, shadow);
      onChange(newLayers);
    },
    [value, onChange]
  );

  const handleMoveUp = useCallback(
    (originalIndex: number) => {
      if (originalIndex > 0) {
        const newLayers = reorderLayers(value, originalIndex, originalIndex - 1);
        onChange(newLayers);
      }
    },
    [value, onChange]
  );

  const handleMoveDown = useCallback(
    (originalIndex: number) => {
      if (originalIndex < value.value.length - 1) {
        const newLayers = reorderLayers(value, originalIndex, originalIndex + 1);
        onChange(newLayers);
      }
    },
    [value, onChange]
  );

  return (
    <div className="space-y-3">
      {/* Preview */}
      <div className="flex justify-center p-4 bg-background/30 rounded-lg border border-white/5">
        <div
          className="w-20 h-16 bg-surface rounded-lg"
          style={{ boxShadow: previewCss || "none" }}
        />
      </div>

      {/* Shadow layers */}
      <div className="space-y-2">
        {shadowLayers.map(({ layer, index }, i) => (
          <ShadowLayer
            key={index}
            shadow={layer}
            index={i}
            isFirst={i === 0}
            isLast={i === shadowLayers.length - 1}
            onChange={(shadow) => handleUpdateShadow(index, shadow)}
            onRemove={() => handleRemoveShadow(index)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={handleAddShadow}
        disabled={disabled}
        className="w-full py-2 border border-dashed border-white/20 rounded-lg text-xs text-text-muted hover:text-text hover:border-white/40 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Shadow
      </button>

      {/* CSS Output preview */}
      {previewCss && (
        <div className="bg-background/30 rounded-lg p-2">
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">CSS</div>
          <code className="text-[11px] text-text font-mono break-all">{previewCss}</code>
        </div>
      )}
    </div>
  );
}

export default ShadowEditor;
