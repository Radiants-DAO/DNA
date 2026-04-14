'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { cva } from 'class-variance-authority';
import { createCompoundContext } from '../../shared/createCompoundContext';
import { px } from '@rdna/pixel';

// ============================================================================
// Types
// ============================================================================

export type TabsMode = 'capsule' | 'chrome';
export type TabsPosition = 'top' | 'bottom' | 'left';
export type TabsTone = 'neutral' | 'accent';
export type TabsSize = 'sm' | 'md' | 'lg';

interface TabsRootProps {
  /** Active tab value (controlled) */
  value?: string;
  /** Initially active tab (uncontrolled) */
  defaultValue?: string;
  /** Callback when active tab changes */
  onValueChange?: (value: string) => void;
  /** Spatial mode — capsule (detached, free-floating) or chrome (attached, merges into content) */
  mode?: TabsMode;
  /** Where the tab list sits relative to content */
  position?: TabsPosition;
  /** Color tone */
  tone?: TabsTone;
  /** Trigger size preset */
  size?: TabsSize;
  /** Show dot indicator alongside tab list */
  indicator?: 'none' | 'dot';
  children: React.ReactNode;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  keepMounted?: boolean;
}

// ============================================================================
// Context
// ============================================================================

interface TabsInternalContext {
  mode: TabsMode;
  position: TabsPosition;
  tone: TabsTone;
  size: TabsSize;
  indicator: 'none' | 'dot';
  activeTab: string;
  setActiveTab: (value: string) => void;
  tabValuesRef: React.RefObject<string[]>;
  tabVersion: number;
  registerTab: (value: string) => void;
  unregisterTab: (value: string) => void;
}

const {
  Context: TabsContext,
  useCompoundContext: useTabsContext,
} = createCompoundContext<TabsInternalContext>('Tabs', {
  errorMessage: 'Tab components must be used within <Tabs>',
});

// ============================================================================
// CVA Variants
// ============================================================================

export const tabsRootVariants = cva('', {
  variants: {
    position: {
      top: 'flex flex-col w-full h-full',
      bottom: 'flex flex-col w-full h-full',
      left: 'flex flex-row items-start w-full h-full',
    },
  },
  defaultVariants: { position: 'top' },
});

export const tabsListVariants = cva('flex shrink-0', {
  variants: {
    position: {
      top: 'flex-row items-center gap-2 px-2 py-2',
      bottom: 'flex-row items-center gap-2 px-2 py-2 border-t border-line',
      left: 'flex-col gap-0 p-1 h-full border-r border-line bg-card',
    },
    mode: {
      capsule: 'gap-1 py-1 px-1 w-fit',
      chrome: 'absolute right-2 gap-1 items-end bg-transparent border-none p-0',
    },
  },
  defaultVariants: { position: 'top', mode: 'capsule' },
});

export const tabsTriggerVariants = cva(
  `flex items-center cursor-pointer select-none
   font-heading text-xs uppercase tracking-tight leading-none
   relative shadow-none border-none
   transition-[border-color,background-color,color,transform,gap,padding,max-width,opacity] duration-200 ease-out
   focus-visible:outline-none`,
  {
    variants: {
      mode: {
        capsule: 'p-1 justify-center',
        chrome: 'h-8 px-2 justify-center',
      },
      size: {
        sm: 'text-xs [&_svg]:size-3.5',
        md: 'text-xs [&_svg]:size-4',
        lg: 'text-sm [&_svg]:size-4',
      },
    },
    defaultVariants: { mode: 'capsule', size: 'md' },
  },
);

export const tabsContentVariants = cva('@container', {
  variants: {
    position: {
      top: '',
      bottom: '',
      left: 'flex-1 min-w-0 h-full overflow-auto',
    },
  },
  defaultVariants: { position: 'top' },
});

// ============================================================================
// DotPill — compact dot indicator (reusable)
// ============================================================================

function DotPill({ className = '' }: { className?: string }) {
  const { activeTab, tabValuesRef, tabVersion: _tabVersion, setActiveTab } = useTabsContext();
  const tabValues = tabValuesRef.current;

  return (
    <div className={`pixel-rounded-sm bg-main w-fit ${className}`.trim()}>
      <div className="flex flex-row items-center justify-center w-fit h-4 py-0.5 px-1 gap-1">
        {tabValues.map((val) => {
          const isActive = activeTab === val;
          return (
            <button
              key={val}
              type="button"
              aria-label={`Go to ${val}`}
              onClick={() => setActiveTab(val)}
              className={`flex-shrink-0 cursor-pointer transition-all duration-300 ease-out border-none p-0 ${
                isActive
                  ? 'w-8 h-2 bg-page'
                  : 'size-2 bg-accent hover:bg-accent/75'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function TabsRoot({
  value,
  defaultValue = '',
  onValueChange,
  mode = 'capsule',
  position = 'top',
  tone = 'neutral',
  size = 'md',
  indicator = 'none',
  children,
  className = '',
}: TabsRootProps) {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internal;

  const tabValuesRef = useRef<string[]>([]);
  const [tabVersion, setTabVersion] = useState(0);

  const registerTab = useCallback((value: string) => {
    const tabs = tabValuesRef.current;
    if (!tabs.includes(value)) {
      tabs.push(value);
      setTabVersion((v) => v + 1);
    }
  }, []);

  const unregisterTab = useCallback((value: string) => {
    const tabs = tabValuesRef.current;
    const idx = tabs.indexOf(value);
    if (idx !== -1) {
      tabs.splice(idx, 1);
      setTabVersion((v) => v + 1);
    }
  }, []);

  const setActiveTab = useCallback((newValue: string) => {
    if (!isControlled) setInternal(newValue);
    onValueChange?.(newValue);
  }, [isControlled, onValueChange]);

  const ctx = useMemo(() => ({
    mode, position, tone, size, indicator,
    activeTab,
    setActiveTab,
    tabValuesRef,
    tabVersion,
    registerTab,
    unregisterTab,
  }), [mode, position, tone, size, indicator, activeTab, setActiveTab, tabVersion, registerTab, unregisterTab]);

  const rootClasses = tabsRootVariants({ position, className });

  return (
    <TabsContext value={ctx}>
      <BaseTabs.Root
        data-rdna="tabs"
        data-mode={mode}
        data-position={position}
        data-size={size}
        {...(tone !== 'neutral' ? { 'data-color': tone } : {})}
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as string)}
        orientation={position === 'left' ? 'vertical' : 'horizontal'}
        className={rootClasses}
      >
        {children}
      </BaseTabs.Root>
    </TabsContext>
  );
}

function List({ children, className = '' }: TabsListProps) {
  const { mode, position, indicator } = useTabsContext();
  const listClasses = tabsListVariants({ mode, position, className });

  // Capsule (detached): wrap in a centering container
  if (mode === 'capsule') {
    return (
      <div className="shrink-0 flex items-center justify-center p-2">
        <BaseTabs.List
          activateOnFocus
          data-slot="tab-list"
          className={`pixel-rounded-xs bg-card ${listClasses}`.trim()}
        >
          {children}
        </BaseTabs.List>
      </div>
    );
  }

  // Chrome (attached): positioned absolutely in parent (e.g. AppWindow title bar)
  if (mode === 'chrome') {
    return (
      <BaseTabs.List
        activateOnFocus
        data-slot="tab-list"
        className={`flex absolute right-2 gap-1 items-end ${className}`}
      >
        {children}
      </BaseTabs.List>
    );
  }

  // Sidebar position with dot indicator
  if (position === 'left') {
    return (
      <div className="shrink-0 flex flex-col h-full w-fit bg-card border-r border-line">
        {indicator === 'dot' && <DotPill />}
        <BaseTabs.List activateOnFocus data-slot="tab-list" className={`flex flex-col gap-0 p-1 ${className}`}>
          {children}
        </BaseTabs.List>
      </div>
    );
  }

  return (
    <BaseTabs.List
      activateOnFocus
      data-slot="tab-list"
      className={listClasses}
    >
      {indicator === 'dot' && <DotPill className="mr-2" />}
      {children}
    </BaseTabs.List>
  );
}

function Trigger({ value, children, icon, className = '' }: TabsTriggerProps) {
  const { mode, size, registerTab, unregisterTab } = useTabsContext();

  // Register for DotPill reactivity
  React.useEffect(() => {
    registerTab(value);
    return () => unregisterTab(value);
  }, [value, registerTab, unregisterTab]);

  return (
    <BaseTabs.Tab
      value={value}
      render={(props, state) => {
        const isActive = state.active;
        const classes = tabsTriggerVariants({ mode, size, className });

        // Chrome mode: active sits flush with card bg; inactive is raised with a
        // pattern overlay and lifts on hover. The bg flip lives on the
        // px() masked wrapper so the fill never spills past the pixel
        // corners. The button itself stays transparent and keeps the `group`
        // class for the pattern-overlay hover selector.
        const chromeBackground = mode === 'chrome'
          ? isActive
            ? 'bg-card'
            : 'bg-accent group-hover/pixel:bg-cream transition-colors duration-200 ease-out'
          : undefined;
        const chromeButtonClasses = mode === 'chrome'
          ? isActive
            ? 'gap-1.5 bg-transparent z-10'
            : 'bg-transparent group'
          : '';
        const chromeWrapperClasses = mode === 'chrome' && !isActive
          ? 'translate-y-1 hover:translate-y-0.5 transition-transform duration-200 ease-out'
          : undefined;

        const buttonEl = (
          <button
            {...props}
            type="button"
            data-slot="tab-trigger"
            data-mode={mode}
            data-size={size}
            data-state={isActive ? 'selected' : 'default'}
            className={`${classes} ${chromeButtonClasses}`}
          >
            {icon && (
              <span className="shrink-0 flex items-center justify-center">
                {icon}
              </span>
            )}

            {/* With icon: text expands on active only. Without icon: text always visible. */}
            {(!icon || isActive) && (
              <span className="whitespace-nowrap">{children}</span>
            )}

            {/* Chrome inactive: pattern overlay */}
            {mode === 'chrome' && !isActive && (
              <span
                className="absolute bottom-0 group-hover:-bottom-0.5 left-0 right-0 h-2 transition-all duration-300 ease-out"
                style={{
                  backgroundImage: 'var(--pat-spray-grid)',
                  backgroundRepeat: 'repeat',
                }}
              />
            )}
          </button>
        );

        if (mode === 'chrome') {
          const pxProps = px(6, 6, 0, 0, { edges: [1, 1, 0, 1] });
          return (
            <div
              className={`${pxProps.className} ${chromeBackground ?? ''} ${chromeWrapperClasses ?? ''}`.trim()}
              style={pxProps.style as React.CSSProperties}
            >
              {buttonEl}
            </div>
          );
        }

        return <div className="pixel-rounded-xs">{buttonEl}</div>;
      }}
    />
  );
}

function Content({ value, children, className = '', keepMounted }: TabsContentProps) {
  const { position } = useTabsContext();
  const classes = tabsContentVariants({ position, className });

  return (
    <BaseTabs.Panel
      data-slot="tab-panel"
      value={value}
      className={classes}
      keepMounted={keepMounted}
    >
      {children}
    </BaseTabs.Panel>
  );
}

function Indicator({ className = '' }: { className?: string }) {
  return <BaseTabs.Indicator className={className} />;
}

// ============================================================================
// Backward compat: useTabsState
// ============================================================================

/** @deprecated Use <Tabs defaultValue={...} mode={...}> directly. */
export function useTabsState({
  defaultValue = '',
  value,
  onValueChange,
  mode = 'capsule',
  layout = 'bottom-tabs',
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  mode?: TabsMode;
  layout?: string;
} = {}) {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internal;

  const setActiveTab = useCallback((newValue: string) => {
    if (!isControlled) setInternal(newValue);
    onValueChange?.(newValue);
  }, [isControlled, onValueChange]);

  // Map old layout values to new position values
  const positionMap: Record<string, TabsPosition> = {
    'default': 'top',
    'bottom-tabs': 'bottom',
    'sidebar': 'left',
  };

  return {
    state: { activeTab },
    actions: { setActiveTab },
    meta: {
      mode,
      layout,
      position: positionMap[layout] ?? 'top',
    },
  };
}

// ============================================================================
// Public API
// ============================================================================

export type { TabsRootProps, TabsListProps, TabsTriggerProps, TabsContentProps };

export const Tabs = Object.assign(TabsRoot, {
  List,
  Trigger,
  Content,
  Indicator,
  DotPill,
});

export default Tabs;
