---
title: Base UI Select/Combobox Migration Gotchas
category: integration-issues
date: 2026-03-05
tags: [base-ui, select, combobox, portal, aria, react-19, migration]
---

# Base UI Select/Combobox Migration Gotchas

## Symptom

After migrating the RDNA `Select` component from a custom implementation to `@base-ui/react/select`, several regressions appeared:

1. **Dropdown floats in a fixed position** on screen and does not scroll with the trigger button.
2. Tests fail because `screen.getByRole('combobox')` returns nothing (was previously `listbox` or `button`).
3. Selecting an option with an empty-string default value causes the component to treat `''` as a valid selection, preventing the placeholder from reappearing.
4. The `onValueChange` callback receives a raw string value instead of a synthetic event, breaking existing `setValue` contracts.
5. CVA `open` variant no longer toggles because there is no explicit `open` prop on the trigger element.
6. Custom `data-variant`, `data-size`, and `data-open` attributes are lost from the trigger.

## Investigation

### Portal positioning regression

Base UI's `<Select.Portal>` removes the dropdown from the DOM flow entirely, placing it in a fixed-position container at the document root. This means:

- The dropdown does not reposition when the trigger scrolls.
- `z-index` stacking contexts are unpredictable.
- Layout-relative positioning (e.g., "directly below the trigger") breaks.

This was the most visually disruptive issue. The dropdown would appear at the correct position on initial open but drift away as the user scrolled.

### ARIA role change

Base UI's Select implements the **combobox** ARIA pattern, not the listbox-only pattern. The trigger element receives `role="combobox"` with `aria-expanded`, `aria-controls`, and `aria-haspopup` attributes. Existing tests that queried for `role="button"` or `role="listbox"` on the trigger failed silently.

### Null vs empty-string value semantics

Base UI treats `value={null}` as "no selection" (shows placeholder), but `value={''}` as "selected an option whose value is the empty string." When the initial state used `defaultValue: ''`, the component believed an option was already selected.

### onValueChange contract mismatch

The previous implementation passed events or event-like objects to change handlers. Base UI's `onValueChange` passes the raw selected value directly:

```ts
// Base UI signature
onValueChange: (value: string | string[] | null) => void

// Previous contract
onChange: (event: { target: { value: string } }) => void  // or just (value: string) => void
```

### Trigger render prop for open state

Base UI does not expose an `open` prop on `<Select.Trigger>`. The open/closed state is communicated via `aria-expanded` on the rendered trigger element. To derive a boolean `isOpen` for CVA variant switching, we need to use the `render` prop to inspect the props passed to the underlying element.

## Root Cause

Each issue traces back to a fundamental design difference between a custom select and Base UI's select:

| Issue | Custom Implementation | Base UI |
|-------|----------------------|---------|
| Dropdown positioning | Inline/relative | Portal-based (fixed) by default |
| Trigger ARIA role | `button` | `combobox` |
| "No selection" value | `''` (empty string) | `null` |
| Change callback | Event or value | Raw value only |
| Open state access | Explicit `open` prop | `aria-expanded` on trigger |
| Custom data attributes | Direct on element | Lost unless using `render` prop |

## Solution

### 1. Remove Portal, use Positioner directly

Replace `<BaseSelect.Portal>` with `<BaseSelect.Positioner>` to keep the dropdown in DOM flow, anchored to the trigger:

```tsx
// packages/radiants/components/core/Select/Select.tsx

function Content({ children, className = '' }: ContentProps): ReactNode {
  return (
    <BaseSelect.Positioner
      className={`
        z-50
        bg-page
        border border-line
        rounded-sm
        shadow-raised
        overflow-hidden
        ${className}
      `}
    >
      <BaseSelect.Popup>
        {children}
      </BaseSelect.Popup>
    </BaseSelect.Positioner>
  );
}
```

`Positioner` uses CSS-based anchoring relative to the trigger. It scrolls with the page and respects the parent stacking context. `Popup` is nested inside to hold the actual option list.

### 2. Set value to null for unselected state

Bridge the empty-string convention to Base UI's null convention in the Provider:

```tsx
// packages/radiants/components/core/Select/Select.tsx

function Provider({ state, actions, children }: ProviderProps): ReactNode {
  return (
    <BaseSelect.Root
      value={state.value || null}  // '' → null for Base UI
      onValueChange={(val) => {
        if (val !== null) {
          actions.setValue(val as string);
        }
      }}
      open={state.open}
      onOpenChange={(open) => actions.setOpen(open)}
      modal={false}
    >
      {children}
    </BaseSelect.Root>
  );
}
```

Key details:
- `state.value || null` converts empty string to `null`, which Base UI treats as "no selection."
- `onValueChange` guard (`val !== null`) prevents the consumer's `setValue` from being called with `null`.
- `modal={false}` is required for test environment compatibility (jsdom does not support the `inert` attribute that modal mode applies to the rest of the document).

### 3. Bridge onValueChange to existing setValue contract

The `onValueChange` callback receives a raw string, not an event. The `Provider` component handles this bridging:

```tsx
onValueChange={(val) => {
  if (val !== null) {
    actions.setValue(val as string);  // Bridge: raw value → existing setValue contract
  }
}}
```

The `useSelectState` hook preserves the original consumer API:

```tsx
export function useSelectState({
  defaultValue = '',
  value,
  onChange,
}: {
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
} = {}): { state: SelectState; actions: SelectActions } {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const isControlled = value !== undefined;
  const actualValue = isControlled ? value : internalValue;

  const setValue = useCallback((v: string) => {
    if (!isControlled) setInternalValue(v);
    onChange?.(v);
    setOpen(false);
  }, [isControlled, onChange]);

  return { state: { open, value: actualValue }, actions: { setOpen, setValue } };
}
```

Consumers call `useSelectState({ onChange })` and receive a plain string in `onChange` -- identical to the pre-migration API.

### 4. Use render prop to derive isOpen and preserve data attributes

The `render` prop on `<BaseSelect.Trigger>` gives access to the props Base UI applies to the underlying element, including `aria-expanded`:

```tsx
// packages/radiants/components/core/Select/Select.tsx

<BaseSelect.Trigger
  disabled={disabled}
  data-variant="select"
  data-size={size}
  render={(props) => {
    const isOpen = props['aria-expanded'] === true || props['aria-expanded'] === 'true';
    const classes = selectTriggerVariants({
      size,
      error,
      open: isOpen,
      className,
    });

    return (
      <button
        {...props}
        type="button"
        className={classes}
        data-variant="select"
        data-size={size}
        data-open={isOpen}
      >
        <span className={props.value ? 'text-main' : 'text-mute'}>
          {children ?? <BaseSelect.Value placeholder={placeholder} />}
        </span>
        <span className="flex-1 h-px bg-line opacity-30" />
        <span className={`shrink-0 text-main ${isOpen ? 'rotate-180' : ''}`}>
          {chevron || <DefaultChevron size={chevronSize} />}
        </span>
      </button>
    );
  }}
/>
```

Critical details:
- `props['aria-expanded']` can be boolean `true` or string `'true'` depending on rendering context -- check both.
- Spread `{...props}` first, then override `className` and `data-*` attributes after to ensure custom values win.
- `data-variant="select"`, `data-size`, and `data-open` are explicitly set on the rendered `<button>` since Base UI's `render` prop replaces the default element entirely.
- The CVA `open` variant now correctly toggles based on the derived `isOpen` boolean.

### 5. Set modal={false} for test compatibility

```tsx
<BaseSelect.Root
  modal={false}  // Required for jsdom test compat
  // ...
>
```

When `modal={true}` (the default), Base UI applies the `inert` attribute to sibling DOM nodes to trap focus. jsdom does not implement `inert`, causing tests to fail with unexpected focus behavior. Setting `modal={false}` disables this behavior.

### 6. Update tests for combobox role

Tests must query for the combobox role instead of button:

```tsx
// packages/radiants/components/core/Select/Select.test.tsx

test('trigger renders with placeholder text', () => {
  render(<TestSelect />);
  expect(screen.getByRole('combobox')).toBeInTheDocument();
});

test('trigger has aria-expanded that updates on open/close', async () => {
  const user = userEvent.setup();
  render(<TestSelect />);

  const trigger = screen.getByRole('combobox');
  expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await user.click(trigger);
  await vi.waitFor(() => {
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
```

The popup is queried via `role="listbox"` (this stays the same -- Base UI uses listbox for the option container).

## Prevention

1. **Always check ARIA roles after migration.** Base UI components may use different ARIA patterns than custom implementations. Run `screen.debug()` or inspect the DOM to verify roles before writing test assertions.

2. **Avoid `<Select.Portal>` for inline selects.** Use `<Select.Positioner>` directly unless you specifically need the dropdown to escape overflow clipping. Document this choice in component comments.

3. **Use `null` for "no selection."** When bridging to Base UI, convert empty strings to `null` at the provider boundary. Keep the consumer-facing API unchanged to avoid cascading changes.

4. **Use the `render` prop for custom trigger markup.** Do not attempt to wrap `<BaseSelect.Trigger>` in a div and read state from the parent -- the open/closed state lives on the trigger element's ARIA attributes.

5. **Set `modal={false}` in test environments.** Add a comment explaining why, since it changes the accessibility behavior in production if accidentally left on a component that should be modal.

6. **Test data attributes explicitly.** Base UI's `render` prop replaces the default element, so any custom data attributes must be explicitly set in the render function. Add test assertions like `expect(trigger).toHaveAttribute('data-variant', 'select')` to catch regressions.

## Related

- [Base UI Select documentation](https://base-ui.com/react/components/select)
- [ARIA combobox pattern (APG)](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- `packages/radiants/components/core/Select/Select.tsx` -- final implementation
- `packages/radiants/components/core/Select/Select.test.tsx` -- test suite
- `docs/solutions/tooling/vitest-component-harness-pnpm-monorepo.md` -- test harness setup
