# Base UI Overlay/Portal Migration Patterns

> Knowledge checkpoint from the `feat/radiants-base-ui-internal-primitives` migration.
> Components covered: Dialog, Sheet, Popover, DropdownMenu, ContextMenu.

---

## Symptom

After swapping custom overlay implementations for Base UI primitives, several regressions surfaced:

1. **Sheet slide-in animations silently broke** -- panels appeared without transition, or Tailwind classes were missing entirely in production builds.
2. **Backdrop-click tests failed** -- test queries for the overlay backdrop returned `null` because the expected `aria-hidden="true"` attribute was absent.
3. **DropdownMenu tests threw act() warnings or failed to find menu items** in jsdom because the menu rendered inside a modal-locked portal.
4. **Popover/Menu positioning was wrong** -- content rendered centered instead of anchored to the trigger because the old compound `position` string (e.g. `"bottom-start"`) was passed directly to a single prop that only accepts `"bottom"`.

---

## Investigation

### Dialog (straightforward swap)

Dialog was the simplest migration. Base UI's `Dialog.Root` / `Dialog.Portal` / `Dialog.Backdrop` / `Dialog.Popup` map almost 1:1 to the old custom implementation.

Key observations:
- `BaseDialog.Root` accepts `open` + `onOpenChange` for controlled state -- same contract as before.
- `BaseDialog.Portal` renders content into a portal automatically; no manual `createPortal` needed.
- `BaseDialog.Backdrop` renders a plain `<div>` -- it does **not** set `aria-hidden="true"` (see Gotcha 2 below).
- `BaseDialog.Title` and `BaseDialog.Description` auto-wire `aria-labelledby` and `aria-describedby` on the popup -- no manual `id` plumbing required.

Final structure (see `packages/radiants/components/core/Dialog/Dialog.tsx`):
```
BaseDialog.Root (controlled)
  BaseDialog.Portal
    BaseDialog.Backdrop   -- overlay
    BaseDialog.Popup      -- centering wrapper (fixed inset-0 flex)
      <div>               -- styled card (border, shadow, max-w)
```

### Sheet (uses Dialog, not Drawer)

Sheet slides in from a side. The initial instinct was to use Base UI's `Drawer` primitive, but `Drawer` adds swipe-to-dismiss behavior and requires a `swipeDirection` prop. Sheet doesn't need swipe -- it's a simple panel that closes on backdrop click or Escape. Using `Dialog` with custom slide classes was the correct choice.

The critical regression was in slide transitions (see Root Cause below).

Final structure (see `packages/radiants/components/core/Sheet/Sheet.tsx`):
```
BaseDialog.Root (controlled)
  BaseDialog.Portal
    BaseDialog.Backdrop   -- fade overlay with data-[starting-style]/data-[ending-style]
    BaseDialog.Popup      -- the sliding panel itself, positioned with sideStyles[side]
```

### Popover and DropdownMenu (position string splitting)

Both components accepted a compound `position` prop like `"bottom-start"` in the old API. Base UI's `Positioner` component uses separate `side` and `align` props:

```tsx
// Old (custom)
<FloatingPortal position="bottom-start" />

// New (Base UI)
<BaseMenu.Positioner side="bottom" align="start" sideOffset={4} />
```

DropdownMenu implements this via a `positionToSideAlign()` helper that maps each compound position string to its `{ side, align }` pair (see `DropdownMenu.tsx:18-25`).

Popover takes `position` (side only) at the root level and `align` as a separate prop on `PopoverContent`, then passes both to `BasePopover.Positioner`.

### ContextMenu

ContextMenu uses `BaseContextMenu.Root` + `BaseContextMenu.Trigger` for the right-click activation, then delegates the menu popup to `BaseMenu.Portal` / `BaseMenu.Positioner` / `BaseMenu.Popup` for rendering. This split -- ContextMenu for trigger, Menu for content -- is the intended Base UI pattern.

---

## Root Cause

### 1. Sheet slide transitions: Tailwind class scanner failure

**This was a shipped regression that required a hotfix.**

The initial implementation used dynamic template literal interpolation for `data-[starting-style]` classes:

```tsx
// BROKEN -- Tailwind cannot detect these classes at build time
const slideOut = `-translate-x-full`;
const classes = `data-[starting-style]:${slideOut} data-[ending-style]:${slideOut}`;
```

Tailwind v4's class scanner performs static analysis of source files. It finds class names by pattern-matching literal strings. When a class like `data-[starting-style]:-translate-x-full` is split across a template interpolation boundary, the scanner sees `data-[starting-style]:${slideOut}` -- which is not a valid class string -- and silently drops it. No build error. No warning. The class simply doesn't exist in the output CSS.

### 2. Backdrop `aria-hidden` absence

Base UI's `Dialog.Backdrop` renders a plain `<div>` without `aria-hidden="true"`. Tests that queried `screen.getByRole('presentation')` or `querySelector('[aria-hidden="true"]')` to find the backdrop returned `null`. The backdrop must be queried by CSS class or data attribute instead.

### 3. DropdownMenu modal portal isolation

Base UI's `Menu.Root` defaults to `modal={true}`, which creates an inert layer over the rest of the document. In jsdom (which has incomplete inert support), this causes child elements inside the portal to be unreachable by Testing Library queries. Setting `modal={false}` restores standard DOM queryability for tests while keeping the menu functionally correct for click-outside dismissal.

### 4. Position string incompatibility

Base UI `Positioner` does not accept compound position strings. It expects `side` (`'top' | 'bottom' | 'left' | 'right'`) and `align` (`'start' | 'center' | 'end'`) as separate props. Passing `"bottom-start"` to `side` silently falls back to default positioning.

---

## Solution

### Sheet: Static class string map per side variant

Define a `Record<SheetSide, string>` where each value is a complete, literal class string. No interpolation, no dynamic construction.

```tsx
// packages/radiants/components/core/Sheet/Sheet.tsx

const sideStyles: Record<SheetSide, string> = {
  left:   'inset-y-0 left-0  h-full w-80 max-w-[90vw] border-r translate-x-0 data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full',
  right:  'inset-y-0 right-0 h-full w-80 max-w-[90vw] border-l translate-x-0 data-[starting-style]:translate-x-full  data-[ending-style]:translate-x-full',
  top:    'inset-x-0 top-0   w-full h-80 max-h-[90vh] border-b translate-y-0 data-[starting-style]:-translate-y-full data-[ending-style]:-translate-y-full',
  bottom: 'inset-x-0 bottom-0 w-full h-80 max-h-[90vh] border-t translate-y-0 data-[starting-style]:translate-y-full  data-[ending-style]:translate-y-full',
};
```

Every class Tailwind needs to detect is a full literal string on a single line. The object is then consumed via `sideStyles[side]` -- safe because the lookup happens at runtime, not at scan time.

### Backdrop testing: Query by class

```tsx
// Instead of:
screen.getByRole('presentation'); // fails -- no aria-hidden

// Use:
document.querySelector('.bg-surface-overlay-medium'); // or data-variant
```

### DropdownMenu: `modal={false}`

```tsx
<BaseMenu.Root
  open={open}
  onOpenChange={(openState) => onOpenChange?.(openState)}
  modal={false}  // Required for jsdom test compatibility
>
```

### Position string: Split into side + align

```tsx
// DropdownMenu helper
function positionToSideAlign(position: DropdownPosition) {
  switch (position) {
    case 'bottom-start': return { side: 'bottom', align: 'start' };
    case 'bottom-end':   return { side: 'bottom', align: 'end' };
    case 'top-start':    return { side: 'top',    align: 'start' };
    case 'top-end':      return { side: 'top',    align: 'end' };
  }
}

// Popover: position prop maps to side, align is separate
<BasePopover.Positioner side={position} align={align} sideOffset={8} />
```

---

## Prevention

### Tailwind class scanning rule

**Never construct `data-[*]:` or other variant-prefixed Tailwind classes via template interpolation.**

This applies to all Tailwind variant prefixes, not just `data-[starting-style]`:
- `data-[state=open]:...`
- `aria-[expanded=true]:...`
- `group-data-[side=left]:...`

If a class must vary by prop, use a static lookup object (like `sideStyles` above) where every possible class string is a complete literal. Tailwind's `safelist` config is an escape hatch but should be avoided -- it's fragile and disconnected from the source.

### Base UI migration checklist for overlay components

When migrating any overlay/portal component to Base UI:

1. **Choose the right primitive.** Sheet uses `Dialog`, not `Drawer`. If you don't need swipe-to-dismiss, `Dialog` is simpler.
2. **Don't assume ARIA attributes match.** Read the Base UI source or docs for the exact attributes rendered. `Backdrop` has no `aria-hidden`. `Title`/`Description` auto-wire `aria-labelledby`/`aria-describedby`.
3. **Set `modal={false}` on Menu if testing with jsdom.** jsdom's inert implementation is incomplete. `modal={false}` avoids test-only failures without affecting real browser behavior.
4. **Split compound position strings.** Base UI `Positioner` uses `side` + `align` as separate props. Create a mapping helper if the public API still exposes compound strings.
5. **Use `render={element}` for asChild.** Base UI uses `render` prop instead of Radix's `asChild` boolean. The RDNA wrapper components expose `asChild` and translate it internally.
6. **Portal is built in.** `BaseDialog.Portal`, `BasePopover.Portal`, `BaseMenu.Portal` all handle portaling. Remove any manual `createPortal` calls.

---

## Related

- **Migration plan:** archived in `_references/dna-completed-plans/2026-03-05-radiants-base-ui-internal-primitive-swap.md` (outside repo)
- **Visual QA matrix:** `docs/qa/2026-03-05-radiants-base-ui-visual-compare.md`
- **Dialog source:** `packages/radiants/components/core/Dialog/Dialog.tsx`
- **Sheet source:** `packages/radiants/components/core/Sheet/Sheet.tsx`
- **Popover source:** `packages/radiants/components/core/Popover/Popover.tsx`
- **DropdownMenu source:** `packages/radiants/components/core/DropdownMenu/DropdownMenu.tsx`
- **ContextMenu source:** `packages/radiants/components/core/ContextMenu/ContextMenu.tsx`
- **Knowledge Checkpoint 2 (wrapper pattern):** covers the general `asChild` -> `render` translation and Provider/Context pattern used across all migrated components
