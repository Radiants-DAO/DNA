/**
 * BackgroundsSection Component (renamed from ColorsSection)
 *
 * Controls for background color, gradient backgrounds, and text color.
 * Uses design tokens when available.
 *
 * Ported from Flow 0 for the browser extension.
 */

import { useState, useCallback, useEffect } from "react";
import { GradientEditor, createDefaultGradient } from "../GradientEditor";
import type { GradientConfig } from "../../../utils/layersValue";
import { gradientToCss } from "../../../utils/layersValue";
import type { BaseSectionProps } from "./types";
import type { StyleValue } from "../../../types/styleValue";
import { DogfoodBoundary } from '../../ui/DogfoodBoundary';

type BackgroundMode = "color" | "gradient";

/**
 * Create a StyleValue from a color string
 */
function createColorValue(colorStr: string): StyleValue {
  // Check if it's a var() reference
  if (colorStr.startsWith("var(")) {
    const varName = colorStr.replace(/^var\(--/, "").replace(/\)$/, "");
    return { type: "var", value: varName };
  }
  // For other colors, return as unparsed
  return { type: "unparsed", value: colorStr };
}

export function BackgroundsSection(props: BaseSectionProps) {
  const { onStyleChange, initialStyles } = props;

  // Detect if initial background is a gradient
  const isInitialGradient = initialStyles?.background?.includes("gradient") ||
    initialStyles?.backgroundImage?.includes("gradient");

  // Background state
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>(
    isInitialGradient ? "gradient" : "color"
  );
  const [backgroundColor, setBackgroundColor] = useState(
    initialStyles?.backgroundColor || "var(--primary)"
  );
  const [backgroundGradient, setBackgroundGradient] = useState<GradientConfig>(() =>
    createDefaultGradient()
  );
  const [textColor, setTextColor] = useState(initialStyles?.color || "var(--text)");

  // Update state when initialStyles changes
  useEffect(() => {
    if (initialStyles) {
      const hasGradient = initialStyles.background?.includes("gradient") ||
        initialStyles.backgroundImage?.includes("gradient");
      setBackgroundMode(hasGradient ? "gradient" : "color");
      setBackgroundColor(initialStyles.backgroundColor || "var(--primary)");
      setTextColor(initialStyles.color || "var(--text)");
    }
  }, [initialStyles]);

  // Handle background color change
  const handleBackgroundColorChange = useCallback((newValue: string) => {
    setBackgroundColor(newValue);
    if (onStyleChange) {
      onStyleChange("backgroundColor", createColorValue(newValue));
    }
  }, [onStyleChange]);

  // Handle gradient change
  const handleGradientChange = useCallback((newGradient: GradientConfig) => {
    setBackgroundGradient(newGradient);
    if (onStyleChange) {
      const gradientCss = gradientToCss(newGradient);
      onStyleChange("backgroundImage", { type: "unparsed", value: gradientCss });
    }
  }, [onStyleChange]);

  // Handle text color change
  const handleTextColorChange = useCallback((newValue: string) => {
    setTextColor(newValue);
    if (onStyleChange) {
      onStyleChange("color", createColorValue(newValue));
    }
  }, [onStyleChange]);

  // Get preview style for background swatch
  const getBackgroundPreviewStyle = (): React.CSSProperties => {
    if (backgroundMode === "gradient") {
      return { background: gradientToCss(backgroundGradient) };
    }
    // For tokens, show the resolved color
    if (backgroundColor.startsWith("var(")) {
      return { backgroundColor: "var(--primary)" };
    }
    return { backgroundColor };
  };

  return (
    <DogfoodBoundary name="BackgroundsSection" file="designer/sections/BackgroundsSection.tsx" category="designer">
    <div className="space-y-4">
      {/* Background */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
            Background
          </label>
          {/* Mode toggle */}
          <div className="flex gap-0.5 bg-neutral-800/50 rounded-md p-0.5">
            <button
              onClick={() => setBackgroundMode("color")}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                backgroundMode === "color"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Color
            </button>
            <button
              onClick={() => setBackgroundMode("gradient")}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                backgroundMode === "gradient"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Gradient
            </button>
          </div>
        </div>

        {backgroundMode === "color" ? (
          <div className="flex gap-2">
            <div
              className="w-8 h-8 rounded-md border border-neutral-700 cursor-pointer flex-shrink-0"
              style={getBackgroundPreviewStyle()}
            />
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              className="flex-1 h-8 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200 font-mono"
            />
          </div>
        ) : (
          <GradientEditor
            value={backgroundGradient}
            onChange={handleGradientChange}
            disabled={false}
          />
        )}
      </div>

      {/* Text Color */}
      <div>
        <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
          Text Color
        </label>
        <div className="flex gap-2">
          <div
            className="w-8 h-8 rounded-md border border-neutral-700 cursor-pointer flex-shrink-0"
            style={{
              backgroundColor: textColor.startsWith("var(")
                ? "var(--text)"
                : textColor,
            }}
          />
          <input
            type="text"
            value={textColor}
            onChange={(e) => handleTextColorChange(e.target.value)}
            className="flex-1 h-8 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200 font-mono"
          />
        </div>
      </div>
    </div>
    </DogfoodBoundary>
  );
}

// Also export as ColorsSection for backward compatibility
export const ColorsSection = BackgroundsSection;

export default BackgroundsSection;
