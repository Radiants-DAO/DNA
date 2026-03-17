"use client";

import { useState } from "react";
import { ComposerShell, ComposerLabel, ComposerPill } from "./ComposerShell";

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
  const [submitting, setSubmitting] = useState(false);
  const [selectedStates, setSelectedStates] = useState<string[]>(
    currentForcedState && currentForcedState !== "default"
      ? [currentForcedState]
      : []
  );
  const [selectedColorMode, setSelectedColorMode] = useState<
    "light" | "dark" | null
  >(currentColorMode);

  const handleSubmit = async (instructions: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/playground/api/agent/annotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "annotate",
          componentId,
          intent: "variation",
          message: instructions || `Generate variation for "${variant}"`,
          variant,
          colorMode: selectedColorMode ?? undefined,
          forcedState: selectedStates.length > 0 ? selectedStates.join(",") : undefined,
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

  const nonDefaultStates = availableStates.filter((s) => s !== "default");

  return (
    <ComposerShell
      position={{ left: anchorLeft, top: anchorTop + 4 }}
      headerLabel={`New variation — ${variant}`}
      placeholder="Describe the variation you want..."
      submitLabel="Generate"
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      requireMessage={false}
    >
      <div className="flex flex-col gap-2">
        {/* Color mode */}
        <div className="flex flex-col gap-1">
          <ComposerLabel>Mode</ComposerLabel>
          <div className="flex gap-1">
            {(["light", "dark"] as const).map((mode) => (
              <ComposerPill
                key={mode}
                active={selectedColorMode === mode}
                onClick={() =>
                  setSelectedColorMode((prev) =>
                    prev === mode ? null : mode
                  )
                }
              >
                {mode}
              </ComposerPill>
            ))}
          </div>
        </div>

        {/* Interaction states */}
        {nonDefaultStates.length > 0 && (
          <div className="flex flex-col gap-1">
            <ComposerLabel>States</ComposerLabel>
            <div className="flex flex-wrap gap-1">
              {nonDefaultStates.map((state) => (
                <ComposerPill
                  key={state}
                  active={selectedStates.includes(state)}
                  onClick={() =>
                    setSelectedStates((prev) =>
                      prev.includes(state)
                        ? prev.filter((s) => s !== state)
                        : [...prev, state]
                    )
                  }
                >
                  {state}
                </ComposerPill>
              ))}
            </div>
          </div>
        )}
      </div>
    </ComposerShell>
  );
}
