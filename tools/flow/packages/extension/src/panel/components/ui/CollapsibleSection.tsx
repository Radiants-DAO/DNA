import { useState, useId } from "react";
import { ChevronDown, ChevronRight } from "./icons";

interface CollapsibleSectionProps {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

export function CollapsibleSection({ title, count, defaultExpanded = false, children, badge }: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentId = useId();

  return (
    <div className="space-y-1">
      <button
        className="w-full flex items-center gap-1 text-left"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <span className="text-neutral-400">
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </span>
        <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium flex-1">
          {title}
        </span>
        {badge}
        <span className="text-[10px] text-neutral-500">{count}</span>
      </button>
      <div id={contentId} className="space-y-0.5" hidden={!isExpanded}>
        {children}
      </div>
    </div>
  );
}
