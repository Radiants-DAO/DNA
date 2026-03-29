# AppWindow Taskbar API Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Add compound children (`AppWindow.Nav`, `AppWindow.Toolbar`, `AppWindow.Content`) to the AppWindow component, giving apps declarative control over chrome-level navigation and toolbar zones.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA-taskbar-api` (branch: `feat/appwindow-taskbar-api`)

**Architecture:** AppWindow detects compound children by React element type. `Nav` renders in the titlebar zone (replacing the portal hack). `Toolbar` renders between titlebar and content. `Content` wraps the content area. Bare children fall through to the content area for backward compatibility. Toolbar height is measured dynamically and subtracted from `--app-content-max-height`.

**Tech Stack:** React 19, TypeScript, Tailwind v4, Vitest, @testing-library/react

**Brainstorm:** `ideas/brainstorms/2026-03-29-appwindow-taskbar-api-brainstorm.md`

---

## Reference: Key File Locations

| File | Purpose | Lines of Interest |
|------|---------|-------------------|
| `packages/radiants/components/core/AppWindow/AppWindow.tsx` | Main component (831 lines) | Props: 32-66, Constants: 84-89, Height calc: 167-170 & 624-626, TitleBar: 172-321, Portal slot: 318, Body/Split/Pane: 323-374, Main fn: 376-828, Content div: 766-771, Mobile: 629-661, Fullscreen: 664-703 |
| `packages/radiants/components/core/AppWindow/AppWindow.test.tsx` | Tests (151 lines) | Imports: line 3 |
| `packages/radiants/components/core/Tabs/Tabs.tsx` | Tabs component | `useTabsState` hook, capsule layout rendering |
| `apps/rad-os/components/apps/BrandAssetsApp.tsx` | Migration target (680 lines) | Portal setup: 478-483, TAB_NAV: 485-492, Portal render: 500-528, Filter bar: 616-650, SubTabNav: 601-614 |
| `apps/rad-os/components/apps/typography-playground/SubTabNav.tsx` | Shared sub-tab component | Full file (~32 lines) |

## Reference: Current Height Calculation

```typescript
// Line 87-88
const TITLE_BAR_HEIGHT = 40;
const CHROME_PADDING = 16;

// Lines 624-626 (inside AppWindow function body)
const actualWindowHeight = dimensionToPx(effectiveSize?.height);
const maxContentHeight = actualWindowHeight
  ? actualWindowHeight - TITLE_BAR_HEIGHT - CHROME_PADDING
  : getMaxContentHeight(viewportBottomInset);
```

After this work, the formula becomes:
```
maxContentHeight = windowHeight - TITLE_BAR_HEIGHT - toolbarHeight - CHROME_PADDING
```

---

## Task 1: Types and Child Extraction Utility

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx` (add types and utility near top)
- Test: `packages/radiants/components/core/AppWindow/AppWindow.test.tsx`

### Step 1: Write failing test for child extraction

Add to `AppWindow.test.tsx` after the existing imports:

```typescript
import {
  AppWindow,
  AppWindowBody,
  AppWindowPane,
  AppWindowSplitView,
} from './AppWindow';

// --- Add these tests at the end of the describe block ---

describe('compound children', () => {
  test('renders Nav items in the titlebar zone', () => {
    render(
      <AppWindow id="test" title="Test">
        <AppWindow.Nav value="tab1" onChange={() => {}}>
          <AppWindow.Nav.Item value="tab1">Tab 1</AppWindow.Nav.Item>
          <AppWindow.Nav.Item value="tab2">Tab 2</AppWindow.Nav.Item>
        </AppWindow.Nav>
        <AppWindow.Content>
          <div>Content here</div>
        </AppWindow.Content>
      </AppWindow>,
    );

    expect(screen.getByRole('dialog', { name: 'Test' })).toBeInTheDocument();
    expect(screen.getByText('Content here')).toBeInTheDocument();
    // Nav items render inside titlebar area
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
  });

  test('renders Toolbar between titlebar and content', () => {
    render(
      <AppWindow id="test" title="Test">
        <AppWindow.Toolbar>
          <input placeholder="Search..." />
        </AppWindow.Toolbar>
        <AppWindow.Content>
          <div>Below toolbar</div>
        </AppWindow.Content>
      </AppWindow>,
    );

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByText('Below toolbar')).toBeInTheDocument();
    // Toolbar has the expected data attribute
    expect(document.querySelector('[data-window-toolbar]')).toBeInTheDocument();
  });

  test('bare children still render in content area (backward compat)', () => {
    render(
      <AppWindow id="test" title="Test">
        <AppWindowBody>Legacy content</AppWindowBody>
      </AppWindow>,
    );

    expect(screen.getByText('Legacy content')).toBeInTheDocument();
  });

  test('Toolbar works without Nav', () => {
    render(
      <AppWindow id="test" title="Test">
        <AppWindow.Toolbar>
          <input placeholder="Filter..." />
        </AppWindow.Toolbar>
        <AppWindow.Content>
          <div>Filtered results</div>
        </AppWindow.Content>
      </AppWindow>,
    );

    expect(screen.getByPlaceholderText('Filter...')).toBeInTheDocument();
    expect(screen.getByText('Filtered results')).toBeInTheDocument();
  });
});
```

### Step 2: Run tests to confirm they fail

Run: `cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm vitest run packages/radiants/components/core/AppWindow/AppWindow.test.tsx`
Expected: FAIL — `AppWindow.Nav` / `AppWindow.Toolbar` / `AppWindow.Content` don't exist

### Step 3: Add types and marker components

Add these interfaces and components to `AppWindow.tsx`, after the existing interfaces (after line 82, before the constants):

```typescript
// --- Compound Children Types ---

export interface AppWindowNavProps {
  value: string;
  onChange: (value: string) => void;
  layout?: 'capsule';
  children: React.ReactNode;
}

export interface AppWindowNavItemProps {
  value: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export interface AppWindowToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export interface AppWindowContentProps {
  children: React.ReactNode;
  className?: string;
}
```

Add the child extraction utility after the PADDING_MAP constant (after line 96):

```typescript
// --- Compound child detection ---

interface ExtractedChildren {
  nav: React.ReactElement<AppWindowNavProps> | null;
  toolbar: React.ReactElement<AppWindowToolbarProps> | null;
  content: React.ReactNode;
}

function extractAppWindowChildren(children: React.ReactNode): ExtractedChildren {
  let nav: React.ReactElement<AppWindowNavProps> | null = null;
  let toolbar: React.ReactElement<AppWindowToolbarProps> | null = null;
  const rest: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      rest.push(child);
      return;
    }
    if (child.type === AppWindowNav) {
      nav = child as React.ReactElement<AppWindowNavProps>;
    } else if (child.type === AppWindowToolbar) {
      toolbar = child as React.ReactElement<AppWindowToolbarProps>;
    } else if (child.type === AppWindowContent) {
      rest.push(child.props.children);
    } else {
      rest.push(child);
    }
  });

  return { nav, toolbar, content: rest.length === 1 ? rest[0] : rest };
}
```

Note: `AppWindowNav`, `AppWindowToolbar`, `AppWindowContent` are defined in later tasks — this utility references them by function identity (hoisted).

### Step 4: Commit

```bash
git add packages/radiants/components/core/AppWindow/AppWindow.tsx
git add packages/radiants/components/core/AppWindow/AppWindow.test.tsx
git commit -m "feat(AppWindow): add compound children types and extraction utility"
```

---

## Task 2: AppWindow.Nav and AppWindow.Nav.Item Components

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx`

### Step 1: Implement AppWindowNavItem

Add after the `extractAppWindowChildren` function:

```typescript
function AppWindowNavItem({ value, icon, children }: AppWindowNavItemProps) {
  // Rendered by AppWindowNav — not rendered standalone
  return null;
}
AppWindowNavItem.displayName = 'AppWindow.Nav.Item';
```

### Step 2: Implement AppWindowNav

The nav renders a capsule tab bar designed for the titlebar chrome context. This visual matches the BrandAssetsApp portal pattern (hanging tabs with active/inactive states).

```typescript
function AppWindowNav({ value, onChange, layout = 'capsule', children }: AppWindowNavProps) {
  const items: AppWindowNavItemProps[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === AppWindowNavItem) {
      items.push(child.props as AppWindowNavItemProps);
    }
  });

  return (
    <div role="tablist" className="flex items-end gap-0.5 -mb-2">
      {items.map((item) => {
        const isActive = value === item.value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-label={typeof item.children === 'string' ? item.children : undefined}
            onClick={() => onChange(item.value)}
            className={`relative flex items-center justify-center cursor-pointer select-none pixel-rounded-t-sm h-8 px-2 transition-all duration-300 ease-out focus-visible:outline-none ${
              isActive
                ? 'gap-1.5 bg-card z-10'
                : 'bg-accent hover:bg-cream group translate-y-1 hover:translate-y-0.5'
            }`}
          >
            {item.icon && (
              <span className="shrink-0 flex items-center justify-center size-4">
                {item.icon}
              </span>
            )}
            <span
              className={`font-mono text-xs uppercase tracking-tight leading-none whitespace-nowrap overflow-hidden transition-all duration-300 ease-out ${
                isActive ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'
              }`}
            >
              {item.children}
            </span>
            {!isActive && (
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
      })}
    </div>
  );
}
AppWindowNav.displayName = 'AppWindow.Nav';
```

### Step 3: Attach Item as a static property

```typescript
AppWindowNav.Item = AppWindowNavItem;
```

### Step 4: Run tests

Run: `cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm vitest run packages/radiants/components/core/AppWindow/AppWindow.test.tsx`
Expected: Still failing — Nav not wired into AppWindow rendering yet (Task 3)

### Step 5: Commit

```bash
git add packages/radiants/components/core/AppWindow/AppWindow.tsx
git commit -m "feat(AppWindow): add Nav and Nav.Item compound components"
```

---

## Task 3: AppWindow.Toolbar and AppWindow.Content Components

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx`

### Step 1: Implement AppWindowToolbar

Add after AppWindowNav:

```typescript
function AppWindowToolbar({ children, className = '' }: AppWindowToolbarProps) {
  return (
    <div
      className={`shrink-0 px-3 py-2 border-b border-ink flex items-center gap-3 ${className}`.trim()}
      data-window-toolbar=""
    >
      {children}
    </div>
  );
}
AppWindowToolbar.displayName = 'AppWindow.Toolbar';
```

The styling matches the existing hand-rolled pattern in BrandAssetsApp (line 620): `shrink-0 px-3 py-2 border-b border-ink flex items-center gap-3`.

### Step 2: Implement AppWindowContent

```typescript
function AppWindowContent({ children, className = '' }: AppWindowContentProps) {
  return <div className={className || undefined}>{children}</div>;
}
AppWindowContent.displayName = 'AppWindow.Content';
```

`AppWindowContent` is a thin marker — AppWindow extracts its children and renders them in the content zone. The component itself just passes through.

### Step 3: Commit

```bash
git add packages/radiants/components/core/AppWindow/AppWindow.tsx
git commit -m "feat(AppWindow): add Toolbar and Content compound components"
```

---

## Task 4: Wire Compound Children into AppWindow Rendering

This is the main integration task. We modify the AppWindow function and AppWindowTitleBar to use the extracted compound children.

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx`

### Step 1: Add navContent prop to AppWindowTitleBar

Modify the AppWindowTitleBar function signature (around line 172) to accept an optional `navContent` prop:

```typescript
function AppWindowTitleBar({
  id,
  title,
  icon: _icon,
  showCopyButton = true,
  showCloseButton = true,
  showFullscreenButton = true,
  showWidgetButton = false,
  showActionButton = false,
  actionButton,
  widgetActive = false,
  presentation,
  navContent,           // <-- NEW
  onClose,
  onFullscreen,
  onWidget,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  showCopyButton?: boolean;
  showCloseButton?: boolean;
  showFullscreenButton?: boolean;
  showWidgetButton?: boolean;
  showActionButton?: boolean;
  actionButton?: AppWindowActionButton;
  widgetActive?: boolean;
  presentation?: AppWindowPresentation;
  navContent?: React.ReactNode;  // <-- NEW
  onClose?: () => void;
  onFullscreen?: () => void;
  onWidget?: () => void;
}) {
```

### Step 2: Replace portal slot with navContent

Find the portal slot div (line 317-318):
```tsx
{/* Portal slot for app-injected title bar content */}
<div id={`window-titlebar-slot-${id}`} className="contents" />
```

Replace with:
```tsx
{/* Nav content from compound children, or portal slot for legacy apps */}
{navContent || <div id={`window-titlebar-slot-${id}`} className="contents" />}
```

### Step 3: Add child extraction and toolbar ref to AppWindow function

Inside the `AppWindow` function body (after the existing state/ref declarations, around line 415-420), add:

```typescript
const toolbarRef = useRef<HTMLDivElement>(null);
const [toolbarHeight, setToolbarHeight] = useState(0);
const { nav, toolbar, content } = extractAppWindowChildren(children);
```

### Step 4: Add toolbar height measurement

After the toolbarRef/toolbarHeight declarations:

```typescript
useEffect(() => {
  if (!toolbarRef.current) {
    setToolbarHeight(0);
    return;
  }
  const el = toolbarRef.current;
  const observer = new ResizeObserver(([entry]) => {
    setToolbarHeight(entry.contentRect.height + /* border */ 1);
  });
  observer.observe(el);
  return () => observer.disconnect();
}, [toolbar !== null]);
```

### Step 5: Update maxContentHeight calculation

Find the height calculation (lines 624-626):
```typescript
const maxContentHeight = actualWindowHeight
  ? actualWindowHeight - TITLE_BAR_HEIGHT - CHROME_PADDING
  : getMaxContentHeight(viewportBottomInset);
```

Replace with:
```typescript
const maxContentHeight = actualWindowHeight
  ? actualWindowHeight - TITLE_BAR_HEIGHT - toolbarHeight - CHROME_PADDING
  : getMaxContentHeight(viewportBottomInset) - toolbarHeight;
```

### Step 6: Wire into window presentation mode (lines 706-827)

Pass `navContent` to AppWindowTitleBar (around line 749):
```tsx
<AppWindowTitleBar
  id={id}
  title={title}
  icon={icon}
  showCopyButton={showCopyButton}
  showCloseButton={showCloseButton}
  showFullscreenButton={showFullscreenButton}
  showWidgetButton={showWidgetButton}
  showActionButton={showActionButton}
  actionButton={actionButton}
  widgetActive={widgetActive}
  presentation={presentation}
  navContent={nav}          // <-- NEW
  onClose={onClose}
  onFullscreen={onFullscreen}
  onWidget={onWidget}
/>
```

After the `AppWindowTitleBar`, before the content div (between lines 764 and 766), add the toolbar zone:

```tsx
{toolbar && (
  <div ref={toolbarRef}>
    {toolbar}
  </div>
)}
```

Replace `{children}` on line 770 with `{content}`:
```tsx
<div
  className={`flex-1 min-h-0${hasExplicitWidth ? ' @container' : ''}${contentPadding ? ' pb-2' : ''}`}
  style={{ '--app-content-max-height': `${maxContentHeight}px` } as React.CSSProperties}
>
  {content}
</div>
```

### Step 7: Wire into fullscreen presentation mode (lines 664-703)

Same pattern — pass `navContent={nav}` to AppWindowTitleBar (line 685), add toolbar zone after it, replace `{children}` with `{content}` on line 701:

```tsx
<AppWindowTitleBar
  {/* ...existing props... */}
  navContent={nav}
/>
{toolbar && <div ref={toolbarRef}>{toolbar}</div>}
<div className="flex-1 min-h-0 @container">{content}</div>
```

### Step 8: Wire into mobile presentation mode (lines 629-661)

Mobile has a simplified header (not AppWindowTitleBar). Nav renders below the header as a horizontal bar. Future work: at mobile container-query breakpoints, tabs may collapse into a `<select>` — but for v1 they render as a standard horizontal tab list.

```tsx
<header {/* ...existing... */}>
  {/* ...existing title + close button... */}
</header>
{nav && (
  <div className="shrink-0 px-3 py-2 border-b border-ink">
    {nav}
  </div>
)}
{toolbar && <div ref={toolbarRef}>{toolbar}</div>}
<main className="flex-1 overflow-auto @container">{content}</main>
```

> **Future consideration:** Mobile nav should collapse into a select/dropdown at narrow container widths. This is a follow-up — for now, the capsule tabs render horizontally and scroll if needed.

### Step 9: Run tests

Run: `cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm vitest run packages/radiants/components/core/AppWindow/AppWindow.test.tsx`
Expected: All tests PASS (both new compound tests and existing backward compat tests)

### Step 10: Commit

```bash
git add packages/radiants/components/core/AppWindow/AppWindow.tsx
git commit -m "feat(AppWindow): wire compound children into all presentation modes"
```

---

## Task 5: Object.assign Export Pattern

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx`

### Step 1: Replace the default export

Find the current export at the bottom of the file (line 830):
```typescript
export default AppWindow;
```

Replace with the Object.assign pattern that attaches compound sub-components:

```typescript
const AppWindowCompound = Object.assign(AppWindow, {
  Nav: Object.assign(AppWindowNav, { Item: AppWindowNavItem }),
  Toolbar: AppWindowToolbar,
  Content: AppWindowContent,
  // Preserve existing sub-components on the namespace
  Body: AppWindowBody,
  SplitView: AppWindowSplitView,
  Pane: AppWindowPane,
});

export default AppWindowCompound;
```

### Step 2: Update the named export

The named `export function AppWindow` (line 376) stays as-is for backward compat. Apps that do `import { AppWindow } from '...'` get the base function. Apps that do `import AppWindow from '...'` get the compound version with `.Nav`, `.Toolbar`, `.Content`.

However, since the test file imports `{ AppWindow }` (named), we need compound access to work from named imports too. Replace the named export approach:

Keep the function as `function AppWindow(...)` (remove the `export` keyword from the function declaration on line 376). Then at the bottom:

```typescript
// Named exports for individual sub-components (backward compat)
export { AppWindowBody, AppWindowSplitView, AppWindowPane };

// Compound export with sub-components attached
const AppWindowCompound = Object.assign(AppWindow, {
  Nav: Object.assign(AppWindowNav, { Item: AppWindowNavItem }),
  Toolbar: AppWindowToolbar,
  Content: AppWindowContent,
  Body: AppWindowBody,
  SplitView: AppWindowSplitView,
  Pane: AppWindowPane,
});

export { AppWindowCompound as AppWindow };
export default AppWindowCompound;
```

### Step 3: Update test imports

The test file (line 3) currently imports:
```typescript
import { AppWindow, AppWindowBody, AppWindowPane, AppWindowSplitView } from './AppWindow';
```

This still works because we re-export `AppWindowBody`, `AppWindowSplitView`, `AppWindowPane` as named exports, and `AppWindow` is the compound export. No test changes needed.

### Step 4: Run tests

Run: `cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm vitest run packages/radiants/components/core/AppWindow/AppWindow.test.tsx`
Expected: All PASS

### Step 5: Run build to check for type/import issues

Run: `cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm build`
Expected: PASS — no broken imports

### Step 6: Commit

```bash
git add packages/radiants/components/core/AppWindow/AppWindow.tsx
git commit -m "feat(AppWindow): compound export pattern with Nav, Toolbar, Content"
```

---

## Task 6: Update AppWindow.meta.ts

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.meta.ts`

### Step 1: Read and update the meta file

Add the new compound sub-components to the meta registry. Add entries for `Nav`, `Toolbar`, and `Content` to the slots or sub-components section of the meta definition. Include a brief description of each.

### Step 2: Commit

```bash
git add packages/radiants/components/core/AppWindow/AppWindow.meta.ts
git commit -m "docs(AppWindow): update meta with Nav, Toolbar, Content sub-components"
```

---

## Task 7: Migrate BrandAssetsApp

This is the proof-of-concept migration that validates the API.

**Files:**
- Modify: `apps/rad-os/components/apps/BrandAssetsApp.tsx`

### Step 1: Remove portal boilerplate

Delete the portal setup code (lines 478-483):
```typescript
// DELETE: Portal target for title bar nav
const [titleBarSlot, setTitleBarSlot] = useState<HTMLElement | null>(null);
useEffect(() => {
  const el = document.getElementById(`window-titlebar-slot-${windowId}`);
  setTitleBarSlot(el);
}, [windowId]);
```

Remove the `createPortal` import if no longer used.

### Step 2: Replace portal render with AppWindow.Nav

Delete the portal rendering block (lines 500-528). In its place, the parent component that renders `<AppWindow>` around BrandAssetsApp needs to use the compound API.

**Important:** BrandAssetsApp is rendered *inside* AppWindow as children (from Desktop.tsx). The Nav needs to be a direct child of AppWindow, not buried inside the app component. Two approaches:

**Approach A — Hoist nav config:** BrandAssetsApp exports its nav config, and the Desktop/window wrapper renders `<AppWindow.Nav>` alongside the app content. This is cleaner but requires touching Desktop.tsx.

**Approach B — App renders compound children:** BrandAssetsApp returns a Fragment with `<AppWindow.Nav>` + `<AppWindow.Toolbar>` + `<AppWindow.Content>` as siblings. Since it's rendered as `{children}` inside AppWindow, the extraction utility will find them.

**Use Approach B** — it keeps nav logic co-located with the app and requires no Desktop.tsx changes:

```tsx
// BrandAssetsApp return:
return (
  <>
    <AppWindow.Nav value={activeTab} onChange={setActiveTab}>
      {TAB_NAV.map((tab) => (
        <AppWindow.Nav.Item key={tab.value} value={tab.value} icon={tab.icon}>
          {tab.label}
        </AppWindow.Nav.Item>
      ))}
    </AppWindow.Nav>

    {/* Toolbar — conditional per active tab */}
    {activeTab === 'fonts' && (
      <AppWindow.Toolbar>
        <SubTabNav active={typoSubTab} onChange={setTypoSubTab} />
      </AppWindow.Toolbar>
    )}
    {activeTab === 'components' && (
      <AppWindow.Toolbar>
        <Input
          value={componentSearch}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComponentSearch(e.target.value)}
          placeholder="Search..."
        />
        <div className="flex flex-wrap gap-1">
          <Button quiet={componentCategory !== 'all'} size="sm" compact onClick={() => setComponentCategory('all')}>
            All ({registry.length})
          </Button>
          {CATEGORIES.map((cat) => {
            const count = registry.filter((e) => e.category === cat).length;
            if (count === 0) return null;
            return (
              <Button key={cat} quiet={componentCategory !== cat} size="sm" compact onClick={() => setComponentCategory(cat)}>
                {CATEGORY_LABELS[cat]} ({count})
              </Button>
            );
          })}
        </div>
      </AppWindow.Toolbar>
    )}

    <AppWindow.Content>
      {/* Existing content island — keep the gradient wrapper + pixel-rounded card */}
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 px-1.5 pb-1.5">
          <div className="pixel-rounded-sm bg-card h-full">
            {/* ... existing tab content panels, minus the toolbar divs ... */}
          </div>
        </div>
      </div>
    </AppWindow.Content>
  </>
);
```

### Step 3: Remove inline toolbar divs from tab content

In the fonts tab content (around line 601-614), remove the `shrink-0 px-3 py-2 border-b` toolbar div — it's now handled by `<AppWindow.Toolbar>`.

In the components tab content (around line 616-650), remove the filter bar div — also moved to `<AppWindow.Toolbar>`.

### Step 4: Clean up unused imports

Remove `createPortal` from React imports if no longer used. Remove any portal-related state variables.

### Step 5: Visual verification

Run: `cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm dev`

Open BrandAssetsApp in the browser. Verify:
- [ ] Capsule tabs render in the titlebar zone (same visual as before)
- [ ] Clicking tabs switches content
- [ ] Fonts tab shows SubTabNav toolbar
- [ ] Components tab shows search + filter toolbar
- [ ] Other tabs have no toolbar
- [ ] Content scrolls correctly (height not clipped or overflowing)
- [ ] Inactive tab animations (translate-y, opacity) work

### Step 6: Run lint

Run: `cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm lint:design-system`
Expected: No new violations

### Step 7: Commit

```bash
git add apps/rad-os/components/apps/BrandAssetsApp.tsx
git commit -m "refactor(BrandAssets): migrate from portal pattern to AppWindow compound API"
```

---

## Task 8: Final Test Pass and Cleanup

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.test.tsx` (if any test adjustments needed)

### Step 1: Run full test suite

Run: `cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm vitest run`
Expected: All tests PASS

### Step 2: Run full lint

Run: `cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm lint`
Expected: No errors

### Step 3: Run build

Run: `cd /Users/rivermassey/Desktop/dev/DNA-taskbar-api && pnpm build`
Expected: PASS

### Step 4: Final commit if any cleanup needed

```bash
git commit -m "chore: final cleanup for AppWindow taskbar API"
```

---

## Verification Checklist

After all tasks complete:

- [ ] `AppWindow.Nav` renders capsule tabs in titlebar zone
- [ ] `AppWindow.Toolbar` renders control bar between titlebar and content
- [ ] `AppWindow.Content` wraps content area
- [ ] Toolbar-only works (no Nav required)
- [ ] Bare children backward compat (no compound wrappers = works as before)
- [ ] Height accounting subtracts toolbar height from `--app-content-max-height`
- [ ] All 3 presentation modes work (window, fullscreen, mobile — mobile renders Nav below header)
- [ ] BrandAssetsApp migrated — no more `createPortal` / `window-titlebar-slot`
- [ ] All existing tests pass
- [ ] Build passes
- [ ] Lint passes
