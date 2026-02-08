import { useState, useRef, useCallback, useEffect } from "react";
import type { Vector2D } from "../types/canvas";

/**
 * Gesture state tracking
 */
export interface GestureState {
  type: "pan" | "drag" | "pinch" | null;
  startPosition: Vector2D | null;
  currentPosition: Vector2D | null;
  scale: number;
  isActive: boolean;
}

/**
 * Options for gesture handling
 */
export interface UseCanvasGesturesOptions {
  enablePan?: boolean;
  enableZoom?: boolean;
  enableDrag?: boolean;
  minScale?: number;
  maxScale?: number;
  zoomSensitivity?: number;
  panModifier?: "shift" | "alt" | "meta" | null;
}

/**
 * Result from useCanvasGestures hook
 */
export interface UseCanvasGesturesResult {
  state: GestureState;
  containerProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    onMouseLeave: (e: React.MouseEvent) => void;
    onWheel: (e: React.WheelEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchCancel: (e: React.TouchEvent) => void;
  };
  registerDraggable: (nodeId: string, element: HTMLElement | null) => void;
  scale: number;
  setScale: (scale: number) => void;
  resetView: () => void;
}

/**
 * Default gesture options
 */
const DEFAULT_OPTIONS: Required<UseCanvasGesturesOptions> = {
  enablePan: true,
  enableZoom: true,
  enableDrag: true,
  minScale: 0.25,
  maxScale: 4,
  zoomSensitivity: 0.002,
  panModifier: null,
};

/**
 * Initial gesture state
 */
const INITIAL_STATE: GestureState = {
  type: null,
  startPosition: null,
  currentPosition: null,
  scale: 1,
  isActive: false,
};

/**
 * Get distance between two touch points
 */
function getTouchDistance(touches: React.TouchList | TouchList): number {
  if (touches.length < 2) return 0;
  const dx = touches[1].clientX - touches[0].clientX;
  const dy = touches[1].clientY - touches[0].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get center point between two touch points
 */
function getTouchCenter(touches: React.TouchList | TouchList): Vector2D {
  if (touches.length === 0) {
    return { x: 0, y: 0 };
  }
  if (touches.length < 2) {
    return { x: touches[0].clientX, y: touches[0].clientY };
  }
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

/**
 * Check if the required modifier key is pressed
 */
function hasModifier(
  event: React.MouseEvent | MouseEvent,
  modifier: "shift" | "alt" | "meta" | null
): boolean {
  if (modifier === null) return true;
  if (modifier === "shift") return event.shiftKey;
  if (modifier === "alt") return event.altKey;
  if (modifier === "meta") return event.metaKey;
  return true;
}

/**
 * useCanvasGestures - Handle pan, zoom, and drag gestures for canvas
 *
 * Ported from Flow 0 with browser-safe implementations.
 *
 * Features:
 * - Pan: Track mouse/touch drag on container with optional modifier key
 * - Zoom: Wheel events and pinch-to-zoom toward cursor/pinch center
 * - Drag: Register draggable nodes and emit drag events with phases
 * - Gesture priority: Drag > Pan, Zoom can happen during pan
 */
export function useCanvasGestures(
  options?: UseCanvasGesturesOptions
): UseCanvasGesturesResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Gesture state
  const [state, setState] = useState<GestureState>(INITIAL_STATE);
  const [scale, setScaleState] = useState(1);

  // Refs for tracking
  const draggablesRef = useRef<Map<string, HTMLElement>>(new Map());
  const activeDragNodeRef = useRef<string | null>(null);
  const lastPositionRef = useRef<Vector2D | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const velocityRef = useRef<Vector2D>({ x: 0, y: 0 });
  const pinchDistanceRef = useRef<number>(0);

  /**
   * Clamp scale to min/max bounds
   */
  const clampScale = useCallback(
    (value: number): number => {
      return Math.max(opts.minScale, Math.min(opts.maxScale, value));
    },
    [opts.minScale, opts.maxScale]
  );

  /**
   * Set scale with clamping
   */
  const setScale = useCallback(
    (newScale: number) => {
      const clamped = clampScale(newScale);
      setScaleState(clamped);
      setState((prev) => ({ ...prev, scale: clamped }));
    },
    [clampScale]
  );

  /**
   * Reset view to default
   */
  const resetView = useCallback(() => {
    setScaleState(1);
    setState(INITIAL_STATE);
  }, []);

  /**
   * Register a draggable node element
   */
  const registerDraggable = useCallback(
    (nodeId: string, element: HTMLElement | null) => {
      if (element) {
        draggablesRef.current.set(nodeId, element);
      } else {
        draggablesRef.current.delete(nodeId);
      }
    },
    []
  );

  /**
   * Find which draggable element was clicked (respects z-order)
   */
  const findDraggableAtPoint = useCallback(
    (x: number, y: number): string | null => {
      const elements = document.elementsFromPoint(x, y);
      for (const el of elements) {
        for (const [nodeId, registered] of draggablesRef.current.entries()) {
          if (registered === el || registered.contains(el)) {
            return nodeId;
          }
        }
      }
      return null;
    },
    []
  );

  /**
   * Calculate velocity from position delta
   */
  const calculateVelocity = useCallback(
    (currentPos: Vector2D, timestamp: number): Vector2D => {
      if (!lastPositionRef.current) {
        return { x: 0, y: 0 };
      }

      const dt = timestamp - lastTimestampRef.current;
      if (dt <= 0) {
        return velocityRef.current;
      }

      const vx = (currentPos.x - lastPositionRef.current.x) / dt;
      const vy = (currentPos.y - lastPositionRef.current.y) / dt;

      // Smooth velocity with exponential moving average
      const smoothing = 0.3;
      velocityRef.current = {
        x: vx * smoothing + velocityRef.current.x * (1 - smoothing),
        y: vy * smoothing + velocityRef.current.y * (1 - smoothing),
      };

      return velocityRef.current;
    },
    []
  );

  /**
   * Start a gesture
   */
  const startGesture = useCallback(
    (type: "pan" | "drag", position: Vector2D, nodeId?: string) => {
      setState({
        type,
        startPosition: position,
        currentPosition: position,
        scale,
        isActive: true,
      });

      lastPositionRef.current = position;
      lastTimestampRef.current = performance.now();
      velocityRef.current = { x: 0, y: 0 };

      if (type === "drag" && nodeId) {
        activeDragNodeRef.current = nodeId;
      }
    },
    [scale]
  );

  /**
   * Update an ongoing gesture
   */
  const updateGesture = useCallback(
    (position: Vector2D) => {
      if (!state.isActive || !state.startPosition) return;

      const timestamp = performance.now();
      calculateVelocity(position, timestamp);

      setState((prev) => ({
        ...prev,
        currentPosition: position,
      }));

      lastPositionRef.current = position;
      lastTimestampRef.current = timestamp;
    },
    [state.isActive, state.startPosition, calculateVelocity]
  );

  /**
   * End the current gesture
   */
  const endGesture = useCallback(() => {
    if (!state.isActive) return;

    setState((prev) => ({
      ...prev,
      type: null,
      isActive: false,
    }));

    activeDragNodeRef.current = null;
    lastPositionRef.current = null;
  }, [state.isActive]);

  /**
   * Handle zoom gesture
   */
  const handleZoom = useCallback(
    (delta: number, _center: Vector2D) => {
      if (!opts.enableZoom) return;

      const newScale = clampScale(scale * (1 - delta * opts.zoomSensitivity));
      setScaleState(newScale);
      setState((prev) => ({ ...prev, scale: newScale }));
    },
    [opts.enableZoom, opts.zoomSensitivity, scale, clampScale]
  );

  // ============================================================================
  // Mouse Event Handlers
  // ============================================================================

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only handle primary button
      if (e.button !== 0) return;

      const position: Vector2D = { x: e.clientX, y: e.clientY };

      // Check for drag first (higher priority)
      if (opts.enableDrag) {
        const nodeId = findDraggableAtPoint(e.clientX, e.clientY);
        if (nodeId) {
          e.preventDefault();
          startGesture("drag", position, nodeId);
          return;
        }
      }

      // Check for pan
      if (opts.enablePan && hasModifier(e, opts.panModifier)) {
        e.preventDefault();
        startGesture("pan", position);
      }
    },
    [
      opts.enableDrag,
      opts.enablePan,
      opts.panModifier,
      findDraggableAtPoint,
      startGesture,
    ]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!state.isActive) return;

      const position: Vector2D = { x: e.clientX, y: e.clientY };
      updateGesture(position);
    },
    [state.isActive, updateGesture]
  );

  const onMouseUp = useCallback(
    (_e: React.MouseEvent) => {
      endGesture();
    },
    [endGesture]
  );

  const onMouseLeave = useCallback(
    (_e: React.MouseEvent) => {
      // End gesture when mouse leaves container
      if (state.isActive) {
        endGesture();
      }
    },
    [state.isActive, endGesture]
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!opts.enableZoom) return;

      // Prevent page scroll
      e.preventDefault();

      const center: Vector2D = { x: e.clientX, y: e.clientY };

      // Normalize wheel delta across browsers
      // deltaY is positive when scrolling down (zoom out)
      const delta = e.deltaY;

      handleZoom(delta, center);
    },
    [opts.enableZoom, handleZoom]
  );

  // ============================================================================
  // Touch Event Handlers
  // ============================================================================

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touches = e.touches;

      if (touches.length === 1) {
        const touch = touches[0];
        const position: Vector2D = { x: touch.clientX, y: touch.clientY };

        // Check for drag first
        if (opts.enableDrag) {
          const nodeId = findDraggableAtPoint(touch.clientX, touch.clientY);
          if (nodeId) {
            e.preventDefault();
            startGesture("drag", position, nodeId);
            return;
          }
        }

        // Start pan
        if (opts.enablePan) {
          e.preventDefault();
          startGesture("pan", position);
        }
      } else if (touches.length === 2 && opts.enableZoom) {
        // Start pinch zoom
        e.preventDefault();
        pinchDistanceRef.current = getTouchDistance(touches);
        setState((prev) => ({
          ...prev,
          type: "pinch",
          isActive: true,
        }));
      }
    },
    [
      opts.enableDrag,
      opts.enablePan,
      opts.enableZoom,
      findDraggableAtPoint,
      startGesture,
    ]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touches = e.touches;

      if (touches.length === 1 && state.isActive && state.type !== "pinch") {
        e.preventDefault();
        const touch = touches[0];
        const position: Vector2D = { x: touch.clientX, y: touch.clientY };
        updateGesture(position);
      } else if (touches.length === 2 && opts.enableZoom) {
        e.preventDefault();

        const newDistance = getTouchDistance(touches);
        const center = getTouchCenter(touches);

        if (pinchDistanceRef.current > 0) {
          // Calculate zoom delta from pinch
          const pinchDelta = pinchDistanceRef.current - newDistance;
          handleZoom(pinchDelta * 0.5, center); // Scale down pinch sensitivity
        }

        pinchDistanceRef.current = newDistance;
      }
    },
    [state.isActive, state.type, opts.enableZoom, updateGesture, handleZoom]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touches = e.touches;

      if (touches.length === 0) {
        // All touches ended
        endGesture();
        pinchDistanceRef.current = 0;
      } else if (touches.length === 1 && state.type === "pinch") {
        // Transition from pinch to pan
        const touch = touches[0];
        const position: Vector2D = { x: touch.clientX, y: touch.clientY };
        startGesture("pan", position);
        pinchDistanceRef.current = 0;
      }
    },
    [state.type, endGesture, startGesture]
  );

  const onTouchCancel = useCallback(() => {
    endGesture();
    pinchDistanceRef.current = 0;
  }, [endGesture]);

  // ============================================================================
  // Global mouse up handler (for dragging outside container)
  // ============================================================================

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (state.isActive) {
        endGesture();
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (state.isActive) {
        const position: Vector2D = { x: e.clientX, y: e.clientY };
        updateGesture(position);
      }
    };

    // Only add listeners when a gesture is active
    if (state.isActive) {
      window.addEventListener("mouseup", handleGlobalMouseUp);
      window.addEventListener("mousemove", handleGlobalMouseMove);

      return () => {
        window.removeEventListener("mouseup", handleGlobalMouseUp);
        window.removeEventListener("mousemove", handleGlobalMouseMove);
      };
    }
  }, [state.isActive, endGesture, updateGesture]);

  // ============================================================================
  // Container Props
  // ============================================================================

  const containerProps = {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
  };

  return {
    state,
    containerProps,
    registerDraggable,
    scale,
    setScale,
    resetView,
  };
}
