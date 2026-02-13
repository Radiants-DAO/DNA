'use client';

import React, { createContext, useContext, useState, useId, useCallback, useRef, useEffect } from 'react';
import { Icon } from '@/components/icons';

// ============================================================================
// Types
// ============================================================================

type TabsVariant = 'pill' | 'line';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  variant: TabsVariant;
  tabIds: Map<string, string>;
  panelIds: Map<string, string>;
  registerTab: (value: string, tabId: string, panelId: string) => void;
  tabsListRef: React.RefObject<HTMLDivElement | null>;
  tabValues: string[];
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
  /** Icon name (filename without .svg extension) */
  iconName?: string;
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
 * Tab trigger base styles - matching Layer33 design
 * - Uppercase Alfacad font
 * - Sharp corners
 */
const triggerBaseStyles = `
  flex items-center justify-center
  px-4 py-2
  font-alfacad text-sm uppercase
  cursor-pointer select-none
  text-black
  relative
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2
`;

/**
 * Pill variant styles (similar to buttons)
 * - Sharp corners
 * - Pixel shadow on active
 */
const pillStyles = {
  inactive: `
    border border-black
    rounded-none
    bg-transparent
    hover:bg-neutral-neutral-1
  `,
  active: `
    border border-black
    rounded-none
    bg-neutral-neutral-1
    shadow-[0_3px_0_0_var(--color-black)]
    -translate-y-0.5
  `,
};

/**
 * Line variant styles (connected active state)
 * - Sharp corners
 */
const lineStyles = {
  inactive: `
    bg-transparent
    hover:bg-neutral-neutral-1
  `,
  active: `
    border-b-0
    bg-white
    border-t border-l border-r border-black
    rounded-none
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
  children,
  className = '',
}: TabsProps) {
  // Uncontrolled mode uses internal state
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const [tabIds] = useState<Map<string, string>>(() => new Map());
  const [panelIds] = useState<Map<string, string>>(() => new Map());
  const [tabValues, setTabValues] = useState<string[]>([]);
  const tabsListRef = useRef<HTMLDivElement>(null);

  // Determine if controlled or uncontrolled
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internalValue;

  const setActiveTab = useCallback((newValue: string) => {
    if (isControlled) {
      onValueChange?.(newValue);
    } else {
      setInternalValue(newValue);
    }
  }, [isControlled, onValueChange]);

  const registerTab = useCallback((tabValue: string, tabId: string, panelId: string) => {
    tabIds.set(tabValue, tabId);
    panelIds.set(tabValue, panelId);
    setTabValues(prev => {
      if (!prev.includes(tabValue)) {
        return [...prev, tabValue];
      }
      return prev;
    });
  }, [tabIds, panelIds]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, variant, tabIds, panelIds, registerTab, tabsListRef, tabValues }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

/**
 * Container for tab triggers - Webflow-style tab menu
 */
export function TabList({ children, className = '' }: TabListProps) {
  const { tabsListRef, activeTab, setActiveTab, tabValues } = useTabsContext();

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentIndex = tabValues.indexOf(activeTab);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (currentIndex + 1) % tabValues.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = (currentIndex - 1 + tabValues.length) % tabValues.length;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = tabValues.length - 1;
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex) {
      setActiveTab(tabValues[newIndex]);
      // Focus the new tab
      const tabsContainer = tabsListRef.current;
      if (tabsContainer) {
        const buttons = tabsContainer.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        buttons[newIndex]?.focus();
      }
    }
  }, [activeTab, setActiveTab, tabValues, tabsListRef]);

  return (
    <div
      ref={tabsListRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={`flex gap-1 px-2 py-2 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Individual tab trigger button - Webflow-style
 */
export function TabTrigger({
  value,
  children,
  iconName,
  className = '',
}: TabTriggerProps) {
  const { activeTab, setActiveTab, variant, tabIds, panelIds, registerTab } = useTabsContext();
  const isActive = activeTab === value;
  const tabId = useId();
  const panelId = useId();

  // Register this tab on mount
  useEffect(() => {
    registerTab(value, tabId, panelId);
  }, [value, tabId, panelId, registerTab]);

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
      id={tabId}
      aria-selected={isActive}
      aria-controls={panelIds.get(value)}
      tabIndex={isActive ? 0 : -1}
      onClick={() => setActiveTab(value)}
      className={classes}
    >
      <span className="flex items-center gap-2">
        {iconName && (
          <span className="opacity-70" aria-hidden="true">
            <Icon name={iconName} size={16} />
          </span>
        )}
        <span>{children}</span>
      </span>
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
  const { activeTab, variant, tabIds, panelIds, registerTab } = useTabsContext();
  const panelId = useId();
  const tabId = useId();

  // Register this panel on mount
  useEffect(() => {
    registerTab(value, tabId, panelId);
  }, [value, tabId, panelId, registerTab]);

  if (activeTab !== value) {
    return null;
  }

  // For line variant, content connects seamlessly with active tab
  const contentClasses = variant === 'line'
    ? `bg-white border-r border-black ${className}`
    : className;

  return (
    <div
      role="tabpanel"
      id={panelIds.get(value) || panelId}
      aria-labelledby={tabIds.get(value) || tabId}
      tabIndex={0}
      className={contentClasses}
    >
      {children}
    </div>
  );
}

export default Tabs;
