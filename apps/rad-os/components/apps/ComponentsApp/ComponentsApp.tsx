'use client';

import React from 'react';
import { Tabs, useTabsState, ToastProvider } from '@rdna/radiants/components/core';
import { DesignSystemTab } from '@/devtools/tabs/ComponentsTab/DesignSystemTab';
import type { AppProps } from '@/lib/constants';
import { WindowSystemTab } from './WindowSystemTab';
import { AuctionsTab } from './AuctionsTab';

// ============================================================================
// Main Component
// ============================================================================

export function ComponentsApp({ windowId }: AppProps) {
  const tabs = useTabsState({ defaultValue: 'design-system', variant: 'line' });

  return (
    <ToastProvider>
      <div className="h-full flex flex-col">
        <Tabs.Provider state={tabs.state} actions={tabs.actions} meta={tabs.meta}>
          <Tabs.Frame className="h-full flex flex-col">
            <Tabs.List>
              <Tabs.Trigger value="design-system">Design System</Tabs.Trigger>
              <Tabs.Trigger value="auctions">Auctions</Tabs.Trigger>
              <Tabs.Trigger value="window-system">Window System</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="design-system" className="flex-1 min-h-0 overflow-auto">
              <DesignSystemTab />
            </Tabs.Content>
            <Tabs.Content value="auctions" className="flex-1 min-h-0 overflow-auto">
              <AuctionsTab />
            </Tabs.Content>
            <Tabs.Content value="window-system" className="flex-1 min-h-0 overflow-auto">
              <WindowSystemTab />
            </Tabs.Content>
          </Tabs.Frame>
        </Tabs.Provider>
      </div>
    </ToastProvider>
  );
}

export default ComponentsApp;
