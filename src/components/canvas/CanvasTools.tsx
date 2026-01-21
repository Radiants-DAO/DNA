import { useRef, useEffect } from "react";
import { useAppStore } from "../../stores/appStore";
import { SelectionOutline, HoverOutline } from "./Outline";
import { useInstanceHover } from "../../hooks/useInstanceHover";
import { useInstanceSelection } from "../../hooks/useInstanceSelection";
import { createInterceptor, type Interceptor, type InterceptorMode } from "../../utils/canvas/interceptor";

/**
 * Props for the CanvasTools component
 */
export interface CanvasToolsProps {
  /** Ref to the preview iframe */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** Scale factor for the canvas (default: 1) */
  scale?: number;
}

/**
 * CanvasTools - Overlay container for canvas interaction tools.
 *
 * This component manages:
 * - Selection outlines (blue border around selected element)
 * - Hover outlines (purple border on mouseover)
 * - Event interception (prevents form submission, link clicks in design mode)
 * - Modifier key handling (Shift for multi-select, Alt for parent)
 *
 * Ported from Webstudio's canvas-tools with adaptations for RadFlow's
 * iframe-based preview architecture.
 */
export function CanvasTools({ iframeRef, scale = 1 }: CanvasToolsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const interceptorRef = useRef<Interceptor | null>(null);

  // Store state
  const editorMode = useAppStore((s) => s.editorMode);
  const bridgeSelection = useAppStore((s) => s.bridgeSelection);
  const bridgeHoveredId = useAppStore((s) => s.bridgeHoveredId);
  const bridgeComponentLookup = useAppStore((s) => s.bridgeComponentLookup);
  const bridgeComponentMap = useAppStore((s) => s.bridgeComponentMap);
  const selectedIds = useAppStore((s) => s.selectedIds);

  // Get selected entry from lookup
  const selectedEntry = bridgeSelection
    ? bridgeComponentLookup.get(bridgeSelection.radflowId) || null
    : null;

  // Determine if we're in design mode (not preview)
  const isDesignMode = editorMode !== "preview";

  // Initialize hooks for hover and selection
  useInstanceHover(iframeRef, { enabled: isDesignMode });
  useInstanceSelection(iframeRef, { enabled: isDesignMode });

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

  // Update interceptor mode when editor mode changes
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
      data-radflow-canvas-tools
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
