'use client';

import React, { createContext, use, useState, useCallback, useEffect, useRef } from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { Button } from '../Button/Button';
import { cva, type VariantProps } from 'class-variance-authority';

// ============================================================================
// Types
// ============================================================================

type TabsVariant = 'pill' | 'line';
type TabsLayout = 'default' | 'bottom-tabs' | 'sidebar' | 'dot' | 'capsule' | 'accordion';

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
  /** Settings content rendered in a collapsible panel below the trigger (accordion layout only) */
  settings?: React.ReactNode;
  /** Use PixelCode (mono) font instead of Joystix (heading) — forwarded to Button's compact prop (accordion layout only) */
  compact?: boolean;
  className?: string;
}

interface ContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  keepMounted?: boolean;
}

// ============================================================================
// Context (for meta like variant/layout — Base UI handles tab state)
// ============================================================================

interface TabsInternalContext {
  meta: TabsMeta;
  activeTab: string;
  /** Ref-based tab collection — read `.current` and pair with `tabVersion` for reactivity. */
  tabValuesRef: React.RefObject<string[]>;
  /** Incremented when a tab registers; subscribe to this for render updates. */
  tabVersion: number;
  registerTab: (value: string) => void;
  setActiveTab: (value: string) => void;
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
   relative pixel-rounded-xs flex-1 shadow-none
   focus-visible:outline-none`,
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
      { variant: 'pill', active: false, className: 'bg-transparent text-head hover:bg-inv hover:text-accent' },
      { variant: 'pill', active: true, className: 'bg-accent text-accent-inv' },
      { variant: 'line', active: false, className: 'rounded-none bg-transparent hover:bg-inv hover:text-accent' },
      { variant: 'line', active: true, className: 'rounded-none bg-page border-t border-l border-r border-line border-b-0 z-10' },
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
  const tabValuesRef = useRef<string[]>([]);
  const [tabVersion, setTabVersion] = useState(0);
  const registerTab = useCallback((value: string) => {
    const tabs = tabValuesRef.current;
    if (!tabs.includes(value)) {
      tabs.push(value);
      setTabVersion((v) => v + 1);
    }
  }, []);

  return (
    <TabsContext value={{ meta, activeTab: state.activeTab, tabValuesRef, tabVersion, registerTab, setActiveTab: actions.setActiveTab }}>
      <BaseTabs.Root
        data-rdna="tabs"
        value={state.activeTab}
        onValueChange={(value) => actions.setActiveTab(value as string)}
        orientation={meta.layout === 'sidebar' ? 'vertical' : 'horizontal'}
        className={
          meta.layout === 'sidebar' ? 'flex items-start w-full h-full pixel-rounded-t-sm-b-md'
          : meta.layout === 'accordion' ? 'h-full'
          : meta.layout === 'dot' || meta.layout === 'capsule' ? 'flex flex-col w-full h-full'
          : undefined
        }
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
// DotPill — compact clickable tab indicator
// ============================================================================

function DotPill({ className = '' }: { className?: string }): React.ReactElement {
  const { activeTab, tabValuesRef, setActiveTab } = useTabsContext();
  const tabValues = tabValuesRef.current;

  return (
    <div className={`flex flex-row items-center justify-center w-fit h-4 py-0.5 px-1 gap-1 bg-main pixel-rounded-sm ${className}`}>
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
  );
}

function List({ children, header, className = '' }: ListProps): React.ReactElement {
  const { layout } = useTabsMeta();

  if (layout === 'capsule') {
    return (
      <div className={`shrink-0 flex items-center justify-center p-2 ${className}`}>
        <BaseTabs.List
          activateOnFocus
          className="flex flex-row items-center w-fit h-8 py-1 px-1 gap-1 pixel-rounded-xs bg-card"
        >
          {children}
        </BaseTabs.List>
      </div>
    );
  }

  if (layout === 'dot') {
    return (
      <div className={`shrink-0 flex items-center justify-center p-2 ${className}`}>
        {/* Hidden triggers for tab registration */}
        <BaseTabs.List className="hidden">
          {children}
        </BaseTabs.List>
        <DotPill />
      </div>
    );
  }

  if (layout === 'sidebar') {
    return (
      <div className={`shrink-0 flex flex-col h-full w-fit bg-card border-r border-line ${className}`}>
        {header}
        <DotPill />
        <BaseTabs.List activateOnFocus className={`flex flex-col gap-0 p-1${header ? ' mt-auto' : ''}`}>
          {children}
        </BaseTabs.List>
      </div>
    );
  }

  if (layout === 'accordion') {
    return (
      <div className={`shrink-0 flex flex-col space-y-0.5 ${className}`} data-tabs-accordion="">
        {children}
      </div>
    );
  }

  const shrinkClass = layout === 'bottom-tabs' ? 'shrink-0' : '';

  return (
    <BaseTabs.List
      activateOnFocus
      className={`flex items-center justify-between gap-4 px-2 py-2 bg-page border-t border-line ${shrinkClass} ${className}`}
    >
      <div className="flex flex-wrap gap-2 items-center w-full">
        {children}
      </div>
    </BaseTabs.List>
  );
}

function Trigger({ value, children, icon, settings, compact, className = '' }: TriggerProps): React.ReactElement | null {
  const { variant, layout } = useTabsMeta();
  const { registerTab, activeTab, setActiveTab: setActive } = useTabsContext();

  // Register this trigger's value for the DotPill
  useEffect(() => {
    registerTab(value);
  }, [value, registerTab]);

  // Accordion layout: ghost button trigger + collapsible settings panel.
  // When active, the wrapper gets ghost-selected styling to visually
  // encompass both the title and the expanded settings as one pressed unit.
  if (layout === 'accordion') {
    const isActive = activeTab === value;
    return (
      <div>
        <div className="flex items-center">
          <Button
            mode={compact ? 'pattern' : 'flat'}
            size="md"
            fullWidth
            compact={compact}
            quiet={compact}
            textOnly={compact}
            icon={compact ? undefined : icon}
            onClick={() => setActive(value)}
          >
            {children}
          </Button>
          {settings && (
            <button
              type="button"
              onClick={() => setActive(isActive ? '' : value)}
              className={`shrink-0 px-2 cursor-pointer transition-transform duration-200 ease-out ${isActive ? 'rotate-180' : ''}`}
              aria-label={isActive ? 'Collapse settings' : 'Expand settings'}
            >
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-current opacity-40">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
        {settings && (
          <BaseCollapsible.Root open={isActive}>
            <BaseCollapsible.Panel
              className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0"
            >
              <div className="p-2 space-y-2 bg-page">
                {settings}
              </div>
            </BaseCollapsible.Panel>
          </BaseCollapsible.Root>
        )}
      </div>
    );
  }

  return (
    <BaseTabs.Tab
      value={value}
      render={(props) => {
        const isActive = props['aria-selected'] === true || props['aria-selected'] === 'true';

        if (layout === 'capsule') {
          return (
            <button
              {...props}
              type="button"
              className={`flex items-center justify-center cursor-pointer select-none border-none pixel-rounded-xs transition-all duration-300 ease-out focus-visible:outline-none ${
                isActive
                  ? 'gap-1.5 px-2.5 py-1 bg-accent text-accent-inv'
                  : 'p-1 bg-transparent text-mute hover:bg-inv hover:text-accent'
              } ${className}`}
            >
              {icon && <span className="shrink-0 flex items-center justify-center size-4">{icon}</span>}
              {isActive && (
                <span className="font-heading text-xs uppercase tracking-tight leading-none whitespace-nowrap">
                  {children}
                </span>
              )}
            </button>
          );
        }

        if (layout === 'sidebar') {
          return (
            <button
              {...props}
              type="button"
              className={`flex items-center gap-2 w-full px-3 py-2 text-left font-heading text-xs uppercase tracking-tight leading-none pixel-rounded-sm cursor-pointer select-none transition-colors focus-visible:outline-none ${
                isActive
                  ? 'bg-page text-head'
                  : 'bg-transparent text-main hover:bg-inv hover:text-accent'
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
                <span className="flex-1 h-px bg-line opacity-30" />
                {icon}
              </>
            )}
          </button>
        );
      }}
    />
  );
}

function Content({ value, children, className = '', keepMounted }: ContentProps): React.ReactElement | null {
  const { variant, layout } = useTabsMeta();

  const contentClasses =
    layout === 'sidebar'
      ? `@container flex-1 min-w-0 h-full overflow-auto bg-card ${className}`
      : layout === 'dot' || layout === 'capsule'
        ? `@container flex-1 min-w-0 h-full overflow-auto ${className}`
        : variant === 'line'
          ? `bg-page border-r border-line ${className}`
          : className;

  return (
    <BaseTabs.Panel
      value={value}
      className={contentClasses}
      keepMounted={keepMounted}
    >
      {children}
    </BaseTabs.Panel>
  );
}

function Indicator({ className = '' }: { className?: string }): React.ReactElement {
  return <BaseTabs.Indicator className={className} />;
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
  Indicator,
  DotPill,
  useTabsState,
};

export default Tabs;
