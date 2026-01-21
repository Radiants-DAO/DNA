/**
 * SpacingSection Component
 *
 * Controls for margin, padding, and gap with a Chrome DevTools style box model UI.
 * Supports linked/unlinked editing of sides.
 */

import { useState } from "react";
import type { BaseSectionProps } from "./types";

type SpacingSide = "top" | "right" | "bottom" | "left";
type SpacingType = "margin" | "padding";

interface SpacingValues {
  margin: { top: string; right: string; bottom: string; left: string };
  padding: { top: string; right: string; bottom: string; left: string };
  gap: string;
}

export function SpacingSection(_props: BaseSectionProps) {
  const [values, setValues] = useState<SpacingValues>({
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    padding: { top: "16", right: "16", bottom: "16", left: "16" },
    gap: "8",
  });
  const [activeInput, setActiveInput] = useState<{ type: SpacingType; side: SpacingSide } | null>(null);
  const [marginLinked, setMarginLinked] = useState(true);
  const [paddingLinked, setPaddingLinked] = useState(true);
  const [showTokenPicker, setShowTokenPicker] = useState(false);

  // Common spacing tokens
  const spacingTokens = ["0", "2", "4", "6", "8", "12", "16", "20", "24", "32", "40", "48", "64"];

  // Handle value change
  const handleValueChange = (type: SpacingType, side: SpacingSide, newValue: string) => {
    const isLinked = type === "margin" ? marginLinked : paddingLinked;

    setValues((prev) => {
      if (isLinked) {
        // Update all sides when linked
        return {
          ...prev,
          [type]: { top: newValue, right: newValue, bottom: newValue, left: newValue },
        };
      } else {
        // Update only the specific side
        return {
          ...prev,
          [type]: { ...prev[type], [side]: newValue },
        };
      }
    });
  };

  // Handle clicking on a value to edit
  const handleValueClick = (type: SpacingType, side: SpacingSide) => {
    if (activeInput?.type === type && activeInput?.side === side) {
      setActiveInput(null);
      setShowTokenPicker(false);
    } else {
      setActiveInput({ type, side });
      setShowTokenPicker(true);
    }
  };

  // Handle token selection
  const handleTokenSelect = (token: string) => {
    if (activeInput) {
      handleValueChange(activeInput.type, activeInput.side, token);
    }
    setShowTokenPicker(false);
    setActiveInput(null);
  };

  // Handle gap change
  const handleGapChange = (newGap: string) => {
    setValues((prev) => ({ ...prev, gap: newGap }));
  };

  // Render editable value button
  const renderValue = (type: SpacingType, side: SpacingSide) => {
    const value = values[type][side];
    const isActive = activeInput?.type === type && activeInput?.side === side;
    const colorClass = type === "margin" ? "text-orange-400" : "text-green-400";
    const bgClass = type === "margin"
      ? (isActive ? "bg-orange-500/30" : "hover:bg-orange-500/20")
      : (isActive ? "bg-green-500/30" : "hover:bg-green-500/20");

    return (
      <button
        onClick={() => handleValueClick(type, side)}
        className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${colorClass} ${bgClass}`}
      >
        {value || "-"}
      </button>
    );
  };

  // Link icon SVG component
  const LinkIcon = ({ linked }: { linked: boolean }) => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {linked ? (
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      ) : (
        <>
          <path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-3 3a5 5 0 0 0 .54 7.54" />
          <path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l3-3a5 5 0 0 0-.54-7.54" />
        </>
      )}
    </svg>
  );

  return (
    <div className="space-y-3">
      {/* Chrome DevTools style box model */}
      <div className="relative">
        {/* Margin (outer box) */}
        <div className="bg-orange-500/10 rounded-lg p-1 relative">
          {/* Margin label */}
          <div className="absolute top-1 left-2 text-[9px] text-orange-400/70 uppercase tracking-wider font-medium">
            margin
          </div>

          {/* Link toggle for margin */}
          <button
            onClick={() => setMarginLinked(!marginLinked)}
            className={`absolute top-1 right-2 p-0.5 rounded transition-colors ${
              marginLinked ? "text-orange-400" : "text-orange-400/40"
            }`}
            title={marginLinked ? "Unlink margin values" : "Link margin values"}
          >
            <LinkIcon linked={marginLinked} />
          </button>

          {/* Margin top */}
          <div className="flex justify-center pt-3 pb-1">
            {renderValue("margin", "top")}
          </div>

          {/* Middle row: margin-left, padding box, margin-right */}
          <div className="flex items-center">
            {/* Margin left */}
            <div className="w-8 flex justify-center">
              {renderValue("margin", "left")}
            </div>

            {/* Padding (inner box) */}
            <div className="flex-1 bg-green-500/10 rounded-md p-1 relative mx-1">
              {/* Padding label */}
              <div className="absolute top-0.5 left-2 text-[9px] text-green-400/70 uppercase tracking-wider font-medium">
                padding
              </div>

              {/* Link toggle for padding */}
              <button
                onClick={() => setPaddingLinked(!paddingLinked)}
                className={`absolute top-0.5 right-2 p-0.5 rounded transition-colors ${
                  paddingLinked ? "text-green-400" : "text-green-400/40"
                }`}
                title={paddingLinked ? "Unlink padding values" : "Link padding values"}
              >
                <LinkIcon linked={paddingLinked} />
              </button>

              {/* Padding top */}
              <div className="flex justify-center pt-2.5 pb-1">
                {renderValue("padding", "top")}
              </div>

              {/* Middle row: padding-left, content, padding-right */}
              <div className="flex items-center justify-between">
                <div className="w-8 flex justify-center">
                  {renderValue("padding", "left")}
                </div>

                {/* Content box */}
                <div className="flex-1 mx-1 h-7 bg-primary/20 rounded border border-primary/30 flex items-center justify-center">
                  <span className="text-[9px] text-primary/70 uppercase tracking-wider">content</span>
                </div>

                <div className="w-8 flex justify-center">
                  {renderValue("padding", "right")}
                </div>
              </div>

              {/* Padding bottom */}
              <div className="flex justify-center pt-1 pb-2">
                {renderValue("padding", "bottom")}
              </div>
            </div>

            {/* Margin right */}
            <div className="w-8 flex justify-center">
              {renderValue("margin", "right")}
            </div>
          </div>

          {/* Margin bottom */}
          <div className="flex justify-center pt-1 pb-2">
            {renderValue("margin", "bottom")}
          </div>
        </div>
      </div>

      {/* Token picker (shows when editing) */}
      {showTokenPicker && activeInput && (
        <div className="bg-background/80 rounded-md p-2 border border-white/10">
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">
            {activeInput.type}-{activeInput.side}
          </div>
          <div className="flex flex-wrap gap-1">
            {spacingTokens.map((token) => (
              <button
                key={token}
                onClick={() => handleTokenSelect(token)}
                className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
                  values[activeInput.type][activeInput.side] === token
                    ? "bg-primary/30 text-primary border border-primary/50"
                    : "bg-white/5 text-text-muted hover:bg-white/10 hover:text-text border border-transparent"
                }`}
              >
                {token}
              </button>
            ))}
          </div>
          {/* Custom value input */}
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              placeholder="Custom value..."
              className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleTokenSelect((e.target as HTMLInputElement).value);
                }
              }}
            />
            <button
              onClick={() => {
                setShowTokenPicker(false);
                setActiveInput(null);
              }}
              className="px-2 py-1 text-xs text-text-muted hover:text-text bg-white/5 rounded-md"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Gap control */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
          Gap <span className="text-text-muted/50">(flex/grid)</span>
        </label>
        <div className="flex gap-1">
          {["0", "4", "8", "12", "16", "24"].map((g) => (
            <button
              key={g}
              onClick={() => handleGapChange(g)}
              className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                values.gap === g
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-text-muted hover:text-text border border-transparent"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SpacingSection;
