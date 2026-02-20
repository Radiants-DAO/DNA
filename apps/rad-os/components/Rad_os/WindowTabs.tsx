'use client';

import React from 'react';
import { Tabs, useTabsState } from '@rdna/radiants/components/core';

// ============================================================================
// Types
// ============================================================================

interface WindowTabsProps {
  /** Default active tab value */
  defaultValue: string;
  children: React.ReactNode;
  /** Additional classes on the root div */
  className?: string;
}

interface WindowTabsContentProps {
  /** Tab value this content panel belongs to */
  value: string;
  children: React.ReactNode;
  /** Additional classes on the inner scroll container */
  className?: string;
}

interface WindowTabsListProps {
  children: React.ReactNode;
  /** Additional classes on the tab bar */
  className?: string;
}

interface WindowTabsTriggerProps {
  /** Tab value this trigger activates */
  value: string;
  children: React.ReactNode;
  /** Optional icon element */
  icon?: React.ReactNode;
}

// Tab bar is 48px; subtract from content max-height so both fit in the window
const TAB_BAR_OFFSET = 56; // 48px bar + 8px gap

// ============================================================================
// Sub-components
// ============================================================================

function WindowTabsContent({ value, children, className = '' }: WindowTabsContentProps) {
  return (
    <Tabs.Content value={value} className="mx-2">
      <div
        className={`overflow-auto bg-white border border-black rounded ${className}`}
        style={{ maxHeight: `calc(var(--app-content-max-height) - ${TAB_BAR_OFFSET}px)` }}
      >
        {children}
      </div>
    </Tabs.Content>
  );
}

function WindowTabsList({ children, className = '' }: WindowTabsListProps) {
  return (
    <Tabs.List className={`mt-2 ${className}`}>
      {children}
    </Tabs.List>
  );
}

function WindowTabsTrigger({ value, children, icon }: WindowTabsTriggerProps) {
  return <Tabs.Trigger value={value} icon={icon}>{children}</Tabs.Trigger>;
}

// ============================================================================
// Main Component
// ============================================================================

function WindowTabsBase({ defaultValue, children, className = '' }: WindowTabsProps) {
  const tabs = useTabsState({ defaultValue, variant: 'pill' });

  return (
    <div className={className}>
      <Tabs.Provider state={tabs.state} actions={tabs.actions} meta={tabs.meta}>
        <Tabs.Frame>
          {children}
        </Tabs.Frame>
      </Tabs.Provider>
    </div>
  );
}

// Compose as compound component
export const WindowTabs = Object.assign(WindowTabsBase, {
  Content: WindowTabsContent,
  List: WindowTabsList,
  Trigger: WindowTabsTrigger,
});
