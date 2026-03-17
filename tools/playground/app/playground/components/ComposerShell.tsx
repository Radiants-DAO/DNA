"use client";

import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { Spinner } from "@rdna/radiants/components/core";
import { ScreenshotStrip } from "./ScreenshotStrip";
import { useAnimatedMount } from "../hooks/useAnimatedMount";

interface ComposerShellProps {
  /** Inline left/top positioning (used by annotation/variation composers) */
  position?: { left: number; top: number };
  /** CSS class-based positioning override (e.g. "right-0 top-0" for AdoptComposer) */
  positionClassName?: string;
  headerLabel: string;
  placeholder: string;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (text: string, screenshots: string[]) => void;
  onCancel: () => void;
  /** Slot for mode-specific controls (intent picker, state toggles, etc.) */
  children?: ReactNode;
  /** Whether the textarea message is required for submit (default: true) */
  requireMessage?: boolean;
  /** Element to auto-capture when the camera button is clicked */
  captureTarget?: HTMLElement | null;
  /** Controls mount/unmount with enter/exit animation */
  isOpen: boolean;
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
  captureTarget,
  isOpen,
}: ComposerShellProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const { mounted, animState } = useAnimatedMount(isOpen, { enterDuration: 200, exitDuration: 150 });

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Outside-click: shake if textarea has content, cancel if empty
  useEffect(() => {
    if (!isOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        if (message.trim().length > 0) {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 300);
        } else {
          onCancel();
        }
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen, message, onCancel]);

  if (!mounted) return null;

  const canSubmit = !submitting && (!requireMessage || message.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(message.trim(), screenshots);
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

  /** Auto-capture the component render area */
  const handleCapture = useCallback(async () => {
    if (!captureTarget || capturing) return;
    setCapturing(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(captureTarget, { pixelRatio: 2 });
      setScreenshots((prev) => [...prev, dataUrl]);
    } catch {
      // capture failed silently
    } finally {
      setCapturing(false);
    }
  }, [captureTarget, capturing]);

  /** Handle pasted images from clipboard */
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setScreenshots((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  }, []);

  const animStyle: React.CSSProperties = (() => {
    if (isShaking) return { animation: "shake 0.3s ease-out" };
    if (animState === "entering") return { animation: "popupIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) both" };
    if (animState === "exiting") return { animation: "popupOut 0.15s ease-in both" };
    return {};
  })();

  return (
    <div
      ref={wrapperRef}
      className={`dark absolute z-30 ${positionClassName ?? ""}`}
      style={{
        ...(position ? { left: position.left, top: position.top } : {}),
        ...animStyle,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-64 rounded-sm border border-line bg-page shadow-floating">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rule px-3 py-2">
          <span className="font-mono text-xs uppercase tracking-widest text-mute">
            {headerLabel}
          </span>
          {captureTarget && (
            // eslint-disable-next-line rdna/prefer-rdna-components -- reason:compact-pill-ui owner:design-system expires:2026-09-16 issue:DNA-playground-annotation-density
            <button
              type="button"
              onClick={handleCapture}
              disabled={capturing}
              className="font-mono text-xs text-mute hover:text-main disabled:opacity-40"
              title="Capture component screenshot"
            >
              {capturing ? <Spinner size={12} /> : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 p-3">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            rows={3}
            className="w-full resize-none rounded-xs border border-rule bg-page px-2 py-1.5 font-mono text-xs text-main placeholder:text-mute focus:border-line-hover focus:outline-none"
          />

          {/* Screenshot thumbnails */}
          <ScreenshotStrip
            screenshots={screenshots}
            onRemove={(i) => setScreenshots((prev) => prev.filter((_, idx) => idx !== i))}
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
                {submitting ? <Spinner size={12} /> : submitLabel}
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
  activeClassName,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  /** Override active state colors (default: "bg-hover text-main") */
  activeClassName?: string;
}) {
  return (
    // eslint-disable-next-line rdna/prefer-rdna-components -- reason:compact-pill-ui owner:design-system expires:2026-09-16 issue:DNA-playground-annotation-density
    <button
      onClick={onClick}
      className={`rounded-xs px-1.5 py-0.5 font-mono text-xs transition-colors ${
        active
          ? activeClassName ?? "bg-hover text-main"
          : "text-mute hover:text-sub"
      }`}
    >
      {children}
    </button>
  );
}
