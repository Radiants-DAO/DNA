'use client';

import React, { createContext, use, useState } from 'react';

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

interface TabsProps {
  /** Default active tab ID (uncontrolled mode) */
  defaultValue?: string;
  /** Active tab ID (controlled mode) */
  value?: string;
  /** Callback when tab changes (controlled mode) */
  onValueChange?: (value: string) => void;
  /** Visual variant */
  variant?: TabsVariant;
  /** Layout pattern - 'bottom-tabs' (default) for fixed bottom tabs, 'default' for top tabs */
  layout?: TabsLayout;
  /** Tab components */
  children: React.ReactNode;
  /** Additional classes for container */
  className?: string;
}

interface TabListProps {
  /** TabTrigger components */
  children: React.ReactNode;
  /** Additional classes */
  className?: string;
}

interface TabTriggerProps {
  /** Unique tab ID */
  value: string;
  /** Tab label */
  children: React.ReactNode;
  /** Icon as React element (slot pattern for theme components) */
  icon?: React.ReactNode;
  /** Additional classes */
  className?: string;
}

interface TabContentProps {
  /** Tab ID this content belongs to */
  value: string;
  /** Content to render when active */
  children: React.ReactNode;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// Context
// ============================================================================

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = use(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs provider');
  }
  return context;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Tab trigger base styles - matching ComponentsSecondaryNav button styles exactly
 */
const triggerBaseStyles = `
  flex items-center justify-center gap-2
  px-4 py-2
  font-joystix text-xs uppercase
  cursor-pointer select-none
  text-content-primary
  transition-all duration-200 ease-out
  relative
  border border-edge-primary
  rounded-sm
  flex-1
  shadow-none
`;

/**
 * Pill variant styles (matching ComponentsSecondaryNav button styles exactly)
 */
const pillStyles = {
  inactive: `
    bg-transparent text-content-primary
    hover:bg-surface-secondary/5
    hover:translate-y-0
    hover:shadow-none
  `,
  active: `
    bg-action-primary text-content-primary
    hover:bg-action-primary
    hover:translate-y-0
    hover:shadow-none
  `,
};

/**
 * Line variant styles (Webflow-style tabs with connected active state)
 * Only adds background/border colors - movement/shadow states come from baseStyles
 */
const lineStyles = {
  inactive: `
    bg-transparent
    hover:bg-surface-primary/50
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
// TabsProvider (state management only)
// ============================================================================

interface TabsProviderProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  layout?: TabsLayout;
}

function TabsProvider({
  children,
  defaultValue,
  value,
  onValueChange,
  variant = 'pill',
  layout = 'bottom-tabs',
}: TabsProviderProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internalValue;

  const setActiveTab = (newValue: string) => {
    if (isControlled) {
      onValueChange?.(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const contextValue: TabsContextValue = {
    state: { activeTab },
    actions: { setActiveTab },
    meta: { variant, layout },
  };

  return (
    <TabsContext value={contextValue}>
      {children}
    </TabsContext>
  );
}

// ============================================================================
// TabsFrame (structure only)
// ============================================================================

interface TabsFrameProps {
  children: React.ReactNode;
  className?: string;
}

function TabsFrame({ children, className = '' }: TabsFrameProps) {
  return <div className={className}>{children}</div>;
}

/**
 * Tabs — Convenience wrapper combining Provider + Frame.
 * For full control, use Tabs.Provider + Tabs.Frame separately.
 */
export const Tabs = Object.assign(
  function Tabs({
    defaultValue,
    value,
    onValueChange,
    variant = 'pill',
    layout = 'bottom-tabs',
    children,
    className = '',
  }: TabsProps) {
    return (
      <TabsProvider
        defaultValue={defaultValue}
        value={value}
        onValueChange={onValueChange}
        variant={variant}
        layout={layout}
      >
        <TabsFrame className={className}>
          {children}
        </TabsFrame>
      </TabsProvider>
    );
  },
  {
    Provider: TabsProvider,
    Frame: TabsFrame,
    List: TabList,
    Trigger: TabTrigger,
    Content: TabContent,
  }
);

/**
 * Container for tab triggers - matching PrimaryNavigationFooter styles
 */
export function TabList({ children, className = '' }: TabListProps) {
  const { meta: { layout } } = useTabsContext();

  // For bottom-tabs layout, ensure shrink-0 so tabs never compress
  const shrinkClass = layout === 'bottom-tabs' ? 'shrink-0' : '';

  return (
    <div className={`flex items-center justify-between gap-4 px-2 py-2 bg-surface-primary border-t border-edge-primary ${shrinkClass} ${className}`}>
      {/* Wrap tabs in flex container to match PrimaryNavigationFooter structure */}
      <div className="flex gap-2 items-center overflow-x-auto w-full">
        {children}
      </div>
    </div>
  );
}

/**
 * Individual tab trigger button - Webflow-style
 */
export function TabTrigger({
  value,
  children,
  icon,
  className = '',
}: TabTriggerProps) {
  const { state: { activeTab }, actions: { setActiveTab }, meta: { variant } } = useTabsContext();
  const isActive = activeTab === value;

  const variantStyle = variant === 'pill'
    ? (isActive ? pillStyles.active : pillStyles.inactive)
    : (isActive ? lineStyles.active : lineStyles.inactive);

  const classes = [
    triggerBaseStyles,
    variantStyle,
    className,
  ]
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
      {/* Render icon from React component slot - icon comes first to match PrimaryNavigationFooter */}
      {icon}
      {children}
    </button>
  );
}

/**
 * Tab content panel - Webflow-style tab pane
 */
export function TabContent({
  value,
  children,
  className = '',
}: TabContentProps) {
  const { state: { activeTab }, meta: { variant } } = useTabsContext();

  if (activeTab !== value) {
    return null;
  }

  // For line variant, content connects seamlessly with active tab
  const contentClasses = variant === 'line'
    ? `bg-surface-primary border-r border-edge-primary ${className}`
    : className;

  return (
    <div
      role="tabpanel"
      className={contentClasses}
      style={{ height: 'auto' }}
    >
      {children}
    </div>
  );
}

export default Tabs;
