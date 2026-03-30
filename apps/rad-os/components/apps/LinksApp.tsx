'use client';
import { AppWindow } from '@rdna/radiants/components/core';
import type { AppProps } from '@/lib/apps';

export function LinksApp({ windowId: _windowId }: AppProps) {
  return (
    <AppWindow.Content>
      <div className="flex items-center justify-center h-full text-mute font-joystix text-xs uppercase tracking-tight">
        Coming soon
      </div>
    </AppWindow.Content>
  );
}

export default LinksApp;
