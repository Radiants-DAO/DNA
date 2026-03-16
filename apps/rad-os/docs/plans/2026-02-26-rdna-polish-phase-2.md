# RDNA Polish Phase 2 — Component Refactors Implementation Plan

> Execute task-by-task with verification at each gate.

> Status note as of 2026-03-08: partially delivered, not fully completed as written.
> Clearly landed: infrastructure work, dark.css follow-ups, barrel exports, and CVA adoption for Button, Input, Select, Tabs, Card, Switch, Alert, and Badge.
> Not completed: the plan goal of refactoring all 25 radiants core components with CVA plus the full checklist.
> Superseded in part: newer CSS contract hardening and style-authority enforcement are now the primary path for reducing design-system drift. Treat the remaining component items here as a targeted backlog, not a blanket completion checklist.

**Goal:** Refactor all 25 radiants core components with CVA variants, correct size scales, semantic tokens only, new elevation shadow names, and standardized Sun/Moon interaction patterns.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA` (primary checkout, `main` branch)

**Architecture:** Each component gets rewritten with `class-variance-authority` for type-safe variants, `data-variant`/`data-size` attributes for dark.css targeting, and the standardized interaction pattern (lift in Sun Mode, glow in Moon Mode). All Moon Mode overrides are CSS-only via dark.css selectors — no runtime dark mode detection. Work proceeds in 3 tiered batches (high-traffic → containers → remaining), each with a visual review gate.

**Tech Stack:** React 19, Tailwind CSS v4, class-variance-authority, CSS custom properties

**Brainstorm:** `docs/brainstorms/2026-02-26-rdna-polish-phase-2-brainstorm.md`

---

## Reference: Per-Component Refactor Checklist

Every component task below follows this checklist. If a step says "apply checklist", it means all 8 items:

1. Rewrite variants with CVA (`class-variance-authority`)
2. Fix size scale per DESIGN.md (sm=h-6, md=h-8, lg=h-10 for interactive; sm/md/lg padding scale for containers)
3. Replace all raw brand tokens with semantic tokens
4. Replace old shadow names (`shadow-btn` → `shadow-resting`, `shadow-card` → `shadow-raised`, `shadow-card-lg` → `shadow-floating`, `shadow-inner` → `shadow-inset`)
5. Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1` to all interactive elements
6. Add `data-variant` and `data-size` attributes for dark.css targeting
7. Ensure 1px borders only (`border`, never `border-2`)
8. Export CVA variants for consumer composition: `export { componentVariants }`

## Reference: Sun/Moon Interaction Pattern

**Sun Mode (in component CSS/classes):**
- Rest: flat, `shadow-resting` (or `shadow-none` for buttons)
- Hover: `hover:-translate-y-1 hover:shadow-raised`
- Active: `active:-translate-y-0.5 active:shadow-resting`
- Focus: `focus-visible:ring-2 ring-focus ring-offset-1`

**Moon Mode (dark.css overrides via `data-variant` selectors):**
- Rest: ink bg, muted border, no shadow
- Hover: `border-color: line-hover`, `box-shadow: 0 0 4px cream@30%, 0 0 10px glow-sun-yellow-subtle`
- Active: `border-color: focus`, `box-shadow: 0 0 6px cream@40%, 0 0 14px glow-sun-yellow`
- Focus: `ring-2 ring-focus` (same in both modes)

---

## Task 0: Infrastructure Setup

**Files:**
- Modify: `packages/radiants/package.json`
- Modify: `packages/radiants/tokens.css:181-186`
- Modify: `packages/radiants/DESIGN.md:409-411`
- Modify: `packages/radiants/typography.css` (code element brand tokens)

### Step 1: Install CVA

Run:
```bash
cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && pnpm add class-variance-authority
```

Expected: CVA added to `dependencies` in `package.json`.

### Step 2: Remove `--spacing-*` tokens from tokens.css

Delete lines 180-186 of `packages/radiants/tokens.css`:
```css
  /* DELETE THIS ENTIRE BLOCK */
  --spacing-xs: 0.25rem;       /* 4px */
  --spacing-sm: 0.5rem;        /* 8px */
  --spacing-md: 1rem;          /* 16px */
  --spacing-lg: 1.5rem;        /* 24px */
  --spacing-xl: 2rem;          /* 32px */
  --spacing-2xl: 3rem;         /* 48px */
```

DESIGN.md Section 8 says: "Use Tailwind's native 4px grid directly. No custom spacing tokens."

### Step 3: Fix DESIGN.md stale type-scale warning

In `packages/radiants/DESIGN.md`, the DON'T example says:
```tsx
// DON'T: Use deprecated text-2xs naming from pre-migration examples
```

Type scale was shifted (`text-2xs` -> `text-xs`, `text-xs` -> `text-sm`). Replace with:
```tsx
// DON'T: Use deprecated text-2xs naming from pre-migration examples
<span className="text-2xs">Deprecated naming — use text-xs instead</span>
```

### Step 4: Fix typography.css raw brand tokens

In `packages/radiants/typography.css`, keep explicit light/dark code-chip styling for readability, but migrate from raw brand tokens to semantic tokens.
```css
/* Before */
code { color: text-ink; background: bg-cream; }
.dark code { color: text-sun-yellow; background: bg-ink; }

/* After */
code { color: text-main; background: bg-page; }
.dark code {
  color: text-accent;
  background: bg-page;
  border: 1px solid var(--color-line);
}
```

### Step 5: Verify build

Run:
```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
```

Expected: Clean build, no errors.

### Step 6: Commit

```bash
git add packages/radiants/package.json pnpm-lock.yaml packages/radiants/tokens.css packages/radiants/DESIGN.md packages/radiants/typography.css
git commit -m "chore: install CVA, remove spacing tokens, fix DESIGN.md and typography.css"
```

---

## Tier 1: High-Traffic Components (6)

---

### Task 1: Button — CVA Rewrite + Size Fix + Shadow Migration

The gold-standard component. Already has `data-variant`, focus rings, and Sun/Moon interactions. Needs CVA conversion, size scale fix, and shadow name migration.

**Files:**
- Modify: `packages/radiants/components/core/Button/Button.tsx`

### Step 1: Rewrite with CVA

Replace the `sizeStyles`, `iconOnlySizeStyles`, `variantStyles` Record objects and the `getButtonClasses()` function with a single CVA definition:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  // Base
  `inline-flex items-center font-heading uppercase whitespace-nowrap cursor-pointer select-none
   rounded-sm transition duration-150
   disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:hover:shadow-none
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1`,
  {
    variants: {
      variant: {
        primary: `border border-line bg-accent text-accent-inv shadow-none
                  hover:-translate-y-1 hover:shadow-raised active:-translate-y-0.5 active:shadow-resting`,
        secondary: `border border-line bg-inv text-flip shadow-none
                    hover:-translate-y-1 hover:shadow-raised hover:bg-page hover:text-main
                    active:-translate-y-0.5 active:shadow-resting active:bg-accent active:text-main`,
        outline: `border border-line bg-transparent text-main shadow-none
                  hover:-translate-y-0.5 hover:shadow-resting hover:bg-depth
                  active:translate-y-0 active:shadow-none active:bg-accent`,
        ghost: `border-0 bg-transparent text-head shadow-none
                hover:bg-accent hover:text-head
                active:bg-accent active:text-head`,
      },
      size: {
        sm: 'h-6 px-2 text-xs gap-2',
        md: 'h-8 px-3 text-sm gap-3',
        lg: 'h-10 px-4 text-base gap-3',
      },
      iconOnly: {
        true: '',
        false: '',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    compoundVariants: [
      { iconOnly: true, size: 'sm', className: 'w-6 h-6 p-0 justify-center' },
      { iconOnly: true, size: 'md', className: 'w-8 h-8 p-0 justify-center' },
      { iconOnly: true, size: 'lg', className: 'w-10 h-10 p-0 justify-center' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      iconOnly: false,
      fullWidth: false,
    },
  }
);
```

Key changes from current code:
- **Size fix:** `sm` goes from `h-8 px-3 text-sm` → `h-6 px-2 text-xs`, `lg` from `h-8 px-3 text-sm` → `h-10 px-4 text-base`
- **Shadow migration:** `shadow-btn-hover` → `shadow-raised`, `shadow-btn` → `shadow-resting`
- **Icon-only sizes:** `sm: w-6 h-6`, `md: w-8 h-8`, `lg: w-10 h-10` (was all `w-8 h-8`)

### Step 2: Update Button component to use CVA

Replace `getButtonClasses()` call with:
```tsx
const classes = buttonVariants({
  variant,
  size,
  iconOnly: iconOnly || false,
  fullWidth,
  className: `${justifyClass} ${className}`,
});
```

Keep `data-variant={variant}` on all render paths. Add `data-size={size}`.

### Step 3: Update IconButton sub-component

Remove the internal `sizeClasses` Record. Use `buttonVariants` directly:
```tsx
export function IconButton({ icon, size = 'md', variant = 'ghost', className = '', 'aria-label': ariaLabel, ...props }: IconButtonProps) {
  return (
    <Button variant={variant} size={size} iconOnly className={className} aria-label={ariaLabel} {...props}>
      {icon}
    </Button>
  );
}
```

### Step 4: Verify build

Run:
```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
```

### Step 5: Commit

```bash
git add packages/radiants/components/core/Button/Button.tsx
git commit -m "feat(Button): CVA rewrite with size fix and shadow migration"
```

---

### Task 2: Input — CVA + Focus Ring + data-* Attributes

Currently has focus rings (good) but no CVA, no `data-*` attributes, and no hover interaction.

**Files:**
- Modify: `packages/radiants/components/core/Input/Input.tsx`

### Step 1: Rewrite with CVA

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

export const inputVariants = cva(
  `font-sans bg-page text-main border border-line rounded-sm
   placeholder:text-mute transition duration-150
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0
   disabled:opacity-50 disabled:cursor-not-allowed`,
  {
    variants: {
      size: {
        sm: 'h-6 px-2 text-xs',
        md: 'h-8 px-3 text-sm',
        lg: 'h-10 px-4 text-base',
      },
      error: {
        true: 'border-danger focus-visible:ring-danger',
        false: '',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
      fullWidth: false,
    },
  }
);
```

Size changes: `sm` from `h-8` → `h-6`, `md` from `h-10` → `h-8`, `lg` from `h-12` → `h-10`.

### Step 2: Update Input component

Replace the manual class building with:
```tsx
const classes = inputVariants({ size, error, fullWidth, className: `${paddingLeft} ${className}` });
```

Add `data-size={size}` to the `<input>` element.

### Step 3: Update TextArea

Add `data-size="md"` and keep existing focus ring pattern. No size variants for textarea.

### Step 4: Verify build

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
```

### Step 5: Commit

```bash
git add packages/radiants/components/core/Input/Input.tsx
git commit -m "feat(Input): CVA rewrite with corrected size scale"
```

---

### Task 3: Select — CVA + Focus Ring + Shadow Migration

Currently uses inline shadow hack, no focus-visible ring, no `data-*` attributes.

**Files:**
- Modify: `packages/radiants/components/core/Select/Select.tsx`

### Step 1: Rewrite Trigger with CVA

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

export const selectTriggerVariants = cva(
  `flex items-center justify-between gap-2 w-full
   font-sans bg-page text-main border border-line rounded-sm
   transition duration-150
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0
   disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`,
  {
    variants: {
      size: {
        sm: 'h-6 px-2 text-xs',
        md: 'h-8 px-3 text-sm',
        lg: 'h-10 px-4 text-base',
      },
      error: {
        true: 'border-danger',
        false: '',
      },
      open: {
        true: 'shadow-raised -translate-y-0.5',
        false: 'shadow-resting',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
      open: false,
    },
  }
);
```

Key changes:
- Add `focus-visible` ring (was missing)
- Replace inline `shadow-[0_3px_0_0_var(--color-line)]` with `shadow-raised` / `shadow-resting`
- Add size scale (was hardcoded `h-10`)

### Step 2: Update Trigger component

Use CVA and add `data-variant="select"` and `data-size={size}` attributes. Remove the inline shadow hack.

### Step 3: Update Content with shadow migration

Replace `shadow-card` → `shadow-raised` on the Content panel.

### Step 4: Add focus ring to Option

Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0` to Option button.

### Step 5: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Select/Select.tsx
git commit -m "feat(Select): CVA rewrite with focus ring and shadow migration"
```

---

### Task 4: Tabs — CVA + Focus Ring + data-* Attributes

Has `aria-selected` (usable by dark.css) but no `focus-visible` ring and uses raw `bg-cream` and `text-ink` tokens.

**Files:**
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`

### Step 1: Fix raw brand tokens

Current code:
```tsx
// BEFORE — raw tokens
inactive: `border-transparent bg-cream text-main`
active: `border-line bg-accent text-ink`
```

Replace with semantic tokens:
```tsx
// AFTER — semantic tokens
inactive: `border-transparent bg-page text-main`
active: `border-line bg-accent text-accent-inv`
```

### Step 2: Rewrite with CVA

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

export const tabTriggerVariants = cva(
  `flex items-center justify-center gap-2 px-4 py-2
   font-heading text-sm uppercase cursor-pointer select-none
   transition-colors duration-200 ease-out relative border rounded-sm flex-1 shadow-none
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1`,
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
      { variant: 'pill', active: false, className: 'border-transparent bg-page text-main hover:border-line' },
      { variant: 'pill', active: true, className: 'border-line bg-accent text-accent-inv' },
      { variant: 'line', active: false, className: 'bg-transparent hover:bg-hover' },
      { variant: 'line', active: true, className: 'border-b-0 bg-page border-t border-l border-r border-line rounded-t-md z-10' },
    ],
    defaultVariants: {
      variant: 'pill',
      active: false,
    },
  }
);
```

### Step 3: Update Trigger component

Replace manual class building with CVA call. Keep `role="tab"` and `aria-selected={isActive}`. Add `data-variant={variant}`.

### Step 4: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Tabs/Tabs.tsx
git commit -m "feat(Tabs): CVA rewrite, fix raw tokens, add focus ring"
```

---

### Task 5: Card — CVA + Shadow Migration

Non-interactive container. Needs CVA, shadow migration, and `data-variant` for dark.css.

**Files:**
- Modify: `packages/radiants/components/core/Card/Card.tsx`

### Step 1: Rewrite with CVA

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

export const cardVariants = cva(
  'border border-line rounded-md overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-page text-main',
        dark: 'bg-inv text-flip',
        raised: 'bg-page text-main shadow-raised',
      },
      noPadding: {
        true: '',
        false: 'p-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      noPadding: false,
    },
  }
);
```

Shadow migration: `shadow-card` → `shadow-raised`.

### Step 2: Update Card component

Use `cardVariants()` and add `data-variant={variant}`.

### Step 3: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Card/Card.tsx
git commit -m "feat(Card): CVA rewrite with shadow migration"
```

---

### Task 6: Switch — CSS-Only Conversion + CVA

Most complex refactor. Currently uses `useDarkMode()` runtime hook for Sun/Moon branching. Convert to CSS-only approach where the component sets classes/data-attributes and dark.css handles Moon Mode overrides.

**Files:**
- Modify: `packages/radiants/components/core/Switch/Switch.tsx`
- Modify: `packages/radiants/dark.css` (add Switch Moon Mode selectors)

### Step 1: Remove useDarkMode hook

Delete the entire `useDarkMode()` function (lines 38-64). Remove `isDark` from the component.

### Step 2: Simplify to CSS-driven approach

The component should always render the **Sun Mode** behavior (lift on hover). Dark.css will override to glow behavior.

Replace the inline style computation with class-based approach:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

export const switchTrackVariants = cva(
  'relative inline-flex items-center rounded-xs border border-line cursor-pointer transition duration-150',
  {
    variants: {
      size: {
        sm: 'w-7 h-3.5',    // 28x14px
        md: 'w-8 h-4',      // 32x16px
        lg: 'w-10 h-5',     // 40x20px
      },
      checked: {
        true: 'bg-accent',
        false: 'bg-inv',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-50',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      checked: false,
      disabled: false,
    },
  }
);
```

The thumb keeps CSS transitions for translate-X (slide) and translate-Y (lift in Sun Mode). Use Tailwind classes:
- Rest: `translate-y-0 shadow-resting`
- Hover (group-hover): `-translate-y-1 shadow-raised`
- Active (group-active): `-translate-y-0.5 shadow-resting`

Wrap the track `<label>` with `group` class so thumb reacts to track hover. Add `className="switch-thumb"` to the thumb element for dark.css targeting.

### Step 3: Add data-* attributes

Add to the track label:
- `data-variant="switch"`
- `data-size={size}`
- `data-checked={checked}`

### Step 4: Add dark.css Switch Moon Mode overrides

Append to `packages/radiants/dark.css` inside the `.dark { }` block:

```css
  /* ============================================
     SWITCH — Moon Mode overrides
     Track: ink bg at rest, glow on hover
     Thumb: flat, glow + yellow border on hover
     ============================================ */

  & [data-variant="switch"] {
    box-shadow: none;
    transition: box-shadow 150ms ease-out, border-color 150ms ease-out;
  }

  & [data-variant="switch"]:hover {
    border-color: var(--color-line-hover);
    box-shadow:
      0 0 4px rgba(254, 248, 226, 0.3),
      0 0 10px var(--glow-sun-yellow-subtle);
  }

  & [data-variant="switch"]:hover .switch-thumb {
    --tw-translate-y: 0 !important;
    translate: var(--tw-translate-x) var(--tw-translate-y) !important;
    border-color: var(--color-focus);
    box-shadow: var(--shadow-glow-sm);
  }

  & [data-variant="switch"]:active {
    border-color: var(--color-focus);
    box-shadow:
      0 0 6px rgba(254, 248, 226, 0.4),
      0 0 14px var(--glow-sun-yellow);
  }
```

If you need a system-preference fallback, use `:root:not(.light):not(.dark)` selectors and the same `translate` property pattern (do not use `transform:` and do not introduce ad-hoc vars like `--switch-translate-x`).

### Step 5: Remove `hovered`, `pressed`, `isDark` state

Remove `useState` for `hovered` and `pressed`. Remove all `onMouseEnter`, `onMouseLeave`, `onMouseDown`, `onMouseUp` handlers. CSS handles everything.

### Step 6: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Switch/Switch.tsx packages/radiants/dark.css
git commit -m "feat(Switch): CSS-only conversion, remove useDarkMode hook, add CVA"
```

---

### Tier 1 Visual Review Gate

**Pause here.** Run `pnpm dev` and visually verify in both Sun and Moon mode:
- [ ] Button sizes differ (sm < md < lg)
- [ ] Button lift animation works in Sun, glow in Moon
- [ ] Input focus ring appears on keyboard tab
- [ ] Select dropdown opens with proper shadow
- [ ] Tabs pill variant highlights correctly
- [ ] Card raised variant has `shadow-raised`
- [ ] Switch thumb lifts in Sun, glows in Moon
- [ ] No regressions in existing RadOS apps

---

## Tier 2: Container Components (7)

---

### Task 7: Dialog — Shadow Migration + Trigger Focus

**Files:**
- Modify: `packages/radiants/components/core/Dialog/Dialog.tsx`

### Step 1: Shadow migration

In Content component, replace:
```tsx
shadow-card-lg
```
with:
```tsx
shadow-floating
```

### Step 2: Fix bare Trigger button

The default (non-asChild) Trigger renders an unstyled `<button>`. Add base interaction classes:

```tsx
<button
  type="button"
  onClick={() => setOpen(true)}
  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1"
>
```

### Step 3: Fix bare Close button

Same treatment as Trigger — add focus-visible ring to the default Close button.

### Step 4: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Dialog/Dialog.tsx
git commit -m "feat(Dialog): shadow migration, add focus rings to Trigger/Close"
```

---

### Task 8: Sheet — Shadow Migration + Trigger Focus

**Files:**
- Modify: `packages/radiants/components/core/Sheet/Sheet.tsx`

### Step 1: Shadow migration

In SheetContent, replace:
```tsx
shadow-card-lg
```
with:
```tsx
shadow-floating
```

### Step 2: Fix bare Trigger and Close buttons

Same as Dialog — add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1` to both default `<button>` elements.

### Step 3: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Sheet/Sheet.tsx
git commit -m "feat(Sheet): shadow migration, add focus rings to Trigger/Close"
```

---

### Task 9: Accordion — Focus Ring + data-* Attributes

Already has `data-state`. Needs focus ring on Trigger.

**Files:**
- Modify: `packages/radiants/components/core/Accordion/Accordion.tsx`

### Step 1: Add focus ring to Trigger

In Trigger, add to the button className:
```tsx
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1
```

### Step 2: Add data-variant

Add `data-variant="accordion"` to the Item div.

### Step 3: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Accordion/Accordion.tsx
git commit -m "feat(Accordion): add focus ring and data-variant"
```

---

### Task 10: DropdownMenu — Fix border-2 + Focus Ring + Shadow Migration

**Files:**
- Modify: `packages/radiants/components/core/DropdownMenu/DropdownMenu.tsx`

### Step 1: Fix border-2 violation

In DropdownMenuContent, change:
```tsx
border-2 border-line
```
to:
```tsx
border border-line
```

### Step 2: Shadow migration

In the same Content component, replace `shadow-card` → `shadow-raised`.

### Step 3: Fix bare Trigger button

Add focus ring to the default (non-asChild) trigger button.

### Step 4: Add focus ring to MenuItem

In DropdownMenuItem, add:
```tsx
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-0
```

### Step 5: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/DropdownMenu/DropdownMenu.tsx
git commit -m "feat(DropdownMenu): fix border-2, add focus rings, shadow migration"
```

---

### Task 11: Toast — Shadow Migration

Already had border-2 fixed to border in Phase 1 review. Needs shadow migration.

**Files:**
- Modify: `packages/radiants/components/core/Toast/Toast.tsx`

### Step 1: Shadow migration

In Toast component, replace:
```tsx
shadow-card
```
with:
```tsx
shadow-raised
```

### Step 2: Add focus ring to Close button

On the close button, add:
```tsx
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1
```

### Step 3: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Toast/Toast.tsx
git commit -m "feat(Toast): shadow migration, add close button focus ring"
```

---

### Task 12: Alert — CVA + Focus Ring

5 variants (default/success/warning/error/info) — perfect CVA candidate.

**Files:**
- Modify: `packages/radiants/components/core/Alert/Alert.tsx`

### Step 1: Rewrite with CVA

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

export const alertVariants = cva(
  'p-4 border rounded-sm',
  {
    variants: {
      variant: {
        default: 'bg-page border-line text-main',
        success: 'bg-success border-success text-main',
        warning: 'bg-warning border-warning text-main',
        error: 'bg-danger border-danger text-main',
        info: 'bg-link border-link text-main',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
```

### Step 2: Add data-variant and focus ring to close button

Add `data-variant={variant}` to root element. Add focus ring to close button.

### Step 3: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Alert/Alert.tsx
git commit -m "feat(Alert): CVA rewrite, add focus ring to close button"
```

---

### Task 13: Popover — Fix border-2 + Focus Ring

**Files:**
- Modify: `packages/radiants/components/core/Popover/Popover.tsx`

### Step 1: Fix border-2 violation

Find `border-2 border-line` in Content and replace with `border border-line`.

### Step 2: Fix bare Trigger button

Add focus ring to default (non-asChild) trigger.

### Step 3: Add data-variant

Add `data-variant="popover"` to content panel.

### Step 4: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Popover/Popover.tsx
git commit -m "feat(Popover): fix border-2, add focus ring and data-variant"
```

---

### Tier 2 Visual Review Gate

**Pause here.** Run `pnpm dev` and visually verify in both Sun and Moon mode:
- [ ] Dialog overlay and content panel display correctly
- [ ] Sheet slides in from correct side
- [ ] Accordion expand/collapse animation works
- [ ] DropdownMenu content has 1px border (not 2px)
- [ ] Toast notifications appear with proper shadow
- [ ] Alert variants show correct colors
- [ ] Popover content has 1px border
- [ ] Tab through all triggers — focus rings appear
- [ ] No regressions in existing RadOS apps

---

## Tier 3: Remaining Components (12)

These components are lower-traffic. Each gets the standardized treatment but with lighter refactors since most are simpler.

---

### Task 14: Checkbox — Fix dark: prefix + Focus Ring

The only component using `dark:` prefix — inconsistent with CSS-only strategy.

**Files:**
- Modify: `packages/radiants/components/core/Checkbox/Checkbox.tsx`

### Step 1: Replace dark: prefix with semantic tokens

Find `dark:bg-card` and remove the `dark:` prefix. Use `bg-card` — the token already flips in dark.css.

### Step 2: Fix raw brand token

Find `text-ink` on checkmark and replace with `text-main`.

### Step 3: Add focus-visible ring

Add to the visual checkbox container:
```tsx
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1
```

Use a peer-focus-visible pattern (similar to Switch) since the actual input is hidden.

### Step 4: Add data-variant

Add `data-variant="checkbox"` to the root wrapper.

### Step 5: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Checkbox/Checkbox.tsx
git commit -m "feat(Checkbox): fix dark: prefix, raw tokens, add focus ring"
```

---

### Task 15: Badge — CVA

**Files:**
- Modify: `packages/radiants/components/core/Badge/Badge.tsx`

### Step 1: Read current code and apply CVA

Read the file, identify variant styles, convert to CVA. Add `data-variant` attribute. Ensure semantic tokens only.

### Step 2: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Badge/Badge.tsx
git commit -m "feat(Badge): CVA rewrite"
```

---

### Task 16: Breadcrumbs — Semantic Tokens + Focus Ring

**Files:**
- Modify: `packages/radiants/components/core/Breadcrumbs/Breadcrumbs.tsx`

### Step 1: Read and audit

Check for raw brand tokens, missing focus rings on links.

### Step 2: Fix and add focus ring

Replace any raw tokens. Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1` to any interactive breadcrumb links.

### Step 3: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Breadcrumbs/Breadcrumbs.tsx
git commit -m "feat(Breadcrumbs): semantic tokens, add focus ring"
```

---

### Task 17: ContextMenu — Focus Ring + Border Fix

**Files:**
- Modify: `packages/radiants/components/core/ContextMenu/ContextMenu.tsx`

### Step 1: Read and audit

Check for `border-2`, missing focus rings, raw tokens, old shadow names.

### Step 2: Apply fixes

Fix any issues found per the checklist.

### Step 3: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/ContextMenu/ContextMenu.tsx
git commit -m "feat(ContextMenu): checklist fixes"
```

---

### Task 18: Tooltip — Semantic Tokens

**Files:**
- Modify: `packages/radiants/components/core/Tooltip/Tooltip.tsx`

### Step 1: Read and audit. Apply checklist fixes.

### Step 2: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Tooltip/Tooltip.tsx
git commit -m "feat(Tooltip): semantic tokens, checklist fixes"
```

---

### Task 19: Progress — Semantic Tokens

**Files:**
- Modify: `packages/radiants/components/core/Progress/Progress.tsx`

### Step 1: Read and audit. Apply checklist fixes.

### Step 2: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Progress/Progress.tsx
git commit -m "feat(Progress): semantic tokens, checklist fixes"
```

---

### Task 20: Slider — Focus Ring + Semantic Tokens

**Files:**
- Modify: `packages/radiants/components/core/Slider/Slider.tsx`

### Step 1: Read and audit

Critical: Slider is interactive — needs focus ring on thumb and track.

### Step 2: Apply checklist fixes + focus ring

### Step 3: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Slider/Slider.tsx
git commit -m "feat(Slider): add focus ring, semantic tokens"
```

---

### Task 21: Divider — Semantic Tokens

**Files:**
- Modify: `packages/radiants/components/core/Divider/Divider.tsx`

### Step 1: Read and audit. Apply checklist fixes. Non-interactive so no focus ring needed.

### Step 2: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/Divider/Divider.tsx
git commit -m "feat(Divider): semantic tokens"
```

---

### Task 22: HelpPanel — Focus Ring + Shadow Migration

**Files:**
- Modify: `packages/radiants/components/core/HelpPanel/HelpPanel.tsx`

### Step 1: Read and audit

HelpPanel likely has a trigger button (bare unstyled) and a panel with old shadow names.

### Step 2: Apply checklist fixes

### Step 3: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/HelpPanel/HelpPanel.tsx
git commit -m "feat(HelpPanel): focus ring, shadow migration"
```

---

### Task 23: CountdownTimer + Web3ActionBar + MockStatesPopover

These 3 are low-traffic specialty components. Apply checklist in a single pass.

**Files:**
- Modify: `packages/radiants/components/core/CountdownTimer/CountdownTimer.tsx`
- Modify: `packages/radiants/components/core/Web3ActionBar/Web3ActionBar.tsx`
- Modify: `packages/radiants/components/core/MockStatesPopover/MockStatesPopover.tsx`

### Step 1: Read all 3 files and audit

MockStatesPopover is noted in the brainstorm as using "entirely inline styles with hardcoded colors" — this needs the most work.

### Step 2: Apply checklist fixes to all 3

For MockStatesPopover: replace all inline styles and hardcoded hex colors with semantic Tailwind classes.

### Step 3: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/CountdownTimer/ packages/radiants/components/core/Web3ActionBar/ packages/radiants/components/core/MockStatesPopover/
git commit -m "feat(CountdownTimer, Web3ActionBar, MockStatesPopover): checklist fixes"
```

---

### Task 24: dark.css — Add Component-Specific Moon Mode Overrides

After all components have `data-variant` attributes, add targeted Moon Mode overrides.

**Files:**
- Modify: `packages/radiants/dark.css`

### Step 1: Add secondary/outline button overrides

```css
& [data-variant="secondary"] {
  background: var(--color-card);
  color: var(--color-main);
  border: 1px solid var(--color-rule);
  transition: box-shadow 150ms ease-out, border-color 150ms ease-out, translate 150ms ease-out;
}

& [data-variant="secondary"]:hover {
  background: var(--color-card) !important;
  border-color: var(--color-line-hover);
  box-shadow: 0 0 4px rgba(254, 248, 226, 0.3), 0 0 10px var(--glow-sun-yellow-subtle);
}

& [data-variant="outline"] {
  background: transparent;
  border: 1px solid var(--color-rule);
  transition: box-shadow 150ms ease-out, border-color 150ms ease-out, translate 150ms ease-out;
}

& [data-variant="outline"]:hover {
  background: transparent !important;
  border-color: var(--color-line-hover);
  box-shadow: 0 0 4px rgba(254, 248, 226, 0.3), 0 0 10px var(--glow-sun-yellow-subtle);
}
```

### Step 2: Add Select, Accordion overrides

Follow the same glow pattern for `[data-variant="select"]` and `[data-variant="accordion"]`.

### Step 3: Keep `.dark` selectors as source of truth

Do **not** duplicate component interaction selectors into `@media (prefers-color-scheme: dark)`. Keep `.dark` selectors as the canonical behavior layer and reserve the `@media` block for token fallbacks only. This avoids class/media precedence conflicts.
If a system-fallback selector is required for a specific component, gate it as `:root:not(.light):not(.dark)` so explicit class mode always wins.

### Step 4: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/dark.css
git commit -m "feat(dark.css): add Moon Mode overrides for all data-variant components"
```

---

### Task 25: Final shadow name cleanup in dark.css

Now that all components use new shadow names, clean up the old-name force-overrides in dark.css if they're no longer referenced.

**Files:**
- Modify: `packages/radiants/dark.css`

### Step 1: Grep for old shadow name usage

```bash
rg -n "shadow-btn|shadow-card|shadow-card-lg|shadow-inner" apps/rad-os/components packages/radiants/components packages/radiants/components/core/**/*.dna.json
```

If zero results across app components + radiants components + `.dna.json` schemas, the old utility overrides in dark.css (`.shadow-btn`, `.shadow-card`, etc.) are dead code. Keep the token definitions in tokens.css until Phase 3, but remove the force-override classes in dark.css if unused.

### Step 2: Clean up if safe

If grep shows zero component usage, remove the `.shadow-btn`, `.shadow-btn-hover`, `.shadow-card`, `.shadow-card-lg`, `.shadow-inner` force-override blocks from dark.css. Keep the token variables in `tokens.css` for backward compatibility until Phase 3.

### Step 3: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/dark.css
git commit -m "chore(dark.css): remove unused old shadow name force-overrides"
```

---

### Tier 3 Visual Review Gate

**Pause here.** Run `pnpm dev` and verify:
- [ ] Checkbox shows focus ring when tabbed to
- [ ] Badge variants render with correct colors in both modes
- [ ] DropdownMenu/ContextMenu items highlight on hover
- [ ] Slider thumb has focus ring
- [ ] MockStatesPopover renders without hardcoded colors
- [ ] All components in Moon Mode show glow interactions (not lift)
- [ ] No regressions in RadOS apps

---

## Task 26: Component Barrel Export Update

**Files:**
- Modify: `packages/radiants/components/core/index.ts`

### Step 1: Ensure all CVA variant exports are re-exported

Each component that got CVA now exports its variants (e.g., `buttonVariants`, `inputVariants`). Ensure the barrel file re-exports them for consumer use.

### Step 2: Verify build + Commit

```bash
cd /Users/rivermassey/Desktop/dev/DNA/apps/rad-os && pnpm build
git add packages/radiants/components/core/index.ts
git commit -m "chore: re-export CVA variant definitions from barrel"
```

---

## Summary

| Task | Component(s) | Key Changes |
|------|-------------|-------------|
| 0 | Infrastructure | Install CVA, remove spacing tokens, fix docs |
| 1 | Button | CVA, size fix (h-6/h-8/h-10), shadow migration |
| 2 | Input | CVA, corrected size scale |
| 3 | Select | CVA, focus ring, shadow migration |
| 4 | Tabs | CVA, fix raw tokens, focus ring |
| 5 | Card | CVA, shadow migration |
| 6 | Switch | CSS-only conversion, remove useDarkMode, CVA |
| 7 | Dialog | Shadow migration, trigger/close focus rings |
| 8 | Sheet | Shadow migration, trigger/close focus rings |
| 9 | Accordion | Focus ring, data-variant |
| 10 | DropdownMenu | Fix border-2, focus rings, shadow migration |
| 11 | Toast | Shadow migration, close focus ring |
| 12 | Alert | CVA, close focus ring |
| 13 | Popover | Fix border-2, focus ring, data-variant |
| 14 | Checkbox | Fix dark: prefix, raw tokens, focus ring |
| 15 | Badge | CVA |
| 16 | Breadcrumbs | Semantic tokens, focus ring |
| 17 | ContextMenu | Focus ring, border fix |
| 18 | Tooltip | Semantic tokens |
| 19 | Progress | Semantic tokens |
| 20 | Slider | Focus ring, semantic tokens |
| 21 | Divider | Semantic tokens |
| 22 | HelpPanel | Focus ring, shadow migration |
| 23 | Timer/Web3/Mock | Checklist fixes (MockStatesPopover full rewrite) |
| 24 | dark.css | Moon Mode overrides for all data-variant components |
| 25 | dark.css | Remove old shadow name force-overrides |
| 26 | Barrel export | Re-export CVA variants |
