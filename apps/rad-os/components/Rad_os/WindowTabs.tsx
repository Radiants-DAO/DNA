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
  /** Additional classes (appended to flex-1 min-h-0 overflow-auto) */
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

// ============================================================================
// Sub-components
// ============================================================================

function WindowTabsContent({ value, children, className = '' }: WindowTabsContentProps) {
  return (
    <Tabs.Content value={value} className={`flex-1 min-h-0 overflow-auto ${className}`}>
      {children}
    </Tabs.Content>
  );
}

function WindowTabsList({ children, className = '' }: WindowTabsListProps) {
  return (
    <Tabs.List className={className}>
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
    <div className={`h-full flex flex-col ${className}`}>
      <Tabs.Provider state={tabs.state} actions={tabs.actions} meta={tabs.meta}>
        <Tabs.Frame className="h-full flex flex-col">
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
