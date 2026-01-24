/**
 * LayoutSection Component
 *
 * Controls for CSS display, flex/grid layout properties.
 * Shows different controls based on selected display type.
 */

import { useState } from "react";
import type {
  BaseSectionProps,
  DisplayType,
  FlexDirection,
  FlexWrap,
  AlignItems,
  JustifyContent,
} from "./types";
import { ALIGNMENT_MAP } from "./types";

export function LayoutSection(_props: BaseSectionProps) {
  const [display, setDisplay] = useState<DisplayType>("flex");
  const [direction, setDirection] = useState<FlexDirection>("row");
  const [wrap, setWrap] = useState<FlexWrap>("nowrap");
  const [alignItems, setAlignItems] = useState<AlignItems>("center");
  const [justifyContent, setJustifyContent] = useState<JustifyContent>("center");
  const [gap, setGap] = useState("8");
  const [gridColumns, setGridColumns] = useState("2");
  const [gridRows, setGridRows] = useState("auto");

  // Find selected alignment grid position
  const selectedGridPos = ALIGNMENT_MAP.findIndex(
    (m) => m.alignItems === alignItems && m.justifyContent === justifyContent
  );

  // Handle alignment grid click
  const handleAlignmentClick = (index: number) => {
    const mapping = ALIGNMENT_MAP[index];
    setAlignItems(mapping.alignItems);
    setJustifyContent(mapping.justifyContent);
  };

  return (
    <div className="space-y-3">
      {/* Display tabs */}
      <div className="flex gap-1 bg-background/50 rounded-md p-0.5">
        {(["block", "flex", "grid", "none"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDisplay(d)}
            className={`flex-1 py-1 text-xs rounded-md transition-colors ${
              display === d
                ? "bg-surface text-text"
                : "text-text-muted hover:text-text"
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
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
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
                  onClick={() => setDirection(d.value)}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors flex items-center justify-center gap-1 ${
                    direction === d.value
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-background/50 text-text-muted hover:text-text border border-transparent"
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
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
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
                  onClick={() => setWrap(w.value)}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    wrap === w.value
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-background/50 text-text-muted hover:text-text border border-transparent"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* 9-point alignment grid + Gap */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
              Alignment
            </label>
            <div className="flex gap-3 items-start">
              <div className="grid grid-cols-3 gap-1 w-16 h-16 bg-background/50 rounded-md p-1.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleAlignmentClick(i)}
                    className={`w-full h-full rounded-sm transition-colors ${
                      selectedGridPos === i
                        ? "bg-primary"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  />
                ))}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <label className="text-[10px] text-text-muted block mb-1">Align Items</label>
                  <select
                    value={alignItems}
                    onChange={(e) => setAlignItems(e.target.value as AlignItems)}
                    className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
                  >
                    <option value="flex-start">Start</option>
                    <option value="center">Center</option>
                    <option value="flex-end">End</option>
                    <option value="stretch">Stretch</option>
                    <option value="baseline">Baseline</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-text-muted block mb-1">Justify</label>
                  <select
                    value={justifyContent}
                    onChange={(e) => setJustifyContent(e.target.value as JustifyContent)}
                    className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
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
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
              Gap
            </label>
            <div className="flex gap-1">
              {["0", "4", "8", "12", "16", "24"].map((g) => (
                <button
                  key={g}
                  onClick={() => setGap(g)}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    gap === g
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-background/50 text-text-muted hover:text-text border border-transparent"
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
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
              Columns
            </label>
            <div className="flex gap-1">
              {["1", "2", "3", "4", "6", "12"].map((c) => (
                <button
                  key={c}
                  onClick={() => setGridColumns(c)}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    gridColumns === c
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-background/50 text-text-muted hover:text-text border border-transparent"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
              Rows
            </label>
            <div className="flex gap-1">
              {["auto", "1", "2", "3", "4"].map((r) => (
                <button
                  key={r}
                  onClick={() => setGridRows(r)}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    gridRows === r
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-background/50 text-text-muted hover:text-text border border-transparent"
                  }`}
                >
                  {r === "auto" ? "Auto" : r}
                </button>
              ))}
            </div>
          </div>

          {/* Gap for grid */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
              Gap
            </label>
            <div className="flex gap-1">
              {["0", "4", "8", "12", "16", "24"].map((g) => (
                <button
                  key={g}
                  onClick={() => setGap(g)}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    gap === g
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-background/50 text-text-muted hover:text-text border border-transparent"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Alignment for grid */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
              Place Items
            </label>
            <div className="grid grid-cols-3 gap-1 w-16 h-16 bg-background/50 rounded-md p-1.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleAlignmentClick(i)}
                  className={`w-full h-full rounded-sm transition-colors ${
                    selectedGridPos === i
                      ? "bg-primary"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Block display - minimal controls */}
      {display === "block" && (
        <div className="text-xs text-text-muted py-2">
          Block elements stack vertically and take full width.
        </div>
      )}

      {/* None display - info */}
      {display === "none" && (
        <div className="text-xs text-text-muted py-2">
          Element is hidden from the layout.
        </div>
      )}
    </div>
  );
}

export default LayoutSection;
