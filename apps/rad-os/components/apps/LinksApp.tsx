'use client';

import React from 'react';
import type { AppProps } from '@/lib/constants';
import { WindowContent } from '@/components/Rad_os';

export function LinksApp({ windowId }: AppProps) {
  return (
    <WindowContent>
      <div className="flex items-center justify-center h-full text-mute font-joystix text-xs uppercase tracking-tight">
        Coming soon
      </div>
    </WindowContent>
  );
}

export default LinksApp;
