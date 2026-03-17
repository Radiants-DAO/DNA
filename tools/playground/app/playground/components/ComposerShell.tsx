"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { LoadingDots } from "./LoadingDots";

interface ComposerShellProps {
  /** Inline left/top positioning (used by annotation/variation composers) */
  position?: { left: number; top: number };
  /** CSS class-based positioning override (e.g. "right-0 top-0" for AdoptComposer) */
  positionClassName?: string;
  headerLabel: string;
  placeholder: string;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  /** Slot for mode-specific controls (intent picker, state toggles, etc.) */
  children?: ReactNode;
  /** Whether the textarea message is required for submit (default: true) */
  requireMessage?: boolean;
}

export function ComposerShell({
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
}: ComposerShellProps) {
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
      style={position ? { left: position.left, top: position.top } : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-64 rounded-sm border border-line bg-page shadow-floating">
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
            className="w-full resize-none rounded-xs border border-rule bg-page px-2 py-1.5 font-mono text-xs text-main placeholder:text-mute focus:border-line-hover focus:outline-none"
          />

          {/* Mode-specific controls slot */}
          {children}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-xs text-mute">
              ⌘+Enter to submit
            </span>
            <div className="flex gap-1.5">
              {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:compact-pill-ui owner:design-system expires:2026-09-16 issue:DNA-playground-annotation-density */}
              <button
                onClick={onCancel}
                className="rounded-xs px-2 py-1 font-mono text-xs text-mute hover:bg-hover"
              >
                Cancel
              </button>
              {/* eslint-disable-next-line rdna/prefer-rdna-components -- reason:compact-pill-ui owner:design-system expires:2026-09-16 issue:DNA-playground-annotation-density */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="rounded-xs border border-line bg-hover px-2 py-1 font-mono text-xs text-main hover:bg-active disabled:opacity-40"
              >
                {submitting ? <LoadingDots /> : submitLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Reusable section label for composer controls */
export function ComposerLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-xs uppercase tracking-widest text-mute">
      {children}
    </span>
  );
}

/** Reusable toggle pill for mode/state selection in composers */
export function ComposerPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    // eslint-disable-next-line rdna/prefer-rdna-components -- reason:compact-pill-ui owner:design-system expires:2026-09-16 issue:DNA-playground-annotation-density
    <button
      onClick={onClick}
      className={`rounded-xs px-1.5 py-0.5 font-mono text-xs transition-colors ${
        active
          ? "bg-hover text-main"
          : "text-mute hover:text-sub"
      }`}
    >
      {children}
    </button>
  );
}
