"use client";

import { useAnnotationCount } from "../annotation-context";

interface AnnotationBadgeProps {
  componentId: string;
}

export function AnnotationBadge({ componentId }: AnnotationBadgeProps) {
  const getCount = useAnnotationCount();
  const count = getCount(componentId);

  if (count === 0) return null;

  return (
    <button
      className="flex items-center gap-1 rounded-sm border border-[rgba(254,248,226,0.25)] bg-[rgba(254,248,226,0.08)] px-1.5 py-0.5 font-mono text-[10px] text-[#FEF8E2] transition-colors hover:bg-[rgba(254,248,226,0.15)]"
      title={`${count} pending annotation${count === 1 ? "" : "s"}`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {count}
    </button>
  );
}
