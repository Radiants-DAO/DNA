'use client';

import React, { createContext, use, useState } from 'react';

// ============================================================================
// Context
// ============================================================================

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = use(TabsContext);
  if (!context) throw new Error('CrtTabs components must be used within a CrtTabs');
  return context;
}

// ============================================================================
// Root
// ============================================================================

interface CrtTabsProps {
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}

export function CrtTabs({ defaultValue = '', children, className = '' }: CrtTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext>
  );
}

// ============================================================================
// TabList
// ============================================================================

interface CrtTabListProps {
  children: React.ReactNode;
  className?: string;
}

function CrtTabList({ children, className = '' }: CrtTabListProps) {
  return (
    <div className={`crt-tab-list ${className}`}>
      {children}
    </div>
  );
}

// ============================================================================
// TabTrigger
// ============================================================================

interface CrtTabTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function CrtTabTrigger({ value, children, className = '' }: CrtTabTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={`crt-tab-trigger${isActive ? ' crt-tab-trigger--active' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

// ============================================================================
// TabContent
// ============================================================================

interface CrtTabContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function CrtTabContent({ value, children, className = '' }: CrtTabContentProps) {
  const { activeTab } = useTabsContext();
  if (activeTab !== value) return null;

  return (
    <div role="tabpanel" className={`crt-tab-content ${className}`}>
      {children}
    </div>
  );
}

// Attach sub-components
CrtTabs.List = CrtTabList;
CrtTabs.Trigger = CrtTabTrigger;
CrtTabs.Content = CrtTabContent;

export default CrtTabs;
