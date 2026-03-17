"use client";

import { useState } from "react";
import { ComposerShell, ComposerLabel, ComposerPill } from "./ComposerShell";

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
  const [submitting, setSubmitting] = useState(false);
  const [adoptionMode, setAdoptionMode] = useState<AdoptionMode>("replacement");
  const [targetVariant, setTargetVariant] = useState(availableVariants[0] ?? "default");

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
          message: message || `Adopt ${iterationLabel}`,
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

  return (
    <ComposerShell
      positionClassName="right-0 top-0"
      headerLabel={`Adopt — ${iterationLabel}`}
      placeholder="Describe what to adopt and any adjustments..."
      submitLabel="Submit"
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      requireMessage={false}
    >
      <div className="flex flex-col gap-2">
        {/* Adoption mode picker */}
        <div className="flex flex-col gap-1">
          <ComposerLabel>Mode</ComposerLabel>
          <div className="flex gap-1">
            {(["replacement", "new-variant"] as const).map((mode) => (
              <ComposerPill
                key={mode}
                active={adoptionMode === mode}
                onClick={() => setAdoptionMode(mode)}
              >
                {mode === "replacement" ? "Replace existing" : "Add as new variant"}
              </ComposerPill>
            ))}
          </div>
        </div>

        {/* Variant picker (only when replacing) */}
        {adoptionMode === "replacement" && availableVariants.length > 1 && (
          <div className="flex flex-col gap-1">
            <ComposerLabel>Replace variant</ComposerLabel>
            <div className="flex flex-wrap gap-1">
              {availableVariants.map((v) => (
                <ComposerPill
                  key={v}
                  active={targetVariant === v}
                  onClick={() => setTargetVariant(v)}
                >
                  {v}
                </ComposerPill>
              ))}
            </div>
          </div>
        )}
      </div>
    </ComposerShell>
  );
}
