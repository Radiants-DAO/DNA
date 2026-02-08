/**
 * SizeSection Component
 *
 * Controls for width, height, min/max constraints, overflow, aspect ratio, and object fit.
 *
 * Ported from Flow 0 for the browser extension.
 */

import { useState, useCallback, useEffect } from "react";
import type { BaseSectionProps, SizeUnit, OverflowValue } from "./types";
import type { StyleValue } from "../../../types/styleValue";
import { DogfoodBoundary } from '../../ui/DogfoodBoundary';

type AspectRatioPreset = "auto" | "1:1" | "16:9" | "4:3" | "3:2" | "2:3" | "2:1" | "custom";
type ObjectFitValue = "fill" | "contain" | "cover" | "none" | "scale-down";

/**
 * Parse a CSS size value to extract numeric value and unit
 */
function parseSizeValue(cssValue: string | undefined): { value: string; unit: SizeUnit } {
  if (!cssValue || cssValue === "auto") return { value: "", unit: "auto" };
  const match = cssValue.match(/^(-?\d*\.?\d+)([a-z%]*)?$/i);
  if (match) {
    const unit = (match[2] || "px") as SizeUnit;
    return { value: match[1], unit };
  }
  return { value: "", unit: "auto" };
}

/**
 * Create a StyleValue from a size value and unit
 */
function createSizeStyleValue(value: string, unit: SizeUnit): StyleValue {
  if (unit === "auto" || !value) {
    return { type: "keyword", value: "auto" };
  }
  return { type: "unit", unit: unit as any, value: parseFloat(value) || 0 };
}

interface SizeInputProps {
  label: string;
  value: string;
  unit: SizeUnit;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: SizeUnit) => void;
  placeholder?: string;
}

function SizeInput({ label, value, unit, onValueChange, onUnitChange, placeholder = "auto" }: SizeInputProps) {
  const units: SizeUnit[] = ["px", "rem", "%", "vw", "vh", "auto"];

  return (
    <div>
      <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">{label}</label>
      <div className="flex gap-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200 font-mono min-w-0"
        />
        <select
          value={unit}
          onChange={(e) => onUnitChange(e.target.value as SizeUnit)}
          className="h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-1 text-[10px] text-neutral-400 w-14"
        >
          {units.map((u) => (
            <option key={u} value={u}>{u.toUpperCase()}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function SizeSection(props: BaseSectionProps) {
  const { onStyleChange, initialStyles } = props;

  // Parse initial values
  const initialWidth = parseSizeValue(initialStyles?.width);
  const initialHeight = parseSizeValue(initialStyles?.height);
  const initialMinWidth = parseSizeValue(initialStyles?.minWidth);
  const initialMaxWidth = parseSizeValue(initialStyles?.maxWidth);
  const initialMinHeight = parseSizeValue(initialStyles?.minHeight);
  const initialMaxHeight = parseSizeValue(initialStyles?.maxHeight);

  // Width/Height state
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);

  // Min/Max constraints
  const [minWidth, setMinWidth] = useState(initialMinWidth.value ? initialMinWidth : { value: "0", unit: "px" as SizeUnit });
  const [maxWidth, setMaxWidth] = useState(initialMaxWidth);
  const [minHeight, setMinHeight] = useState(initialMinHeight.value ? initialMinHeight : { value: "0", unit: "px" as SizeUnit });
  const [maxHeight, setMaxHeight] = useState(initialMaxHeight);

  // Overflow
  const [overflow, setOverflow] = useState<OverflowValue>((initialStyles?.overflow as OverflowValue) || "visible");

  // Aspect ratio
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>("auto");
  const [customRatio, setCustomRatio] = useState({ w: "16", h: "9" });

  // Object fit
  const [objectFit, setObjectFit] = useState<ObjectFitValue>((initialStyles?.objectFit as ObjectFitValue) || "fill");

  // Update state when initialStyles changes
  useEffect(() => {
    if (initialStyles) {
      const newWidth = parseSizeValue(initialStyles.width);
      const newHeight = parseSizeValue(initialStyles.height);
      const newMinWidth = parseSizeValue(initialStyles.minWidth);
      const newMaxWidth = parseSizeValue(initialStyles.maxWidth);
      const newMinHeight = parseSizeValue(initialStyles.minHeight);
      const newMaxHeight = parseSizeValue(initialStyles.maxHeight);

      setWidth(newWidth);
      setHeight(newHeight);
      setMinWidth(newMinWidth.value ? newMinWidth : { value: "0", unit: "px" });
      setMaxWidth(newMaxWidth);
      setMinHeight(newMinHeight.value ? newMinHeight : { value: "0", unit: "px" });
      setMaxHeight(newMaxHeight);
      setOverflow((initialStyles.overflow as OverflowValue) || "visible");
      setObjectFit((initialStyles.objectFit as ObjectFitValue) || "fill");
    }
  }, [initialStyles]);

  // Helper to emit style changes
  const emitStyleChange = useCallback((property: string, value: string, unit: SizeUnit) => {
    if (onStyleChange) {
      onStyleChange(property, createSizeStyleValue(value, unit));
    }
  }, [onStyleChange]);

  // Overflow icons
  const overflowOptions: { value: OverflowValue; icon: React.ReactNode; label: string }[] = [
    {
      value: "visible",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
        </svg>
      ),
      label: "Visible",
    },
    {
      value: "hidden",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ),
      label: "Hidden",
    },
    {
      value: "scroll",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M21 9h-4" />
          <path d="M21 15h-4" />
          <path d="M19 12V7m0 10v-5" />
        </svg>
      ),
      label: "Scroll",
    },
    {
      value: "auto",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      ),
      label: "Auto",
    },
  ];

  // Aspect ratio presets
  const aspectRatioOptions: { value: AspectRatioPreset; label: string }[] = [
    { value: "auto", label: "Auto" },
    { value: "1:1", label: "Square (1:1)" },
    { value: "16:9", label: "Widescreen (16:9)" },
    { value: "4:3", label: "Landscape (4:3)" },
    { value: "3:2", label: "Photo (3:2)" },
    { value: "2:3", label: "Portrait (2:3)" },
    { value: "2:1", label: "Univisium (2:1)" },
    { value: "custom", label: "Custom" },
  ];

  // Object fit options
  const objectFitOptions: { value: ObjectFitValue; label: string }[] = [
    { value: "fill", label: "Fill" },
    { value: "contain", label: "Contain" },
    { value: "cover", label: "Cover" },
    { value: "none", label: "None" },
    { value: "scale-down", label: "Scale Down" },
  ];

  return (
    <DogfoodBoundary name="SizeSection" file="designer/sections/SizeSection.tsx" category="designer">
    <div className="space-y-4">
      {/* Width and Height */}
      <div className="grid grid-cols-2 gap-3">
        <SizeInput
          label="Width"
          value={width.value}
          unit={width.unit}
          onValueChange={(v) => {
            setWidth({ ...width, value: v });
            emitStyleChange("width", v, width.unit);
          }}
          onUnitChange={(u) => {
            setWidth({ ...width, unit: u });
            emitStyleChange("width", width.value, u);
          }}
        />
        <SizeInput
          label="Height"
          value={height.value}
          unit={height.unit}
          onValueChange={(v) => {
            setHeight({ ...height, value: v });
            emitStyleChange("height", v, height.unit);
          }}
          onUnitChange={(u) => {
            setHeight({ ...height, unit: u });
            emitStyleChange("height", height.value, u);
          }}
        />
      </div>

      {/* Min/Max Width */}
      <div className="grid grid-cols-2 gap-3">
        <SizeInput
          label="Min W"
          value={minWidth.value}
          unit={minWidth.unit}
          onValueChange={(v) => {
            setMinWidth({ ...minWidth, value: v });
            emitStyleChange("minWidth", v, minWidth.unit);
          }}
          onUnitChange={(u) => {
            setMinWidth({ ...minWidth, unit: u });
            emitStyleChange("minWidth", minWidth.value, u);
          }}
          placeholder="0"
        />
        <SizeInput
          label="Max W"
          value={maxWidth.value}
          unit={maxWidth.unit}
          onValueChange={(v) => {
            setMaxWidth({ ...maxWidth, value: v });
            emitStyleChange("maxWidth", v, maxWidth.unit);
          }}
          onUnitChange={(u) => {
            setMaxWidth({ ...maxWidth, unit: u });
            emitStyleChange("maxWidth", maxWidth.value, u);
          }}
          placeholder="none"
        />
      </div>

      {/* Min/Max Height */}
      <div className="grid grid-cols-2 gap-3">
        <SizeInput
          label="Min H"
          value={minHeight.value}
          unit={minHeight.unit}
          onValueChange={(v) => {
            setMinHeight({ ...minHeight, value: v });
            emitStyleChange("minHeight", v, minHeight.unit);
          }}
          onUnitChange={(u) => {
            setMinHeight({ ...minHeight, unit: u });
            emitStyleChange("minHeight", minHeight.value, u);
          }}
          placeholder="0"
        />
        <SizeInput
          label="Max H"
          value={maxHeight.value}
          unit={maxHeight.unit}
          onValueChange={(v) => {
            setMaxHeight({ ...maxHeight, value: v });
            emitStyleChange("maxHeight", v, maxHeight.unit);
          }}
          onUnitChange={(u) => {
            setMaxHeight({ ...maxHeight, unit: u });
            emitStyleChange("maxHeight", maxHeight.value, u);
          }}
          placeholder="none"
        />
      </div>

      {/* Overflow */}
      <div>
        <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
          Overflow
        </label>
        <div className="flex gap-1">
          {overflowOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setOverflow(opt.value);
                if (onStyleChange) {
                  onStyleChange("overflow", { type: "keyword", value: opt.value });
                }
              }}
              className={`flex-1 py-1.5 flex items-center justify-center rounded-md transition-colors ${
                overflow === opt.value
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 border border-transparent"
              }`}
              title={opt.label}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
          Aspect Ratio
        </label>
        <select
          value={aspectRatio}
          onChange={(e) => {
            const newRatio = e.target.value as AspectRatioPreset;
            setAspectRatio(newRatio);
            if (onStyleChange) {
              if (newRatio === "auto") {
                onStyleChange("aspectRatio", { type: "keyword", value: "auto" });
              } else if (newRatio !== "custom") {
                const [w, h] = newRatio.split(":").map(Number);
                onStyleChange("aspectRatio", { type: "unparsed", value: `${w} / ${h}` });
              }
            }
          }}
          className="w-full h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200"
        >
          {aspectRatioOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {aspectRatio === "custom" && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={customRatio.w}
              onChange={(e) => {
                const newW = e.target.value;
                setCustomRatio({ ...customRatio, w: newW });
                if (onStyleChange && newW && customRatio.h) {
                  onStyleChange("aspectRatio", { type: "unparsed", value: `${newW} / ${customRatio.h}` });
                }
              }}
              className="w-12 h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200 text-center font-mono"
              placeholder="W"
            />
            <span className="text-neutral-400 text-xs">:</span>
            <input
              type="text"
              value={customRatio.h}
              onChange={(e) => {
                const newH = e.target.value;
                setCustomRatio({ ...customRatio, h: newH });
                if (onStyleChange && customRatio.w && newH) {
                  onStyleChange("aspectRatio", { type: "unparsed", value: `${customRatio.w} / ${newH}` });
                }
              }}
              className="w-12 h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200 text-center font-mono"
              placeholder="H"
            />
          </div>
        )}
      </div>

      {/* Object Fit */}
      <div>
        <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
          Object Fit
        </label>
        <select
          value={objectFit}
          onChange={(e) => {
            const newFit = e.target.value as ObjectFitValue;
            setObjectFit(newFit);
            if (onStyleChange) {
              onStyleChange("objectFit", { type: "keyword", value: newFit });
            }
          }}
          className="w-full h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200"
        >
          {objectFitOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
    </DogfoodBoundary>
  );
}

export default SizeSection;
