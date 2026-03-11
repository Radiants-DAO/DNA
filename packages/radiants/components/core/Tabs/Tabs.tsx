'use client';

import React, { createContext, use, useState, useCallback, useEffect, useRef } from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { cva, type VariantProps } from 'class-variance-authority';

// ============================================================================
// Types
// ============================================================================

type TabsVariant = 'pill' | 'line';
type TabsLayout = 'default' | 'bottom-tabs' | 'sidebar';

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
  /** Optional content above the tab triggers (sidebar layout only) */
  header?: React.ReactNode;
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
// Context (for meta like variant/layout — Base UI handles tab state)
// ============================================================================

interface TabsInternalContext {
  meta: TabsMeta;
  activeTab: string;
  tabValues: string[];
  setTabValues: (values: string[]) => void;
}

const TabsContext = createContext<TabsInternalContext | null>(null);

function useTabsContext(): TabsInternalContext {
  const context = use(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs.Provider');
  }
  return context;
}

function useTabsMeta(): TabsMeta {
  return useTabsContext().meta;
}

// ============================================================================
// CVA Variants
// ============================================================================

export const tabTriggerVariants = cva(
  `flex items-center px-4 py-2
   font-heading text-xs uppercase tracking-tight leading-none cursor-pointer select-none
   relative border rounded-sm flex-1 shadow-none
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-1`,
  {
    variants: {
      variant: {
        pill: '',
        line: '',
      },
      active: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'pill', active: false, className: 'border-transparent bg-transparent text-content-heading hover:border-edge-primary hover:bg-surface-primary hover:-translate-y-0.5 hover:shadow-resting' },
      { variant: 'pill', active: true, className: 'border-edge-primary bg-action-primary text-action-secondary -translate-y-0.5 shadow-resting' },
      { variant: 'line', active: false, className: 'bg-transparent hover:bg-hover-overlay' },
      { variant: 'line', active: true, className: 'border-b-0 bg-surface-primary border-t border-l border-r border-edge-primary rounded-t-md z-10' },
    ],
    defaultVariants: {
      variant: 'pill',
      active: false,
    },
  }
);

// ============================================================================
// Sub-components
// ============================================================================

function Provider({ state, actions, meta, children }: ProviderProps): React.ReactElement {
  const [tabValues, setTabValues] = useState<string[]>([]);

  return (
    <TabsContext value={{ meta, activeTab: state.activeTab, tabValues, setTabValues }}>
      <BaseTabs.Root
        value={state.activeTab}
        onValueChange={(value) => actions.setActiveTab(value as string)}
        className={meta.layout === 'sidebar' ? 'flex items-start w-full h-full' : undefined}
      >
        {children}
      </BaseTabs.Root>
    </TabsContext>
  );
}

function Frame({ children, className = '' }: FrameProps): React.ReactElement {
  return <div className={className}>{children}</div>;
}

// ============================================================================
// DotPill — compact active-tab indicator for sidebar layout
// ============================================================================

function DotPill(): React.ReactElement {
  const { activeTab, tabValues } = useTabsContext();

  return (
    <div className="flex flex-row items-center justify-center w-fit h-4 py-0.5 px-1 gap-1 border border-edge-muted rounded-xs">
      {tabValues.map((val) => {
        const isActive = activeTab === val;
        return (
          <div
            key={val}
            className={`rounded-xs flex-shrink-0 transition-all duration-300 ease-out ${
              isActive
                ? 'w-8 h-2 bg-action-primary'
                : 'size-2 bg-content-muted'
            }`}
          />
        );
      })}
    </div>
  );
}

function List({ children, header, className = '' }: ListProps): React.ReactElement {
  const { layout } = useTabsMeta();

  if (layout === 'sidebar') {
    return (
      <div className={`shrink-0 flex flex-col h-full w-fit bg-surface-elevated border border-edge-primary rounded-l-sm ${className}`}>
        {header}
        <DotPill />
        <BaseTabs.List activateOnFocus className={`flex flex-col gap-0 p-1${header ? ' mt-auto' : ''}`}>
          {children}
        </BaseTabs.List>
      </div>
    );
  }

  const shrinkClass = layout === 'bottom-tabs' ? 'shrink-0' : '';

  return (
    <BaseTabs.List
      activateOnFocus
      className={`flex items-center justify-between gap-4 px-2 py-2 bg-surface-primary border-t border-edge-primary ${shrinkClass} ${className}`}
    >
      <div className="flex flex-wrap gap-2 items-center w-full">
        {children}
      </div>
    </BaseTabs.List>
  );
}

function Trigger({ value, children, icon, className = '' }: TriggerProps): React.ReactElement | null {
  const { variant, layout } = useTabsMeta();

  return (
    <BaseTabs.Tab
      value={value}
      render={(props) => {
        const isActive = props['aria-selected'] === true || props['aria-selected'] === 'true';

        if (layout === 'sidebar') {
          return (
            <button
              {...props}
              type="button"
              className={`flex items-center gap-2 w-full px-3 py-2 text-left font-heading text-xs uppercase tracking-tight leading-none rounded-sm cursor-pointer select-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus ${
                isActive
                  ? 'bg-surface-primary text-content-heading'
                  : 'bg-transparent text-content-primary hover:bg-hover-overlay'
              } ${className}`}
            >
              {icon && <span className="shrink-0">{icon}</span>}
              {children}
            </button>
          );
        }

        const classes = tabTriggerVariants({
          variant,
          active: isActive,
          className: `${icon ? 'gap-3' : 'gap-2 justify-center'} ${className}`.trim(),
        });

        return (
          <button
            {...props}
            type="button"
            className={classes}
            data-variant={variant}
          >
            {children}
            {icon && (
              <>
                <span className="flex-1 h-px bg-edge-primary opacity-30" />
                {icon}
              </>
            )}
          </button>
        );
      }}
    />
  );
}

function Content({ value, children, className = '' }: ContentProps): React.ReactElement | null {
  const { variant, layout } = useTabsMeta();

  const contentClasses =
    layout === 'sidebar'
      ? `@container flex-1 min-w-0 h-full overflow-auto bg-surface-elevated border border-edge-primary border-l-0 rounded-r-sm ${className}`
      : variant === 'line'
        ? `bg-surface-primary border-r border-edge-primary ${className}`
        : className;

  return (
    <BaseTabs.Panel
      value={value}
      className={contentClasses}
    >
      {children}
    </BaseTabs.Panel>
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
