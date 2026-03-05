'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

interface CrtOverlayProps {
  /** Enable/disable the CRT effect */
  enabled?: boolean;
  /** Intensity of the effect */
  intensity?: 'subtle' | 'medium' | 'strong';
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * CRT (Cathode Ray Tube) overlay effect
 *
 * Creates a retro scanline effect reminiscent of old CRT monitors.
 * Includes horizontal and vertical scanlines with RGB color shift.
 *
 * Features:
 * - Horizontal scanlines with scanline-shift animation
 * - Vertical scanlines with pixel-wobble animation
 * - Bloom pulse brightness flicker
 * - Respects prefers-reduced-motion
 *
 * @example
 * // Basic usage
 * <CrtOverlay />
 *
 * @example
 * // Subtle effect
 * <CrtOverlay intensity="subtle" />
 *
 * @example
 * // Conditionally enabled
 * <CrtOverlay enabled={showEffects} />
 */
export function CrtOverlay({
  enabled = true,
  intensity = 'medium',
  className = '',
}: CrtOverlayProps) {
  if (!enabled) return null;

  const intensityStyles = {
    subtle: 'opacity-30',
    medium: 'opacity-50',
    strong: 'opacity-70',
  };

  return (
    <div
      className={`
        fixed inset-0
        pointer-events-none
        z-[9999]
        ${className}
      `}
      style={{
        filter: 'blur(0.3px) brightness(1.1)',
        animation: 'bloom-pulse 3s ease-in-out infinite',
      }}
      aria-hidden="true"
    >
      {/* Horizontal scanlines */}
      <div
        className={`
          absolute inset-0
          mix-blend-overlay
          ${intensityStyles[intensity]}
        `}
        style={{
          background: `repeating-linear-gradient(
            var(--color-crt-red, #ef5c6f) 0px,
            var(--color-crt-green, #14f1b2) 2px,
            var(--color-crt-blue, #6939ca) 4px
          )`,
          animation: 'scanline-shift 6s linear infinite',
        }}
      />

      {/* Vertical scanlines */}
      <div
        className={`
          absolute inset-0
          mix-blend-overlay
          ${intensityStyles[intensity]}
        `}
        style={{
          background: `repeating-linear-gradient(
            90deg,
            var(--color-crt-red, #ef5c6f) 1px,
            var(--color-crt-green, #14f1b2) 2px,
            var(--color-crt-blue, #6939ca) 3px
          )`,
          animation: 'pixel-wobble 4s ease-in-out infinite',
        }}
      />
    </div>
  );
}

export default CrtOverlay;
