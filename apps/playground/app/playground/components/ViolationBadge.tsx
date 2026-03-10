"use client";

import { useState, useRef, useEffect } from "react";
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
        className={`inline-flex items-center justify-center rounded-sm font-mono text-xs leading-none ${
          hasErrors
            ? "bg-status-error text-content-inverted"
            : "bg-status-warning text-content-primary"
        } ${compact ? "h-4 min-w-4 px-0.5" : "h-5 min-w-5 px-1"}`}
        title={`${count} RDNA violation${count !== 1 ? "s" : ""}`}
      >
        {count}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-md border border-edge-primary bg-surface-primary p-3 shadow-floating">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-heading text-xs uppercase tracking-tight text-content-muted">
              RDNA Violations
            </span>
            <span className="font-mono text-xs text-content-muted">
              {violations.filePath.split("/").pop()}
            </span>
          </div>

          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {violations.violations.map((v, i) => (
              <li key={i} className="border-l-2 pl-2 text-xs leading-relaxed">
                <div
                  className={`font-mono ${
                    v.severity === "error"
                      ? "text-status-error"
                      : "text-status-warning"
                  }`}
                >
                  {v.ruleId}
                </div>
                <div className="text-content-secondary">{v.message}</div>
                <div className="text-content-muted">
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
