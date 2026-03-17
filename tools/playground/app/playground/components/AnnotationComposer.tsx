"use client";

import { useState, type ReactNode } from "react";
import { Wrench, Pencil, Question, Sparkles, Moon } from "@rdna/radiants/icons/generated";
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

const INTENT_ICONS: Record<string, ReactNode> = {
  fix: <Wrench size={12} />,
  change: <Pencil size={12} />,
  question: <Question size={12} />,
  create: <Sparkles size={12} />,
};

const PRIORITY_DOT_COLORS: Record<string, string> = {
  P1: "bg-danger",
  P2: "bg-warning",
  P3: "bg-link",
  P4: "bg-mute",
};

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
        {/* Intent + Priority — inline row */}
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
            {INTENTS.map((i) => (
              <ComposerPill
                key={i}
                active={intent === i}
                onClick={() => setIntent(i)}
                title={i.charAt(0).toUpperCase() + i.slice(1)}
              >
                {INTENT_ICONS[i]}
              </ComposerPill>
            ))}
          </div>

          {!isCreate && (
            <>
              <span className="h-3 w-px bg-rule" />
              <div className="flex gap-1">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(prev => prev === p ? "" : p)}
                    title={p}
                    className={`h-3 w-3 rounded-full border transition-colors ${
                      priority === p
                        ? `${PRIORITY_DOT_COLORS[p]} border-transparent scale-125`
                        : "border-rule bg-transparent hover:border-mute"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Color mode + States — inline row */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <ComposerPill
              active={selectedColorModes.has("light")}
              onClick={() => setSelectedColorModes(prev => {
                const next = new Set(prev);
                if (next.has("light")) next.delete("light");
                else next.add("light");
                return next;
              })}
              title="Light mode"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </ComposerPill>
            <ComposerPill
              active={selectedColorModes.has("dark")}
              onClick={() => setSelectedColorModes(prev => {
                const next = new Set(prev);
                if (next.has("dark")) next.delete("dark");
                else next.add("dark");
                return next;
              })}
              title="Dark mode"
            >
              <Moon size={12} />
            </ComposerPill>
          </div>

          {nonDefaultStates.length > 0 && (
            <>
              <span className="h-3 w-px bg-rule" />
              <div className="flex flex-wrap gap-0.5">
                {nonDefaultStates.map((state) => (
                  <ComposerPill
                    key={state}
                    active={selectedStates.includes(state)}
                    onClick={() => setSelectedStates(prev =>
                      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
                    )}
                    title={state}
                  >
                    {state}
                  </ComposerPill>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </ComposerShell>
  );
}
