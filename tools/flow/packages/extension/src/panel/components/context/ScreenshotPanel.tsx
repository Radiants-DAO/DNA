import React, { useState, useCallback, useEffect } from "react";
import { RefreshCw, Check, Copy, AlertCircle } from "../ui/icons";
import { useInspection } from "../../context/InspectionContext";
import {
  captureScreenshot as cdpCaptureScreenshot,
  captureSelectedElement,
} from "../../api/screenshotService";

/**
 * ScreenshotPanel - Capture screenshots of elements or viewport
 *
 * Features:
 * - Capture full viewport
 * - Capture selected element
 * - Download or copy to clipboard
 * - Screenshot history
 */

// ============================================================================
// Types
// ============================================================================

type CaptureMode = "viewport" | "element" | "fullpage";

interface Screenshot {
  id: string;
  mode: CaptureMode;
  dataUrl: string;
  timestamp: number;
  width: number;
  height: number;
  elementSelector?: string;
}

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  refresh: <RefreshCw className="w-3 h-3" />,
  check: <Check className="w-3.5 h-3.5" />,
  copy: <Copy className="w-3 h-3" />,
  error: <AlertCircle className="w-3.5 h-3.5" />,
  camera: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  download: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  trash: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  ),
  viewport: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  element: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  ),
  fullpage: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
    </svg>
  ),
};

// ============================================================================
// Mode Selector
// ============================================================================

interface ModeSelectorProps {
  mode: CaptureMode;
  onModeChange: (mode: CaptureMode) => void;
  hasSelectedElement: boolean;
}

function ModeSelector({ mode, onModeChange, hasSelectedElement }: ModeSelectorProps) {
  const modes: Array<{ id: CaptureMode; label: string; icon: React.ReactNode; disabled?: boolean }> = [
    { id: "viewport", label: "Viewport", icon: Icons.viewport },
    { id: "element", label: "Element", icon: Icons.element, disabled: !hasSelectedElement },
    { id: "fullpage", label: "Full Page", icon: Icons.fullpage },
  ];

  return (
    <div className="flex gap-1">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => !m.disabled && onModeChange(m.id)}
          disabled={m.disabled}
          className={`flex items-center gap-1 px-2 py-1.5 rounded transition-colors ${
            mode === m.id
              ? "bg-blue-500/20 text-blue-400"
              : m.disabled
              ? "text-neutral-600 cursor-not-allowed"
              : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-700/50"
          }`}
          title={m.disabled ? "Select an element first" : m.label}
        >
          {m.icon}
          <span className="text-[10px]">{m.label}</span>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Screenshot Card
// ============================================================================

interface ScreenshotCardProps {
  screenshot: Screenshot;
  onDownload: () => void;
  onCopy: () => void;
  onDelete: () => void;
  copied: boolean;
}

function ScreenshotCard({
  screenshot,
  onDownload,
  onCopy,
  onDelete,
  copied,
}: ScreenshotCardProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const modeLabels: Record<CaptureMode, string> = {
    viewport: "Viewport",
    element: "Element",
    fullpage: "Full Page",
  };

  return (
    <div className="p-2 bg-neutral-800/50 rounded border border-neutral-700 space-y-2">
      {/* Preview */}
      <div className="aspect-video bg-neutral-900 rounded overflow-hidden">
        <img
          src={screenshot.dataUrl}
          alt="Screenshot"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Info */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] text-neutral-400">
            {modeLabels[screenshot.mode]}
          </span>
          <span className="text-[10px] text-neutral-600 ml-2">
            {screenshot.width} x {screenshot.height}
          </span>
        </div>
        <span className="text-[10px] text-neutral-500">
          {formatTime(screenshot.timestamp)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        <button
          onClick={onDownload}
          className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] text-neutral-300 bg-neutral-700 rounded hover:bg-neutral-600 transition-colors"
          title="Download"
        >
          {Icons.download}
          <span>Download</span>
        </button>
        <button
          onClick={onCopy}
          className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] text-neutral-300 bg-neutral-700 rounded hover:bg-neutral-600 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <span className="text-green-400">{Icons.check}</span>
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              {Icons.copy}
              <span>Copy</span>
            </>
          )}
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-neutral-500 hover:text-red-400 rounded hover:bg-neutral-600 transition-colors"
          title="Delete"
        >
          {Icons.trash}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main ScreenshotPanel Component
// ============================================================================

export function ScreenshotPanel() {
  const { selectedElement } = useInspection();
  const [mode, setMode] = useState<CaptureMode>("viewport");
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-switch to viewport if element mode selected but no element
  useEffect(() => {
    if (mode === "element" && !selectedElement) {
      setMode("viewport");
    }
  }, [selectedElement, mode]);

  const captureScreenshot = useCallback(async () => {
    setCapturing(true);
    setError(null);

    try {
      let dataUrl: string | null = null;

      if (mode === "element") {
        dataUrl = await captureSelectedElement({ format: "png" });
        if (!dataUrl) throw new Error("No element selected or element not found");
      } else {
        // Both viewport and fullpage use CDP Page.captureScreenshot
        // (fullpage degrades to viewport — CDP limitation without headless mode)
        dataUrl = await cdpCaptureScreenshot({ format: "png" });
      }

      // Get dimensions from the image itself
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("Failed to decode screenshot image"));
      });

      setScreenshots((prev) => [
        {
          id: `ss-${Date.now()}`,
          mode,
          dataUrl,
          timestamp: Date.now(),
          width: img.naturalWidth,
          height: img.naturalHeight,
          elementSelector: mode === "element" ? selectedElement?.selector : undefined,
        },
        ...prev,
      ]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to capture screenshot");
    } finally {
      setCapturing(false);
    }
  }, [mode, selectedElement?.selector]);

  const handleDownload = useCallback((screenshot: Screenshot) => {
    const link = document.createElement("a");
    link.href = screenshot.dataUrl;
    link.download = `screenshot-${screenshot.mode}-${screenshot.timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleCopy = useCallback(async (screenshot: Screenshot) => {
    try {
      // Convert data URL to blob
      const response = await fetch(screenshot.dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopiedId(screenshot.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Failed to copy screenshot:", err);
      setError("Failed to copy to clipboard");
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-neutral-700 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-blue-400">{Icons.camera}</span>
          <span className="text-xs font-medium text-neutral-200">
            Screenshot
          </span>
        </div>

        {/* Mode selector */}
        <ModeSelector
          mode={mode}
          onModeChange={setMode}
          hasSelectedElement={!!selectedElement}
        />

        {/* Capture button */}
        <button
          onClick={captureScreenshot}
          disabled={capturing || (mode === "element" && !selectedElement)}
          className="w-full py-2 text-xs font-medium rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {capturing ? (
            <>
              <span className="animate-spin">{Icons.refresh}</span>
              <span>Capturing...</span>
            </>
          ) : (
            <>
              {Icons.camera}
              <span>Capture Screenshot</span>
            </>
          )}
        </button>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-1 text-red-400 text-[10px]">
            {Icons.error}
            <span>{error}</span>
          </div>
        )}

        {/* Element hint */}
        {mode === "element" && !selectedElement && (
          <p className="text-[10px] text-yellow-400/70">
            Select an element on the page to capture it
          </p>
        )}
      </div>

      {/* Screenshots list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {screenshots.length > 0 ? (
          <>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">
              History ({screenshots.length})
            </div>
            {screenshots.map((screenshot) => (
              <ScreenshotCard
                key={screenshot.id}
                screenshot={screenshot}
                onDownload={() => handleDownload(screenshot)}
                onCopy={() => handleCopy(screenshot)}
                onDelete={() => handleDelete(screenshot.id)}
                copied={copiedId === screenshot.id}
              />
            ))}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-neutral-500 mb-2">{Icons.camera}</div>
            <p className="text-xs text-neutral-500">
              No screenshots yet. Click capture to take one.
            </p>
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="p-3 border-t border-neutral-700">
        <p className="text-[10px] text-neutral-600">
          Screenshots are stored in memory and will be lost when the panel is closed.
        </p>
      </div>
    </div>
  );
}

export default ScreenshotPanel;
