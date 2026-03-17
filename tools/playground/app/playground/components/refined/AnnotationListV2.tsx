"use client";

import { useState } from "react";
import { Button, Spinner } from "@rdna/radiants/components/core";
import type { ClientAnnotation } from "../../hooks/usePlaygroundAnnotations";

interface AnnotationListV2Props {
  componentId: string;
  annotations: ClientAnnotation[];
  onClose: () => void;
  onResolved: () => void;
  onAnnotateClick: () => void;
}

const PRIORITY_DOTS: Record<string, string> = {
  P1: "bg-danger",
  P2: "bg-warning",
  P3: "bg-mute",
  P4: "bg-mute",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "PENDING",
  acknowledged: "ACK",
  resolved: "RESOLVED",
  dismissed: "DISMISSED",
};

export function AnnotationListV2({
  componentId,
  annotations,
  onClose,
  onResolved,
  onAnnotateClick,
}: AnnotationListV2Props) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"resolve" | "dismiss" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resolvedOpen, setResolvedOpen] = useState(false);

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
      style={{ animation: "popupIn var(--duration-moderate) var(--easing-spring) both" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-72 rounded-2xl border border-line bg-page shadow-floating">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rule px-3 py-2">
          <span className="font-mono text-xs uppercase tracking-widest text-mute">
            Annotations ({pending.length} pending)
          </span>
          <div className="flex items-center gap-1">
            <Button variant="text" size="sm" onClick={onAnnotateClick} title="Place a pin">
              + Pin
            </Button>
            <Button variant="text" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-64 overflow-y-auto">
          {componentAnnotations.length === 0 && (
            <div className="px-3 py-4 text-center font-mono text-xs text-mute">
              No annotations yet
            </div>
          )}

          {pending.length > 0 && (
            <div className="flex flex-col">
              {pending.map((a) => (
                <div key={a.id} className="border-b border-rule px-3 py-2">
                  <div className="flex items-start gap-2">
                    <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOTS[a.priority ?? ""] ?? ""}`} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="font-mono text-sm leading-snug text-main">
                        {a.message}
                      </p>
                      {a.intent === "adopt" && a.iterationFile && (
                        <span className="font-mono text-xs text-mute">
                          {a.adoptionMode === "replacement"
                            ? `Replace "${a.targetVariant ?? "default"}" ← ${a.iterationFile.replace(".tsx", "")}`
                            : `New variant ← ${a.iterationFile.replace(".tsx", "")}`}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-mute">
                          {a.intent} · {STATUS_LABELS[a.status] ?? a.status}
                        </span>
                        {actionId !== a.id && (
                          <div className="flex gap-1">
                            <Button
                              variant="text"
                              size="sm"
                              onClick={() => { setActionId(a.id); setActionType("resolve"); setInputValue(""); }}
                            >
                              resolve
                            </Button>
                            <Button
                              variant="text"
                              size="sm"
                              onClick={() => { setActionId(a.id); setActionType("dismiss"); setInputValue(""); }}
                            >
                              dismiss
                            </Button>
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
                            className="flex-1 rounded-lg border border-rule bg-page px-1.5 py-0.5 font-mono text-xs text-main transition-colors placeholder:text-mute focus:border-line-hover focus:outline-none"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAction}
                            disabled={submitting || (actionType === "dismiss" && !inputValue.trim())}
                          >
                            {submitting ? <Spinner size={12} /> : "OK"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Collapsible resolved section */}
          {resolved.length > 0 && (
            <>
              <button
                onClick={() => setResolvedOpen(!resolvedOpen)}
                className="flex w-full items-center gap-1 border-b border-rule px-3 py-1.5"
              >
                <span className="font-mono text-xs uppercase tracking-widest text-mute">
                  Resolved ({resolved.length})
                </span>
                <svg
                  width="10" height="10" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="text-mute"
                  style={{
                    transition: "transform var(--duration-slow) var(--easing-spring)",
                    transform: resolvedOpen ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <div
                className="grid"
                style={{
                  gridTemplateRows: resolvedOpen ? "1fr" : "0fr",
                  transition: "grid-template-rows var(--duration-slow) var(--easing-spring)",
                }}
              >
                <div className="overflow-hidden">
                  {resolved.map((a) => (
                    <div key={a.id} className="border-b border-rule px-3 py-2 opacity-50">
                      <div className="flex items-start gap-2">
                        <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOTS[a.priority ?? ""] ?? ""}`} />
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <p className="font-mono text-sm leading-snug text-main line-through">
                            {a.message}
                          </p>
                          <span className="font-mono text-xs text-mute">
                            {a.intent} · {STATUS_LABELS[a.status] ?? a.status}
                            {a.resolution ? ` · ${a.resolution}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
