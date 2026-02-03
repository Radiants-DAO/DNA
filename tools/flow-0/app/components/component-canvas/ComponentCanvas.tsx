import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { useAppStore } from "../../stores/appStore";
import { usePanZoom } from "../../hooks/usePanZoom";
import { useMarqueeSelection } from "../../hooks/useMarqueeSelection";
import { useCanvasSounds } from "../../hooks/useCanvasSounds";
import { ComponentNode } from "./ComponentNode";
import { ComponentConnections } from "./ComponentConnections";
import { PagePreviewCard } from "./PagePreviewCard";
import { ZoomControls } from "../spatial/ZoomControls";
import { MarqueeSelection } from "../spatial/MarqueeSelection";
import type { ComponentCanvasNode } from "../../types/componentCanvas";
import type { LayoutNode } from "../../types/spatial";

/**
 * Adapt ComponentCanvasNode to LayoutNode interface for useMarqueeSelection
 */
function componentNodeToLayoutNode(node: ComponentCanvasNode): LayoutNode {
  return {
    id: node.id,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    fileNode: {
      id: node.id,
      name: node.schema.name,
      path: node.id, // Use id as path for selection
      nodeType: "File",
      extension: "schema.json",
      size: 0,
      sizeFormatted: "",
      totalSize: null,
      childCount: null,
      modified: "",
      isHidden: false,
      isReadable: true,
      isAutoCollapsed: false,
    },
    subtreeHeight: node.height,
    isCollapsed: false,
  };
}

/**
 * Compute canvas bounds from nodes
 */
function computeCanvasBounds(nodes: ComponentCanvasNode[]): { width: number; height: number; right: number } {
  if (nodes.length === 0) {
    return { width: 800, height: 600, right: 0 };
  }

  let maxX = 0;
  let maxY = 0;

  for (const node of nodes) {
    const right = node.x + node.width;
    const bottom = node.y + node.height;
    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;
  }

  // Add padding
  return {
    width: maxX + 100,
    height: maxY + 100,
    right: maxX,
  };
}

/**
 * ComponentCanvas displays component schemas in a spatial canvas view.
 *
 * Features:
 * - Pan/zoom navigation (scroll to pan, pinch/ctrl+scroll to zoom)
 * - Marquee selection for multi-select
 * - Keyboard navigation
 * - Sound effects for interactions
 * - Grid background
 */
export function ComponentCanvas(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Store state - use component canvas slice
  const componentNodes = useAppStore((s) => s.componentCanvasNodes);
  const selectedIds = useAppStore((s) => s.componentCanvasSelectedIds);
  const focusedId = useAppStore((s) => s.componentCanvasFocusedId);
  const connections = useAppStore((s) => s.componentConnections);
  const connectionVisibility = useAppStore((s) => s.componentConnectionVisibility);
  const hoveredNodeId = useAppStore((s) => s.componentCanvasHoveredId);
  const setHoveredNodeId = useAppStore((s) => s.setComponentCanvasHoveredId);
  const nodePreviews = useAppStore((s) => s.componentNodePreviews);
  const previewServerUrl = useAppStore((s) => s.componentPreviewServerUrl);
  const toggleNodePreview = useAppStore((s) => s.toggleNodePreview);

  // Compute canvas bounds from nodes
  const canvasBounds = useMemo(
    () => computeCanvasBounds(componentNodes),
    [componentNodes]
  );

  // Store actions
  const selectComponentNode = useAppStore((s) => s.selectComponentNode);
  const toggleComponentNodeSelection = useAppStore((s) => s.toggleComponentNodeSelection);
  const setFocusedComponent = useAppStore((s) => s.setComponentCanvasFocusedId);
  const clearSelection = useAppStore((s) => s.clearComponentCanvasSelection);

  // Adapt nodes for marquee selection
  const layoutNodes = useMemo(
    () => componentNodes.map(componentNodeToLayoutNode),
    [componentNodes]
  );

  // Pan and zoom
  const {
    pan,
    zoom,
    setPan,
    containerProps: panZoomProps,
    isPanning,
    zoomToFit,
    zoomIn,
    zoomOut,
    zoomToNode,
  } = usePanZoom({
    initialZoom: 1,
    minZoom: 0.25,
    maxZoom: 2,
    contentBounds: canvasBounds,
  });

  // Zoom control handlers
  const handleZoomToFit = useCallback(() => {
    zoomToFit(containerSize);
  }, [zoomToFit, containerSize]);

  // Double-click on node to zoom and center
  const handleNodeDoubleClick = useCallback(
    (node: ComponentCanvasNode) => {
      zoomToNode(node, containerSize, 1.0);
    },
    [zoomToNode, containerSize]
  );

  // Sound effects
  const { play: playSound } = useCanvasSounds();

  // Marquee selection handler
  const handleMarqueeSelectionComplete = useCallback(
    (paths: Set<string>, additive: boolean) => {
      if (paths.size > 0) {
        playSound("select");
        // Select each node in the set
        if (!additive) {
          clearSelection();
        }
        paths.forEach((id) => {
          toggleComponentNodeSelection(id);
        });
      }
    },
    [playSound, clearSelection, toggleComponentNodeSelection]
  );

  // Marquee selection
  const {
    state: marqueeState,
    handlers: marqueeHandlers,
    isActive: isMarqueeActive,
  } = useMarqueeSelection({
    pan,
    zoom,
    layoutNodes,
    containerRef,
    onSelectionComplete: handleMarqueeSelectionComplete,
  });

  // Track container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Center view when components first load
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (
      componentNodes.length > 0 &&
      containerSize.width > 0 &&
      !hasInitializedRef.current
    ) {
      // Center on the first node or center of content
      const firstNode = componentNodes[0];
      if (firstNode) {
        zoomToNode(firstNode, containerSize, 1.0);
        hasInitializedRef.current = true;
      }
    }
    // Reset when nodes clear
    if (componentNodes.length === 0) {
      hasInitializedRef.current = false;
    }
  }, [componentNodes, containerSize, zoomToNode]);

  // Selection handler with sound
  const handleSelect = useCallback(
    (id: string, modifiers: { cmd: boolean; shift: boolean }) => {
      if (modifiers.cmd || modifiers.shift) {
        // Toggle selection
        const isCurrentlySelected = selectedIds.has(id);
        playSound(isCurrentlySelected ? "deselect" : "select");
        toggleComponentNodeSelection(id);
      } else {
        playSound("select");
        selectComponentNode(id);
      }
      // Always set focus
      setFocusedComponent(id);
    },
    [selectedIds, selectComponentNode, toggleComponentNodeSelection, setFocusedComponent, playSound]
  );

  // Empty state
  if (componentNodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[rgba(255,255,255,0.5)] bg-[#0a0a0a]">
        <div className="text-center">
          <p className="mb-2">No component schemas loaded</p>
          <p className="text-xs text-[rgba(255,255,255,0.3)]">
            Select a theme package with component schemas to view them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Pan/Zoom canvas viewport */}
      <div
        ref={containerRef}
        role="grid"
        aria-label="Component schema canvas"
        className="flex-1 overflow-hidden relative"
        style={{
          backgroundColor: "#0a0a0a",
          cursor: isPanning ? "grabbing" : isMarqueeActive ? "crosshair" : "default",
        }}
        onMouseDown={(e) => {
          // Marquee takes precedence for left click without alt
          if (e.button === 0 && !e.altKey) {
            marqueeHandlers.onMouseDown(e);
          }
          panZoomProps.onMouseDown(e);
        }}
        onMouseMove={(e) => {
          marqueeHandlers.onMouseMove(e);
          panZoomProps.onMouseMove(e);
        }}
        onMouseUp={(e) => {
          marqueeHandlers.onMouseUp(e);
          panZoomProps.onMouseUp(e);
        }}
        onMouseLeave={panZoomProps.onMouseLeave}
        onWheel={panZoomProps.onWheel}
      >
        {/* CSS dot grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundPosition: `${-pan.x * zoom}px ${-pan.y * zoom}px`,
          }}
        />

        {/* Content container - transformed via pan/zoom */}
        <div
          style={{
            transform: `translate(${-pan.x * zoom}px, ${-pan.y * zoom}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: canvasBounds.width,
            height: canvasBounds.height,
            position: "absolute",
            willChange: "transform",
          }}
        >
          {/* Page preview card — positioned right of component grid */}
          <PagePreviewCard componentsRight={canvasBounds.right} />

          {/* Relationship lines */}
          <ComponentConnections
            nodes={componentNodes}
            connections={connections}
            visibility={connectionVisibility}
            hoveredNodeId={hoveredNodeId}
            selectedIds={selectedIds}
          />

          {/* Component nodes */}
          {componentNodes.map((node) => (
            <div
              key={node.id}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
            >
              <ComponentNode
                node={node}
                isSelected={
                  selectedIds.has(node.id) ||
                  marqueeState.intersectingPaths.has(node.id)
                }
                isFocused={focusedId === node.id}
                onSelect={handleSelect}
                onDoubleClick={handleNodeDoubleClick}
                previewEnabled={nodePreviews.get(node.id)?.enabled ?? false}
                previewServerUrl={previewServerUrl}
                onTogglePreview={toggleNodePreview}
              />
            </div>
          ))}
        </div>

        {/* Marquee selection overlay (screen space) */}
        <MarqueeSelection rect={marqueeState.rect} containerRef={containerRef} />
      </div>

      {/* Status bar - fixed at bottom center */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-[rgba(0,0,0,0.8)] text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
        {componentNodes.length} component{componentNodes.length !== 1 ? "s" : ""} |{" "}
        {Math.round(zoom * 100)}% | Scroll to pan, pinch to zoom
      </div>

      {/* Zoom controls */}
      <ZoomControls
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomToFit={handleZoomToFit}
        minZoom={0.25}
        maxZoom={2}
      />
    </div>
  );
}

export default ComponentCanvas;
