"use client";

import { useRef, useState, useEffect } from "react";
import { ToggleGroup } from "@rdna/radiants/components/core";

interface AnnotationComposerProps {
  componentId: string;
  x: number;
  y: number;
  /** Pixel position relative to the card render area, for visual placement */
  anchorLeft: number;
  anchorTop: number;
  onSubmit: () => void;
  onCancel: () => void;
}

const INTENTS = ["fix", "change", "question"] as const;
const PRIORITIES = ["P1", "P2", "P3", "P4"] as const;

export function AnnotationComposer({
  componentId,
  x,
  y,
  anchorLeft,
  anchorTop,
  onSubmit,
  onCancel,
}: AnnotationComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState("");
  const [intent, setIntent] = useState<(typeof INTENTS)[number]>("change");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number] | "">("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/playground/api/agent/annotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "annotate",
          componentId,
          message: message.trim(),
          intent,
          priority: priority || undefined,
          x,
          y,
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
        <div className="border-b border-[rgba(254,248,226,0.1)] px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[rgba(254,248,226,0.5)]">
            New annotation
          </span>
        </div>

        <div className="flex flex-col gap-2 p-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs attention here?"
            rows={3}
            className="w-full resize-none rounded-xs border border-[rgba(254,248,226,0.12)] bg-[#0F0E0C] px-2 py-1.5 font-mono text-xs text-[#FEF8E2] placeholder:text-[rgba(254,248,226,0.3)] focus:border-[rgba(254,248,226,0.3)] focus:outline-none"
          />

          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[rgba(254,248,226,0.4)]">
                Intent
              </span>
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
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[rgba(254,248,226,0.4)]">
                Priority
              </span>
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
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[9px] text-[rgba(254,248,226,0.3)]">
              ⌘+Enter to submit
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
                disabled={!message.trim() || submitting}
                className="rounded-xs border border-[rgba(254,248,226,0.2)] bg-[rgba(254,248,226,0.08)] px-2 py-1 font-mono text-[10px] text-[#FEF8E2] hover:bg-[rgba(254,248,226,0.14)] disabled:opacity-40"
              >
                {submitting ? "..." : "Pin"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
