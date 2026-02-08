/**
 * BordersSection Component
 *
 * Controls for border style, color, width, and radius.
 * Supports linked/unlinked editing of sides and corners.
 *
 * Ported from Flow 0 for the browser extension.
 */

import { useState, useCallback, useEffect } from "react";
import type { BaseSectionProps, BorderStyle } from "./types";
import type { StyleValue } from "../../../types/styleValue";
import { DogfoodBoundary } from '../../ui/DogfoodBoundary';

type BorderRadiusUnit = "px" | "rem" | "%";

interface BorderWidthValues {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

interface BorderRadiusValues {
  topLeft: string;
  topRight: string;
  bottomRight: string;
  bottomLeft: string;
}

/**
 * Parse a CSS border width value to extract numeric value
 */
function parseBorderWidth(cssValue: string | undefined): string {
  if (!cssValue) return "1";
  const match = cssValue.match(/^(\d*\.?\d+)/);
  return match ? match[1] : "1";
}

/**
 * Parse a CSS border radius value to extract numeric value and unit
 */
function parseBorderRadius(cssValue: string | undefined): { value: string; unit: BorderRadiusUnit } {
  if (!cssValue) return { value: "4", unit: "px" };
  const match = cssValue.match(/^(\d*\.?\d+)([a-z%]*)?$/i);
  if (match) {
    return { value: match[1], unit: (match[2] || "px") as BorderRadiusUnit };
  }
  return { value: "4", unit: "px" };
}

export function BordersSection(props: BaseSectionProps) {
  const { onStyleChange, initialStyles } = props;

  // Parse initial border radius to get unit
  const initialRadiusParsed = parseBorderRadius(initialStyles?.borderRadius);

  // Border state
  const [borderStyle, setBorderStyle] = useState<BorderStyle>((initialStyles?.borderStyle as BorderStyle) || "solid");
  const [borderColor, setBorderColor] = useState(initialStyles?.borderColor || "#333333");

  // Border width state
  const [widthLinked, setWidthLinked] = useState(true);
  const [borderWidth, setBorderWidth] = useState<BorderWidthValues>({
    top: parseBorderWidth(initialStyles?.borderTopWidth || initialStyles?.borderWidth),
    right: parseBorderWidth(initialStyles?.borderRightWidth || initialStyles?.borderWidth),
    bottom: parseBorderWidth(initialStyles?.borderBottomWidth || initialStyles?.borderWidth),
    left: parseBorderWidth(initialStyles?.borderLeftWidth || initialStyles?.borderWidth),
  });

  // Border radius state
  const [radiusLinked, setRadiusLinked] = useState(true);
  const [borderRadius, setBorderRadius] = useState<BorderRadiusValues>({
    topLeft: parseBorderRadius(initialStyles?.borderTopLeftRadius || initialStyles?.borderRadius).value,
    topRight: parseBorderRadius(initialStyles?.borderTopRightRadius || initialStyles?.borderRadius).value,
    bottomRight: parseBorderRadius(initialStyles?.borderBottomRightRadius || initialStyles?.borderRadius).value,
    bottomLeft: parseBorderRadius(initialStyles?.borderBottomLeftRadius || initialStyles?.borderRadius).value,
  });
  const [radiusUnit, setRadiusUnit] = useState<BorderRadiusUnit>(initialRadiusParsed.unit);

  // Update state when initialStyles changes
  useEffect(() => {
    if (initialStyles) {
      const newRadiusParsed = parseBorderRadius(initialStyles.borderRadius);

      setBorderStyle((initialStyles.borderStyle as BorderStyle) || "solid");
      setBorderColor(initialStyles.borderColor || "#333333");
      setBorderWidth({
        top: parseBorderWidth(initialStyles.borderTopWidth || initialStyles.borderWidth),
        right: parseBorderWidth(initialStyles.borderRightWidth || initialStyles.borderWidth),
        bottom: parseBorderWidth(initialStyles.borderBottomWidth || initialStyles.borderWidth),
        left: parseBorderWidth(initialStyles.borderLeftWidth || initialStyles.borderWidth),
      });
      setBorderRadius({
        topLeft: parseBorderRadius(initialStyles.borderTopLeftRadius || initialStyles.borderRadius).value,
        topRight: parseBorderRadius(initialStyles.borderTopRightRadius || initialStyles.borderRadius).value,
        bottomRight: parseBorderRadius(initialStyles.borderBottomRightRadius || initialStyles.borderRadius).value,
        bottomLeft: parseBorderRadius(initialStyles.borderBottomLeftRadius || initialStyles.borderRadius).value,
      });
      setRadiusUnit(newRadiusParsed.unit);
    }
  }, [initialStyles]);

  // Handler: Border style change
  const handleStyleChange = useCallback((newStyle: BorderStyle) => {
    setBorderStyle(newStyle);
    if (onStyleChange) {
      onStyleChange("borderStyle", { type: "keyword", value: newStyle });
    }
  }, [onStyleChange]);

  // Handler: Border color change
  const handleColorChange = useCallback((newColor: string) => {
    setBorderColor(newColor);
    if (onStyleChange) {
      onStyleChange("borderColor", { type: "unparsed", value: newColor });
    }
  }, [onStyleChange]);

  // Handler: Border width change
  const handleWidthChange = useCallback((side: keyof BorderWidthValues, value: string) => {
    if (value !== "") {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) return;
    }

    if (widthLinked) {
      const newWidths = { top: value, right: value, bottom: value, left: value };
      setBorderWidth(newWidths);
      if (onStyleChange) {
        onStyleChange("borderWidth", { type: "unit", unit: "px", value: parseFloat(value) || 0 });
      }
    } else {
      const newWidths = { ...borderWidth, [side]: value };
      setBorderWidth(newWidths);
      if (onStyleChange) {
        const propertyMap: Record<keyof BorderWidthValues, string> = {
          top: "borderTopWidth",
          right: "borderRightWidth",
          bottom: "borderBottomWidth",
          left: "borderLeftWidth",
        };
        onStyleChange(propertyMap[side], { type: "unit", unit: "px", value: parseFloat(value) || 0 });
      }
    }
  }, [borderWidth, widthLinked, onStyleChange]);

  // Handler: Border radius change
  const handleRadiusChange = useCallback((corner: keyof BorderRadiusValues, value: string) => {
    if (value !== "") {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) return;
    }

    if (radiusLinked) {
      const newRadius = { topLeft: value, topRight: value, bottomRight: value, bottomLeft: value };
      setBorderRadius(newRadius);
      if (onStyleChange) {
        onStyleChange("borderRadius", { type: "unit", unit: radiusUnit as any, value: parseFloat(value) || 0 });
      }
    } else {
      const newRadius = { ...borderRadius, [corner]: value };
      setBorderRadius(newRadius);
      if (onStyleChange) {
        const propertyMap: Record<keyof BorderRadiusValues, string> = {
          topLeft: "borderTopLeftRadius",
          topRight: "borderTopRightRadius",
          bottomRight: "borderBottomRightRadius",
          bottomLeft: "borderBottomLeftRadius",
        };
        onStyleChange(propertyMap[corner], { type: "unit", unit: radiusUnit as any, value: parseFloat(value) || 0 });
      }
    }
  }, [borderRadius, radiusLinked, radiusUnit, onStyleChange]);

  // Handler: Radius unit change
  const handleRadiusUnitChange = useCallback((unit: BorderRadiusUnit) => {
    setRadiusUnit(unit);
    // Re-emit current radius values with new unit
    if (onStyleChange && radiusLinked) {
      onStyleChange("borderRadius", { type: "unit", unit: unit as any, value: parseFloat(borderRadius.topLeft) || 0 });
    }
  }, [onStyleChange, radiusLinked, borderRadius.topLeft]);

  // Toggle width linked mode
  const toggleWidthLinked = useCallback(() => {
    if (!widthLinked) {
      const uniformValue = borderWidth.top;
      setBorderWidth({
        top: uniformValue,
        right: uniformValue,
        bottom: uniformValue,
        left: uniformValue,
      });
    }
    setWidthLinked(!widthLinked);
  }, [widthLinked, borderWidth.top]);

  // Toggle radius linked mode
  const toggleRadiusLinked = useCallback(() => {
    if (!radiusLinked) {
      const uniformValue = borderRadius.topLeft;
      setBorderRadius({
        topLeft: uniformValue,
        topRight: uniformValue,
        bottomRight: uniformValue,
        bottomLeft: uniformValue,
      });
    }
    setRadiusLinked(!radiusLinked);
  }, [radiusLinked, borderRadius.topLeft]);

  // Border style options with icons
  const styleOptions: { value: BorderStyle; icon: React.ReactNode; label: string }[] = [
    {
      value: "none",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="4" x2="20" y2="20" />
          <line x1="20" y1="4" x2="4" y2="20" />
        </svg>
      ),
      label: "None",
    },
    {
      value: "solid",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      ),
      label: "Solid",
    },
    {
      value: "dashed",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2">
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      ),
      label: "Dashed",
    },
    {
      value: "dotted",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="1 3" strokeLinecap="round">
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      ),
      label: "Dotted",
    },
    {
      value: "double",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="2" y1="10" x2="22" y2="10" />
          <line x1="2" y1="14" x2="22" y2="14" />
        </svg>
      ),
      label: "Double",
    },
  ];

  // Link icon SVG
  const LinkIcon = ({ linked }: { linked: boolean }) => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={linked ? "text-blue-400" : "text-neutral-400"}
    >
      {linked ? (
        <>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </>
      ) : (
        <>
          <path d="M18.84 12.25l1.7-1.7a5 5 0 0 0-7.08-7.08l-1.7 1.7" />
          <path d="M5.16 11.75l-1.7 1.7a5 5 0 0 0 7.08 7.08l1.7-1.7" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </>
      )}
    </svg>
  );

  return (
    <DogfoodBoundary name="BordersSection" file="designer/sections/BordersSection.tsx" category="designer">
    <div className="space-y-4">
      {/* Border Style */}
      <div>
        <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
          Style
        </label>
        <div className="flex gap-1">
          {styleOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStyleChange(option.value)}
              className={`flex-1 py-1.5 flex items-center justify-center rounded-md transition-colors ${
                borderStyle === option.value
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 border border-transparent"
              }`}
              title={option.label}
            >
              {option.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Border Color */}
      <div>
        <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
          Color
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={borderColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-8 h-8 rounded border border-neutral-700 cursor-pointer"
          />
          <input
            type="text"
            value={borderColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="flex-1 h-8 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200 font-mono"
          />
        </div>
      </div>

      {/* Border Width Section */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
            Width
          </label>
          <button
            onClick={toggleWidthLinked}
            className={`p-1 rounded hover:bg-neutral-800/50 transition-colors ${
              widthLinked ? "text-blue-400" : "text-neutral-400"
            }`}
            title={widthLinked ? "Unlink sides" : "Link all sides"}
          >
            <LinkIcon linked={widthLinked} />
          </button>
        </div>

        {widthLinked ? (
          <div className="flex gap-1">
            <input
              type="text"
              value={borderWidth.top}
              onChange={(e) => handleWidthChange("top", e.target.value)}
              className="flex-1 h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200 font-mono"
              placeholder="1"
            />
            <span className="h-7 flex items-center px-2 text-[10px] text-neutral-400 bg-neutral-800/30 rounded-md">
              PX
            </span>
          </div>
        ) : (
          <div className="relative w-full aspect-[4/3] max-w-[160px] mx-auto">
            <div className="absolute inset-4 border border-dashed border-neutral-700 rounded" />

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14">
              <input
                type="text"
                value={borderWidth.top}
                onChange={(e) => handleWidthChange("top", e.target.value)}
                className="w-full h-6 bg-neutral-800/50 border border-neutral-700 rounded text-center text-[10px] text-neutral-200 font-mono"
                placeholder="0"
              />
            </div>

            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-14">
              <input
                type="text"
                value={borderWidth.right}
                onChange={(e) => handleWidthChange("right", e.target.value)}
                className="w-full h-6 bg-neutral-800/50 border border-neutral-700 rounded text-center text-[10px] text-neutral-200 font-mono"
                placeholder="0"
              />
            </div>

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14">
              <input
                type="text"
                value={borderWidth.bottom}
                onChange={(e) => handleWidthChange("bottom", e.target.value)}
                className="w-full h-6 bg-neutral-800/50 border border-neutral-700 rounded text-center text-[10px] text-neutral-200 font-mono"
                placeholder="0"
              />
            </div>

            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-14">
              <input
                type="text"
                value={borderWidth.left}
                onChange={(e) => handleWidthChange("left", e.target.value)}
                className="w-full h-6 bg-neutral-800/50 border border-neutral-700 rounded text-center text-[10px] text-neutral-200 font-mono"
                placeholder="0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Border Radius Section */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] text-neutral-400 uppercase tracking-wider">
            Radius
          </label>
          <button
            onClick={toggleRadiusLinked}
            className={`p-1 rounded hover:bg-neutral-800/50 transition-colors ${
              radiusLinked ? "text-blue-400" : "text-neutral-400"
            }`}
            title={radiusLinked ? "Unlink corners" : "Link all corners"}
          >
            <LinkIcon linked={radiusLinked} />
          </button>
        </div>

        {radiusLinked ? (
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={parseFloat(borderRadius.topLeft) || 0}
                onChange={(e) => handleRadiusChange("topLeft", e.target.value)}
                className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-neutral-700/50"
              />
              <div className="flex gap-1">
                <input
                  type="text"
                  value={borderRadius.topLeft}
                  onChange={(e) => handleRadiusChange("topLeft", e.target.value)}
                  className="w-12 h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200 font-mono text-center"
                  placeholder="0"
                />
                <select
                  value={radiusUnit}
                  onChange={(e) => handleRadiusUnitChange(e.target.value as BorderRadiusUnit)}
                  className="h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-1 text-[10px] text-neutral-400 w-12"
                >
                  <option value="px">PX</option>
                  <option value="rem">REM</option>
                  <option value="%">%</option>
                </select>
              </div>
            </div>

            <div className="flex justify-center">
              <div
                className="w-16 h-12 border-2 border-neutral-500 bg-neutral-800/50"
                style={{
                  borderRadius: `${borderRadius.topLeft}${radiusUnit}`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative w-full aspect-[4/3] max-w-[160px] mx-auto">
              <div
                className="absolute inset-6 border-2 border-neutral-500 bg-neutral-800/50"
                style={{
                  borderTopLeftRadius: `${borderRadius.topLeft}${radiusUnit}`,
                  borderTopRightRadius: `${borderRadius.topRight}${radiusUnit}`,
                  borderBottomRightRadius: `${borderRadius.bottomRight}${radiusUnit}`,
                  borderBottomLeftRadius: `${borderRadius.bottomLeft}${radiusUnit}`,
                }}
              />

              <div className="absolute top-0 left-0 w-12">
                <input
                  type="text"
                  value={borderRadius.topLeft}
                  onChange={(e) => handleRadiusChange("topLeft", e.target.value)}
                  className="w-full h-6 bg-neutral-800/50 border border-neutral-700 rounded text-center text-[10px] text-neutral-200 font-mono"
                  placeholder="0"
                />
              </div>

              <div className="absolute top-0 right-0 w-12">
                <input
                  type="text"
                  value={borderRadius.topRight}
                  onChange={(e) => handleRadiusChange("topRight", e.target.value)}
                  className="w-full h-6 bg-neutral-800/50 border border-neutral-700 rounded text-center text-[10px] text-neutral-200 font-mono"
                  placeholder="0"
                />
              </div>

              <div className="absolute bottom-0 right-0 w-12">
                <input
                  type="text"
                  value={borderRadius.bottomRight}
                  onChange={(e) => handleRadiusChange("bottomRight", e.target.value)}
                  className="w-full h-6 bg-neutral-800/50 border border-neutral-700 rounded text-center text-[10px] text-neutral-200 font-mono"
                  placeholder="0"
                />
              </div>

              <div className="absolute bottom-0 left-0 w-12">
                <input
                  type="text"
                  value={borderRadius.bottomLeft}
                  onChange={(e) => handleRadiusChange("bottomLeft", e.target.value)}
                  className="w-full h-6 bg-neutral-800/50 border border-neutral-700 rounded text-center text-[10px] text-neutral-200 font-mono"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <select
                value={radiusUnit}
                onChange={(e) => handleRadiusUnitChange(e.target.value as BorderRadiusUnit)}
                className="h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-[10px] text-neutral-400"
              >
                <option value="px">PX</option>
                <option value="rem">REM</option>
                <option value="%">%</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
    </DogfoodBoundary>
  );
}

export default BordersSection;
