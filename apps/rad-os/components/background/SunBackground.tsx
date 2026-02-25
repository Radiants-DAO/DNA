'use client';

import React from 'react';

/**
 * CSS fallback background for browsers without WebGL
 * Uses a simple gradient that matches the WebGL sun's color scheme
 */
export function SunBackground({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-full h-full ${className}`}
      style={{
        background: `
          radial-gradient(
            ellipse 80% 50% at 50% 30%,
            var(--color-cream) 0%,
            var(--color-sun-yellow) 60%,
            var(--color-sun-yellow) 100%
          )
        `,
      }}
    />
  );
}

export default SunBackground;
