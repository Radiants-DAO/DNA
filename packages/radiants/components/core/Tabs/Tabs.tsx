'use client';

import React, { createContext, use, useState, useCallback } from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { cva, type VariantProps } from 'class-variance-authority';

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
// Context (for meta like variant/layout — Base UI handles tab state)
// ============================================================================

const TabsMetaContext = createContext<TabsMeta | null>(null);

function useTabsMeta(): TabsMeta {
  const context = use(TabsMetaContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs.Provider');
  }
  return context;
}

// ============================================================================
// CVA Variants
// ============================================================================

export const tabTriggerVariants = cva(
  `flex items-center px-4 py-2
   font-heading text-sm uppercase cursor-pointer select-none
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
  return (
    <TabsMetaContext value={meta}>
      <BaseTabs.Root
        value={state.activeTab}
        onValueChange={(value) => actions.setActiveTab(value as string)}
      >
        {children}
      </BaseTabs.Root>
    </TabsMetaContext>
  );
}

function Frame({ children, className = '' }: FrameProps): React.ReactElement {
  return <div className={className}>{children}</div>;
}

function List({ children, className = '' }: ListProps): React.ReactElement {
  const { layout } = useTabsMeta();
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
  const { variant } = useTabsMeta();

  return (
    <BaseTabs.Tab
      value={value}
      render={(props) => {
        const isActive = props['aria-selected'] === true || props['aria-selected'] === 'true';
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
  const { variant } = useTabsMeta();

  const contentClasses = variant === 'line'
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
