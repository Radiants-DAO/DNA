"use client";

import { useState } from "react";
import { ToggleGroup } from "@rdna/radiants/components/core";
import { ComposerShell, ComposerLabel, ComposerPill } from "./ComposerShell";

interface AnnotationComposerProps {
  componentId: string;
  x: number;
  y: number;
  /** Pixel position relative to the card render area, for visual placement */
  anchorLeft: number;
  anchorTop: number;
  /** Which variant sub-card was clicked */
  variant?: string;
  /** Current forced interaction state */
  forcedState?: string;
  onSubmit: () => void;
  onCancel: () => void;
  /** Available interaction states from the component */
  availableStates: string[];
  /** Current color mode from parent card */
  currentColorMode: "light" | "dark";
  /** Current forced state from parent card's state strip */
  currentForcedState: string;
}

const INTENTS = ["fix", "change", "question"] as const;
const PRIORITIES = ["P1", "P2", "P3", "P4"] as const;

export function AnnotationComposer({
  componentId,
  x,
  y,
  anchorLeft,
  anchorTop,
  variant,
  forcedState,
  onSubmit,
  onCancel,
  availableStates,
  currentColorMode,
  currentForcedState,
}: AnnotationComposerProps) {
  const [intent, setIntent] = useState<(typeof INTENTS)[number]>("change");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number] | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedStates, setSelectedStates] = useState<string[]>(
    currentForcedState && currentForcedState !== "default" ? [currentForcedState] : []
  );
  const [selectedColorMode, setSelectedColorMode] = useState<"light" | "dark" | null>(currentColorMode);

  const handleSubmit = async (message: string) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/playground/api/agent/annotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "annotate",
          componentId,
          message,
          intent,
          priority: priority || undefined,
          x,
          y,
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

  const nonDefaultStates = availableStates.filter(s => s !== "default");

  return (
    <ComposerShell
      position={{ left: anchorLeft, top: anchorTop + 4 }}
      headerLabel="New annotation"
      placeholder="What needs attention here?"
      submitLabel="Pin"
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    >
      <div className="flex flex-col gap-2">
        {/* Intent picker */}
        <div className="flex flex-col gap-1">
          <ComposerLabel>Intent</ComposerLabel>
          <ToggleGroup
            value={[intent]}
            onValueChange={(v) => { if (v.length) setIntent(v[0] as typeof intent); }}
            size="sm"
          >
            {INTENTS.map((i) => (
              <ToggleGroup.Item key={i} value={i}>{i}</ToggleGroup.Item>
            ))}
          </ToggleGroup>
        </div>

        {/* Priority picker */}
        <div className="flex flex-col gap-1">
          <ComposerLabel>Priority</ComposerLabel>
          <ToggleGroup
            value={priority ? [priority] : []}
            onValueChange={(v) => setPriority(v.length ? (v[0] as typeof priority) : "")}
            size="sm"
          >
            {PRIORITIES.map((p) => (
              <ToggleGroup.Item key={p} value={p}>{p}</ToggleGroup.Item>
            ))}
          </ToggleGroup>
        </div>

        {/* Color mode */}
        <div className="flex flex-col gap-1">
          <ComposerLabel>Mode</ComposerLabel>
          <div className="flex gap-1">
            {(["light", "dark"] as const).map((mode) => (
              <ComposerPill
                key={mode}
                active={selectedColorMode === mode}
                onClick={() => setSelectedColorMode(prev => prev === mode ? null : mode)}
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
                  onClick={() => setSelectedStates(prev =>
                    prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
                  )}
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
