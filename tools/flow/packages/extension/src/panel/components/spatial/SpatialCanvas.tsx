/**
 * SpatialCanvas - Main spatial file tree visualization
 *
 * Ported from Flow 0. Backend calls (Tauri) are stubbed since the extension
 * cannot access the local filesystem directly. The UI renders but file
 * browsing functionality requires the MCP sidecar.
 */

import { useRef, useCallback, useState, useEffect } from "react";
import { useAppStore } from "../../stores/appStore";
import { useSpatialLayout } from "../../hooks/useSpatialLayout";
import { useSpatialKeyboard } from "../../hooks/useSpatialKeyboard";
import { useCanvasSounds } from "../../hooks/useCanvasSounds";
import { usePanZoom } from "../../hooks/usePanZoom";
import { useMarqueeSelection } from "../../hooks/useMarqueeSelection";
import { FileNode } from "./FileNode";
import { ConnectionLines } from "./ConnectionLines";
import { Minimap } from "./Minimap";
import { ZoomControls } from "./ZoomControls";
import { MarqueeSelection } from "./MarqueeSelection";
import type { SelectModifiers, FileNode as FileNodeType, LayoutNode } from "../../types/spatial";

export function SpatialCanvas(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  // Store state
  const selectedPaths = useAppStore((s) => s.spatialSelectedPaths);
  const highlightedPath = useAppStore((s) => s.spatialHighlightedPath);
  const focusedPath = useAppStore((s) => s.spatialFocusedPath);
  const fileTree = useAppStore((s) => s.spatialFileTree);
  const expandedPaths = useAppStore((s) => s.spatialExpandedPaths);

  // Store actions
  const spatialSelectPath = useAppStore((s) => s.spatialSelectPath);
  const spatialToggleSelection = useAppStore((s) => s.spatialToggleSelection);
  const spatialSetSelectedPaths = useAppStore((s) => s.spatialSetSelectedPaths);
  const spatialExpandPath = useAppStore((s) => s.spatialExpandPath);
  const spatialCollapsePath = useAppStore((s) => s.spatialCollapsePath);
  const setSpatialHighlightedPath = useAppStore((s) => s.setSpatialHighlightedPath);

  // Layout computation
  const { layoutNodes, canvasBounds } = useSpatialLayout();

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
    (node: LayoutNode) => {
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
        spatialSetSelectedPaths(paths, additive);
      }
    },
    [playSound, spatialSetSelectedPaths]
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

  // Track container size and rect for CanvasGrid and MarqueeSelection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
      setContainerRect(container.getBoundingClientRect());
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    // Also update on scroll (since getBoundingClientRect is relative to viewport)
    window.addEventListener("scroll", updateSize, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateSize);
    };
  }, []);

  // Center view when file tree first loads or changes
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (fileTree && layoutNodes.length > 0 && containerSize.width > 0 && !hasInitializedRef.current) {
      // Center on the root node
      const rootNode = layoutNodes[0];
      if (rootNode) {
        zoomToNode(rootNode, containerSize, 1.0);
        hasInitializedRef.current = true;
      }
    }
    // Reset when file tree clears
    if (!fileTree) {
      hasInitializedRef.current = false;
    }
  }, [fileTree, layoutNodes, containerSize, zoomToNode]);

  // Selection handler with sound
  const handleSelect = useCallback(
    (path: string, modifiers: SelectModifiers) => {
      if (modifiers.cmd || modifiers.shift) {
        // Toggle selection (both Cmd+click and Shift+click toggle)
        const isCurrentlySelected = selectedPaths.has(path);
        playSound(isCurrentlySelected ? "deselect" : "select");
        spatialToggleSelection(path);
      } else {
        playSound("select");
        spatialSelectPath(path);
      }
    },
    [selectedPaths, spatialSelectPath, spatialToggleSelection, playSound]
  );

  // Toggle expand handler with sound - STUBBED (no backend)
  // In the extension, expanding folders requires the MCP sidecar
  const handleToggleExpand = useCallback(
    async (path: string) => {
      const isCurrentlyExpanded = expandedPaths.has(path);

      if (isCurrentlyExpanded) {
        // Collapsing - just update state
        playSound("collapse");
        spatialCollapsePath(path);
      } else {
        // Expanding - would normally fetch children from backend
        // STUB: In extension, we cannot access filesystem directly
        // The tree must be populated via MCP sidecar or mock data
        playSound("expand");

        // Find the node and check if it has children already loaded
        const node = layoutNodes.find((n) => n.fileNode.path === path);
        if (node?.fileNode.children && node.fileNode.children.length > 0) {
          // Children are already loaded, just expand
          spatialExpandPath(path, node.fileNode.children);
        } else {
          // No children loaded - in extension this would require MCP
          console.warn("[SpatialCanvas] Cannot expand folder - filesystem access requires MCP sidecar");
          spatialExpandPath(path, []); // Expand with empty children for now
        }
      }
    },
    [expandedPaths, spatialExpandPath, spatialCollapsePath, playSound, layoutNodes]
  );

  // Copy path handler with sound
  const handleCopyPath = useCallback(
    (path: string) => {
      playSound("copy");
      setSpatialHighlightedPath(path);
    },
    [setSpatialHighlightedPath, playSound]
  );

  // Ensure focused node is visible by panning if needed
  const ensureNodeVisible = useCallback(
    (path: string) => {
      const node = layoutNodes.find((n) => n.fileNode.path === path);
      if (!node || !containerRef.current) return;

      const container = containerRef.current;
      const viewportWidth = container.clientWidth;
      const viewportHeight = container.clientHeight;

      // Calculate node position in viewport coordinates
      const nodeLeft = (node.x - pan.x) * zoom;
      const nodeTop = (node.y - pan.y) * zoom;
      const nodeRight = nodeLeft + node.width * zoom;
      const nodeBottom = nodeTop + node.height * zoom;

      // Padding from edges
      const padding = 50;

      // Check if node is outside viewport
      let newPanX = pan.x;
      let newPanY = pan.y;
      let needsPan = false;

      if (nodeLeft < padding) {
        newPanX = node.x - padding / zoom;
        needsPan = true;
      } else if (nodeRight > viewportWidth - padding) {
        newPanX = node.x + node.width - (viewportWidth - padding) / zoom;
        needsPan = true;
      }

      if (nodeTop < padding) {
        newPanY = node.y - padding / zoom;
        needsPan = true;
      } else if (nodeBottom > viewportHeight - padding) {
        newPanY = node.y + node.height - (viewportHeight - padding) / zoom;
        needsPan = true;
      }

      if (needsPan) {
        setPan({ x: newPanX, y: newPanY });
      }
    },
    [layoutNodes, pan, zoom, setPan]
  );

  // Handle file activation (Enter on a file)
  const handleActivateFile = useCallback(
    (path: string) => {
      // Copy path to clipboard as the activation action
      navigator.clipboard.writeText(path).catch(() => {
        // Clipboard write failed silently
      });
      playSound("copy");
      setSpatialHighlightedPath(path);
    },
    [playSound, setSpatialHighlightedPath]
  );

  // Handle collapse from keyboard (no sound - keyboard hook handles flow)
  const handleKeyboardCollapse = useCallback(
    (path: string) => {
      playSound("collapse");
      spatialCollapsePath(path);
    },
    [playSound, spatialCollapsePath]
  );

  // Keyboard shortcuts with enhanced navigation
  useSpatialKeyboard({
    layoutNodes,
    enabled: !!fileTree,
    onExpand: handleToggleExpand,
    onCollapse: handleKeyboardCollapse,
    onActivateFile: handleActivateFile,
    onEnsureVisible: ensureNodeVisible,
  });

  // Build highlighted paths set for connection lines
  const highlightedPaths = highlightedPath
    ? new Set([highlightedPath, ...getAncestorPaths(highlightedPath)])
    : new Set<string>();

  // Add selected paths ancestors for highlighting connections
  selectedPaths.forEach((path) => {
    highlightedPaths.add(path);
    getAncestorPaths(path).forEach((p) => highlightedPaths.add(p));
  });

  if (!fileTree) {
    return (
      <div className="flex-1 flex items-center justify-center text-[rgba(255,255,255,0.5)] bg-[#0a0a0a]">
        <div className="text-center">
          <p className="mb-2">No directory selected</p>
          <p className="text-xs text-[rgba(255,255,255,0.3)]">
            Spatial file browser requires MCP sidecar connection
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
        role="tree"
        aria-label="File tree"
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
        {/* Simple CSS dot grid background */}
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
          {/* Connection lines (rendered first, behind nodes) */}
          <ConnectionLines
            layoutNodes={layoutNodes}
            highlightedPaths={highlightedPaths}
          />

          {/* File nodes */}
          {layoutNodes.map((node) => (
            <FileNode
              key={node.id}
              node={node}
              isSelected={selectedPaths.has(node.fileNode.path) || marqueeState.intersectingPaths.has(node.fileNode.path)}
              isHighlighted={highlightedPath === node.fileNode.path}
              isFocused={focusedPath === node.fileNode.path}
              onToggleExpand={handleToggleExpand}
              onSelect={handleSelect}
              onCopyPath={handleCopyPath}
              onDoubleClick={handleNodeDoubleClick}
            />
          ))}
        </div>

        {/* Marquee selection overlay (screen space) */}
        <MarqueeSelection rect={marqueeState.rect} containerRect={containerRect} />
      </div>

      {/* Status bar - fixed at bottom center */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-[rgba(0,0,0,0.8)] text-white text-xs px-3 py-1.5 rounded-full pointer-events-none"
      >
        {layoutNodes.length} nodes | {Math.round(zoom * 100)}% | Scroll to pan, pinch to zoom
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

      {/* Minimap */}
      <Minimap
        layoutNodes={layoutNodes}
        contentBounds={canvasBounds}
        pan={pan}
        zoom={zoom}
        viewportSize={containerSize}
        onNavigate={setPan}
      />

      {/* Copy confirmation (aria-live for accessibility) */}
      <div aria-live="polite" className="sr-only">
        {highlightedPath && `Copied: ${highlightedPath}`}
      </div>
    </div>
  );
}

/**
 * Get all ancestor paths for a given path
 */
function getAncestorPaths(path: string): string[] {
  const parts = path.split("/");
  const ancestors: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    ancestors.push(parts.slice(0, i).join("/"));
  }
  return ancestors;
}

export default SpatialCanvas;
