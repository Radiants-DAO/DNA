'use client';

import React from 'react';

interface InvertOverlayProps {
  active: boolean;
}

/**
 * Full-screen invert overlay for invert mode
 * When active, inverts all colors on the page using mix-blend-mode: difference
 */
export function InvertOverlay({ active }: InvertOverlayProps) {
  return (
    <div
      className={`
        fixed inset-0 z-[9999]
        pointer-events-none
        transition-opacity duration-500
        ${active ? 'opacity-100' : 'opacity-0'}
      `}
      style={{
        backgroundColor: 'white',
        mixBlendMode: 'difference',
      }}
    />
  );
}

export default InvertOverlay;
