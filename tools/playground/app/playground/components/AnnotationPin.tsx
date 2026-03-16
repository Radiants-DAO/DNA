"use client";

import type { ClientAnnotation } from "../hooks/usePlaygroundAnnotations";

interface AnnotationPinProps {
  annotation: ClientAnnotation;
  index: number;
  onClick: (annotation: ClientAnnotation, element: HTMLElement) => void;
}

export function AnnotationPin({ annotation, index, onClick }: AnnotationPinProps) {
  if (annotation.x == null || annotation.y == null) return null;

  const isPending = annotation.status === "pending" || annotation.status === "acknowledged";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(annotation, e.currentTarget);
      }}
      className="group/pin absolute z-10 flex -translate-x-1/2 -translate-y-full cursor-pointer items-center justify-center"
      style={{
        left: `${annotation.x}%`,
        top: `${annotation.y}%`,
      }}
      title={annotation.message}
    >
      {/* Pin stem */}
      <div className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2 bg-main/50" />
      {/* Pin head */}
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[9px] leading-none transition-transform group-hover/pin:scale-110 ${
          isPending
            ? "border-main/60 bg-main/[0.18] text-main"
            : "border-main/25 bg-main/[0.06] text-main/40"
        }`}
        style={{ marginBottom: 8 }}
      >
        {index + 1}
      </div>
    </button>
  );
}
