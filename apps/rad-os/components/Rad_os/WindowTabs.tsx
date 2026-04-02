'use client';

import React from 'react';
import { Tabs } from '@rdna/radiants/components/core';

// ============================================================================
// Types
// ============================================================================

interface WindowTabsProps {
  defaultValue: string;
  children: React.ReactNode;
}

// Tab bar is 48px + gap
const TAB_BAR_OFFSET = 56;

// ============================================================================
// WindowTabs — thin height wrapper around Tabs
// ============================================================================

function WindowTabsRoot({ defaultValue, children }: WindowTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} position="top">
      {children}
    </Tabs>
  );
}

function WindowTabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <div
      className="overflow-auto"
      style={{ maxHeight: `calc(var(--app-content-max-height) - ${TAB_BAR_OFFSET}px)` }}
    >
      <Tabs.Content value={value}>
        {children}
      </Tabs.Content>
    </div>
  );
}

// ============================================================================
// Public API
// ============================================================================

export const WindowTabs = Object.assign(WindowTabsRoot, {
  Content: WindowTabsContent,
  List: Tabs.List,
  Trigger: Tabs.Trigger,
});
