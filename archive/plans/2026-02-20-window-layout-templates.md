# Window Layout Templates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build 4 composable layout primitive components for RadOS window content areas, then migrate all 12 apps to use them.

**Architecture:** Small composable React components (`WindowContent`, `WindowTabs`, `WindowSidebar`, `Web3Shell`) that apps import and assemble. Each handles scroll, overflow, and chrome for its layout mode. Web3 is a composable layer that wraps any base mode. Custom apps (Seeker, RadRadio) opt out entirely.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, DNA Tabs component (`@rdna/radiants/components/core`)

**Brainstorm:** `docs/brainstorms/2026-02-20-window-layout-templates-brainstorm.md`

---

## Current State (Reference)

### Layout Patterns Found

| Pattern | Apps | Current Approach |
|---------|------|-----------------|
| **Default Scroll** | Settings, About, Links, Calendar | Hand-rolled: `mx-2 h-full overflow-auto bg-white p-6 border border-black rounded-sm max-h-[var(--app-content-max-height)]` |
| **Tabbed (AppWindowContent)** | BrandAssets, RadiantsStudio | `AppWindowContent` wrapping `Tabs.Content`, `Tabs.List` at bottom with `-mb-2` hack |
| **Tabbed (DNA Direct)** | Components | DNA Tabs directly, `flex-1 min-h-0 overflow-auto` on `Tabs.Content`, tabs at top |
| **Docs/Sidebar** | Manifesto | `w-48 shrink-0` nav + `flex-1 overflow-auto` content, `max-h-[var(--app-content-max-height)]` on root |
| **Web3** | Auctions | `flex flex-col h-full` + `Web3ActionBar` as `shrink-0` footer |
| **Web3 (no action bar)** | MurderTree | Same as Auctions pattern but no `Web3ActionBar` yet |
| **Custom** | Seeker, RadRadio | Entirely self-contained, no templates needed |

### Key Problems

1. **`--app-content-max-height` subtracts phantom 48px** — `AppWindow.getMaxContentHeight()` always subtracts `TAB_BAR_HEIGHT` (48px) even for apps without tabs
2. **5 apps hand-roll identical CSS** — Settings, About, Links, Calendar + Manifesto all copy the same scroll pattern
3. **`AppWindowContent` barely used** — only BrandAssets + RadiantsStudio, while being the "official" abstraction
4. **`-mb-2` hack** — Tabbed apps negate AppWindow's `pb-2` content padding with negative margin
5. **No consistent pattern** — New apps have to guess which approach to use

### Key Constants (from AppWindow.tsx)

```
TASKBAR_HEIGHT   = 48   // bottom taskbar
TITLE_BAR_HEIGHT = 40   // WindowTitleBar
TAB_BAR_HEIGHT   = 48   // Tabs.List (INCORRECTLY subtracted for all apps)
CHROME_PADDING   = 16   // border/margin slop
```

---

## Task 1: Create WindowContent Component

**Files:**
- Create: `components/Rad_os/WindowContent.tsx`
- Modify: `components/Rad_os/index.ts`

The base scroll container for simple "Default" windows. Replaces hand-rolled CSS in 4+ apps and `AppWindowContent` for non-tabbed use.

**Step 1: Create the component**

Create `components/Rad_os/WindowContent.tsx`:

```tsx
'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

interface WindowContentProps {
  children: React.ReactNode;
  /** Additional classes on the outer wrapper */
  className?: string;
  /** Content padding — none | sm (p-2) | md (p-4) | lg (p-6, default) */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Show border + rounded corners (default: true) */
  bordered?: boolean;
  /** Background class (default: 'bg-white') */
  bgClassName?: string;
  /** Disable scrolling (default: false) */
  noScroll?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const PADDING_MAP: Record<string, string> = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

// ============================================================================
// Component
// ============================================================================

export function WindowContent({
  children,
  className = '',
  padding = 'lg',
  bordered = true,
  bgClassName = 'bg-white',
  noScroll = false,
}: WindowContentProps) {
  return (
    <div className={`flex-1 min-h-0 mx-2 ${className}`}>
      <div
        className={[
          'h-full',
          noScroll ? '' : 'overflow-auto',
          bordered ? 'border border-black rounded' : '',
          bgClassName,
          PADDING_MAP[padding],
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ maxHeight: 'var(--app-content-max-height, none)' }}
      >
        {children}
      </div>
    </div>
  );
}
```

**Step 2: Export from barrel**

In `components/Rad_os/index.ts`, add:

```ts
export { WindowContent } from './WindowContent';
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build, no errors.

**Step 4: Commit**

```bash
git add components/Rad_os/WindowContent.tsx components/Rad_os/index.ts
git commit -m "feat: add WindowContent layout primitive"
```

---

## Task 2: Create WindowTabs Compound Component

**Files:**
- Create: `components/Rad_os/WindowTabs.tsx`
- Modify: `components/Rad_os/index.ts`

Bottom-tabbed layout wrapping DNA Tabs. Handles all boilerplate: `useTabsState`, `Tabs.Provider`, `Tabs.Frame`, flex column layout, scroll on content panels.

**Step 1: Create the component**

Create `components/Rad_os/WindowTabs.tsx`:

```tsx
'use client';

import React from 'react';
import { Tabs, useTabsState } from '@rdna/radiants/components/core';

// ============================================================================
// Types
// ============================================================================

interface WindowTabsProps {
  /** Default active tab value */
  defaultValue: string;
  children: React.ReactNode;
  /** Additional classes on the root div */
  className?: string;
}

interface WindowTabsContentProps {
  /** Tab value this content panel belongs to */
  value: string;
  children: React.ReactNode;
  /** Additional classes (appended to flex-1 min-h-0 overflow-auto) */
  className?: string;
}

interface WindowTabsListProps {
  children: React.ReactNode;
  /** Additional classes on the tab bar */
  className?: string;
}

interface WindowTabsTriggerProps {
  /** Tab value this trigger activates */
  value: string;
  children: React.ReactNode;
}

// ============================================================================
// Sub-components
// ============================================================================

function WindowTabsContent({ value, children, className = '' }: WindowTabsContentProps) {
  return (
    <Tabs.Content value={value} className={`flex-1 min-h-0 overflow-auto ${className}`}>
      {children}
    </Tabs.Content>
  );
}

function WindowTabsList({ children, className = '' }: WindowTabsListProps) {
  return (
    <Tabs.List className={className}>
      {children}
    </Tabs.List>
  );
}

function WindowTabsTrigger({ value, children }: WindowTabsTriggerProps) {
  return <Tabs.Trigger value={value}>{children}</Tabs.Trigger>;
}

// ============================================================================
// Main Component
// ============================================================================

export function WindowTabs({ defaultValue, children, className = '' }: WindowTabsProps) {
  const tabs = useTabsState({ defaultValue, variant: 'pill' });

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <Tabs.Provider state={tabs.state} actions={tabs.actions} meta={tabs.meta}>
        <Tabs.Frame className="h-full flex flex-col">
          {children}
        </Tabs.Frame>
      </Tabs.Provider>
    </div>
  );
}

// Attach sub-components
WindowTabs.Content = WindowTabsContent;
WindowTabs.List = WindowTabsList;
WindowTabs.Trigger = WindowTabsTrigger;
```

**Step 2: Export from barrel**

In `components/Rad_os/index.ts`, add:

```ts
export { WindowTabs } from './WindowTabs';
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build. (TypeScript may warn about compound component pattern — if so, add a namespace type or use `Object.assign`.)

**Step 4: Commit**

```bash
git add components/Rad_os/WindowTabs.tsx components/Rad_os/index.ts
git commit -m "feat: add WindowTabs layout primitive"
```

---

## Task 3: Create WindowSidebar Component

**Files:**
- Create: `components/Rad_os/WindowSidebar.tsx`
- Modify: `components/Rad_os/index.ts`

Fixed-width sidebar + content area. Used for docs-style layouts (Manifesto, future Radiants Docs).

**Step 1: Create the component**

Create `components/Rad_os/WindowSidebar.tsx`:

```tsx
'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

interface WindowSidebarProps {
  /** Sidebar navigation content */
  nav: React.ReactNode;
  /** Main content area */
  children: React.ReactNode;
  /** Sidebar width in pixels (default: 192 = w-48) */
  width?: number;
  /** Additional classes on the root div */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function WindowSidebar({
  nav,
  children,
  width = 192,
  className = '',
}: WindowSidebarProps) {
  return (
    <div
      className={`mx-2 h-full flex bg-white border border-black rounded max-h-[var(--app-content-max-height,none)] ${className}`}
    >
      <nav className="shrink-0 p-4 overflow-auto" style={{ width }}>
        {nav}
      </nav>
      <div className="flex-1 min-h-0 overflow-auto p-6 border-l border-black">
        {children}
      </div>
    </div>
  );
}
```

**Step 2: Export from barrel**

In `components/Rad_os/index.ts`, add:

```ts
export { WindowSidebar } from './WindowSidebar';
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build.

**Step 4: Commit**

```bash
git add components/Rad_os/WindowSidebar.tsx components/Rad_os/index.ts
git commit -m "feat: add WindowSidebar layout primitive"
```

---

## Task 4: Create Web3Shell Component

**Files:**
- Create: `components/Rad_os/Web3Shell.tsx`
- Modify: `components/Rad_os/index.ts`

Composable wrapper that adds a pinned footer bar (Web3ActionBar or custom) below any content layout. Can wrap WindowContent, WindowTabs, or any children.

**Step 1: Create the component**

Create `components/Rad_os/Web3Shell.tsx`:

```tsx
'use client';

import React from 'react';

// ============================================================================
// Types
// ============================================================================

interface Web3ShellProps {
  /** Footer bar element — typically <Web3ActionBar ... /> */
  actionBar: React.ReactNode;
  /** Main content area (WindowContent, WindowTabs, or custom) */
  children: React.ReactNode;
  /** Additional classes on the root div */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function Web3Shell({ actionBar, children, className = '' }: Web3ShellProps) {
  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
      {actionBar}
    </div>
  );
}
```

**Step 2: Export from barrel**

In `components/Rad_os/index.ts`, add:

```ts
export { Web3Shell } from './Web3Shell';
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build.

**Step 4: Commit**

```bash
git add components/Rad_os/Web3Shell.tsx components/Rad_os/index.ts
git commit -m "feat: add Web3Shell layout primitive"
```

---

## Task 5: Fix `--app-content-max-height` Calculation

**Files:**
- Modify: `components/Rad_os/AppWindow.tsx` (line ~588 area — `getMaxContentHeight` function)
- Modify: `components/Rad_os/AppWindowContent.tsx` (line ~144 area — `getMaxContentHeight` export)

The current calculation always subtracts `TAB_BAR_HEIGHT` (48px) even for apps without tabs. After migration, no app that uses `--app-content-max-height` has a tab bar (tabbed apps use flex-based height instead). Remove the phantom subtraction.

**Step 1: Fix AppWindow.tsx**

Find the `getMaxContentHeight` function (around line 50-60). It currently reads:

```ts
return maxWindow.height - TITLE_BAR_HEIGHT - TAB_BAR_HEIGHT - CHROME_PADDING;
```

Change to:

```ts
return maxWindow.height - TITLE_BAR_HEIGHT - CHROME_PADDING;
```

**Step 2: Fix AppWindowContent.tsx**

Find the matching `getMaxContentHeight` function export. Apply the same change — remove `TAB_BAR_HEIGHT` from the subtraction.

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build.

**Step 4: Visual check**

Run: `npm run dev`
Open Settings, About, Links, Calendar, Manifesto. Confirm they have ~48px more usable space and scroll still works correctly. The content area should fill more of the window.

**Step 5: Commit**

```bash
git add components/Rad_os/AppWindow.tsx components/Rad_os/AppWindowContent.tsx
git commit -m "fix: remove phantom TAB_BAR_HEIGHT from --app-content-max-height"
```

---

## Task 6: Migrate Default Scroll Apps to WindowContent

**Files:**
- Modify: `components/apps/SettingsApp.tsx`
- Modify: `components/apps/AboutApp.tsx`
- Modify: `components/apps/LinksApp.tsx`
- Modify: `components/apps/CalendarApp.tsx`

All 4 apps use the identical hand-rolled pattern:
```tsx
<div className="mx-2 h-full overflow-auto bg-white p-6 border border-black rounded-sm max-h-[var(--app-content-max-height)]">
```

Replace with `WindowContent`.

**Step 1: Migrate SettingsApp.tsx**

Add import at top:
```tsx
import { WindowContent } from '@/components/Rad_os';
```

Replace the root div (line ~23):
```tsx
// BEFORE:
<div className="mx-2 h-full overflow-auto bg-white p-6 border border-black rounded-sm max-h-[var(--app-content-max-height)]">

// AFTER:
<WindowContent>
```

Keep the closing `</div>` → change to `</WindowContent>`.

The inner wrapper (`max-w-[28rem] mx-auto space-y-6`) stays unchanged inside WindowContent.

**Step 2: Migrate AboutApp.tsx**

Same pattern. Add import, replace root div (line ~39):
```tsx
// BEFORE:
<div className="mx-2 h-full overflow-auto bg-white p-6 border border-black rounded-sm max-h-[var(--app-content-max-height)]">

// AFTER:
<WindowContent>
```

Inner wrapper (`max-w-[42rem] mx-auto space-y-8`) stays unchanged.

**Step 3: Migrate LinksApp.tsx**

Same pattern. Add import, replace root div (line ~151):
```tsx
// BEFORE:
<div className="mx-2 h-full overflow-auto bg-white p-6 border border-black rounded-sm max-h-[var(--app-content-max-height)]">

// AFTER:
<WindowContent>
```

**Step 4: Migrate CalendarApp.tsx**

Same pattern. Add import, replace root div (line ~168):
```tsx
// BEFORE:
<div className="mx-2 h-full overflow-auto bg-white p-6 border border-black rounded-sm max-h-[var(--app-content-max-height)]">

// AFTER:
<WindowContent>
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Clean build.

**Step 6: Visual check**

Run: `npm run dev`
Open Settings, About, Links, Calendar. Verify:
- Content scrolls correctly
- White background with black border and rounded corners
- `p-6` padding on content
- `mx-2` gap from window edges

**Step 7: Commit**

```bash
git add components/apps/SettingsApp.tsx components/apps/AboutApp.tsx components/apps/LinksApp.tsx components/apps/CalendarApp.tsx
git commit -m "refactor: migrate default scroll apps to WindowContent"
```

---

## Task 7: Migrate Tabbed Apps to WindowTabs

**Files:**
- Modify: `components/apps/BrandAssetsApp.tsx`
- Modify: `components/apps/RadiantsStudioApp.tsx`
- Modify: `components/apps/ComponentsApp/ComponentsApp.tsx`
- Modify: `lib/constants.tsx` (add `contentPadding: false` for these 3 apps)

### Step 1: Set `contentPadding: false` for tabbed apps

In `lib/constants.tsx`, add `contentPadding: false` to the registry entries for:
- `APP_IDS.BRAND` (BrandAssets)
- `APP_IDS.STUDIO` (RadiantsStudio)
- `APP_IDS.COMPONENTS` (Components)

This removes AppWindow's `pb-2` so the tab bar sits flush at the bottom. No more `-mb-2` hack.

### Step 2: Migrate BrandAssetsApp.tsx

Replace imports — remove `AppWindowContent` from `@/components/Rad_os`, remove `Tabs`/`useTabsState` from radiants. Add:
```tsx
import { WindowTabs } from '@/components/Rad_os';
```

Note: BrandAssetsApp uses `Tabs.useTabsState` (the namespaced form). Replace the entire tabs setup.

Replace the layout (currently lines ~470-492 area):

```tsx
// BEFORE:
<div className="h-full flex flex-col">
  <Tabs.Provider {...tabs}>
    <Tabs.Frame className="h-full flex flex-col">
      <AppWindowContent>
        <Tabs.Content value="logos" className="p-2">...</Tabs.Content>
        <Tabs.Content value="colors" className="p-4">...</Tabs.Content>
        <Tabs.Content value="fonts" className="p-2">...</Tabs.Content>
        <Tabs.Content value="ai-gen" className="p-4">...</Tabs.Content>
      </AppWindowContent>
      <Tabs.List className="mt-2 -mb-2 bg-transparent">
        <Tabs.Trigger value="logos">Logos</Tabs.Trigger>
        ...
      </Tabs.List>
    </Tabs.Frame>
  </Tabs.Provider>
</div>

// AFTER:
<WindowTabs defaultValue="logos">
  <WindowTabs.Content value="logos" className="p-2">...</WindowTabs.Content>
  <WindowTabs.Content value="colors" className="p-4">...</WindowTabs.Content>
  <WindowTabs.Content value="fonts" className="p-2">...</WindowTabs.Content>
  <WindowTabs.Content value="ai-gen" className="p-4">...</WindowTabs.Content>
  <WindowTabs.List>
    <WindowTabs.Trigger value="logos">Logos</WindowTabs.Trigger>
    <WindowTabs.Trigger value="colors">Colors</WindowTabs.Trigger>
    <WindowTabs.Trigger value="fonts">Typography</WindowTabs.Trigger>
    <WindowTabs.Trigger value="ai-gen">AI Gen</WindowTabs.Trigger>
  </WindowTabs.List>
</WindowTabs>
```

Remove the `const tabs = ...` state hook line since WindowTabs manages it internally.

### Step 3: Migrate RadiantsStudioApp.tsx

Replace imports — remove `AppWindowContent` from `@/components/Rad_os`, remove `Tabs` from radiants. Add:
```tsx
import { WindowTabs } from '@/components/Rad_os';
```

Replace the layout (lines 547-577):

```tsx
// BEFORE:
<div className="h-full flex flex-col bg-cream rounded-sm overflow-hidden">
  <Tabs.Provider {...tabs}>
  <Tabs.Frame className="h-full flex flex-col">
    <AppWindowContent>
      <Tabs.Content value="creation">...</Tabs.Content>
      <Tabs.Content value="voting">...</Tabs.Content>
      <Tabs.Content value="leaderboard">...</Tabs.Content>
    </AppWindowContent>
    <Tabs.List className="mt-2 -mb-2 bg-transparent">
      <Tabs.Trigger value="creation">Creation</Tabs.Trigger>
      ...
    </Tabs.List>
  </Tabs.Frame>
  </Tabs.Provider>
</div>

// AFTER:
<WindowTabs defaultValue="creation" className="bg-cream rounded-sm overflow-hidden">
  <WindowTabs.Content value="creation">
    <PixelArtCreation />
  </WindowTabs.Content>
  <WindowTabs.Content value="voting">
    <VotingSystem />
  </WindowTabs.Content>
  <WindowTabs.Content value="leaderboard">
    <Leaderboard />
  </WindowTabs.Content>
  <WindowTabs.List>
    <WindowTabs.Trigger value="creation">Creation</WindowTabs.Trigger>
    <WindowTabs.Trigger value="voting">Voting</WindowTabs.Trigger>
    <WindowTabs.Trigger value="leaderboard">Leaderboard</WindowTabs.Trigger>
  </WindowTabs.List>
</WindowTabs>
```

Remove the `const tabs = Tabs.useTabsState(...)` line.

### Step 4: Migrate ComponentsApp.tsx

Replace imports — remove `Tabs`/`useTabsState` from radiants. Add:
```tsx
import { WindowTabs } from '@/components/Rad_os';
```

Replace the layout (the entire return statement):

```tsx
// BEFORE:
<ToastProvider>
  <div className="h-full flex flex-col">
    <Tabs.Provider state={tabs.state} actions={tabs.actions} meta={tabs.meta}>
      <Tabs.Frame className="h-full flex flex-col">
        <Tabs.List>
          <Tabs.Trigger value="design-system">Design System</Tabs.Trigger>
          ...
        </Tabs.List>
        <Tabs.Content value="design-system" className="flex-1 min-h-0 overflow-auto">
          <DesignSystemTab />
        </Tabs.Content>
        ...
      </Tabs.Frame>
    </Tabs.Provider>
  </div>
</ToastProvider>

// AFTER:
<ToastProvider>
  <WindowTabs defaultValue="design-system">
    <WindowTabs.Content value="design-system">
      <DesignSystemTab />
    </WindowTabs.Content>
    <WindowTabs.Content value="auctions">
      <AuctionsTab />
    </WindowTabs.Content>
    <WindowTabs.Content value="window-system">
      <WindowSystemTab />
    </WindowTabs.Content>
    <WindowTabs.List>
      <WindowTabs.Trigger value="design-system">Design System</WindowTabs.Trigger>
      <WindowTabs.Trigger value="auctions">Auctions</WindowTabs.Trigger>
      <WindowTabs.Trigger value="window-system">Window System</WindowTabs.Trigger>
    </WindowTabs.List>
  </WindowTabs>
</ToastProvider>
```

Remove the `const tabs = useTabsState(...)` line. Note: tabs move from top (line variant) to bottom (pill variant). This is intentional — the brainstorm decided bottom tabs only.

### Step 5: Verify build

Run: `npm run build`
Expected: Clean build.

### Step 6: Visual check

Run: `npm run dev`
Open Brand Assets, Radiants Studio, Components. Verify:
- Tab bar is at the bottom with pill variant
- Content scrolls within each tab panel
- No extra gap between tab bar and window bottom edge
- Tab switching works

### Step 7: Commit

```bash
git add components/apps/BrandAssetsApp.tsx components/apps/RadiantsStudioApp.tsx components/apps/ComponentsApp/ComponentsApp.tsx lib/constants.tsx
git commit -m "refactor: migrate tabbed apps to WindowTabs"
```

---

## Task 8: Migrate ManifestoApp to WindowSidebar

**Files:**
- Modify: `components/apps/ManifestoApp.tsx`
- Modify: `lib/constants.tsx` (add `contentPadding: false`)

### Step 1: Set `contentPadding: false`

In `lib/constants.tsx`, add `contentPadding: false` to the `APP_IDS.MANIFESTO` entry.

### Step 2: Migrate ManifestoApp.tsx

Add import:
```tsx
import { WindowSidebar } from '@/components/Rad_os';
```

The current layout (from the component's return):
```tsx
<div className="mx-2 h-full flex bg-white max-h-[var(--app-content-max-height)]">
  <nav className="w-48 shrink-0 p-4">
    {/* sidebar buttons */}
  </nav>
  <div ref={contentRef} className="flex-1 overflow-auto p-6 border border-black rounded-sm">
    {/* sections */}
  </div>
</div>
```

Replace with:
```tsx
<WindowSidebar
  nav={
    <div className="space-y-1">
      {/* same sidebar buttons */}
    </div>
  }
>
  <div ref={contentRef}>
    {/* same sections — scroll and padding handled by WindowSidebar */}
  </div>
</WindowSidebar>
```

**Important:** The `contentRef` on the scrollable content area is used for scroll-tracking (updating active sidebar item on scroll). WindowSidebar's content div has `overflow-auto`, so the ref needs to be on the element that scrolls.

There are two options:
1. Move the `ref` to a wrapper inside WindowSidebar's content slot
2. Add a `contentRef` prop to WindowSidebar

Option 1 is simpler — wrap the content in a div with the ref. But the scroll handler is on the scrolling element itself, which is WindowSidebar's inner div. Since ManifestoApp attaches a scroll listener to `contentRef`, we need the ref on the scrolling container.

**Pragmatic approach:** For ManifestoApp specifically, keep a thin wrapper inside the children that the ref attaches to. Or, add `onScroll` as a prop to WindowSidebar. Given YAGNI, just keep ManifestoApp's scroll tracking logic working by passing a `contentRef` prop.

Update `WindowSidebar.tsx` to accept an optional `contentRef`:

```tsx
interface WindowSidebarProps {
  nav: React.ReactNode;
  children: React.ReactNode;
  width?: number;
  className?: string;
  /** Ref forwarded to the scrollable content area */
  contentRef?: React.RefObject<HTMLDivElement>;
}

// In the component:
<div ref={contentRef} className="flex-1 min-h-0 overflow-auto p-6 border-l border-black">
  {children}
</div>
```

### Step 3: Verify build

Run: `npm run build`
Expected: Clean build.

### Step 4: Visual check

Open Manifesto. Verify:
- Sidebar navigation works (clicking sections scrolls to them)
- Scroll tracking updates the active sidebar item
- Content scrolls smoothly
- White background with border between sidebar and content

### Step 5: Commit

```bash
git add components/apps/ManifestoApp.tsx components/Rad_os/WindowSidebar.tsx lib/constants.tsx
git commit -m "refactor: migrate ManifestoApp to WindowSidebar"
```

---

## Task 9: Migrate AuctionsApp to Web3Shell

**Files:**
- Modify: `components/apps/AuctionsApp/AuctionsApp.tsx`
- Modify: `lib/constants.tsx` (add `contentPadding: false`)

### Step 1: Set `contentPadding: false`

In `lib/constants.tsx`, add `contentPadding: false` to the `APP_IDS.AUCTIONS` entry.

### Step 2: Migrate AuctionsApp.tsx

Add import:
```tsx
import { Web3Shell } from '@/components/Rad_os';
```

The current layout (simplified):
```tsx
<div className="relative h-full overflow-hidden bg-warm-cloud p-2 flex flex-col">
  <div className={`${styles.wrap} flex-1 min-h-0 overflow-auto`}>
    {/* content */}
  </div>
  <Web3ActionBar ...>
    {/* action buttons */}
  </Web3ActionBar>
</div>
```

Replace with:
```tsx
<Web3Shell
  className="relative bg-warm-cloud p-2"
  actionBar={
    <Web3ActionBar ...>
      {/* action buttons */}
    </Web3ActionBar>
  }
>
  <div className={`${styles.wrap} h-full overflow-auto`}>
    {/* content — same as before */}
  </div>
</Web3Shell>
```

Note: `Web3Shell` already provides `h-full flex flex-col` and `flex-1 min-h-0 overflow-hidden` on the content wrapper, so the app just needs to style its own content div.

### Step 3: Verify build

Run: `npm run build`
Expected: Clean build.

### Step 4: Visual check

Open Auctions. Verify:
- Web3ActionBar pinned at bottom
- Content scrolls above the action bar
- Wallet connect/disconnect works
- Action buttons appear when connected

### Step 5: Commit

```bash
git add components/apps/AuctionsApp/AuctionsApp.tsx lib/constants.tsx
git commit -m "refactor: migrate AuctionsApp to Web3Shell"
```

---

## Task 10: Deprecate AppWindowContent + Update WindowSystemTab

**Files:**
- Modify: `components/Rad_os/AppWindowContent.tsx` (add deprecation comment)
- Modify: `components/apps/ComponentsApp/WindowSystemTab.tsx`

### Step 1: Add deprecation notice

At the top of `AppWindowContent.tsx`, add:

```tsx
/**
 * @deprecated Use WindowContent, WindowTabs, WindowSidebar, or Web3Shell instead.
 * This component is retained for backward compatibility but should not be used in new code.
 */
```

Verify no remaining imports of `AppWindowContent` exist (after Tasks 7-8, BrandAssets and RadiantsStudio should no longer import it):

Run: `grep -r "AppWindowContent" components/apps/`

If any remain, migrate them. The only expected remaining reference is in `WindowSystemTab.tsx` (the showcase demo) — update that next.

### Step 2: Update WindowSystemTab showcase

In `components/apps/ComponentsApp/WindowSystemTab.tsx`, update the `InventorySection` component to replace `AppWindowContent` with the new layout primitives in the component list. Add new entries:

```tsx
{ name: 'WindowContent', description: 'Scroll container for default window content with border, padding, and overflow', file: 'WindowContent.tsx' },
{ name: 'WindowTabs', description: 'Bottom-tabbed layout wrapping DNA Tabs with automatic scroll and flex management', file: 'WindowTabs.tsx' },
{ name: 'WindowSidebar', description: 'Fixed sidebar + scrolling content area for docs-style layouts', file: 'WindowSidebar.tsx' },
{ name: 'Web3Shell', description: 'Composable wrapper adding Web3ActionBar footer to any content layout', file: 'Web3Shell.tsx' },
```

Update the existing `AppWindowContent` entry to mark it deprecated:
```tsx
{ name: 'AppWindowContent', description: '(Deprecated) Use WindowContent instead', file: 'AppWindowContent.tsx' },
```

### Step 3: Remove AppWindowContent import from WindowSystemTab

If `WindowSystemTab.tsx` imports `AppWindowContent` for demo purposes, remove the import and any demo usage. The new primitives are the canonical examples.

### Step 4: Verify build

Run: `npm run build`
Expected: Clean build.

### Step 5: Commit

```bash
git add components/Rad_os/AppWindowContent.tsx components/apps/ComponentsApp/WindowSystemTab.tsx
git commit -m "refactor: deprecate AppWindowContent, update component showcase"
```

---

## Task 11: Final Verification

**Step 1: Full build**

Run: `npm run build`
Expected: Clean build, no TypeScript errors.

**Step 2: Lint check**

Run: `npm run lint`
Expected: Clean or only pre-existing warnings.

**Step 3: Grep for remaining hand-rolled patterns**

Run these searches to confirm no apps still hand-roll the old patterns:

```bash
# Old Default scroll pattern
grep -r "max-h-\[var(--app-content-max-height)" components/apps/

# Old AppWindowContent usage
grep -r "AppWindowContent" components/apps/

# Old -mb-2 hack
grep -r "\-mb-2" components/apps/
```

Expected: No matches in app files (may match in brainstorm/plan docs, that's fine).

**Step 4: Visual spot-check**

Run: `npm run dev`
Open each app and verify it renders correctly:
- Settings, About, Links, Calendar → `WindowContent` (scroll works)
- Brand Assets, Radiants Studio, Components → `WindowTabs` (bottom tabs, scroll works)
- Manifesto → `WindowSidebar` (sidebar nav + scroll tracking)
- Auctions → `Web3Shell` (action bar pinned, scroll works)
- Seeker, Rad Radio → Unchanged (custom layouts)
- Murder Tree → Unchanged for now (Web3 without Web3ActionBar)

**Step 5: Commit if any final fixes were needed**

```bash
git add -A
git commit -m "chore: final verification pass for window layout templates"
```
