"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@rdna/radiants/components/core/Badge/Badge";
import type { ComponentViolations } from "../lib/violations";

interface ViolationBadgeProps {
  violations: ComponentViolations;
  /** Compact mode for sidebar list items */
  compact?: boolean;
}

export function ViolationBadge({ violations, compact }: ViolationBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const hasErrors = violations.errorCount > 0;
  const count = violations.errorCount + violations.warnCount;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="cursor-pointer"
        title={`${count} RDNA violation${count !== 1 ? "s" : ""}`}
      >
        <Badge
          variant={hasErrors ? "error" : "warning"}
          size="sm"
        >
          {count}
        </Badge>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-menus mt-1 w-72 rounded-sm border border-line bg-page p-3 shadow-floating">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-heading text-xs uppercase tracking-tight text-mute">
              RDNA Violations
            </span>
            <span className="font-mono text-xs text-mute">
              {violations.filePath.split("/").pop()}
            </span>
          </div>

          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {violations.violations.map((v, i) => (
              <li key={i} className="border-l-2 pl-2 text-xs leading-relaxed">
                <div
                  className={`font-mono ${
                    v.severity === "error"
                      ? "text-danger"
                      : "text-warning"
                  }`}
                >
                  {v.ruleId}
                </div>
                <div className="text-sub">{v.message}</div>
                <div className="text-mute">
                  Line {v.line}:{v.column}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
