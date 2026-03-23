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
        fixed inset-0 z-[900]
        pointer-events-none
        transition-opacity duration-300
        ${active ? 'opacity-100' : 'opacity-0'}
      `}
      style={{
        // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:mix-blend-difference-requires-literal-white owner:design-system expires:2027-01-01 issue:DNA-001
        backgroundColor: 'white',
        mixBlendMode: 'difference',
      }}
    />
  );
}

export default InvertOverlay;
