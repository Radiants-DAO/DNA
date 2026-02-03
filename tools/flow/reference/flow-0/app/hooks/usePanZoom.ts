import { useState, useCallback, useRef, useEffect } from "react";
import type { Vector2D } from "../types/canvas";

interface UsePanZoomOptions {
  /** Initial pan offset */
  initialPan?: Vector2D;
  /** Initial zoom scale */
  initialZoom?: number;
  /** Minimum zoom scale */
  minZoom?: number;
  /** Maximum zoom scale */
  maxZoom?: number;
  /** Zoom sensitivity (higher = faster zoom) */
  zoomSensitivity?: number;
  /** Content bounds for centering calculations */
  contentBounds?: { width: number; height: number };
}

interface UsePanZoomResult {
  /** Current pan offset */
  pan: Vector2D;
  /** Current zoom scale */
  zoom: number;
  /** Set pan directly */
  setPan: (pan: Vector2D) => void;
  /** Set zoom directly */
  setZoom: (zoom: number) => void;
  /** Reset to default view */
  resetView: () => void;
  /** Zoom to fit content */
  zoomToFit: (viewportSize: { width: number; height: number }) => void;
  /** Pan to center on a point */
  panToCenter: (point: Vector2D, viewportSize: { width: number; height: number }) => void;
  /** Zoom in by a step */
  zoomIn: () => void;
  /** Zoom out by a step */
  zoomOut: () => void;
  /** Zoom to a specific node, centering it in viewport */
  zoomToNode: (
    node: { x: number; y: number; width: number; height: number },
    viewportSize: { width: number; height: number },
    targetZoom?: number
  ) => void;
  /** Whether animation is in progress */
  isAnimating: boolean;
  /** Container event handlers */
  containerProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    onMouseLeave: (e: React.MouseEvent) => void;
    onWheel: (e: React.WheelEvent) => void;
  };
  /** Whether currently panning */
  isPanning: boolean;
}

const DEFAULT_OPTIONS: Required<Omit<UsePanZoomOptions, "contentBounds">> = {
  initialPan: { x: 0, y: 0 },
  initialZoom: 1,
  minZoom: 0.1,
  maxZoom: 3,
  zoomSensitivity: 0.001,
};

export function usePanZoom(options: UsePanZoomOptions = {}): UsePanZoomResult {
  const {
    initialPan = DEFAULT_OPTIONS.initialPan,
    initialZoom = DEFAULT_OPTIONS.initialZoom,
    minZoom = DEFAULT_OPTIONS.minZoom,
    maxZoom = DEFAULT_OPTIONS.maxZoom,
    zoomSensitivity = DEFAULT_OPTIONS.zoomSensitivity,
    contentBounds,
  } = options;

  const [pan, setPanState] = useState<Vector2D>(initialPan);
  const [zoom, setZoomState] = useState(initialZoom);
  const [isPanning, setIsPanning] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Refs for drag tracking
  const dragStartRef = useRef<Vector2D | null>(null);
  const panStartRef = useRef<Vector2D>({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);

  // Wrapped setPan that cancels any ongoing animation
  const setPan = useCallback((newPan: Vector2D) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      setIsAnimating(false);
    }
    setPanState(newPan);
  }, []);

  // Clamp zoom to bounds
  const setZoom = useCallback(
    (newZoom: number) => {
      setZoomState(Math.max(minZoom, Math.min(maxZoom, newZoom)));
    },
    [minZoom, maxZoom]
  );

  // Reset to initial view
  const resetView = useCallback(() => {
    setPan(initialPan);
    setZoomState(initialZoom);
  }, [initialPan, initialZoom, setPan]);

  // Animated transition helper (defined early so other functions can use it)
  const animateTo = useCallback(
    (
      targetPan: Vector2D,
      targetZoom: number,
      duration: number = 300
    ) => {
      // Cancel any existing animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const startPan = { ...pan };
      const startZoom = zoom;
      const startTime = performance.now();

      setIsAnimating(true);

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        const newPan = {
          x: startPan.x + (targetPan.x - startPan.x) * eased,
          y: startPan.y + (targetPan.y - startPan.y) * eased,
        };
        const newZoom = startZoom + (targetZoom - startZoom) * eased;

        setPanState(newPan);
        setZoomState(newZoom);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          animationRef.current = null;
          setIsAnimating(false);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [pan, zoom]
  );

  // Zoom to fit content in viewport - resets view to center on content
  const zoomToFit = useCallback(
    (viewportSize: { width: number; height: number }) => {
      if (!contentBounds) return;

      const padding = 80; // Padding around content
      const scaleX = (viewportSize.width - padding * 2) / contentBounds.width;
      const scaleY = (viewportSize.height - padding * 2) / contentBounds.height;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, Math.min(scaleX, scaleY), 1)); // Cap at 1x for fit

      // Calculate pan to center the content in the viewport
      // Content center in world coords
      const contentCenterX = contentBounds.width / 2;
      const contentCenterY = contentBounds.height / 2;

      // Pan so content center is at viewport center
      const targetPan = {
        x: contentCenterX - viewportSize.width / (2 * newZoom),
        y: contentCenterY - viewportSize.height / (2 * newZoom),
      };

      // Animate to the centered position
      animateTo(targetPan, newZoom);
    },
    [contentBounds, minZoom, maxZoom, animateTo]
  );

  // Pan to center on a specific point
  const panToCenter = useCallback(
    (point: Vector2D, viewportSize: { width: number; height: number }) => {
      const centerX = point.x - viewportSize.width / (2 * zoom);
      const centerY = point.y - viewportSize.height / (2 * zoom);
      setPan({ x: centerX, y: centerY });
    },
    [zoom, setPan]
  );

  // Zoom step factor (each step changes zoom by ~20%)
  const ZOOM_STEP = 1.2;

  // Zoom in by one step
  const zoomIn = useCallback(() => {
    setZoomState((prev) => Math.min(maxZoom, prev * ZOOM_STEP));
  }, [maxZoom]);

  // Zoom out by one step
  const zoomOut = useCallback(() => {
    setZoomState((prev) => Math.max(minZoom, prev / ZOOM_STEP));
  }, [minZoom]);

  // Zoom to a specific node, centering it in the viewport
  const zoomToNode = useCallback(
    (
      node: { x: number; y: number; width: number; height: number },
      viewportSize: { width: number; height: number },
      targetZoom: number = 1.0
    ) => {
      // Clamp target zoom to bounds
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom));

      // Calculate node center in world coordinates
      const nodeCenterX = node.x + node.width / 2;
      const nodeCenterY = node.y + node.height / 2;

      // Calculate pan so the node center appears at viewport center
      // Viewport center in world coords = pan + (viewportSize / 2) / zoom
      // So: pan = nodeCenter - (viewportSize / 2) / zoom
      const targetPan = {
        x: nodeCenterX - viewportSize.width / (2 * clampedZoom),
        y: nodeCenterY - viewportSize.height / (2 * clampedZoom),
      };

      // Animate to the target
      animateTo(targetPan, clampedZoom);
    },
    [minZoom, maxZoom, animateTo]
  );

  // Mouse down - start panning (space+drag or middle button)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle mouse button (button 1) or space held
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault();
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        panStartRef.current = { ...pan };
        setIsPanning(true);
      }
    },
    [pan]
  );

  // Mouse move - update pan if dragging
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragStartRef.current || !isPanning) return;

      const dx = (e.clientX - dragStartRef.current.x) / zoom;
      const dy = (e.clientY - dragStartRef.current.y) / zoom;

      setPan({
        x: panStartRef.current.x - dx,
        y: panStartRef.current.y - dy,
      });
    },
    [isPanning, zoom]
  );

  // Mouse up - end panning
  const handleMouseUp = useCallback(() => {
    dragStartRef.current = null;
    setIsPanning(false);
  }, []);

  // Mouse leave - end panning
  const handleMouseLeave = useCallback(() => {
    dragStartRef.current = null;
    setIsPanning(false);
  }, []);

  // Wheel - pan (scroll), pinch-to-zoom is native on Mac (ctrlKey modifier)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      // Pinch-to-zoom on Mac trackpad sends wheel events with ctrlKey
      if (e.ctrlKey) {
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate zoom - use higher sensitivity for snappy pinch response
        const pinchSensitivity = zoomSensitivity * 8;
        const delta = -e.deltaY * pinchSensitivity;
        const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * (1 + delta)));

        if (newZoom === zoom) return;

        // Zoom centered on cursor position
        const worldX = pan.x + mouseX / zoom;
        const worldY = pan.y + mouseY / zoom;

        const newPanX = worldX - mouseX / newZoom;
        const newPanY = worldY - mouseY / newZoom;

        setZoomState(newZoom);
        setPan({ x: newPanX, y: newPanY });
      } else {
        // Regular scroll - pan the canvas
        setPan({
          x: pan.x + e.deltaX / zoom,
          y: pan.y + e.deltaY / zoom,
        });
      }
    },
    [pan, zoom, zoomSensitivity, minZoom, maxZoom]
  );

  // Handle space key for pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        document.body.style.cursor = "grab";
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        document.body.style.cursor = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.body.style.cursor = "";
    };
  }, []);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    pan,
    zoom,
    setPan,
    setZoom,
    resetView,
    zoomToFit,
    panToCenter,
    zoomIn,
    zoomOut,
    zoomToNode,
    isAnimating,
    containerProps: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onWheel: handleWheel,
    },
    isPanning,
  };
}

export default usePanZoom;
