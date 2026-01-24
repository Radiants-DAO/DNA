'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

interface NebulaBackgroundProps {
  /** Show the blurred glow layer */
  showBlur?: boolean;
  /** Custom asset paths (defaults to monolith theme assets) */
  assets?: {
    background?: string;
    midground?: string;
    foreground?: string;
  };
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Default Assets
// ============================================================================

const defaultAssets = {
  background: '/assets/portal_neb2.avif',
  midground: '/assets/portal_neb1.avif',
  foreground: '/assets/monolith_neb.avif',
};

// ============================================================================
// Component
// ============================================================================

/**
 * Layered nebula background with optional blur glow effect
 *
 * Creates a depth effect using three layered images:
 * - Background: Farthest layer
 * - Midground: Middle layer
 * - Foreground: Closest layer (portal/monolith)
 *
 * Optionally includes a blurred version underneath for a glow effect.
 *
 * @example
 * // Basic usage
 * <NebulaBackground />
 *
 * @example
 * // Without blur
 * <NebulaBackground showBlur={false} />
 *
 * @example
 * // Custom assets
 * <NebulaBackground
 *   assets={{
 *     background: '/images/custom-bg.avif',
 *     midground: '/images/custom-mid.avif',
 *     foreground: '/images/custom-fg.avif',
 *   }}
 * />
 */
export function NebulaBackground({
  showBlur = true,
  assets = defaultAssets,
  className = '',
}: NebulaBackgroundProps) {
  const mergedAssets = { ...defaultAssets, ...assets };

  return (
    <>
      {/* Blur/glow layer */}
      {showBlur && (
        <div
          className={`
            absolute inset-0
            pointer-events-none
            flex items-center justify-center
            overflow-hidden
            brightness-[1.47]
            blur-[3em]
            mix-blend-lighten
          `}
          aria-hidden="true"
        >
          <img
            src={mergedAssets.background}
            alt=""
            className="absolute max-h-[69em] object-contain"
            loading="lazy"
          />
          <img
            src={mergedAssets.midground}
            alt=""
            className="absolute max-h-[69em] object-contain"
            loading="lazy"
          />
          <img
            src={mergedAssets.foreground}
            alt=""
            className="absolute max-h-[69em] object-contain"
            loading="lazy"
          />
        </div>
      )}

      {/* Sharp layer */}
      <div
        className={`
          absolute inset-0
          pointer-events-none
          flex items-center justify-center
          overflow-hidden
          ${className}
        `}
        aria-hidden="true"
      >
        <img
          src={mergedAssets.background}
          alt=""
          className="absolute max-h-[69em] object-contain"
          loading="lazy"
        />
        <img
          src={mergedAssets.midground}
          alt=""
          className="absolute max-h-[69em] object-contain"
          loading="lazy"
        />
        <img
          src={mergedAssets.foreground}
          alt=""
          className="absolute max-h-[69em] object-contain"
          loading="lazy"
        />
      </div>
    </>
  );
}

export default NebulaBackground;
