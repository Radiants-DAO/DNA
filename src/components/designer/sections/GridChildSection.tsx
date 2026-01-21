/**
 * GridChildSection Component
 *
 * Controls for grid child properties (grid-column, grid-row, grid-area, justify-self, align-self).
 * This section is context-aware - it only shows when the parent element has display: grid.
 */

import { useState } from "react";
import type { BaseSectionProps } from "./types";

type PlaceSelf = "auto" | "start" | "center" | "end" | "stretch";

export function GridChildSection(_props: BaseSectionProps) {
  const [columnStart, setColumnStart] = useState("auto");
  const [columnSpan, setColumnSpan] = useState("1");
  const [rowStart, setRowStart] = useState("auto");
  const [rowSpan, setRowSpan] = useState("1");
  const [justifySelf, setJustifySelf] = useState<PlaceSelf>("auto");
  const [alignSelf, setAlignSelf] = useState<PlaceSelf>("auto");
  const [gridArea, setGridArea] = useState("");

  const placeSelfOptions: { value: PlaceSelf; label: string }[] = [
    { value: "auto", label: "Auto" },
    { value: "start", label: "Start" },
    { value: "center", label: "Center" },
    { value: "end", label: "End" },
    { value: "stretch", label: "Stretch" },
  ];

  return (
    <div className="space-y-3">
      {/* Grid Column */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Column
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] text-text-muted block mb-1">Start</label>
            <input
              type="text"
              value={columnStart}
              onChange={(e) => setColumnStart(e.target.value)}
              className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
              placeholder="auto"
            />
          </div>
          <div>
            <label className="text-[9px] text-text-muted block mb-1">Span</label>
            <input
              type="text"
              value={columnSpan}
              onChange={(e) => setColumnSpan(e.target.value)}
              className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
              placeholder="1"
            />
          </div>
        </div>
      </div>

      {/* Grid Row */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Row
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] text-text-muted block mb-1">Start</label>
            <input
              type="text"
              value={rowStart}
              onChange={(e) => setRowStart(e.target.value)}
              className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
              placeholder="auto"
            />
          </div>
          <div>
            <label className="text-[9px] text-text-muted block mb-1">Span</label>
            <input
              type="text"
              value={rowSpan}
              onChange={(e) => setRowSpan(e.target.value)}
              className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
              placeholder="1"
            />
          </div>
        </div>
      </div>

      {/* Grid Area (named) */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
          Grid Area <span className="text-text-muted/50">(named)</span>
        </label>
        <input
          type="text"
          value={gridArea}
          onChange={(e) => setGridArea(e.target.value)}
          className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
          placeholder="e.g. header, sidebar"
        />
      </div>

      {/* Justify Self */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Justify Self
        </label>
        <div className="flex gap-1">
          {placeSelfOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setJustifySelf(opt.value)}
              className={`flex-1 py-1.5 text-[10px] rounded-md transition-colors ${
                justifySelf === opt.value
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted hover:text-text border border-transparent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Align Self */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Align Self
        </label>
        <div className="flex gap-1">
          {placeSelfOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setAlignSelf(opt.value)}
              className={`flex-1 py-1.5 text-[10px] rounded-md transition-colors ${
                alignSelf === opt.value
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted hover:text-text border border-transparent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GridChildSection;
