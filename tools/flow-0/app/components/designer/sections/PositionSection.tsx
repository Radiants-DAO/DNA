/**
 * PositionSection Component
 *
 * Controls for CSS position, offsets (top/right/bottom/left), and z-index.
 * Integrates with app store for style edits.
 */

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "../../../stores/appStore";
import type { BaseSectionProps, PositionType } from "./types";

type PositionUnit = "px" | "rem" | "%" | "auto";
type PositionOrigin = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";

interface OffsetValues {
  top: { value: string; unit: PositionUnit };
  right: { value: string; unit: PositionUnit };
  bottom: { value: string; unit: PositionUnit };
  left: { value: string; unit: PositionUnit };
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
      <span className="text-[10px] text-text-muted w-5">{label}</span>
      <input
        type="text"
        value={unit === "auto" ? "" : value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="auto"
        disabled={unit === "auto"}
        className="flex-1 h-6 bg-background/50 border border-white/8 rounded px-1.5 text-[11px] text-text font-mono min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <select
        value={unit}
        onChange={(e) => onUnitChange(e.target.value as PositionUnit)}
        className="h-6 bg-background/50 border border-white/8 rounded px-0.5 text-[10px] text-text-muted w-12"
      >
        {units.map((u) => (
          <option key={u} value={u}>{u.toUpperCase()}</option>
        ))}
      </select>
    </div>
  );
}

// Helper to format offset value with unit
function formatOffsetValue(value: string, unit: PositionUnit): string {
  if (unit === "auto") return "auto";
  if (!value || value === "") return "auto";
  return `${value}${unit}`;
}

// Helper to generate CSS for position changes
function generatePositionCss(
  position: PositionType,
  offsets: OffsetValues,
  zIndex: string
): string {
  const lines: string[] = [`position: ${position};`];

  if (position !== "static") {
    const sides = ["top", "right", "bottom", "left"] as const;
    for (const side of sides) {
      const offset = offsets[side];
      const formatted = formatOffsetValue(offset.value, offset.unit);
      if (formatted !== "auto") {
        lines.push(`${side}: ${formatted};`);
      }
    }
  }

  if (zIndex !== "auto" && zIndex !== "") {
    lines.push(`z-index: ${zIndex};`);
  }

  return lines.join("\n  ");
}

export function PositionSection(_props: BaseSectionProps) {
  // App state integration (directWriteMode removed per fn-9)
  const { selectedEntry, addStyleEdit } = useAppStore();

  const [position, setPosition] = useState<PositionType>("static");
  const [offsets, setOffsets] = useState<OffsetValues>({
    top: { value: "", unit: "auto" },
    right: { value: "", unit: "auto" },
    bottom: { value: "", unit: "auto" },
    left: { value: "", unit: "auto" },
  });
  const [zIndex, setZIndex] = useState<string>("auto");
  const [positionOrigin, setPositionOrigin] = useState<PositionOrigin>("tl");

  // Sync local state with selected element (when selection changes)
  useEffect(() => {
    // Reset to defaults when no selection
    if (!selectedEntry) {
      setPosition("static");
      setOffsets({
        top: { value: "", unit: "auto" },
        right: { value: "", unit: "auto" },
        bottom: { value: "", unit: "auto" },
        left: { value: "", unit: "auto" },
      });
      setZIndex("auto");
      return;
    }
    // Future: Read computed styles from preview iframe when available
    // For now, start with defaults for new selections
  }, [selectedEntry?.radflowId]);

  // Apply style edit to app state
  const applyStyleEdit = useCallback((property: string, oldValue: string, newValue: string) => {
    if (!selectedEntry?.source) return;

    addStyleEdit({
      radflowId: selectedEntry.radflowId,
      componentName: selectedEntry.name,
      source: selectedEntry.source,
      property,
      oldValue,
      newValue,
    });

    // Copy to clipboard
    const css = generatePositionCss(position, offsets, zIndex);
    navigator.clipboard.writeText(css).catch(() => {
      // Clipboard API may fail in some contexts
    });
  }, [selectedEntry, addStyleEdit, position, offsets, zIndex]);

  // Handle position type change
  const handlePositionChange = useCallback((newPosition: PositionType) => {
    const oldPosition = position;
    setPosition(newPosition);
    applyStyleEdit("position", oldPosition, newPosition);
  }, [position, applyStyleEdit]);

  // Update offset value with style edit
  const updateOffsetValue = useCallback((side: keyof OffsetValues, value: string) => {
    setOffsets((prev) => {
      const oldFormatted = formatOffsetValue(prev[side].value, prev[side].unit);
      const newFormatted = formatOffsetValue(value, prev[side].unit);
      if (oldFormatted !== newFormatted && selectedEntry?.source) {
        applyStyleEdit(side, oldFormatted, newFormatted);
      }
      return {
        ...prev,
        [side]: { ...prev[side], value },
      };
    });
  }, [applyStyleEdit, selectedEntry]);

  // Update offset unit with style edit
  const updateOffsetUnit = useCallback((side: keyof OffsetValues, unit: PositionUnit) => {
    setOffsets((prev) => {
      const oldFormatted = formatOffsetValue(prev[side].value, prev[side].unit);
      const newValue = unit === "auto" ? "" : prev[side].value;
      const newFormatted = formatOffsetValue(newValue, unit);
      if (oldFormatted !== newFormatted && selectedEntry?.source) {
        applyStyleEdit(side, oldFormatted, newFormatted);
      }
      return {
        ...prev,
        [side]: { ...prev[side], unit, value: newValue },
      };
    });
  }, [applyStyleEdit, selectedEntry]);

  // Handle z-index change with validation
  const handleZIndexChange = useCallback((value: string) => {
    // Validate: must be empty, "auto", or an integer (including negative)
    if (value === "" || value === "auto" || /^-?\d+$/.test(value)) {
      const oldValue = zIndex;
      setZIndex(value);
      if (selectedEntry?.source) {
        applyStyleEdit("z-index", oldValue === "" ? "auto" : oldValue, value === "" ? "auto" : value);
      }
    }
  }, [zIndex, applyStyleEdit, selectedEntry]);

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

    const preset = presets[origin];
    // Apply each offset change
    if (selectedEntry?.source) {
      const sides = ["top", "right", "bottom", "left"] as const;
      for (const side of sides) {
        const oldFormatted = formatOffsetValue(offsets[side].value, offsets[side].unit);
        const newFormatted = formatOffsetValue(preset[side].value, preset[side].unit);
        if (oldFormatted !== newFormatted) {
          applyStyleEdit(side, oldFormatted, newFormatted);
        }
      }
    }
    setOffsets(preset);
  }, [applyStyleEdit, selectedEntry, offsets]);

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
    <div className="space-y-3">
      {/* Position type selector */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Type
        </label>
        <div className="flex gap-0.5 bg-background/50 rounded-md p-0.5">
          {(["static", "relative", "absolute", "fixed", "sticky"] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePositionChange(p)}
              className={`flex-1 py-1.5 text-[10px] rounded transition-colors flex items-center justify-center gap-1 ${
                position === p
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-text-muted hover:text-text border border-transparent"
              }`}
              title={positionDescriptions[p]}
            >
              {positionIcons[p]}
              <span className="hidden sm:inline">{p.slice(0, 3).toUpperCase()}</span>
            </button>
          ))}
        </div>
        {/* Description */}
        <p className="text-[10px] text-text-muted/70 mt-1.5 italic">
          {positionDescriptions[position]}
        </p>
      </div>

      {/* Offset inputs - only show when not static */}
      {position !== "static" && (
        <>
          {/* Visual offset diagram */}
          <div className="relative">
            <div className="bg-background/30 rounded-lg p-3">
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
                <div className="flex-1 h-14 bg-surface/50 rounded border border-white/10 flex items-center justify-center relative">
                  {position === "absolute" && (
                    /* Position origin grid for absolute */
                    <div className="grid grid-cols-3 gap-0.5 w-10 h-10">
                      {originPositions.map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() => applyPositionOrigin(pos.id)}
                          className={`w-full h-full rounded-sm transition-colors ${
                            positionOrigin === pos.id
                              ? "bg-primary"
                              : "bg-white/10 hover:bg-white/20"
                          }`}
                          title={`Position from ${pos.id === "tl" ? "top-left" : pos.id === "tc" ? "top-center" : pos.id === "tr" ? "top-right" : pos.id === "ml" ? "middle-left" : pos.id === "mc" ? "center" : pos.id === "mr" ? "middle-right" : pos.id === "bl" ? "bottom-left" : pos.id === "bc" ? "bottom-center" : "bottom-right"}`}
                        />
                      ))}
                    </div>
                  )}
                  {position !== "absolute" && (
                    <span className="text-[9px] text-text-muted/50 uppercase tracking-wider">
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
              <span className="text-[10px] text-text-muted">Relative to:</span>
              <div className="flex-1 h-6 bg-background/50 border border-white/8 rounded px-2 flex items-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted mr-1.5">
                  <rect x="2" y="2" width="20" height="20" rx="2" />
                </svg>
                <span className="text-[10px] text-text-muted/70 font-mono truncate">
                  nearest positioned parent
                </span>
              </div>
            </div>
          )}

          {/* Sticky warning */}
          {position === "sticky" && (
            <div className="flex items-start gap-2 bg-warning/10 border border-warning/20 rounded-md p-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning mt-0.5 shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-[10px] text-warning/80">
                Requires a scrollable container to work properly
              </span>
            </div>
          )}
        </>
      )}

      {/* Z-Index */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Z-Index
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={zIndex}
            onChange={(e) => handleZIndexChange(e.target.value)}
            placeholder="auto"
            className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
          />
          {/* Quick z-index presets */}
          <div className="flex gap-0.5">
            {["0", "10", "50", "100"].map((z) => (
              <button
                key={z}
                onClick={() => handleZIndexChange(z)}
                className={`px-2 h-7 text-[10px] rounded transition-colors ${
                  zIndex === z
                    ? "bg-primary/20 text-primary"
                    : "bg-background/50 text-text-muted hover:text-text"
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PositionSection;
