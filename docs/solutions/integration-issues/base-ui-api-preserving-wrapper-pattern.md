---
title: Base UI API-Preserving Wrapper Pattern
category: integration-issues
date: 2026-03-05
tags: [base-ui, react, headless-ui, migration, wrapper-pattern, compound-components]
---

# Base UI API-Preserving Wrapper Pattern

## Symptom

Custom compound components (Tabs, Accordion, Dialog, Select, etc.) need production-grade keyboard navigation, focus management, and ARIA semantics -- but the public API consumed by application code must not change. Consumers pass `state`, `actions`, and `meta` objects via a `Provider` and compose sub-components (`Trigger`, `Content`, etc.) declaratively. Swapping internals cannot break this contract.

## Investigation

Two approaches were evaluated:

1. **Rewrite consumers to use Base UI directly** -- rejected because it changes every call-site and couples app code to a specific headless library.
2. **Wrap Base UI inside existing compound component shells** -- chosen because the public API stays identical; only the internal plumbing changes.

## Root Cause

The hand-rolled implementations lacked robust accessibility internals:

- **Keyboard navigation**: Arrow-key focus movement across tabs, accordion triggers, and menu items required manual `onKeyDown` handlers that were incomplete or missing edge cases (e.g., wrapping, home/end keys).
- **Focus management**: Dialog focus trapping, scroll locking, and return-focus-on-close were custom and fragile.
- **ARIA linking**: Dialog title/description `aria-labelledby`/`aria-describedby` IDs had to be manually coordinated.

Base UI (`@base-ui/react`) provides all of this out of the box as unstyled, composable primitives, making it the right internal engine while the Radiants API remains the external interface.

## Solution

### Anatomy of the wrapper pattern

```
Consumer code (unchanged)
  |
  v
Radiants compound API  -->  { Provider, Frame, Trigger, Content, ... }
  |                              |
  |  useTabsState() hook         |  Provider bridges state
  |  returns { state,            |  to Base UI Root
  |    actions, meta }           |
  v                              v
Base UI primitives     -->  BaseTabs.Root / BaseTabs.Tab / BaseTabs.Panel
                            (handles keyboard, ARIA, focus)
```

### Key elements

#### 1. Provider bridges Radiants state to Base UI Root

The `Provider` sub-component wraps `BaseXxx.Root` with controlled props, translating the Radiants `state`/`actions` protocol into Base UI's `value`/`onValueChange`:

**Tabs** (cleanest example):

```tsx
// Before (custom): Provider just set React context
function Provider({ state, actions, meta, children }) {
  return (
    <TabsContext value={{ state, actions, meta }}>
      {children}
    </TabsContext>
  );
}

// After (Base UI): Provider wraps BaseTabs.Root
function Provider({ state, actions, meta, children }) {
  return (
    <TabsMetaContext value={meta}>
      <BaseTabs.Root
        value={state.activeTab}
        onValueChange={(value) => actions.setActiveTab(value as string)}
      >
        {children}
      </BaseTabs.Root>
    </TabsMetaContext>
  );
}
```

Note: meta (variant, layout) stays in its own lightweight context because Base UI does not need it. Only state relevant to the headless primitive flows into the Root.

#### 2. State hook stays unchanged

The `useTabsState` / `useAccordionState` / `useDialogState` hooks are the same as before. They return `{ state, actions, meta }` with controlled/uncontrolled support. No consumer changes needed.

#### 3. `render` prop replaces `cloneElement` for interactive elements

Base UI's `render` prop lets you provide a custom element that receives all ARIA/keyboard props. This replaces the old `cloneElement` pattern and eliminates nested `<button>` warnings:

```tsx
// Tabs.Trigger — uses render prop to read aria-selected for styling
<BaseTabs.Tab
  value={value}
  render={(props) => {
    const isActive = props['aria-selected'] === true;
    return (
      <button {...props} type="button" className={tabTriggerVariants({ variant, active: isActive })}>
        {children}
      </button>
    );
  }}
/>

// Accordion.Trigger — reads aria-expanded from render props
<BaseAccordion.Trigger
  render={(props) => {
    const isExpanded = props['aria-expanded'] === true;
    return (
      <button {...props} type="button" className="...">
        <span>{children}</span>
        <span aria-hidden="true">{isExpanded ? '−' : '+'}</span>
      </button>
    );
  }}
/>

// Dialog.Trigger — render prop with asChild pattern
<BaseDialog.Trigger render={children} />  // asChild=true
<BaseDialog.Trigger>{children}</BaseDialog.Trigger>  // asChild=false
```

#### 4. Content panels use className + children directly (not render prop)

Base UI's `render` prop on Panel/Popup does **not** pass `children` through when given a ReactElement. For content containers, use the `className` prop directly:

```tsx
// CORRECT: className prop, children passed normally
<BaseTabs.Panel value={value} className={contentClasses}>
  {children}
</BaseTabs.Panel>

// WRONG: render prop swallows children
<BaseTabs.Panel value={value} render={<div className={contentClasses} />} />
```

#### 5. Accordion `onValueChange` diffing bridge

Base UI Accordion's `onValueChange` fires with the complete new value array, not the individual toggled item. The Radiants API exposes `toggleItem(value)` which expects a single item. The Provider bridges this with set diffing:

```tsx
<BaseAccordion.Root
  value={Array.from(state.expandedItems)}
  onValueChange={(newValue) => {
    const oldSet = state.expandedItems;
    const newSet = new Set(newValue as string[]);

    // Find added item
    for (const v of newSet) {
      if (!oldSet.has(v)) { actions.toggleItem(v); return; }
    }
    // Find removed item
    for (const v of oldSet) {
      if (!newSet.has(v)) { actions.toggleItem(v); return; }
    }
  }}
  multiple={meta.type === 'multiple'}
>
```

#### 6. Dialog gets free accessibility wins

Base UI Dialog auto-generates `aria-labelledby` and `aria-describedby` linking when `Title` and `Description` sub-components are used. It also handles:

- Focus trapping inside the popup
- Scroll lock on the body
- Escape key to close
- Return focus to trigger on close

```tsx
// Title and Description auto-link to the dialog popup
<BaseDialog.Title>...</BaseDialog.Title>
<BaseDialog.Description>...</BaseDialog.Description>
```

### Import path convention

Base UI components are imported from their individual entry points to keep bundle size minimal:

```tsx
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
```

Always alias as `BaseXxx` to avoid name collisions with the Radiants export.

### Barrel export unchanged

The `index.ts` barrel file is completely unaffected by the migration. Consumers continue importing from the same path:

```tsx
import { Tabs, useTabsState } from '@rdna/radiants/components/core';
```

## Prevention

Checklist for future Base UI migrations:

- [ ] **Audit the public API first.** Document every prop, callback, and sub-component consumers use before writing any code.
- [ ] **Alias imports as `BaseXxx`.** Prevents name collisions and makes the wrapper boundary obvious in code.
- [ ] **Bridge state in Provider only.** Map `state`/`actions` to `value`/`onValueChange` at the Root level; do not leak Base UI state types into the public interface.
- [ ] **Use `render` prop for interactive elements** (Trigger, Close, Tab). Spread `{...props}` and add `type="button"` explicitly.
- [ ] **Use `className` + direct `children` for content containers** (Panel, Popup). The `render` prop does not forward children.
- [ ] **Add `activateOnFocus`** to `BaseTabs.List` to match standard tab-on-arrow keyboard behavior.
- [ ] **Diff array values** when bridging to a single-item toggle API (Accordion pattern).
- [ ] **Keep meta context separate** from Base UI Root if it is only used for styling (variant, layout, size).
- [ ] **Run the barrel export unchanged.** If you need to change `index.ts`, something in the public API broke.

## Related

- [Base UI React documentation](https://base-ui.com/)
- `packages/radiants/components/core/Tabs/Tabs.tsx` -- primary reference implementation
- `packages/radiants/components/core/Accordion/Accordion.tsx` -- diffing bridge example
- `packages/radiants/components/core/Dialog/Dialog.tsx` -- auto ARIA linking example
- `packages/radiants/components/core/index.ts` -- barrel export (unchanged)
