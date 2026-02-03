import { useRef, useCallback, useEffect, useState } from "react";
import type {
  Vector2D,
  VelocitySample,
  PhysicsConfig,
  UseCanvasPhysicsOptions,
  UseCanvasPhysicsResult,
} from "../types/canvas";
import { DEFAULT_PHYSICS_CONFIG } from "../types/canvas";

interface InternalPhysicsState {
  position: Vector2D;
  velocity: Vector2D;
  isAnimating: boolean;
}

function getVelocityMagnitude(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * useCanvasPhysics - Physics-based momentum and bounce for canvas interactions
 *
 * Provides velocity tracking, momentum-based movement with friction,
 * and bounce detection at boundaries.
 *
 * Design Reference: robot.co canvas implementation
 * - Velocity sampling over 6 frames (80ms max age)
 * - Adaptive friction (0.975 base, 0.94 at high speed)
 * - Bounce damping (0.45) on boundary collision
 */
export function useCanvasPhysics(
  options?: UseCanvasPhysicsOptions
): UseCanvasPhysicsResult {
  const config: PhysicsConfig = {
    ...DEFAULT_PHYSICS_CONFIG,
    ...options?.config,
  };

  const boundsRef = useRef<{ width: number; height: number } | undefined>(
    options?.bounds
  );
  const enableBounceRef = useRef(options?.enableBounce ?? false);
  const onBounceRef = useRef(options?.onBounce);

  // Keep onBounce callback ref updated
  useEffect(() => {
    onBounceRef.current = options?.onBounce;
  }, [options?.onBounce]);

  // Keep boundsRef synced with options
  useEffect(() => {
    if (options?.bounds) {
      boundsRef.current = options.bounds;
    }
  }, [options?.bounds]);

  // Keep enableBounceRef synced with options
  useEffect(() => {
    enableBounceRef.current = options?.enableBounce ?? false;
  }, [options?.enableBounce]);

  // Physics state
  const [state, setState] = useState<InternalPhysicsState>({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    isAnimating: false,
  });

  // Refs for animation loop
  const positionRef = useRef<Vector2D>({ x: 0, y: 0 });
  const velocityRef = useRef<Vector2D>({ x: 0, y: 0 });
  const velocitySamplesRef = useRef<VelocitySample[]>([]);
  const isAnimatingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  // Tracking state
  const isTrackingRef = useRef(false);
  const lastTrackPositionRef = useRef<Vector2D | null>(null);
  const lastTrackTimeRef = useRef<number>(0);

  /**
   * Add velocity sample to history
   */
  const addVelocitySample = useCallback(
    (velocity: Vector2D) => {
      const now = performance.now();
      const samples = velocitySamplesRef.current;

      // Add new sample
      samples.push({ velocity, timestamp: now });

      // Remove old samples (older than maxAge or beyond count limit)
      const cutoffTime = now - config.velocitySampleMaxAge;
      velocitySamplesRef.current = samples
        .filter((s) => s.timestamp >= cutoffTime)
        .slice(-config.velocitySampleCount);
    },
    [config.velocitySampleMaxAge, config.velocitySampleCount]
  );

  /**
   * Calculate average velocity from recent samples
   */
  const getAverageVelocity = useCallback((): Vector2D => {
    const samples = velocitySamplesRef.current;
    if (samples.length === 0) return { x: 0, y: 0 };

    const now = performance.now();
    const validSamples = samples.filter(
      (s) => now - s.timestamp <= config.velocitySampleMaxAge
    );

    if (validSamples.length === 0) return { x: 0, y: 0 };

    let sumX = 0;
    let sumY = 0;
    for (const s of validSamples) {
      sumX += s.velocity.x;
      sumY += s.velocity.y;
    }

    return {
      x: sumX / validSamples.length,
      y: sumY / validSamples.length,
    };
  }, [config.velocitySampleMaxAge]);

  /**
   * Clamp velocity to max
   */
  const clampVelocity = useCallback(
    (v: Vector2D): Vector2D => {
      const magnitude = getVelocityMagnitude(v);
      if (magnitude <= config.maxVelocity) return v;

      const scale = config.maxVelocity / magnitude;
      return { x: v.x * scale, y: v.y * scale };
    },
    [config.maxVelocity]
  );

  /**
   * Check and handle boundary bounce
   */
  const handleBounce = useCallback(
    (
      pos: Vector2D,
      vel: Vector2D
    ): { position: Vector2D; velocity: Vector2D; bounced: boolean } => {
      if (!enableBounceRef.current || !boundsRef.current) {
        return { position: pos, velocity: vel, bounced: false };
      }

      const { width, height } = boundsRef.current;
      let newPos = { ...pos };
      let newVel = { ...vel };
      let bounced = false;

      // Left boundary (position is negative when panning left)
      if (newPos.x > 0) {
        newPos.x = 0;
        newVel.x = -newVel.x * config.bounceDamping;
        bounced = true;
        onBounceRef.current?.("left");
      }

      // Right boundary
      if (newPos.x < -width) {
        newPos.x = -width;
        newVel.x = -newVel.x * config.bounceDamping;
        bounced = true;
        onBounceRef.current?.("right");
      }

      // Top boundary
      if (newPos.y > 0) {
        newPos.y = 0;
        newVel.y = -newVel.y * config.bounceDamping;
        bounced = true;
        onBounceRef.current?.("top");
      }

      // Bottom boundary
      if (newPos.y < -height) {
        newPos.y = -height;
        newVel.y = -newVel.y * config.bounceDamping;
        bounced = true;
        onBounceRef.current?.("bottom");
      }

      return { position: newPos, velocity: newVel, bounced };
    },
    [config.bounceDamping]
  );

  /**
   * Animation loop for momentum
   */
  const animate = useCallback(() => {
    if (!isAnimatingRef.current) return;

    const velocity = velocityRef.current;
    const magnitude = getVelocityMagnitude(velocity);

    // Stop if velocity is below threshold
    if (magnitude < config.minVelocity) {
      isAnimatingRef.current = false;
      velocityRef.current = { x: 0, y: 0 };
      setState((prev) => ({
        ...prev,
        velocity: { x: 0, y: 0 },
        isAnimating: false,
      }));
      return;
    }

    // Apply adaptive friction based on velocity
    const friction =
      magnitude > 20 ? config.highSpeedFriction : config.baseFriction;

    // Update velocity with friction
    velocityRef.current = {
      x: velocity.x * friction,
      y: velocity.y * friction,
    };

    // Update position based on velocity
    const newPosition = {
      x: positionRef.current.x + velocityRef.current.x,
      y: positionRef.current.y + velocityRef.current.y,
    };

    // Handle bounce if enabled
    const bounceResult = handleBounce(newPosition, velocityRef.current);
    positionRef.current = bounceResult.position;
    velocityRef.current = bounceResult.velocity;

    // Update state for React
    setState((prev) => ({
      ...prev,
      position: positionRef.current,
      velocity: velocityRef.current,
    }));

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [
    config.minVelocity,
    config.baseFriction,
    config.highSpeedFriction,
    handleBounce,
  ]);

  /**
   * Start momentum animation
   */
  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current) return;

    isAnimatingRef.current = true;
    setState((prev) => ({ ...prev, isAnimating: true }));
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [animate]);

  /**
   * Stop animation
   */
  const stopAnimation = useCallback(() => {
    isAnimatingRef.current = false;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  /**
   * Start tracking from a position
   */
  const startTracking = useCallback(
    (position: Vector2D) => {
      stopAnimation();
      isTrackingRef.current = true;
      lastTrackPositionRef.current = position;
      lastTrackTimeRef.current = performance.now();
      velocitySamplesRef.current = [];
    },
    [stopAnimation]
  );

  /**
   * Update tracking position (call on mouse/touch move)
   */
  const updateTracking = useCallback(
    (position: Vector2D) => {
      if (!isTrackingRef.current || !lastTrackPositionRef.current) return;

      const now = performance.now();
      const dt = (now - lastTrackTimeRef.current) / 1000;

      // Calculate and record velocity
      const velocity: Vector2D =
        dt > 0
          ? {
              x: (position.x - lastTrackPositionRef.current.x) / dt,
              y: (position.y - lastTrackPositionRef.current.y) / dt,
            }
          : { x: 0, y: 0 };
      addVelocitySample(velocity);

      // Update position
      const delta = {
        x: position.x - lastTrackPositionRef.current.x,
        y: position.y - lastTrackPositionRef.current.y,
      };

      positionRef.current = {
        x: positionRef.current.x + delta.x,
        y: positionRef.current.y + delta.y,
      };

      setState((prev) => ({
        ...prev,
        position: positionRef.current,
      }));

      lastTrackPositionRef.current = position;
      lastTrackTimeRef.current = now;
    },
    [addVelocitySample]
  );

  /**
   * End tracking and apply momentum
   */
  const endTracking = useCallback(() => {
    if (!isTrackingRef.current) return;

    isTrackingRef.current = false;
    lastTrackPositionRef.current = null;

    // Get average velocity and apply momentum
    const avgVelocity = getAverageVelocity();
    const clampedVelocity = clampVelocity(avgVelocity);

    // Scale velocity for momentum (convert from per-second to per-frame feel)
    velocityRef.current = {
      x: clampedVelocity.x * 16, // ~60fps frame time
      y: clampedVelocity.y * 16,
    };

    setState((prev) => ({
      ...prev,
      velocity: velocityRef.current,
    }));

    // Start momentum animation if velocity is significant
    const magnitude = getVelocityMagnitude(velocityRef.current);
    if (magnitude >= config.minVelocity) {
      startAnimation();
    }
  }, [getAverageVelocity, clampVelocity, config.minVelocity, startAnimation]);

  /**
   * Apply impulse to velocity
   */
  const applyImpulse = useCallback(
    (impulse: Vector2D) => {
      const newVelocity = clampVelocity({
        x: velocityRef.current.x + impulse.x,
        y: velocityRef.current.y + impulse.y,
      });

      velocityRef.current = newVelocity;
      setState((prev) => ({
        ...prev,
        velocity: newVelocity,
      }));

      const magnitude = getVelocityMagnitude(newVelocity);
      if (magnitude >= config.minVelocity && !isAnimatingRef.current) {
        startAnimation();
      }
    },
    [clampVelocity, config.minVelocity, startAnimation]
  );

  /**
   * Stop all motion immediately
   */
  const stop = useCallback(() => {
    stopAnimation();
    isTrackingRef.current = false;
    lastTrackPositionRef.current = null;
    velocityRef.current = { x: 0, y: 0 };
    velocitySamplesRef.current = [];

    setState((prev) => ({
      ...prev,
      velocity: { x: 0, y: 0 },
      isAnimating: false,
    }));
  }, [stopAnimation]);

  /**
   * Update bounds (e.g., on resize)
   */
  const setBounds = useCallback(
    (bounds: { width: number; height: number }) => {
      boundsRef.current = bounds;
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  return {
    state,
    startTracking,
    updateTracking,
    endTracking,
    applyImpulse,
    stop,
    setBounds,
  };
}
