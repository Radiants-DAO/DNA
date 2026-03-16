"use client";

import { useState } from "react";
import type { ClientAnnotation } from "../hooks/usePlaygroundAnnotations";

interface AnnotationDetailProps {
  annotation: ClientAnnotation;
  anchorElement: HTMLElement;
  onClose: () => void;
  onResolved: () => void;
}

const INTENT_LABELS: Record<string, string> = {
  fix: "Fix",
  change: "Change",
  question: "Question",
  approve: "Approve",
};

const SEVERITY_COLORS: Record<string, string> = {
  blocking: "text-[#ff6b6b]",
  important: "text-[#ffd43b]",
  suggestion: "text-[rgba(254,248,226,0.6)]",
};

export function AnnotationDetail({
  annotation,
  anchorElement,
  onClose,
  onResolved,
}: AnnotationDetailProps) {
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
      className="absolute z-30"
      style={{ left, top }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-64 rounded-sm border border-[rgba(254,248,226,0.2)] bg-[#1a1814] shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(254,248,226,0.1)] px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#FEF8E2]">
              {INTENT_LABELS[annotation.intent] ?? annotation.intent}
            </span>
            <span className={`font-mono text-[9px] uppercase ${SEVERITY_COLORS[annotation.severity] ?? ""}`}>
              {annotation.severity}
            </span>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[10px] text-[rgba(254,248,226,0.4)] hover:text-[#FEF8E2]"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-2 p-3">
          <p className="font-mono text-xs leading-relaxed text-[#FEF8E2]">
            {annotation.message}
          </p>

          <span className="font-mono text-[9px] text-[rgba(254,248,226,0.3)]">
            {age} · {annotation.status}
            {annotation.resolution ? ` · ${annotation.resolution}` : ""}
          </span>

          {/* Actions for pending annotations */}
          {isPending && mode === "view" && (
            <div className="flex gap-1.5 border-t border-[rgba(254,248,226,0.08)] pt-2">
              <button
                onClick={() => setMode("resolve")}
                className="flex-1 rounded-xs border border-[rgba(254,248,226,0.15)] px-2 py-1 font-mono text-[10px] text-[#FEF8E2] hover:bg-[rgba(254,248,226,0.06)]"
              >
                Resolve
              </button>
              <button
                onClick={() => setMode("dismiss")}
                className="flex-1 rounded-xs px-2 py-1 font-mono text-[10px] text-[rgba(254,248,226,0.5)] hover:bg-[rgba(254,248,226,0.06)]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Resolve form */}
          {isPending && mode === "resolve" && (
            <div className="flex flex-col gap-1.5 border-t border-[rgba(254,248,226,0.08)] pt-2">
              <input
                type="text"
                value={resolveText}
                onChange={(e) => setResolveText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Summary (optional)"
                autoFocus
                className="w-full rounded-xs border border-[rgba(254,248,226,0.12)] bg-[#0F0E0C] px-2 py-1 font-mono text-[10px] text-[#FEF8E2] placeholder:text-[rgba(254,248,226,0.3)] focus:outline-none"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => setMode("view")}
                  className="rounded-xs px-2 py-1 font-mono text-[10px] text-[rgba(254,248,226,0.5)]"
                >
                  Back
                </button>
                <button
                  onClick={() => handleAction("resolve")}
                  disabled={submitting}
                  className="rounded-xs border border-[rgba(254,248,226,0.2)] bg-[rgba(254,248,226,0.08)] px-2 py-1 font-mono text-[10px] text-[#FEF8E2] hover:bg-[rgba(254,248,226,0.14)] disabled:opacity-40"
                >
                  {submitting ? "..." : "Resolve"}
                </button>
              </div>
            </div>
          )}

          {/* Dismiss form */}
          {isPending && mode === "dismiss" && (
            <div className="flex flex-col gap-1.5 border-t border-[rgba(254,248,226,0.08)] pt-2">
              <input
                type="text"
                value={dismissText}
                onChange={(e) => setDismissText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reason (required)"
                autoFocus
                className="w-full rounded-xs border border-[rgba(254,248,226,0.12)] bg-[#0F0E0C] px-2 py-1 font-mono text-[10px] text-[#FEF8E2] placeholder:text-[rgba(254,248,226,0.3)] focus:outline-none"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => setMode("view")}
                  className="rounded-xs px-2 py-1 font-mono text-[10px] text-[rgba(254,248,226,0.5)]"
                >
                  Back
                </button>
                <button
                  onClick={() => handleAction("dismiss")}
                  disabled={!dismissText.trim() || submitting}
                  className="rounded-xs border border-[rgba(254,248,226,0.2)] bg-[rgba(254,248,226,0.08)] px-2 py-1 font-mono text-[10px] text-[#FEF8E2] hover:bg-[rgba(254,248,226,0.14)] disabled:opacity-40"
                >
                  {submitting ? "..." : "Dismiss"}
                </button>
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
