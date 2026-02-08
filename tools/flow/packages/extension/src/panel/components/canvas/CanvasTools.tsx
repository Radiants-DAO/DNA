import { useRef, useEffect } from "react";
import { SelectionOutline, HoverOutline } from "./Outline";
import { createInterceptor, type Interceptor, type InterceptorMode } from "../../utils/canvas/interceptor";
import type { RadflowId, SerializedComponentEntry, BridgeSelection } from "../../stores/types";

/**
 * Props for the CanvasTools component
 */
export interface CanvasToolsProps {
  /** Ref to the preview iframe */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** Scale factor for the canvas (default: 1) */
  scale?: number;
  /** Whether we're in design mode (not preview) */
  isDesignMode?: boolean;
  /** Currently selected bridge selection */
  bridgeSelection?: BridgeSelection | null;
  /** Currently hovered element ID */
  bridgeHoveredId?: RadflowId | null;
  /** Component lookup map */
  bridgeComponentLookup?: Map<RadflowId, SerializedComponentEntry>;
  /** Set of selected IDs for multi-selection */
  selectedIds?: Set<RadflowId>;
}

/**
 * CanvasTools - Overlay container for canvas interaction tools.
 *
 * Ported from Flow 0 with adaptations for the extension panel.
 * This component manages:
 * - Selection outlines (blue border around selected element)
 * - Hover outlines (orange border on mouseover)
 * - Event interception (prevents form submission, link clicks in design mode)
 *
 * Unlike Flow 0, this version uses props instead of store state
 * to make it more portable and testable.
 */
export function CanvasTools({
  iframeRef,
  scale = 1,
  isDesignMode = true,
  bridgeSelection = null,
  bridgeHoveredId = null,
  bridgeComponentLookup = new Map(),
  selectedIds = new Set(),
}: CanvasToolsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const interceptorRef = useRef<Interceptor | null>(null);

  // Get selected entry from lookup
  const selectedEntry = bridgeSelection
    ? bridgeComponentLookup.get(bridgeSelection.radflowId) || null
    : null;

  // Set up event interceptor
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const setupInterceptor = () => {
      try {
        const contentDocument = iframe.contentDocument;
        if (!contentDocument) return;

        // Clean up existing interceptor
        interceptorRef.current?.destroy();

        // Create new interceptor
        const mode: InterceptorMode = isDesignMode ? "design" : "preview";
        interceptorRef.current = createInterceptor(contentDocument, mode);

        return () => {
          interceptorRef.current?.destroy();
          interceptorRef.current = null;
        };
      } catch {
        // Cross-origin iframe - interceptor not needed (bridge handles it)
        return undefined;
      }
    };

    // Set up on iframe load
    const handleLoad = () => {
      setupInterceptor();
    };

    iframe.addEventListener("load", handleLoad);

    // Also try to set up immediately if already loaded
    const cleanup = setupInterceptor();

    return () => {
      iframe.removeEventListener("load", handleLoad);
      cleanup?.();
    };
  }, [iframeRef, isDesignMode]);

  // Update interceptor mode when design mode changes
  useEffect(() => {
    if (interceptorRef.current) {
      interceptorRef.current.setMode(isDesignMode ? "design" : "preview");
    }
  }, [isDesignMode]);

  // Don't render overlays in preview mode
  if (!isDesignMode) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      data-flow-canvas-tools
    >
      {/* Hover outline (rendered first, behind selection) */}
      {bridgeHoveredId && bridgeHoveredId !== bridgeSelection?.radflowId && (
        <HoverOutline
          hoveredId={bridgeHoveredId}
          componentLookup={bridgeComponentLookup}
          containerRef={containerRef}
          iframeRef={iframeRef}
          scale={scale}
        />
      )}

      {/* Selection outline */}
      {selectedEntry && (
        <SelectionOutline
          entry={selectedEntry}
          containerRef={containerRef}
          iframeRef={iframeRef}
          scale={scale}
        />
      )}

      {/* Multi-selection outlines */}
      {Array.from(selectedIds).map((id) => {
        // Skip the primary selection (already rendered above)
        if (id === bridgeSelection?.radflowId) return null;

        const entry = bridgeComponentLookup.get(id);
        if (!entry) return null;

        return (
          <SelectionOutline
            key={id}
            entry={entry}
            containerRef={containerRef}
            iframeRef={iframeRef}
            scale={scale}
          />
        );
      })}
    </div>
  );
}

export default CanvasTools;
