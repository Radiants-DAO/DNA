'use client';

import React, { createContext, use, useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

type TabsVariant = 'pill' | 'line';
type TabsLayout = 'default' | 'bottom-tabs';

interface TabsState {
  activeTab: string;
}

interface TabsActions {
  setActiveTab: (value: string) => void;
}

interface TabsMeta {
  variant: TabsVariant;
  layout: TabsLayout;
}

interface TabsContextValue {
  state: TabsState;
  actions: TabsActions;
  meta: TabsMeta;
}

interface ProviderProps {
  state: TabsState;
  actions: TabsActions;
  meta: TabsMeta;
  children: React.ReactNode;
}

interface FrameProps {
  children: React.ReactNode;
  className?: string;
}

interface ListProps {
  children: React.ReactNode;
  className?: string;
}

interface TriggerProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

interface ContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// Context
// ============================================================================

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const context = use(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs.Provider');
  }
  return context;
}

// ============================================================================
// Styles
// ============================================================================

const triggerBaseStyles = `
  flex items-center justify-center gap-2
  px-4 py-2
  font-heading text-xs uppercase
  cursor-pointer select-none
  transition-colors duration-200 ease-out
  relative
  border
  rounded-sm
  flex-1
  shadow-none
`;

const pillStyles = {
  inactive: `
    border-transparent bg-cream text-content-primary
    hover:bg-sun-yellow/20
    dark:bg-transparent dark:border-edge-muted dark:text-sun-yellow
    dark:hover:bg-transparent dark:hover:border-edge-hover dark:hover:shadow-glow-sm
    hover:translate-y-0
  `,
  active: `
    border-edge-primary bg-action-primary text-black
    hover:bg-action-primary
    hover:translate-y-0
    hover:shadow-none
  `,
};

const lineStyles = {
  inactive: `
    bg-transparent
    hover:bg-hover-overlay
  `,
  active: `
    border-b-0
    bg-surface-primary
    border-t border-l border-r border-edge-primary
    rounded-t-md
    mb-0
    relative
    z-10
  `,
};

// ============================================================================
// Sub-components
// ============================================================================

function Provider({ state, actions, meta, children }: ProviderProps): React.ReactElement {
  const contextValue: TabsContextValue = { state, actions, meta };
  return <TabsContext value={contextValue}>{children}</TabsContext>;
}

function Frame({ children, className = '' }: FrameProps): React.ReactElement {
  return <div className={className}>{children}</div>;
}

function List({ children, className = '' }: ListProps): React.ReactElement {
  const { meta: { layout } } = useTabsContext();
  const shrinkClass = layout === 'bottom-tabs' ? 'shrink-0' : '';

  return (
    <div className={`flex items-center justify-between gap-4 px-2 py-2 bg-surface-primary border-t border-edge-primary ${shrinkClass} ${className}`}>
      <div className="flex gap-2 items-center overflow-x-auto w-full">
        {children}
      </div>
    </div>
  );
}

function Trigger({ value, children, icon, className = '' }: TriggerProps): React.ReactElement | null {
  const { state: { activeTab }, actions: { setActiveTab }, meta: { variant } } = useTabsContext();
  const isActive = activeTab === value;

  const variantStyle = variant === 'pill'
    ? (isActive ? pillStyles.active : pillStyles.inactive)
    : (isActive ? lineStyles.active : lineStyles.inactive);

  const classes = [triggerBaseStyles, variantStyle, className]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={classes}
    >
      {icon}
      {children}
    </button>
  );
}

function Content({ value, children, className = '' }: ContentProps): React.ReactElement | null {
  const { state: { activeTab }, meta: { variant } } = useTabsContext();

  if (activeTab !== value) {
    return null;
  }

  const contentClasses = variant === 'line'
    ? `bg-surface-primary border-r border-edge-primary ${className}`
    : className;

  return (
    <div
      role="tabpanel"
      className={contentClasses}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Public API
// ============================================================================

export type { TabsVariant, TabsLayout, TabsState, TabsActions, TabsMeta };

export function useTabsState({
  defaultValue = '',
  value,
  onValueChange,
  variant = 'pill',
  layout = 'bottom-tabs',
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  layout?: TabsLayout;
} = {}): { state: TabsState; actions: TabsActions; meta: TabsMeta } {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internalValue;

  const setActiveTab = useCallback((newValue: string) => {
    if (!isControlled) setInternalValue(newValue);
    onValueChange?.(newValue);
  }, [isControlled, onValueChange]);

  const state: TabsState = { activeTab };
  const actions: TabsActions = { setActiveTab };
  const meta: TabsMeta = { variant, layout };

  return { state, actions, meta };
}

export const Tabs = {
  Provider,
  Frame,
  List,
  Trigger,
  Content,
  useTabsState,
};

export default Tabs;
