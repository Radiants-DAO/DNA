'use client';

import type { CSSProperties, ReactNode } from 'react';

// =============================================================================
// RadioFrame — Outer 277×535 widget shell for the Radio app.
//
// Renders the dot-pattern background + dark gradient from the Paper design.
// Stacks its children bottom-aligned (flex-col justify-end) so floating pieces
// like the disc can overhang the top of the frame.
//
// The frame itself carries data-drag-handle so the AppWindow Draggable wrapper
// grabs any non-interactive area for dragging.
// =============================================================================

interface RadioFrameProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function RadioFrame({ children, className = '', style }: RadioFrameProps) {
  return (
    <div
      data-drag-handle=""
      className={['relative flex flex-col justify-end', className].filter(Boolean).join(' ')}
      style={{
        width: 277,
        height: 535,
        borderRadius: 8,
        backgroundImage: [
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:paper-design-exact-spec owner:rad-os expires:2026-12-31 issue:DNA-999
          'url(https://app.paper.design/file-assets/01KP7YATPHZNBNEC215AM9958W/3VVBRZ1DW67PP068JSK3FPWHDM.svg)',
          'linear-gradient(180deg, oklab(16.4% .0004 0.004) 0%, oklab(40% .0004 0.004) 100%)',
        ].join(', '),
        backgroundSize: '200px 200px, auto',
        backgroundRepeat: 'repeat, no-repeat',
        touchAction: 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
