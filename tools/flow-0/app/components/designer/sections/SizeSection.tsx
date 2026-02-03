/**
 * SizeSection Component
 *
 * Controls for width, height, min/max constraints, overflow, aspect ratio, and object fit.
 */

import { useState } from "react";
import type { BaseSectionProps, SizeUnit, OverflowValue } from "./types";

type AspectRatioPreset = "auto" | "1:1" | "16:9" | "4:3" | "3:2" | "2:3" | "2:1" | "custom";
type ObjectFitValue = "fill" | "contain" | "cover" | "none" | "scale-down";

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
      <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">{label}</label>
      <div className="flex gap-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono min-w-0"
        />
        <select
          value={unit}
          onChange={(e) => onUnitChange(e.target.value as SizeUnit)}
          className="h-7 bg-background/50 border border-white/8 rounded-md px-1 text-[10px] text-text-muted w-14"
        >
          {units.map((u) => (
            <option key={u} value={u}>{u.toUpperCase()}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function SizeSection(_props: BaseSectionProps) {
  // Width/Height state
  const [width, setWidth] = useState({ value: "", unit: "auto" as SizeUnit });
  const [height, setHeight] = useState({ value: "", unit: "auto" as SizeUnit });

  // Min/Max constraints
  const [minWidth, setMinWidth] = useState({ value: "0", unit: "px" as SizeUnit });
  const [maxWidth, setMaxWidth] = useState({ value: "", unit: "auto" as SizeUnit });
  const [minHeight, setMinHeight] = useState({ value: "0", unit: "px" as SizeUnit });
  const [maxHeight, setMaxHeight] = useState({ value: "", unit: "auto" as SizeUnit });

  // Overflow
  const [overflow, setOverflow] = useState<OverflowValue>("visible");

  // Aspect ratio
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>("auto");
  const [customRatio, setCustomRatio] = useState({ w: "16", h: "9" });

  // Object fit
  const [objectFit, setObjectFit] = useState<ObjectFitValue>("fill");

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
    <div className="space-y-4">
      {/* Width and Height */}
      <div className="grid grid-cols-2 gap-3">
        <SizeInput
          label="Width"
          value={width.value}
          unit={width.unit}
          onValueChange={(v) => setWidth({ ...width, value: v })}
          onUnitChange={(u) => setWidth({ ...width, unit: u })}
        />
        <SizeInput
          label="Height"
          value={height.value}
          unit={height.unit}
          onValueChange={(v) => setHeight({ ...height, value: v })}
          onUnitChange={(u) => setHeight({ ...height, unit: u })}
        />
      </div>

      {/* Min/Max Width */}
      <div className="grid grid-cols-2 gap-3">
        <SizeInput
          label="Min W"
          value={minWidth.value}
          unit={minWidth.unit}
          onValueChange={(v) => setMinWidth({ ...minWidth, value: v })}
          onUnitChange={(u) => setMinWidth({ ...minWidth, unit: u })}
          placeholder="0"
        />
        <SizeInput
          label="Max W"
          value={maxWidth.value}
          unit={maxWidth.unit}
          onValueChange={(v) => setMaxWidth({ ...maxWidth, value: v })}
          onUnitChange={(u) => setMaxWidth({ ...maxWidth, unit: u })}
          placeholder="none"
        />
      </div>

      {/* Min/Max Height */}
      <div className="grid grid-cols-2 gap-3">
        <SizeInput
          label="Min H"
          value={minHeight.value}
          unit={minHeight.unit}
          onValueChange={(v) => setMinHeight({ ...minHeight, value: v })}
          onUnitChange={(u) => setMinHeight({ ...minHeight, unit: u })}
          placeholder="0"
        />
        <SizeInput
          label="Max H"
          value={maxHeight.value}
          unit={maxHeight.unit}
          onValueChange={(v) => setMaxHeight({ ...maxHeight, value: v })}
          onUnitChange={(u) => setMaxHeight({ ...maxHeight, unit: u })}
          placeholder="none"
        />
      </div>

      {/* Overflow */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Overflow
        </label>
        <div className="flex gap-1">
          {overflowOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setOverflow(opt.value)}
              className={`flex-1 py-1.5 flex items-center justify-center rounded-md transition-colors ${
                overflow === opt.value
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted hover:text-text border border-transparent"
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
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Aspect Ratio
        </label>
        <select
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value as AspectRatioPreset)}
          className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
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
              onChange={(e) => setCustomRatio({ ...customRatio, w: e.target.value })}
              className="w-12 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text text-center font-mono"
              placeholder="W"
            />
            <span className="text-text-muted text-xs">:</span>
            <input
              type="text"
              value={customRatio.h}
              onChange={(e) => setCustomRatio({ ...customRatio, h: e.target.value })}
              className="w-12 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text text-center font-mono"
              placeholder="H"
            />
          </div>
        )}
      </div>

      {/* Object Fit */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Object Fit
        </label>
        <select
          value={objectFit}
          onChange={(e) => setObjectFit(e.target.value as ObjectFitValue)}
          className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
        >
          {objectFitOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default SizeSection;
