/**
 * PositionSection Component
 *
 * Controls for CSS position, offsets (top/right/bottom/left), and z-index.
 *
 * Ported from Flow 0 for the browser extension.
 */

import { useState, useCallback, useEffect } from "react";
import type { BaseSectionProps, PositionType } from "./types";
import type { StyleValue } from "../../../types/styleValue";
import { DogfoodBoundary } from '../../ui/DogfoodBoundary';

type PositionUnit = "px" | "rem" | "%" | "auto";
type PositionOrigin = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";

interface OffsetValues {
  top: { value: string; unit: PositionUnit };
  right: { value: string; unit: PositionUnit };
  bottom: { value: string; unit: PositionUnit };
  left: { value: string; unit: PositionUnit };
}

/**
 * Parse a CSS position value to extract numeric value and unit
 */
function parsePositionValue(cssValue: string | undefined): { value: string; unit: PositionUnit } {
  if (!cssValue || cssValue === "auto") return { value: "", unit: "auto" };
  const match = cssValue.match(/^(-?\d*\.?\d+)([a-z%]*)?$/i);
  if (match) {
    const unit = (match[2] || "px") as PositionUnit;
    return { value: match[1], unit };
  }
  return { value: "", unit: "auto" };
}

/**
 * Create a StyleValue from a position value and unit
 */
function createPositionStyleValue(value: string, unit: PositionUnit): StyleValue {
  if (unit === "auto" || !value) {
    return { type: "keyword", value: "auto" };
  }
  return { type: "unit", unit: unit as any, value: parseFloat(value) || 0 };
}

interface PositionInputProps {
  label: string;
  value: string;
  unit: PositionUnit;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: PositionUnit) => void;
}

function PositionInput({ label, value, unit, onValueChange, onUnitChange }: PositionInputProps) {
  const units: PositionUnit[] = ["px", "rem", "%", "auto"];

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-neutral-400 w-5">{label}</span>
      <input
        type="text"
        value={unit === "auto" ? "" : value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="auto"
        disabled={unit === "auto"}
        className="flex-1 h-6 bg-neutral-800/50 border border-neutral-700 rounded px-1.5 text-[11px] text-neutral-200 font-mono min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <select
        value={unit}
        onChange={(e) => onUnitChange(e.target.value as PositionUnit)}
        className="h-6 bg-neutral-800/50 border border-neutral-700 rounded px-0.5 text-[10px] text-neutral-400 w-12"
      >
        {units.map((u) => (
          <option key={u} value={u}>{u.toUpperCase()}</option>
        ))}
      </select>
    </div>
  );
}

export function PositionSection(props: BaseSectionProps) {
  const { onStyleChange, initialStyles } = props;

  // Parse initial values
  const initialTop = parsePositionValue(initialStyles?.top);
  const initialRight = parsePositionValue(initialStyles?.right);
  const initialBottom = parsePositionValue(initialStyles?.bottom);
  const initialLeft = parsePositionValue(initialStyles?.left);

  const [position, setPosition] = useState<PositionType>((initialStyles?.position as PositionType) || "static");
  const [offsets, setOffsets] = useState<OffsetValues>({
    top: initialTop,
    right: initialRight,
    bottom: initialBottom,
    left: initialLeft,
  });
  const [zIndex, setZIndex] = useState<string>(initialStyles?.zIndex || "auto");
  const [positionOrigin, setPositionOrigin] = useState<PositionOrigin>("tl");

  // Update state when initialStyles changes
  useEffect(() => {
    if (initialStyles) {
      const newTop = parsePositionValue(initialStyles.top);
      const newRight = parsePositionValue(initialStyles.right);
      const newBottom = parsePositionValue(initialStyles.bottom);
      const newLeft = parsePositionValue(initialStyles.left);

      setPosition((initialStyles.position as PositionType) || "static");
      setOffsets({
        top: newTop,
        right: newRight,
        bottom: newBottom,
        left: newLeft,
      });
      setZIndex(initialStyles.zIndex || "auto");
    }
  }, [initialStyles]);

  // Handle position type change
  const handlePositionChange = useCallback((newPosition: PositionType) => {
    setPosition(newPosition);
    if (onStyleChange) {
      onStyleChange("position", { type: "keyword", value: newPosition });
    }
  }, [onStyleChange]);

  // Update offset value
  const updateOffsetValue = useCallback((side: keyof OffsetValues, value: string) => {
    setOffsets((prev) => {
      const newOffsets = {
        ...prev,
        [side]: { ...prev[side], value },
      };
      // Emit style change
      if (onStyleChange) {
        onStyleChange(side, createPositionStyleValue(value, prev[side].unit));
      }
      return newOffsets;
    });
  }, [onStyleChange]);

  // Update offset unit
  const updateOffsetUnit = useCallback((side: keyof OffsetValues, unit: PositionUnit) => {
    setOffsets((prev) => {
      const newValue = unit === "auto" ? "" : prev[side].value;
      const newOffsets = {
        ...prev,
        [side]: { ...prev[side], unit, value: newValue },
      };
      // Emit style change
      if (onStyleChange) {
        onStyleChange(side, createPositionStyleValue(newValue, unit));
      }
      return newOffsets;
    });
  }, [onStyleChange]);

  // Handle z-index change with validation
  const handleZIndexChange = useCallback((value: string) => {
    // Validate: must be empty, "auto", or an integer (including negative)
    if (value === "" || value === "auto" || /^-?\d+$/.test(value)) {
      setZIndex(value);
      if (onStyleChange) {
        if (value === "" || value === "auto") {
          onStyleChange("zIndex", { type: "keyword", value: "auto" });
        } else {
          onStyleChange("zIndex", { type: "unit", unit: "number", value: parseInt(value, 10) });
        }
      }
    }
  }, [onStyleChange]);

  // Apply position origin preset (for absolute positioning)
  const applyPositionOrigin = useCallback((origin: PositionOrigin) => {
    setPositionOrigin(origin);

    // Convert origin to offset presets
    const presets: Record<PositionOrigin, OffsetValues> = {
      tl: { top: { value: "0", unit: "px" }, left: { value: "0", unit: "px" }, bottom: { value: "", unit: "auto" }, right: { value: "", unit: "auto" } },
      tc: { top: { value: "0", unit: "px" }, left: { value: "50", unit: "%" }, bottom: { value: "", unit: "auto" }, right: { value: "", unit: "auto" } },
      tr: { top: { value: "0", unit: "px" }, right: { value: "0", unit: "px" }, bottom: { value: "", unit: "auto" }, left: { value: "", unit: "auto" } },
      ml: { top: { value: "50", unit: "%" }, left: { value: "0", unit: "px" }, bottom: { value: "", unit: "auto" }, right: { value: "", unit: "auto" } },
      mc: { top: { value: "50", unit: "%" }, left: { value: "50", unit: "%" }, bottom: { value: "", unit: "auto" }, right: { value: "", unit: "auto" } },
      mr: { top: { value: "50", unit: "%" }, right: { value: "0", unit: "px" }, bottom: { value: "", unit: "auto" }, left: { value: "", unit: "auto" } },
      bl: { bottom: { value: "0", unit: "px" }, left: { value: "0", unit: "px" }, top: { value: "", unit: "auto" }, right: { value: "", unit: "auto" } },
      bc: { bottom: { value: "0", unit: "px" }, left: { value: "50", unit: "%" }, top: { value: "", unit: "auto" }, right: { value: "", unit: "auto" } },
      br: { bottom: { value: "0", unit: "px" }, right: { value: "0", unit: "px" }, top: { value: "", unit: "auto" }, left: { value: "", unit: "auto" } },
    };

    const newOffsets = presets[origin];
    setOffsets(newOffsets);

    // Emit all offset changes
    if (onStyleChange) {
      (Object.keys(newOffsets) as Array<keyof OffsetValues>).forEach((side) => {
        const { value, unit } = newOffsets[side];
        onStyleChange(side, createPositionStyleValue(value, unit));
      });
    }
  }, [onStyleChange]);

  // Position type icons
  const positionIcons: Record<PositionType, React.ReactNode> = {
    static: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    relative: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="10" height="10" rx="1" />
        <rect x="10" y="10" width="10" height="10" rx="1" strokeDasharray="3 2" />
      </svg>
    ),
    absolute: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="2" strokeDasharray="3 2" />
        <rect x="6" y="6" width="8" height="8" rx="1" />
      </svg>
    ),
    fixed: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 5v2M12 17v2M5 12h2M17 12h2" />
      </svg>
    ),
    sticky: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M4 9h16" />
        <rect x="7" y="12" width="6" height="5" rx="1" />
      </svg>
    ),
  };

  // Position type descriptions
  const positionDescriptions: Record<PositionType, string> = {
    static: "Default position in normal document flow",
    relative: "Offset relative to its normal position",
    absolute: "Positioned relative to nearest positioned ancestor",
    fixed: "Positioned relative to the viewport",
    sticky: "Toggles between relative and fixed based on scroll",
  };

  // Position origin grid for absolute positioning
  const originPositions: { id: PositionOrigin; row: number; col: number }[] = [
    { id: "tl", row: 0, col: 0 }, { id: "tc", row: 0, col: 1 }, { id: "tr", row: 0, col: 2 },
    { id: "ml", row: 1, col: 0 }, { id: "mc", row: 1, col: 1 }, { id: "mr", row: 1, col: 2 },
    { id: "bl", row: 2, col: 0 }, { id: "bc", row: 2, col: 1 }, { id: "br", row: 2, col: 2 },
  ];

  return (
    <DogfoodBoundary name="PositionSection" file="designer/sections/PositionSection.tsx" category="designer">
    <div className="space-y-3">
      {/* Position type selector */}
      <div>
        <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
          Type
        </label>
        <div className="flex gap-0.5 bg-neutral-800/50 rounded-md p-0.5">
          {(["static", "relative", "absolute", "fixed", "sticky"] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePositionChange(p)}
              className={`flex-1 py-1.5 text-[10px] rounded transition-colors flex items-center justify-center gap-1 ${
                position === p
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-neutral-400 hover:text-neutral-200 border border-transparent"
              }`}
              title={positionDescriptions[p]}
            >
              {positionIcons[p]}
              <span className="hidden sm:inline">{p.slice(0, 3).toUpperCase()}</span>
            </button>
          ))}
        </div>
        {/* Description */}
        <p className="text-[10px] text-neutral-500 mt-1.5 italic">
          {positionDescriptions[position]}
        </p>
      </div>

      {/* Offset inputs - only show when not static */}
      {position !== "static" && (
        <>
          {/* Visual offset diagram */}
          <div className="relative">
            <div className="bg-neutral-800/30 rounded-lg p-3">
              {/* Top offset */}
              <div className="flex justify-center mb-1">
                <div className="w-24">
                  <PositionInput
                    label="T"
                    value={offsets.top.value}
                    unit={offsets.top.unit}
                    onValueChange={(v) => updateOffsetValue("top", v)}
                    onUnitChange={(u) => updateOffsetUnit("top", u)}
                  />
                </div>
              </div>

              {/* Left, Center visual, Right */}
              <div className="flex items-center gap-2">
                {/* Left offset */}
                <div className="w-24">
                  <PositionInput
                    label="L"
                    value={offsets.left.value}
                    unit={offsets.left.unit}
                    onValueChange={(v) => updateOffsetValue("left", v)}
                    onUnitChange={(u) => updateOffsetUnit("left", u)}
                  />
                </div>

                {/* Center visual box */}
                <div className="flex-1 h-14 bg-neutral-800/50 rounded border border-neutral-700 flex items-center justify-center relative">
                  {position === "absolute" && (
                    /* Position origin grid for absolute */
                    <div className="grid grid-cols-3 gap-0.5 w-10 h-10">
                      {originPositions.map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() => applyPositionOrigin(pos.id)}
                          className={`w-full h-full rounded-sm transition-colors ${
                            positionOrigin === pos.id
                              ? "bg-blue-500"
                              : "bg-neutral-700/50 hover:bg-neutral-700"
                          }`}
                          title={`Position from ${pos.id === "tl" ? "top-left" : pos.id === "tc" ? "top-center" : pos.id === "tr" ? "top-right" : pos.id === "ml" ? "middle-left" : pos.id === "mc" ? "center" : pos.id === "mr" ? "middle-right" : pos.id === "bl" ? "bottom-left" : pos.id === "bc" ? "bottom-center" : "bottom-right"}`}
                        />
                      ))}
                    </div>
                  )}
                  {position !== "absolute" && (
                    <span className="text-[9px] text-neutral-500 uppercase tracking-wider">
                      element
                    </span>
                  )}
                </div>

                {/* Right offset */}
                <div className="w-24">
                  <PositionInput
                    label="R"
                    value={offsets.right.value}
                    unit={offsets.right.unit}
                    onValueChange={(v) => updateOffsetValue("right", v)}
                    onUnitChange={(u) => updateOffsetUnit("right", u)}
                  />
                </div>
              </div>

              {/* Bottom offset */}
              <div className="flex justify-center mt-1">
                <div className="w-24">
                  <PositionInput
                    label="B"
                    value={offsets.bottom.value}
                    unit={offsets.bottom.unit}
                    onValueChange={(v) => updateOffsetValue("bottom", v)}
                    onUnitChange={(u) => updateOffsetUnit("bottom", u)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Relative to indicator (for absolute) */}
          {position === "absolute" && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-400">Relative to:</span>
              <div className="flex-1 h-6 bg-neutral-800/50 border border-neutral-700 rounded px-2 flex items-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400 mr-1.5">
                  <rect x="2" y="2" width="20" height="20" rx="2" />
                </svg>
                <span className="text-[10px] text-neutral-500 font-mono truncate">
                  nearest positioned parent
                </span>
              </div>
            </div>
          )}

          {/* Sticky warning */}
          {position === "sticky" && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-md p-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 mt-0.5 shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-[10px] text-amber-400/80">
                Requires a scrollable container to work properly
              </span>
            </div>
          )}
        </>
      )}

      {/* Z-Index */}
      <div>
        <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
          Z-Index
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={zIndex}
            onChange={(e) => handleZIndexChange(e.target.value)}
            placeholder="auto"
            className="flex-1 h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200 font-mono"
          />
          {/* Quick z-index presets */}
          <div className="flex gap-0.5">
            {["0", "10", "50", "100"].map((z) => (
              <button
                key={z}
                onClick={() => handleZIndexChange(z)}
                className={`px-2 h-7 text-[10px] rounded transition-colors ${
                  zIndex === z
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DogfoodBoundary>
  );
}

export default PositionSection;
