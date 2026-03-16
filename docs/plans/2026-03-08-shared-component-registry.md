# Shared Component Registry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Build a derived component registry in `packages/radiants/` that auto-generates display entries from existing schema.json metadata, then rewrite the BrandAssets "Components" tab to consume it.

**Worktree:** Create with `git worktree add .claude/worktrees/registry -b feat/shared-component-registry` from repo root.

**Architecture:** The registry is a TS module that imports component schemas (via existing `schemas/index.ts`) and component references (via `components/core/index.ts`), maps enum props to demo variants, merges with a hand-authored overrides file, and exports a typed `ComponentEntry[]`. No build step or generator script — the mapping happens at import time. BrandAssets' `DesignSystemTab` is rewritten to consume this registry instead of hardcoding 1,634 lines of demo JSX.

**Tech Stack:** TypeScript, React 19, Vitest, existing schema.json metadata, pnpm workspaces

---

## Current Status (2026-03-10)

- `Task 1` complete: `StepperTabs` was added to `packages/radiants/schemas/index.ts`.
- `Task 2` superseded by a better approach: category/display metadata now lives in `packages/radiants/registry/component-display-meta.ts` instead of being backfilled into generated `*.schema.json` files.
- `Task 3` complete: registry contract types exist in `packages/radiants/registry/types.ts`.
- `Task 4` complete: component/source/schema mapping exists in `packages/radiants/registry/component-map.ts`.
- `Task 5` complete: compound and controlled demos use `Demo` components rather than callback render functions.
- `Task 6` complete: the builder and barrel export the finished typed registry.
- `Task 7` complete: `@rdna/radiants` now exports `./registry` and publishes `registry/`.
- `Task 8` complete: registry tests exist at `packages/radiants/registry/__tests__/registry.test.ts` and pass.
- `Task 9` complete: `apps/rad-os/components/ui/DesignSystemTab.tsx` now consumes `@rdna/radiants/registry`.
- `Task 10` deferred: component scaffolding skill is follow-up work, not part of the merge-critical shared registry surface.

## Outcome

This branch replaced the handwritten BrandAssets component showcase with a shared registry-driven implementation in `packages/radiants/registry/`.

Delivered:

1. A typed shared registry module with display metadata, component mapping, curated overrides, auto-generated enum variants, and package exports.
2. A much smaller `DesignSystemTab` that renders from the shared registry instead of maintaining duplicated demo JSX.
3. Registry-level unit coverage for shape, categories, exclusions, render modes, and schema coverage.

## Follow-Up Work

1. Clean the accidental `.claude/worktrees/registry` gitlink out of the outer repo and ignore worktree paths properly.
2. Decide whether `feat/playground-phase0` should be merged, kept for reference, or deleted after extracting anything still needed.
3. If still desired, handle `Task 10` as a separate follow-up branch.

---

## Preconditions

1. The `schemas/index.ts` barrel already aggregates 25 of 26 schema+dna pairs via `componentData`. StepperTabs is missing and must be added (Task 1).
2. All 26 `*.schema.json` files exist but lack a `category` field (Task 2).
3. `package.json` has a `"./schemas"` export but no `"./registry"` export (Task 5).

## Known Constraints

- **Compound components** (Dialog, Sheet, Select, Alert, Tabs, etc.) use compound APIs (`Dialog.Provider`, `Sheet.Trigger`, `Tabs.Frame`) that cannot be rendered via simple `<Component {...props} />`. The overrides file must provide custom `render` functions for these.
- **Schema inconsistencies**: `slots` is an object in most files but an array in Card and Input. `relatedComponents` vs `subcomponents` naming. The registry normalizes these away — it only reads `name`, `category`, `description`, and `props` (for enum detection).
- **StepperTabs** lives in the `Tabs/` directory, not its own directory. Both `Tabs.schema.json` and `StepperTabs.schema.json` exist there.

---

## Task 1: Add StepperTabs to schemas barrel [Complete]

**Files:**
- Modify: `packages/radiants/schemas/index.ts`

**Step 1: Read the current schemas barrel**

Read `packages/radiants/schemas/index.ts` to understand how schema+dna pairs are aggregated. Each component has a `{ schema, dna }` entry in the `componentData` record.

**Step 2: Add StepperTabs entry**

Add an import for `StepperTabs.schema.json` and `StepperTabs.dna.json` from `../components/core/Tabs/`:

```ts
import stepperTabsSchema from '../components/core/Tabs/StepperTabs.schema.json';
import stepperTabsDna from '../components/core/Tabs/StepperTabs.dna.json';
```

Add `StepperTabs` to the `componentData` record:

```ts
StepperTabs: { schema: stepperTabsSchema, dna: stepperTabsDna },
```

Also add `'StepperTabs'` to the `componentNames` array and update the `ComponentName` type if it's manually maintained.

**Step 3: Verify**

Run:

```bash
pnpm --filter @rdna/radiants exec tsc --noEmit
```

Expected: No type errors from the schemas barrel.

**Step 4: Commit**

```bash
git add packages/radiants/schemas/index.ts
git commit -m "feat(schemas): add StepperTabs to schemas barrel"
```

---

## Task 2: Backfill `category` field to all 26 schema.json files [Superseded]

This task is no longer the preferred approach. `packages/preview/src/generate-schemas.ts` rewrites schema JSON, so hand-authored display metadata now lives in `packages/radiants/registry/component-display-meta.ts`.

**Files:**
- Modify: All 26 `*.schema.json` files in `packages/radiants/components/core/`

**Step 1: Add `"category"` as the second field (after `"name"`) in each schema.json**

Use this mapping:

| Category | Components |
|----------|-----------|
| `"action"` | Button, ContextMenu, DropdownMenu |
| `"layout"` | Card, Divider, Accordion |
| `"form"` | Input, Checkbox, Select, Slider, Switch |
| `"feedback"` | Alert, Badge, Progress, Toast, Tooltip |
| `"navigation"` | Breadcrumbs, Tabs, StepperTabs |
| `"overlay"` | Dialog, Sheet, Popover, HelpPanel |
| `"data-display"` | CountdownTimer, Web3ActionBar |
| `"dev"` | MockStatesPopover |

Example — `Button.schema.json` before:
```json
{
  "name": "Button",
  "description": "..."
```

After:
```json
{
  "name": "Button",
  "category": "action",
  "description": "..."
```

**Step 2: Verify all schemas parse**

Run:

```bash
node -e "const fs=require('fs'),path=require('path'),glob=require('glob');glob.sync('packages/radiants/components/core/**/*.schema.json').forEach(f=>{const d=JSON.parse(fs.readFileSync(f));if(!d.category)throw new Error(f+' missing category');console.log(d.name+': '+d.category)})"
```

Or simply:

```bash
pnpm --filter @rdna/radiants exec tsc --noEmit
```

Expected: All 26 schemas have a `category` field. No parse errors.

**Step 3: Commit**

```bash
git add packages/radiants/components/core/**/*.schema.json
git commit -m "feat(schemas): add category field to all 26 schema.json files"
```

---

## Task 3: Create registry types [Complete]

**Files:**
- Create: `packages/radiants/registry/types.ts`

**Step 1: Create the types file**

```ts
import type { ComponentType, ReactNode } from 'react';

export type ComponentCategory =
  | 'action'
  | 'layout'
  | 'form'
  | 'feedback'
  | 'navigation'
  | 'overlay'
  | 'data-display'
  | 'dev';

export const CATEGORIES: ComponentCategory[] = [
  'action',
  'layout',
  'form',
  'feedback',
  'navigation',
  'overlay',
  'data-display',
  'dev',
];

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  action: 'Actions',
  layout: 'Layout',
  form: 'Forms',
  feedback: 'Feedback',
  navigation: 'Navigation',
  overlay: 'Overlays',
  'data-display': 'Data Display',
  dev: 'Dev Tools',
};

export interface VariantDemo {
  label: string;
  props: Record<string, unknown>;
}

export interface ComponentEntry {
  /** Component name matching schema.json `name` field */
  name: string;
  /** Display category for filtering */
  category: ComponentCategory;
  /** One-line description from schema.json */
  description: string;
  /** The primary component export */
  component: ComponentType<any>;
  /** Path to source file relative to repo root */
  sourcePath: string;
  /** Path to schema.json relative to repo root */
  schemaPath: string;
  /** Default props for a simple render */
  exampleProps?: Record<string, unknown>;
  /** Named variant demos generated from enum props or hand-authored */
  variants?: VariantDemo[];
  /** Custom render for compound components that can't use simple prop spreading */
  render?: () => ReactNode;
  /** Search tags (auto-includes name + category) */
  tags?: string[];
  /** How to render in showcase: inline (default), contained (needs bounding box), description-only */
  renderMode?: 'inline' | 'contained' | 'description-only';
}

export interface ComponentOverride {
  /** Replace auto-generated variants with hand-authored ones */
  variants?: VariantDemo[];
  /** Custom render function for compound components */
  render?: () => ReactNode;
  /** Extra search tags beyond auto-generated ones */
  tags?: string[];
  /** Override render mode */
  renderMode?: 'inline' | 'contained' | 'description-only';
  /** Override default example props */
  exampleProps?: Record<string, unknown>;
  /** Set to true to exclude from registry (e.g. MockStatesPopover) */
  exclude?: boolean;
}
```

**Step 2: Commit**

```bash
git add packages/radiants/registry/types.ts
git commit -m "feat(registry): add ComponentEntry and ComponentCategory types"
```

---

## Task 4: Create the component-to-export mapping [Complete]

**Files:**
- Create: `packages/radiants/registry/component-map.ts`

This file maps schema `name` → the actual React component export from `components/core/index.ts`, plus the file paths. This is the only manual mapping needed — everything else derives from schema.json.

**Step 1: Create the mapping**

```ts
import {
  Accordion,
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  ContextMenu,
  CountdownTimer,
  Dialog,
  Divider,
  DropdownMenu,
  HelpPanel,
  Input,
  MockStatesPopover,
  Popover,
  Progress,
  Select,
  Sheet,
  Slider,
  StepperTabs,
  Switch,
  Tabs,
  ToastProvider,
  Tooltip,
  Web3ActionBar,
} from '../components/core';
import type { ComponentType } from 'react';

interface ComponentMapEntry {
  component: ComponentType<any>;
  sourcePath: string;
  schemaPath: string;
}

export const componentMap: Record<string, ComponentMapEntry> = {
  Accordion: {
    component: Accordion,
    sourcePath: 'packages/radiants/components/core/Accordion/Accordion.tsx',
    schemaPath: 'packages/radiants/components/core/Accordion/Accordion.schema.json',
  },
  Alert: {
    component: Alert,
    sourcePath: 'packages/radiants/components/core/Alert/Alert.tsx',
    schemaPath: 'packages/radiants/components/core/Alert/Alert.schema.json',
  },
  Badge: {
    component: Badge,
    sourcePath: 'packages/radiants/components/core/Badge/Badge.tsx',
    schemaPath: 'packages/radiants/components/core/Badge/Badge.schema.json',
  },
  Breadcrumbs: {
    component: Breadcrumbs,
    sourcePath: 'packages/radiants/components/core/Breadcrumbs/Breadcrumbs.tsx',
    schemaPath: 'packages/radiants/components/core/Breadcrumbs/Breadcrumbs.schema.json',
  },
  Button: {
    component: Button,
    sourcePath: 'packages/radiants/components/core/Button/Button.tsx',
    schemaPath: 'packages/radiants/components/core/Button/Button.schema.json',
  },
  Card: {
    component: Card,
    sourcePath: 'packages/radiants/components/core/Card/Card.tsx',
    schemaPath: 'packages/radiants/components/core/Card/Card.schema.json',
  },
  Checkbox: {
    component: Checkbox,
    sourcePath: 'packages/radiants/components/core/Checkbox/Checkbox.tsx',
    schemaPath: 'packages/radiants/components/core/Checkbox/Checkbox.schema.json',
  },
  ContextMenu: {
    component: ContextMenu,
    sourcePath: 'packages/radiants/components/core/ContextMenu/ContextMenu.tsx',
    schemaPath: 'packages/radiants/components/core/ContextMenu/ContextMenu.schema.json',
  },
  CountdownTimer: {
    component: CountdownTimer,
    sourcePath: 'packages/radiants/components/core/CountdownTimer/CountdownTimer.tsx',
    schemaPath: 'packages/radiants/components/core/CountdownTimer/CountdownTimer.schema.json',
  },
  Dialog: {
    component: Dialog,
    sourcePath: 'packages/radiants/components/core/Dialog/Dialog.tsx',
    schemaPath: 'packages/radiants/components/core/Dialog/Dialog.schema.json',
  },
  Divider: {
    component: Divider,
    sourcePath: 'packages/radiants/components/core/Divider/Divider.tsx',
    schemaPath: 'packages/radiants/components/core/Divider/Divider.schema.json',
  },
  DropdownMenu: {
    component: DropdownMenu,
    sourcePath: 'packages/radiants/components/core/DropdownMenu/DropdownMenu.tsx',
    schemaPath: 'packages/radiants/components/core/DropdownMenu/DropdownMenu.schema.json',
  },
  HelpPanel: {
    component: HelpPanel,
    sourcePath: 'packages/radiants/components/core/HelpPanel/HelpPanel.tsx',
    schemaPath: 'packages/radiants/components/core/HelpPanel/HelpPanel.schema.json',
  },
  Input: {
    component: Input,
    sourcePath: 'packages/radiants/components/core/Input/Input.tsx',
    schemaPath: 'packages/radiants/components/core/Input/Input.schema.json',
  },
  MockStatesPopover: {
    component: MockStatesPopover,
    sourcePath: 'packages/radiants/components/core/MockStatesPopover/MockStatesPopover.tsx',
    schemaPath: 'packages/radiants/components/core/MockStatesPopover/MockStatesPopover.schema.json',
  },
  Popover: {
    component: Popover,
    sourcePath: 'packages/radiants/components/core/Popover/Popover.tsx',
    schemaPath: 'packages/radiants/components/core/Popover/Popover.schema.json',
  },
  Progress: {
    component: Progress,
    sourcePath: 'packages/radiants/components/core/Progress/Progress.tsx',
    schemaPath: 'packages/radiants/components/core/Progress/Progress.schema.json',
  },
  Select: {
    component: Select,
    sourcePath: 'packages/radiants/components/core/Select/Select.tsx',
    schemaPath: 'packages/radiants/components/core/Select/Select.schema.json',
  },
  Sheet: {
    component: Sheet,
    sourcePath: 'packages/radiants/components/core/Sheet/Sheet.tsx',
    schemaPath: 'packages/radiants/components/core/Sheet/Sheet.schema.json',
  },
  Slider: {
    component: Slider,
    sourcePath: 'packages/radiants/components/core/Slider/Slider.tsx',
    schemaPath: 'packages/radiants/components/core/Slider/Slider.schema.json',
  },
  StepperTabs: {
    component: StepperTabs,
    sourcePath: 'packages/radiants/components/core/Tabs/StepperTabs.tsx',
    schemaPath: 'packages/radiants/components/core/Tabs/StepperTabs.schema.json',
  },
  Switch: {
    component: Switch,
    sourcePath: 'packages/radiants/components/core/Switch/Switch.tsx',
    schemaPath: 'packages/radiants/components/core/Switch/Switch.schema.json',
  },
  Tabs: {
    component: Tabs,
    sourcePath: 'packages/radiants/components/core/Tabs/Tabs.tsx',
    schemaPath: 'packages/radiants/components/core/Tabs/Tabs.schema.json',
  },
  Toast: {
    component: ToastProvider,
    sourcePath: 'packages/radiants/components/core/Toast/Toast.tsx',
    schemaPath: 'packages/radiants/components/core/Toast/Toast.schema.json',
  },
  Tooltip: {
    component: Tooltip,
    sourcePath: 'packages/radiants/components/core/Tooltip/Tooltip.tsx',
    schemaPath: 'packages/radiants/components/core/Tooltip/Tooltip.schema.json',
  },
  Web3ActionBar: {
    component: Web3ActionBar,
    sourcePath: 'packages/radiants/components/core/Web3ActionBar/Web3ActionBar.tsx',
    schemaPath: 'packages/radiants/components/core/Web3ActionBar/Web3ActionBar.schema.json',
  },
};
```

**Step 2: Commit**

```bash
git add packages/radiants/registry/component-map.ts
git commit -m "feat(registry): add component-to-export mapping"
```

---

## Task 5: Create registry overrides for compound components [Complete]

**Files:**
- Create: `packages/radiants/registry/registry.overrides.tsx`

This file provides hand-authored `render` functions for compound components that cannot be demoed via simple prop spreading, plus curated variant lists and tags.

**Step 1: Read the existing DesignSystemTab content functions**

Read `apps/rad-os/components/ui/DesignSystemTab.tsx` to understand what each `*Content` function renders. Extract the minimal demo JSX needed for each compound component.

**Step 2: Create the overrides file**

The overrides file exports a `Record<string, ComponentOverride>` keyed by component name. For simple components (Button, Badge, etc.), the auto-generated variants from enum props are sufficient — no override needed. For compound components, provide a `render` function.

```tsx
import React from 'react';
import type { ComponentOverride } from './types';

// Import compound component sub-parts needed for render functions
import {
  Card, CardHeader, CardBody, CardFooter,
  Alert,
  Dialog, useDialogState,
  Select, useSelectState,
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetBody,
  Tabs, useTabsState,
  StepperTabs,
  ContextMenu, ContextMenuContent, ContextMenuItem,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  Popover, PopoverTrigger, PopoverContent,
  Tooltip,
  HelpPanel,
  ToastProvider, useToast,
  Button,
  Input, TextArea, Label,
  Checkbox, Radio,
  Breadcrumbs,
  Progress, Spinner,
  Accordion,
  Badge,
  Web3ActionBar,
} from '../components/core';

export const overrides: Record<string, ComponentOverride> = {
  // === Simple components with curated variants ===

  Button: {
    variants: [
      { label: 'Primary', props: { children: 'Primary', variant: 'primary' } },
      { label: 'Secondary', props: { children: 'Secondary', variant: 'secondary' } },
      { label: 'Outline', props: { children: 'Outline', variant: 'outline' } },
      { label: 'Ghost', props: { children: 'Ghost', variant: 'ghost' } },
    ],
    tags: ['cta', 'action', 'click'],
  },

  Badge: {
    variants: [
      { label: 'Default', props: { children: 'Default' } },
      { label: 'Success', props: { children: 'Success', variant: 'success' } },
      { label: 'Warning', props: { children: 'Warning', variant: 'warning' } },
      { label: 'Error', props: { children: 'Error', variant: 'error' } },
      { label: 'Info', props: { children: 'Info', variant: 'info' } },
    ],
    tags: ['label', 'status', 'pill'],
  },

  Input: {
    exampleProps: { placeholder: 'Type something...' },
    tags: ['text', 'field', 'form'],
  },

  // === Compound components with render functions ===

  Card: {
    render: () => (
      <Card variant="default" className="w-full max-w-[20rem]">
        <CardHeader>
          <h3 className="text-base font-semibold">Card Title</h3>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-sub">Card body content goes here.</p>
        </CardBody>
        <CardFooter>
          <Button variant="outline" size="sm">Action</Button>
        </CardFooter>
      </Card>
    ),
    tags: ['container', 'panel', 'surface'],
  },

  Alert: {
    render: () => (
      <div className="flex flex-col gap-2 w-full">
        <Alert variant="default">This is a default alert.</Alert>
        <Alert variant="success">Operation completed successfully.</Alert>
        <Alert variant="warning">Please review before continuing.</Alert>
        <Alert variant="error">Something went wrong.</Alert>
      </div>
    ),
    tags: ['message', 'banner', 'notification'],
  },

  Select: {
    render: () => {
      // NOTE: This is a static demo — actual Select requires useSelectState
      return (
        <div className="w-full max-w-[16rem]">
          <Label>Choose an option</Label>
          <Button variant="outline" className="w-full justify-between mt-1">
            Select...
          </Button>
        </div>
      );
    },
    renderMode: 'description-only',
    tags: ['dropdown', 'picker', 'choice'],
  },

  Dialog: {
    renderMode: 'description-only',
    tags: ['modal', 'popup', 'confirm'],
  },

  Sheet: {
    renderMode: 'description-only',
    tags: ['drawer', 'panel', 'slide'],
  },

  Popover: {
    renderMode: 'description-only',
    tags: ['popup', 'tooltip', 'float'],
  },

  ContextMenu: {
    renderMode: 'description-only',
    tags: ['right-click', 'menu'],
  },

  DropdownMenu: {
    renderMode: 'description-only',
    tags: ['menu', 'actions', 'overflow'],
  },

  HelpPanel: {
    renderMode: 'description-only',
    tags: ['help', 'docs', 'guide'],
  },

  Toast: {
    renderMode: 'description-only',
    tags: ['notification', 'snackbar', 'message'],
  },

  Tabs: {
    render: () => (
      <div className="w-full border border-line rounded-sm overflow-hidden">
        <div className="flex border-b border-line">
          <button className="px-4 py-2 text-sm font-medium bg-page text-main border-b-2 border-accent">Tab 1</button>
          <button className="px-4 py-2 text-sm text-sub">Tab 2</button>
          <button className="px-4 py-2 text-sm text-sub">Tab 3</button>
        </div>
        <div className="p-4 text-sm text-sub">Tab content area</div>
      </div>
    ),
    tags: ['navigation', 'sections', 'switch'],
  },

  StepperTabs: {
    renderMode: 'description-only',
    tags: ['wizard', 'steps', 'progress'],
  },

  Accordion: {
    render: () => (
      <div className="w-full max-w-[24rem]">
        <Accordion type="single">
          <Accordion.Item value="1">
            <Accordion.Trigger>What is RDNA?</Accordion.Trigger>
            <Accordion.Content>A design token system for portable themes.</Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="2">
            <Accordion.Trigger>How do tokens work?</Accordion.Trigger>
            <Accordion.Content>Semantic tokens reference brand palette values.</Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </div>
    ),
    tags: ['collapse', 'expand', 'faq'],
  },

  Breadcrumbs: {
    exampleProps: {
      items: [
        { label: 'Home', href: '#' },
        { label: 'Components', href: '#' },
        { label: 'Breadcrumbs' },
      ],
    },
    tags: ['path', 'navigation', 'trail'],
  },

  Progress: {
    variants: [
      { label: '25%', props: { value: 25 } },
      { label: '50%', props: { value: 50 } },
      { label: '75%', props: { value: 75 } },
      { label: '100%', props: { value: 100 } },
    ],
    tags: ['loading', 'bar', 'status'],
  },

  Divider: {
    variants: [
      { label: 'Solid', props: { variant: 'solid' } },
      { label: 'Dashed', props: { variant: 'dashed' } },
      { label: 'Decorated', props: { variant: 'decorated' } },
    ],
    tags: ['separator', 'line', 'hr'],
  },

  CountdownTimer: {
    exampleProps: { targetDate: new Date(Date.now() + 86400000).toISOString(), variant: 'default' },
    variants: [
      { label: 'Default', props: { targetDate: new Date(Date.now() + 86400000).toISOString(), variant: 'default' } },
      { label: 'Compact', props: { targetDate: new Date(Date.now() + 86400000).toISOString(), variant: 'compact' } },
      { label: 'Large', props: { targetDate: new Date(Date.now() + 86400000).toISOString(), variant: 'large' } },
    ],
    renderMode: 'contained',
    tags: ['timer', 'clock', 'deadline'],
  },

  Tooltip: {
    render: () => (
      <Tooltip content="Tooltip text">
        <Button variant="outline" size="sm">Hover me</Button>
      </Tooltip>
    ),
    tags: ['hint', 'info', 'hover'],
  },

  Checkbox: {
    variants: [
      { label: 'Unchecked', props: { label: 'Accept terms' } },
      { label: 'Checked', props: { label: 'Accept terms', defaultChecked: true } },
      { label: 'Disabled', props: { label: 'Unavailable', disabled: true } },
    ],
    tags: ['toggle', 'check', 'boolean'],
  },

  Switch: {
    variants: [
      { label: 'Off', props: { label: 'Dark mode' } },
      { label: 'On', props: { label: 'Dark mode', defaultChecked: true } },
    ],
    tags: ['toggle', 'on-off', 'boolean'],
  },

  Slider: {
    exampleProps: { defaultValue: 50, min: 0, max: 100 },
    tags: ['range', 'volume', 'adjust'],
  },

  Spinner: {
    // Spinner is exported from Progress, not its own schema
    // Will be handled separately if needed
    exclude: true,
  },

  Web3ActionBar: {
    renderMode: 'description-only',
    tags: ['wallet', 'web3', 'solana'],
  },

  MockStatesPopover: {
    exclude: true,
  },
};
```

**Important:** This file will need refinement after visual testing. The compound component `render` functions are starting points — some may need adjustment based on how the actual component APIs work (compound vs flat). Read each component's source before finalizing.

**Step 3: Commit**

```bash
git add packages/radiants/registry/registry.overrides.tsx
git commit -m "feat(registry): add component overrides for compound demos"
```

---

## Task 6: Create the registry builder and barrel export [Complete]

**Files:**
- Create: `packages/radiants/registry/build-registry.ts`
- Create: `packages/radiants/registry/index.ts`

**Step 1: Read `packages/radiants/schemas/index.ts`**

Understand how `componentData` is structured. Each entry is `{ schema: SchemaJSON, dna: DnaJSON }`. The `schema` object has `name`, `description`, `props` (with enum `values`), etc.

**Step 2: Create the registry builder**

`packages/radiants/registry/build-registry.ts`:

```ts
import { componentData } from '../schemas';
import { componentMap } from './component-map';
import { overrides } from './registry.overrides';
import type { ComponentEntry, VariantDemo, ComponentCategory } from './types';

/**
 * Generate variant demos from enum props in schema.json.
 * For each prop with `type: "enum"` and `values: [...]`, creates
 * one VariantDemo per value.
 */
function generateVariantsFromSchema(
  props: Record<string, { type?: string; values?: string[]; default?: unknown }>
): VariantDemo[] {
  // Find the primary enum prop (prefer 'variant', then first enum found)
  const enumProps = Object.entries(props).filter(
    ([, def]) => def.type === 'enum' && Array.isArray(def.values)
  );

  if (enumProps.length === 0) return [];

  // Use 'variant' prop if available, otherwise first enum
  const [propName, propDef] = enumProps.find(([k]) => k === 'variant') ?? enumProps[0];
  const values = propDef.values ?? [];

  return values.map((value) => ({
    label: value.charAt(0).toUpperCase() + value.slice(1),
    props: { [propName]: value },
  }));
}

/**
 * Build the full registry from schema data + component map + overrides.
 */
export function buildRegistry(): ComponentEntry[] {
  const entries: ComponentEntry[] = [];

  for (const [name, data] of Object.entries(componentData)) {
    const map = componentMap[name];
    if (!map) continue;

    const override = overrides[name];
    if (override?.exclude) continue;

    const schema = data.schema as {
      name: string;
      category?: ComponentCategory;
      description?: string;
      props?: Record<string, { type?: string; values?: string[]; default?: unknown }>;
    };

    const category = (schema.category ?? 'layout') as ComponentCategory;
    const description = schema.description ?? '';

    // Auto-generate variants from enum props, unless overridden
    const autoVariants = schema.props
      ? generateVariantsFromSchema(schema.props)
      : [];

    const entry: ComponentEntry = {
      name: schema.name ?? name,
      category,
      description,
      component: map.component,
      sourcePath: map.sourcePath,
      schemaPath: map.schemaPath,
      variants: override?.variants ?? (autoVariants.length > 0 ? autoVariants : undefined),
      render: override?.render,
      exampleProps: override?.exampleProps,
      tags: override?.tags,
      renderMode: override?.renderMode,
    };

    entries.push(entry);
  }

  // Sort by category then name
  entries.sort((a, b) => {
    const catCmp = a.category.localeCompare(b.category);
    if (catCmp !== 0) return catCmp;
    return a.name.localeCompare(b.name);
  });

  return entries;
}
```

**Step 3: Create the barrel export**

`packages/radiants/registry/index.ts`:

```ts
export { buildRegistry } from './build-registry';
export { CATEGORIES, CATEGORY_LABELS } from './types';
export type { ComponentEntry, ComponentCategory, VariantDemo, ComponentOverride } from './types';

import { buildRegistry } from './build-registry';

/** Pre-built registry of all RDNA components */
export const registry = buildRegistry();
```

**Step 4: Commit**

```bash
git add packages/radiants/registry/build-registry.ts packages/radiants/registry/index.ts
git commit -m "feat(registry): add registry builder and barrel export"
```

---

## Task 7: Add `./registry` export to package.json [Complete]

**Files:**
- Modify: `packages/radiants/package.json`

**Step 1: Add the export entrypoint**

Add to the `"exports"` field in `packages/radiants/package.json`:

```json
"./registry": {
  "types": "./registry/index.ts",
  "import": "./registry/index.ts"
}
```

Also add `"registry/"` to the `"files"` array if it exists.

**Step 2: Verify the import resolves**

Run:

```bash
pnpm --filter @rdna/radiants exec tsc --noEmit
```

Expected: No type errors.

**Step 3: Commit**

```bash
git add packages/radiants/package.json
git commit -m "feat(registry): add ./registry export to package.json"
```

---

## Task 8: Write registry tests [Complete]

**Files:**
- Create: `packages/radiants/registry/__tests__/registry.test.ts`

**Step 1: Write the test file**

```ts
import { describe, it, expect } from 'vitest';
import { registry, CATEGORIES, CATEGORY_LABELS } from '../index';
import type { ComponentEntry } from '../types';
import { componentData } from '../../schemas';

describe('Component Registry', () => {
  it('contains entries for all non-excluded components', () => {
    // Should have entries for all componentData keys minus excluded ones
    expect(registry.length).toBeGreaterThanOrEqual(20);
  });

  it('every entry has required fields', () => {
    for (const entry of registry) {
      expect(entry.name).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(entry.description).toBeTruthy();
      expect(entry.component).toBeTruthy();
      expect(entry.sourcePath).toMatch(/^packages\/radiants\//);
      expect(entry.schemaPath).toMatch(/\.schema\.json$/);
      expect(CATEGORIES).toContain(entry.category);
    }
  });

  it('every category has a label', () => {
    for (const cat of CATEGORIES) {
      expect(CATEGORY_LABELS[cat]).toBeTruthy();
    }
  });

  it('components with enum props get auto-generated variants', () => {
    const button = registry.find((e) => e.name === 'Button');
    expect(button).toBeDefined();
    expect(button!.variants).toBeDefined();
    expect(button!.variants!.length).toBeGreaterThan(0);
  });

  it('excluded components are not in the registry', () => {
    const mockStates = registry.find((e) => e.name === 'MockStatesPopover');
    expect(mockStates).toBeUndefined();
  });

  it('entries are sorted by category then name', () => {
    for (let i = 1; i < registry.length; i++) {
      const prev = registry[i - 1];
      const curr = registry[i];
      const catCmp = prev.category.localeCompare(curr.category);
      if (catCmp === 0) {
        expect(prev.name.localeCompare(curr.name)).toBeLessThanOrEqual(0);
      } else {
        expect(catCmp).toBeLessThan(0);
      }
    }
  });

  it('compound components have render or renderMode override', () => {
    const compounds = ['Dialog', 'Sheet', 'Select', 'Tabs'];
    for (const name of compounds) {
      const entry = registry.find((e) => e.name === name);
      if (entry) {
        const hasCustomRender = entry.render !== undefined || entry.renderMode === 'description-only';
        expect(hasCustomRender).toBe(true);
      }
    }
  });
});
```

**Step 2: Run the tests**

```bash
pnpm --dir packages/radiants exec vitest run registry/__tests__/registry.test.ts --cache=false
```

Expected: All tests pass.

**Step 3: Fix any failures**

Common issues:
- Import path resolution (may need to adjust `vitest.config.ts` include pattern)
- Missing schemas for components that have different names than their directory
- Override render functions referencing compound APIs that don't match actual exports

**Step 4: Update vitest.config.ts include if needed**

If the test isn't picked up, add `'registry/**/*.test.ts'` to the `include` array in `packages/radiants/vitest.config.ts`.

**Step 5: Commit**

```bash
git add packages/radiants/registry/__tests__/registry.test.ts packages/radiants/vitest.config.ts
git commit -m "test(registry): add registry unit tests"
```

---

## Task 9: Rewrite DesignSystemTab to consume the registry [Complete]

**Files:**
- Rewrite: `apps/rad-os/components/ui/DesignSystemTab.tsx`

This is the largest task. The current 1,634-line file gets replaced with a registry-consuming component modeled after the Phase `ComponentShowcaseCard` pattern.

**Step 1: Read the current DesignSystemTab**

Read `apps/rad-os/components/ui/DesignSystemTab.tsx` fully. Note:
- The `DesignSystemTabProps` interface (`searchQuery?: string`)
- How it's consumed in `BrandAssetsApp.tsx` (no props passed)
- The `Section` and `Row` helper components
- The search/filter behavior

**Step 2: Read the Phase reference implementation**

Read `/Users/rivermassey/Desktop/dev/phase/app/components/page.tsx` and `/Users/rivermassey/Desktop/dev/phase/app/components/_registry.ts` for the showcase card pattern.

**Step 3: Rewrite DesignSystemTab**

Replace the entire file with a registry-consuming implementation. Key structure:

```tsx
'use client';

import { useState, useMemo } from 'react';
import { registry, CATEGORIES, CATEGORY_LABELS } from '@rdna/radiants/registry';
import type { ComponentEntry, ComponentCategory } from '@rdna/radiants/registry';
import { Button } from '@rdna/radiants/components/core';

// ============================================================================
// Showcase Card
// ============================================================================

function ComponentShowcaseCard({ entry }: { entry: ComponentEntry }) {
  const Component = entry.component;

  return (
    <div className="border border-line bg-page p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-base font-heading font-bold text-main">
          {entry.name}
        </h3>
        <span className="text-xs font-heading text-sub bg-depth px-1.5 py-0.5 uppercase">
          {entry.category}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-sub">{entry.description}</p>

      {/* Demo Area */}
      {entry.render ? (
        <div className="border-t border-rule pt-3">
          <p className="text-xs font-heading text-mute uppercase mb-2">Preview</p>
          {entry.render()}
        </div>
      ) : entry.renderMode === 'description-only' ? null : entry.variants && entry.variants.length > 0 ? (
        <div className="border-t border-rule pt-3">
          <p className="text-xs font-heading text-mute uppercase mb-2">Preview</p>
          <div className="flex flex-wrap items-center gap-3">
            {entry.variants.map(({ label, props }) => (
              <div key={label} className="flex flex-col items-start gap-1">
                <Component {...props} />
                <span className="text-xs text-mute mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : entry.exampleProps ? (
        <div className="border-t border-rule pt-3">
          <p className="text-xs font-heading text-mute uppercase mb-2">Preview</p>
          <Component {...entry.exampleProps} />
        </div>
      ) : null}
    </div>
  );
}

// ============================================================================
// DesignSystemTab
// ============================================================================

interface DesignSystemTabProps {
  searchQuery?: string;
}

export function DesignSystemTab({ searchQuery: propSearchQuery = '' }: DesignSystemTabProps) {
  const [activeCategory, setActiveCategory] = useState<ComponentCategory | 'all'>('all');
  const [localSearch, setLocalSearch] = useState('');

  const search = propSearchQuery || localSearch;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return registry.filter((entry) => {
      if (activeCategory !== 'all' && entry.category !== activeCategory) return false;
      if (q) {
        const searchable = [
          entry.name,
          entry.description,
          entry.category,
          ...(entry.tags ?? []),
        ].join(' ').toLowerCase();
        return searchable.includes(q);
      }
      return true;
    });
  }, [search, activeCategory]);

  return (
    <div className="flex flex-col gap-4 p-2">
      {/* Search (only if no external searchQuery) */}
      {!propSearchQuery && (
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search components..."
          className="w-full px-3 py-2 text-sm bg-page border border-line text-main placeholder:text-mute"
        />
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-1">
        <Button
          variant={activeCategory === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveCategory('all')}
        >
          All ({registry.length})
        </Button>
        {CATEGORIES.map((cat) => {
          const count = registry.filter((e) => e.category === cat).length;
          if (count === 0) return null;
          return (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORY_LABELS[cat]} ({count})
            </Button>
          );
        })}
      </div>

      {/* Results */}
      <p className="text-xs text-mute">
        {filtered.length} component{filtered.length !== 1 ? 's' : ''}
        {search && ` matching "${search}"`}
      </p>

      {/* Component grid */}
      <div className="flex flex-col gap-3">
        {filtered.map((entry) => (
          <ComponentShowcaseCard key={entry.name} entry={entry} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-sub py-8 text-center">
            No components match your search.
          </p>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Verify BrandAssetsApp still works**

Run:

```bash
pnpm --filter rad-os dev
```

Navigate to BrandAssets → Components tab. Verify:
- Components render in category groups
- Category filter tabs work
- Search works
- Compound components show render previews or "description-only"
- Simple components show variant demos

**Step 5: Commit**

```bash
git add apps/rad-os/components/ui/DesignSystemTab.tsx
git commit -m "feat(brand-assets): rewrite DesignSystemTab to consume shared registry"
```

---

## Task 10: Create component creation skill [Deferred]

**Files:**
- Create: `.claude/skills/scaffold-component.md`

**Step 1: Create the skill**

```markdown
# scaffold-component

Scaffold a new RDNA component with all required files.

## Trigger

When user says "scaffold component", "new component", "create component", or "/scaffold-component <Name>".

## Process

1. Ask for component name (PascalCase)
2. Ask for category (action | layout | form | feedback | navigation | overlay | data-display)
3. Ask for one-line description

## Files Created

- `packages/radiants/components/core/{Name}/{Name}.tsx`
- `packages/radiants/components/core/{Name}/{Name}.schema.json`
- `packages/radiants/components/core/{Name}/{Name}.dna.json`
- `packages/radiants/components/core/{Name}/{Name}.test.tsx`

## Templates

### {Name}.schema.json
\`\`\`json
{
  "name": "{Name}",
  "category": "{category}",
  "description": "{description}",
  "props": {},
  "slots": {},
  "examples": []
}
\`\`\`

### {Name}.dna.json
\`\`\`json
{
  "component": "{Name}",
  "tokenBindings": {
    "default": {}
  }
}
\`\`\`

### {Name}.test.tsx
\`\`\`tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { {Name} } from './{Name}';

describe('{Name}', () => {
  it('renders without crashing', () => {
    render(<{Name} />);
  });
});
\`\`\`

## After Creation

1. Add export to `packages/radiants/components/core/index.ts`
2. Add entry to `packages/radiants/schemas/index.ts`
3. Add override to `packages/radiants/registry/registry.overrides.tsx` if compound component
4. Run `pnpm --filter @rdna/radiants exec tsc --noEmit` to verify
```

**Step 2: Commit**

```bash
git add .claude/skills/scaffold-component.md
git commit -m "feat(skills): add scaffold-component skill for RDNA components"
```

---

## Verification Checklist

After all tasks:

1. `pnpm --filter @rdna/radiants exec tsc --noEmit` — no type errors
2. `pnpm --dir packages/radiants exec vitest run registry/__tests__/registry.test.ts --cache=false` — all tests pass
3. `pnpm lint:design-system` — no new warnings
4. `pnpm --filter rad-os dev` — BrandAssets Components tab renders all components from registry
5. Registry has entries for 24+ components (all minus excluded dev tools)
6. Category filtering works
7. Search works across name, description, tags

## Open Questions (Resolved)

1. **Manifest JSON committed?** — No. Registry is a TS module, no manifest needed.
2. **Generator script?** — No. `build-registry.ts` runs at import time, no build step.
3. **Compound components?** — Parent only. `render` function in overrides for custom demos.
4. **Creation skill test file?** — Yes, scaffold includes a minimal test.
