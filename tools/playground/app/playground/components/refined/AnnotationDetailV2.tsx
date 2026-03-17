"use client";

import { useState } from "react";
import { Button, Spinner } from "@rdna/radiants/components/core";
import type { ClientAnnotation } from "../../hooks/usePlaygroundAnnotations";

interface AnnotationDetailV2Props {
  annotation: ClientAnnotation;
  anchorElement: HTMLElement;
  onClose: () => void;
  onResolved: () => void;
}

const INTENT_LABELS: Record<string, string> = {
  fix: "Fix",
  change: "Change",
  question: "Question",
  adopt: "Adopt",
};

const PRIORITY_COLORS: Record<string, string> = {
  P1: "text-danger",
  P2: "text-warning",
  P3: "text-mute",
  P4: "text-mute",
};

export function AnnotationDetailV2({
  annotation,
  anchorElement,
  onClose,
  onResolved,
}: AnnotationDetailV2Props) {
  const [resolveText, setResolveText] = useState("");
  const [dismissText, setDismissText] = useState("");
  const [mode, setMode] = useState<"view" | "resolve" | "dismiss">("view");
  const [submitting, setSubmitting] = useState(false);

  const rect = anchorElement.getBoundingClientRect();
  const parentRect = anchorElement.offsetParent?.getBoundingClientRect() ?? rect;
  const left = rect.left - parentRect.left;
  const top = rect.bottom - parentRect.top + 4;

  const isPending = annotation.status === "pending" || annotation.status === "acknowledged";

  const handleAction = async (action: "resolve" | "dismiss") => {
    setSubmitting(true);
    try {
      const body: Record<string, string> = { action, id: annotation.id };
      if (action === "resolve") body.summary = resolveText.trim() || undefined as unknown as string;
      if (action === "dismiss") body.reason = dismissText.trim();

      const res = await fetch("/playground/api/agent/annotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onResolved();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (mode === "resolve") handleAction("resolve");
      if (mode === "dismiss" && dismissText.trim()) handleAction("dismiss");
    }
  };

  const age = formatAge(annotation.createdAt);

  return (
    <div
      className="dark absolute z-30"
      style={{
        left,
        top,
        animation: "popupIn var(--duration-moderate) var(--easing-spring) both",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-64 rounded-2xl border border-line bg-page shadow-floating">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rule px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-main">
              {INTENT_LABELS[annotation.intent] ?? annotation.intent}
            </span>
            <span className={`font-mono text-xs uppercase ${PRIORITY_COLORS[annotation.priority ?? ""] ?? "text-mute"}`}>
              {annotation.priority ?? "-"}
            </span>
          </div>
          <Button variant="text" size="sm" onClick={onClose} className="!px-0">
            ✕
          </Button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-2 p-3">
          <p className="font-mono text-xs leading-relaxed text-main">
            {annotation.message}
          </p>

          {/* Adopt-specific metadata */}
          {annotation.intent === "adopt" && annotation.iterationFile && (
            <div className="flex flex-col gap-1 rounded-lg border border-rule px-2 py-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-mute">Source:</span>
                <span className="font-mono text-xs text-main">{annotation.iterationFile}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-mute">Mode:</span>
                <span className="font-mono text-xs text-main">
                  {annotation.adoptionMode === "replacement"
                    ? `Replace "${annotation.targetVariant ?? "default"}"`
                    : "Add as new variant"}
                </span>
              </div>
            </div>
          )}

          <span className="font-mono text-xs text-mute">
            {age} · {annotation.status}
            {annotation.resolution ? ` · ${annotation.resolution}` : ""}
          </span>

          {/* Actions for pending annotations */}
          {isPending && mode === "view" && (
            <div className="flex gap-1.5 border-t border-rule pt-2">
              <Button variant="outline" size="sm" onClick={() => setMode("resolve")} className="flex-1">
                Resolve
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setMode("dismiss")} className="flex-1">
                Dismiss
              </Button>
            </div>
          )}

          {/* Resolve form */}
          {isPending && mode === "resolve" && (
            <div className="flex flex-col gap-1.5 border-t border-rule pt-2">
              <input
                type="text"
                value={resolveText}
                onChange={(e) => setResolveText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Summary (optional)"
                autoFocus
                className="w-full rounded-lg border border-rule bg-page px-2 py-1 font-mono text-xs text-main transition-colors placeholder:text-mute focus:border-line-hover focus:outline-none"
              />
              <div className="flex gap-1.5">
                <Button variant="text" size="sm" onClick={() => setMode("view")}>
                  Back
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction("resolve")}
                  disabled={submitting}
                >
                  {submitting ? <Spinner size={12} /> : "Resolve"}
                </Button>
              </div>
            </div>
          )}

          {/* Dismiss form */}
          {isPending && mode === "dismiss" && (
            <div className="flex flex-col gap-1.5 border-t border-rule pt-2">
              <input
                type="text"
                value={dismissText}
                onChange={(e) => setDismissText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reason (required)"
                autoFocus
                className="w-full rounded-lg border border-rule bg-page px-2 py-1 font-mono text-xs text-main transition-colors placeholder:text-mute focus:border-line-hover focus:outline-none"
              />
              <div className="flex gap-1.5">
                <Button variant="text" size="sm" onClick={() => setMode("view")}>
                  Back
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction("dismiss")}
                  disabled={!dismissText.trim() || submitting}
                >
                  {submitting ? <Spinner size={12} /> : "Dismiss"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatAge(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
