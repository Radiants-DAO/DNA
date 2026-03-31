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
      <ScratchpadEditor />
    </AppWindow.Content>
  );
}

export default ScratchpadApp;
