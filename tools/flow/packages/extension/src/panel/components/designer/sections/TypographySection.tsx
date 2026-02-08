/**
 * TypographySection Component
 *
 * Controls for font family, weight, size, line height, letter spacing,
 * text alignment, decoration, transform, and color.
 *
 * Ported from Flow 0 for the browser extension.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import type { BaseSectionProps, TextAlign, TextDecoration, TextTransform } from "./types";
import type { StyleValue } from "../../../types/styleValue";
import { DogfoodBoundary } from '../../ui/DogfoodBoundary';

// Typography types
type FontSizeUnit = "px" | "rem" | "em" | "%";
type LineHeightUnit = "px" | "rem" | "em" | "" | "normal"; // "" = unitless

interface FontWeight {
  value: string;
  label: string;
}

const FONT_WEIGHTS: FontWeight[] = [
  { value: "100", label: "100 - Thin" },
  { value: "200", label: "200 - Extra Light" },
  { value: "300", label: "300 - Light" },
  { value: "400", label: "400 - Regular" },
  { value: "500", label: "500 - Medium" },
  { value: "600", label: "600 - Semi Bold" },
  { value: "700", label: "700 - Bold" },
  { value: "800", label: "800 - Extra Bold" },
  { value: "900", label: "900 - Black" },
];

// Default theme fonts (fallback if tokens not loaded)
const DEFAULT_THEME_FONTS = [
  "Inter",
  "Geist",
  "Geist Mono",
  "SF Pro",
  "system-ui",
  "monospace",
];

// Helper to format typography CSS value with unit
function formatTypographyValue(value: string, unit: string): string {
  if (unit === "normal") return "normal";
  if (unit === "") return value; // unitless
  if (!value || value === "") return "";
  return `${value}${unit}`;
}

/**
 * Parse a CSS value to extract numeric value and unit
 */
function parseCssValue(cssValue: string | undefined, defaultUnit: string = "px"): { value: string; unit: string } {
  if (!cssValue) return { value: "", unit: defaultUnit };
  const match = cssValue.match(/^(-?\d*\.?\d+)([a-z%]*)?$/i);
  if (match) {
    return { value: match[1], unit: match[2] || defaultUnit };
  }
  return { value: cssValue, unit: "" };
}

/**
 * Create a StyleValue from a value and unit
 */
function createStyleValue(value: string, unit: string): StyleValue {
  if (unit === "" || unit === "number") {
    // Unitless number
    return { type: "unit", unit: "number", value: parseFloat(value) || 0 };
  }
  if (unit === "normal" || value === "normal") {
    return { type: "keyword", value: "normal" };
  }
  return { type: "unit", unit: unit as any, value: parseFloat(value) || 0 };
}

interface TypographyViolation {
  property: string;
  message: string;
}

export function TypographySection(props: BaseSectionProps) {
  const { onStyleChange, initialStyles } = props;

  // Parse initial values
  const initialFontSize = parseCssValue(initialStyles?.fontSize, "px");
  const initialLineHeight = parseCssValue(initialStyles?.lineHeight, "");
  const initialLetterSpacing = parseCssValue(initialStyles?.letterSpacing, "em");

  // Typography state
  const [fontFamily, setFontFamily] = useState(initialStyles?.fontFamily || "Inter");
  const [fontWeight, setFontWeight] = useState(initialStyles?.fontWeight || "400");
  const [fontSize, setFontSize] = useState({ value: initialFontSize.value || "16", unit: (initialFontSize.unit || "px") as FontSizeUnit });
  const [lineHeight, setLineHeight] = useState({ value: initialLineHeight.value || "1.5", unit: (initialLineHeight.unit || "") as LineHeightUnit });
  const [letterSpacing, setLetterSpacing] = useState({ value: initialLetterSpacing.value || "0", unit: initialLetterSpacing.unit || "em" });
  const [textAlign, setTextAlign] = useState<TextAlign>((initialStyles?.textAlign as TextAlign) || "left");
  const [textDecoration, setTextDecoration] = useState<TextDecoration>((initialStyles?.textDecoration as TextDecoration) || "none");
  const [textTransform, setTextTransform] = useState<TextTransform>((initialStyles?.textTransform as TextTransform) || "none");
  const [color, setColor] = useState(initialStyles?.color || "var(--text)");

  // Update state when initialStyles changes
  useEffect(() => {
    if (initialStyles) {
      const newFontSize = parseCssValue(initialStyles.fontSize, "px");
      const newLineHeight = parseCssValue(initialStyles.lineHeight, "");
      const newLetterSpacing = parseCssValue(initialStyles.letterSpacing, "em");

      setFontFamily(initialStyles.fontFamily || "Inter");
      setFontWeight(initialStyles.fontWeight || "400");
      setFontSize({ value: newFontSize.value || "16", unit: (newFontSize.unit || "px") as FontSizeUnit });
      setLineHeight({ value: newLineHeight.value || "1.5", unit: (newLineHeight.unit || "") as LineHeightUnit });
      setLetterSpacing({ value: newLetterSpacing.value || "0", unit: newLetterSpacing.unit || "em" });
      setTextAlign((initialStyles.textAlign as TextAlign) || "left");
      setTextDecoration((initialStyles.textDecoration as TextDecoration) || "none");
      setTextTransform((initialStyles.textTransform as TextTransform) || "none");
      setColor(initialStyles.color || "var(--text)");
    }
  }, [initialStyles]);

  // Default font size tokens
  const fontSizeTokens = useMemo(() => ["10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "40", "48", "56", "64", "72"], []);

  // Compute violations
  const violations = useMemo(() => {
    const result: TypographyViolation[] = [];

    // Check if color is a token
    if (color && !color.startsWith("var(")) {
      result.push({
        property: "color",
        message: "Color should use a design token (var(--...))",
      });
    }

    return result;
  }, [color]);

  // Handlers
  const handleFontFamilyChange = useCallback((newValue: string) => {
    setFontFamily(newValue);
    if (onStyleChange) {
      onStyleChange("fontFamily", { type: "fontFamily", value: [newValue] });
    }
  }, [onStyleChange]);

  const handleFontWeightChange = useCallback((newValue: string) => {
    setFontWeight(newValue);
    if (onStyleChange) {
      onStyleChange("fontWeight", { type: "unit", unit: "number", value: parseInt(newValue, 10) });
    }
  }, [onStyleChange]);

  const handleFontSizeValueChange = useCallback((value: string) => {
    setFontSize(prev => {
      const newSize = { ...prev, value };
      if (onStyleChange && value) {
        onStyleChange("fontSize", createStyleValue(value, prev.unit));
      }
      return newSize;
    });
  }, [onStyleChange]);

  const handleFontSizeUnitChange = useCallback((unit: FontSizeUnit) => {
    setFontSize(prev => {
      const newSize = { ...prev, unit };
      if (onStyleChange && prev.value) {
        onStyleChange("fontSize", createStyleValue(prev.value, unit));
      }
      return newSize;
    });
  }, [onStyleChange]);

  const handleLineHeightValueChange = useCallback((value: string) => {
    setLineHeight(prev => {
      const newHeight = { ...prev, value };
      if (onStyleChange && value) {
        onStyleChange("lineHeight", createStyleValue(value, prev.unit));
      }
      return newHeight;
    });
  }, [onStyleChange]);

  const handleLineHeightUnitChange = useCallback((unit: LineHeightUnit) => {
    setLineHeight(prev => {
      const newHeight = { ...prev, unit };
      if (onStyleChange && prev.value) {
        onStyleChange("lineHeight", createStyleValue(prev.value, unit));
      }
      return newHeight;
    });
  }, [onStyleChange]);

  const handleLetterSpacingValueChange = useCallback((value: string) => {
    setLetterSpacing(prev => {
      const newSpacing = { ...prev, value };
      if (onStyleChange && value) {
        onStyleChange("letterSpacing", createStyleValue(value, prev.unit));
      }
      return newSpacing;
    });
  }, [onStyleChange]);

  const handleLetterSpacingUnitChange = useCallback((unit: string) => {
    setLetterSpacing(prev => {
      const newSpacing = { ...prev, unit };
      if (onStyleChange && prev.value) {
        onStyleChange("letterSpacing", createStyleValue(prev.value, unit));
      }
      return newSpacing;
    });
  }, [onStyleChange]);

  const handleTextAlignChange = useCallback((newValue: TextAlign) => {
    setTextAlign(newValue);
    if (onStyleChange) {
      onStyleChange("textAlign", { type: "keyword", value: newValue });
    }
  }, [onStyleChange]);

  const handleTextDecorationChange = useCallback((newValue: TextDecoration) => {
    setTextDecoration(newValue);
    if (onStyleChange) {
      onStyleChange("textDecoration", { type: "keyword", value: newValue });
    }
  }, [onStyleChange]);

  const handleTextTransformChange = useCallback((newValue: TextTransform) => {
    setTextTransform(newValue);
    if (onStyleChange) {
      onStyleChange("textTransform", { type: "keyword", value: newValue });
    }
  }, [onStyleChange]);

  const handleColorChange = useCallback((newValue: string) => {
    setColor(newValue);
    if (onStyleChange) {
      // Check if it's a var() reference
      if (newValue.startsWith("var(")) {
        const varName = newValue.replace(/^var\(--/, "").replace(/\)$/, "");
        onStyleChange("color", { type: "var", value: varName });
      } else {
        onStyleChange("color", { type: "unparsed", value: newValue });
      }
    }
  }, [onStyleChange]);

  // Text align icons
  const alignIcons: { value: TextAlign; icon: React.ReactNode }[] = [
    {
      value: "left",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="15" y2="12" />
          <line x1="3" y1="18" x2="18" y2="18" />
        </svg>
      ),
    },
    {
      value: "center",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="6" y1="12" x2="18" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      ),
    },
    {
      value: "right",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="9" y1="12" x2="21" y2="12" />
          <line x1="6" y1="18" x2="21" y2="18" />
        </svg>
      ),
    },
    {
      value: "justify",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      ),
    },
  ];

  // Text decoration icons
  const decorationOptions: { value: TextDecoration; icon: React.ReactNode; label: string }[] = [
    {
      value: "none",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      label: "None",
    },
    {
      value: "underline",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 3v7a6 6 0 0 0 12 0V3" />
          <line x1="4" y1="21" x2="20" y2="21" />
        </svg>
      ),
      label: "Underline",
    },
    {
      value: "line-through",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 7a5.998 5.998 0 0 0-6-5H7v10" />
          <path d="M3 12h18" />
          <path d="M7 17v2a3 3 0 0 0 6 0v-2" />
        </svg>
      ),
      label: "Strikethrough",
    },
    {
      value: "overline",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="3" x2="20" y2="3" />
          <path d="M6 21v-7a6 6 0 0 1 12 0v7" />
        </svg>
      ),
      label: "Overline",
    },
  ];

  // Text transform options
  const transformOptions: { value: TextTransform; label: string }[] = [
    { value: "none", label: "Aa" },
    { value: "uppercase", label: "AA" },
    { value: "lowercase", label: "aa" },
    { value: "capitalize", label: "Aa" },
  ];

  return (
    <DogfoodBoundary name="TypographySection" file="designer/sections/TypographySection.tsx" category="designer">
    <div className="space-y-3">
      {/* Font Family */}
      <div>
        <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
          Font
        </label>
        <select
          value={fontFamily}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
          className="w-full h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200"
        >
          <optgroup label="Theme Fonts">
            {DEFAULT_THEME_FONTS.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </optgroup>
          <optgroup label="System">
            <option value="Arial, sans-serif">Arial</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Times New Roman, serif">Times New Roman</option>
            <option value="Courier New, monospace">Courier New</option>
            <option value="Verdana, sans-serif">Verdana</option>
          </optgroup>
        </select>
      </div>

      {/* Font Weight */}
      <div>
        <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
          Weight
        </label>
        <select
          value={fontWeight}
          onChange={(e) => handleFontWeightChange(e.target.value)}
          className="w-full h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200"
        >
          {FONT_WEIGHTS.map((weight) => (
            <option key={weight.value} value={weight.value}>{weight.label}</option>
          ))}
        </select>
      </div>

      {/* Size and Line Height Row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Font Size */}
        <div>
          <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
            Size
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={fontSize.value}
              onChange={(e) => handleFontSizeValueChange(e.target.value)}
              className="flex-1 h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200 font-mono min-w-0"
              placeholder="16"
            />
            <select
              value={fontSize.unit}
              onChange={(e) => handleFontSizeUnitChange(e.target.value as FontSizeUnit)}
              className="h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-1 text-[10px] text-neutral-400 w-12"
            >
              <option value="px">PX</option>
              <option value="rem">REM</option>
              <option value="em">EM</option>
              <option value="%">%</option>
            </select>
          </div>
        </div>

        {/* Line Height */}
        <div>
          <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
            Height
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={lineHeight.value}
              onChange={(e) => handleLineHeightValueChange(e.target.value)}
              className="flex-1 h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200 font-mono min-w-0"
              placeholder="1.5"
            />
            <select
              value={lineHeight.unit}
              onChange={(e) => handleLineHeightUnitChange(e.target.value as LineHeightUnit)}
              className="h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-1 text-[10px] text-neutral-400 w-12"
            >
              <option value="">-</option>
              <option value="px">PX</option>
              <option value="rem">REM</option>
              <option value="em">EM</option>
              <option value="normal">AUTO</option>
            </select>
          </div>
        </div>
      </div>

      {/* Letter Spacing */}
      <div>
        <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
          Spacing
        </label>
        <div className="flex gap-1">
          <input
            type="text"
            value={letterSpacing.value}
            onChange={(e) => handleLetterSpacingValueChange(e.target.value)}
            className="flex-1 h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200 font-mono"
            placeholder="0"
          />
          <select
            value={letterSpacing.unit}
            onChange={(e) => handleLetterSpacingUnitChange(e.target.value)}
            className="h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-1 text-[10px] text-neutral-400 w-12"
          >
            <option value="em">EM</option>
            <option value="px">PX</option>
            <option value="rem">REM</option>
          </select>
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
          Color
        </label>
        <div className="flex gap-2">
          <div
            className="w-8 h-7 rounded-md border border-neutral-700 cursor-pointer shrink-0"
            style={{ backgroundColor: color.startsWith("var") ? "var(--text)" : color }}
          />
          <input
            type="text"
            value={color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="flex-1 h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200 font-mono"
            placeholder="var(--text)"
          />
        </div>
      </div>

      {/* Text Align */}
      <div>
        <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
          Align
        </label>
        <div className="flex gap-1">
          {alignIcons.map((item) => (
            <button
              key={item.value}
              onClick={() => handleTextAlignChange(item.value)}
              className={`flex-1 py-1.5 flex items-center justify-center rounded-md transition-colors ${
                textAlign === item.value
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 border border-transparent"
              }`}
              title={item.value.charAt(0).toUpperCase() + item.value.slice(1)}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Text Decoration */}
      <div>
        <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
          Decoration
        </label>
        <div className="flex gap-1">
          {decorationOptions.map((item) => (
            <button
              key={item.value}
              onClick={() => handleTextDecorationChange(item.value)}
              className={`flex-1 py-1.5 flex items-center justify-center rounded-md transition-colors ${
                textDecoration === item.value
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 border border-transparent"
              }`}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Text Transform */}
      <div>
        <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
          Case
        </label>
        <div className="flex gap-1">
          {transformOptions.map((item, index) => (
            <button
              key={item.value}
              onClick={() => handleTextTransformChange(item.value)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                textTransform === item.value
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 border border-transparent"
              }`}
              title={item.value === "none" ? "None" : item.value.charAt(0).toUpperCase() + item.value.slice(1)}
            >
              {index === 0 ? "-" : item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Violation Warnings */}
      {violations.length > 0 && (
        <div className="space-y-1.5">
          {violations.map((violation, index) => (
            <div
              key={index}
              className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-md p-2"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-amber-400 mt-0.5 shrink-0"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-[10px] text-amber-400/80">{violation.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
    </DogfoodBoundary>
  );
}

export default TypographySection;
