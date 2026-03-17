"use client";

import type { ClientAnnotation } from "../hooks/usePlaygroundAnnotations";

interface AnnotationPinProps {
  annotation: ClientAnnotation;
  index: number;
  onClick: (annotation: ClientAnnotation, element: HTMLElement) => void;
  exiting?: boolean;
  isPending?: boolean;
}

/** Pencil icon — clicking a pin enters the edit flow */
function EditIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

export function AnnotationPin({ annotation, index, onClick, exiting, isPending }: AnnotationPinProps) {
  if (annotation.x == null || annotation.y == null) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(annotation, e.currentTarget);
      }}
      className="group/pin absolute z-10 flex flex-col items-center"
      style={{
        left: `${annotation.x}%`,
        top: `${annotation.y}%`,
        transform: "translate(-50%, -100%)",
        animation: exiting
          ? `markerOut var(--duration-moderate, 200ms) ease-out both`
          : `markerIn var(--duration-slow, 300ms) cubic-bezier(0.22, 1, 0.36, 1) both`,
        animationDelay: exiting ? '0ms' : `${index * 20}ms`,
      }}
    >
      {/* Badge head — semantic tokens adapt to light/dark mode */}
      <div
        className="relative flex h-[18px] min-w-[18px] items-center justify-center gap-0.5 rounded-sm border border-main/25 bg-main/[0.08] px-1 font-mono text-xs font-semibold text-main transition-colors hover:bg-main/[0.15]"
      >
        <EditIcon />
        <span className="text-[9px] leading-none">{index + 1}</span>
        {isPending && (
          <span
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ animation: 'pendingPulse 2s ease-in-out infinite' }}
          />
        )}
      </div>

      {/* Needle stem */}
      <div className="h-2 w-px bg-main/50" />
    </button>
  );
}
