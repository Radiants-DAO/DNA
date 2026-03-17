"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { Button, Spinner } from "@rdna/radiants/components/core";

interface ComposerShellV2Props {
  position?: { left: number; top: number };
  positionClassName?: string;
  headerLabel: string;
  placeholder: string;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  children?: ReactNode;
  requireMessage?: boolean;
}

export function ComposerShellV2({
  position,
  positionClassName,
  headerLabel,
  placeholder,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
  children,
  requireMessage = true,
}: ComposerShellV2Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const canSubmit = !submitting && (!requireMessage || message.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(message.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      className={`dark absolute z-30 ${positionClassName ?? ""}`}
      style={{
        ...(position ? { left: position.left, top: position.top } : {}),
        animation: "popupIn var(--duration-moderate) var(--easing-spring) both",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-64 rounded-2xl border border-line bg-page shadow-floating">
        {/* Header */}
        <div className="border-b border-rule px-3 py-2">
          <span className="font-mono text-xs uppercase tracking-widest text-mute">
            {headerLabel}
          </span>
        </div>

        <div className="flex flex-col gap-2 p-3">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={3}
            className="w-full resize-none rounded-lg border border-rule bg-page px-2 py-1.5 font-mono text-xs text-main transition-colors placeholder:text-mute focus:border-line-hover focus:outline-none"
          />

          {/* Mode-specific controls slot */}
          {children}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-xs text-mute">
              ⌘+Enter to submit
            </span>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting ? <Spinner size={12} /> : submitLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Collapsible section with CSS grid-row animation */
export function ComposerSection({
  label,
  defaultOpen = true,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="text"
        size="sm"
        onClick={() => setOpen(!open)}
        className="!justify-start !gap-1 !px-0"
      >
        <span className="font-mono text-xs uppercase tracking-widest text-mute">
          {label}
        </span>
        <svg
          width="10" height="10" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          className="text-mute"
          style={{
            transition: "transform var(--duration-slow) var(--easing-spring)",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Button>
      <div
        className="grid"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows var(--duration-slow) var(--easing-spring)",
        }}
      >
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Toggle pill using RDNA Button */
export function ComposerPillV2({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
