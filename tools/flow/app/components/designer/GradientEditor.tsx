/**
 * GradientEditor Component
 *
 * Editor for CSS gradient values with:
 * - Gradient type selection: linear, radial, conic
 * - Direction/angle control
 * - Color stops with position
 * - Add/Remove stops
 * - Visual gradient preview bar
 *
 * Inspired by Webstudio's gradient editor patterns.
 * See: https://github.com/webstudio-is/webstudio
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * Copyright (c) RadFlow
 */

import { useState, useCallback, useMemo, useRef } from "react";
import type { ColorValue } from "../../types/styleValue";
import {
  type GradientConfig,
  type GradientStop,
  type GradientType,
  createDefaultGradient,
  addGradientStop,
  removeGradientStop,
  updateGradientStop,
  gradientToCss,
} from "../../utils/layersValue";

// =============================================================================
// Types
// =============================================================================

export interface GradientEditorProps {
  /** Current gradient configuration */
  value: GradientConfig;
  /** Called when gradient changes */
  onChange: (value: GradientConfig) => void;
  /** Whether editor is disabled */
  disabled?: boolean;
}

interface ColorStopProps {
  stop: GradientStop;
  index: number;
  canRemove: boolean;
  onChange: (stop: Partial<GradientStop>) => void;
  onRemove: () => void;
  disabled?: boolean;
}

// =============================================================================
// Utilities
// =============================================================================

function colorValueToHex(color: ColorValue): string {
  const [r, g, b] = color.components;
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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

// =============================================================================
// ColorStop Component
// =============================================================================

function ColorStop({
  stop,
  index,
  canRemove,
  onChange,
  onRemove,
  disabled,
}: ColorStopProps) {
  const colorHex = colorValueToHex(stop.color);

  const handleColorChange = useCallback(
    (hex: string) => {
      onChange({ color: hexToColorValue(hex, stop.color.alpha) });
    },
    [onChange, stop.color.alpha]
  );

  const handleAlphaChange = useCallback(
    (alpha: number) => {
      onChange({ color: { ...stop.color, alpha } });
    },
    [onChange, stop.color]
  );

  const handlePositionChange = useCallback(
    (position: number) => {
      onChange({ position: Math.max(0, Math.min(100, position)) });
    },
    [onChange]
  );

  return (
    <div className="flex items-center gap-2 p-2 bg-background/30 rounded-lg">
      {/* Color swatch */}
      <input
        type="color"
        value={colorHex}
        onChange={(e) => handleColorChange(e.target.value)}
        disabled={disabled}
        className="w-7 h-7 rounded border border-white/10 cursor-pointer disabled:opacity-50"
      />

      {/* Color hex input */}
      <input
        type="text"
        value={colorHex}
        onChange={(e) => handleColorChange(e.target.value)}
        disabled={disabled}
        className="w-20 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono disabled:opacity-50"
      />

      {/* Alpha slider */}
      <div className="flex items-center gap-1">
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(stop.color.alpha * 100)}
          onChange={(e) => handleAlphaChange(parseInt(e.target.value) / 100)}
          disabled={disabled}
          className="w-12 h-1.5 bg-white/10 rounded disabled:opacity-50"
        />
        <span className="text-[10px] text-text-muted w-7">
          {Math.round(stop.color.alpha * 100)}%
        </span>
      </div>

      {/* Position input */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          max="100"
          value={Math.round(stop.position)}
          onChange={(e) => handlePositionChange(parseInt(e.target.value) || 0)}
          disabled={disabled}
          className="w-12 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono text-center disabled:opacity-50"
        />
        <span className="text-[10px] text-text-muted">%</span>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        disabled={disabled || !canRemove}
        className="p-1 rounded hover:bg-red-500/20 text-text-muted hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title={canRemove ? "Remove stop" : "Minimum 2 stops required"}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// =============================================================================
// GradientEditor Component
// =============================================================================

export function GradientEditor({ value, onChange, disabled }: GradientEditorProps) {
  const previewBarRef = useRef<HTMLDivElement>(null);

  // Preview CSS
  const previewCss = useMemo(() => gradientToCss(value), [value]);

  // Handle gradient type change
  const handleTypeChange = useCallback(
    (type: GradientType) => {
      onChange({ ...value, type });
    },
    [value, onChange]
  );

  // Handle angle change
  const handleAngleChange = useCallback(
    (angle: number) => {
      onChange({ ...value, angle: Math.max(0, Math.min(360, angle)) });
    },
    [value, onChange]
  );

  // Handle stop updates
  const handleStopChange = useCallback(
    (index: number, stopUpdate: Partial<GradientStop>) => {
      const newValue = updateGradientStop(value, index, stopUpdate);
      onChange(newValue);
    },
    [value, onChange]
  );

  // Handle stop removal
  const handleRemoveStop = useCallback(
    (index: number) => {
      const newValue = removeGradientStop(value, index);
      onChange(newValue);
    },
    [value, onChange]
  );

  // Handle add stop
  const handleAddStop = useCallback(() => {
    // Find middle position between last two stops
    const stops = value.stops;
    let newPosition = 50;
    if (stops.length >= 2) {
      const lastStop = stops[stops.length - 1];
      const secondLastStop = stops[stops.length - 2];
      newPosition = (lastStop.position + secondLastStop.position) / 2;
    }

    // Interpolate color
    const midColor: ColorValue = {
      type: "color",
      colorSpace: "srgb",
      components: [0.5, 0.5, 0.5],
      alpha: 1,
    };

    const newValue = addGradientStop(value, { color: midColor, position: newPosition });
    onChange(newValue);
  }, [value, onChange]);

  // Handle click on preview bar to add stop
  const handlePreviewClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      const bar = previewBarRef.current;
      if (!bar) return;

      const rect = bar.getBoundingClientRect();
      const position = ((e.clientX - rect.left) / rect.width) * 100;

      // Interpolate color at this position
      const midColor: ColorValue = {
        type: "color",
        colorSpace: "srgb",
        components: [0.5, 0.5, 0.5],
        alpha: 1,
      };

      const newValue = addGradientStop(value, { color: midColor, position });
      onChange(newValue);
    },
    [value, onChange, disabled]
  );

  // Gradient type options
  const typeOptions: { value: GradientType; label: string }[] = [
    { value: "linear", label: "Linear" },
    { value: "radial", label: "Radial" },
    { value: "conic", label: "Conic" },
  ];

  return (
    <div className="space-y-3">
      {/* Preview bar */}
      <div
        ref={previewBarRef}
        onClick={handlePreviewClick}
        className="h-10 rounded-lg border border-white/10 cursor-crosshair relative overflow-hidden"
        style={{ background: previewCss }}
        title="Click to add a color stop"
      >
        {/* Stop indicators */}
        {value.stops.map((stop, index) => (
          <div
            key={index}
            className="absolute top-0 bottom-0 w-0.5 bg-white/50"
            style={{ left: `${stop.position}%` }}
          >
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border border-white/50"
              style={{ backgroundColor: colorValueToHex(stop.color) }}
            />
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border border-white/50"
              style={{ backgroundColor: colorValueToHex(stop.color) }}
            />
          </div>
        ))}
      </div>

      {/* Type selector */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Type
        </label>
        <div className="flex gap-1">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleTypeChange(option.value)}
              disabled={disabled}
              className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                value.type === option.value
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted hover:text-text border border-transparent"
              } disabled:opacity-50`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Angle control (for linear and conic) */}
      {(value.type === "linear" || value.type === "conic") && (
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
            {value.type === "linear" ? "Angle" : "Start Angle"}
          </label>
          <div className="flex items-center gap-2">
            {/* Angle dial */}
            <div className="relative w-10 h-10 rounded-full border border-white/20 bg-background/30">
              <div
                className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-primary origin-left rounded-full"
                style={{ transform: `translateY(-50%) rotate(${(value.angle ?? 90) - 90}deg)` }}
              />
              <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={value.angle ?? 90}
              onChange={(e) => handleAngleChange(parseInt(e.target.value))}
              disabled={disabled}
              className="flex-1 h-1.5 bg-white/10 rounded disabled:opacity-50"
            />
            <div className="flex gap-1 items-center">
              <input
                type="number"
                min="0"
                max="360"
                value={value.angle ?? 90}
                onChange={(e) => handleAngleChange(parseInt(e.target.value) || 0)}
                disabled={disabled}
                className="w-14 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono text-center disabled:opacity-50"
              />
              <span className="text-[10px] text-text-muted">deg</span>
            </div>
          </div>
        </div>
      )}

      {/* Color stops */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] text-text-muted uppercase tracking-wider">
            Color Stops ({value.stops.length})
          </label>
        </div>
        <div className="space-y-2">
          {value.stops.map((stop, index) => (
            <ColorStop
              key={index}
              stop={stop}
              index={index}
              canRemove={value.stops.length > 2}
              onChange={(stopUpdate) => handleStopChange(index, stopUpdate)}
              onRemove={() => handleRemoveStop(index)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      {/* Add stop button */}
      <button
        onClick={handleAddStop}
        disabled={disabled}
        className="w-full py-2 border border-dashed border-white/20 rounded-lg text-xs text-text-muted hover:text-text hover:border-white/40 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Color Stop
      </button>

      {/* CSS Output preview */}
      <div className="bg-background/30 rounded-lg p-2">
        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">CSS</div>
        <code className="text-[11px] text-text font-mono break-all">{previewCss}</code>
      </div>
    </div>
  );
}

// =============================================================================
// Default Export & Factory
// =============================================================================

export { createDefaultGradient };
export default GradientEditor;
