"use client";

import { useRef, useState, useEffect } from "react";

interface VariationComposerProps {
  componentId: string;
  /** Which variant sub-card was clicked (e.g. "default", "ghost", "outlined") */
  variant: string;
  /** Pixel position relative to the card render area, for visual placement */
  anchorLeft: number;
  anchorTop: number;
  /** Available interaction states for this component */
  availableStates: string[];
  /** Current color mode from global toggle */
  currentColorMode: "light" | "dark";
  /** Current forced state from the card's state strip */
  currentForcedState: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export function VariationComposer({
  componentId,
  variant,
  anchorLeft,
  anchorTop,
  availableStates,
  currentColorMode,
  currentForcedState,
  onSubmit,
  onCancel,
}: VariationComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedStates, setSelectedStates] = useState<string[]>(
    currentForcedState && currentForcedState !== "default"
      ? [currentForcedState]
      : []
  );
  const [selectedColorMode, setSelectedColorMode] = useState<
    "light" | "dark" | null
  >(currentColorMode);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/playground/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentId,
          customInstructions: instructions.trim() || undefined,
          variant,
          colorMode: selectedColorMode ?? undefined,
          states: selectedStates.length > 0 ? selectedStates : undefined,
        }),
      });
      if (res.ok) {
        onSubmit();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      className="dark absolute z-30"
      style={{ left: anchorLeft, top: anchorTop + 4 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-64 rounded-sm border border-line bg-page shadow-lg">
        {/* Header */}
        <div className="border-b border-[rgba(254,248,226,0.1)] px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[rgba(254,248,226,0.5)]">
            New variation — {variant}
          </span>
        </div>

        <div className="flex flex-col gap-2 p-3">
          {/* Instructions textarea */}
          <textarea
            ref={textareaRef}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the variation you want..."
            rows={3}
            className="w-full resize-none rounded-xs border border-[rgba(254,248,226,0.12)] bg-[#0F0E0C] px-2 py-1.5 font-mono text-xs text-[#FEF8E2] placeholder:text-[rgba(254,248,226,0.3)] focus:border-[rgba(254,248,226,0.3)] focus:outline-none"
          />

          {/* Color mode section */}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[rgba(254,248,226,0.4)]">
              Mode
            </span>
            <div className="flex gap-1">
              {(["light", "dark"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() =>
                    setSelectedColorMode((prev) =>
                      prev === mode ? null : mode
                    )
                  }
                  className={`rounded-xs px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                    selectedColorMode === mode
                      ? "bg-[rgba(254,248,226,0.14)] text-[#FEF8E2]"
                      : "text-[rgba(254,248,226,0.4)] hover:text-[rgba(254,248,226,0.6)]"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* States section - only show if there are non-default states */}
          {availableStates.filter((s) => s !== "default").length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[rgba(254,248,226,0.4)]">
                States
              </span>
              <div className="flex flex-wrap gap-1">
                {availableStates
                  .filter((s) => s !== "default")
                  .map((state) => (
                    <button
                      key={state}
                      onClick={() =>
                        setSelectedStates((prev) =>
                          prev.includes(state)
                            ? prev.filter((s) => s !== state)
                            : [...prev, state]
                        )
                      }
                      className={`rounded-xs px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                        selectedStates.includes(state)
                          ? "bg-[rgba(254,248,226,0.14)] text-[#FEF8E2]"
                          : "text-[rgba(254,248,226,0.4)] hover:text-[rgba(254,248,226,0.6)]"
                      }`}
                    >
                      {state}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Footer with submit */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[9px] text-[rgba(254,248,226,0.3)]">
              ⌘+Enter to generate
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={onCancel}
                className="rounded-xs px-2 py-1 font-mono text-[10px] text-[rgba(254,248,226,0.5)] hover:bg-[rgba(254,248,226,0.06)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xs border border-[rgba(254,248,226,0.2)] bg-[rgba(254,248,226,0.08)] px-2 py-1 font-mono text-[10px] text-[#FEF8E2] hover:bg-[rgba(254,248,226,0.14)] disabled:opacity-40"
              >
                {submitting ? "..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
