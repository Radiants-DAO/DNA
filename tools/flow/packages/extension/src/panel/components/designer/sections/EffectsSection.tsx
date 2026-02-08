/**
 * EffectsSection Component
 *
 * Controls for box shadow, backdrop blur, and opacity.
 * Placeholder that can be expanded in the future.
 *
 * Ported from Flow 0 for the browser extension.
 */

import { useState, useCallback, useEffect } from "react";
import type { BaseSectionProps } from "./types";
import { DogfoodBoundary } from '../../ui/DogfoodBoundary';

/**
 * Parse an opacity value from CSS (e.g., "0.5", "50%", "1")
 */
function parseOpacity(cssValue: string | undefined): number {
  if (!cssValue) return 100;
  const value = parseFloat(cssValue);
  if (isNaN(value)) return 100;
  // If it's a decimal (0-1), convert to percentage
  if (value <= 1) return Math.round(value * 100);
  return Math.round(value);
}

/**
 * Parse a blur value from CSS (e.g., "blur(10px)")
 */
function parseBlur(cssValue: string | undefined): number {
  if (!cssValue) return 0;
  const match = cssValue.match(/blur\((\d+(?:\.\d+)?)(px)?\)/);
  return match ? parseFloat(match[1]) : 0;
}

export function EffectsSection(props: BaseSectionProps) {
  const { onStyleChange, initialStyles } = props;

  // State
  const [boxShadow, setBoxShadow] = useState(initialStyles?.boxShadow || "0 2px 8px rgba(0,0,0,0.25)");
  const [backdropBlur, setBackdropBlur] = useState(parseBlur(initialStyles?.backdropFilter));
  const [opacity, setOpacity] = useState(parseOpacity(initialStyles?.opacity));

  // Update state when initialStyles changes
  useEffect(() => {
    if (initialStyles) {
      setBoxShadow(initialStyles.boxShadow || "0 2px 8px rgba(0,0,0,0.25)");
      setBackdropBlur(parseBlur(initialStyles.backdropFilter));
      setOpacity(parseOpacity(initialStyles.opacity));
    }
  }, [initialStyles]);

  // Handlers
  const handleBoxShadowChange = useCallback((value: string) => {
    setBoxShadow(value);
    if (onStyleChange) {
      onStyleChange("boxShadow", { type: "unparsed", value });
    }
  }, [onStyleChange]);

  const handleBackdropBlurChange = useCallback((value: number) => {
    setBackdropBlur(value);
    if (onStyleChange) {
      onStyleChange("backdropFilter", { type: "unparsed", value: `blur(${value}px)` });
    }
  }, [onStyleChange]);

  const handleOpacityChange = useCallback((value: number) => {
    setOpacity(value);
    if (onStyleChange) {
      // Opacity is stored as 0-1 in CSS
      onStyleChange("opacity", { type: "unit", unit: "number", value: value / 100 });
    }
  }, [onStyleChange]);

  return (
    <DogfoodBoundary name="EffectsSection" file="designer/sections/EffectsSection.tsx" category="designer">
    <div className="space-y-3">
      <div>
        <label className="text-xs text-neutral-400 block mb-1">Box Shadow</label>
        <input
          type="text"
          value={boxShadow}
          onChange={(e) => handleBoxShadowChange(e.target.value)}
          className="w-full h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200 font-mono"
        />
      </div>
      <div>
        <label className="text-xs text-neutral-400 block mb-1">Backdrop Blur</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="40"
            value={backdropBlur}
            onChange={(e) => handleBackdropBlurChange(parseInt(e.target.value, 10))}
            className="flex-1"
          />
          <input
            type="text"
            value={`${backdropBlur}px`}
            onChange={(e) => {
              const match = e.target.value.match(/^(\d+)/);
              if (match) {
                handleBackdropBlurChange(parseInt(match[1], 10));
              }
            }}
            className="w-16 h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-neutral-400 block mb-1">Opacity</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => handleOpacityChange(parseInt(e.target.value, 10))}
            className="flex-1"
          />
          <input
            type="text"
            value={`${opacity}%`}
            onChange={(e) => {
              const match = e.target.value.match(/^(\d+)/);
              if (match) {
                handleOpacityChange(Math.min(100, Math.max(0, parseInt(match[1], 10))));
              }
            }}
            className="w-16 h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200"
          />
        </div>
      </div>
    </div>
    </DogfoodBoundary>
  );
}

export default EffectsSection;
