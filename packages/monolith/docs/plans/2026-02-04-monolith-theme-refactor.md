# Monolith Theme Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor `@rdna/monolith` to match `apps/monolith-hackathon` styling, enabling the app to swap to the theme with minimal changes.

**Architecture:** Three-phase approach: (1) Foundation - fix tokens, entry point, fonts; (2) Component migration - move 12 components from app to theme using DNA 3-file pattern; (3) Documentation - create REFRACTOR_NOTES.md migration guide.

**Tech Stack:** Tailwind CSS v4, Radix UI (tabs, accordion), React 18/19, TypeScript, Zustand, `use-scramble`, `@paper-design/shaders-react`

**Schema Format:** Use the `json-render` component schema format (match existing files in `packages/monolith/components/core/*.schema.json`), not JSON Schema.

**Brainstorm Reference:** `docs/brainstorms/2026-02-04-monolith-theme-refactor-brainstorm.md`

---

## Phase 1: Foundation (Tokens, Entry Point, Units)

### Task 1.1: Update Entry Point

**Files:**
- Modify: `packages/monolith/index.css`

**Step 1: Add Tailwind import to entry point**

Update `index.css` to match radiants pattern:

```css
/* =============================================================================
   @rdna/monolith - Main Entry Point
   CRT cyberpunk aesthetic with glassmorphic windows
   Solana Mobile Hackathon Theme
   ============================================================================= */

@import 'tailwindcss';

@import './tokens.css';
@import './fonts.css';
@import './typography.css';
@import './base.css';
@import './animations.css';
```

**Step 2: Verify file saved correctly**

Run: `rg "@import 'tailwindcss'" packages/monolith/index.css`

**Step 3: Commit**

```bash
git add packages/monolith/index.css
git commit -m "feat(monolith): add tailwindcss import to entry point

Matches radiants pattern for Tailwind v4 integration.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.2: Consolidate Color Tokens

**Files:**
- Modify: `packages/monolith/tokens.css`

**Step 1: Add missing tokens from app**

Add these tokens to the `@theme inline` block (after line 46, before the closing `}`):

```css
  /* Bevel Colors (for beveled borders) */
  --color-bevel-hi: rgba(167, 145, 216, 0.45);
  --color-bevel-lo: #553691;

  /* Additional Surface */
  --color-surface-body: #060b0a;

  /* Gradient Colors (for button-mono variant) */
  --color-gradient-start: #fc8e43;
  --color-gradient-mid: #ef5c6f;
  --color-gradient-end: #6939c9;

  /* Category Colors (for calendar/badges) */
  --color-category-launch: #14f1b2;
  --color-category-vibecoding: #fd8f3a;
  --color-category-devshop: #6939ca;
  --color-category-deadline: #ef5c6f;
  --color-category-milestone: #b494f7;
  --color-category-mtndao: #8dfff0;
```

**Step 2: Add semantic tokens for bevel/gradient**

Add to `@theme` block (after `--color-status-info`):

```css
  /* ============================================
     TIER 2: SEMANTIC TOKENS - Bevel
     For 3D beveled border effects
     ============================================ */

  --color-bevel-highlight: var(--color-bevel-hi);
  --color-bevel-shadow: var(--color-bevel-lo);

  /* ============================================
     TIER 2: SEMANTIC TOKENS - Gradient
     For gradient button backgrounds
     ============================================ */

  --gradient-action-primary: linear-gradient(76deg, var(--color-gradient-start), var(--color-gradient-mid) 46%, var(--color-gradient-end));
  --gradient-action-hover: linear-gradient(76deg, #fd8f3a, #ff6b7f 46%, #8b5cf6);
  --gradient-action-active: linear-gradient(76deg, #d9743a, #c94d5e 46%, #5530a3);
  --gradient-glass: linear-gradient(225deg, rgba(141, 255, 240, 0.7), rgba(20, 241, 178, 0.5));
```

**Step 3: Commit**

```bash
git add packages/monolith/tokens.css
git commit -m "feat(monolith): add bevel, gradient, and category color tokens

Adds missing tokens from app:
- Bevel colors for 3D border effects
- Gradient colors for button-mono variant
- Category colors for calendar/badges

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.3: Add Space Easing Curves

**Files:**
- Modify: `packages/monolith/tokens.css`

**Step 1: Add easing curves to @theme block**

Add after `--easing-in-out` (around line 200):

```css
  /* Space easing — symmetric thrust curves */
  --easing-drift: cubic-bezier(0.45, 0, 0.55, 1);   /* Gentle float */
  --easing-dock: cubic-bezier(0.25, 0, 0.55, 1);    /* Decelerate to stop */
  --easing-launch: cubic-bezier(0.45, 0, 0.75, 1);  /* Accelerate away */
  --easing-photon: cubic-bezier(0.2, 0, 0.8, 1);    /* Near-instant */
```

**Step 2: Commit**

```bash
git add packages/monolith/tokens.css
git commit -m "feat(monolith): add space-themed easing curves

Adds --easing-drift, --easing-dock, --easing-launch, --easing-photon
for space/sci-fi motion feel.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.4: Stabilize Viewport Scaling (Keep em)

**Files:**
- Modify: `packages/monolith/typography.css`

**Step 1: Keep spacing + typography tokens in em (no conversion)**

The theme relies on viewport‑driven scaling. Do not convert em tokens to rem.

**Step 2: Clamp the base font size to prevent extremes**

Update the `body` font size to use `clamp()` and remove the 1920/1440 overrides:

```css
body {
  font-size: clamp(14px, 1vw, 16px);
}
```

**Step 3: Commit**

```bash
git add packages/monolith/typography.css
git commit -m "feat(monolith): clamp body font-size for stable vw scaling

Keeps em-based tokens while preventing extreme viewport scaling.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.5: Add `--font-body` Alias (Keep `--font-sans`)

**Files:**
- Modify: `packages/monolith/fonts.css`
- Modify: `packages/monolith/typography.css`

**Step 1: Update fonts.css**

In the `@theme` block of `fonts.css`, add `--font-body` and keep `--font-sans` as an alias:

```css
@theme {
  --font-ui: 'Pixeloid Sans', 'Trebuchet MS', sans-serif;
  --font-body: 'PP Mori', Georgia, sans-serif;
  --font-sans: var(--font-body);
  --font-heading: 'Mondwest', 'Times New Roman', sans-serif;
  --font-mono: 'Pixeloid Mono', ui-monospace, monospace;
}
```

**Step 2: Update typography.css references**

Replace `var(--font-sans)` with `var(--font-body)` in `typography.css` so new code uses the body token.

Keep the alias so existing consumers don’t break.

**Step 3: Verify references**

Run: `rg "font-sans" packages/monolith`

Expected: references only in `fonts.css` alias (and possibly legacy docs).

**Step 4: Commit**

```bash
git add packages/monolith/fonts.css packages/monolith/typography.css
git commit -m "feat(monolith): add --font-body alias for PP Mori

Keeps --font-sans for backward compatibility.
Updates typography to use --font-body.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 1.6: Keep Border Radius in em

No change required. Border radius tokens should stay em‑based to scale with the viewport‑driven typography system.

---

## Phase 2: Component Updates

### Task 2.1: Add Mono Variant to Button

**Files:**
- Modify: `packages/monolith/components/core/Button/Button.tsx`
- Modify: `packages/monolith/components/core/Button/Button.schema.json`
- Modify: `packages/monolith/components/core/Button/Button.dna.json`

**Step 1: Add 'mono' to variant type**

Update ButtonProps interface in `Button.tsx`:

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'mono';
  // ... rest unchanged
}
```

**Step 2: Add mono variant styles**

Add to `variantStyles` object:

```typescript
const variantStyles = {
  // ... existing variants ...
  mono: `
    bg-[var(--gradient-action-primary)]
    text-content-primary
    [border-top-color:var(--color-bevel-highlight)]
    [border-left-color:var(--color-bevel-highlight)]
    [border-bottom-color:var(--color-bevel-shadow)]
    [border-right-color:var(--color-bevel-shadow)]
    shadow-btn
    [text-shadow:0_0_0.1rem_rgba(255,255,255,0.3)]
    hover:bg-[var(--gradient-action-hover)]
    hover:shadow-[0_0_2rem_0_var(--color-magma),0_0.25rem_0_0_var(--color-black)]
    hover:-translate-y-[0.125rem]
    active:bg-[var(--gradient-action-active)]
    active:shadow-none active:translate-y-[0.125rem]
    active:[border-top-color:var(--color-bevel-shadow)]
    active:[border-left-color:var(--color-bevel-shadow)]
    active:[border-bottom-color:var(--color-bevel-highlight)]
    active:[border-right-color:var(--color-bevel-highlight)]
  `,
};
```

**Step 3: Update Button.schema.json**

Add 'mono' to the existing json‑render schema:

```json
{
  "name": "Button",
  "description": "Button component with Monolith retro lift effect",
  "props": {
    "variant": {
      "type": "enum",
      "values": ["primary", "secondary", "outline", "ghost", "mono"],
      "default": "primary",
      "description": "Visual style. 'mono' is gradient button with bevel effect."
    }
  }
}
```

**Step 4: Update Button.dna.json**

Add mono token bindings to the existing `tokenBindings` structure:

```json
{
  "component": "Button",
  "tokenBindings": {
    "mono": {
      "background": "gradient-action-primary",
      "text": "content-primary",
      "borderHighlight": "bevel-highlight",
      "borderShadow": "bevel-shadow",
      "shadow": "btn",
      "hoverBackground": "gradient-action-hover",
      "activeBackground": "gradient-action-active"
    }
  }
}
```

**Step 5: Commit**

```bash
git add packages/monolith/components/core/Button/
git commit -m "feat(monolith): add 'mono' gradient variant to Button

Adds the gradient button style from the app as a new variant.
Features bevel borders and gradient background.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2.2: Install Radix Dependencies

**Files:**
- Modify: `packages/monolith/package.json`

**Step 1: Add Radix peer dependencies**

Run:

```bash
cd /Users/rivermassey/Desktop/dev/DNA/packages/monolith
pnpm add @radix-ui/react-tabs @radix-ui/react-accordion use-scramble @paper-design/shaders-react --save-peer
```

**Step 2: Verify package.json updated**

Run: `rg "@radix-ui|use-scramble|@paper-design/shaders-react" packages/monolith/package.json`

Expected: All four packages in peerDependencies

**Step 3: Commit**

```bash
git add packages/monolith/package.json
git commit -m "feat(monolith): add Radix UI as peer dependencies

Adds @radix-ui/react-tabs and @radix-ui/react-accordion
for accessible interactive components.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2.3: Create CrtTabs Component

**Files:**
- Create: `packages/monolith/components/core/CrtTabs/CrtTabs.tsx`
- Create: `packages/monolith/components/core/CrtTabs/CrtTabs.schema.json`
- Create: `packages/monolith/components/core/CrtTabs/CrtTabs.dna.json`
- Create: `packages/monolith/components/core/CrtTabs/index.ts`
- Modify: `packages/monolith/components/core/index.ts`

**Step 1: Create CrtTabs.tsx (compound API to match app)**

```tsx
'use client';

import * as Tabs from '@radix-ui/react-tabs';
import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface CrtTabsProps {
  /** Default selected tab value */
  defaultValue?: string;
  /** Controlled value */
  value?: string;
  /** Callback when tab changes */
  onValueChange?: (value: string) => void;
  /** Children (List/Trigger/Content) */
  children: React.ReactNode;
  /** Additional class for root */
  className?: string;
}

interface CrtTabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface CrtTabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface CrtTabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function CrtTabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className = '',
}: CrtTabsProps) {
  return (
    <Tabs.Root
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      {children}
    </Tabs.Root>
  );
}

function CrtTabsList({ children, className = '' }: CrtTabsListProps) {
  return <Tabs.List className={`crt-tab-list ${className}`}>{children}</Tabs.List>;
}

function CrtTabsTrigger({ value, children, className = '' }: CrtTabsTriggerProps) {
  return (
    <Tabs.Trigger value={value} className={`crt-tab-trigger ${className}`}>
      {children}
    </Tabs.Trigger>
  );
}

function CrtTabsContent({ value, children, className = '' }: CrtTabsContentProps) {
  return (
    <Tabs.Content value={value} className={`crt-tab-content ${className}`}>
      {children}
    </Tabs.Content>
  );
}

CrtTabs.List = CrtTabsList;
CrtTabs.Trigger = CrtTabsTrigger;
CrtTabs.Content = CrtTabsContent;

export default CrtTabs;
```

**Step 1b: Move CRT tab styles into the theme**

Copy the `.crt-tab-*` blocks from `apps/monolith-hackathon/app/globals.css` into an appropriate theme stylesheet (e.g. `packages/monolith/base.css` or a new `components.css` that is imported by `index.css`).

**Step 2: Create CrtTabs.schema.json (json-render format)**

```json
{
  "name": "CrtTabs",
  "description": "CRT-styled tabs with Radix UI accessibility (compound API)",
  "props": {
    "defaultValue": { "type": "string", "description": "Initially selected tab value" },
    "value": { "type": "string", "description": "Controlled selected value" },
    "onValueChange": { "type": "function", "description": "Called when tab changes" },
    "children": { "type": "ReactNode", "description": "List/Trigger/Content children" },
    "className": { "type": "string", "default": "" }
  },
  "subcomponents": ["List", "Trigger", "Content"]
}
```

**Step 3: Create CrtTabs.dna.json**

```json
{
  "component": "CrtTabs",
  "tokenBindings": {
    "list": {
      "background": "surface-elevated",
      "border": "edge-primary"
    },
    "trigger": {
      "text": "content-secondary",
      "activeText": "content-primary",
      "activeBackground": "action-secondary"
    },
    "content": {
      "background": "surface-elevated",
      "border": "edge-primary"
    }
  }
}
```

**Step 4: Create index.ts**

```typescript
export { CrtTabs } from './CrtTabs';
export type { CrtTabsProps } from './CrtTabs';
```

**Step 5: Update components/core/index.ts**

Add export:

```typescript
export { CrtTabs } from './CrtTabs';
export type { CrtTabsProps } from './CrtTabs';
```

**Step 6: Commit**

```bash
git add packages/monolith/components/core/CrtTabs/
git add packages/monolith/components/core/index.ts
git commit -m "feat(monolith): add CrtTabs component with Radix UI

Accessible tabs component with CRT styling.
- Full keyboard navigation
- ARIA compliant via Radix
- DNA 3-file pattern

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2.4: Create CrtAccordion Component

**Files:**
- Create: `packages/monolith/components/core/CrtAccordion/CrtAccordion.tsx`
- Create: `packages/monolith/components/core/CrtAccordion/CrtAccordion.schema.json`
- Create: `packages/monolith/components/core/CrtAccordion/CrtAccordion.dna.json`
- Create: `packages/monolith/components/core/CrtAccordion/index.ts`
- Modify: `packages/monolith/components/core/index.ts`

**Step 1: Create CrtAccordion.tsx (compound API to match app)**

```tsx
'use client';

import * as Accordion from '@radix-ui/react-accordion';
import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface CrtAccordionProps {
  /** Allow multiple items open */
  type?: 'single' | 'multiple';
  /** Default open item(s) */
  defaultValue?: string | string[];
  /** Collapsible when type is single */
  collapsible?: boolean;
  /** Additional class for root */
  className?: string;
  /** Children (Item/Trigger/Content) */
  children: React.ReactNode;
}

interface CrtAccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface CrtAccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface CrtAccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function CrtAccordion({
  type = 'single',
  defaultValue,
  collapsible = true,
  className = '',
  children,
}: CrtAccordionProps) {
  return (
    <Accordion.Root
      type={type}
      defaultValue={
        type === 'single'
          ? (defaultValue as string | undefined)
          : (defaultValue as string[] | undefined)
      }
      collapsible={type === 'single' ? collapsible : undefined}
      className={className}
    >
      {children}
    </Accordion.Root>
  );
}

function CrtAccordionItem({ value, children, className = '' }: CrtAccordionItemProps) {
  return (
    <Accordion.Item value={value} className={`crt-accordion-item ${className}`}>
      {children}
    </Accordion.Item>
  );
}

function CrtAccordionTrigger({ children, className = '' }: CrtAccordionTriggerProps) {
  return (
    <Accordion.Header>
      <Accordion.Trigger className={`crt-accordion-trigger ${className}`}>
        {children}
        <svg width={12} height={12} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M7,4H9V7H12V9H9V12H7V9H4V7H7V4Z" />
        </svg>
      </Accordion.Trigger>
    </Accordion.Header>
  );
}

function CrtAccordionContent({ children, className = '' }: CrtAccordionContentProps) {
  return (
    <Accordion.Content
      className={`crt-accordion-content data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up ${className}`}
    >
      {children}
    </Accordion.Content>
  );
}

CrtAccordion.Item = CrtAccordionItem;
CrtAccordion.Trigger = CrtAccordionTrigger;
CrtAccordion.Content = CrtAccordionContent;

export default CrtAccordion;
```

**Step 1b: Move CRT accordion styles into the theme**

Copy the `.crt-accordion-*` blocks from `apps/monolith-hackathon/app/globals.css` into an appropriate theme stylesheet (e.g. `packages/monolith/base.css` or a new `components.css` that is imported by `index.css`).

**Step 2: Create CrtAccordion.schema.json (json-render format)**

```json
{
  "name": "CrtAccordion",
  "description": "CRT-styled accordion with Radix UI accessibility (compound API)",
  "props": {
    "type": { "type": "enum", "values": ["single", "multiple"], "default": "single" },
    "defaultValue": { "type": "string", "description": "Default open item(s)" },
    "collapsible": { "type": "boolean", "default": true },
    "children": { "type": "ReactNode", "description": "Item/Trigger/Content children" },
    "className": { "type": "string", "default": "" }
  },
  "subcomponents": ["Item", "Trigger", "Content"]
}
```

**Step 3: Create CrtAccordion.dna.json**

```json
{
  "component": "CrtAccordion",
  "tokenBindings": {
    "item": { "background": "surface-elevated", "border": "edge-primary" },
    "trigger": { "text": "content-primary" },
    "content": { "text": "content-secondary" }
  }
}
```

**Step 4: Create index.ts**

```typescript
export { CrtAccordion } from './CrtAccordion';
export type { CrtAccordionProps } from './CrtAccordion';
```

**Step 5: Update components/core/index.ts**

Add export:

```typescript
export { CrtAccordion } from './CrtAccordion';
export type { CrtAccordionProps } from './CrtAccordion';
```

**Step 6: Add accordion animations to animations.css**

Add to `packages/monolith/animations.css`:

```css
/* Accordion animations */
@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}

.animate-accordion-down {
  animation: accordion-down 200ms ease-out;
}

.animate-accordion-up {
  animation: accordion-up 200ms ease-out;
}
```

**Step 7: Commit**

```bash
git add packages/monolith/components/core/CrtAccordion/
git add packages/monolith/components/core/index.ts
git add packages/monolith/animations.css
git commit -m "feat(monolith): add CrtAccordion component with Radix UI

Accessible accordion component with CRT styling.
- Full keyboard navigation
- ARIA compliant via Radix
- Expand/collapse animations
- DNA 3-file pattern

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2.5: Create Badge Component

**Files:**
- Create: `packages/monolith/components/core/Badge/Badge.tsx`
- Create: `packages/monolith/components/core/Badge/Badge.schema.json`
- Create: `packages/monolith/components/core/Badge/Badge.dna.json`
- Create: `packages/monolith/components/core/Badge/index.ts`

**Step 1: Create Badge.tsx**

```tsx
import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface BadgeProps {
  /** Badge content */
  children: React.ReactNode;
  /** Color variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'custom';
  /** Custom background color (for variant='custom') */
  color?: string;
  /** Size */
  size?: 'sm' | 'md';
  /** Additional classes */
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const baseStyles = `
  inline-flex items-center justify-center
  font-ui uppercase tracking-wider
  rounded-xs
  whitespace-nowrap
`;

const sizeStyles = {
  sm: 'px-2 py-0.5 text-2xs',
  md: 'px-3 py-1 text-xs',
};

const variantStyles = {
  default: 'bg-surface-muted text-content-primary',
  success: 'bg-status-success text-content-inverted',
  warning: 'bg-status-warning text-content-inverted',
  error: 'bg-status-error text-content-inverted',
  info: 'bg-status-info text-content-inverted',
  custom: '', // Color set via style prop
};

// ============================================================================
// Component
// ============================================================================

/**
 * Badge component for status indicators and labels
 *
 * @example
 * <Badge variant="success">Completed</Badge>
 * <Badge variant="custom" color="#14f1b2">Launch</Badge>
 */
export function Badge({
  children,
  variant = 'default',
  color,
  size = 'sm',
  className = '',
}: BadgeProps) {
  const styles = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    className,
  ].filter(Boolean).join(' ');

  const inlineStyle = variant === 'custom' && color
    ? { backgroundColor: color, color: '#000' }
    : undefined;

  return (
    <span className={styles} style={inlineStyle}>
      {children}
    </span>
  );
}

export default Badge;
```

**Step 2: Create schema and dna files**

Create `Badge.schema.json`:

```json
{
  "name": "Badge",
  "description": "Status indicator badge",
  "props": {
    "children": { "type": "ReactNode", "description": "Badge content" },
    "variant": {
      "type": "enum",
      "values": ["default", "success", "warning", "error", "info", "custom"],
      "default": "default"
    },
    "color": { "type": "string", "description": "Custom color for variant='custom'" },
    "size": { "type": "enum", "values": ["sm", "md"], "default": "sm" },
    "className": { "type": "string", "default": "" }
  },
  "slots": {
    "children": { "description": "Badge content" }
  }
}
```

Create `Badge.dna.json`:

```json
{
  "component": "Badge",
  "tokenBindings": {
    "default": { "background": "surface-muted", "text": "content-primary" },
    "success": { "background": "status-success", "text": "content-inverted" },
    "warning": { "background": "status-warning", "text": "content-inverted" },
    "error": { "background": "status-error", "text": "content-inverted" },
    "info": { "background": "status-info", "text": "content-inverted" }
  }
}
```

**Step 3: Create index.ts and update exports**

```typescript
export { Badge } from './Badge';
export type { BadgeProps } from './Badge';
```

Update `components/core/index.ts`:

```typescript
export { Badge } from './Badge';
export type { BadgeProps } from './Badge';
```

**Step 4: Commit**

```bash
git add packages/monolith/components/core/Badge/
git add packages/monolith/components/core/index.ts
git commit -m "feat(monolith): add Badge component

Status indicator badges with semantic color variants.
Extracted from app's StatusBadge/AssetStatusBadge patterns.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2.6: Create Card Component

**Files:**
- Create: `packages/monolith/components/core/Card/Card.tsx`
- Create: `packages/monolith/components/core/Card/Card.schema.json`
- Create: `packages/monolith/components/core/Card/Card.dna.json`
- Create: `packages/monolith/components/core/Card/index.ts`

**Step 1: Create Card.tsx**

```tsx
import React from 'react';

// ============================================================================
// Types
// ============================================================================

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: 'default' | 'elevated' | 'glass';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Additional classes */
  className?: string;
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const baseStyles = `
  border border-edge-primary
  rounded-sm
`;

const variantStyles = {
  default: 'bg-surface-elevated shadow-card',
  elevated: 'bg-surface-elevated shadow-card-lg',
  glass: `
    bg-[var(--gradient-glass)]
    backdrop-blur-md
    shadow-card
    hover:shadow-card-hover
    transition-shadow duration-200
  `,
};

const paddingStyles = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

// ============================================================================
// Component
// ============================================================================

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
}: CardProps) {
  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-center gap-2 mb-3 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h4 className={`font-heading text-lg text-content-primary ${className}`}>
      {children}
    </h4>
  );
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`text-content-secondary ${className}`}>
      {children}
    </div>
  );
}

export default Card;
```

**Step 2: Create schema and dna files**

Create `Card.schema.json`:

```json
{
  "name": "Card",
  "description": "Container card with CRT styling",
  "props": {
    "variant": {
      "type": "enum",
      "values": ["default", "elevated", "glass"],
      "default": "default"
    },
    "padding": {
      "type": "enum",
      "values": ["none", "sm", "md", "lg"],
      "default": "md"
    },
    "children": { "type": "ReactNode", "description": "Card content" },
    "className": { "type": "string", "default": "" }
  },
  "subcomponents": ["CardHeader", "CardTitle", "CardContent"]
}
```

Create `Card.dna.json`:

```json
{
  "component": "Card",
  "tokenBindings": {
    "default": { "background": "surface-elevated", "shadow": "card" },
    "elevated": { "background": "surface-elevated", "shadow": "card-lg" },
    "glass": { "background": "gradient-glass", "shadow": "card" }
  },
  "subcomponents": ["CardHeader", "CardTitle", "CardContent"]
}
```

**Step 3: Create index.ts and update exports**

```typescript
export { Card, CardHeader, CardTitle, CardContent } from './Card';
export type { CardProps, CardHeaderProps, CardTitleProps, CardContentProps } from './Card';
```

**Step 4: Commit**

```bash
git add packages/monolith/components/core/Card/
git add packages/monolith/components/core/index.ts
git commit -m "feat(monolith): add Card component with subcomponents

Container cards with default, elevated, and glass variants.
Includes CardHeader, CardTitle, CardContent subcomponents.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: Remaining Component Migrations

### Task 3.1: Create InfoWindow Component

Migrate `apps/monolith-hackathon/app/components/InfoWindow.tsx` to theme.

**Files:**
- Create: `packages/monolith/components/core/InfoWindow/InfoWindow.tsx`
- Create: `packages/monolith/components/core/InfoWindow/InfoWindow.schema.json`
- Create: `packages/monolith/components/core/InfoWindow/InfoWindow.dna.json`
- Create: `packages/monolith/components/core/InfoWindow/index.ts`

This is a large component. Read the source from app, refactor to use theme tokens, and create the 3-file pattern.

Key changes:
- Replace hardcoded colors with token references
- Keep em units (do not convert to rem)
- Use semantic tokens (bg-surface-elevated, text-content-primary, etc.)

---

### Task 3.2: Create CountdownTimer Component

**Files:**
- Create: `packages/monolith/components/core/CountdownTimer/`

Migrate from `apps/monolith-hackathon/app/components/CountdownTimer.tsx`.

---

### Task 3.3: Create AnimatedSubtitle Component

**Files:**
- Create: `packages/monolith/components/core/AnimatedSubtitle/`

Migrate from `apps/monolith-hackathon/app/components/AnimatedSubtitle.tsx`.

---

### Task 3.4: Create OrbitalNav Component

**Files:**
- Create: `packages/monolith/components/core/OrbitalNav/`

Migrate from `apps/monolith-hackathon/app/components/OrbitalNav.tsx`.

---

### Task 3.5: Create ShaderBackground Component

**Files:**
- Create: `packages/monolith/components/core/ShaderBackground/`

Migrate from `apps/monolith-hackathon/app/components/ShaderBackground.tsx`.

---

### Task 3.6: Create CalendarGrid Component

**Files:**
- Create: `packages/monolith/components/core/CalendarGrid/`

Migrate from `apps/monolith-hackathon/app/intern/CalendarGrid.tsx`.

Key changes:
- Replace CATEGORY_COLORS hardcoded values with --color-category-* tokens
- Keep em units

---

---

## Phase 4: Documentation

### Task 4.1: Create REFRACTOR_NOTES.md

**Files:**
- Create: `packages/monolith/REFRACTOR_NOTES.md`

**Content:**

```markdown
# Monolith Theme Refactor Notes

## Migration Guide for apps/monolith-hackathon

### Step 1: Install Theme

```bash
pnpm add @rdna/monolith
```

### Step 2: Update globals.css

Replace the entire contents with:

```css
@import '@rdna/monolith';

/* App-specific overrides only */
```

### Step 3: Token Mapping

| App Variable | Theme Token | Notes |
|--------------|-------------|-------|
| `--black` | `--color-black` | Use `bg-surface-primary` instead |
| `--white` | `--color-white` | Use `text-content-primary` instead |
| `--green` | `--color-green` | Use `text-content-secondary` or `bg-action-success` |
| `--ultraviolet` | `--color-ultraviolet` | Use `bg-action-secondary` |
| `--magma` | `--color-magma` | Use `bg-action-primary` |
| `--amber` | `--color-amber` | Use `bg-action-accent` |
| `--ocean` | `--color-ocean` | Use `bg-surface-elevated` |
| `--slate` | `--color-slate` | Use `bg-surface-muted` |
| `--ease-drift` | `--easing-drift` | |
| `--ease-dock` | `--easing-dock` | |
| `--ease-launch` | `--easing-launch` | |
| `--ease-photon` | `--easing-photon` | |
| `--bevel-hi` | `--color-bevel-highlight` | |
| `--bevel-lo` | `--color-bevel-shadow` | |

### Step 4: Font Token Changes

`--font-body` is added and `--font-sans` remains as an alias for backward compatibility.

| Recommended | Alias |
|-------------|-------|
| `var(--font-body)` | `var(--font-sans)` |

### Step 5: Viewport Scaling (Keep em)

The theme keeps em‑based tokens. The only change is clamping the base font size:

```css
body { font-size: clamp(14px, 1vw, 16px); }
```

### Step 6: Component Replacements

| App Component | Theme Component | Import |
|---------------|-----------------|--------|
| `.button_mono` class | `<Button variant="mono">` | `@rdna/monolith/components` |
| `CrtTabs` | `<CrtTabs>` | `@rdna/monolith/components` |
| `CrtAccordion` | `<CrtAccordion>` | `@rdna/monolith/components` |
| `InfoWindow` | `<InfoWindow>` | `@rdna/monolith/components` |

### CSS Blocks to Delete from globals.css

After migration, these sections can be removed:

- [ ] Lines 7-48: Font @font-face declarations
- [ ] Lines 54-73: :root color variables
- [ ] Lines 79-121: Base styles (box-sizing, body)
- [ ] Lines 399-454: .button_mono styles
- [ ] All @keyframes that duplicate theme animations

### New Components API

#### CrtTabs

```tsx
import { CrtTabs } from '@rdna/monolith/components';

<CrtTabs
  items={[
    { value: 'tab1', label: 'First', content: <div>Content 1</div> },
    { value: 'tab2', label: 'Second', content: <div>Content 2</div> },
  ]}
  defaultValue="tab1"
/>
```

#### CrtAccordion

```tsx
import { CrtAccordion } from '@rdna/monolith/components';

<CrtAccordion
  items={[
    { value: 'item1', trigger: 'Question 1', content: <p>Answer 1</p> },
    { value: 'item2', trigger: 'Question 2', content: <p>Answer 2</p> },
  ]}
  type="single"
  collapsible
/>
```

#### Badge

```tsx
import { Badge } from '@rdna/monolith/components';

<Badge variant="success">Complete</Badge>
<Badge variant="custom" color="#14f1b2">Launch</Badge>
```

#### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@rdna/monolith/components';

<Card variant="glass">
  <CardHeader>
    <Badge variant="info">New</Badge>
  </CardHeader>
  <CardTitle>Title</CardTitle>
  <CardContent>Content here</CardContent>
</Card>
```

#### Button (mono variant)

```tsx
import { Button } from '@rdna/monolith/components';

<Button variant="mono">Gradient Button</Button>
```
```

**Step 2: Commit**

```bash
git add packages/monolith/REFRACTOR_NOTES.md
git commit -m "docs(monolith): add REFRACTOR_NOTES.md migration guide

Documents token mapping, font changes, unit conversion,
component replacements, and CSS blocks to delete.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 4.2: Update Package Exports

**Files:**
- Modify: `packages/monolith/package.json`

Ensure all new components are exported:

```json
{
  "exports": {
    ".": "./index.css",
    "./components": "./components/core/index.ts",
    "./components/*": "./components/core/*/index.ts",
    "./hooks": "./hooks/index.ts",
    "./tokens": "./tokens.css",
    "./animations": "./animations.css",
    "./base": "./base.css",
    "./typography": "./typography.css",
    "./fonts": "./fonts.css"
  }
}
```

---

### Task 4.3: Final Verification

**Step 1: Run type check**

```bash
cd /Users/rivermassey/Desktop/dev/DNA/packages/monolith
pnpm tsc --noEmit
```

**Step 2: Verify all exports work**

```bash
# Check component exports resolve
node -e "console.log(require.resolve('@rdna/monolith/components'))"
```

**Step 3: Create final commit**

```bash
git add .
git commit -m "chore(monolith): complete theme refactor

Phase 1: Foundation (tokens, entry point, units)
Phase 2: Component updates (Button mono, CrtTabs, CrtAccordion, Badge, Card)
Phase 3: Component migrations (InfoWindow, CountdownTimer, etc.)
Phase 4: Documentation (REFRACTOR_NOTES.md)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

| Phase | Tasks | Components |
|-------|-------|------------|
| 1. Foundation | 6 tasks | tokens, entry, fonts, units |
| 2. Component Updates | 6 tasks | Button, CrtTabs, CrtAccordion, Badge, Card |
| 3. Migrations | 6 tasks | InfoWindow, CountdownTimer, AnimatedSubtitle, OrbitalNav, ShaderBackground, CalendarGrid |
| 4. Documentation | 3 tasks | REFRACTOR_NOTES.md, exports, verification |

**Total: 21 tasks**
