/**
 * FlexChildSection Component
 *
 * Controls for flex child properties (flex-grow, flex-shrink, flex-basis, align-self, order).
 * This section is context-aware - it only shows when the parent element has display: flex.
 */

import { useState } from "react";
import type { BaseSectionProps, AlignItems } from "./types";

type AlignSelf = AlignItems | "auto";
type FlexBasisUnit = "px" | "rem" | "%" | "auto";

export function FlexChildSection(_props: BaseSectionProps) {
  const [flexGrow, setFlexGrow] = useState("0");
  const [flexShrink, setFlexShrink] = useState("1");
  const [flexBasis, setFlexBasis] = useState({ value: "", unit: "auto" as FlexBasisUnit });
  const [alignSelf, setAlignSelf] = useState<AlignSelf>("auto");
  const [order, setOrder] = useState("0");

  const alignSelfOptions: { value: AlignSelf; label: string }[] = [
    { value: "auto", label: "Auto" },
    { value: "flex-start", label: "Start" },
    { value: "center", label: "Center" },
    { value: "flex-end", label: "End" },
    { value: "stretch", label: "Stretch" },
    { value: "baseline", label: "Baseline" },
  ];

  return (
    <div className="space-y-3">
      {/* Flex Shorthand Presets */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Flex Preset
        </label>
        <div className="flex gap-1">
          {[
            { label: "None", grow: "0", shrink: "0", basis: "auto" },
            { label: "Grow", grow: "1", shrink: "0", basis: "0%" },
            { label: "Shrink", grow: "0", shrink: "1", basis: "auto" },
            { label: "Auto", grow: "1", shrink: "1", basis: "auto" },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setFlexGrow(preset.grow);
                setFlexShrink(preset.shrink);
                if (preset.basis === "0%") {
                  setFlexBasis({ value: "0", unit: "%" });
                } else {
                  setFlexBasis({ value: "", unit: "auto" });
                }
              }}
              className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                flexGrow === preset.grow && flexShrink === preset.shrink
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted hover:text-text border border-transparent"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grow / Shrink */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
            Grow
          </label>
          <input
            type="text"
            value={flexGrow}
            onChange={(e) => setFlexGrow(e.target.value)}
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
            Shrink
          </label>
          <input
            type="text"
            value={flexShrink}
            onChange={(e) => setFlexShrink(e.target.value)}
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
            placeholder="1"
          />
        </div>
      </div>

      {/* Flex Basis */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
          Basis
        </label>
        <div className="flex gap-1">
          <input
            type="text"
            value={flexBasis.unit === "auto" ? "" : flexBasis.value}
            onChange={(e) => setFlexBasis({ ...flexBasis, value: e.target.value })}
            placeholder="auto"
            disabled={flexBasis.unit === "auto"}
            className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono disabled:opacity-50"
          />
          <select
            value={flexBasis.unit}
            onChange={(e) => setFlexBasis({ ...flexBasis, unit: e.target.value as FlexBasisUnit })}
            className="h-7 bg-background/50 border border-white/8 rounded-md px-1 text-[10px] text-text-muted w-14"
          >
            <option value="auto">AUTO</option>
            <option value="px">PX</option>
            <option value="rem">REM</option>
            <option value="%">%</option>
          </select>
        </div>
      </div>

      {/* Align Self */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Align Self
        </label>
        <select
          value={alignSelf}
          onChange={(e) => setAlignSelf(e.target.value as AlignSelf)}
          className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
        >
          {alignSelfOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Order */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">
          Order
        </label>
        <input
          type="text"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
          placeholder="0"
        />
      </div>
    </div>
  );
}

export default FlexChildSection;
