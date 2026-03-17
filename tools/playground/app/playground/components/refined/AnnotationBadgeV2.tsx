"use client";

import { useAnnotationContext } from "../../annotation-context";

interface AnnotationBadgeV2Props {
  componentId: string;
  onClick?: () => void;
}

export function AnnotationBadgeV2({ componentId, onClick }: AnnotationBadgeV2Props) {
  const { countForComponent } = useAnnotationContext();
  const count = countForComponent(componentId);

  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-warning px-1 font-mono text-xs font-semibold text-page shadow-glow-sm"
      style={{
        animation: "badgeIn var(--duration-slow) var(--easing-spring) 0.4s both",
        transition: "transform var(--duration-fast) ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      title={`${count} pending annotation${count === 1 ? "" : "s"}`}
    >
      {count}
    </button>
  );
}
