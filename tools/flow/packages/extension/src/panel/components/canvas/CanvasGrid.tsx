/**
 * CanvasGrid - High-performance canvas-based dot grid
 *
 * Ported from Flow 0 with the following features:
 * - Canvas rendering for performance
 * - Pan/zoom support with virtualization
 * - Optional spring physics for dot animations
 * - Only redraws visible portion
 */

import { useRef, useEffect, useCallback } from "react";
import type {
  CanvasGridProps,
  GridConfig,
  Vector2D,
  SpringConfig,
} from "../../types/canvas";
import {
  DEFAULT_GRID_CONFIG,
  DEFAULT_SPRING_CONFIG,
} from "../../types/canvas";

// Internal state for spring physics
interface DotSpringState {
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  velocityX: number;
  velocityY: number;
}

/**
 * Merge partial config with defaults
 */
function mergeConfig(partial?: Partial<GridConfig>): GridConfig {
  return {
    ...DEFAULT_GRID_CONFIG,
    ...partial,
    spring: {
      ...DEFAULT_SPRING_CONFIG,
      ...partial?.spring,
    },
  };
}

/**
 * Calculate visible grid bounds based on viewport and transform
 */
function getVisibleBounds(
  width: number,
  height: number,
  offset: Vector2D,
  scale: number,
  cellSize: number
): { startCol: number; endCol: number; startRow: number; endRow: number } {
  // Convert viewport to canvas coordinates
  const viewLeft = -offset.x / scale;
  const viewTop = -offset.y / scale;
  const viewRight = (width - offset.x) / scale;
  const viewBottom = (height - offset.y) / scale;

  // Calculate grid cell range with padding
  const padding = 2; // Extra cells to prevent pop-in
  const startCol = Math.floor(viewLeft / cellSize) - padding;
  const endCol = Math.ceil(viewRight / cellSize) + padding;
  const startRow = Math.floor(viewTop / cellSize) - padding;
  const endRow = Math.ceil(viewBottom / cellSize) + padding;

  return { startCol, endCol, startRow, endRow };
}

/**
 * Draw static grid (no physics)
 */
function drawStaticGrid(
  ctx: CanvasRenderingContext2D,
  config: GridConfig,
  offset: Vector2D,
  scale: number,
  width: number,
  height: number
): void {
  const { cellSize, dotRadius, dotColor, backgroundColor } = config;

  // Clear canvas with background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Get visible bounds
  const { startCol, endCol, startRow, endRow } = getVisibleBounds(
    width,
    height,
    offset,
    scale,
    cellSize
  );

  // Set dot style
  ctx.fillStyle = dotColor;

  // Batch all dots in a single path for performance
  ctx.beginPath();

  for (let col = startCol; col <= endCol; col++) {
    for (let row = startRow; row <= endRow; row++) {
      // Grid position in canvas space
      const gridX = col * cellSize;
      const gridY = row * cellSize;

      // Transform to screen space
      const screenX = gridX * scale + offset.x;
      const screenY = gridY * scale + offset.y;

      // Scale dot radius with zoom (clamped for visibility)
      const scaledRadius = Math.max(0.5, dotRadius * Math.min(scale, 2));

      // Draw dot as arc
      ctx.moveTo(screenX + scaledRadius, screenY);
      ctx.arc(screenX, screenY, scaledRadius, 0, Math.PI * 2);
    }
  }

  ctx.fill();
}

/**
 * Apply spring physics to a single value
 */
function springStep(
  current: number,
  target: number,
  velocity: number,
  spring: SpringConfig
): { value: number; velocity: number } {
  const { stiffness, damping } = spring;

  // Spring force: F = -k * displacement
  const displacement = current - target;
  const springForce = -stiffness * displacement;

  // Update velocity with damping
  const newVelocity = (velocity + springForce) * damping;

  // Update position
  const newValue = current + newVelocity;

  // Guard against NaN/Infinity
  if (!Number.isFinite(newValue) || !Number.isFinite(newVelocity)) {
    return { value: target, velocity: 0 };
  }

  return { value: newValue, velocity: newVelocity };
}

/**
 * CanvasGrid Component
 *
 * Renders a performant dot grid using HTML5 Canvas with optional
 * spring physics for smooth animations during pan/zoom.
 */
export function CanvasGrid({
  config: partialConfig,
  offset,
  scale,
  width,
  height,
  className,
}: CanvasGridProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const springStateRef = useRef<Map<string, DotSpringState>>(new Map());
  const previousOffsetRef = useRef<Vector2D>({ x: 0, y: 0 });
  const previousScaleRef = useRef<number>(1);

  // Merge config with defaults
  const config = mergeConfig(partialConfig);

  /**
   * Draw grid with spring physics
   */
  const drawPhysicsGrid = useCallback(
    (ctx: CanvasRenderingContext2D): boolean => {
      const { cellSize, dotRadius, dotColor, backgroundColor, spring } = config;
      const springConfig = spring || DEFAULT_SPRING_CONFIG;

      // Clear canvas with background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Get visible bounds
      const { startCol, endCol, startRow, endRow } = getVisibleBounds(
        width,
        height,
        offset,
        scale,
        cellSize
      );

      // Set dot style
      ctx.fillStyle = dotColor;
      ctx.beginPath();

      let isAnimating = false;
      const activeKeys = new Set<string>();

      for (let col = startCol; col <= endCol; col++) {
        for (let row = startRow; row <= endRow; row++) {
          const key = `${col},${row}`;
          activeKeys.add(key);

          // Target position in screen space
          const targetX = col * cellSize * scale + offset.x;
          const targetY = row * cellSize * scale + offset.y;

          // Get or create spring state for this dot
          let springState = springStateRef.current.get(key);

          if (!springState) {
            // Initialize at target position
            springState = {
              currentX: targetX,
              currentY: targetY,
              targetX,
              targetY,
              velocityX: 0,
              velocityY: 0,
            };
            springStateRef.current.set(key, springState);
          } else {
            // Update target
            springState.targetX = targetX;
            springState.targetY = targetY;

            // Apply spring physics
            const xResult = springStep(
              springState.currentX,
              springState.targetX,
              springState.velocityX,
              springConfig
            );
            const yResult = springStep(
              springState.currentY,
              springState.targetY,
              springState.velocityY,
              springConfig
            );

            springState.currentX = xResult.value;
            springState.velocityX = xResult.velocity;
            springState.currentY = yResult.value;
            springState.velocityY = yResult.velocity;

            // Check if still animating (threshold for stopping)
            const threshold = 0.01;
            if (
              Math.abs(springState.velocityX) > threshold ||
              Math.abs(springState.velocityY) > threshold ||
              Math.abs(springState.currentX - springState.targetX) > threshold ||
              Math.abs(springState.currentY - springState.targetY) > threshold
            ) {
              isAnimating = true;
            }
          }

          // Scale dot radius with zoom (clamped for visibility)
          const scaledRadius = Math.max(0.5, dotRadius * Math.min(scale, 2));

          // Draw dot at spring-animated position
          ctx.moveTo(springState.currentX + scaledRadius, springState.currentY);
          ctx.arc(
            springState.currentX,
            springState.currentY,
            scaledRadius,
            0,
            Math.PI * 2
          );
        }
      }

      ctx.fill();

      // Clean up spring states for dots no longer visible
      const keysToRemove: string[] = [];
      springStateRef.current.forEach((_, key) => {
        if (!activeKeys.has(key)) {
          keysToRemove.push(key);
        }
      });
      keysToRemove.forEach((key) => springStateRef.current.delete(key));

      return isAnimating;
    },
    [config, offset, scale, width, height]
  );

  /**
   * Main draw effect
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cancel any pending animation frame
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (!config.enablePhysics) {
      // Static grid - single draw
      drawStaticGrid(ctx, config, offset, scale, width, height);
    } else {
      // Physics grid - animate until settled
      const animate = () => {
        const stillAnimating = drawPhysicsGrid(ctx);

        if (stillAnimating) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          animationFrameRef.current = null;
        }
      };

      // Detect if offset/scale changed to trigger animation
      const offsetChanged =
        previousOffsetRef.current.x !== offset.x ||
        previousOffsetRef.current.y !== offset.y;
      const scaleChanged = previousScaleRef.current !== scale;

      previousOffsetRef.current = { x: offset.x, y: offset.y };
      previousScaleRef.current = scale;

      if (offsetChanged || scaleChanged) {
        // Start animation loop
        animate();
      } else {
        // Just draw once (initial render or resize)
        drawPhysicsGrid(ctx);
      }
    }

    // Cleanup on unmount or re-render
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [config, offset, scale, width, height, drawPhysicsGrid]);

  /**
   * Handle canvas resize via device pixel ratio for crisp rendering
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;

    // Set display size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Set actual size in memory (scaled for retina)
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    // Scale context to match
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);  // Reset and apply in one call
    }
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    />
  );
}
