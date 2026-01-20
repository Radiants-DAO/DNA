'use client';

import React, { createContext, useContext, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

type TabsVariant = 'pill' | 'line';
type TabsLayout = 'default' | 'bottom-tabs';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  variant: TabsVariant;
  layout: TabsLayout;
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
  const context = useContext(TabsContext);
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
  text-black
  transition-all duration-200 ease-out
  relative
  border border-black
  rounded-sm
  flex-1
  shadow-none
`;

/**
 * Pill variant styles (matching ComponentsSecondaryNav button styles exactly)
 */
const pillStyles = {
  inactive: `
    bg-transparent text-black
    hover:bg-black/5
    hover:translate-y-0
    hover:shadow-none
  `,
  active: `
    bg-sun-yellow text-black
    hover:bg-sun-yellow
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
    hover:bg-warm-cloud/50
  `,
  active: `
    border-b-0
    bg-warm-cloud
    border-t border-l border-r border-black
    rounded-t-md
    mb-0
    relative
    z-10
  `,
};

// ============================================================================
// Components
// ============================================================================

/**
 * Tabs container - provides context for tab state
 * Supports both controlled and uncontrolled modes
 */
export function Tabs({
  defaultValue,
  value,
  onValueChange,
  variant = 'pill',
  layout = 'bottom-tabs',
  children,
  className = '',
}: TabsProps) {
  // Uncontrolled mode uses internal state
  const [internalValue, setInternalValue] = useState(defaultValue || '');

  // Determine if controlled or uncontrolled
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internalValue;

  const setActiveTab = (newValue: string) => {
    if (isControlled) {
      onValueChange?.(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, variant, layout }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

/**
 * Container for tab triggers - matching PrimaryNavigationFooter styles
 */
export function TabList({ children, className = '' }: TabListProps) {
  const { layout } = useTabsContext();

  // For bottom-tabs layout, ensure shrink-0 so tabs never compress
  const shrinkClass = layout === 'bottom-tabs' ? 'shrink-0' : '';

  return (
    <div className={`flex items-center justify-between gap-4 px-2 py-2 bg-warm-cloud border-t border-black ${shrinkClass} ${className}`}>
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
  const { activeTab, setActiveTab, variant } = useTabsContext();
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
  const { activeTab, variant } = useTabsContext();

  if (activeTab !== value) {
    return null;
  }

  // For line variant, content connects seamlessly with active tab
  const contentClasses = variant === 'line'
    ? `bg-warm-cloud border-r border-black ${className}`
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
