# Component Consolidation & Display Window Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate RadOS local UI components (Button, Card, Input) into the DNA package, then build a Component Library display window that showcases every DNA component and its variants as a first-class RadOS app.

**Architecture:** The DNA package (`@rdna/radiants`) already contains 25 components using semantic tokens. RadOS has 3 local duplicates (`components/ui/Button`, `Card`, `Input`) with hardcoded brand colors. We'll upgrade the DNA versions to absorb the RadOS-specific features (Next.js `Link` rendering, `iconName` string prop with actual `<Icon>` rendering, `forwardRef`), migrate all 15 consuming files, delete the local duplicates, then build a ComponentsApp that renders every DNA component live inside an Accordion-based showcase (following the monolith-hackathon pattern).

**Tech Stack:** React 19, Next.js 16 App Router, Tailwind CSS v4, Zustand, `@rdna/radiants` component library

---

## Phase 0: Research Findings

### Component Gap Analysis

| RadOS Local | DNA Package | Gap |
|---|---|---|
| `Button` (hardcoded: `bg-sun-yellow`, `text-black`, `border-black`) | `Button` (semantic: `bg-action-primary`, `text-action-secondary`, `border-edge-primary`) | RadOS has `iconName` string prop that renders `<Icon name={...}>` + auto-wires `<Spinner>`. DNA has generic `icon` / `loadingIndicator` slots. RadOS uses Next.js `<Link>` for `href` — DNA uses plain `<a>`. |
| `Card` (hardcoded: `bg-warm-cloud`, `text-black`, `border-black`) | `Card` (semantic: `bg-surface-primary`, `text-content-primary`, `border-edge-primary`) | Functionally identical. Same variants (`default`, `dark`, `raised`), same sub-components (`CardHeader`, `CardBody`, `CardFooter`). DNA version is drop-in. |
| `Input` (hardcoded: `bg-warm-cloud`, `text-black`, `border-black`, `ring-sun-yellow`) | `Input` (semantic tokens) | RadOS renders actual `<Icon>` in the icon slot. DNA has a placeholder `<div data-icon-slot>`. RadOS uses `forwardRef`. DNA uses React 19 `ref` as prop (equivalent). |

### Consuming Files (15 total)

**Button** (11 files): `WindowTitleBar`, `DataTable`, `BrandAssetsApp`, `CalendarApp`, `LinksApp` (N/A - no Button), `MurderTreeApp`, `RadiantsStudioApp`, `AuctionsApp`, `AuctionDisplay`, `BidPanel`, `VaultPanel`, `AuctionMurderTree`

**Card/CardBody** (9 files): `AboutApp`, `BrandAssetsApp`, `CalendarApp`, `LinksApp`, `SettingsApp`, `AuctionDisplay`, `BidHistory`, `BidPanel`, `VaultPanel`

**Input** (1 file): `BidPanel`

### DNA Package Component Inventory (25 components)

Accordion, Alert, Badge, Breadcrumbs, Button/IconButton/LoadingButton, Card/CardHeader/CardBody/CardFooter, Checkbox/Radio, ContextMenu, CountdownTimer, Dialog, Divider, DropdownMenu, HelpPanel, Input/TextArea/Label, MockStatesPopover, Popover, Progress/ProgressLabel/Spinner, Select, Sheet, Slider, Switch, Tabs, Toast, Tooltip, Web3ActionBar

---

## Task 1: Upgrade DNA Button — Add `iconName` prop with actual Icon rendering

The DNA Button currently uses an `icon?: React.ReactNode` slot. RadOS callers pass `iconName="arrow-right"` strings. We need to support both patterns in the DNA Button.

**Files:**
- Modify: `packages/radiants/components/core/Button/Button.tsx`

**Step 1: Add `iconName` prop and Icon rendering to DNA Button**

In `Button.tsx`, add:
- `iconName?: string` to `BaseButtonProps`
- `iconSize?: number` to `BaseButtonProps` (defaults based on button size: sm=14, md=20, lg=18)
- Import and render `<Icon>` when `iconName` is provided (falls back to `icon` slot)
- Import `Spinner` from sibling Progress component for auto-spinner when `loading + iconName`

The Icon import needs to be configurable since DNA is a package — we'll use a dynamic import pattern. **Actually, since the DNA package is consumed within the RadOS app which has the Icon component, and the `@source` directive already makes classes work, we should add the Icon component to the DNA package itself OR accept that Button's `iconName` is a RadOS-specific feature.**

**Decision: Keep `iconName` as a RadOS-only wrapper.** The DNA Button's `icon` slot pattern is the correct portable API. Instead of polluting the DNA package with app-specific icon imports, we'll create a thin `AppButton` wrapper in RadOS that maps `iconName` → `icon={<Icon name={...} />}`.

**Actually, simpler approach:** Just update the 11 consuming files to pass `icon={<Icon name="..." size={n} />}` instead of `iconName="..."`. This is a mechanical find-replace.

**Step 1a: Verify DNA Button works as drop-in**

Read each of the 11 Button-consuming files and catalog every `iconName` usage:

```bash
grep -rn 'iconName' apps/rad-os/components/
```

**Step 1b: For each consuming file, change:**
```tsx
// Before
import { Button } from '@/components/ui/Button';
<Button iconName="arrow-right">Click</Button>
<Button iconName="download" loading>Download</Button>

// After
import { Button } from '@rdna/radiants/components/core';
import { Spinner } from '@rdna/radiants/components/core';
import { Icon } from '@/components/icons';
<Button icon={<Icon name="arrow-right" size={20} />}>Click</Button>
<Button icon={<Icon name="download" size={20} />} loading loadingIndicator={<Spinner size={20} />}>Download</Button>
```

**Step 1c: Handle Next.js Link**

The RadOS Button uses Next.js `<Link>` for `href` navigation. The DNA Button uses `<a>`. For internal routes this loses client-side navigation. Two options:

1. **Wrap DNA Button** — keep a thin `AppButton` in RadOS that swaps `<a>` for `<Link>` (adds complexity)
2. **Use DNA Button as-is** — `<a href="/path">` still works in Next.js App Router. Client-side nav is handled by Next.js automatically for same-origin links when using the `<a>` tag, as long as the app is loaded.

**Decision:** Check all `href` usages. If they're all external links (`target="_blank"`), plain `<a>` is fine. If any are internal routes, we'll add a `linkComponent` prop to DNA Button.

**Step 2: Run build to verify**

```bash
cd apps/rad-os && npm run build
```

Expected: No TypeScript errors related to Button imports.

**Step 3: Commit**

```bash
git add -A && git commit -m "refactor: migrate Button consumers to DNA package"
```

---

## Task 2: Upgrade DNA Input — Wire icon rendering

**Files:**
- Modify: `packages/radiants/components/core/Input/Input.tsx`

**Step 1: Replace placeholder icon div with actual rendering**

The DNA Input already has `iconName?: string` and a placeholder div. Replace:
```tsx
// Before (placeholder)
<div className="text-content-muted" data-icon-slot={iconName} style={{...}} />

// After (render actual icon via slot pattern)
```

**Decision:** Add an `icon?: React.ReactNode` slot prop (same pattern as Button). Callers pass `icon={<Icon name="search" size={16} />}`. Keep `iconName` as deprecated alias. This keeps the DNA package framework-agnostic.

Update the Input component:
```tsx
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  error?: boolean;
  fullWidth?: boolean;
  /** @deprecated Use icon prop instead */
  iconName?: string;
  /** Icon slot - render your icon component here */
  icon?: React.ReactNode;
  className?: string;
}
```

And in the render:
```tsx
if (icon || iconName) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-content-muted">
        {icon || <div data-icon-slot={iconName} style={{...}} />}
      </div>
      {input}
    </div>
  );
}
```

**Step 2: Update BidPanel.tsx (only Input consumer)**

```tsx
// Before
import { Input } from '@/components/ui/Input';

// After
import { Input } from '@rdna/radiants/components/core';
```

If BidPanel uses `iconName`, add `icon={<Icon name="..." />}`.

**Step 3: Run build**

```bash
cd apps/rad-os && npm run build
```

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: add icon slot to DNA Input, migrate BidPanel"
```

---

## Task 3: Migrate Card consumers to DNA package

The DNA Card is already a drop-in replacement — same API, same sub-components, semantic tokens instead of hardcoded.

**Files:**
- Modify: 9 consuming files (see list above)

**Step 1: Update imports in all 9 files**

For each file:
```tsx
// Before
import { Card, CardBody } from '@/components/ui/Card';

// After
import { Card, CardBody } from '@rdna/radiants/components/core';
```

Files to update:
1. `components/apps/AboutApp.tsx`
2. `components/apps/BrandAssetsApp.tsx`
3. `components/apps/CalendarApp.tsx`
4. `components/apps/LinksApp.tsx`
5. `components/apps/SettingsApp.tsx`
6. `components/apps/AuctionsApp/components/AuctionDisplay.tsx`
7. `components/apps/AuctionsApp/components/BidHistory.tsx`
8. `components/apps/AuctionsApp/components/BidPanel.tsx`
9. `components/apps/AuctionsApp/components/VaultPanel.tsx`

**Step 2: Run build**

```bash
cd apps/rad-os && npm run build
```

**Step 3: Commit**

```bash
git add -A && git commit -m "refactor: migrate Card consumers to DNA package"
```

---

## Task 4: Migrate all Button consumers to DNA package

**Files:**
- Modify: 11 consuming files

**Step 1: Catalog all `iconName` usages**

```bash
grep -rn 'iconName' apps/rad-os/components/ --include='*.tsx'
```

**Step 2: Update each file**

For files WITHOUT `iconName`:
```tsx
// Just change the import
import { Button } from '@rdna/radiants/components/core';
```

For files WITH `iconName`:
```tsx
import { Button } from '@rdna/radiants/components/core';
import { Icon } from '@/components/icons';

// Change each usage:
// Before: <Button iconName="arrow-right">Go</Button>
// After:  <Button icon={<Icon name="arrow-right" size={20} />}>Go</Button>
```

For files with `loading` + `iconName`:
```tsx
import { Button, Spinner } from '@rdna/radiants/components/core';
import { Icon } from '@/components/icons';

// Before: <Button iconName="download" loading>Save</Button>
// After:  <Button icon={<Icon name="download" size={20} />} loading loadingIndicator={<Spinner size={20} />}>Save</Button>
```

**Check for `href` usages:** If any Button uses `href` for internal navigation, verify it still works with `<a>` instead of `<Link>`.

Files to update:
1. `components/Rad_os/WindowTitleBar.tsx`
2. `components/auctions/DataTable.tsx`
3. `components/apps/BrandAssetsApp.tsx`
4. `components/apps/CalendarApp.tsx`
5. `components/apps/MurderTreeApp.tsx`
6. `components/apps/RadiantsStudioApp.tsx`
7. `components/apps/AuctionsApp/AuctionsApp.tsx`
8. `components/apps/AuctionsApp/components/AuctionDisplay.tsx`
9. `components/apps/AuctionsApp/components/BidPanel.tsx`
10. `components/apps/AuctionsApp/components/VaultPanel.tsx`
11. `components/apps/AuctionsApp/components/AuctionMurderTree.tsx`

**Step 3: Run build**

```bash
cd apps/rad-os && npm run build
```

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: migrate Button consumers to DNA package"
```

---

## Task 5: Delete local UI duplicates

**Files:**
- Delete: `apps/rad-os/components/ui/Button.tsx`
- Delete: `apps/rad-os/components/ui/Card.tsx`
- Delete: `apps/rad-os/components/ui/Input.tsx`
- Modify: `apps/rad-os/components/ui/index.ts`

**Step 1: Delete the 3 component files**

```bash
rm apps/rad-os/components/ui/Button.tsx
rm apps/rad-os/components/ui/Card.tsx
rm apps/rad-os/components/ui/Input.tsx
```

**Step 2: Update `components/ui/index.ts`**

Remove the local exports. If nothing remains, either delete the file or leave a comment pointing to DNA:

```ts
// All shared UI components are provided by @rdna/radiants/components/core
// Import from there: import { Button, Card, Input } from '@rdna/radiants/components/core';
```

**Step 3: Run build to verify no remaining references**

```bash
cd apps/rad-os && npm run build
```

Expected: Clean build with no `@/components/ui/Button` references.

**Step 4: Run grep to confirm no stale imports**

```bash
grep -rn "from '@/components/ui/" apps/rad-os/components/ --include='*.tsx'
```

Expected: No results.

**Step 5: Commit**

```bash
git add -A && git commit -m "chore: remove local UI duplicates, all consumers use DNA package"
```

---

## Task 6: Register ComponentsApp in APP_REGISTRY

**Files:**
- Modify: `apps/rad-os/lib/constants.tsx`
- Create: `apps/rad-os/components/apps/ComponentsApp/index.tsx`

**Step 1: Add to constants.tsx**

In `APP_IDS`:
```tsx
COMPONENTS: 'components',
```

Add lazy import:
```tsx
const ComponentsApp = lazy(() => import('@/components/apps/ComponentsApp'));
```

Add registry entry:
```tsx
[APP_IDS.COMPONENTS]: {
  id: APP_IDS.COMPONENTS,
  title: 'Components',
  icon: <Icon name="code-window" size={20} />,
  component: ComponentsApp,
  resizable: true,
  defaultSize: { width: 680, height: 700 },
},
```

**Step 2: Create barrel export**

`components/apps/ComponentsApp/index.tsx`:
```tsx
export { ComponentsApp as default } from './ComponentsApp';
```

**Step 3: Run build (will fail — ComponentsApp.tsx doesn't exist yet)**

This is expected. Proceed to Task 7.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: register ComponentsApp in APP_REGISTRY"
```

---

## Task 7: Build ComponentsApp — Scaffold and Section helpers

**Files:**
- Create: `apps/rad-os/components/apps/ComponentsApp/ComponentsApp.tsx`

Following the monolith-hackathon pattern: `Section` wraps `Accordion.Item` for collapsible groups, `Row` renders a code label + flex-wrapped component examples.

**Step 1: Create ComponentsApp.tsx with helpers and shell**

```tsx
'use client';

import React from 'react';
import {
  Accordion,
  useAccordionState,
} from '@rdna/radiants/components/core';
import type { AppProps } from '@/lib/constants';

// ============================================================================
// Helpers
// ============================================================================

function Section({
  title,
  value,
  children,
}: {
  title: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Accordion.Item value={value}>
      <Accordion.Trigger>{title}</Accordion.Trigger>
      <Accordion.Content>{children}</Accordion.Content>
    </Accordion.Item>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 mb-4">
      <code className="font-mono text-xs text-content-muted uppercase">{label}</code>
      <div className="flex flex-wrap items-center gap-2">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ComponentsApp({ windowId }: AppProps) {
  const accordion = useAccordionState({
    type: 'multiple',
    defaultValue: ['actions'],
  });

  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="mb-6">
        <h1 className="font-joystix text-lg text-content-primary uppercase tracking-wider mb-1">
          Component Library
        </h1>
        <p className="font-mono text-xs text-content-muted uppercase">
          Live UI patterns from @rdna/radiants
        </p>
      </div>

      <Accordion.Provider {...accordion}>
        <Accordion.Frame>
          {/* Sections added in subsequent tasks */}
        </Accordion.Frame>
      </Accordion.Provider>
    </div>
  );
}

export default ComponentsApp;
```

**Step 2: Run build**

```bash
cd apps/rad-os && npm run build
```

Expected: Clean build. App registered and renders empty accordion.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: scaffold ComponentsApp with Section/Row helpers"
```

---

## Task 8: ComponentsApp — Action Controls section (Button, IconButton, LoadingButton)

**Step 1: Add Button section to ComponentsApp.tsx**

Import components:
```tsx
import {
  Button,
  IconButton,
  LoadingButton,
} from '@rdna/radiants/components/core';
import { Icon } from '@/components/icons';
```

Add inside `<Accordion.Frame>`:
```tsx
<Section title="Action Controls" value="actions">
  <Row label="Button — primary">
    <Button variant="primary" size="sm">Small</Button>
    <Button variant="primary" size="md">Primary</Button>
    <Button variant="primary" size="lg">Large</Button>
  </Row>

  <Row label="Button — secondary">
    <Button variant="secondary" size="sm">Small</Button>
    <Button variant="secondary" size="md">Secondary</Button>
    <Button variant="secondary" size="lg">Large</Button>
  </Row>

  <Row label="Button — outline">
    <Button variant="outline" size="sm">Small</Button>
    <Button variant="outline" size="md">Outline</Button>
    <Button variant="outline" size="lg">Large</Button>
  </Row>

  <Row label="Button — ghost">
    <Button variant="ghost" size="sm">Small</Button>
    <Button variant="ghost" size="md">Ghost</Button>
    <Button variant="ghost" size="lg">Large</Button>
  </Row>

  <Row label="Button — with icon">
    <Button variant="primary" icon={<Icon name="go-forward" size={16} />}>
      Next
    </Button>
    <Button variant="secondary" icon={<Icon name="download" size={16} />}>
      Download
    </Button>
  </Row>

  <Row label="Button — states">
    <Button variant="primary" disabled>Disabled</Button>
    <Button variant="primary" fullWidth>Full Width</Button>
  </Row>

  <Row label="IconButton">
    <IconButton icon={<Icon name="settings-cog" size={16} />} aria-label="Settings" variant="ghost" />
    <IconButton icon={<Icon name="close" size={16} />} aria-label="Close" variant="outline" />
    <IconButton icon={<Icon name="go-forward" size={16} />} aria-label="Forward" variant="primary" />
  </Row>

  <Row label="LoadingButton">
    <LoadingButton variant="primary" isLoading={false}>Save</LoadingButton>
    <LoadingButton variant="secondary" isLoading={true}>Saving...</LoadingButton>
  </Row>
</Section>
```

**Step 2: Run dev server and visually verify**

```bash
cd apps/rad-os && npm run dev
```

Open Components app from desktop. Verify Button variants render with correct colors.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add Button section to ComponentsApp"
```

---

## Task 9: ComponentsApp — Data Display section (Badge, Card, Progress, Divider, Tooltip)

**Step 1: Add imports and section**

```tsx
import {
  Badge,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Progress,
  ProgressLabel,
  Spinner,
  Divider,
  Tooltip,
} from '@rdna/radiants/components/core';
```

```tsx
<Section title="Data Display" value="data-display">
  <Row label="Badge — variants">
    <Badge variant="default">Default</Badge>
    <Badge variant="success">Success</Badge>
    <Badge variant="warning">Warning</Badge>
    <Badge variant="error">Error</Badge>
    <Badge variant="info">Info</Badge>
  </Row>

  <Row label="Badge — sizes">
    <Badge variant="default" size="sm">SM</Badge>
    <Badge variant="default" size="md">MD</Badge>
  </Row>

  <Row label="Card — default">
    <div className="w-full max-w-sm">
      <Card variant="default">
        <CardHeader>Card Header</CardHeader>
        <CardBody>Default card with semantic surface colors.</CardBody>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    </div>
  </Row>

  <Row label="Card — dark">
    <div className="w-full max-w-sm">
      <Card variant="dark">
        <CardBody>Dark variant with inverted colors.</CardBody>
      </Card>
    </div>
  </Row>

  <Row label="Card — raised">
    <div className="w-full max-w-sm">
      <Card variant="raised">
        <CardBody>Raised variant with shadow effect.</CardBody>
      </Card>
    </div>
  </Row>

  <Row label="Progress">
    <div className="w-full max-w-sm space-y-2">
      <Progress value={25} />
      <Progress value={60} />
      <Progress value={100} />
    </div>
  </Row>

  <Row label="Spinner">
    <Spinner size={16} />
    <Spinner size={24} />
    <Spinner size={32} />
  </Row>

  <Row label="Divider">
    <div className="w-full">
      <Divider />
    </div>
  </Row>

  <Row label="Tooltip">
    <Tooltip content="This is a tooltip">
      <Button variant="outline" size="sm">Hover me</Button>
    </Tooltip>
  </Row>
</Section>
```

**Step 2: Run dev, visually verify**

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add Data Display section to ComponentsApp"
```

---

## Task 10: ComponentsApp — Form Controls section (Input, TextArea, Select, Checkbox, Radio, Switch, Slider)

**Step 1: Add imports and section**

```tsx
import {
  Input,
  TextArea,
  Label,
  Select,
  Checkbox,
  Radio,
  Switch,
  Slider,
} from '@rdna/radiants/components/core';
```

Note: Some of these are compound components. Check their APIs:
- `Select` — read `packages/radiants/components/core/Select/Select.tsx` for API
- `Checkbox` / `Radio` — read for API
- `Switch` — already used in SettingsApp
- `Slider` — already used in MusicTab

```tsx
<Section title="Form Controls" value="form-controls">
  <Row label="Input — sizes">
    <Input size="sm" placeholder="Small input" />
    <Input size="md" placeholder="Medium input" />
    <Input size="lg" placeholder="Large input" />
  </Row>

  <Row label="Input — with icon">
    <Input icon={<Icon name="search" size={16} />} placeholder="Search..." />
  </Row>

  <Row label="Input — error state">
    <Input error placeholder="Error state" />
  </Row>

  <Row label="Label">
    <Label required>Required Field</Label>
  </Row>

  <Row label="TextArea">
    <div className="w-full max-w-sm">
      <TextArea placeholder="Enter your message..." />
    </div>
  </Row>

  <Row label="Select">
    {/* Render Select per its API */}
  </Row>

  <Row label="Checkbox">
    <Checkbox label="Option A" />
    <Checkbox label="Option B" checked />
    <Checkbox label="Disabled" disabled />
  </Row>

  <Row label="Radio">
    <Radio name="demo" label="Choice 1" value="1" />
    <Radio name="demo" label="Choice 2" value="2" />
  </Row>

  <Row label="Switch">
    <Switch />
  </Row>

  <Row label="Slider">
    <div className="w-full max-w-sm">
      <Slider value={50} min={0} max={100} step={1} />
    </div>
  </Row>
</Section>
```

Note: Some components have stateful APIs (Select needs options, Switch needs onChange). Use inline state with `useState` where needed, or render in uncontrolled mode where possible.

**Step 2: Read each form component's API to get exact props**

Before implementing, read:
- `packages/radiants/components/core/Select/Select.tsx`
- `packages/radiants/components/core/Checkbox/Checkbox.tsx`
- `packages/radiants/components/core/Switch/Switch.tsx`

Adapt the JSX to match actual APIs.

**Step 3: Run dev, visually verify**

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add Form Controls section to ComponentsApp"
```

---

## Task 11: ComponentsApp — Navigation & Layout section (Tabs, Accordion, Breadcrumbs)

**Step 1: Add imports and section**

```tsx
import {
  Tabs,
  Breadcrumbs,
} from '@rdna/radiants/components/core';
```

Note: Tabs and Accordion are compound components. Check their compound API patterns:
- `Tabs.Provider` / `Tabs.Frame` / `Tabs.List` / `Tabs.Trigger` / `Tabs.Content`
- `Accordion.Provider` / `Accordion.Frame` / `Accordion.Item` / `Accordion.Trigger` / `Accordion.Content`

```tsx
<Section title="Navigation & Layout" value="navigation">
  <Row label="Tabs">
    <div className="w-full">
      {/* Use Tabs compound component with useTabsState hook */}
    </div>
  </Row>

  <Row label="Accordion">
    <div className="w-full">
      {/* Nested accordion demo */}
    </div>
  </Row>

  <Row label="Breadcrumbs">
    <Breadcrumbs items={[
      { label: 'Home', href: '#' },
      { label: 'Components', href: '#' },
      { label: 'Current' },
    ]} />
  </Row>
</Section>
```

**Step 2: Read Tabs and Breadcrumbs APIs**

- `packages/radiants/components/core/Tabs/Tabs.tsx`
- `packages/radiants/components/core/Breadcrumbs/Breadcrumbs.tsx`

**Step 3: Implement with inline state hooks for Tabs demo**

**Step 4: Run dev, visually verify**

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add Navigation section to ComponentsApp"
```

---

## Task 12: ComponentsApp — Overlays & Feedback section (Dialog, Sheet, Popover, Toast, Alert, DropdownMenu, ContextMenu)

**Step 1: Add imports and section**

These are interactive overlay components that need trigger buttons.

```tsx
import {
  Dialog,
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetBody,
  Popover, PopoverTrigger, PopoverContent,
  Alert,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  ContextMenu, ContextMenuContent, ContextMenuItem,
  useToast,
} from '@rdna/radiants/components/core';
```

```tsx
<Section title="Overlays & Feedback" value="overlays">
  <Row label="Alert — variants">
    <div className="w-full space-y-2">
      <Alert variant="info">Info alert message</Alert>
      <Alert variant="success">Success alert message</Alert>
      <Alert variant="warning">Warning alert message</Alert>
      <Alert variant="error">Error alert message</Alert>
    </div>
  </Row>

  <Row label="Dialog">
    {/* Button that opens a Dialog */}
  </Row>

  <Row label="Sheet">
    {/* SheetTrigger + SheetContent */}
  </Row>

  <Row label="Popover">
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>Popover content here</PopoverContent>
    </Popover>
  </Row>

  <Row label="DropdownMenu">
    {/* DropdownMenu with trigger and items */}
  </Row>

  <Row label="Toast">
    {/* Button that fires a toast via useToast() */}
  </Row>
</Section>
```

Note: Dialog, Sheet, and Toast are stateful. Read their APIs first:
- `packages/radiants/components/core/Dialog/Dialog.tsx`
- `packages/radiants/components/core/Sheet/Sheet.tsx`
- `packages/radiants/components/core/Toast/Toast.tsx`

**Step 2: Read overlay component APIs**

**Step 3: Implement with inline state for Dialog open/close**

**Step 4: Run dev, visually verify overlays work**

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add Overlays & Feedback section to ComponentsApp"
```

---

## Task 13: ComponentsApp — Specialty Components section (CountdownTimer, Web3ActionBar, HelpPanel)

**Step 1: Add remaining components**

```tsx
import {
  CountdownTimer,
  Web3ActionBar,
  HelpPanel,
} from '@rdna/radiants/components/core';
```

```tsx
<Section title="Specialty" value="specialty">
  <Row label="CountdownTimer">
    <CountdownTimer targetDate={new Date(Date.now() + 86400000)} />
  </Row>

  <Row label="Web3ActionBar">
    {/* Render with mock props */}
  </Row>
</Section>
```

**Step 2: Read each component's API**

**Step 3: Implement**

**Step 4: Run build**

```bash
cd apps/rad-os && npm run build
```

Expected: Clean build, no TypeScript errors.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add Specialty section to ComponentsApp"
```

---

## Task 14: Final verification

**Step 1: Full build check**

```bash
cd apps/rad-os && npm run build
```

**Step 2: Lint check**

```bash
cd apps/rad-os && npm run lint
```

**Step 3: Verify no remaining local UI imports**

```bash
grep -rn "from '@/components/ui/" apps/rad-os/components/ --include='*.tsx'
```

Expected: No results (or only the re-export comment in `ui/index.ts`).

**Step 4: Visual smoke test**

- Open every RadOS app that previously used local Button/Card/Input
- Verify colors, interactions, and layout are correct
- Open ComponentsApp — verify every section expands and components render correctly

**Step 5: Commit any fixes**

```bash
git add -A && git commit -m "fix: final cleanup after component consolidation"
```

---

## Summary

| Task | Description | Estimated Files Changed |
|------|-------------|------------------------|
| 1 | Plan Button migration strategy | 0 (research) |
| 2 | Upgrade DNA Input with icon slot | 1 DNA + 1 consumer |
| 3 | Migrate 9 Card consumers | 9 files |
| 4 | Migrate 11 Button consumers | 11 files |
| 5 | Delete local UI duplicates | 4 files deleted |
| 6 | Register ComponentsApp | 2 files |
| 7 | Scaffold ComponentsApp | 2 files created |
| 8 | Action Controls section | 1 file |
| 9 | Data Display section | 1 file |
| 10 | Form Controls section | 1 file |
| 11 | Navigation section | 1 file |
| 12 | Overlays section | 1 file |
| 13 | Specialty section | 1 file |
| 14 | Final verification | 0-3 fixes |
