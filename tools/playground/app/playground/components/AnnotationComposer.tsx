"use client";

import { useState } from "react";
import { ComposerShell, ComposerLabel, ComposerPill } from "./ComposerShell";

interface AnnotationComposerProps {
  componentId: string;
  x: number;
  y: number;
  /** Pixel position relative to the card render area, for visual placement. anchorBottom is set instead of anchorTop when the popover flips above the anchor. */
  anchorLeft: number;
  anchorTop?: number;
  anchorBottom?: number;
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
  /** Element to auto-capture for screenshots */
  captureTarget?: HTMLElement | null;
}

const INTENTS = ["fix", "change", "question", "create"] as const;
const PRIORITIES = ["P1", "P2", "P3", "P4"] as const;

const DIFFICULTY_COLORS: Record<string, string> = {
  P1: "bg-danger/20 text-danger",
  P2: "bg-accent-soft/20 text-accent-soft",
  P3: "bg-warning/20 text-warning",
  P4: "bg-success/20 text-success",
};

export function AnnotationComposer({
  componentId,
  x,
  y,
  anchorLeft,
  anchorTop,
  anchorBottom,
  variant,
  forcedState,
  onSubmit,
  onCancel,
  availableStates,
  currentColorMode,
  currentForcedState,
  captureTarget,
}: AnnotationComposerProps) {
  const [intent, setIntent] = useState<(typeof INTENTS)[number]>("change");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number] | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedStates, setSelectedStates] = useState<string[]>(
    currentForcedState && currentForcedState !== "default" ? [currentForcedState] : []
  );
  const [selectedColorModes, setSelectedColorModes] = useState<Set<"light" | "dark">>(
    new Set([currentColorMode])
  );

  const handleSubmit = async (message: string, screenshots: string[]) => {
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
          colorMode: selectedColorModes.size > 0 ? [...selectedColorModes].join(",") : undefined,
          forcedState: selectedStates.length > 0 ? selectedStates.join(",") : undefined,
          screenshots: screenshots.length > 0 ? screenshots : undefined,
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

  const isCreate = intent === "create";
  const nonDefaultStates = availableStates.filter(s => s !== "default");

  return (
    <ComposerShell
      isOpen={true}
      position={{ left: anchorLeft, top: anchorTop, bottom: anchorBottom }}
      headerLabel={isCreate ? "New variation" : "New annotation"}
      placeholder={isCreate ? "Describe the variation you want..." : "What needs attention here?"}
      submitLabel={isCreate ? "Create" : "Pin"}
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      requireMessage={!isCreate}
      captureTarget={captureTarget}
    >
      <div className="flex flex-col gap-2">
        {/* Intent picker */}
        <div className="flex flex-col gap-1">
          <ComposerLabel>Intent</ComposerLabel>
          <div className="flex gap-1">
            {INTENTS.map((i) => (
              <ComposerPill
                key={i}
                active={intent === i}
                onClick={() => setIntent(i)}
              >
                {i}
              </ComposerPill>
            ))}
          </div>
        </div>

        {/* Priority picker (hidden for create intent) */}
        {!isCreate && (
          <div className="flex flex-col gap-1">
            <ComposerLabel>Difficulty</ComposerLabel>
            <div className="flex gap-1">
              {PRIORITIES.map((p) => (
                <ComposerPill
                  key={p}
                  active={priority === p}
                  activeClassName={DIFFICULTY_COLORS[p]}
                  onClick={() => setPriority(prev => prev === p ? "" : p)}
                >
                  {p}
                </ComposerPill>
              ))}
            </div>
          </div>
        )}

        {/* Color mode */}
        <div className="flex flex-col gap-1">
          <ComposerLabel>Mode</ComposerLabel>
          <div className="flex gap-1">
            {(["light", "dark"] as const).map((mode) => (
              <ComposerPill
                key={mode}
                active={selectedColorModes.has(mode)}
                onClick={() => setSelectedColorModes(prev => {
                  const next = new Set(prev);
                  if (next.has(mode)) next.delete(mode);
                  else next.add(mode);
                  return next;
                })}
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
