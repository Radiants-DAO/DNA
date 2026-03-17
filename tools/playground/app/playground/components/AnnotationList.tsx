"use client";

import { useState } from "react";
import { Spinner } from "@rdna/radiants/components/core";
import type { ClientAnnotation } from "../hooks/usePlaygroundAnnotations";

interface AnnotationListProps {
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
      <div className="w-72 rounded-sm border border-line bg-page shadow-floating">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rule px-3 py-2">
          <div className="flex flex-col">
            <span className="font-mono text-sm uppercase tracking-widest text-mute">
              Annotations
            </span>
            <span className="font-mono text-xs text-mute">
              {pending.length} pending
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:compact-pill-ui owner:design-system expires:2026-09-16 issue:DNA-playground-annotation-density */}
            <button
              onClick={onAnnotateClick}
              className="font-mono text-xs text-mute hover:text-main"
              title="Place a pin"
            >
              + Pin
            </button>
            {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:compact-pill-ui owner:design-system expires:2026-09-16 issue:DNA-playground-annotation-density */}
            <button
              onClick={onClose}
              className="font-mono text-xs text-mute hover:text-main"
            >
              ✕
            </button>
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
                      <span className="font-mono text-xs text-mute">
                        {a.intent} · {STATUS_LABELS[a.status] ?? a.status}
                      </span>
                      {actionId !== a.id && (
                        <div className="flex gap-3">
                          {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:compact-pill-ui owner:design-system expires:2026-09-16 issue:DNA-playground-annotation-density */}
                          <button
                            onClick={() => { setActionId(a.id); setActionType("resolve"); setInputValue(""); }}
                            className="font-mono text-xs text-mute hover:text-main"
                          >
                            resolve
                          </button>
                          {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:compact-pill-ui owner:design-system expires:2026-09-16 issue:DNA-playground-annotation-density */}
                          <button
                            onClick={() => { setActionId(a.id); setActionType("dismiss"); setInputValue(""); }}
                            className="font-mono text-xs text-mute hover:text-main"
                          >
                            dismiss
                          </button>
                        </div>
                      )}

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
                            className="flex-1 rounded-xs border border-rule bg-page px-1.5 py-0.5 font-mono text-xs text-main placeholder:text-mute focus:border-line-hover focus:outline-none"
                          />
                          {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:compact-pill-ui owner:design-system expires:2026-09-16 issue:DNA-playground-annotation-density */}
                          <button
                            onClick={handleAction}
                            disabled={submitting || (actionType === "dismiss" && !inputValue.trim())}
                            className="rounded-xs bg-hover px-1.5 py-0.5 font-mono text-xs text-main disabled:opacity-40"
                          >
                            {submitting ? <Spinner size={12} /> : "OK"}
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
              <div className="border-b border-rule px-3 py-1.5">
                <span className="font-mono text-sm uppercase tracking-widest text-mute">
                  Resolved ({resolved.length})
                </span>
              </div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
