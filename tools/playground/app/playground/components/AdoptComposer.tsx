"use client";

import { useRef, useState, useEffect } from "react";

interface AdoptComposerProps {
  componentId: string;
  iterationFile: string;
  iterationLabel: string;
  availableVariants: string[];
  onSubmit: () => void;
  onCancel: () => void;
}

type AdoptionMode = "replacement" | "new-variant";

export function AdoptComposer({
  componentId,
  iterationFile,
  iterationLabel,
  availableVariants,
  onSubmit,
  onCancel,
}: AdoptComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [adoptionMode, setAdoptionMode] = useState<AdoptionMode>("replacement");
  const [targetVariant, setTargetVariant] = useState(availableVariants[0] ?? "default");

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/playground/api/agent/annotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "annotate",
          componentId,
          message: message.trim() || `Adopt ${iterationLabel}`,
          intent: "adopt",
          iterationFile,
          adoptionMode,
          targetVariant: adoptionMode === "replacement" ? targetVariant : undefined,
          x: 0,
          y: 0,
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
      className="dark absolute right-0 top-0 z-30"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-64 rounded-sm border border-line bg-page shadow-lg">
        {/* Header */}
        <div className="border-b border-[rgba(254,248,226,0.1)] px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[rgba(254,248,226,0.5)]">
            Adopt — {iterationLabel}
          </span>
        </div>

        <div className="flex flex-col gap-2 p-3">
          {/* Message textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what to adopt and any adjustments..."
            rows={3}
            className="w-full resize-none rounded-xs border border-[rgba(254,248,226,0.12)] bg-[#0F0E0C] px-2 py-1.5 font-mono text-xs text-[#FEF8E2] placeholder:text-[rgba(254,248,226,0.3)] focus:border-[rgba(254,248,226,0.3)] focus:outline-none"
          />

          {/* Adoption mode picker */}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[rgba(254,248,226,0.4)]">
              Mode
            </span>
            <div className="flex gap-1">
              {(["replacement", "new-variant"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAdoptionMode(mode)}
                  className={`rounded-xs px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                    adoptionMode === mode
                      ? "bg-[rgba(254,248,226,0.14)] text-[#FEF8E2]"
                      : "text-[rgba(254,248,226,0.4)] hover:text-[rgba(254,248,226,0.6)]"
                  }`}
                >
                  {mode === "replacement" ? "Replace existing" : "Add as new variant"}
                </button>
              ))}
            </div>
          </div>

          {/* Variant picker (only when replacing) */}
          {adoptionMode === "replacement" && availableVariants.length > 1 && (
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[rgba(254,248,226,0.4)]">
                Replace variant
              </span>
              <div className="flex flex-wrap gap-1">
                {availableVariants.map((v) => (
                  <button
                    key={v}
                    onClick={() => setTargetVariant(v)}
                    className={`rounded-xs px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                      targetVariant === v
                        ? "bg-[rgba(254,248,226,0.14)] text-[#FEF8E2]"
                        : "text-[rgba(254,248,226,0.4)] hover:text-[rgba(254,248,226,0.6)]"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
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
                disabled={submitting}
                className="rounded-xs border border-[rgba(254,248,226,0.2)] bg-[rgba(254,248,226,0.08)] px-2 py-1 font-mono text-[10px] text-[#FEF8E2] hover:bg-[rgba(254,248,226,0.14)] disabled:opacity-40"
              >
                {submitting ? "..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
