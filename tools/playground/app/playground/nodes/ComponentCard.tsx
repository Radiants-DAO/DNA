"use client";

import { memo, Suspense, useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { useViewport } from "@xyflow/react";
import { Spinner } from "@rdna/radiants/components/core/Spinner/Spinner";
import { PropControls, useShowcaseProps } from "@rdna/radiants/registry";
import type { ForcedState, RegistryEntry } from "../types";
import { getViolationsForComponent } from "../lib/violations";
import { ViolationBadge } from "../components/ViolationBadge";
import { AnnotationBadge } from "../components/AnnotationBadge";
import { useAnnotationContext } from "../annotation-context";
import { AnnotationPin } from "../components/AnnotationPin";
import { AnnotationComposer } from "../components/AnnotationComposer";
import { AnnotationDetail } from "../components/AnnotationDetail";
import { AdoptComposer } from "../components/AdoptComposer";
import type { ClientAnnotation } from "../hooks/usePlaygroundAnnotations";
import { useEditorMode } from "../editor-mode-context";
import { useColorMode } from "../color-mode-context";
import {
  getWorkOverlayCopy,
  WORK_COMPLETION_FLASH_MS,
  type WorkOverlayPhase,
} from "../lib/work-overlay";
import { useWorkSignalSet } from "../work-signal-context";
import { clampPopoverPosition } from "../lib/clampPopoverPosition";
// ---------------------------------------------------------------------------
// Iteration sub-card (dynamically loaded from iterations/)
// ---------------------------------------------------------------------------

function IterationCard({
  fileName,
  componentId,
  parentVariants,
  onTrash,
}: {
  fileName: string;
  componentId: string;
  parentVariants: string[];
  onTrash: (f: string) => void;
}) {
  const [mod, setMod] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdoptComposer, setShowAdoptComposer] = useState(false);

  const iterationLabel = fileName.replace(".tsx", "").replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    import(`../iterations/${fileName}`)
      .then((m) => setMod(m as Record<string, unknown>))
      .catch((e) => setError(e.message));
  }, [fileName]);

  if (error) {
    return (
      <div className="rounded-sm border border-danger/30 bg-page p-3">
        <span className="font-mono text-xs text-danger">
          Failed: {fileName}
        </span>
      </div>
    );
  }

  if (!mod) {
    return (
      <div className="flex h-24 items-center justify-center rounded-sm border border-line bg-page">
        <span className="text-xs text-mute">Loading...</span>
      </div>
    );
  }

  const Comp =
    mod.default ??
    Object.values(mod).find(
      (v) => typeof v === "function" || (typeof v === "object" && v !== null),
    );

  return (
    <div className="group/iter relative rounded-sm border border-line bg-page">
      <div className="flex items-center justify-between border-b border-line px-2 py-1">
        <span className="font-mono text-xs text-mute">
          {fileName.replace(".tsx", "")}
        </span>
        <div className="relative flex items-center gap-1 opacity-0 transition-opacity group-hover/iter:opacity-100">
          <button
            onClick={() => setShowAdoptComposer(true)}
            className="cursor-pointer rounded-xs px-1.5 py-0.5 font-mono text-[10px] text-[rgba(254,248,226,0.5)] hover:text-[#FEF8E2]"
            title="Adopt this iteration"
          >
            Adopt
          </button>
          <button
            onClick={() => onTrash(fileName)}
            className="cursor-pointer rounded-xs px-1.5 py-0.5 text-xs text-danger hover:bg-tinted"
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
          <Suspense fallback={<span className="text-xs text-mute">...</span>}>
            <IterationRenderer component={Comp} />
          </Suspense>
        ) : (
          <span className="text-xs text-mute">No renderable export</span>
        )}
      </div>

      {showAdoptComposer && (
        <AdoptComposer
          componentId={componentId}
          iterationFile={fileName}
          iterationLabel={iterationLabel}
          availableVariants={parentVariants}
          onSubmit={() => setShowAdoptComposer(false)}
          onCancel={() => setShowAdoptComposer(false)}
        />
      )}
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

  return <span className="text-xs text-mute">Cannot preview</span>;
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
  const [forcedState, setForcedState] = useState<ForcedState>("default");
  // States are driven by canonical registry.states in each component's *.meta.ts.
  // "default" is always present; additional states appear when the component declares them.
  const availableStates: ForcedState[] = ["default", ...((entry.states ?? []) as ForcedState[])];
  const hasStateStrip = availableStates.length > 1;
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

  const hasControllableProps =
    Object.keys(entry.props).length > 0 &&
    !(entry.renderMode === "custom" && entry.controlledProps?.length === 0);
  const {
    props,
    remountKey,
    setPropValue,
    resetProps,
  } = useShowcaseProps(entry);

  const { Component, rawComponent } = entry;
  const violations = getViolationsForComponent(entry.sourcePath);
  const hasVariants = entry.variants && entry.variants.length > 0 && rawComponent && typeof rawComponent === 'function';
  const stateAttr = forcedState !== "default" ? forcedState : undefined;
  const isOverlayActive = overlayPhase === "active";

  const { annotationsForComponent } = useAnnotationContext();
  const cardAnnotations = annotationsForComponent(entry.id);
  const positionedAnnotations = cardAnnotations.filter((a) => a.x != null && a.y != null);

  const [exitingPins, setExitingPins] = useState<Set<string>>(new Set());
  const [isHovering, setIsHovering] = useState(false);

  const { editorMode, setEditorMode } = useEditorMode();
  const isCommentMode = editorMode === "comment";
  const isToolActive = isCommentMode;

  // Annotation composer state
  const [annotationComposer, setAnnotationComposer] = useState<{
    x: number; y: number; left: number; top?: number; bottom?: number; variant: string;
    /** The component wrapper element for screenshot capture */
    captureTarget: HTMLElement;
  } | null>(null);
  const [selectedPin, setSelectedPin] = useState<{ annotation: ClientAnnotation; element: HTMLElement } | null>(null);

  // Color mode from context — scoped to component cards, not the playground chrome
  const { colorMode: currentColorMode } = useColorMode();

  const { zoom } = useViewport();

  // Card container ref — used for popover clamping
  const cardRef = useRef<HTMLDivElement>(null);

  // Flow-style hover overlay system — deep element drilling, rAF-throttled.
  // Tooltip is portaled to document.body to escape React Flow's transform.
  // Highlight overlay stays inside the wrapper (transform-relative is correct for it).
  const rafPending = useRef(false);
  const lastHoveredEl = useRef<Element | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  /** Drill into the component to find the deepest child element at the cursor */
  const handleComponentMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isToolActive || rafPending.current) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    // Support being called from the annotation overlay (child) or the wrapper itself
    const overlay = e.currentTarget.dataset.annotationOverlay
      ? e.currentTarget
      : e.currentTarget.querySelector<HTMLElement>("[data-annotation-overlay]");
    const wrapperEl = overlay ? (overlay.parentElement as HTMLDivElement) : e.currentTarget;
    rafPending.current = true;
    requestAnimationFrame(() => {
      rafPending.current = false;
      const tip = tooltipRef.current;
      const hl = wrapperEl.querySelector<HTMLElement>("[data-hover-highlight]");
      if (!tip || !hl) return;

      // Temporarily disable overlay pointer-events so elementFromPoint sees through to the component
      if (overlay) overlay.style.pointerEvents = "none";
      const deepEl = document.elementFromPoint(clientX, clientY);
      if (overlay) overlay.style.pointerEvents = "";

      if (!deepEl || !wrapperEl.contains(deepEl) || deepEl === wrapperEl || deepEl === hl) {
        tip.style.display = "none";
        hl.style.display = "none";
        lastHoveredEl.current = null;
        return;
      }

      const wrapperRect = wrapperEl.getBoundingClientRect();

      // Skip highlight recalc if same element — just update tooltip position
      if (deepEl !== lastHoveredEl.current) {
        lastHoveredEl.current = deepEl;

        // Highlight overlay — position over the drilled-down child (wrapper-relative, zoom-compensated)
        const elRect = deepEl.getBoundingClientRect();
        hl.style.display = "block";
        hl.style.left = `${(elRect.left - wrapperRect.left) / zoom}px`;
        hl.style.top = `${(elRect.top - wrapperRect.top) / zoom}px`;
        hl.style.width = `${elRect.width / zoom}px`;
        hl.style.height = `${elRect.height / zoom}px`;

        tip.textContent = "add annotation";
      }

      // Position tooltip top-right of mouse pointer
      tip.style.display = "block";
      const tipW = tip.offsetWidth;
      const vw = window.innerWidth;
      const left = clientX + tipW + 8 > vw ? clientX - tipW - 4 : clientX + 8;
      tip.style.left = `${Math.max(0, left)}px`;
      tip.style.top = `${Math.max(0, clientY - tip.offsetHeight - 4)}px`;
    });
  }, [isToolActive, zoom]);

  const handleComponentMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const tip = tooltipRef.current;
    const wrapperEl = e.currentTarget.dataset.annotationOverlay
      ? e.currentTarget.parentElement!
      : e.currentTarget;
    const hl = wrapperEl.querySelector<HTMLElement>("[data-hover-highlight]");
    if (tip) tip.style.display = "none";
    if (hl) hl.style.display = "none";
    lastHoveredEl.current = null;
  }, []);

  /** Click handler targets the component wrapper — positions are zoom-compensated */
  const handleComponentClick = (e: React.MouseEvent<HTMLDivElement>, variant: string) => {
    if (!isToolActive) return;
    e.stopPropagation();

    // Measure relative to the component wrapper, not the render area
    const rect = e.currentTarget.getBoundingClientRect();
    const relLeft = (e.clientX - rect.left) / zoom;
    const relTop = (e.clientY - rect.top) / zoom;
    const x = (relLeft / (rect.width / zoom)) * 100;
    const y = (relTop / (rect.height / zoom)) * 100;

    // Clamp popover position within the card container
    const containerEl = cardRef.current;
    const clamped = containerEl
      ? clampPopoverPosition(relLeft, relTop, 256, 200, containerEl.offsetWidth, containerEl.offsetHeight)
      : { left: relLeft, top: relTop };

    setAnnotationComposer({ x, y, left: clamped.left, top: clamped.top, bottom: clamped.bottom, variant, captureTarget: e.currentTarget });
  };

  const handlePinClick = (annotation: ClientAnnotation, element: HTMLElement) => {
    setSelectedPin({ annotation, element });
    setAnnotationComposer(null);
    setShowList(false);
  };

  const handleComposerDone = () => {
    setAnnotationComposer(null);
    setSelectedPin(null);
    setShowList(false);
  };

  const handlePinResolved = (annotationId: string) => {
    setExitingPins((prev) => new Set(prev).add(annotationId));
    setTimeout(() => {
      setExitingPins((prev) => {
        const next = new Set(prev);
        next.delete(annotationId);
        return next;
      });
      handleComposerDone();
    }, 200);
  };

  // Escape: first press closes composer/popover, PlaygroundClient handles mode exit
  const hasOpenPopover = !!(annotationComposer || selectedPin);
  useEffect(() => {
    if (!hasOpenPopover) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Let textarea/input handle their own Escape first
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;

      e.stopPropagation();
      setAnnotationComposer(null);
      setSelectedPin(null);
    };
    window.addEventListener("keydown", handleEscape, true); // capture phase
    return () => window.removeEventListener("keydown", handleEscape, true);
  }, [hasOpenPopover]);

  return (
    <div
      ref={cardRef}
      className="relative"
      data-registry-id={entry.id}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {overlayPhase ? <WorkSignalOverlay phase={overlayPhase} /> : null}

      <div
        className={`flex flex-col rounded-xs border border-[rgba(254,248,226,0.15)] bg-[#0F0E0C] ${
          editorMode === "comment" && isHovering ? "ring-1 ring-inset ring-white/20" : ""
        }`}
        style={{
          boxShadow: isOverlayActive
            ? "0 0 0 2px rgba(255,245,194,0.76), 0 0 34px rgba(255,226,125,0.9), 0 0 84px rgba(255,196,71,0.42)"
            : "0 0 0 1px rgba(252,225,132,0.06), 0 0 12px rgba(252,225,132,0.08)",
          filter: isOverlayActive ? "blur(0.8px) brightness(0.78) saturate(0.82)" : undefined,
          transform: isOverlayActive ? "scale(0.998)" : undefined,
          transition: "filter 160ms ease, transform 160ms ease, box-shadow 160ms ease",
        }}
      >
        <div className="flex">
        {/* Left strip — states */}
        {hasStateStrip && (
          <div className="flex w-[8rem] shrink-0 flex-col border-r border-[rgba(254,248,226,0.1)]">
            <div className="flex flex-col gap-0.5 px-1 pt-2 pb-2">
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="font-mono text-[9px] uppercase tracking-wide text-[rgba(254,248,226,0.4)]">
                  States
                </span>
                {forcedState !== "default" && (
                  <button
                    type="button"
                    onClick={() => setForcedState("default")}
                    className="cursor-pointer font-mono text-[9px] text-[rgba(254,248,226,0.3)] transition-colors hover:text-[#FEF8E2]"
                  >
                    reset
                  </button>
                )}
              </div>
              <button
                onClick={() => setForcedState("default")}
                className={`cursor-pointer rounded-xs px-1 py-0.5 font-mono text-[9px] uppercase leading-none transition-colors ${
                  forcedState === "default"
                    ? "bg-[rgba(254,248,226,0.14)] text-[#FEF8E2]"
                    : "text-[rgba(254,248,226,0.3)] hover:text-[rgba(254,248,226,0.6)]"
                }`}
                title="None"
              >
                none
              </button>
              {availableStates
                .filter((s) => s !== "default")
                .map((state) => (
                  <button
                    key={state}
                    onClick={() => setForcedState(state)}
                    className={`cursor-pointer rounded-xs px-1 py-0.5 font-mono text-[9px] uppercase leading-none transition-colors ${
                      forcedState === state
                        ? "bg-[rgba(254,248,226,0.14)] text-[#FEF8E2]"
                        : "text-[rgba(254,248,226,0.3)] hover:text-[rgba(254,248,226,0.6)]"
                    }`}
                    title={state.charAt(0).toUpperCase() + state.slice(1)}
                  >
                    {state}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Card content */}
        <div className="flex w-[22rem] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(254,248,226,0.15)] px-3 py-2">
          <span className="font-mono text-xs uppercase tracking-tight text-[#FEF8E2]">
            {entry.label}
          </span>
          <div className="relative flex items-center gap-1">
            <AnnotationBadge componentId={entry.id} />
            {violations && <ViolationBadge violations={violations} compact />}
          </div>
        </div>

        {/* Sub-cards — scoped color mode so semantic tokens flip only inside render areas */}
        <div className={`flex flex-col gap-2 p-2 ${currentColorMode}`}>
          {/* Default render */}
          {Component && (() => {
            return (
            <div data-no-clip className="rounded-sm border border-line bg-page" data-variant-label="default">
              <div className="flex items-center border-b border-line px-2 py-1">
                <span className="font-mono text-xs text-mute">default</span>
              </div>
              <div
                className={`relative flex min-h-32 items-center justify-center p-3 ${
                  isToolActive ? "cursor-crosshair [&_*]:!cursor-crosshair" : ""
                }`}
              >
                {/* Component render — overlay intercepts all pointer events in comment mode */}
                <div
                  data-force-state={stateAttr}
                  className="relative w-full"
                >
                  <Suspense fallback={<div className="text-xs text-mute">Loading...</div>}>
                    <Component key={remountKey} {...props} />
                  </Suspense>
                  {isToolActive && (
                    <>
                      <div data-hover-highlight className="pointer-events-none absolute z-30 hidden rounded-xs border-2 border-main/60 bg-main/[0.06]" />
                      {/* Transparent overlay — blocks all component interactions in comment mode */}
                      <div
                        data-annotation-overlay
                        className="absolute inset-0 z-20"
                        onClick={(e) => handleComponentClick(e, "default")}
                        onMouseMove={handleComponentMouseMove}
                        onMouseLeave={handleComponentMouseLeave}
                      />
                    </>
                  )}
                </div>

                {/* Annotation UI — outside forced state scope */}
                {positionedAnnotations
                  .filter((a) => (a.status === "pending" || a.status === "acknowledged") && (!a.variant || a.variant === "default"))
                  .map((a, i) => (
                    <AnnotationPin
                      key={a.id}
                      annotation={a}
                      index={i}
                      onClick={handlePinClick}
                      exiting={exitingPins.has(a.id)}
                      isPending={a.status === "pending"}
                    />
                  ))}

                {annotationComposer?.variant === "default" && (
                  <AnnotationComposer
                    componentId={entry.id}
                    x={annotationComposer.x}
                    y={annotationComposer.y}
                    anchorLeft={annotationComposer.left}
                    anchorTop={annotationComposer.top}
                    anchorBottom={annotationComposer.bottom}
                    variant="default"
                    forcedState={forcedState}
                    availableStates={availableStates}
                    currentColorMode={currentColorMode}
                    currentForcedState={forcedState}
                    captureTarget={annotationComposer.captureTarget}
                    onSubmit={handleComposerDone}
                    onCancel={() => { setAnnotationComposer(null); }}
                  />
                )}

                {selectedPin && (
                  <AnnotationDetail
                    isOpen={true}
                    annotation={selectedPin.annotation}
                    anchorElement={selectedPin.element}
                    onClose={() => setSelectedPin(null)}
                    onResolved={() => handlePinResolved(selectedPin.annotation.id)}
                  />
                )}
              </div>
            </div>
            );
          })()}

          {/* Curated variants */}
          {hasVariants &&
            entry.variants!.map((v) => {
              return (
                <div key={v.label} data-no-clip className="rounded-sm border border-line bg-page" data-variant-label={v.label}>
                  <div className="flex items-center border-b border-line px-2 py-1">
                    <span className="font-mono text-xs text-mute">{v.label}</span>
                  </div>
                  <div
                    className={`relative flex min-h-24 items-center justify-center p-3 ${
                      isToolActive ? "cursor-crosshair [&_*]:!cursor-crosshair" : ""
                    }`}
                  >
                    <div
                      data-force-state={stateAttr}
                      className="relative w-full"
                    >
                      <Suspense fallback={<span className="text-xs text-mute">...</span>}>
                        {rawComponent && typeof rawComponent === 'function' && (() => { const V = rawComponent; return <V {...v.props} />; })()}
                      </Suspense>
                      {isToolActive && (
                        <>
                          <div data-hover-highlight className="pointer-events-none absolute z-30 hidden rounded-xs border-2 border-main/60 bg-main/[0.06]" />
                          <div data-hover-tooltip className="pointer-events-none fixed z-[9999] hidden whitespace-nowrap rounded-sm bg-inv px-1 py-0.5 font-mono text-[9px] uppercase tracking-widest text-flip pixel-shadow-raised" />
                          {/* Transparent overlay — blocks all component interactions in comment mode */}
                          <div
                            data-annotation-overlay
                            className="absolute inset-0 z-20"
                            onClick={(e) => handleComponentClick(e, v.label)}
                            onMouseMove={handleComponentMouseMove}
                            onMouseLeave={handleComponentMouseLeave}
                          />
                        </>
                      )}
                    </div>

                    {/* Annotation pins for this variant */}
                    {positionedAnnotations
                      .filter((a) => (a.status === "pending" || a.status === "acknowledged") && a.variant === v.label)
                      .map((a, i) => (
                        <AnnotationPin
                          key={a.id}
                          annotation={a}
                          index={i}
                          onClick={handlePinClick}
                          exiting={exitingPins.has(a.id)}
                          isPending={a.status === "pending"}
                        />
                      ))}

                    {annotationComposer?.variant === v.label && (
                      <AnnotationComposer
                        componentId={entry.id}
                        x={annotationComposer.x}
                        y={annotationComposer.y}
                        anchorLeft={annotationComposer.left}
                        anchorTop={annotationComposer.top}
                        anchorBottom={annotationComposer.bottom}
                        variant={v.label}
                        forcedState={forcedState}
                        availableStates={availableStates}
                        currentColorMode={currentColorMode}
                        currentForcedState={forcedState}
                        captureTarget={annotationComposer.captureTarget}
                        onSubmit={handleComposerDone}
                        onCancel={() => { setAnnotationComposer(null); }}
                      />
                    )}

                  </div>
                </div>
              );
            })}

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
                  componentId={entry.id}
                  parentVariants={["default", ...(entry.variants?.map((v) => v.label) ?? [])]}
                  onTrash={handleTrash}
                />
              ))}
            </>
          )}
        </div>
        </div>
        </div>
        {/* Props panel — below content */}
        {hasControllableProps && (
          <div className="border-t border-[rgba(254,248,226,0.1)]">
            <PropControls
              props={entry.props}
              values={props}
              onChange={setPropValue}
              onReset={resetProps}
              controlledProps={entry.controlledProps}
              renderMode={entry.renderMode}
              className="bg-[#0F0E0C] text-[#FEF8E2]"
            />
          </div>
        )}
      </div>
      {/* Portaled tooltip — escapes React Flow's transform context */}
      {isToolActive && createPortal(
        <div
          ref={tooltipRef}
          className="pointer-events-none fixed z-[9999] hidden whitespace-nowrap rounded-sm bg-inv px-1 py-0.5 font-mono text-[9px] uppercase tracking-widest text-flip pixel-shadow-raised"
        />,
        document.body,
      )}
    </div>
  );
}

export const ComponentCard = memo(ComponentCardInner);
