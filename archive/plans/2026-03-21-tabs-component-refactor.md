# Tabs Component Refactor — Button-Pattern Alignment

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Refactor the Tabs component to follow Button's architecture: `mode` naming, `data-*` attribute-driven CSS, triggers consuming Button, memoized context, and tab cleanup on unmount.

**Worktree:** `/private/tmp/claude/tabs-refactor` (branch: `feat/tabs-refactor`)

**Architecture:** Move visual styling out of CVA/inline classes into CSS via `data-slot`/`data-mode`/`data-state` selectors (matching Button's pattern). Rename `variant` → `mode`. Have triggers consume the Button component directly where possible. Fix tab registration memory leak and context performance.

**Tech Stack:** React 19, Base UI, CVA, Tailwind v4, CSS data-attribute selectors

---

## Consumer Inventory

These files consume Tabs and must be updated during the `variant` → `mode` rename:

| Consumer | Location | Layout | Mode |
|----------|----------|--------|------|
| ManifestoApp | `apps/rad-os/components/apps/ManifestoApp.tsx:72` | `sidebar` | (default pill) |
| BrandAssetsApp | `apps/rad-os/components/apps/BrandAssetsApp.tsx:738` | `accordion` | `pill` |
| WindowTabs | `apps/rad-os/components/Rad_os/WindowTabs.tsx:77` | (default) | `pill` |
| Test file | `packages/radiants/components/core/Tabs/Tabs.test.tsx` | `default`, `sidebar` | `pill` |

---

## Phase 1: Foundation

### Task 1: Remove dead code

**Files:**
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`

**Step 1: Remove unused types and imports**

Remove `TabsContextValue` interface (lines 29-33) — defined but never referenced.

Remove `type VariantProps` from the CVA import (line 7):
```tsx
// Before
import { cva, type VariantProps } from 'class-variance-authority';
// After
import { cva } from 'class-variance-authority';
```

**Step 2: Run tests to verify nothing breaks**

Run: `cd /private/tmp/claude/tabs-refactor && npx vitest run packages/radiants/components/core/Tabs/Tabs.test.tsx`

Expected: All 6 tests pass.

**Step 3: Commit**

```
feat(tabs): remove dead types and unused imports
```

---

### Task 2: Rename `variant` → `mode`

This is the most disruptive change — touches every consumer. Do it early so later tasks use the new name.

**Files:**
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`
- Modify: `packages/radiants/components/core/Tabs/Tabs.test.tsx`
- Modify: `packages/radiants/components/core/Tabs/Tabs.meta.ts`
- Modify: `packages/radiants/components/core/Tabs/Tabs.schema.json`
- Modify: `apps/rad-os/components/apps/ManifestoApp.tsx`
- Modify: `apps/rad-os/components/apps/BrandAssetsApp.tsx`
- Modify: `apps/rad-os/components/Rad_os/WindowTabs.tsx`

**Step 1: Rename in Tabs.tsx**

All occurrences of `variant` → `mode` in types, interfaces, props, and logic:

```tsx
// Types
type TabsMode = 'pill' | 'line';  // was TabsVariant

// Interface
interface TabsMeta {
  mode: TabsMode;   // was variant: TabsVariant
  layout: TabsLayout;
}

// useTabsMeta consumer in Trigger
const { mode, layout } = useTabsMeta();  // was variant

// useTabsState
mode = 'pill',  // was variant = 'pill'

// tabTriggerVariants CVA
variants: {
  mode: {          // was variant
    pill: '',
    line: '',
  },
  ...
}
compoundVariants: [
  { mode: 'pill', ... },  // was variant: 'pill'
  { mode: 'line', ... },  // was variant: 'line'
]

// Trigger render prop
const classes = tabTriggerVariants({
  mode,  // was variant
  active: isActive,
  ...
});
// data-variant → data-mode on the button
data-mode={mode}  // was data-variant={variant}

// Content
const { mode, layout } = useTabsMeta();  // was variant
// mode === 'line' check  (was variant === 'line')

// Export types
export type { TabsMode, ... };  // was TabsVariant
```

Also rename the exported `tabTriggerVariants` CVA key from `variant` → `mode`.

**Step 2: Update test file**

```tsx
// Tabs.test.tsx — all useTabsState calls
variant: 'pill',  →  mode: 'pill',
```

**Step 3: Update consumers**

ManifestoApp.tsx:72 — `useTabsState` doesn't pass variant, so default applies. No change needed (default is `mode: 'pill'`).

BrandAssetsApp.tsx:738:
```tsx
// Before
Tabs.useTabsState({ defaultValue: 'logos', layout: 'accordion', variant: 'pill' })
// After
Tabs.useTabsState({ defaultValue: 'logos', layout: 'accordion', mode: 'pill' })
```

WindowTabs.tsx:77:
```tsx
// Before
useTabsState({ defaultValue, variant: 'pill' })
// After
useTabsState({ defaultValue, mode: 'pill' })
```

**Step 4: Update meta + schema**

Tabs.meta.ts:
```tsx
variant?: "pill" | "line";  →  mode?: "pill" | "line";
// description: "Visual style variant"  →  "Visual mode — controls trigger fill treatment"
```

Tabs.schema.json: same rename.

**Step 5: Run tests**

Run: `cd /private/tmp/claude/tabs-refactor && npx vitest run packages/radiants/components/core/Tabs/Tabs.test.tsx`

Expected: All 6 tests pass.

**Step 6: Commit**

```
refactor(tabs): rename variant → mode for Button-pattern consistency
```

---

### Task 3: Memoize context value

**Files:**
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`

**Step 1: Add useMemo to Provider**

```tsx
import React, { createContext, use, useState, useCallback, useEffect, useRef, useMemo } from 'react';

function Provider({ state, actions, meta, children }: ProviderProps): React.ReactElement {
  const tabValuesRef = useRef<string[]>([]);
  const [tabVersion, setTabVersion] = useState(0);
  const registerTab = useCallback((value: string) => {
    const tabs = tabValuesRef.current;
    if (!tabs.includes(value)) {
      tabs.push(value);
      setTabVersion((v) => v + 1);
    }
  }, []);

  const contextValue = useMemo(() => ({
    meta,
    activeTab: state.activeTab,
    tabValuesRef,
    tabVersion,
    registerTab,
    setActiveTab: actions.setActiveTab,
  }), [meta, state.activeTab, tabVersion, registerTab, actions.setActiveTab]);

  return (
    <TabsContext value={contextValue}>
      ...
    </TabsContext>
  );
}
```

**Step 2: Run tests**

Expected: All 6 tests pass.

**Step 3: Commit**

```
perf(tabs): memoize context value to prevent unnecessary re-renders
```

---

### Task 4: Tab registration cleanup on unmount

**Files:**
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`
- Modify: `packages/radiants/components/core/Tabs/Tabs.test.tsx`

**Step 1: Write the failing test**

Add to test file:

```tsx
function DynamicTabs() {
  const [showThird, setShowThird] = useState(true);
  const { state, actions, meta } = useTabsState({
    defaultValue: 'one',
    mode: 'pill',
    layout: 'dot',
  });
  return (
    <Tabs.Provider state={state} actions={actions} meta={meta}>
      <Tabs.List>
        <Tabs.Trigger value="one">Tab One</Tabs.Trigger>
        <Tabs.Trigger value="two">Tab Two</Tabs.Trigger>
        {showThird && <Tabs.Trigger value="three">Tab Three</Tabs.Trigger>}
      </Tabs.List>
      <Tabs.Content value="one">Panel One</Tabs.Content>
      <button type="button" data-testid="toggle" onClick={() => setShowThird((v) => !v)}>
        Toggle
      </button>
    </Tabs.Provider>
  );
}

test('removes tab from DotPill when trigger unmounts', async () => {
  const user = userEvent.setup();
  render(<DynamicTabs />);

  // 3 dot indicators initially
  const dots = screen.getAllByRole('button', { name: /Go to/ });
  expect(dots).toHaveLength(3);

  // Remove third tab
  await user.click(screen.getByTestId('toggle'));

  // Should now be 2
  const dotsAfter = screen.getAllByRole('button', { name: /Go to/ });
  expect(dotsAfter).toHaveLength(2);
});
```

**Step 2: Run test to verify it fails**

Run: `cd /private/tmp/claude/tabs-refactor && npx vitest run packages/radiants/components/core/Tabs/Tabs.test.tsx -t "removes tab"`

Expected: FAIL — still shows 3 dots because `unregisterTab` doesn't exist.

**Step 3: Add unregisterTab to context and Provider**

```tsx
interface TabsInternalContext {
  ...
  unregisterTab: (value: string) => void;
}

function Provider(...) {
  ...
  const unregisterTab = useCallback((value: string) => {
    const tabs = tabValuesRef.current;
    const idx = tabs.indexOf(value);
    if (idx !== -1) {
      tabs.splice(idx, 1);
      setTabVersion((v) => v + 1);
    }
  }, []);

  const contextValue = useMemo(() => ({
    ...
    unregisterTab,
  }), [meta, state.activeTab, tabVersion, registerTab, unregisterTab, actions.setActiveTab]);

  return (
    <TabsContext value={contextValue}>
      ...
    </TabsContext>
  );
}
```

**Step 4: Add cleanup return to Trigger's useEffect**

```tsx
function Trigger(...) {
  const { registerTab, unregisterTab, activeTab, setActiveTab: setActive } = useTabsContext();

  useEffect(() => {
    registerTab(value);
    return () => unregisterTab(value);
  }, [value, registerTab, unregisterTab]);
  ...
}
```

**Step 5: Run tests**

Expected: All tests pass including the new one.

**Step 6: Commit**

```
fix(tabs): unregister tabs on unmount to prevent stale DotPill indicators
```

---

## Phase 2: Data-Attribute Infrastructure

### Task 5: Add `data-slot` / `data-mode` / `data-state` to all sub-components

This is the prerequisite for moving styling into CSS. No visual changes — just stamp the DOM.

**Files:**
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`

**Step 1: Add data attributes**

**Provider root** — already has `data-rdna="tabs"`. Add `data-layout`:
```tsx
<BaseTabs.Root
  data-rdna="tabs"
  data-layout={meta.layout}
  ...
>
```

**List** — add `data-slot="tab-list"` to each layout branch:
```tsx
// Default
<BaseTabs.List data-slot="tab-list" ...>

// Capsule inner
<BaseTabs.List data-slot="tab-list" ...>

// Dot hidden list
<BaseTabs.List data-slot="tab-list" className="hidden">

// Sidebar
<BaseTabs.List data-slot="tab-list" ...>

// Accordion wrapper div
<div data-slot="tab-list" data-tabs-accordion="" ...>
```

**Trigger** — add `data-slot="tab-trigger"`, `data-mode`, `data-state` to each layout branch.

For pill/line (default render prop path):
```tsx
<button
  {...props}
  type="button"
  className={classes}
  data-slot="tab-trigger"
  data-mode={mode}
  data-state={isActive ? 'selected' : 'default'}
>
```

For capsule:
```tsx
<button
  {...props}
  type="button"
  data-slot="tab-trigger"
  data-mode="capsule"
  data-state={isActive ? 'selected' : 'default'}
  className={...}
>
```

For sidebar:
```tsx
<button
  {...props}
  type="button"
  data-slot="tab-trigger"
  data-mode="sidebar"
  data-state={isActive ? 'selected' : 'default'}
  className={...}
>
```

For accordion (already uses Button which has its own data-slot):
```tsx
<div
  data-slot="tab-trigger"
  data-mode="accordion"
  data-state={isActive ? 'selected' : 'default'}
  ...
>
```

**Content** — add `data-slot="tab-panel"`:
```tsx
<BaseTabs.Panel
  data-slot="tab-panel"
  value={value}
  ...
>
```

**Step 2: Run tests**

Expected: All tests pass — data attributes are additive.

**Step 3: Commit**

```
feat(tabs): add data-slot/data-mode/data-state attributes to all sub-components
```

---

## Phase 3: CSS-Driven Styling

### Task 6: Move pill/line trigger visuals from CVA to CSS

The CVA `tabTriggerVariants` currently handles both structural AND visual concerns. Move visual styling (colors, backgrounds, borders) to CSS selectors in `base.css`, keeping only structural classes in CVA.

**Files:**
- Modify: `packages/radiants/base.css`
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`

**Step 1: Add tab trigger CSS to base.css**

Add after the button section (before the `data-tabs-accordion` override):

```css
/* ============================================================================
   Tab Trigger — Visual states via data attributes
   ============================================================================ */

/* Pill mode — inactive */
[data-slot="tab-trigger"][data-mode="pill"][data-state="default"] {
  background-color: transparent;
  color: var(--color-head);
}
[data-slot="tab-trigger"][data-mode="pill"][data-state="default"]:hover {
  background-color: var(--color-inv);
  color: var(--color-accent);
}

/* Pill mode — active */
[data-slot="tab-trigger"][data-mode="pill"][data-state="selected"] {
  background-color: var(--color-accent);
  color: var(--color-accent-inv);
}

/* Line mode — inactive */
[data-slot="tab-trigger"][data-mode="line"][data-state="default"] {
  background-color: transparent;
  border-radius: 0;
}
[data-slot="tab-trigger"][data-mode="line"][data-state="default"]:hover {
  background-color: var(--color-inv);
  color: var(--color-accent);
}

/* Line mode — active */
[data-slot="tab-trigger"][data-mode="line"][data-state="selected"] {
  background-color: var(--color-page);
  border-top: 1px solid var(--color-line);
  border-left: 1px solid var(--color-line);
  border-right: 1px solid var(--color-line);
  border-bottom: none;
  border-radius: 0;
  z-index: 10;
}
```

**Step 2: Simplify CVA to structural only**

Remove all color/bg/border/hover classes from `tabTriggerVariants`. Keep only structural:

```tsx
export const tabTriggerVariants = cva(
  `flex items-center px-4 py-2
   font-heading text-xs uppercase tracking-tight leading-none cursor-pointer select-none
   relative pixel-rounded-xs flex-1 shadow-none
   focus-visible:outline-none`,
  {
    variants: {
      mode: {
        pill: '',
        line: 'rounded-none',
      },
    },
    defaultVariants: {
      mode: 'pill',
    },
  }
);
```

Remove the `active` variant entirely — it's now handled by CSS `[data-state]` selectors.

Update the call site in Trigger:
```tsx
const classes = tabTriggerVariants({
  mode,
  className: `${icon ? 'gap-3' : 'gap-2 justify-center'} ${className}`.trim(),
});
```

**Step 3: Run tests**

Expected: All tests pass. Visual appearance should be unchanged.

**Step 4: Visually verify**

Run dev server: `cd /private/tmp/claude/tabs-refactor/apps/rad-os && npm run dev`

Check: WindowTabs pill triggers in RadiantsStudioApp, line triggers if any exist.

**Step 5: Commit**

```
refactor(tabs): move pill/line visual styling from CVA to CSS data-attribute selectors
```

---

### Task 7: Move capsule + sidebar trigger visuals to CSS

**Files:**
- Modify: `packages/radiants/base.css`
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`

**Step 1: Add capsule + sidebar CSS**

```css
/* Capsule mode — inactive */
[data-slot="tab-trigger"][data-mode="capsule"][data-state="default"] {
  background-color: transparent;
  color: var(--color-mute);
}
[data-slot="tab-trigger"][data-mode="capsule"][data-state="default"]:hover {
  background-color: var(--color-inv);
  color: var(--color-accent);
}

/* Capsule mode — active */
[data-slot="tab-trigger"][data-mode="capsule"][data-state="selected"] {
  background-color: var(--color-accent);
  color: var(--color-accent-inv);
}

/* Sidebar mode — inactive */
[data-slot="tab-trigger"][data-mode="sidebar"][data-state="default"] {
  background-color: transparent;
  color: var(--color-main);
}
[data-slot="tab-trigger"][data-mode="sidebar"][data-state="default"]:hover {
  background-color: var(--color-inv);
  color: var(--color-accent);
}

/* Sidebar mode — active */
[data-slot="tab-trigger"][data-mode="sidebar"][data-state="selected"] {
  background-color: var(--color-page);
  color: var(--color-head);
}
```

**Step 2: Simplify inline classes in Trigger**

Remove color/bg/hover Tailwind classes from capsule and sidebar render paths. Keep only structural classes:

**Capsule:**
```tsx
<button
  {...props}
  type="button"
  data-slot="tab-trigger"
  data-mode="capsule"
  data-state={isActive ? 'selected' : 'default'}
  className={`flex items-center justify-center cursor-pointer select-none border-none
    pixel-rounded-xs transition-all duration-300 ease-out focus-visible:outline-none
    ${isActive ? 'gap-1.5 px-2.5 py-1' : 'p-1'} ${className}`}
>
```

**Sidebar:**
```tsx
<button
  {...props}
  type="button"
  data-slot="tab-trigger"
  data-mode="sidebar"
  data-state={isActive ? 'selected' : 'default'}
  className={`flex items-center gap-2 w-full px-3 py-2 text-left font-heading text-xs
    uppercase tracking-tight leading-none pixel-rounded-sm cursor-pointer select-none
    transition-colors focus-visible:outline-none ${className}`}
>
```

**Step 3: Run tests + visual check**

Expected: Tests pass, ManifestoApp sidebar visually unchanged.

**Step 4: Commit**

```
refactor(tabs): move capsule + sidebar visual styling to CSS data-attribute selectors
```

---

## Phase 4: Triggers Consume Button

### Task 8: Sidebar triggers → Button component

Sidebar triggers are the simplest conversion — they're already ghost-button-shaped.

**Files:**
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`

**Step 1: Replace sidebar trigger rendering**

```tsx
if (layout === 'sidebar') {
  return (
    <BaseTabs.Tab
      value={value}
      render={(props) => {
        const isActive = props['aria-selected'] === true || props['aria-selected'] === 'true';
        return (
          <Button
            {...props}
            mode="ghost"
            size="md"
            fullWidth
            active={isActive}
            icon={icon}
            data-slot="tab-trigger"
            data-mode="sidebar"
          >
            {children}
          </Button>
        );
      }}
    />
  );
}
```

Note: Button already sets `data-state="selected"` when `active=true`, so the CSS from Task 7 will need to target `[data-slot="button-face"]` instead of `[data-slot="tab-trigger"]` for sidebar mode. **Alternative:** keep `data-slot="tab-trigger"` on a wrapper if needed, but prefer Button's native styling.

**Important consideration:** If Button's ghost mode already provides the right hover/active/selected states, we may not need the sidebar-specific CSS from Task 7 at all — Button handles it. Evaluate visually and remove redundant CSS.

**Step 2: Visually verify ManifestoApp sidebar**

Check that triggers look correct: hover state, active highlight, icon rendering, keyboard navigation.

**Step 3: Run tests**

Expected: Sidebar test (`uses vertical keyboard navigation in sidebar layout`) still passes.

**Step 4: Commit**

```
refactor(tabs): sidebar triggers consume Button component
```

---

### Task 9: Capsule triggers → Button component

**Files:**
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`

**Step 1: Replace capsule trigger rendering**

Capsule triggers expand from icon-only to icon+text when active. Map this to Button:

```tsx
if (layout === 'capsule') {
  return (
    <BaseTabs.Tab
      value={value}
      render={(props) => {
        const isActive = props['aria-selected'] === true || props['aria-selected'] === 'true';
        return (
          <Button
            {...props}
            mode={isActive ? 'solid' : 'ghost'}
            size="sm"
            iconOnly={!isActive}
            icon={icon}
            active={isActive}
            data-slot="tab-trigger"
            data-mode="capsule"
            className={className}
          >
            {isActive ? children : undefined}
          </Button>
        );
      }}
    />
  );
}
```

**Step 2: Visually verify** any capsule-layout consumer exists.

**Step 3: Run tests**

**Step 4: Commit**

```
refactor(tabs): capsule triggers consume Button component
```

---

### Task 10: Pill triggers → Button component

**Files:**
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`

**Step 1: Replace default pill trigger rendering**

```tsx
// Default pill/line path
return (
  <BaseTabs.Tab
    value={value}
    render={(props) => {
      const isActive = props['aria-selected'] === true || props['aria-selected'] === 'true';

      if (mode === 'line') {
        // Line mode keeps custom rendering — unique browser-tab look
        const classes = tabTriggerVariants({
          mode,
          className: `${icon ? 'gap-3' : 'gap-2 justify-center'} ${className}`.trim(),
        });
        return (
          <button
            {...props}
            type="button"
            className={classes}
            data-slot="tab-trigger"
            data-mode="line"
            data-state={isActive ? 'selected' : 'default'}
          >
            {children}
            {icon && (
              <>
                <span className="flex-1 h-px bg-line opacity-30" />
                {icon}
              </>
            )}
          </button>
        );
      }

      // Pill mode → Button
      return (
        <Button
          {...props}
          mode={isActive ? 'solid' : 'ghost'}
          size="sm"
          rounded="xs"
          icon={icon}
          active={isActive}
          data-slot="tab-trigger"
          data-mode="pill"
          className={`flex-1 ${className}`}
        >
          {children}
        </Button>
      );
    }}
  />
);
```

**Step 2: Remove `tabTriggerVariants` pill entries** — only line remains.

**Step 3: Run tests**

Expected: All existing tests pass (they test pill triggers via role="tab", clicks, and arrow keys).

**Step 4: Visually verify** WindowTabs triggers in RadiantsStudioApp.

**Step 5: Commit**

```
refactor(tabs): pill triggers consume Button component
```

---

## Phase 5: Cleanup

### Task 11: Remove redundant CSS and simplify CVA

After triggers consume Button, several CSS rules from Tasks 6-7 may be redundant (Button handles the styling). Audit and remove.

**Files:**
- Modify: `packages/radiants/base.css`
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`

**Step 1: Audit which `[data-slot="tab-trigger"]` CSS rules are still needed**

- Pill: Button handles it → remove pill CSS
- Sidebar: Button ghost handles it → remove sidebar CSS
- Capsule: Button handles it → remove capsule CSS
- Line: still custom → keep line CSS
- Accordion: already uses Button → no tab-trigger CSS needed

**Step 2: Simplify or remove `tabTriggerVariants`**

If only line mode remains, consider inlining the classes and removing the CVA entirely.

**Step 3: Remove `Frame` component if no consumers need it**

Check if `Tabs.Frame` is used anywhere besides WindowTabs. If WindowTabs is the only consumer, leave it but consider deprecation.

**Step 4: Run full test suite + visual verification**

**Step 5: Commit**

```
refactor(tabs): remove redundant CSS and simplify after Button adoption
```

---

### Task 12: Update schema, meta, and exports

**Files:**
- Modify: `packages/radiants/components/core/Tabs/Tabs.schema.json`
- Modify: `packages/radiants/components/core/Tabs/Tabs.meta.ts`

**Step 1: Update schema**

Add missing layouts to schema options:
```json
"layout": {
  "type": "enum",
  "options": ["default", "bottom-tabs", "sidebar", "dot", "capsule", "accordion"],
  "default": "default",
  "description": "Arrangement of tab list relative to content panels"
}
```

Rename variant → mode in both files.

**Step 2: Commit**

```
docs(tabs): update schema and meta to reflect mode rename and full layout options
```

---

## Risk Notes

1. **Button spread props compatibility** — When spreading Base UI's `{...props}` onto Button, verify that Button doesn't conflict with Base UI's ARIA attributes (`role`, `aria-selected`, `tabindex`). Button uses `BaseButton` which may set its own ARIA. Test keyboard nav carefully in Tasks 8-10.

2. **Visual regression** — Every trigger-to-Button conversion needs visual verification. Button's ghost/solid modes have specific hover/active animations (bevel gradients, `::after` borders) that may look different from the current tab triggers.

3. **Line mode stays custom** — Line mode's browser-tab aesthetic (top/left/right border, no bottom border, z-index overlap) doesn't map to any Button mode. It's the one trigger that remains custom.

4. **`data-slot` collision** — Accordion triggers already have a wrapper `div` with `data-slot="button-face"` for ghost-selected styling. Adding `data-slot="tab-trigger"` to the same element would overwrite. Use a wrapper or pick one slot.
