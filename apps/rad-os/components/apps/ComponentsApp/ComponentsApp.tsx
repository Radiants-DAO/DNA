'use client';

import React from 'react';
import { ToastProvider } from '@rdna/radiants/components/core';
import { WindowTabs } from '@/components/Rad_os';
import { DesignSystemTab } from '@/devtools/tabs/ComponentsTab/DesignSystemTab';
import type { AppProps } from '@/lib/constants';
import { WindowSystemTab } from './WindowSystemTab';
import { AuctionsTab } from './AuctionsTab';

// ============================================================================
// Main Component
// ============================================================================

export function ComponentsApp({ windowId }: AppProps) {
  return (
    <ToastProvider>
      <WindowTabs defaultValue="design-system">
        <WindowTabs.Content value="design-system">
          <DesignSystemTab />
        </WindowTabs.Content>
        <WindowTabs.Content value="auctions">
          <AuctionsTab />
        </WindowTabs.Content>
        <WindowTabs.Content value="window-system">
          <WindowSystemTab />
        </WindowTabs.Content>
        <WindowTabs.List>
          <WindowTabs.Trigger value="design-system">Design System</WindowTabs.Trigger>
          <WindowTabs.Trigger value="auctions">Auctions</WindowTabs.Trigger>
          <WindowTabs.Trigger value="window-system">Window System</WindowTabs.Trigger>
        </WindowTabs.List>
      </WindowTabs>
    </ToastProvider>
  );
}

export default ComponentsApp;
