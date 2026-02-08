/**
 * usePanZoom - Pan and zoom hook for canvas navigation
 *
 * Ported from Flow 0.
 */

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
  panToCenter: (
    point: Vector2D,
    viewportSize: { width: number; height: number }
  ) => void;
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

  // Animated transition helper
  const animateTo = useCallback(
    (targetPan: Vector2D, targetZoom: number, duration: number = 300) => {
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

  // Zoom to fit content in viewport
  const zoomToFit = useCallback(
    (viewportSize: { width: number; height: number }) => {
      if (!contentBounds) return;

      const padding = 80;
      const scaleX = (viewportSize.width - padding * 2) / contentBounds.width;
      const scaleY = (viewportSize.height - padding * 2) / contentBounds.height;
      const newZoom = Math.max(
        minZoom,
        Math.min(maxZoom, Math.min(scaleX, scaleY), 1)
      );

      const contentCenterX = contentBounds.width / 2;
      const contentCenterY = contentBounds.height / 2;

      const targetPan = {
        x: contentCenterX - viewportSize.width / (2 * newZoom),
        y: contentCenterY - viewportSize.height / (2 * newZoom),
      };

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

  const ZOOM_STEP = 1.2;

  const zoomIn = useCallback(() => {
    setZoomState((prev) => Math.min(maxZoom, prev * ZOOM_STEP));
  }, [maxZoom]);

  const zoomOut = useCallback(() => {
    setZoomState((prev) => Math.max(minZoom, prev / ZOOM_STEP));
  }, [minZoom]);

  const zoomToNode = useCallback(
    (
      node: { x: number; y: number; width: number; height: number },
      viewportSize: { width: number; height: number },
      targetZoom: number = 1.0
    ) => {
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom));

      const nodeCenterX = node.x + node.width / 2;
      const nodeCenterY = node.y + node.height / 2;

      const targetPan = {
        x: nodeCenterX - viewportSize.width / (2 * clampedZoom),
        y: nodeCenterY - viewportSize.height / (2 * clampedZoom),
      };

      animateTo(targetPan, clampedZoom);
    },
    [minZoom, maxZoom, animateTo]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault();
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        panStartRef.current = { ...pan };
        setIsPanning(true);
      }
    },
    [pan]
  );

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
    [isPanning, zoom, setPan]
  );

  const handleMouseUp = useCallback(() => {
    dragStartRef.current = null;
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    dragStartRef.current = null;
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey) {
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const pinchSensitivity = zoomSensitivity * 8;
        const delta = -e.deltaY * pinchSensitivity;
        const newZoom = Math.max(
          minZoom,
          Math.min(maxZoom, zoom * (1 + delta))
        );

        if (newZoom === zoom) return;

        const worldX = pan.x + mouseX / zoom;
        const worldY = pan.y + mouseY / zoom;

        const newPanX = worldX - mouseX / newZoom;
        const newPanY = worldY - mouseY / newZoom;

        setZoomState(newZoom);
        setPan({ x: newPanX, y: newPanY });
      } else {
        setPan({
          x: pan.x + e.deltaX / zoom,
          y: pan.y + e.deltaY / zoom,
        });
      }
    },
    [pan, zoom, zoomSensitivity, minZoom, maxZoom, setPan]
  );

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
