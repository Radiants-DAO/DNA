"use client";

import { memo, Suspense, useEffect, useState, type ComponentType } from "react";
import { Spinner } from "@rdna/radiants/components/core/Spinner/Spinner";
import type { RegistryEntry } from "../types";
import { getViolationsForComponent } from "../lib/violations";
import { ViolationBadge } from "../components/ViolationBadge";
import { AnnotationBadge } from "../components/AnnotationBadge";
import { useAnnotationContext } from "../annotation-context";
import { AnnotationPin } from "../components/AnnotationPin";
import { AnnotationComposer } from "../components/AnnotationComposer";
import { AnnotationDetail } from "../components/AnnotationDetail";
import { AnnotationList } from "../components/AnnotationList";
import type { ClientAnnotation } from "../hooks/usePlaygroundAnnotations";
import { useForcedState } from "../ForcedStateContext";
import { useEditorMode } from "../editor-mode-context";
import {
  getWorkOverlayCopy,
  WORK_COMPLETION_FLASH_MS,
  type WorkOverlayPhase,
} from "../lib/work-overlay";
import { useWorkSignalSet } from "../work-signal-context";

// ---------------------------------------------------------------------------
// Iteration sub-card (dynamically loaded from iterations/)
// ---------------------------------------------------------------------------

function IterationCard({
  fileName,
  onTrash,
  onAdopt,
}: {
  fileName: string;
  onTrash: (f: string) => void;
  onAdopt: (f: string) => void;
}) {
  const [mod, setMod] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import(`../iterations/${fileName}`)
      .then((m) => setMod(m as Record<string, unknown>))
      .catch((e) => setError(e.message));
  }, [fileName]);

  if (error) {
    return (
      <div className="rounded-sm border border-status-error/30 bg-surface-primary p-3">
        <span className="font-mono text-xs text-status-error">
          Failed: {fileName}
        </span>
      </div>
    );
  }

  if (!mod) {
    return (
      <div className="flex h-24 items-center justify-center rounded-sm border border-edge-primary bg-surface-primary">
        <span className="text-xs text-content-muted">Loading...</span>
      </div>
    );
  }

  const Comp =
    mod.default ??
    Object.values(mod).find(
      (v) => typeof v === "function" || (typeof v === "object" && v !== null),
    );

  return (
    <div className="group/iter rounded-sm border border-edge-primary bg-surface-primary">
      <div className="flex items-center justify-between border-b border-edge-primary px-2 py-1">
        <span className="font-mono text-xs text-content-muted">
          {fileName.replace(".tsx", "")}
        </span>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/iter:opacity-100">
          <button
            onClick={() => onAdopt(fileName)}
            className="cursor-pointer rounded-xs px-1.5 py-0.5 text-xs text-content-primary hover:bg-surface-tertiary"
            title="Adopt this variant"
          >
            Adopt
          </button>
          <button
            onClick={() => onTrash(fileName)}
            className="cursor-pointer rounded-xs px-1.5 py-0.5 text-xs text-status-error hover:bg-surface-tertiary"
            title="Delete this variant"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex min-h-24 items-center justify-center p-3">
        {Comp ? (
          <Suspense fallback={<span className="text-xs text-content-muted">...</span>}>
            <IterationRenderer component={Comp} />
          </Suspense>
        ) : (
          <span className="text-xs text-content-muted">No renderable export</span>
        )}
      </div>
    </div>
  );
}

function IterationRenderer({ component: Comp }: { component: unknown }) {
  if (typeof Comp === "object" && Comp !== null) {
    const ns = Comp as Record<string, ComponentType<Record<string, unknown>>>;
    if (ns.Root && ns.Content && ns.Title && ns.Description) {
      const Root = ns.Root;
      const Content = ns.Content;
      const Title = ns.Title;
      const Description = ns.Description;
      return (
        <div className="w-full">
          <Root>
            <Content>
              <Title>{"Sample title" as unknown as React.ReactNode}</Title>
              <Description>{"This is a preview of the variant." as unknown as React.ReactNode}</Description>
            </Content>
          </Root>
        </div>
      );
    }
  }

  if (typeof Comp === "function") {
    const Simple = Comp as ComponentType<Record<string, unknown>>;
    return <Simple>Variant preview</Simple>;
  }

  return <span className="text-xs text-content-muted">Cannot preview</span>;
}

// ---------------------------------------------------------------------------
// ComponentCard — plain div, no ReactFlow dependency
// ---------------------------------------------------------------------------

interface ComponentCardProps {
  entry: RegistryEntry;
  iterations: string[];
}

function WorkSignalOverlay({ phase }: { phase: WorkOverlayPhase }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (phase !== "active") {
      return;
    }

    const interval = setInterval(() => {
      setTick((current) => current + 1);
    }, 85);

    return () => clearInterval(interval);
  }, [phase]);

  const { eyebrow, message, dots, showCursor } = getWorkOverlayCopy(phase, tick);

  return (
    <div
      className={`rdna-work-overlay rdna-work-overlay--${phase} pointer-events-none absolute inset-0 z-20 overflow-visible`}
    >
      <div className="rdna-work-halo absolute inset-[-12px] rounded-[12px]" />
      <div className="rdna-work-frame absolute inset-0 rounded-xs" />
      <div className="absolute inset-0 overflow-hidden rounded-xs">
        {phase === "complete" && <div className="rdna-work-flash" />}
        <div className="rdna-work-shade" />
        {phase === "active" && <div className="rdna-work-scan" />}
        {phase === "active" && (
          <div className="rdna-work-spinner">
            <Spinner
              size={22}
              className="text-[#fff4c6]"
            />
          </div>
        )}
        {phase === "complete" && (
          <div className="rdna-work-check">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
        <div className="rdna-work-copy">
          <span className="font-mono text-[9px] uppercase tracking-[0.38em] text-[rgba(255,244,198,0.78)]">
            {eyebrow}
          </span>
          <span className="font-mono text-[13px] tracking-[0.18em] text-[#fff8de]">
            {message}
            {dots}
            {showCursor ? <span className="rdna-work-cursor">_</span> : null}
          </span>
        </div>
      </div>
      <style jsx>{`
        .rdna-work-overlay--complete {
          animation: rdna-work-overlay-complete ${WORK_COMPLETION_FLASH_MS}ms ease-out forwards;
        }

        .rdna-work-halo {
          background:
            radial-gradient(circle at 50% 50%, rgba(255, 246, 196, 0.88) 0%, rgba(255, 222, 118, 0.5) 32%, rgba(255, 205, 84, 0.22) 56%, rgba(255, 205, 84, 0) 78%);
          filter: blur(22px);
          animation: rdna-work-halo 2s ease-in-out infinite;
        }

        .rdna-work-frame {
          box-shadow:
            0 0 0 2px rgba(255, 245, 194, 0.82),
            0 0 26px rgba(255, 226, 125, 1),
            0 0 68px rgba(255, 196, 71, 0.75),
            inset 0 0 18px rgba(255, 238, 170, 0.24);
          animation: rdna-work-frame 2s ease-in-out infinite;
        }

        .rdna-work-shade {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(7, 6, 4, 0.72) 0%,
              rgba(7, 6, 4, 0.56) 22%,
              rgba(7, 6, 4, 0.28) 46%,
              rgba(7, 6, 4, 0.12) 66%,
              rgba(7, 6, 4, 0) 84%
            );
        }

        .rdna-work-scan {
          position: absolute;
          left: 0;
          right: 0;
          top: -100%;
          height: 100%;
          background:
            linear-gradient(
              180deg,
              rgba(255, 243, 186, 0) 0%,
              rgba(255, 232, 140, 0) 58%,
              rgba(255, 218, 96, 0.06) 78%,
              rgba(255, 218, 96, 0.16) 92%,
              rgba(255, 235, 165, 0.4) 100%
            );
          border-bottom: 1px solid rgba(255, 245, 194, 0.82);
          box-shadow: 0 8px 20px rgba(255, 196, 71, 0.16);
          animation: rdna-work-scan 2.05s linear infinite;
        }

        .rdna-work-spinner {
          position: absolute;
          top: 14px;
          left: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-shadow:
            0 0 10px rgba(255, 245, 194, 0.48),
            0 0 20px rgba(255, 218, 96, 0.18);
        }

        .rdna-work-copy {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 14px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-end;
          gap: 4px;
          text-align: left;
          text-shadow:
            0 0 10px rgba(255, 245, 194, 0.48),
            0 0 20px rgba(255, 218, 96, 0.18);
          animation: rdna-work-copy 2.5s ease-in-out infinite;
        }

        .rdna-work-flash {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(
              ellipse at 50% 50%,
              rgba(255, 248, 210, 0.92) 0%,
              rgba(255, 232, 140, 0.6) 30%,
              rgba(255, 218, 96, 0.2) 60%,
              rgba(255, 218, 96, 0) 100%
            );
          animation: rdna-work-flash 600ms ease-out forwards;
          z-index: 2;
        }

        .rdna-work-check {
          position: absolute;
          top: 14px;
          left: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff4c6;
          filter:
            drop-shadow(0 0 8px rgba(255, 245, 194, 0.7))
            drop-shadow(0 0 18px rgba(255, 218, 96, 0.4));
          animation: rdna-work-check-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .rdna-work-overlay--complete .rdna-work-halo {
          animation: rdna-work-halo-complete 400ms ease-out forwards;
        }

        .rdna-work-overlay--complete .rdna-work-frame {
          animation: rdna-work-frame-complete 500ms ease-out forwards;
        }

        .rdna-work-overlay--complete .rdna-work-copy {
          animation: none;
        }

        .rdna-work-cursor {
          margin-left: 1px;
          animation: rdna-work-cursor 1s steps(2, end) infinite;
        }

        @keyframes rdna-work-halo {
          0%,
          100% {
            opacity: 0.64;
            transform: scale(0.988);
          }

          50% {
            opacity: 1;
            transform: scale(1.022);
          }
        }

        @keyframes rdna-work-frame {
          0%,
          100% {
            opacity: 0.76;
          }

          50% {
            opacity: 1;
          }
        }

        @keyframes rdna-work-scan {
          0% {
            top: -100%;
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          88% {
            opacity: 1;
          }

          100% {
            top: 100%;
            opacity: 0;
          }
        }

        @keyframes rdna-work-copy {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-2px);
          }
        }

        @keyframes rdna-work-cursor {
          0%,
          49% {
            opacity: 1;
          }

          50%,
          100% {
            opacity: 0;
          }
        }

        @keyframes rdna-work-flash {
          0% {
            opacity: 1;
            transform: scale(0.94);
          }

          60% {
            opacity: 0.7;
            transform: scale(1);
          }

          100% {
            opacity: 0.3;
            transform: scale(1);
          }
        }

        @keyframes rdna-work-check-in {
          0% {
            opacity: 0;
            transform: scale(0.3) rotate(-8deg);
          }

          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes rdna-work-halo-complete {
          0% {
            opacity: 1;
            transform: scale(1);
          }

          30% {
            opacity: 1;
            transform: scale(1.08);
          }

          100% {
            opacity: 0.85;
            transform: scale(1.04);
          }
        }

        @keyframes rdna-work-frame-complete {
          0% {
            box-shadow:
              0 0 0 2px rgba(255, 245, 194, 0.92),
              0 0 36px rgba(255, 226, 125, 1),
              0 0 88px rgba(255, 196, 71, 0.8),
              inset 0 0 24px rgba(255, 238, 170, 0.3);
          }

          40% {
            box-shadow:
              0 0 0 3px rgba(255, 245, 194, 1),
              0 0 48px rgba(255, 226, 125, 1),
              0 0 100px rgba(255, 196, 71, 0.9),
              inset 0 0 30px rgba(255, 238, 170, 0.4);
          }

          100% {
            box-shadow:
              0 0 0 2px rgba(255, 245, 194, 0.7),
              0 0 30px rgba(255, 226, 125, 0.8),
              0 0 70px rgba(255, 196, 71, 0.5),
              inset 0 0 18px rgba(255, 238, 170, 0.2);
          }
        }

        @keyframes rdna-work-overlay-complete {
          0%,
          65% {
            opacity: 1;
          }

          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function ComponentCardInner({ entry, iterations }: ComponentCardProps) {
  const forcedState = useForcedState();
  const workSignals = useWorkSignalSet();
  const isWorking = workSignals.has(entry.id);
  const [overlayPhase, setOverlayPhase] = useState<WorkOverlayPhase | null>(
    isWorking ? "active" : null,
  );

  // Derive phase transitions during render (no effects, no refs, Strict Mode safe).
  // React supports setState-during-render for derived state — it re-renders
  // immediately before committing, like getDerivedStateFromProps.
  if (isWorking && overlayPhase !== "active") {
    setOverlayPhase("active");
  }
  if (!isWorking && overlayPhase === "active") {
    setOverlayPhase("complete");
  }

  // Dismiss the completion overlay after the flash duration
  useEffect(() => {
    if (overlayPhase !== "complete") return;

    const timeout = window.setTimeout(() => {
      setOverlayPhase((current) => (current === "complete" ? null : current));
    }, WORK_COMPLETION_FLASH_MS);

    return () => window.clearTimeout(timeout);
  }, [overlayPhase]);

  const handleTrash = async (fileName: string) => {
    try {
      const res = await fetch(`/playground/api/generate/${encodeURIComponent(fileName)}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        console.error("Trash failed:", result.error);
      }
    } catch (error) {
      console.error("Trash error:", error);
    }
  };

  const handleAdopt = async (fileName: string) => {
    try {
      const res = await fetch("/playground/api/adopt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId: entry.id, iterationFile: fileName }),
      });
      const result = await res.json();
      if (!res.ok) console.error("Adopt failed:", result.error);
    } catch (e) {
      console.error("Adopt error:", e);
    }
  };

  const { Component, rawComponent } = entry;
  const props = { ...entry.defaultProps };
  const violations = getViolationsForComponent(entry.sourcePath);
  const hasVariants = entry.variants && entry.variants.length > 0 && rawComponent;
  const stateAttr = forcedState !== "default" ? forcedState : undefined;
  const isOverlayActive = overlayPhase === "active";

  const { annotationsForComponent } = useAnnotationContext();
  const cardAnnotations = annotationsForComponent(entry.id);
  const positionedAnnotations = cardAnnotations.filter((a) => a.x != null && a.y != null);

  const { editorMode, setEditorMode } = useEditorMode();
  const isCommentMode = editorMode === "comment";

  const [composer, setComposer] = useState<{ x: number; y: number; left: number; top: number } | null>(null);
  const [selectedPin, setSelectedPin] = useState<{ annotation: ClientAnnotation; element: HTMLElement } | null>(null);
  const [showList, setShowList] = useState(false);

  const handleRenderAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCommentMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setComposer({
      x,
      y,
      left: e.clientX - rect.left,
      top: e.clientY - rect.top,
    });
  };

  const handlePinClick = (annotation: ClientAnnotation, element: HTMLElement) => {
    setSelectedPin({ annotation, element });
    setComposer(null);
    setShowList(false);
  };

  const handleAnnotationMutated = () => {
    setComposer(null);
    setSelectedPin(null);
    setShowList(false);
    setEditorMode("component-id");
  };

  return (
    <div className="relative">
      {overlayPhase ? <WorkSignalOverlay phase={overlayPhase} /> : null}

      <div
        className="flex w-[22rem] flex-col rounded-xs border border-[rgba(254,248,226,0.15)] bg-[#0F0E0C]"
        style={{
          boxShadow: isOverlayActive
            ? "0 0 0 2px rgba(255,245,194,0.76), 0 0 34px rgba(255,226,125,0.9), 0 0 84px rgba(255,196,71,0.42)"
            : "0 0 0 1px rgba(252,225,132,0.06), 0 0 12px rgba(252,225,132,0.08)",
          filter: isOverlayActive ? "blur(0.8px) brightness(0.78) saturate(0.82)" : undefined,
          transform: isOverlayActive ? "scale(0.998)" : undefined,
          transition: "filter 160ms ease, transform 160ms ease, box-shadow 160ms ease",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(254,248,226,0.15)] px-3 py-2">
          <span className="font-mono text-xs uppercase tracking-tight text-[#FEF8E2]">
            {entry.label}
          </span>
          <div className="relative flex items-center gap-1">
            <AnnotationBadge
              componentId={entry.id}
              onClick={() => {
                setShowList(!showList);
                setComposer(null);
                setSelectedPin(null);
              }}
            />
            {violations && <ViolationBadge violations={violations} compact />}

            {/* List popover */}
            {showList && (
              <AnnotationList
                componentId={entry.id}
                annotations={cardAnnotations}
                onClose={() => setShowList(false)}
                onResolved={handleAnnotationMutated}
                onAnnotateClick={() => {
                  setShowList(false);
                  setEditorMode("comment");
                }}
              />
            )}
          </div>
        </div>

        {/* Sub-cards */}
        <div className="flex flex-col gap-2 p-2" data-force-state={stateAttr}>
          {/* Default render */}
          {Component && (
            <div className="rounded-sm border border-edge-primary bg-surface-primary">
              <div className="flex items-center border-b border-edge-primary px-2 py-1">
                <span className="font-mono text-xs text-content-muted">default</span>
              </div>
              <div
                className={`relative flex min-h-32 items-center justify-center p-3 ${
                  isCommentMode ? "cursor-crosshair" : ""
                }`}
                onClick={handleRenderAreaClick}
              >
                <Suspense fallback={<div className="text-xs text-content-muted">Loading...</div>}>
                  <Component {...props} />
                </Suspense>

                {/* Annotation pins */}
                {positionedAnnotations
                  .filter((a) => a.status === "pending" || a.status === "acknowledged")
                  .map((a, i) => (
                    <AnnotationPin
                      key={a.id}
                      annotation={a}
                      index={i}
                      onClick={handlePinClick}
                    />
                  ))}

                {/* Composer */}
                {composer && (
                  <AnnotationComposer
                    componentId={entry.id}
                    x={composer.x}
                    y={composer.y}
                    anchorLeft={composer.left}
                    anchorTop={composer.top}
                    onSubmit={handleAnnotationMutated}
                    onCancel={() => { setComposer(null); setEditorMode("component-id"); }}
                  />
                )}

                {/* Pin detail popover */}
                {selectedPin && (
                  <AnnotationDetail
                    annotation={selectedPin.annotation}
                    anchorElement={selectedPin.element}
                    onClose={() => setSelectedPin(null)}
                    onResolved={handleAnnotationMutated}
                  />
                )}
              </div>
            </div>
          )}

          {/* Curated variants */}
          {hasVariants &&
            entry.variants!.map((v) => (
              <div key={v.label} className="rounded-sm border border-edge-primary bg-surface-primary">
                <div className="flex items-center border-b border-edge-primary px-2 py-1">
                  <span className="font-mono text-xs text-content-muted">{v.label}</span>
                </div>
                <div className="flex min-h-24 items-center justify-center p-3">
                  <Suspense fallback={<span className="text-xs text-content-muted">...</span>}>
                    {rawComponent && (() => { const V = rawComponent; return <V {...v.props} />; })()}
                  </Suspense>
                </div>
              </div>
            ))}

          {/* Iteration variants */}
          {iterations.length > 0 && (
            <>
              <div className="px-1 pt-1">
                <span className="font-mono text-xs uppercase tracking-tight text-[#FEF8E2]">
                  Potential Variants ({iterations.length})
                </span>
              </div>
              {iterations.map((fileName) => (
                <IterationCard
                  key={fileName}
                  fileName={fileName}
                  onTrash={handleTrash}
                  onAdopt={handleAdopt}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const ComponentCard = memo(ComponentCardInner);
