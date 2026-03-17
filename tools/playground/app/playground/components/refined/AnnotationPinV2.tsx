"use client";

import { useState } from "react";
import type { ClientAnnotation } from "../../hooks/usePlaygroundAnnotations";

interface AnnotationPinV2Props {
  annotation: ClientAnnotation;
  index: number;
  onClick: (annotation: ClientAnnotation, element: HTMLElement) => void;
}

const INTENT_COLORS: Record<string, string> = {
  fix: "bg-danger text-page",
  change: "bg-warning text-page",
  question: "bg-main text-page",
  adopt: "bg-main text-page",
};

export function AnnotationPinV2({ annotation, index, onClick }: AnnotationPinV2Props) {
  if (annotation.x == null || annotation.y == null) return null;

  const [hovered, setHovered] = useState(false);
  const isPending = annotation.status === "pending" || annotation.status === "acknowledged";
  const colorClass = isPending
    ? (INTENT_COLORS[annotation.intent] ?? "bg-main text-page")
    : "bg-mute text-page";

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(annotation, e.currentTarget); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group/pin absolute z-10"
      style={{
        left: `${annotation.x}%`,
        top: `${annotation.y}%`,
        animation: `markerIn var(--duration-slow) var(--easing-spring) both`,
        animationDelay: `${index * 20}ms`,
      }}
    >
      {/* Marker circle */}
      <div
        className={`flex h-[22px] w-[22px] -translate-x-1/2 -translate-y-full items-center justify-center rounded-full font-mono text-xs font-semibold shadow-glow-sm ${colorClass}`}
        style={{
          transition: "transform var(--duration-fast) ease",
          transform: hovered ? "scale(1.1)" : "scale(1)",
        }}
      >
        {index + 1}
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute left-1/2 top-[6px] z-20 w-[180px] -translate-x-1/2 rounded-xl bg-page px-3 py-2 shadow-raised"
          style={{ animation: "popupIn var(--duration-fast) var(--easing-spring) both" }}
        >
          <p className="line-clamp-2 font-mono text-xs text-main">{annotation.message}</p>
          <span className="mt-0.5 block font-mono text-xs text-mute">{annotation.intent}</span>
        </div>
      )}
    </button>
  );
}
