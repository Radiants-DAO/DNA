/**
 * PagePreviewCard - Full page preview on the component canvas
 *
 * Ported from Flow 0.
 */

import { useRef, useState, useCallback } from "react";
import { useAppStore } from "../../stores/appStore";

// ============================================================================
// Viewport Presets
// ============================================================================

interface ViewportPreset {
  label: string;
  width: number;
  height: number;
  category: "desktop" | "mobile";
}

const VIEWPORT_PRESETS: ViewportPreset[] = [
  // Desktop
  { label: "4K", width: 3840, height: 2160, category: "desktop" },
  { label: "2K", width: 2560, height: 1440, category: "desktop" },
  { label: "1080p", width: 1920, height: 1080, category: "desktop" },
  { label: "720p", width: 1280, height: 720, category: "desktop" },
  // Mobile
  { label: "iPhone 16 Pro", width: 402, height: 874, category: "mobile" },
  { label: "iPhone SE", width: 375, height: 667, category: "mobile" },
  { label: "Pixel 9", width: 412, height: 923, category: "mobile" },
  { label: "iPad", width: 810, height: 1080, category: "mobile" },
  { label: "iPad Pro", width: 1024, height: 1366, category: "mobile" },
];

const HEADER_HEIGHT = 36;
const GAP = 48;

interface PagePreviewCardProps {
  /** Right edge of the component node grid (x + width of rightmost node) */
  componentsRight: number;
}

/**
 * PagePreviewCard - Full page preview on the component canvas.
 */
export function PagePreviewCard({ componentsRight }: PagePreviewCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const config = useAppStore((s) => s.pagePreviewConfig);
  const togglePagePreview = useAppStore((s) => s.togglePagePreview);

  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isLandscape, setIsLandscape] = useState(true);
  const [viewportSize, setViewportSize] = useState<{
    w: number;
    h: number;
  } | null>(null);

  // Drag state
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{
    mouseX: number;
    mouseY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      // Only drag from header area
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        offsetX: dragOffset.x,
        offsetY: dragOffset.y,
      };

      const handleMove = (ev: MouseEvent) => {
        if (!dragStart.current) return;
        setDragOffset({
          x: dragStart.current.offsetX + (ev.clientX - dragStart.current.mouseX),
          y: dragStart.current.offsetY + (ev.clientY - dragStart.current.mouseY),
        });
      };

      const handleUp = () => {
        setIsDragging(false);
        dragStart.current = null;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [dragOffset]
  );

  if (!config.enabled || !config.url) return null;

  const cardWidth = viewportSize ? viewportSize.w : config.width;
  const iframeH = viewportSize ? viewportSize.h : config.height - HEADER_HEIGHT;
  const cardHeight = iframeH + HEADER_HEIGHT;

  // Default position: right of component grid, top-aligned
  const baseX = componentsRight + GAP;
  const baseY = config.y;

  const selectPreset = (preset: ViewportPreset) => {
    const w = isLandscape ? preset.width : preset.height;
    const h = isLandscape ? preset.height : preset.width;
    setViewportSize({ w, h });
    setActivePreset(preset.label);
  };

  const toggleOrientation = () => {
    const next = !isLandscape;
    setIsLandscape(next);

    if (activePreset) {
      const preset = VIEWPORT_PRESETS.find((p) => p.label === activePreset);
      if (preset) {
        const w = next ? preset.width : preset.height;
        const h = next ? preset.height : preset.width;
        setViewportSize({ w, h });
      }
    }
  };

  const desktopPresets = VIEWPORT_PRESETS.filter(
    (p) => p.category === "desktop"
  );
  const mobilePresets = VIEWPORT_PRESETS.filter((p) => p.category === "mobile");

  return (
    <div
      className="absolute rounded-lg overflow-hidden"
      data-devflow-id="page-preview-card"
      data-radflow-id="page-preview-card"
      style={{
        left: baseX + dragOffset.x,
        top: baseY + dragOffset.y,
        width: cardWidth,
        height: cardHeight,
        zIndex: 10,
        backgroundColor: "#1a1a1a",
        border: "2px solid rgba(139, 92, 246, 0.5)",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
        cursor: isDragging ? "grabbing" : undefined,
      }}
    >
      {/* Header - drag handle */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b select-none"
        data-radflow-id="page-preview-header"
        style={{
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          borderColor: "rgba(255, 255, 255, 0.08)",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseDown={handleDragStart}
      >
        {/* Drag grip */}
        <svg
          width="8"
          height="14"
          viewBox="0 0 8 14"
          className="text-white/20 flex-shrink-0"
        >
          <circle cx="2" cy="2" r="1" fill="currentColor" />
          <circle cx="6" cy="2" r="1" fill="currentColor" />
          <circle cx="2" cy="7" r="1" fill="currentColor" />
          <circle cx="6" cy="7" r="1" fill="currentColor" />
          <circle cx="2" cy="12" r="1" fill="currentColor" />
          <circle cx="6" cy="12" r="1" fill="currentColor" />
        </svg>

        <span className="text-xs font-medium text-[rgba(255,255,255,0.9)] mr-1">
          Page Preview
        </span>

        {/* Viewport selector */}
        <div className="flex items-center gap-0.5 bg-black/30 rounded-md p-0.5 flex-1 overflow-x-auto">
          {desktopPresets.map((preset) => (
            <button
              key={preset.label}
              onClick={(e) => {
                e.stopPropagation();
                selectPreset(preset);
              }}
              className={`px-1.5 py-0.5 text-[10px] rounded transition-colors whitespace-nowrap ${
                activePreset === preset.label
                  ? "bg-white/15 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
              title={`${preset.width} x ${preset.height}`}
            >
              {preset.label}
            </button>
          ))}

          <div className="w-px h-3 bg-white/10 mx-0.5 flex-shrink-0" />

          {mobilePresets.map((preset) => (
            <button
              key={preset.label}
              onClick={(e) => {
                e.stopPropagation();
                selectPreset(preset);
              }}
              className={`px-1.5 py-0.5 text-[10px] rounded transition-colors whitespace-nowrap ${
                activePreset === preset.label
                  ? "bg-white/15 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
              title={`${preset.width} x ${preset.height}`}
            >
              {preset.label}
            </button>
          ))}

          <div className="w-px h-3 bg-white/10 mx-0.5 flex-shrink-0" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleOrientation();
            }}
            className="px-1.5 py-0.5 text-[10px] rounded text-white/40 hover:text-white/70 transition-colors"
            title={isLandscape ? "Switch to portrait" : "Switch to landscape"}
          >
            {isLandscape ? "\u2B0C" : "\u2B0D"}
          </button>
        </div>

        {/* Close */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePagePreview();
          }}
          className="text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.8)] transition-colors flex-shrink-0"
          title="Close page preview"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Iframe */}
      <div
        className="overflow-hidden bg-white"
        style={{ width: cardWidth, height: cardHeight - HEADER_HEIGHT }}
      >
        <iframe
          ref={iframeRef}
          src={config.url}
          className="border-0"
          style={{
            width: cardWidth,
            height: iframeH,
            pointerEvents: isDragging ? "none" : "none",
          }}
          title="Page Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>

      {/* Resolution label */}
      {viewportSize && (
        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-white/30 bg-black/50 px-1.5 py-0.5 rounded">
          {cardWidth} x {iframeH}
        </div>
      )}
    </div>
  );
}

export default PagePreviewCard;
