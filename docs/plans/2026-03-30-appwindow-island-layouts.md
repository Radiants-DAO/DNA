# AppWindow Island Layout System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Replace hand-rolled content layout patterns across RadOS apps with a composable island system — `AppWindow.Content` (layout container with gutters), `AppWindow.Island` (elevated `bg-card pixel-rounded-sm` card surface), and `AppWindow.Banner` (edge-to-edge content zone).

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA-taskbar-api` (branch: `feat/appwindow-taskbar-api`)

**Prerequisite:** The AppWindow Taskbar API (`docs/plans/2026-03-29-appwindow-taskbar-api.md`) is already implemented in this worktree. `AppWindow.Nav`, `AppWindow.Toolbar`, and a thin `AppWindow.Content` exist. This plan extends Content and adds Island + Banner.

**Architecture:** Content becomes a layout container with modes (`single`, `split`, `sidebar`, `bleed`). Islands are the elevated card surfaces that apps currently hand-roll with `pixel-rounded-sm bg-card` + scroll. Banner is an edge-to-edge content zone (hero images, headers) that sits above islands. Content handles gutter spacing (`px-1.5 pb-1.5`); islands handle card styling and scrolling. The compound export (`Object.assign`) is extended with the new components.

**Tech Stack:** React 19, TypeScript, Tailwind v4, Vitest, @testing-library/react, @base-ui/react ScrollArea

**Design Reference:** Paper selection showing 7 island layout patterns (Poolsuite FM, Member Perks, Select a Tier, Settings, Manifesto wireframes A/B/C). See conversation context for screenshots.

---

## Reference: Key File Locations

| File | Purpose | Lines of Interest |
|------|---------|-------------------|
| `packages/radiants/components/core/AppWindow/AppWindow.tsx` | Main component (1031 lines in worktree) | Content: 515-518, Compound export: 1020-1027, Content zone div: 953-960, Body shell: 134-172, PADDING_MAP: 118-123 |
| `packages/radiants/components/core/AppWindow/AppWindow.test.tsx` | Tests (215 lines in worktree) | compound children describe: 151-214 |
| `apps/rad-os/components/apps/BrandAssetsApp.tsx` | Migration target — hand-rolled island pattern | `px-1.5 pb-1.5` → `pixel-rounded-sm bg-card` → `overflow-y-auto @container` |
| `apps/rad-os/components/apps/ManifestoApp.tsx` | Migration target — sidebar layout | `Tabs` with `layout: 'sidebar'`, `px-2 pb-2` |
| `apps/rad-os/components/apps/AboutApp.tsx` | Migration target — uses `WindowContent` (AppWindowBody) | Only app with `contentPadding: true` |
| `apps/rad-os/components/apps/RadRadioApp.tsx` | Migration target — full-bleed | `h-full flex flex-col overflow-hidden` |
| `apps/rad-os/components/apps/RadiantsStudioApp.tsx` | Migration target — bottom tabs + island | `mx-2`, `bg-card border border-line rounded` |
| `apps/rad-os/components/apps/GoodNewsApp.tsx` | Full-bleed (pretext editorial) — migration optional |
| `apps/rad-os/lib/apps/catalog.tsx` | Window config — `contentPadding` per app | 6/7 apps already set `contentPadding: false` |

## Reference: Layout Modes

Derived from Paper designs and cross-app analysis:

| Layout | CSS | Use Case | Example |
|--------|-----|----------|---------|
| `single` (default) | `flex flex-col` | One island fills space | BrandAssetsApp, AboutApp |
| `split` | `flex gap-1.5` (row) | Two equal column islands | Manifesto side-by-side |
| `sidebar` | `flex gap-1.5` (row) | Fixed sidebar + flexible main | ManifestoApp |
| `bleed` | No gutters | Content fills chrome | RadRadioApp, GoodNewsApp |

Banner is orthogonal — sits above any layout mode, extracted by Content.

## Reference: Current Content Zone (line 953-960)

```tsx
<div
  className={`flex-1 min-h-0${hasExplicitWidth ? ' @container' : ''}${contentPadding ? ' pb-2' : ''}`}
  style={{ '--app-content-max-height': `${maxContentHeight}px` } as React.CSSProperties}
>
  <AppWindowChromeCtx.Provider value={chromeCtx}>
    {children}
  </AppWindowChromeCtx.Provider>
</div>
```

**Key insight:** Content renders INSIDE this div. It inherits `--app-content-max-height` via CSS. When apps set `contentPadding: false` (6/7 already do), the `pb-2` is removed. Content adds its own `pb-1.5` gutter. No changes needed to this zone.

---

## Task 1: Types and Interfaces

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx` (add types after line 109)

### Step 1: Add type definitions

After the existing `AppWindowContentProps` interface (line 106-109), add:

```typescript
export type ContentLayout = 'single' | 'split' | 'sidebar' | 'bleed';

export interface AppWindowIslandProps {
  children: React.ReactNode;
  /** Padding level inside the island. Default: 'lg' (p-6). */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Background class. Default: 'bg-card'. */
  bgClassName?: string;
  /** Disable scroll area — renders static content. Default: false. */
  noScroll?: boolean;
  /** Fixed width class (e.g., 'w-48'). When set, island is shrink-0 instead of flex-1. Used for sidebar panes. */
  width?: string;
  className?: string;
}

export interface AppWindowBannerProps {
  children: React.ReactNode;
  className?: string;
}
```

### Step 2: Extend ContentProps with layout

Replace the existing `AppWindowContentProps` (lines 106-109):

```typescript
export interface AppWindowContentProps {
  children: React.ReactNode;
  /** Layout mode. Default: 'single'. */
  layout?: ContentLayout;
  className?: string;
}
```

### Step 3: Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api
git add packages/radiants/components/core/AppWindow/AppWindow.tsx
git commit -m "feat(AppWindow): add Island, Banner, ContentLayout types"
```

---

## Task 2: AppWindow.Island Component

**Files:**
- Test: `packages/radiants/components/core/AppWindow/AppWindow.test.tsx`
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx`

### Step 1: Write failing tests

Add to `AppWindow.test.tsx` after the existing `compound children` describe block (after line 214), inside the outer `describe('AppWindow', ...)`:

```typescript
describe('Island', () => {
  test('renders with pixel-rounded-sm and bg-card', () => {
    render(
      <AppWindow id="test" title="Test" contentPadding={false}>
        <AppWindow.Content>
          <AppWindow.Island>Island content</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    expect(screen.getByText('Island content')).toBeInTheDocument();
    const island = screen.getByText('Island content').closest('[class*="pixel-rounded-sm"]');
    expect(island).toBeInTheDocument();
    expect(island?.className).toContain('bg-card');
  });

  test('applies padding variants', () => {
    const { container } = render(
      <AppWindow id="test" title="Test" contentPadding={false}>
        <AppWindow.Content>
          <AppWindow.Island padding="sm">Padded</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    expect(screen.getByText('Padded')).toBeInTheDocument();
    // p-2 is the 'sm' padding class
    expect(container.querySelector('.p-2')).toBeInTheDocument();
  });

  test('renders with fixed width when width prop is set', () => {
    render(
      <AppWindow id="test" title="Test" contentPadding={false}>
        <AppWindow.Content layout="sidebar">
          <AppWindow.Island width="w-48">Sidebar</AppWindow.Island>
          <AppWindow.Island>Main</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    const sidebar = screen.getByText('Sidebar').closest('[class*="pixel-rounded-sm"]');
    expect(sidebar?.className).toContain('shrink-0');
    expect(sidebar?.className).toContain('w-48');
  });

  test('renders with custom bgClassName', () => {
    render(
      <AppWindow id="test" title="Test" contentPadding={false}>
        <AppWindow.Content>
          <AppWindow.Island bgClassName="bg-page">Custom bg</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    const island = screen.getByText('Custom bg').closest('[class*="pixel-rounded-sm"]');
    expect(island?.className).toContain('bg-page');
    expect(island?.className).not.toContain('bg-card');
  });
});
```

### Step 2: Run tests to confirm they fail

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm vitest run packages/radiants/components/core/AppWindow/AppWindow.test.tsx
```
Expected: FAIL — `AppWindow.Island` doesn't exist

### Step 3: Implement AppWindow.Island

Add to `AppWindow.tsx` after the `AppWindowContent` function (after line 518):

```typescript
function AppWindowIsland({
  children,
  padding = 'lg',
  bgClassName = 'bg-card',
  noScroll = false,
  width,
  className = '',
}: AppWindowIslandProps) {
  const sizeClass = width ? `shrink-0 ${width}` : 'flex-1 min-w-0';
  const paddingClass = PADDING_MAP[padding];

  if (noScroll) {
    return (
      <div className={`${sizeClass} min-h-0 pixel-rounded-sm ${bgClassName} ${className}`.trim()}>
        <div className={`h-full ${paddingClass}`.trim()}>{children}</div>
      </div>
    );
  }

  return (
    <div className={`${sizeClass} min-h-0 pixel-rounded-sm ${bgClassName} ${className}`.trim()}>
      <ScrollArea.Root
        className="h-full"
        style={{ maxHeight: 'var(--app-content-max-height, none)' } as React.CSSProperties}
      >
        <ScrollArea.Viewport className="h-full">
          {paddingClass ? <div className={paddingClass}>{children}</div> : children}
        </ScrollArea.Viewport>
      </ScrollArea.Root>
    </div>
  );
}
AppWindowIsland.displayName = 'AppWindow.Island';
```

**Key differences from old `renderWindowBodyShell()`:**
- `pixel-rounded-sm` instead of `border border-line rounded` (RDNA aesthetic, avoids border + clip-path conflict)
- `flex-1 min-w-0` sizing (works in both row and column flex contexts)
- `width` prop for sidebar fixed-width mode (`shrink-0` + width class)
- No `bordered` prop — pixel-rounded handles the visual boundary

### Step 4: Run tests to confirm they pass

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm vitest run packages/radiants/components/core/AppWindow/AppWindow.test.tsx
```
Expected: Still failing — Island not on compound export yet (Task 5 wires it). Tests that use `AppWindow.Island` won't resolve.

**Workaround:** Import `AppWindowIsland` directly for now, or defer tests to after Task 5. Better approach — add to compound export early (see Task 5 note).

### Step 5: Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api
git add packages/radiants/components/core/AppWindow/AppWindow.tsx packages/radiants/components/core/AppWindow/AppWindow.test.tsx
git commit -m "feat(AppWindow): add Island component — pixel-rounded card surface with scroll"
```

---

## Task 3: AppWindow.Banner Component

**Files:**
- Test: `packages/radiants/components/core/AppWindow/AppWindow.test.tsx`
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx`

### Step 1: Write failing test

Add to `AppWindow.test.tsx`:

```typescript
describe('Banner', () => {
  test('renders edge-to-edge content above islands', () => {
    render(
      <AppWindow id="test" title="Test" contentPadding={false}>
        <AppWindow.Content>
          <AppWindow.Banner>Hero image</AppWindow.Banner>
          <AppWindow.Island>Below banner</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    expect(screen.getByText('Hero image')).toBeInTheDocument();
    expect(screen.getByText('Below banner')).toBeInTheDocument();
    // Banner should not have island styling
    const banner = screen.getByText('Hero image').closest('[class*="shrink-0"]');
    expect(banner).toBeInTheDocument();
    expect(banner?.className).not.toContain('pixel-rounded');
    expect(banner?.className).not.toContain('bg-card');
  });
});
```

### Step 2: Implement AppWindow.Banner

Add to `AppWindow.tsx` after `AppWindowIsland`:

```typescript
function AppWindowBanner({ children, className = '' }: AppWindowBannerProps) {
  return <div className={`shrink-0 ${className}`.trim()}>{children}</div>;
}
AppWindowBanner.displayName = 'AppWindow.Banner';
```

### Step 3: Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api
git add packages/radiants/components/core/AppWindow/AppWindow.tsx packages/radiants/components/core/AppWindow/AppWindow.test.tsx
git commit -m "feat(AppWindow): add Banner component — edge-to-edge content zone"
```

---

## Task 4: Content Layout Modes

**Files:**
- Test: `packages/radiants/components/core/AppWindow/AppWindow.test.tsx`
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx`

### Step 1: Write failing tests

Add to `AppWindow.test.tsx`:

```typescript
describe('Content layouts', () => {
  test('single layout adds gutters around island', () => {
    const { container } = render(
      <AppWindow id="test" title="Test" contentPadding={false}>
        <AppWindow.Content layout="single">
          <AppWindow.Island>Single content</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    expect(screen.getByText('Single content')).toBeInTheDocument();
    // Gutters: px-1.5 pb-1.5
    expect(container.querySelector('.px-1\\.5')).toBeInTheDocument();
    expect(container.querySelector('.pb-1\\.5')).toBeInTheDocument();
  });

  test('split layout renders two islands side by side', () => {
    const { container } = render(
      <AppWindow id="test" title="Test" contentPadding={false}>
        <AppWindow.Content layout="split">
          <AppWindow.Island>Left</AppWindow.Island>
          <AppWindow.Island>Right</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
    // Layout wrapper uses flex row with gap
    expect(container.querySelector('.gap-1\\.5')).toBeInTheDocument();
  });

  test('sidebar layout renders fixed-width + flexible islands', () => {
    render(
      <AppWindow id="test" title="Test" contentPadding={false}>
        <AppWindow.Content layout="sidebar">
          <AppWindow.Island width="w-48">Nav</AppWindow.Island>
          <AppWindow.Island>Main</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    const nav = screen.getByText('Nav').closest('[class*="pixel-rounded-sm"]');
    const main = screen.getByText('Main').closest('[class*="pixel-rounded-sm"]');
    expect(nav?.className).toContain('shrink-0');
    expect(nav?.className).toContain('w-48');
    expect(main?.className).toContain('flex-1');
  });

  test('bleed layout renders without gutters', () => {
    const { container } = render(
      <AppWindow id="test" title="Test" contentPadding={false}>
        <AppWindow.Content layout="bleed">
          <div data-testid="bleed-content">Full bleed</div>
        </AppWindow.Content>
      </AppWindow>,
    );

    expect(screen.getByTestId('bleed-content')).toBeInTheDocument();
    // No gutter classes
    const contentDiv = screen.getByTestId('bleed-content').parentElement;
    expect(contentDiv?.className).not.toContain('px-1.5');
    expect(contentDiv?.className).not.toContain('pb-1.5');
  });

  test('banner renders above islands in split layout', () => {
    render(
      <AppWindow id="test" title="Test" contentPadding={false}>
        <AppWindow.Content layout="split">
          <AppWindow.Banner>Header</AppWindow.Banner>
          <AppWindow.Island>Left</AppWindow.Island>
          <AppWindow.Island>Right</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    const header = screen.getByText('Header');
    const left = screen.getByText('Left');
    // Banner should precede islands in DOM order
    expect(header.compareDocumentPosition(left) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('default layout is single', () => {
    const { container } = render(
      <AppWindow id="test" title="Test" contentPadding={false}>
        <AppWindow.Content>
          <AppWindow.Island>Default</AppWindow.Island>
        </AppWindow.Content>
      </AppWindow>,
    );

    expect(screen.getByText('Default')).toBeInTheDocument();
    // Has gutters (single mode)
    expect(container.querySelector('.px-1\\.5')).toBeInTheDocument();
  });
});
```

### Step 2: Rewrite AppWindowContent

Replace the existing `AppWindowContent` (lines 515-518) with:

```typescript
function AppWindowContent({ children, layout = 'single', className = '' }: AppWindowContentProps) {
  if (layout === 'bleed') {
    return <div className={`h-full flex flex-col ${className}`.trim()}>{children}</div>;
  }

  // Separate Banner children from Islands/other content
  const banners: React.ReactNode[] = [];
  const rest: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === AppWindowBanner) {
      banners.push(child);
    } else {
      rest.push(child);
    }
  });

  const isRow = layout === 'split' || layout === 'sidebar';
  const layoutClass = isRow ? 'flex gap-1.5' : 'flex flex-col';

  return (
    <div className={`h-full flex flex-col px-1.5 pb-1.5 ${className}`.trim()}>
      {banners}
      <div className={`flex-1 min-h-0 ${layoutClass}`}>{rest}</div>
    </div>
  );
}
AppWindowContent.displayName = 'AppWindow.Content';
```

**Layout behavior:**
- `single` → outer `flex-col` with gutters. Inner `flex flex-col`. One Island fills via `flex-1`.
- `split` → outer `flex-col` with gutters. Inner `flex gap-1.5` (row). Two Islands share width via `flex-1`.
- `sidebar` → same CSS as split. First Island has `width` prop (e.g., `w-48`) making it `shrink-0`. Second fills via `flex-1`.
- `bleed` → `h-full flex flex-col`. No gutters, no inner wrapper. Raw children.

**Banner extraction:** `React.Children.forEach` detects `AppWindowBanner` by type. Banners render above the layout wrapper (`shrink-0`). Non-banner children go into the layout wrapper.

### Step 3: Run tests

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm vitest run packages/radiants/components/core/AppWindow/AppWindow.test.tsx
```
Expected: Still failing on `AppWindow.Island` / `AppWindow.Banner` — not on compound export yet.

### Step 4: Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api
git add packages/radiants/components/core/AppWindow/AppWindow.tsx packages/radiants/components/core/AppWindow/AppWindow.test.tsx
git commit -m "feat(AppWindow): Content layout modes — single, split, sidebar, bleed + Banner extraction"
```

---

## Task 5: Wire Compound Export + Run All Tests

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx` (compound export block, ~line 1020)

### Step 1: Add Island and Banner to compound export

Replace the existing compound export block (lines 1020-1027):

```typescript
const AppWindowCompound = Object.assign(AppWindow, {
  Nav: Object.assign(AppWindowNav, { Item: AppWindowNavItem }),
  Toolbar: AppWindowToolbar,
  Content: AppWindowContent,
  Island: AppWindowIsland,
  Banner: AppWindowBanner,
  // Legacy — deprecated, use Content + Island instead
  Body: AppWindowBody,
  SplitView: AppWindowSplitView,
  Pane: AppWindowPane,
});
```

### Step 2: Run ALL tests

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm vitest run packages/radiants/components/core/AppWindow/AppWindow.test.tsx
```
Expected: ALL PASS — Island and Banner now resolve via `AppWindow.Island` / `AppWindow.Banner`.

### Step 3: Run build

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm build
```
Expected: PASS — no type errors, no broken imports.

### Step 4: Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api
git add packages/radiants/components/core/AppWindow/AppWindow.tsx
git commit -m "feat(AppWindow): wire Island + Banner into compound export"
```

---

## Task 6: Migrate BrandAssetsApp (Single Layout)

BrandAssetsApp is the validated "correct" pattern. This migration replaces hand-rolled CSS with the new API, proving the API matches.

**Files:**
- Modify: `apps/rad-os/components/apps/BrandAssetsApp.tsx`

### Step 1: Replace hand-rolled island pattern

Find the content island structure (the three nested divs after the portal):

```tsx
{/* BEFORE — hand-rolled */}
<div className="flex-1 min-h-0 px-1.5 pb-1.5">
  <div className="pixel-rounded-sm bg-card h-full">
    <div className="h-full overflow-y-auto overflow-x-hidden @container">
      {/* tab content */}
    </div>
  </div>
</div>
```

Replace with:

```tsx
{/* AFTER — Island API */}
<AppWindow.Content>
  <AppWindow.Island>
    {/* tab content — same JSX, just unwrapped from the three divs */}
  </AppWindow.Island>
</AppWindow.Content>
```

Keep the gradient wrapper (`bg-gradient-to-b from-cream to-sun-yellow`) as a `className` on Content or on the root fragment. The gradient is a BrandAssetsApp-specific decoration, not part of the island pattern.

**Important:** BrandAssetsApp already returns `<>` fragment with `<AppWindow.Nav>`, `<AppWindow.Toolbar>`, and content. The content portion should become `<AppWindow.Content>` wrapping `<AppWindow.Island>`.

If the app currently wraps everything in a gradient div:
```tsx
<div className="h-full flex flex-col bg-gradient-to-b from-cream to-sun-yellow dark:from-page dark:to-page">
```

This becomes the className on Content:
```tsx
<AppWindow.Content className="bg-gradient-to-b from-cream to-sun-yellow dark:from-page dark:to-page">
  <AppWindow.Island>
    {/* tab panels with p-5, space-y-4, etc. */}
  </AppWindow.Island>
</AppWindow.Content>
```

### Step 2: Visual verification

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm dev
```

Open BrandAssetsApp. Verify:
- [ ] White content card with pixel corners — same as before
- [ ] All 6 tabs render correctly
- [ ] Scrolling works (long content scrolls inside the island)
- [ ] Gutters around the island (6px sides, 6px bottom)
- [ ] Gradient background visible around the island edges
- [ ] Dark mode: background switches, card stays elevated

### Step 3: Run lint

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm lint:design-system
```
Expected: No new violations.

### Step 4: Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api
git add apps/rad-os/components/apps/BrandAssetsApp.tsx
git commit -m "refactor(BrandAssets): migrate hand-rolled island to AppWindow.Content + Island"
```

---

## Task 7: Migrate AboutApp (Single Layout — Simplest)

**Files:**
- Modify: `apps/rad-os/components/apps/AboutApp.tsx`
- Modify: `apps/rad-os/lib/apps/catalog.tsx` (add `contentPadding: false`)

### Step 1: Replace WindowContent with Content + Island

AboutApp currently uses:
```tsx
<WindowContent>
  <div className="max-w-[42rem] mx-auto space-y-8">
    {/* Card sections */}
  </div>
</WindowContent>
```

Replace with:
```tsx
<AppWindow.Content>
  <AppWindow.Island>
    <div className="max-w-[42rem] mx-auto space-y-8">
      {/* Card sections — unchanged */}
    </div>
  </AppWindow.Island>
</AppWindow.Content>
```

### Step 2: Update catalog entry

In `catalog.tsx`, add `contentPadding: false` to the AboutApp entry (it's currently missing, which defaults to `true`). This removes the `pb-2` from the content zone div since Content now handles its own gutters.

### Step 3: Clean up imports

Remove `WindowContent` import. Add `AppWindow` import if not already present (BrandAssetsApp import pattern).

### Step 4: Visual verification

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm dev
```

Verify:
- [ ] White content card with pixel corners
- [ ] Centered content (`max-w-[42rem] mx-auto`)
- [ ] Card sections with spacing
- [ ] Scrolls when content exceeds window height

### Step 5: Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api
git add apps/rad-os/components/apps/AboutApp.tsx apps/rad-os/lib/apps/catalog.tsx
git commit -m "refactor(About): migrate WindowContent to AppWindow.Content + Island"
```

---

## Task 8: Migrate ManifestoApp (Sidebar Layout)

**Files:**
- Modify: `apps/rad-os/components/apps/ManifestoApp.tsx`

### Step 1: Understand current structure

ManifestoApp currently uses `Tabs.Provider` with `layout: 'sidebar'`:
```tsx
<div className="h-full flex flex-col px-2 pb-2">
  <Tabs.Provider state={...} actions={...} meta={...}>
    {/* Tabs.List (sidebar) + Tabs.Content (main area) */}
  </Tabs.Provider>
</div>
```

### Step 2: Replace with Content sidebar layout

```tsx
<AppWindow.Content layout="sidebar">
  <AppWindow.Island width="w-48" padding="none" noScroll>
    <Tabs.List className="...">
      {/* tab triggers */}
    </Tabs.List>
  </AppWindow.Island>
  <AppWindow.Island>
    {/* Tabs.Content panels */}
  </AppWindow.Island>
</AppWindow.Content>
```

**Notes:**
- Sidebar island: `width="w-48"` (matches ManifestoApp's existing sidebar), `padding="none"` (tab list has its own padding), `noScroll` (short list, doesn't scroll)
- Main island: default props (scroll, lg padding)
- The `Tabs.Provider` wraps everything outside Content (or inside — depends on whether Tabs context needs to span both islands)
- If Tabs.Provider needs to wrap both islands, put it outside Content:

```tsx
<Tabs.Provider state={tabs.state} actions={tabs.actions} meta={tabs.meta}>
  <AppWindow.Content layout="sidebar">
    <AppWindow.Island width="w-48" padding="none" noScroll>
      <Tabs.List>{/* triggers */}</Tabs.List>
    </AppWindow.Island>
    <AppWindow.Island>
      {sections.map((section) => (
        <Tabs.Content key={section.value} value={section.value}>
          <div className="max-w-[42rem] mx-auto p-4">
            <h2>{section.title}</h2>
            <div className="...">{section.content}</div>
          </div>
        </Tabs.Content>
      ))}
    </AppWindow.Island>
  </AppWindow.Content>
</Tabs.Provider>
```

### Step 3: Visual verification

Verify:
- [ ] Sidebar on left with tab triggers
- [ ] Main content on right with scrollable text
- [ ] Gap between sidebar and main islands
- [ ] Both islands have pixel corners
- [ ] Tab switching works

### Step 4: Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api
git add apps/rad-os/components/apps/ManifestoApp.tsx
git commit -m "refactor(Manifesto): migrate to AppWindow.Content sidebar layout + Islands"
```

---

## Task 9: Migrate RadiantsStudioApp (Single Layout + Bottom Tabs)

**Files:**
- Modify: `apps/rad-os/components/apps/RadiantsStudioApp.tsx`

### Step 1: Replace hand-rolled content wrapper

RadiantsStudioApp currently uses:
```tsx
<div className="h-full flex flex-col bg-page pixel-rounded-sm">
  <Tabs.Frame className="h-full flex flex-col">
    {/* Tabs.Content with mx-2, overflow-auto, bg-card border border-line rounded */}
    {/* Tabs.List at bottom */}
  </Tabs.Frame>
</div>
```

Replace the content panels with:
```tsx
<AppWindow.Content>
  <AppWindow.Island>
    {/* Tab content panels (Tabs.Content wrappers) */}
  </AppWindow.Island>
</AppWindow.Content>
```

**Note:** Bottom tab list (`<Tabs.List className="mt-auto">`) needs to render outside the island — it's chrome, not content. If using the compound API, the tab list could become `AppWindow.Nav` (if bottom nav is supported) or remain as a custom element below Content.

For v1: wrap the entire tab frame in Content with the island containing the active panel. The tab list sits below the island (not inside it). This may require adjusting how the Tabs.Frame structures children.

### Step 2: Visual verification

Verify:
- [ ] Content card with pixel corners
- [ ] Bottom tab bar visible and functional
- [ ] Tab switching works
- [ ] Content scrolls within the island
- [ ] No double borders (pixel-rounded replaces `border border-line rounded`)

### Step 3: Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api
git add apps/rad-os/components/apps/RadiantsStudioApp.tsx
git commit -m "refactor(RadiantsStudio): migrate to AppWindow.Content + Island"
```

---

## Task 10: Migrate RadRadioApp (Bleed Layout)

**Files:**
- Modify: `apps/rad-os/components/apps/RadRadioApp.tsx`

### Step 1: Wrap in bleed Content

RadRadioApp currently renders bare children:
```tsx
<div className="h-full flex flex-col overflow-hidden">
  {/* video player, track info, controls */}
</div>
```

Wrap in Content with bleed layout:
```tsx
<AppWindow.Content layout="bleed">
  <div className="h-full flex flex-col overflow-hidden">
    {/* video player, track info, controls — unchanged */}
  </div>
</AppWindow.Content>
```

This is a minimal migration — just wrapping in the semantic container. No visual changes.

### Step 2: Visual verification

Verify:
- [ ] Video player fills window (no white background)
- [ ] Controls at bottom
- [ ] No gutters or island styling appeared

### Step 3: Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api
git add apps/rad-os/components/apps/RadRadioApp.tsx
git commit -m "refactor(RadRadio): wrap in AppWindow.Content bleed layout"
```

---

## Task 11: Deprecate Old API

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx`

### Step 1: Add @deprecated JSDoc

Add deprecation notices to the old components:

```typescript
/**
 * @deprecated Use `<AppWindow.Content><AppWindow.Island>` instead.
 * This component will be removed in a future version.
 */
function AppWindowBody(...)

/**
 * @deprecated Use `<AppWindow.Content layout="split">` with two `<AppWindow.Island>` children instead.
 */
function AppWindowSplitView(...)

/**
 * @deprecated Use `<AppWindow.Island>` inside `<AppWindow.Content layout="split">` instead.
 */
function AppWindowPane(...)
```

### Step 2: Keep exports for backward compatibility

The named exports (`AppWindowBody`, `AppWindowSplitView`, `AppWindowPane`) remain on the compound object and as named re-exports. Existing code continues to work.

### Step 3: Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api
git add packages/radiants/components/core/AppWindow/AppWindow.tsx
git commit -m "chore(AppWindow): deprecate Body, SplitView, Pane in favor of Content + Island"
```

---

## Task 12: Update Meta + Final Verification

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.meta.ts`

### Step 1: Update meta registry

Add `Island`, `Banner`, and updated `Content` to the subcomponents list. Add a new example showing the island layout pattern:

```typescript
// Add to examples array:
{
  title: 'Content island with sidebar layout',
  description: 'Two-pane layout with fixed-width sidebar and flexible main area.',
  code: `
<AppWindow id="docs" title="Documentation">
  <AppWindow.Content layout="sidebar">
    <AppWindow.Island width="w-48" padding="sm" noScroll>
      <nav>Sidebar nav</nav>
    </AppWindow.Island>
    <AppWindow.Island>
      <article>Main content</article>
    </AppWindow.Island>
  </AppWindow.Content>
</AppWindow>`,
}
```

### Step 2: Run full test suite

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm vitest run
```
Expected: All PASS.

### Step 3: Run full lint

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm lint
```
Expected: No errors.

### Step 4: Run build

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm build
```
Expected: PASS.

### Step 5: Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api
git add packages/radiants/components/core/AppWindow/AppWindow.meta.ts
git commit -m "docs(AppWindow): update meta with Island, Banner, Content layout examples"
```

---

## Verification Checklist

After all tasks complete, verify:

### API Surface
- [ ] `AppWindow.Content` renders with `layout` prop: single, split, sidebar, bleed
- [ ] `AppWindow.Island` renders `pixel-rounded-sm bg-card` with scroll, padding, width variants
- [ ] `AppWindow.Banner` renders `shrink-0` edge-to-edge content
- [ ] Banner extraction: banners above layout wrapper, islands inside
- [ ] Compound export: `AppWindow.Content`, `AppWindow.Island`, `AppWindow.Banner` all accessible
- [ ] Backward compat: bare children, AppWindowBody, AppWindowSplitView, AppWindowPane still work

### Migrations
- [ ] **BrandAssetsApp** — Content + Island (single), gradient on Content className
- [ ] **AboutApp** — Content + Island (single), `contentPadding: false` in catalog
- [ ] **ManifestoApp** — Content layout="sidebar" + two Islands
- [ ] **RadiantsStudioApp** — Content + Island (single) with bottom tabs
- [ ] **RadRadioApp** — Content layout="bleed"
- [ ] **GoodNewsApp** — not migrated (pretext editorial, custom rendering)

### Visual
- [ ] All migrated apps render identically to before
- [ ] Island pixel corners visible (not clipped by parent)
- [ ] Scroll works inside islands (long content)
- [ ] Sidebar gap visible between panes
- [ ] Bleed apps have no gutters or card styling

### CI
- [ ] `pnpm vitest run` — all pass
- [ ] `pnpm lint` — no errors
- [ ] `pnpm lint:design-system` — no new violations
- [ ] `pnpm build` — clean

---

## API Quick Reference

```tsx
// Single island (most common — BrandAssetsApp, AboutApp)
<AppWindow.Content>
  <AppWindow.Island>scrollable content</AppWindow.Island>
</AppWindow.Content>

// Split columns (Manifesto side-by-side, comparison views)
<AppWindow.Content layout="split">
  <AppWindow.Island>left column</AppWindow.Island>
  <AppWindow.Island>right column</AppWindow.Island>
</AppWindow.Content>

// Sidebar + main (ManifestoApp, file browsers)
<AppWindow.Content layout="sidebar">
  <AppWindow.Island width="w-48" noScroll>sidebar nav</AppWindow.Island>
  <AppWindow.Island>main content</AppWindow.Island>
</AppWindow.Content>

// Hero banner + split (tier selection, onboarding)
<AppWindow.Content layout="split">
  <AppWindow.Banner>hero image or header</AppWindow.Banner>
  <AppWindow.Island>left</AppWindow.Island>
  <AppWindow.Island>right</AppWindow.Island>
</AppWindow.Content>

// Full-bleed (RadRadioApp, media players)
<AppWindow.Content layout="bleed">
  raw content fills chrome edge-to-edge
</AppWindow.Content>

// Island props
<AppWindow.Island
  padding="lg"           // 'none' | 'sm' | 'md' | 'lg' — default: 'lg'
  bgClassName="bg-card"  // background class — default: 'bg-card'
  noScroll={false}       // disable scroll area — default: false
  width="w-48"           // fixed width (sidebar) — default: undefined (flex-1)
  className=""           // additional classes
>
```
