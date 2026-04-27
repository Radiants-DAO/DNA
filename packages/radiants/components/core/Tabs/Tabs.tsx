'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { cva } from 'class-variance-authority';
import { createCompoundContext } from '../../shared/createCompoundContext';
import { corner, px } from '@rdna/pixel';
import { useCornerShape } from '../useCornerShape';
import { useConcaveCorner } from '../useConcaveCorner';
import { SegmentGroup } from '../_shared/SegmentGroup';
import { Pattern } from '../Pattern/Pattern';

// ============================================================================
// Types
// ============================================================================

export type TabsMode = 'capsule' | 'chrome';
export type TabsPosition = 'top' | 'bottom' | 'left';
type TabsTone = 'neutral' | 'accent';
type TabsSize = 'sm' | 'md' | 'lg';
type TabsAlign = 'left' | 'center' | 'right';

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
  /** Horizontal alignment of the tab list (chrome mode) */
  align?: TabsAlign;
  /** Color tone */
  tone?: TabsTone;
  /** Trigger size preset */
  size?: TabsSize;
  /** Show dot indicator alongside tab list */
  indicator?: 'none' | 'dot';
  /** Render inactive tab labels alongside icons. Default is false (icon-only when inactive). */
  showInactiveLabels?: boolean;
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
  align: TabsAlign;
  tone: TabsTone;
  size: TabsSize;
  indicator: 'none' | 'dot';
  showInactiveLabels: boolean;
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
      // top/bottom share the same flex stack; child order decides visual order.
      top: 'flex flex-col w-full h-full',
      bottom: 'flex flex-col w-full h-full',
      left: 'flex flex-row items-start w-full h-full',
    },
  },
  defaultVariants: { position: 'top' },
});

// Applies only to the non-capsule, non-chrome paths (position-scoped list
// styling). Capsule mode uses SegmentGroup; chrome mode hand-builds its
// alignment string. The dead `mode.chrome` branch has been removed.
export const tabsListVariants = cva('flex shrink-0', {
  variants: {
    position: {
      top: 'flex-row items-center gap-2 px-2 py-2',
      bottom: 'flex-row items-center gap-2 px-2 py-2 border-t border-line',
      left: 'flex-col gap-0 p-1 h-full border-r border-line bg-card',
    },
  },
  defaultVariants: { position: 'top' },
});

export const tabsTriggerVariants = cva(
  `flex items-center cursor-pointer select-none
   font-heading text-xs uppercase tracking-tight leading-none
   relative shadow-none border-none
   transition-[border-color,background-color,color,transform,opacity] duration-[var(--duration-moderate)] ease-out
   focus-visible:outline-none`,
  {
    variants: {
      mode: {
        // Capsule triggers own their own pixel-rounded shape; chrome
        // triggers delegate shape to the px()-masked wrapper.
        capsule: 'p-1 justify-center pixel-rounded-4',
        chrome: 'h-7 px-2 gap-1.5 justify-center bg-transparent',
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

// ============================================================================
// DotPill — compact dot indicator (reusable)
// ============================================================================

function DotPill({ className = '' }: { className?: string }) {
  const { activeTab, tabValuesRef, tabVersion: _tabVersion, setActiveTab } = useTabsContext();
  const tabValues = tabValuesRef.current;

  return (
    <div
      className={`pixel-rounded-6 bg-main w-fit flex items-center justify-center h-4 py-0.5 px-1 gap-1 ${className}`.trim()}
    >
      {tabValues.map((val) => {
        const isActive = activeTab === val;
        return (
          <button
            key={val}
            type="button"
            aria-label={`Go to ${val}`}
            onClick={() => setActiveTab(val)}
            className={`flex-shrink-0 cursor-pointer transition-all duration-[var(--duration-slow)] ease-out border-none p-0 ${
              isActive
                ? 'w-8 h-2 bg-page'
                : 'size-2 bg-accent hover:bg-accent-soft'
            }`}
          />
        );
      })}
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
  align = 'right',
  tone = 'neutral',
  size = 'md',
  indicator = 'none',
  showInactiveLabels = false,
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
    mode, position, align, tone, size, indicator, showInactiveLabels,
    activeTab,
    setActiveTab,
    tabValuesRef,
    tabVersion,
    registerTab,
    unregisterTab,
  }), [mode, position, align, tone, size, indicator, showInactiveLabels, activeTab, setActiveTab, tabVersion, registerTab, unregisterTab]);

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

const CHROME_ALIGN_CLASS: Record<TabsAlign, string> = {
  left: 'absolute bottom-0 left-2',
  center: 'absolute bottom-0 left-1/2 -translate-x-1/2',
  right: 'absolute bottom-0 right-2',
};

function List({ children, className = '' }: TabsListProps) {
  const { mode, position, indicator, align } = useTabsContext();

  // Capsule (detached): segmented-bar style via SegmentGroup. The
  // shared primitive supplies layout + radius + surface; the outer
  // centering `shrink-0 self-center` collapses the old wrapper div.
  if (mode === 'capsule') {
    return (
      <SegmentGroup
        surface="card"
        corner="xs"
        density="comfortable"
        className={`shrink-0 self-center my-2 ${className}`.trim()}
        render={({ className: segClassName }) => (
          <BaseTabs.List
            activateOnFocus
            data-slot="tab-list"
            className={segClassName}
          >
            {children}
          </BaseTabs.List>
        )}
      />
    );
  }

  // Chrome (attached): positioned absolutely in parent (e.g. AppWindow title bar)
  if (mode === 'chrome') {
    return (
      <BaseTabs.List
        activateOnFocus
        data-slot="tab-list"
        className={`flex ${CHROME_ALIGN_CLASS[align]} gap-1 items-end ${className}`}
      >
        {children}
      </BaseTabs.List>
    );
  }

  const listClasses = tabsListVariants({ position, className });

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
  const { mode, size, showInactiveLabels, registerTab, unregisterTab } = useTabsContext();
  const cornerShape = useCornerShape();
  const chromeLeftShoulder = useConcaveCorner({ corner: 'br', radiusPx: 6 });
  const chromeRightShoulder = useConcaveCorner({ corner: 'bl', radiusPx: 6 });

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
        // class for the pattern-overlay hover selector. `bg-transparent`
        // is now part of tabsTriggerVariants.mode.chrome base.
        const chromeBackground = mode === 'chrome'
          ? isActive
            ? 'bg-card'
            : 'bg-accent group-hover/pixel:bg-cream transition-colors duration-[var(--duration-moderate)] ease-out'
          : undefined;
        const chromeButtonClasses = mode === 'chrome'
          ? isActive
            ? 'text-main z-10'
            : 'text-accent-inv group'
          : '';
        const chromeWrapperClasses = mode === 'chrome' && !isActive
          ? 'group translate-y-0.5 hover:translate-y-0 transition-transform duration-[var(--duration-moderate)] ease-out'
          : undefined;

        const buttonEl = (
          <button
            {...props}
            type="button"
            data-slot="tab-trigger"
            data-mode={mode}
            data-size={size}
            data-state={isActive ? 'selected' : 'default'}
            className={`${classes} ${chromeButtonClasses}`.trim()}
          >
            {icon && (
              <span className="shrink-0 flex items-center justify-center">
                {icon}
              </span>
            )}

            {/* With icon: text expands on active only unless showInactiveLabels is set. Without icon: always visible. */}
            {(!icon || isActive || showInactiveLabels) && (
              <span className="whitespace-nowrap">{children}</span>
            )}
          </button>
        );

        if (mode === 'chrome') {
          const pxProps = px({
            corners: corner.map(corner.flat, {
              tl: corner.themed(6),
              tr: corner.themed(6),
            }),
            edges: [1, 1, 0, 1],
            themeShape: cornerShape,
          });
          return (
            <div
              data-slot="tab-chrome-shell"
              data-state={isActive ? 'selected' : 'default'}
              className={`group/pixel relative ${chromeWrapperClasses ?? ''}`.trim()}
            >
              <div
                aria-hidden
                data-slot="tab-chrome-concave-left"
                className={`${chromeLeftShoulder.className} absolute bottom-0 ${
                  chromeBackground ?? ''
                }`.trim()}
                style={{
                  ...chromeLeftShoulder.style,
                  right: 'calc(100% - 1px)',
                } as React.CSSProperties}
              />
              <div
                aria-hidden
                data-slot="tab-chrome-concave-right"
                className={`${chromeRightShoulder.className} absolute bottom-0 ${
                  chromeBackground ?? ''
                }`.trim()}
                style={{
                  ...chromeRightShoulder.style,
                  left: 'calc(100% - 1px)',
                } as React.CSSProperties}
              />
              <div
                data-slot="tab-chrome-wrapper"
                data-state={isActive ? 'selected' : 'default'}
                className={`${pxProps.className} ${chromeBackground ?? ''}`.trim()}
                style={pxProps.style as React.CSSProperties}
              >
                {buttonEl}
                {/* Chrome inactive: pattern overlay. The outer div owns the
                    absolute positioning; the inner Pattern element can then
                    safely carry `.rdna-pat` (which enforces position: relative)
                    without fighting Tailwind's `absolute` utility in the cascade. */}
                {!isActive && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-1 group-hover:-bottom-1.5 left-0 right-0 h-2 transition-all duration-[var(--duration-slow)] ease-out text-accent-inv"
                  >
                    <Pattern pat="checkerboard" color="currentColor" className="h-full w-full" />
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Capsule (and other non-chrome): pixel-rounded-4 is now on
        // the button itself (via tabsTriggerVariants.mode.capsule); no
        // pass-through wrapper div needed.
        return buttonEl;
      }}
    />
  );
}

function Content({ value, children, className = '', keepMounted }: TabsContentProps) {
  const { position } = useTabsContext();
  // Two of three branches of the former CVA were empty strings — a
  // plain conditional is simpler than CVA here.
  const positionClasses = position === 'left' ? 'flex-1 min-w-0 h-full overflow-auto' : '';
  const classes = `@container ${positionClasses} ${className}`.trim();

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
