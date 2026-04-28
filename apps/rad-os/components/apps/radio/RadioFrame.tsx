'use client';

import type { CSSProperties, ReactNode } from 'react';

// =============================================================================
// RadioFrame — Outer 277×460 widget shell for the Radio app.
//
// Renders the dot-pattern background + dark gradient from the Paper design.
// Children stack top-to-bottom: transport pill on top, LCD screen below. The
// LCD now contains the video window, so nothing overhangs the frame.
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
      className={['dark relative flex flex-col overflow-hidden', className].filter(Boolean).join(' ')}
      style={{
        ['--radio-frame-width' as string]: '277px',
        ['--radio-frame-padding-bottom' as string]: '8.5px',
        width: 'var(--radio-frame-width)',
        // Height is intrinsic — driven by the transport pill + LCD stack.
        // Bottom padding matches the LCD's side gap ((277 - 260) / 2 = 8.5)
        // so the dark frame material wraps uniformly around the LCD.
        paddingBottom: 'var(--radio-frame-padding-bottom)',
        // Paper ORBITER DARK: gentle 32px top, large 136px bowl-shaped bottom.
        // eslint-disable-next-line rdna/no-raw-radius -- reason:radio-frame-bowl-radius owner:rad-os expires:2026-12-31 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#radio-disc-crt-glass-art-rendering
        borderTopLeftRadius: 32,
        // eslint-disable-next-line rdna/no-raw-radius -- reason:radio-frame-bowl-radius owner:rad-os expires:2026-12-31 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#radio-disc-crt-glass-art-rendering
        borderTopRightRadius: 32,
        // eslint-disable-next-line rdna/no-raw-radius -- reason:radio-frame-bowl-radius owner:rad-os expires:2026-12-31 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#radio-disc-crt-glass-art-rendering
        borderBottomLeftRadius: 136,
        // eslint-disable-next-line rdna/no-raw-radius -- reason:radio-frame-bowl-radius owner:rad-os expires:2026-12-31 issue:https://github.com/Radiants-DAO/DNA/blob/main/docs/solutions/tooling/rdna-approved-exceptions.md#radio-disc-crt-glass-art-rendering
        borderBottomRightRadius: 136,
        backgroundImage: [
          'url(https://app.paper.design/file-assets/01KP7YATPHZNBNEC215AM9958W/3VVBRZ1DW67PP068JSK3FPWHDM.svg)',
          'linear-gradient(180deg, var(--color-window-chrome-from) 0%, var(--color-window-chrome-to) 100%)',
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
