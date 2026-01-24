/**
 * BordersSection Component
 *
 * Controls for border style, color, width, and radius.
 * Supports linked/unlinked editing of sides and corners.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAppStore } from "../../../stores/appStore";
import { ColorPicker, type ColorValue } from "../ColorPicker";
import type { BaseSectionProps, BorderStyle } from "./types";

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

// Debounce helper for direct write mode
function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

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

export function BordersSection(_props: BaseSectionProps) {
  // App state integration
  const { selectedEntry, editorMode, addStyleEdit } = useAppStore();

  // Border state
  const [borderStyle, setBorderStyle] = useState<BorderStyle>("solid");
  const [borderColor, setBorderColor] = useState<ColorValue>({
    mode: "token",
    tokenName: "--border",
    hex: "#333333",
    alpha: 100,
  });

  // Border width state
  const [widthLinked, setWidthLinked] = useState(true);
  const [borderWidth, setBorderWidth] = useState<BorderWidthValues>({
    top: "1",
    right: "1",
    bottom: "1",
    left: "1",
  });

  // Border radius state
  const [radiusLinked, setRadiusLinked] = useState(true);
  const [borderRadius, setBorderRadius] = useState<BorderRadiusValues>({
    topLeft: "4",
    topRight: "4",
    bottomRight: "4",
    bottomLeft: "4",
  });
  const [radiusUnit, setRadiusUnit] = useState<BorderRadiusUnit>("px");

  // Sync local state with selected element (when selection changes)
  useEffect(() => {
    if (!selectedEntry) {
      // Reset to defaults when no selection
      setBorderStyle("solid");
      setBorderColor({
        mode: "token" as const,
        tokenName: "--border",
        hex: "#333333",
        alpha: 100,
      });
      setWidthLinked(true);
      setBorderWidth({ top: "1", right: "1", bottom: "1", left: "1" });
      setRadiusLinked(true);
      setBorderRadius({ topLeft: "4", topRight: "4", bottomRight: "4", bottomLeft: "4" });
      setRadiusUnit("px");
      return;
    }
    // Future: Read computed styles from preview iframe when available
  }, [selectedEntry?.radflowId]);

  // Core style edit function
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
  const applyStyleEditDebounced = useDebouncedCallback(applyStyleEditImmediate, 500);

  // Apply style edit (debounced in direct mode, immediate in clipboard mode)
  const applyStyleEdit = useCallback((property: string, oldValue: string, newValue: string) => {
    if (!selectedEntry?.source) return;
    const currentMode = editorMode;
    if (currentMode !== "clipboard") {
      applyStyleEditDebounced(property, oldValue, newValue);
    } else {
      applyStyleEditImmediate(property, oldValue, newValue);
    }
  }, [selectedEntry, editorMode, applyStyleEditDebounced, applyStyleEditImmediate]);

  // Handler: Border style change
  const handleStyleChange = useCallback((newStyle: BorderStyle) => {
    const oldValue = borderStyle;
    setBorderStyle(newStyle);
    if (oldValue !== newStyle) {
      applyStyleEdit("border-style", oldValue, newStyle);
    }
  }, [borderStyle, applyStyleEdit]);

  // Handler: Border color change
  const handleColorChange = useCallback((newColor: ColorValue) => {
    const oldValue = borderColor.mode === "token" ? `var(${borderColor.tokenName})` : borderColor.hex;
    setBorderColor(newColor);
    const newValue = newColor.mode === "token" ? `var(${newColor.tokenName})` : newColor.hex;
    if (oldValue !== newValue) {
      applyStyleEdit("border-color", oldValue, newValue);
    }
  }, [borderColor, applyStyleEdit]);

  // Handler: Border width change
  const handleWidthChange = useCallback((side: keyof BorderWidthValues, value: string) => {
    if (value !== "") {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) return;
    }

    const oldWidths = { ...borderWidth };
    if (widthLinked) {
      const newWidths = { top: value, right: value, bottom: value, left: value };
      setBorderWidth(newWidths);
      const oldValue = `${oldWidths.top}px`;
      const newValue = `${value}px`;
      if (oldValue !== newValue) {
        applyStyleEdit("border-width", oldValue, newValue);
      }
    } else {
      const newWidths = { ...borderWidth, [side]: value };
      setBorderWidth(newWidths);
      const oldValue = `${oldWidths[side]}px`;
      const newValue = `${value}px`;
      if (oldValue !== newValue) {
        applyStyleEdit(`border-${side}-width`, oldValue, newValue);
      }
    }
  }, [borderWidth, widthLinked, applyStyleEdit]);

  // Handler: Border radius change
  const handleRadiusChange = useCallback((corner: keyof BorderRadiusValues, value: string) => {
    if (value !== "") {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) return;
    }

    const oldRadius = { ...borderRadius };
    if (radiusLinked) {
      const newRadius = { topLeft: value, topRight: value, bottomRight: value, bottomLeft: value };
      setBorderRadius(newRadius);
      const oldValue = `${oldRadius.topLeft}${radiusUnit}`;
      const newValue = `${value}${radiusUnit}`;
      if (oldValue !== newValue) {
        applyStyleEdit("border-radius", oldValue, newValue);
      }
    } else {
      const newRadius = { ...borderRadius, [corner]: value };
      setBorderRadius(newRadius);
      const cornerMap: Record<keyof BorderRadiusValues, string> = {
        topLeft: "border-top-left-radius",
        topRight: "border-top-right-radius",
        bottomRight: "border-bottom-right-radius",
        bottomLeft: "border-bottom-left-radius",
      };
      const oldValue = `${oldRadius[corner]}${radiusUnit}`;
      const newValue = `${value}${radiusUnit}`;
      if (oldValue !== newValue) {
        applyStyleEdit(cornerMap[corner], oldValue, newValue);
      }
    }
  }, [borderRadius, radiusLinked, radiusUnit, applyStyleEdit]);

  // Handler: Radius unit change
  const handleRadiusUnitChange = useCallback((unit: BorderRadiusUnit) => {
    const oldValue = `${borderRadius.topLeft}${radiusUnit}`;
    setRadiusUnit(unit);
    const newValue = `${borderRadius.topLeft}${unit}`;
    if (oldValue !== newValue && radiusLinked) {
      applyStyleEdit("border-radius", oldValue, newValue);
    }
  }, [borderRadius, radiusUnit, radiusLinked, applyStyleEdit]);

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
      className={linked ? "text-primary" : "text-text-muted"}
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
    <div className="space-y-4">
      {/* Border Style */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Style
        </label>
        <div className="flex gap-1">
          {styleOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStyleChange(option.value)}
              className={`flex-1 py-1.5 flex items-center justify-center rounded-md transition-colors ${
                borderStyle === option.value
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted hover:text-text border border-transparent"
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
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Color
        </label>
        <ColorPicker
          value={borderColor}
          onChange={handleColorChange}
          showAlpha={true}
          cssProperty="border-color"
        />
      </div>

      {/* Border Width Section */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] text-text-muted uppercase tracking-wider">
            Width
          </label>
          <button
            onClick={toggleWidthLinked}
            className={`p-1 rounded hover:bg-white/5 transition-colors ${
              widthLinked ? "text-primary" : "text-text-muted"
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
              className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
              placeholder="1"
            />
            <span className="h-7 flex items-center px-2 text-[10px] text-text-muted bg-background/30 rounded-md">
              PX
            </span>
          </div>
        ) : (
          <div className="relative w-full aspect-[4/3] max-w-[160px] mx-auto">
            <div className="absolute inset-4 border border-dashed border-white/20 rounded" />

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14">
              <input
                type="text"
                value={borderWidth.top}
                onChange={(e) => handleWidthChange("top", e.target.value)}
                className="w-full h-6 bg-background/50 border border-white/8 rounded text-center text-[10px] text-text font-mono"
                placeholder="0"
              />
            </div>

            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-14">
              <input
                type="text"
                value={borderWidth.right}
                onChange={(e) => handleWidthChange("right", e.target.value)}
                className="w-full h-6 bg-background/50 border border-white/8 rounded text-center text-[10px] text-text font-mono"
                placeholder="0"
              />
            </div>

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14">
              <input
                type="text"
                value={borderWidth.bottom}
                onChange={(e) => handleWidthChange("bottom", e.target.value)}
                className="w-full h-6 bg-background/50 border border-white/8 rounded text-center text-[10px] text-text font-mono"
                placeholder="0"
              />
            </div>

            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-14">
              <input
                type="text"
                value={borderWidth.left}
                onChange={(e) => handleWidthChange("left", e.target.value)}
                className="w-full h-6 bg-background/50 border border-white/8 rounded text-center text-[10px] text-text font-mono"
                placeholder="0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Border Radius Section */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] text-text-muted uppercase tracking-wider">
            Radius
          </label>
          <button
            onClick={toggleRadiusLinked}
            className={`p-1 rounded hover:bg-white/5 transition-colors ${
              radiusLinked ? "text-primary" : "text-text-muted"
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
                className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-white/10"
              />
              <div className="flex gap-1">
                <input
                  type="text"
                  value={borderRadius.topLeft}
                  onChange={(e) => handleRadiusChange("topLeft", e.target.value)}
                  className="w-12 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono text-center"
                  placeholder="0"
                />
                <select
                  value={radiusUnit}
                  onChange={(e) => handleRadiusUnitChange(e.target.value as BorderRadiusUnit)}
                  className="h-7 bg-background/50 border border-white/8 rounded-md px-1 text-[10px] text-text-muted w-12"
                >
                  <option value="px">PX</option>
                  <option value="rem">REM</option>
                  <option value="%">%</option>
                </select>
              </div>
            </div>

            <div className="flex justify-center">
              <div
                className="w-16 h-12 border-2 border-text-muted/50 bg-white/5"
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
                className="absolute inset-6 border-2 border-text-muted/50 bg-white/5"
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
                  className="w-full h-6 bg-background/50 border border-white/8 rounded text-center text-[10px] text-text font-mono"
                  placeholder="0"
                />
              </div>

              <div className="absolute top-0 right-0 w-12">
                <input
                  type="text"
                  value={borderRadius.topRight}
                  onChange={(e) => handleRadiusChange("topRight", e.target.value)}
                  className="w-full h-6 bg-background/50 border border-white/8 rounded text-center text-[10px] text-text font-mono"
                  placeholder="0"
                />
              </div>

              <div className="absolute bottom-0 right-0 w-12">
                <input
                  type="text"
                  value={borderRadius.bottomRight}
                  onChange={(e) => handleRadiusChange("bottomRight", e.target.value)}
                  className="w-full h-6 bg-background/50 border border-white/8 rounded text-center text-[10px] text-text font-mono"
                  placeholder="0"
                />
              </div>

              <div className="absolute bottom-0 left-0 w-12">
                <input
                  type="text"
                  value={borderRadius.bottomLeft}
                  onChange={(e) => handleRadiusChange("bottomLeft", e.target.value)}
                  className="w-full h-6 bg-background/50 border border-white/8 rounded text-center text-[10px] text-text font-mono"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <select
                value={radiusUnit}
                onChange={(e) => handleRadiusUnitChange(e.target.value as BorderRadiusUnit)}
                className="h-7 bg-background/50 border border-white/8 rounded-md px-2 text-[10px] text-text-muted"
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
  );
}

export default BordersSection;
