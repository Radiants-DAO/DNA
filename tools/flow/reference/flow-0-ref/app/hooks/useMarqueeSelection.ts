import { useState, useCallback, useRef, useMemo } from "react";
import type { Vector2D } from "../types/canvas";
import type { LayoutNode } from "../types/spatial";

export interface MarqueeRect {
  /** Start point in screen coordinates */
  startX: number;
  startY: number;
  /** Current point in screen coordinates */
  endX: number;
  endY: number;
}

export interface MarqueeSelectionState {
  /** Whether marquee is actively being drawn */
  isSelecting: boolean;
  /** The current marquee rectangle in screen coords */
  rect: MarqueeRect | null;
  /** Paths currently intersecting the marquee */
  intersectingPaths: Set<string>;
}

interface UseMarqueeSelectionOptions {
  /** Current pan offset */
  pan: Vector2D;
  /** Current zoom level */
  zoom: number;
  /** Layout nodes to check for intersection */
  layoutNodes: LayoutNode[];
  /** Callback when selection changes during drag */
  onSelectionChange?: (paths: Set<string>, additive: boolean) => void;
  /** Callback when marquee selection completes */
  onSelectionComplete?: (paths: Set<string>, additive: boolean) => void;
  /** Container ref for coordinate calculations */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface UseMarqueeSelectionResult {
  /** Current marquee state */
  state: MarqueeSelectionState;
  /** Event handlers to spread on container */
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
  };
  /** Whether marquee is active (use to prevent other interactions) */
  isActive: boolean;
}

/**
 * Convert screen coordinates to canvas/world coordinates
 */
function screenToCanvas(
  screenX: number,
  screenY: number,
  pan: Vector2D,
  zoom: number,
  containerRect: DOMRect
): Vector2D {
  const relativeX = screenX - containerRect.left;
  const relativeY = screenY - containerRect.top;

  // Reverse the transform: translate(${-pan.x * zoom}px, ${-pan.y * zoom}px) scale(${zoom})
  // Screen position = (canvas position - pan) * zoom
  // Canvas position = (screen position / zoom) + pan
  return {
    x: relativeX / zoom + pan.x,
    y: relativeY / zoom + pan.y,
  };
}

/**
 * Check if a rectangle intersects with a node
 */
function rectIntersectsNode(
  rect: { minX: number; minY: number; maxX: number; maxY: number },
  node: LayoutNode
): boolean {
  const nodeRight = node.x + node.width;
  const nodeBottom = node.y + node.height;

  // AABB intersection test
  return !(
    rect.maxX < node.x ||
    rect.minX > nodeRight ||
    rect.maxY < node.y ||
    rect.minY > nodeBottom
  );
}

/**
 * Get normalized bounds from a marquee rect
 */
function getNormalizedBounds(rect: MarqueeRect): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  return {
    minX: Math.min(rect.startX, rect.endX),
    minY: Math.min(rect.startY, rect.endY),
    maxX: Math.max(rect.startX, rect.endX),
    maxY: Math.max(rect.startY, rect.endY),
  };
}

export function useMarqueeSelection(
  options: UseMarqueeSelectionOptions
): UseMarqueeSelectionResult {
  const { pan, zoom, layoutNodes, onSelectionChange, onSelectionComplete, containerRef } =
    options;

  const [isSelecting, setIsSelecting] = useState(false);
  const [rect, setRect] = useState<MarqueeRect | null>(null);
  const [intersectingPaths, setIntersectingPaths] = useState<Set<string>>(
    new Set()
  );

  // Track if shift was held at start
  const isAdditiveRef = useRef(false);
  // Track start position
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  /**
   * Find all nodes intersecting the current marquee
   */
  const findIntersectingNodes = useCallback(
    (marqueeRect: MarqueeRect, containerRect: DOMRect): Set<string> => {
      // Convert marquee corners to canvas coordinates
      const start = screenToCanvas(
        marqueeRect.startX,
        marqueeRect.startY,
        pan,
        zoom,
        containerRect
      );
      const end = screenToCanvas(
        marqueeRect.endX,
        marqueeRect.endY,
        pan,
        zoom,
        containerRect
      );

      const canvasBounds = {
        minX: Math.min(start.x, end.x),
        minY: Math.min(start.y, end.y),
        maxX: Math.max(start.x, end.x),
        maxY: Math.max(start.y, end.y),
      };

      const intersecting = new Set<string>();

      for (const node of layoutNodes) {
        // Skip truncation nodes
        if (node.isTruncationNode) continue;

        if (rectIntersectsNode(canvasBounds, node)) {
          intersecting.add(node.fileNode.path);
        }
      }

      return intersecting;
    },
    [pan, zoom, layoutNodes]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only handle left click without alt (alt is for panning)
      if (e.button !== 0 || e.altKey) return;

      // Don't start marquee if clicking on a node (check if target has role="treeitem")
      const target = e.target as HTMLElement;
      if (target.closest('[role="treeitem"]')) return;

      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;

      startPosRef.current = { x: startX, y: startY };
      isAdditiveRef.current = e.shiftKey;

      setRect({
        startX,
        startY,
        endX: startX,
        endY: startY,
      });
      setIsSelecting(true);
      setIntersectingPaths(new Set());
    },
    [containerRef]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting || !startPosRef.current) return;

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newRect: MarqueeRect = {
        startX: startPosRef.current.x,
        startY: startPosRef.current.y,
        endX: e.clientX,
        endY: e.clientY,
      };

      setRect(newRect);

      // Find intersecting nodes
      const intersecting = findIntersectingNodes(newRect, containerRect);
      setIntersectingPaths(intersecting);

      // Notify of selection change during drag
      onSelectionChange?.(intersecting, isAdditiveRef.current);
    },
    [isSelecting, containerRef, findIntersectingNodes, onSelectionChange]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting) return;

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();

      // Calculate final intersection if we have a rect
      if (rect) {
        const finalRect: MarqueeRect = {
          startX: rect.startX,
          startY: rect.startY,
          endX: e.clientX,
          endY: e.clientY,
        };

        const finalIntersecting = findIntersectingNodes(finalRect, containerRect);

        // Only trigger selection complete if we actually moved (not just a click)
        const dx = Math.abs(finalRect.endX - finalRect.startX);
        const dy = Math.abs(finalRect.endY - finalRect.startY);
        const minDragDistance = 5;

        if (dx > minDragDistance || dy > minDragDistance) {
          onSelectionComplete?.(finalIntersecting, isAdditiveRef.current);
        }
      }

      // Reset state
      setIsSelecting(false);
      setRect(null);
      setIntersectingPaths(new Set());
      startPosRef.current = null;
    },
    [isSelecting, rect, containerRef, findIntersectingNodes, onSelectionComplete]
  );

  const state = useMemo(
    () => ({
      isSelecting,
      rect,
      intersectingPaths,
    }),
    [isSelecting, rect, intersectingPaths]
  );

  const handlers = useMemo(
    () => ({
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
    }),
    [handleMouseDown, handleMouseMove, handleMouseUp]
  );

  return {
    state,
    handlers,
    isActive: isSelecting,
  };
}

export default useMarqueeSelection;
