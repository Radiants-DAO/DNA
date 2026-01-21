/**
 * TypographySection Component
 *
 * Controls for font family, weight, size, line height, letter spacing,
 * text alignment, decoration, transform, and color.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAppStore } from "../../../stores/appStore";
import type { BaseSectionProps, TextAlign, TextDecoration, TextTransform } from "./types";

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

// Default font size tokens (fallback if tokens not loaded)
const DEFAULT_FONT_SIZE_TOKENS = ["10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "40", "48", "56", "64", "72"];

// Debounce helper for direct write mode
function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;
}

// Helper to check if a color value is a design token
function isTokenColor(value: string): boolean {
  if (!value) return true; // Empty is valid
  return value.startsWith("var(--") || value.startsWith("var(");
}

// Helper to check if a font value is valid
function isValidFontFamily(value: string, themeFonts: string[]): boolean {
  if (!value) return true;
  // Split by comma and check each font
  const fonts = value.split(",").map(f => f.trim().replace(/["']/g, ""));
  return fonts.some(font =>
    themeFonts.some(themeFont =>
      font.toLowerCase() === themeFont.toLowerCase()
    )
  );
}

// Helper to check if a font size uses a token
function isTokenFontSize(value: string, _unit: string, tokenSizes: string[]): boolean {
  if (!value) return true;
  // If using var(), it's a token
  if (value.startsWith("var(")) return true;
  // Check numeric value against known tokens
  const numericValue = parseFloat(value);
  return tokenSizes.includes(String(numericValue)) || tokenSizes.includes(value);
}

// Helper to format typography CSS value with unit
function formatTypographyValue(value: string, unit: string): string {
  if (unit === "normal") return "normal";
  if (unit === "") return value; // unitless
  if (!value || value === "") return "";
  return `${value}${unit}`;
}

// Generate CSS for typography changes
function generateTypographyCss(
  fontFamily: string,
  fontWeight: string,
  fontSize: { value: string; unit: FontSizeUnit },
  lineHeight: { value: string; unit: LineHeightUnit },
  letterSpacing: { value: string; unit: string },
  textAlign: TextAlign,
  textDecoration: TextDecoration,
  textTransform: TextTransform,
  color: string
): string {
  const lines: string[] = [];

  if (fontFamily) lines.push(`font-family: ${fontFamily};`);
  if (fontWeight) lines.push(`font-weight: ${fontWeight};`);

  const formattedSize = formatTypographyValue(fontSize.value, fontSize.unit);
  if (formattedSize) lines.push(`font-size: ${formattedSize};`);

  const formattedLineHeight = formatTypographyValue(lineHeight.value, lineHeight.unit);
  if (formattedLineHeight) lines.push(`line-height: ${formattedLineHeight};`);

  const formattedSpacing = formatTypographyValue(letterSpacing.value, letterSpacing.unit);
  if (formattedSpacing) lines.push(`letter-spacing: ${formattedSpacing};`);

  if (textAlign !== "left") lines.push(`text-align: ${textAlign};`);
  if (textDecoration !== "none") lines.push(`text-decoration: ${textDecoration};`);
  if (textTransform !== "none") lines.push(`text-transform: ${textTransform};`);
  if (color) lines.push(`color: ${color};`);

  return lines.join("\n  ");
}

interface TypographyViolation {
  property: string;
  message: string;
}

export function TypographySection(_props: BaseSectionProps) {
  // App state integration (directWriteMode removed per fn-9)
  const { selectedEntry, addStyleEdit, tokens } = useAppStore();

  // Typography state
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontWeight, setFontWeight] = useState("400");
  const [fontSize, setFontSize] = useState({ value: "16", unit: "px" as FontSizeUnit });
  const [lineHeight, setLineHeight] = useState({ value: "1.5", unit: "" as LineHeightUnit });
  const [letterSpacing, setLetterSpacing] = useState({ value: "0", unit: "em" });
  const [textAlign, setTextAlign] = useState<TextAlign>("left");
  const [textDecoration, setTextDecoration] = useState<TextDecoration>("none");
  const [textTransform, setTextTransform] = useState<TextTransform>("none");
  const [color, setColor] = useState("var(--text)");

  // Extract theme fonts from tokens (with fallback)
  const themeFonts = useMemo((): string[] => {
    if (!tokens?.public) {
      return DEFAULT_THEME_FONTS;
    }
    // Extract font family names from token entries (keys starting with font-family- or font-)
    const fontEntries = Object.entries(tokens.public)
      .filter(([key]) => key.startsWith("font-family-") || key.startsWith("font-"))
      .map(([key]) => {
        // Extract the font name from the key
        const name = key.replace(/^font-family-/, "").replace(/^font-/, "");
        return name.charAt(0).toUpperCase() + name.slice(1); // Capitalize
      });
    return fontEntries.length > 0 ? fontEntries : DEFAULT_THEME_FONTS;
  }, [tokens?.public]);

  // Extract font size tokens from tokens (with fallback)
  const fontSizeTokens = useMemo((): string[] => {
    if (!tokens?.public) {
      return DEFAULT_FONT_SIZE_TOKENS;
    }
    // Extract numeric values from text-* tokens
    const sizeEntries = Object.entries(tokens.public)
      .filter(([key]) => key.startsWith("text-") && !key.includes("color"))
      .map(([, value]) => {
        if (!value) return null;
        // Extract numeric value from clamp() or direct value
        const match = value.match(/(\d+(?:\.\d+)?)/);
        return match ? match[1] : null;
      })
      .filter((v): v is string => v !== null);
    return sizeEntries.length > 0 ? sizeEntries : DEFAULT_FONT_SIZE_TOKENS;
  }, [tokens?.public]);

  // Sync local state with selected element (when selection changes)
  useEffect(() => {
    if (!selectedEntry) {
      // Reset to defaults when no selection
      setFontFamily("Inter");
      setFontWeight("400");
      setFontSize({ value: "16", unit: "px" });
      setLineHeight({ value: "1.5", unit: "" });
      setLetterSpacing({ value: "0", unit: "em" });
      setTextAlign("left");
      setTextDecoration("none");
      setTextTransform("none");
      setColor("var(--text)");
      return;
    }
    // Future: Read computed styles from preview iframe when available
  }, [selectedEntry?.radflowId]);

  // Compute violations using useMemo (more efficient than useEffect + setState)
  const violations = useMemo(() => {
    const result: TypographyViolation[] = [];

    // Check font size against tokens
    if (fontSize.value && !isTokenFontSize(fontSize.value, fontSize.unit, fontSizeTokens)) {
      const suggestions = fontSizeTokens.slice(0, 3).join(", ");
      result.push({
        property: "font-size",
        message: `Font size "${fontSize.value}${fontSize.unit}" is not a design token. Try: ${suggestions}`,
      });
    }

    // Check if font family is in theme
    if (fontFamily && !isValidFontFamily(fontFamily, themeFonts)) {
      result.push({
        property: "font-family",
        message: `Font "${fontFamily}" is not in the theme`,
      });
    }

    // Check if color is a token (more complete check)
    if (color && !isTokenColor(color)) {
      result.push({
        property: "color",
        message: "Color should use a design token (var(--...))",
      });
    }

    return result;
  }, [fontSize, fontFamily, color, fontSizeTokens, themeFonts]);

  // Core style edit function (used by debounced version in direct mode)
  const applyStyleEditImmediate = useCallback((property: string, oldValue: string, newValue: string) => {
    if (!selectedEntry?.source) return;

    addStyleEdit({
      radflowId: selectedEntry.radflowId,
      componentName: selectedEntry.name,
      source: selectedEntry.source,
      property,
      oldValue,
      newValue,
    });
  }, [selectedEntry, addStyleEdit]);

  // Debounced version for direct write mode (500ms delay per spec)
  const _applyStyleEditDebounced = useDebouncedCallback(applyStyleEditImmediate, 500);

  // Apply style edit to app state (clipboard mode only per fn-9)
  const applyStyleEdit = useCallback((property: string, oldValue: string, newValue: string) => {
    if (!selectedEntry?.source) return;

    // Immediate in clipboard mode
    applyStyleEditImmediate(property, oldValue, newValue);
    // Copy CSS to clipboard
    const css = generateTypographyCss(
      fontFamily, fontWeight, fontSize, lineHeight, letterSpacing,
      textAlign, textDecoration, textTransform, color
    );
    navigator.clipboard.writeText(css).catch(() => {});
  }, [selectedEntry, applyStyleEditImmediate, fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, textAlign, textDecoration, textTransform, color]);

  // Handlers with style edit tracking
  const handleFontFamilyChange = useCallback((newValue: string) => {
    const oldValue = fontFamily;
    setFontFamily(newValue);
    if (oldValue !== newValue) {
      applyStyleEdit("font-family", oldValue, newValue);
    }
  }, [fontFamily, applyStyleEdit]);

  const handleFontWeightChange = useCallback((newValue: string) => {
    const oldValue = fontWeight;
    setFontWeight(newValue);
    if (oldValue !== newValue) {
      applyStyleEdit("font-weight", oldValue, newValue);
    }
  }, [fontWeight, applyStyleEdit]);

  const handleFontSizeValueChange = useCallback((value: string) => {
    const oldFormatted = formatTypographyValue(fontSize.value, fontSize.unit);
    setFontSize(prev => ({ ...prev, value }));
    const newFormatted = formatTypographyValue(value, fontSize.unit);
    if (oldFormatted !== newFormatted) {
      applyStyleEdit("font-size", oldFormatted, newFormatted);
    }
  }, [fontSize, applyStyleEdit]);

  const handleFontSizeUnitChange = useCallback((unit: FontSizeUnit) => {
    const oldFormatted = formatTypographyValue(fontSize.value, fontSize.unit);
    setFontSize(prev => ({ ...prev, unit }));
    const newFormatted = formatTypographyValue(fontSize.value, unit);
    if (oldFormatted !== newFormatted) {
      applyStyleEdit("font-size", oldFormatted, newFormatted);
    }
  }, [fontSize, applyStyleEdit]);

  const handleLineHeightValueChange = useCallback((value: string) => {
    const oldFormatted = formatTypographyValue(lineHeight.value, lineHeight.unit);
    setLineHeight(prev => ({ ...prev, value }));
    const newFormatted = formatTypographyValue(value, lineHeight.unit);
    if (oldFormatted !== newFormatted) {
      applyStyleEdit("line-height", oldFormatted, newFormatted);
    }
  }, [lineHeight, applyStyleEdit]);

  const handleLineHeightUnitChange = useCallback((unit: LineHeightUnit) => {
    const oldFormatted = formatTypographyValue(lineHeight.value, lineHeight.unit);
    setLineHeight(prev => ({ ...prev, unit }));
    const newFormatted = formatTypographyValue(lineHeight.value, unit);
    if (oldFormatted !== newFormatted) {
      applyStyleEdit("line-height", oldFormatted, newFormatted);
    }
  }, [lineHeight, applyStyleEdit]);

  const handleLetterSpacingValueChange = useCallback((value: string) => {
    const oldFormatted = formatTypographyValue(letterSpacing.value, letterSpacing.unit);
    setLetterSpacing(prev => ({ ...prev, value }));
    const newFormatted = formatTypographyValue(value, letterSpacing.unit);
    if (oldFormatted !== newFormatted) {
      applyStyleEdit("letter-spacing", oldFormatted, newFormatted);
    }
  }, [letterSpacing, applyStyleEdit]);

  const handleLetterSpacingUnitChange = useCallback((unit: string) => {
    const oldFormatted = formatTypographyValue(letterSpacing.value, letterSpacing.unit);
    setLetterSpacing(prev => ({ ...prev, unit }));
    const newFormatted = formatTypographyValue(letterSpacing.value, unit);
    if (oldFormatted !== newFormatted) {
      applyStyleEdit("letter-spacing", oldFormatted, newFormatted);
    }
  }, [letterSpacing, applyStyleEdit]);

  const handleTextAlignChange = useCallback((newValue: TextAlign) => {
    const oldValue = textAlign;
    setTextAlign(newValue);
    if (oldValue !== newValue) {
      applyStyleEdit("text-align", oldValue, newValue);
    }
  }, [textAlign, applyStyleEdit]);

  const handleTextDecorationChange = useCallback((newValue: TextDecoration) => {
    const oldValue = textDecoration;
    setTextDecoration(newValue);
    if (oldValue !== newValue) {
      applyStyleEdit("text-decoration", oldValue, newValue);
    }
  }, [textDecoration, applyStyleEdit]);

  const handleTextTransformChange = useCallback((newValue: TextTransform) => {
    const oldValue = textTransform;
    setTextTransform(newValue);
    if (oldValue !== newValue) {
      applyStyleEdit("text-transform", oldValue, newValue);
    }
  }, [textTransform, applyStyleEdit]);

  const handleColorChange = useCallback((newValue: string) => {
    const oldValue = color;
    setColor(newValue);
    if (oldValue !== newValue) {
      applyStyleEdit("color", oldValue, newValue);
    }
  }, [color, applyStyleEdit]);

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
    <div className="space-y-3">
      {/* Font Family */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Font
        </label>
        <select
          value={fontFamily}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
          className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
        >
          <optgroup label="Theme Fonts">
            {themeFonts.map((font) => (
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
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Weight
        </label>
        <select
          value={fontWeight}
          onChange={(e) => handleFontWeightChange(e.target.value)}
          className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
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
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
            Size
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={fontSize.value}
              onChange={(e) => handleFontSizeValueChange(e.target.value)}
              className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono min-w-0"
              placeholder="16"
            />
            <select
              value={fontSize.unit}
              onChange={(e) => handleFontSizeUnitChange(e.target.value as FontSizeUnit)}
              className="h-7 bg-background/50 border border-white/8 rounded-md px-1 text-[10px] text-text-muted w-12"
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
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
            Height
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={lineHeight.value}
              onChange={(e) => handleLineHeightValueChange(e.target.value)}
              className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono min-w-0"
              placeholder="1.5"
            />
            <select
              value={lineHeight.unit}
              onChange={(e) => handleLineHeightUnitChange(e.target.value as LineHeightUnit)}
              className="h-7 bg-background/50 border border-white/8 rounded-md px-1 text-[10px] text-text-muted w-12"
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
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
          Spacing
        </label>
        <div className="flex gap-1">
          <input
            type="text"
            value={letterSpacing.value}
            onChange={(e) => handleLetterSpacingValueChange(e.target.value)}
            className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
            placeholder="0"
          />
          <select
            value={letterSpacing.unit}
            onChange={(e) => handleLetterSpacingUnitChange(e.target.value)}
            className="h-7 bg-background/50 border border-white/8 rounded-md px-1 text-[10px] text-text-muted w-12"
          >
            <option value="em">EM</option>
            <option value="px">PX</option>
            <option value="rem">REM</option>
          </select>
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Color
        </label>
        <div className="flex gap-2">
          <div
            className="w-8 h-7 rounded-md border border-white/10 cursor-pointer shrink-0"
            style={{ backgroundColor: color.startsWith("var") ? "var(--text)" : color }}
          />
          <input
            type="text"
            value={color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
            placeholder="var(--text)"
          />
        </div>
      </div>

      {/* Text Align */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Align
        </label>
        <div className="flex gap-1">
          {alignIcons.map((item) => (
            <button
              key={item.value}
              onClick={() => handleTextAlignChange(item.value)}
              className={`flex-1 py-1.5 flex items-center justify-center rounded-md transition-colors ${
                textAlign === item.value
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted hover:text-text border border-transparent"
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
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Decoration
        </label>
        <div className="flex gap-1">
          {decorationOptions.map((item) => (
            <button
              key={item.value}
              onClick={() => handleTextDecorationChange(item.value)}
              className={`flex-1 py-1.5 flex items-center justify-center rounded-md transition-colors ${
                textDecoration === item.value
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted hover:text-text border border-transparent"
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
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Case
        </label>
        <div className="flex gap-1">
          {transformOptions.map((item, index) => (
            <button
              key={item.value}
              onClick={() => handleTextTransformChange(item.value)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                textTransform === item.value
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted hover:text-text border border-transparent"
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
              className="flex items-start gap-2 bg-warning/10 border border-warning/20 rounded-md p-2"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-warning mt-0.5 shrink-0"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-[10px] text-warning/80">{violation.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TypographySection;
