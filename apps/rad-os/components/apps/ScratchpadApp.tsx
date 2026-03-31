'use client';

import dynamic from 'next/dynamic';
import { type AppProps } from '@/lib/apps';
import { AppWindow } from '@rdna/radiants/components/core';

// BlockNote requires browser APIs — load client-only
const ScratchpadEditor = dynamic(
  () => import('./scratchpad/ScratchpadEditor'),
  { ssr: false },
);

export function ScratchpadApp({ windowId: _windowId }: AppProps) {
  return (
    <AppWindow.Content layout="bleed">
      <div className="h-full relative">
        {/* Pattern shadow strips — matches GoodNewsApp treatment */}
        <div
          className="absolute top-0 left-0 right-0 h-1 z-10"
          style={{ backgroundImage: 'var(--pat-diagonal-dots)', backgroundRepeat: 'repeat' }}
        />
        <div
          className="absolute top-1 left-0 right-0 h-1 z-10"
          style={{ backgroundImage: 'var(--pat-spray-grid)', backgroundRepeat: 'repeat' }}
        />
        {/* Editor surface */}
        <div className="bg-card h-full overflow-hidden border-t border-ink">
          <ScratchpadEditor />
        </div>
      </div>
    </AppWindow.Content>
  );
}

export default ScratchpadApp;
