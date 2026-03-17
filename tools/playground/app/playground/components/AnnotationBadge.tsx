"use client";

import { Badge } from "@rdna/radiants/components/core/Badge/Badge";
import { useAnnotationContext } from "../annotation-context";

interface AnnotationBadgeProps {
  componentId: string;
  onClick?: () => void;
}

export function AnnotationBadge({ componentId, onClick }: AnnotationBadgeProps) {
  const { countForComponent } = useAnnotationContext();
  const count = countForComponent(componentId);

  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="cursor-pointer"
      title={`${count} pending annotation${count === 1 ? "" : "s"}`}
    >
      <span key={count} style={{ animation: 'badgeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
        <Badge variant="default" size="sm">
          {count}
        </Badge>
      </span>
    </button>
  );
}
