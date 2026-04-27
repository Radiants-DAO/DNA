'use client';

import { useRadRadioStore } from '@/store';
import { Radio } from './Radio';

// =============================================================================
// RadioWidget — Always-mounted drop-down panel hosting the Radio UI.
//
// Rendered from Desktop.tsx at a z-index BELOW the windows layer so the
// Radio panel reads as a background widget (windows can sit on top of it).
// A slide transform hides it above the viewport when closed, so the <audio>
// element stays mounted and playback continues between open/closed states.
// =============================================================================

export function RadioWidget() {
  const { widgetOpen } = useRadRadioStore();

  return (
    <div
      aria-hidden={!widgetOpen}
      className="fixed z-[80] pointer-events-none"
      style={{
        // Anchor below the taskbar (top-0 pt-4, ≈40px tall) and flush with
        // the right-dock settings area (taskbar has px-4 = 16px gutter).
        top: 56,
        right: 16,
        transform: widgetOpen
          ? 'translateX(0)'
          : 'translateX(calc(100% + 32px))',
        transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform',
      }}
    >
      <div className="pointer-events-auto">
        <Radio />
      </div>
    </div>
  );
}
