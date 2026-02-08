import { useState, useEffect, useRef, useCallback } from "react";
import { GripVertical, GripHorizontal } from "./ui/icons";
import { DogfoodBoundary } from './ui/DogfoodBoundary';

/**
 * DragHandle component - Draggable grip handle for floating bars
 *
 * Features:
 * - Shows grip pattern icon (GripVertical or GripHorizontal)
 * - Cursor changes to grab on hover, grabbing when dragging
 * - Slightly muted color, more visible on hover
 * - Triggers onDragStart/onDragEnd callbacks
 */
interface DragHandleProps {
  /** Called when drag starts with initial mouse position */
  onDragStart?: (e: React.MouseEvent) => void;
  /** Called during drag with current mouse position */
  onDrag?: (e: MouseEvent) => void;
  /** Called when drag ends */
  onDragEnd?: () => void;
  /** Whether dragging is currently active */
  isDragging?: boolean;
  /** Orientation of the handle - horizontal (default) or vertical */
  orientation?: "horizontal" | "vertical";
  /** Additional className */
  className?: string;
}

export function DragHandle({
  onDragStart,
  onDrag,
  onDragEnd,
  isDragging = false,
  orientation = "horizontal",
  className = "",
}: DragHandleProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragStart?.(e);
  };

  // Select the appropriate grip icon based on orientation
  const GripIcon = orientation === "vertical" ? GripVertical : GripHorizontal;

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`
        flex items-center justify-center p-1.5 rounded
        text-neutral-500/40 hover:text-neutral-500/70
        cursor-grab active:cursor-grabbing
        transition-colors duration-150
        ${isDragging ? "cursor-grabbing text-neutral-500/70" : ""}
        ${className}
      `}
      title="Drag to reposition"
    >
      <GripIcon className="w-4 h-4" />
    </div>
  );
}

/**
 * Position stored in localStorage for draggable bars
 */
export interface DraggablePosition {
  x: number;
  y: number;
}

/**
 * Which screen edge the bar has snapped to.
 * - "left" / "right" -> bar becomes vertical
 * - "top" / "bottom" -> bar stays horizontal
 * - null -> floating freely (horizontal default)
 */
export type SnapEdge = "left" | "right" | "top" | "bottom" | null;

/** Threshold in px from viewport edge to trigger snap */
const SNAP_THRESHOLD = 48;

/** Determine snap edge from position and element dimensions */
function computeSnapEdge(x: number, y: number, width: number, height: number): SnapEdge {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Left/right take priority over top/bottom when in corners
  if (x <= SNAP_THRESHOLD) return "left";
  if (x + width >= vw - SNAP_THRESHOLD) return "right";
  if (y <= SNAP_THRESHOLD) return "top";
  if (y + height >= vh - SNAP_THRESHOLD) return "bottom";

  return null;
}

/**
 * useDraggable hook - Provides drag functionality for floating bars
 *
 * Features:
 * - Tracks position state with initial position
 * - Handles mouse events for drag behavior
 * - Constrains to viewport bounds
 * - Optionally persists position to localStorage
 * - Validates stored positions are within current viewport
 *
 * @param initialPosition - Initial { x, y } position
 * @param storageKey - Optional localStorage key for persistence
 * @returns Position state, setPosition, and drag handlers
 */
export function useDraggable(
  initialPosition: DraggablePosition,
  storageKey?: string
) {
  // Load persisted position or use initial
  const [position, setPosition] = useState<DraggablePosition>(() => {
    if (storageKey && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Validate the stored position is a valid number
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            // Also validate the position is within the current viewport
            // Allow some margin off-screen (half the typical bar size) so partially visible bars still load
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const margin = 200; // Allow position up to 200px off-screen to handle partially visible bars

            const isValidX = parsed.x >= -margin && parsed.x < vw + margin;
            const isValidY = parsed.y >= -margin && parsed.y < vh + margin;

            if (isValidX && isValidY) {
              // Clamp to ensure at least partially visible
              return {
                x: Math.max(8, Math.min(vw - 100, parsed.x)),
                y: Math.max(8, Math.min(vh - 50, parsed.y)),
              };
            }
            // Position is too far off-screen, use initial position instead
          }
        }
      } catch {
        // Invalid stored value, use initial
      }
    }
    return initialPosition;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [snapEdge, setSnapEdge] = useState<SnapEdge>(null);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  // Compute initial snap edge after mount
  useEffect(() => {
    const el = elementRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      setSnapEdge(computeSnapEdge(position.x, position.y, rect.width, rect.height));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist position to localStorage
  useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(position));
    }
  }, [position, storageKey]);

  // Constrain position to viewport
  const constrainToViewport = useCallback((x: number, y: number, width: number, height: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const padding = 8; // Minimum distance from edge

    return {
      x: Math.max(padding, Math.min(vw - width - padding, x)),
      y: Math.max(padding, Math.min(vh - height - padding, y)),
    };
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    const element = elementRef.current;
    if (!element) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [position]);

  // Handle drag move
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragStartRef.current || !elementRef.current) return;

    const { x: startX, y: startY, posX, posY } = dragStartRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const element = elementRef.current;
    const rect = element.getBoundingClientRect();

    const newPosition = constrainToViewport(
      posX + deltaX,
      posY + deltaY,
      rect.width,
      rect.height
    );

    // Update snap edge live during drag for visual feedback
    setSnapEdge(computeSnapEdge(newPosition.x, newPosition.y, rect.width, rect.height));
    setPosition(newPosition);
  }, [constrainToViewport]);

  // Handle drag end - snap to edge if close enough
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;

    const el = elementRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const edge = computeSnapEdge(position.x, position.y, rect.width, rect.height);
    setSnapEdge(edge);

    // Snap position to edge
    if (edge) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const padding = 8;

      let snappedPos = { ...position };
      switch (edge) {
        case "left":
          snappedPos.x = padding;
          break;
        case "right":
          snappedPos.x = vw - rect.width - padding;
          break;
        case "top":
          snappedPos.y = padding;
          break;
        case "bottom":
          snappedPos.y = vh - rect.height - padding;
          break;
      }
      setPosition(snappedPos);
    }
  }, [position]);

  // Set up global mouse event listeners when dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Reset position to initial (useful for reset button)
  const resetPosition = useCallback(() => {
    setPosition(initialPosition);
    if (storageKey && typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  }, [initialPosition, storageKey]);

  return {
    position,
    setPosition,
    isDragging,
    elementRef,
    handleDragStart,
    resetPosition,
    /** Which screen edge the bar is snapped to (left/right = vertical, top/bottom = horizontal) */
    snapEdge,
  };
}

export default DragHandle;
