# Tabs Coherent Refactor — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Refactor Tabs from a 487-line branching mess into a clean, Button-like component with orthogonal axes, zero render branching, and CVA-driven styling.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA-tabs-refactor` (branch `feat/tabs-refactor`)

**Architecture:** Delete accordion layout (Collapsible already exists). Flatten the Provider ceremony into a standard compound root. Replace 6 layout + 2 mode if/else chains with orthogonal axes (mode/tone/size/position/indicator) driven by CVA variants and data attributes. Mode has two values: `capsule` (detached — free-floating bar) and `chrome` (attached — tabs merge into content edge). Absorb AppWindow.Nav's bespoke implementation as `mode="chrome"`. All visual styling via `data-*` attributes targeted by CSS — same pattern as Button.

**Tech Stack:** React 19, Base UI `@base-ui/react/tabs`, CVA, Tailwind v4, Vitest + Testing Library

---

## Key Context

### Current production consumers (exhaustive)

| Consumer | File | Current usage |
|----------|------|---------------|
| RadiantsStudioApp | `apps/rad-os/components/apps/RadiantsStudioApp.tsx:671` | `useTabsState({ mode: 'pill', layout: 'default' })` + Provider |
| WindowTabs | `apps/rad-os/components/Rad_os/WindowTabs.tsx:77` | `useTabsState({ mode: 'pill' })` (layout defaults to `'bottom-tabs'`) |
| Playground demo | `packages/radiants/registry/runtime-attachments.tsx:610` | `Tabs.useTabsState({ mode, layout })` + Provider |
| BrandAssetsApp | `apps/rad-os/components/apps/BrandAssetsApp.tsx:485` | Uses `AppWindow.Nav` (bespoke chrome tabs), NOT Tabs |
| Smoke test | `packages/radiants/components/core/__tests__/smoke.test.tsx:44` | `expect(useTabsState).toBeTruthy()` |
| Unit tests | `packages/radiants/components/core/Tabs/Tabs.test.tsx` | 8 tests using Provider pattern |

**Zero consumers of:** accordion, capsule, dot, sidebar layouts.

### Architecture: Before vs After

**Before (current):**
```
TabsMode = 'pill' | 'line'                          (2 visual variants)
TabsLayout = 'default' | 'bottom-tabs' | 'sidebar'  (6 structural variants
           | 'dot' | 'capsule' | 'accordion'          masquerading as layouts)

Trigger has 4 render branches (accordion/capsule/sidebar/default)
List has 5 render branches
Provider ceremony: useTabsState → destructure → spread into Provider
Accordion imports Button + Collapsible (foreign body)
AppWindow.Nav: 70-line bespoke reimplementation of capsule tabs
```

**After (target):**
```
TabsMode = 'capsule' | 'chrome'                      (2 spatial modes)
  capsule  = detached — free-floating bar, not connected to content
  chrome   = attached — tabs merge into content edge, active flows into card
TabsPosition = 'top' | 'bottom' | 'left'            (3 structural positions)
TabsTone = 'neutral' | 'accent'                      (2 color axes)
TabsSize = 'sm' | 'md' | 'lg'                        (3 size presets)

Trigger: single CVA, zero branching — both modes share icon-always/text-when-active
List: single CVA, zero branching
Root owns config directly (no Provider ceremony)
Accordion layout: deleted (Collapsible component already exists)
AppWindow.Nav: thin wrapper around Tabs mode="chrome"
```

### Axis mapping (old → new)

| Old | New | Notes |
|-----|-----|-------|
| `layout: 'default'` | `position: 'top'` | Default position |
| `layout: 'bottom-tabs'` | `position: 'bottom'` | Bottom bar |
| `layout: 'sidebar'` | `position: 'left'` | Vertical nav |
| `layout: 'capsule'` | `mode: 'capsule'` | Detached — free-floating bar |
| `layout: 'dot'` | `indicator: 'dot'` on any mode | Orthogonal concern |
| `layout: 'accordion'` | **Deleted** — use `Collapsible` component | Already exists at `components/core/Collapsible/` |
| `mode: 'pill'` | `mode: 'capsule'` | Collapsed into capsule (detached) |
| `mode: 'line'` | `mode: 'capsule'` | Collapsed into capsule (detached) |
| (AppWindow.Nav) | `mode: 'chrome'` | Attached — tabs merge into content edge |

### Files involved

**Core (modify):**
- `packages/radiants/components/core/Tabs/Tabs.tsx` — Complete rewrite
- `packages/radiants/components/core/Tabs/Tabs.meta.ts` — Update props/axes
- `packages/radiants/components/core/Tabs/Tabs.schema.json` — Regenerate after meta
- `packages/radiants/components/core/Tabs/Tabs.test.tsx` — Rewrite for new API

**Consumers (migrate):**
- `apps/rad-os/components/apps/RadiantsStudioApp.tsx` — Provider → Root
- `apps/rad-os/components/Rad_os/WindowTabs.tsx` — Provider → Root (or delete if redundant)
- `apps/rad-os/components/apps/BrandAssetsApp.tsx` — AppWindow.Nav stays (thin wrapper)
- `packages/radiants/registry/runtime-attachments.tsx` — Update demo
- `packages/radiants/components/core/__tests__/smoke.test.tsx` — Update export check
- `packages/radiants/components/core/AppWindow/AppWindow.tsx` — Nav wrapper uses Tabs mode="chrome"


### Critical constraints

1. **Tailwind v4 max-w bug**: Use explicit rem values, not T-shirt sizes
2. **Pixel corners**: No `border-*` or `overflow-hidden` on `pixel-rounded-*` elements
3. **Token chains**: Aliases point to brand primitives (1 depth max)
4. **Base UI ARIA**: `BaseTabs.Tab` sets `role="tab"`, `aria-selected`, `tabindex` — don't duplicate
5. **ESLint RDNA**: No hardcoded colors, spacing, motion. Run `pnpm lint:design-system`

---

## Phase 1: Delete accordion layout from Tabs

### Task 1: Remove accordion layout code

The accordion layout in Tabs is a foreign body — it imports `Collapsible` and `Button`, has completely different DOM structure, and isn't even tabs. The standalone `Collapsible` component already exists at `packages/radiants/components/core/Collapsible/Collapsible.tsx`.

**Files:**
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx` — remove accordion from `TabsLayout`, delete accordion branches in `Provider`, `List`, and `Trigger`, remove `Collapsible` and `Button` imports

**Step 1: Remove accordion code**

In `Tabs.tsx`:
1. Remove `import { Collapsible as BaseCollapsible }` and `import { Button }`
2. Remove `'accordion'` from the `TabsLayout` type (line 15)
3. Remove `settings` and `compact` props from `TriggerProps` (lines 53-56)
4. In `Provider` (line 160): remove the `meta.layout === 'accordion'` ternary branch
5. In `List` (lines 247-252): remove the `layout === 'accordion'` block
6. In `Trigger` (lines 283-338): remove the entire `layout === 'accordion'` block (~55 lines)

**Step 2: Verify no consumers use accordion layout**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor && grep -r "layout.*accordion" --include="*.tsx" --include="*.ts" apps/ packages/`
Expected: Zero matches in production code

**Step 3: Run tests**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor && pnpm vitest run packages/radiants/components/core/Tabs/Tabs.test.tsx`
Expected: PASS — no tests cover accordion layout

**Step 4: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor
git add packages/radiants/components/core/Tabs/Tabs.tsx
git commit -m "refactor(Tabs): remove accordion layout — use Collapsible component instead"
```

---

## Phase 2: Rewrite Tabs with orthogonal axes

### Task 2: Write new Tabs test suite (TDD foundation)

**Files:**
- Rewrite: `packages/radiants/components/core/Tabs/Tabs.test.tsx`

This test file defines the target API. Every test uses the new flattened API — no Provider, no useTabsState ceremony.

**Step 1: Write the new test suite**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Tabs } from './Tabs';
import type { TabsMode, TabsPosition } from './Tabs';

// ── Helpers ──────────────────────────────────────────────────────

function TestTabs({
  defaultValue = 'one',
  mode,
  position,
  size,
  tone,
}: {
  defaultValue?: string;
  mode?: TabsMode;
  position?: TabsPosition;
  size?: 'sm' | 'md' | 'lg';
  tone?: string;
}) {
  return (
    <Tabs defaultValue={defaultValue} mode={mode} position={position} size={size} tone={tone}>
      <Tabs.List>
        <Tabs.Trigger value="one">One</Tabs.Trigger>
        <Tabs.Trigger value="two">Two</Tabs.Trigger>
        <Tabs.Trigger value="three">Three</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="one">Content one</Tabs.Content>
      <Tabs.Content value="two">Content two</Tabs.Content>
      <Tabs.Content value="three">Content three</Tabs.Content>
    </Tabs>
  );
}

// ── Core behavior ────────────────────────────────────────────────

describe('Tabs', () => {
  it('renders tabs with correct roles and initial selection', () => {
    render(<TestTabs />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Content one')).toBeInTheDocument();
  });

  it('clicking a tab changes selection', () => {
    render(<TestTabs />);
    fireEvent.click(screen.getByText('Two'));
    expect(screen.getByText('Content two')).toBeInTheDocument();
  });

  it('arrow keys move focus between tabs', () => {
    render(<TestTabs />);
    const tabs = screen.getAllByRole('tab');
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(tabs[1]);
  });

  it('supports controlled value + onValueChange', () => {
    let current = 'one';
    const onChange = (v: string) => { current = v; };

    const { rerender } = render(
      <Tabs value="one" onValueChange={onChange}>
        <Tabs.List>
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="one">Content one</Tabs.Content>
        <Tabs.Content value="two">Content two</Tabs.Content>
      </Tabs>,
    );

    fireEvent.click(screen.getByText('Two'));
    expect(current).toBe('two');

    rerender(
      <Tabs value="two" onValueChange={onChange}>
        <Tabs.List>
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="one">Content one</Tabs.Content>
        <Tabs.Content value="two">Content two</Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByText('Content two')).toBeInTheDocument();
  });

  it('preserves panel state when keepMounted is enabled', () => {
    render(
      <Tabs defaultValue="one">
        <Tabs.List>
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="one" keepMounted>
          <input data-testid="preserved-input" />
        </Tabs.Content>
        <Tabs.Content value="two">Two</Tabs.Content>
      </Tabs>,
    );

    const input = screen.getByTestId('preserved-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByText('Two'));
    fireEvent.click(screen.getByText('One'));
    expect((screen.getByTestId('preserved-input') as HTMLInputElement).value).toBe('hello');
  });

  // ── Axis props ──────────────────────────────────────────────

  it('sets data-mode on root', () => {
    const { container } = render(<TestTabs mode="chrome" />);
    expect(container.querySelector('[data-rdna="tabs"]')).toHaveAttribute('data-mode', 'chrome');
  });

  it('defaults mode to capsule', () => {
    const { container } = render(<TestTabs />);
    expect(container.querySelector('[data-rdna="tabs"]')).toHaveAttribute('data-mode', 'capsule');
  });

  it('sets data-position on root', () => {
    const { container } = render(<TestTabs position="bottom" />);
    expect(container.querySelector('[data-rdna="tabs"]')).toHaveAttribute('data-position', 'bottom');
  });

  it('uses vertical keyboard navigation when position=left', () => {
    render(<TestTabs position="left" />);
    const tabs = screen.getAllByRole('tab');
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(tabs[1]);
  });

  it('sets data-size on triggers', () => {
    render(<TestTabs size="lg" />);
    const triggers = screen.getAllByRole('tab');
    expect(triggers[0]).toHaveAttribute('data-size', 'lg');
  });

  it('sets data-color on root when tone is provided', () => {
    const { container } = render(<TestTabs tone="accent" />);
    expect(container.querySelector('[data-rdna="tabs"]')).toHaveAttribute('data-color', 'accent');
  });

  // ── Trigger with icon ──────────────────────────────────────

  it('renders icon in trigger when provided', () => {
    render(
      <Tabs defaultValue="a">
        <Tabs.List>
          <Tabs.Trigger value="a" icon={<svg data-testid="test-icon" />}>Tab A</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">Content</Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  // ── Backward compat: useTabsState still exported ───────────

  it('exports useTabsState for backward compatibility', async () => {
    const mod = await import('./Tabs');
    expect(mod.useTabsState).toBeDefined();
    expect(typeof mod.useTabsState).toBe('function');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor && pnpm vitest run packages/radiants/components/core/Tabs/Tabs.test.tsx`
Expected: FAIL — new API doesn't exist yet (Tabs root doesn't accept `defaultValue`, etc.)

**Step 3: Commit the test file**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor
git add packages/radiants/components/core/Tabs/Tabs.test.tsx
git commit -m "test(Tabs): rewrite test suite for flattened API"
```

---

### Task 3: Rewrite Tabs implementation

**Files:**
- Rewrite: `packages/radiants/components/core/Tabs/Tabs.tsx`

This is the core rewrite. Key principles:
- Root component owns all config (no Provider ceremony)
- Context passes axes down to sub-components
- CVA handles all visual variants
- Data attributes for CSS targeting
- Zero layout branching — position is structural, mode is visual

**Step 1: Write the new implementation**

Replace `packages/radiants/components/core/Tabs/Tabs.tsx` entirely:

```tsx
'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { cva } from 'class-variance-authority';
import { createCompoundContext } from '../../shared/createCompoundContext';

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
      capsule: 'gap-1 py-1 px-1 bg-card pixel-rounded-xs w-fit',
      chrome: 'gap-0.5 items-end -mb-2 bg-transparent border-none p-0',
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
        capsule: 'pixel-rounded-xs p-1 justify-center',
        chrome: 'pixel-rounded-t-sm h-8 px-2 justify-center',
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
        <BaseTabs.List activateOnFocus data-slot="tab-list" className={listClasses}>
          {children}
        </BaseTabs.List>
      </div>
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
      render={(props) => {
        const isActive = props['aria-selected'] === true || props['aria-selected'] === 'true';
        const classes = tabsTriggerVariants({ mode, size, className });

        return (
          <button
            {...props}
            type="button"
            data-slot="tab-trigger"
            data-mode={mode}
            data-size={size}
            data-state={isActive ? 'selected' : 'default'}
            className={classes}
          >
            {icon && (
              <span className="shrink-0 flex items-center justify-center">
                {icon}
              </span>
            )}

            {/* Both modes: icon always visible, text expands on active */}
            {isActive && (
              <span className="whitespace-nowrap">{children}</span>
            )}
          </button>
        );
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
```

**Key design decisions in this implementation:**

1. **Root owns all config** — `mode`, `position`, `tone`, `size`, `indicator` are props on `<Tabs>`, not Provider ceremony
2. **Context is internal** — consumers never see it; sub-components read from it
3. **Two spatial modes** — `capsule` (detached: free-floating bar) and `chrome` (attached: merges into content edge). Both share the same interaction pattern: icon always visible, text expands on active
4. **Capsule** = centered in a padded wrapper, pixel-rounded-xs, self-contained
5. **Chrome** = pixel-rounded-t-sm, active tab bg merges with content card, inactive tabs raised
6. **Position left** gets special List wrapper for sidebar layout with optional DotPill
7. **`useTabsState` preserved** as deprecated export — maps old `layout` to new `position` for backward compat
8. **`Frame` removed** — it was dead weight (`<div>{children}</div>`)
9. **`Provider` removed** — Root component IS the provider

**Step 2: Run the new tests**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor && pnpm vitest run packages/radiants/components/core/Tabs/Tabs.test.tsx`
Expected: PASS (all tests)

**Step 3: Run existing smoke test**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor && pnpm vitest run packages/radiants/components/core/__tests__/smoke.test.tsx`
Expected: PASS — `useTabsState` still exported

**Step 4: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor
git add packages/radiants/components/core/Tabs/Tabs.tsx
git commit -m "feat(Tabs): rewrite with orthogonal axes — mode/position/tone/size"
```

---

## Phase 3: Migrate consumers

### Task 4: Migrate RadiantsStudioApp

**Files:**
- Modify: `apps/rad-os/components/apps/RadiantsStudioApp.tsx`

**Step 1: Find and update the Tabs usage**

At line 671, change from:

```tsx
const tabs = useTabsState({ defaultValue: 'creation', mode: 'pill', layout: 'default' });
```
```tsx
<Tabs.Provider state={tabs.state} actions={tabs.actions} meta={tabs.meta}>
  <Tabs.Frame>
    <Tabs.List>...</Tabs.List>
    ...content panels...
  </Tabs.Frame>
</Tabs.Provider>
```

To:

```tsx
<Tabs defaultValue="creation" position="top">
  <Tabs.List>...</Tabs.List>
  ...content panels...
</Tabs>
```

Remove the `useTabsState` import. Remove the `Tabs.Frame` wrapper. Remove `Tabs.Provider`. Keep `Tabs.List`, `Tabs.Trigger`, and `Tabs.Content` unchanged.

Also update the import line (line 4) to remove `useTabsState`:

```tsx
import { AppWindow, Button, Input, Switch, Tabs } from '@rdna/radiants/components/core';
```

**Step 2: Run the app build**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor && pnpm build --filter=rad-os`
Expected: Build succeeds

**Step 3: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor
git add apps/rad-os/components/apps/RadiantsStudioApp.tsx
git commit -m "refactor(RadiantsStudioApp): migrate to flattened Tabs API"
```

---

### Task 5: Migrate WindowTabs

**Files:**
- Modify: `apps/rad-os/components/Rad_os/WindowTabs.tsx`

**Step 1: Evaluate if WindowTabs is still needed**

Read the current WindowTabs (96 lines). It wraps Tabs with:
- Fixed height calculation: `calc(var(--app-content-max-height) - 56px)`
- `overflow-auto` on content
- Compound export pattern

If these are still needed, simplify WindowTabs to pass through to the new Tabs API. If they can be handled by the consumer, delete WindowTabs entirely.

**The wrapper is likely still needed** for the height calculation, so simplify:

```tsx
'use client';

import React from 'react';
import { Tabs } from '@rdna/radiants/components/core';

// ============================================================================
// Types
// ============================================================================

interface WindowTabsProps {
  defaultValue: string;
  children: React.ReactNode;
}

// ============================================================================
// WindowTabs — thin height wrapper around Tabs
// ============================================================================

function WindowTabsRoot({ defaultValue, children }: WindowTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} position="top">
      {children}
    </Tabs>
  );
}

function WindowTabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <div
      className="overflow-auto"
      style={{ maxHeight: 'calc(var(--app-content-max-height) - 56px)' }}
    >
      <Tabs.Content value={value}>
        {children}
      </Tabs.Content>
    </div>
  );
}

// ============================================================================
// Public API
// ============================================================================

export const WindowTabs = Object.assign(WindowTabsRoot, {
  Content: WindowTabsContent,
  List: Tabs.List,
  Trigger: Tabs.Trigger,
});
```

**Step 2: Check that all WindowTabs consumers still work**

Search for WindowTabs usage: `grep -r "WindowTabs" apps/rad-os/ --include="*.tsx"`

Update any consumers if the API changed (Content wrapper may need adjustment).

**Step 3: Run build**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor && pnpm build --filter=rad-os`
Expected: Build succeeds

**Step 4: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor
git add apps/rad-os/components/Rad_os/WindowTabs.tsx
git commit -m "refactor(WindowTabs): simplify to thin wrapper over new Tabs API"
```

---

### Task 6: Migrate playground runtime-attachments

**Files:**
- Modify: `packages/radiants/registry/runtime-attachments.tsx`

**Step 1: Update the Tabs demo**

At line 606-641, replace the Provider-ceremony demo with the new API:

```tsx
Tabs: {
  component: Tabs,
  Demo: ({ mode = 'capsule', ...rest }: Record<string, unknown>) => {
    return (
      <div className="w-full max-w-[24rem]">
        <Tabs defaultValue="design" mode={mode as any} {...rest}>
          <Tabs.List>
            <Tabs.Trigger value="design" icon={<Pencil size={14} />}>Design</Tabs.Trigger>
            <Tabs.Trigger value="code" icon={<CodeWindow size={14} />}>Code</Tabs.Trigger>
            <Tabs.Trigger value="preview" icon={<Eye size={14} />}>Preview</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="design"><p className="p-3 text-sm text-sub">Design token configuration.</p></Tabs.Content>
          <Tabs.Content value="code"><p className="p-3 text-sm text-sub">Component source code.</p></Tabs.Content>
          <Tabs.Content value="preview"><p className="p-3 text-sm text-sub">Live component preview.</p></Tabs.Content>
        </Tabs>
      </div>
    );
  },
},
```

Remove the `useTabsState` entry from the hook export list (line 62) if it was listed there.

**Step 2: Build playground**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor && pnpm build --filter=playground`
Expected: Build succeeds

**Step 3: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor
git add packages/radiants/registry/runtime-attachments.tsx
git commit -m "refactor(playground): migrate Tabs demo to flattened API"
```

---

## Phase 4: Chrome mode + AppWindow.Nav integration

### Task 7: Add chrome mode styling + tests

**Files:**
- Modify: `packages/radiants/components/core/Tabs/Tabs.test.tsx` — add chrome mode tests
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx` — verify chrome CVA classes work

**Step 1: Add chrome mode tests**

Append to the test file:

```tsx
describe('Tabs mode="chrome"', () => {
  it('sets data-mode="chrome" on root', () => {
    const { container } = render(
      <Tabs defaultValue="a" mode="chrome">
        <Tabs.List>
          <Tabs.Trigger value="a" icon={<svg data-testid="icon-a" />}>Tab A</Tabs.Trigger>
          <Tabs.Trigger value="b" icon={<svg data-testid="icon-b" />}>Tab B</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">Content A</Tabs.Content>
      </Tabs>,
    );
    expect(container.querySelector('[data-rdna="tabs"]')).toHaveAttribute('data-mode', 'chrome');
  });

  it('shows icon always, shows text only when active (like capsule)', () => {
    render(
      <Tabs defaultValue="a" mode="chrome">
        <Tabs.List>
          <Tabs.Trigger value="a" icon={<svg data-testid="icon-a" />}>Active</Tabs.Trigger>
          <Tabs.Trigger value="b" icon={<svg data-testid="icon-b" />}>Inactive</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">Content</Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByTestId('icon-a')).toBeInTheDocument();
    expect(screen.getByTestId('icon-b')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    // Inactive text should not be rendered (capsule/chrome behavior)
    expect(screen.queryByText('Inactive')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run tests**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor && pnpm vitest run packages/radiants/components/core/Tabs/Tabs.test.tsx`

Both modes share the icon-always/text-when-active pattern — the Trigger implementation handles this uniformly. The only difference is the CVA classes (capsule = `pixel-rounded-xs p-1`, chrome = `pixel-rounded-t-sm h-8 px-2`).

**Step 3: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor
git add packages/radiants/components/core/Tabs/Tabs.test.tsx packages/radiants/components/core/Tabs/Tabs.tsx
git commit -m "feat(Tabs): add chrome mode with tests"
```

---

### Task 8: Migrate AppWindow.Nav to use Tabs mode="chrome"

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx`

**Step 1: Rewrite AppWindowNav to wrap Tabs**

The current `AppWindowNav` (lines 450-517) is 70 lines of bespoke button rendering. Replace with a thin wrapper that:
1. Reads `AppWindowNavItem` children (same pattern)
2. Renders `<Tabs mode="chrome">` with the items
3. Registers the nav content with AppWindow chrome context (same as before)

```tsx
function AppWindowNav({ value, onChange, children }: AppWindowNavProps) {
  const chrome = React.useContext(AppWindowChromeCtx);

  const items: AppWindowNavItemProps[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === AppWindowNavItem) {
      items.push(child.props as AppWindowNavItemProps);
    }
  });

  const navContent = (
    <Tabs value={value} onValueChange={onChange} mode="chrome">
      <Tabs.List>
        {items.map((item) => (
          <Tabs.Trigger key={item.value} value={item.value} icon={item.icon}>
            {item.children}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs>
  );

  // Register nav content with AppWindow via context; render nothing here
  React.useEffect(() => {
    chrome?.setNav(navContent);
    return () => chrome?.setNav(null);
  });

  // Render inline if no AppWindow context (e.g., tests)
  if (!chrome) return navContent;
  return null;
}
```

**Important:** Add the Tabs import at the top of AppWindow.tsx:

```tsx
import { Tabs } from '../Tabs/Tabs';
```

Remove the `layout` prop from `AppWindowNavProps` since it's no longer needed (chrome mode is always used).

**Step 2: Verify AppWindow.Nav.Item is unchanged**

`AppWindowNavItem` is a data carrier — it stays exactly as-is.

**Step 3: Check visual parity**

The chrome (attached) mode CVA classes (`pixel-rounded-t-sm h-8 px-2`) should match the old bespoke implementation. The AppWindow title bar injects the nav content via `chrome.setNav()` — that mechanism is unchanged.

The chrome-specific decorative styling (pattern overlay on inactive, translate-y offset, bg-card on active) will need CSS rules targeting `[data-mode="chrome"] [data-slot="tab-trigger"]`. These should be added to the theme CSS (`packages/radiants/components/core/Tabs/` or `base.css`), **not** inline in the component. For now, add the essential visual classes to the CVA or as data-attribute-driven classes in the Trigger render.

Update the Trigger's chrome rendering in Tabs.tsx to include the visual treatment:

In the Trigger `render` callback, after the `classes` assignment, add chrome-specific attributes that CSS can target:

```tsx
// Chrome mode: active drops flush, inactive is raised
const chromeClasses = mode === 'chrome'
  ? isActive
    ? 'gap-1.5 bg-card z-10'
    : 'bg-accent hover:bg-cream translate-y-1 hover:translate-y-0.5'
  : '';
```

Append `chromeClasses` to the button className.

**Step 4: Run AppWindow tests**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor && pnpm vitest run packages/radiants/components/core/AppWindow/AppWindow.test.tsx`
Expected: PASS

**Step 5: Run full test suite**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor && pnpm vitest run`
Expected: All tests pass

**Step 6: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor
git add packages/radiants/components/core/AppWindow/AppWindow.tsx packages/radiants/components/core/Tabs/Tabs.tsx
git commit -m "refactor(AppWindow.Nav): replace bespoke tabs with Tabs mode=chrome"
```

---

## Phase 5: Update meta, schema, cleanup

### Task 9: Update Tabs meta + regenerate schema

**Files:**
- Rewrite: `packages/radiants/components/core/Tabs/Tabs.meta.ts`
- Regenerate: `packages/radiants/components/core/Tabs/Tabs.schema.json`

**Step 1: Rewrite meta**

```ts
import { defineComponentMeta } from '../../../meta/defineComponentMeta';

export const TabsMeta = defineComponentMeta({
  name: 'Tabs',
  description: 'Tabbed navigation — capsule (detached) or chrome (attached). Built on Base UI Tabs.',
  props: {
    value: {
      type: 'string',
      description: 'Active tab value (controlled)',
    },
    defaultValue: {
      type: 'string',
      default: '""',
      description: 'Initially active tab (uncontrolled)',
    },
    onValueChange: {
      type: '(value: string) => void',
      description: 'Callback when active tab changes',
    },
    mode: {
      type: 'enum',
      values: ['capsule', 'chrome'],
      default: 'capsule',
      description: 'Spatial mode — capsule (detached, free-floating bar) or chrome (attached, merges into content edge)',
    },
    position: {
      type: 'enum',
      values: ['top', 'bottom', 'left'],
      default: 'top',
      description: 'Where the tab list sits relative to content',
    },
    tone: {
      type: 'enum',
      values: ['neutral', 'accent'],
      default: 'neutral',
      description: 'Color tone',
    },
    size: {
      type: 'enum',
      values: ['sm', 'md', 'lg'],
      default: 'md',
      description: 'Trigger size preset',
    },
    indicator: {
      type: 'enum',
      values: ['none', 'dot'],
      default: 'none',
      description: 'Show dot pagination indicator alongside tab list',
    },
  },
  subcomponents: ['TabsList', 'TabsTrigger', 'TabsContent'],
  slots: {
    children: { description: 'Tabs.List and Tabs.Content elements' },
  },
  examples: [
    {
      title: 'Capsule tabs (default — detached)',
      code: `<Tabs defaultValue="design">
  <Tabs.List>
    <Tabs.Trigger value="design" icon={<PencilIcon />}>Design</Tabs.Trigger>
    <Tabs.Trigger value="code" icon={<CodeIcon />}>Code</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="design">Design panel</Tabs.Content>
  <Tabs.Content value="code">Code panel</Tabs.Content>
</Tabs>`,
    },
    {
      title: 'Chrome tabs (attached — merges into content)',
      code: `<Tabs defaultValue="home" mode="chrome">
  <Tabs.List>
    <Tabs.Trigger value="home" icon={<HomeIcon />}>Home</Tabs.Trigger>
    <Tabs.Trigger value="settings" icon={<GearIcon />}>Settings</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="home">Home content</Tabs.Content>
  <Tabs.Content value="settings">Settings content</Tabs.Content>
</Tabs>`,
    },
    {
      title: 'Bottom tabs with dot indicator',
      code: `<Tabs defaultValue="feed" position="bottom" indicator="dot">
  <Tabs.Content value="feed">Feed</Tabs.Content>
  <Tabs.Content value="search">Search</Tabs.Content>
  <Tabs.List>
    <Tabs.Trigger value="feed">Feed</Tabs.Trigger>
    <Tabs.Trigger value="search">Search</Tabs.Trigger>
  </Tabs.List>
</Tabs>`,
    },
  ],
  tokenBindings: {
    background: 'card',
    border: 'line',
    text: 'main',
  },
  registry: {
    category: 'navigation',
    tags: ['sections', 'switch', 'tabs'],
    renderMode: 'custom',
    states: [
      { name: 'hover', type: 'pseudo' },
      { name: 'selected', type: 'data', attribute: 'data-state' },
      { name: 'focus', type: 'pseudo' },
    ],
    exampleProps: {
      defaultValue: 'design',
    },
    replaces: [],
  },
});
```

**Step 2: Regenerate schema**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor && pnpm registry:generate`
Expected: Tabs.schema.json is regenerated with new props

**Step 3: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor
git add packages/radiants/components/core/Tabs/
git commit -m "docs(Tabs): update meta + schema for new orthogonal API"
```

---

### Task 10: Remove dead code + final cleanup

**Files:**
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx` — remove any leftover dead types/exports
- Modify: `packages/radiants/components/core/index.ts` — verify exports are clean
- Remove: any stale references to `TabsLayout`, `TabsState`, `TabsActions`, `TabsMeta` in the codebase

**Step 1: Search for stale references**

Run: `grep -r "TabsLayout\|TabsState\|TabsActions\|TabsMeta\|Tabs\.Frame\|Tabs\.Provider" --include="*.tsx" --include="*.ts" /Users/rivermassey/Desktop/dev/DNA-tabs-refactor/packages /Users/rivermassey/Desktop/dev/DNA-tabs-refactor/apps`

Any remaining references need migration or removal.

**Step 2: Run full lint**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor && pnpm lint:design-system`
Expected: No new RDNA violations

**Step 3: Run full test suite**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor && pnpm vitest run`
Expected: All tests pass

**Step 4: Run build**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor && pnpm build`
Expected: All packages and apps build successfully

**Step 5: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor
git add -A
git commit -m "chore(Tabs): remove dead types and stale references"
```

---

## Phase 6: Visual QA

### Task 11: Visual regression check

**Step 1: Start dev server**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-tabs-refactor && pnpm dev`

**Step 2: Check each consumer visually**

Open `localhost:3000` and verify:

1. **RadiantsStudioApp** — Open Studio app, verify pill tabs at top work correctly, switch between Creation/Voting/Leaderboard
2. **BrandAssetsApp** — Open Brand app, verify chrome tabs in title bar expand/collapse with icon+text, pattern overlay on inactive
3. **Any app using WindowTabs** — Verify bottom tab bar renders correctly

**Step 3: Check playground**

Open `localhost:3004` and verify the Tabs demo renders correctly with mode switching.

**Step 4: Document any visual regressions and fix**

If chrome mode styling doesn't match the old AppWindow.Nav look, add CSS targeting `[data-mode="chrome"] [data-slot="tab-trigger"]` in theme CSS.

---

## Summary: Before → After

| Metric | Before | After |
|--------|--------|-------|
| Lines (Tabs.tsx) | 487 | ~250 |
| Layout branches (List) | 5 | 1 (capsule centering wrapper) |
| Render branches (Trigger) | 4 | 0 (single CVA path) |
| Types | 6 layout + 2 mode | 2 mode (capsule/chrome) + 3 position |
| External imports | BaseTabs, Collapsible, Button | BaseTabs only |
| API ceremony | `useTabsState` → destructure → Provider | `<Tabs defaultValue>` |
| AppWindow.Nav | 70-line bespoke reimplementation | Thin wrapper around `Tabs mode="chrome"` |
| Dead sub-components | Frame (noop div) | None |
| Accordion layout | Baked into Tabs (foreign body) | Deleted — use existing `Collapsible` |
| Tasks | 12 | 11 |
