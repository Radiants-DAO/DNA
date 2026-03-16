"use client";

import { useState } from "react";
import type { ClientAnnotation } from "../hooks/usePlaygroundAnnotations";

interface AnnotationListProps {
  componentId: string;
  annotations: ClientAnnotation[];
  onClose: () => void;
  onResolved: () => void;
  onAnnotateClick: () => void;
}

const SEVERITY_DOTS: Record<string, string> = {
  blocking: "bg-[#ff6b6b]",
  important: "bg-[#ffd43b]",
  suggestion: "bg-[rgba(254,248,226,0.4)]",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "PENDING",
  acknowledged: "ACK",
  resolved: "RESOLVED",
  dismissed: "DISMISSED",
};

export function AnnotationList({
  componentId,
  annotations,
  onClose,
  onResolved,
  onAnnotateClick,
}: AnnotationListProps) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"resolve" | "dismiss" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const componentAnnotations = annotations.filter((a) => a.componentId === componentId);
  const pending = componentAnnotations.filter((a) => a.status === "pending" || a.status === "acknowledged");
  const resolved = componentAnnotations.filter((a) => a.status === "resolved" || a.status === "dismissed");

  const handleAction = async () => {
    if (!actionId || !actionType || submitting) return;
    if (actionType === "dismiss" && !inputValue.trim()) return;

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { action: actionType, id: actionId };
      if (actionType === "resolve") body.summary = inputValue.trim() || undefined;
      if (actionType === "dismiss") body.reason = inputValue.trim();

      const res = await fetch("/playground/api/agent/annotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setActionId(null);
        setActionType(null);
        setInputValue("");
        onResolved();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="dark absolute right-0 top-full z-30 mt-1"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-72 rounded-sm border border-edge-primary bg-surface-primary shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(254,248,226,0.1)] px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[rgba(254,248,226,0.5)]">
            Annotations ({pending.length} pending)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onAnnotateClick}
              className="font-mono text-[10px] text-[rgba(254,248,226,0.5)] hover:text-[#FEF8E2]"
              title="Place a pin"
            >
              + Pin
            </button>
            <button
              onClick={onClose}
              className="font-mono text-[10px] text-[rgba(254,248,226,0.4)] hover:text-[#FEF8E2]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-64 overflow-y-auto">
          {componentAnnotations.length === 0 && (
            <div className="px-3 py-4 text-center font-mono text-[10px] text-[rgba(254,248,226,0.3)]">
              No annotations yet
            </div>
          )}

          {pending.length > 0 && (
            <div className="flex flex-col">
              {pending.map((a) => (
                <div key={a.id} className="border-b border-[rgba(254,248,226,0.05)] px-3 py-2">
                  <div className="flex items-start gap-2">
                    <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOTS[a.severity] ?? ""}`} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="font-mono text-[11px] leading-snug text-[#FEF8E2]">
                        {a.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-[rgba(254,248,226,0.3)]">
                          {a.intent} · {STATUS_LABELS[a.status] ?? a.status}
                        </span>
                        {actionId !== a.id && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => { setActionId(a.id); setActionType("resolve"); setInputValue(""); }}
                              className="font-mono text-[9px] text-[rgba(254,248,226,0.4)] hover:text-[#FEF8E2]"
                            >
                              resolve
                            </button>
                            <button
                              onClick={() => { setActionId(a.id); setActionType("dismiss"); setInputValue(""); }}
                              className="font-mono text-[9px] text-[rgba(254,248,226,0.4)] hover:text-[#FEF8E2]"
                            >
                              dismiss
                            </button>
                          </div>
                        )}
                      </div>

                      {actionId === a.id && actionType && (
                        <div className="mt-1 flex gap-1">
                          <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAction();
                              if (e.key === "Escape") { setActionId(null); setActionType(null); }
                            }}
                            placeholder={actionType === "resolve" ? "Summary (optional)" : "Reason (required)"}
                            autoFocus
                            className="flex-1 rounded-xs border border-[rgba(254,248,226,0.12)] bg-[#0F0E0C] px-1.5 py-0.5 font-mono text-[9px] text-[#FEF8E2] placeholder:text-[rgba(254,248,226,0.25)] focus:outline-none"
                          />
                          <button
                            onClick={handleAction}
                            disabled={submitting || (actionType === "dismiss" && !inputValue.trim())}
                            className="rounded-xs bg-[rgba(254,248,226,0.08)] px-1.5 py-0.5 font-mono text-[9px] text-[#FEF8E2] disabled:opacity-40"
                          >
                            {submitting ? "..." : "OK"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <>
              <div className="border-b border-[rgba(254,248,226,0.05)] px-3 py-1.5">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[rgba(254,248,226,0.25)]">
                  Resolved ({resolved.length})
                </span>
              </div>
              {resolved.map((a) => (
                <div key={a.id} className="border-b border-[rgba(254,248,226,0.05)] px-3 py-2 opacity-50">
                  <div className="flex items-start gap-2">
                    <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOTS[a.severity] ?? ""}`} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="font-mono text-[11px] leading-snug text-[#FEF8E2] line-through">
                        {a.message}
                      </p>
                      <span className="font-mono text-[9px] text-[rgba(254,248,226,0.3)]">
                        {a.intent} · {STATUS_LABELS[a.status] ?? a.status}
                        {a.resolution ? ` · ${a.resolution}` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
