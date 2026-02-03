/**
 * BackgroundsSection Component (renamed from ColorsSection)
 *
 * Controls for background color, gradient backgrounds, and text color.
 * Uses design tokens when available.
 * Integrates GradientEditor for gradient backgrounds.
 *
 * Part of fn-2-gnc.6: Build Shadow and Gradient Editors
 */

import { useState, useCallback, useEffect } from "react";
import { useAppStore } from "../../../stores/appStore";
import { GradientEditor, createDefaultGradient } from "../GradientEditor";
import type { GradientConfig } from "../../../utils/layersValue";
import { gradientToCss } from "../../../utils/layersValue";
import type { BaseSectionProps } from "./types";

type BackgroundMode = "color" | "gradient";

export function BackgroundsSection(_props: BaseSectionProps) {
  const { selectedEntry, addStyleEdit } = useAppStore();

  // Background state
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>("color");
  const [backgroundColor, setBackgroundColor] = useState("var(--primary)");
  const [backgroundGradient, setBackgroundGradient] = useState<GradientConfig>(() =>
    createDefaultGradient()
  );
  const [textColor, setTextColor] = useState("var(--text)");

  // Reset on selection change
  useEffect(() => {
    if (!selectedEntry) {
      setBackgroundMode("color");
      setBackgroundColor("var(--primary)");
      setBackgroundGradient(createDefaultGradient());
      setTextColor("var(--text)");
      return;
    }
    // TODO: Parse background from computed styles when available
  }, [selectedEntry?.radflowId]);

  // Handle background color change
  const handleBackgroundColorChange = useCallback(
    (newValue: string) => {
      const oldValue = backgroundColor;
      setBackgroundColor(newValue);

      if (selectedEntry?.source && oldValue !== newValue) {
        addStyleEdit({
          radflowId: selectedEntry.radflowId,
          componentName: selectedEntry.name,
          source: selectedEntry.source,
          property: "background",
          oldValue,
          newValue,
        });
      }
    },
    [backgroundColor, selectedEntry, addStyleEdit]
  );

  // Handle gradient change
  const handleGradientChange = useCallback(
    (newGradient: GradientConfig) => {
      const oldCss = gradientToCss(backgroundGradient);
      setBackgroundGradient(newGradient);
      const newCss = gradientToCss(newGradient);

      if (selectedEntry?.source && oldCss !== newCss) {
        addStyleEdit({
          radflowId: selectedEntry.radflowId,
          componentName: selectedEntry.name,
          source: selectedEntry.source,
          property: "background",
          oldValue: oldCss,
          newValue: newCss,
        });
      }
    },
    [backgroundGradient, selectedEntry, addStyleEdit]
  );

  // Handle text color change
  const handleTextColorChange = useCallback(
    (newValue: string) => {
      const oldValue = textColor;
      setTextColor(newValue);

      if (selectedEntry?.source && oldValue !== newValue) {
        addStyleEdit({
          radflowId: selectedEntry.radflowId,
          componentName: selectedEntry.name,
          source: selectedEntry.source,
          property: "color",
          oldValue,
          newValue,
        });
      }
    },
    [textColor, selectedEntry, addStyleEdit]
  );

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
    <div className="space-y-4">
      {/* Background */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] text-text-muted uppercase tracking-wider">
            Background
          </label>
          {/* Mode toggle */}
          <div className="flex gap-0.5 bg-background/50 rounded-md p-0.5">
            <button
              onClick={() => setBackgroundMode("color")}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                backgroundMode === "color"
                  ? "bg-primary/20 text-primary"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Color
            </button>
            <button
              onClick={() => setBackgroundMode("gradient")}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                backgroundMode === "gradient"
                  ? "bg-primary/20 text-primary"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Gradient
            </button>
          </div>
        </div>

        {backgroundMode === "color" ? (
          <div className="flex gap-2">
            <div
              className="w-8 h-8 rounded-md border border-white/10 cursor-pointer flex-shrink-0"
              style={getBackgroundPreviewStyle()}
            />
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              className="flex-1 h-8 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
            />
          </div>
        ) : (
          <GradientEditor
            value={backgroundGradient}
            onChange={handleGradientChange}
            disabled={!selectedEntry}
          />
        )}
      </div>

      {/* Text Color */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Text Color
        </label>
        <div className="flex gap-2">
          <div
            className="w-8 h-8 rounded-md border border-white/10 cursor-pointer flex-shrink-0"
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
            className="flex-1 h-8 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
          />
        </div>
      </div>
    </div>
  );
}

// Also export as ColorsSection for backward compatibility
export const ColorsSection = BackgroundsSection;

export default BackgroundsSection;
