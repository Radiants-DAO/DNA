/**
 * LayoutSection Component
 *
 * Controls for CSS display, flex/grid layout properties.
 * Shows different controls based on selected display type.
 *
 * Ported from Flow 0 for the browser extension.
 */

import { useState, useCallback, useEffect } from "react";
import type {
  BaseSectionProps,
  DisplayType,
  FlexDirection,
  FlexWrap,
  AlignItems,
  JustifyContent,
} from "./types";
import { ALIGNMENT_MAP } from "./types";
import type { StyleValue } from "../../../types/styleValue";
import { DogfoodBoundary } from '../../ui/DogfoodBoundary';

/**
 * Parse a gap CSS value to extract numeric value
 */
function parseGapValue(cssValue: string | undefined): string {
  if (!cssValue) return "8";
  const match = cssValue.match(/^(\d+)/);
  return match ? match[1] : "8";
}

export function LayoutSection(props: BaseSectionProps) {
  const { onStyleChange, initialStyles } = props;

  // Initialize state from initialStyles
  const [display, setDisplay] = useState<DisplayType>((initialStyles?.display as DisplayType) || "flex");
  const [direction, setDirection] = useState<FlexDirection>((initialStyles?.flexDirection as FlexDirection) || "row");
  const [wrap, setWrap] = useState<FlexWrap>((initialStyles?.flexWrap as FlexWrap) || "nowrap");
  const [alignItems, setAlignItems] = useState<AlignItems>((initialStyles?.alignItems as AlignItems) || "center");
  const [justifyContent, setJustifyContent] = useState<JustifyContent>((initialStyles?.justifyContent as JustifyContent) || "center");
  const [gap, setGap] = useState(parseGapValue(initialStyles?.gap));
  const [gridColumns, setGridColumns] = useState("2");
  const [gridRows, setGridRows] = useState("auto");

  // Update state when initialStyles changes
  useEffect(() => {
    if (initialStyles) {
      setDisplay((initialStyles.display as DisplayType) || "flex");
      setDirection((initialStyles.flexDirection as FlexDirection) || "row");
      setWrap((initialStyles.flexWrap as FlexWrap) || "nowrap");
      setAlignItems((initialStyles.alignItems as AlignItems) || "center");
      setJustifyContent((initialStyles.justifyContent as JustifyContent) || "center");
      setGap(parseGapValue(initialStyles.gap));
    }
  }, [initialStyles]);

  // Helper to emit style changes
  const emitKeyword = useCallback((property: string, value: string) => {
    if (onStyleChange) {
      onStyleChange(property, { type: "keyword", value });
    }
  }, [onStyleChange]);

  const emitUnit = useCallback((property: string, value: number) => {
    if (onStyleChange) {
      onStyleChange(property, { type: "unit", unit: "px", value });
    }
  }, [onStyleChange]);

  // Find selected alignment grid position
  const selectedGridPos = ALIGNMENT_MAP.findIndex(
    (m) => m.alignItems === alignItems && m.justifyContent === justifyContent
  );

  // Handle alignment grid click
  const handleAlignmentClick = useCallback((index: number) => {
    const mapping = ALIGNMENT_MAP[index];
    setAlignItems(mapping.alignItems);
    setJustifyContent(mapping.justifyContent);
    emitKeyword("alignItems", mapping.alignItems);
    emitKeyword("justifyContent", mapping.justifyContent);
  }, [emitKeyword]);

  return (
    <DogfoodBoundary name="LayoutSection" file="designer/sections/LayoutSection.tsx" category="designer">
    <div className="space-y-3">
      {/* Display tabs */}
      <div className="flex gap-1 bg-neutral-800/50 rounded-md p-0.5">
        {(["block", "flex", "grid", "none"] as const).map((d) => (
          <button
            key={d}
            onClick={() => {
              setDisplay(d);
              emitKeyword("display", d);
            }}
            className={`flex-1 py-1 text-xs rounded-md transition-colors ${
              display === d
                ? "bg-neutral-800 text-neutral-200"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {/* Flex controls */}
      {display === "flex" && (
        <>
          {/* Direction */}
          <div>
            <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
              Direction
            </label>
            <div className="flex gap-1">
              {([
                { value: "row", icon: "\u2192", label: "Row" },
                { value: "column", icon: "\u2193", label: "Col" },
                { value: "row-reverse", icon: "\u2190", label: "Row Rev" },
                { value: "column-reverse", icon: "\u2191", label: "Col Rev" },
              ] as { value: FlexDirection; icon: string; label: string }[]).map((d) => (
                <button
                  key={d.value}
                  onClick={() => {
                    setDirection(d.value);
                    emitKeyword("flexDirection", d.value);
                  }}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors flex items-center justify-center gap-1 ${
                    direction === d.value
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 border border-transparent"
                  }`}
                  title={d.label}
                >
                  {d.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Wrap */}
          <div>
            <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
              Wrap
            </label>
            <div className="flex gap-1">
              {([
                { value: "nowrap", label: "No Wrap" },
                { value: "wrap", label: "Wrap" },
                { value: "wrap-reverse", label: "Reverse" },
              ] as { value: FlexWrap; label: string }[]).map((w) => (
                <button
                  key={w.value}
                  onClick={() => {
                    setWrap(w.value);
                    emitKeyword("flexWrap", w.value);
                  }}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    wrap === w.value
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 border border-transparent"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* 9-point alignment grid + Gap */}
          <div>
            <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
              Alignment
            </label>
            <div className="flex gap-3 items-start">
              <div className="grid grid-cols-3 gap-1 w-16 h-16 bg-neutral-800/50 rounded-md p-1.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleAlignmentClick(i)}
                    className={`w-full h-full rounded-sm transition-colors ${
                      selectedGridPos === i
                        ? "bg-blue-500"
                        : "bg-neutral-700/50 hover:bg-neutral-700"
                    }`}
                  />
                ))}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">Align Items</label>
                  <select
                    value={alignItems}
                    onChange={(e) => {
                      const newValue = e.target.value as AlignItems;
                      setAlignItems(newValue);
                      emitKeyword("alignItems", newValue);
                    }}
                    className="w-full h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200"
                  >
                    <option value="flex-start">Start</option>
                    <option value="center">Center</option>
                    <option value="flex-end">End</option>
                    <option value="stretch">Stretch</option>
                    <option value="baseline">Baseline</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">Justify</label>
                  <select
                    value={justifyContent}
                    onChange={(e) => {
                      const newValue = e.target.value as JustifyContent;
                      setJustifyContent(newValue);
                      emitKeyword("justifyContent", newValue);
                    }}
                    className="w-full h-7 bg-neutral-800/50 border border-neutral-700 rounded-md px-2 text-xs text-neutral-200"
                  >
                    <option value="flex-start">Start</option>
                    <option value="center">Center</option>
                    <option value="flex-end">End</option>
                    <option value="space-between">Between</option>
                    <option value="space-around">Around</option>
                    <option value="space-evenly">Evenly</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Gap */}
          <div>
            <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
              Gap
            </label>
            <div className="flex gap-1">
              {["0", "4", "8", "12", "16", "24"].map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setGap(g);
                    emitUnit("gap", parseInt(g, 10));
                  }}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    gap === g
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 border border-transparent"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Grid controls */}
      {display === "grid" && (
        <>
          {/* Columns */}
          <div>
            <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
              Columns
            </label>
            <div className="flex gap-1">
              {["1", "2", "3", "4", "6", "12"].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setGridColumns(c);
                    if (onStyleChange) {
                      onStyleChange("gridTemplateColumns", { type: "unparsed", value: `repeat(${c}, 1fr)` });
                    }
                  }}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    gridColumns === c
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 border border-transparent"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div>
            <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
              Rows
            </label>
            <div className="flex gap-1">
              {["auto", "1", "2", "3", "4"].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setGridRows(r);
                    if (onStyleChange) {
                      const value = r === "auto" ? "auto" : `repeat(${r}, 1fr)`;
                      onStyleChange("gridTemplateRows", { type: "unparsed", value });
                    }
                  }}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    gridRows === r
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 border border-transparent"
                  }`}
                >
                  {r === "auto" ? "Auto" : r}
                </button>
              ))}
            </div>
          </div>

          {/* Gap for grid */}
          <div>
            <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
              Gap
            </label>
            <div className="flex gap-1">
              {["0", "4", "8", "12", "16", "24"].map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setGap(g);
                    emitUnit("gap", parseInt(g, 10));
                  }}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    gap === g
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 border border-transparent"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Alignment for grid */}
          <div>
            <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5">
              Place Items
            </label>
            <div className="grid grid-cols-3 gap-1 w-16 h-16 bg-neutral-800/50 rounded-md p-1.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleAlignmentClick(i)}
                  className={`w-full h-full rounded-sm transition-colors ${
                    selectedGridPos === i
                      ? "bg-blue-500"
                      : "bg-neutral-700/50 hover:bg-neutral-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Block display - minimal controls */}
      {display === "block" && (
        <div className="text-xs text-neutral-400 py-2">
          Block elements stack vertically and take full width.
        </div>
      )}

      {/* None display - info */}
      {display === "none" && (
        <div className="text-xs text-neutral-400 py-2">
          Element is hidden from the layout.
        </div>
      )}
    </div>
    </DogfoodBoundary>
  );
}

export default LayoutSection;
