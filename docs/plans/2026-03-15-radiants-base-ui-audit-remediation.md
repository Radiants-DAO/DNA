# Radiants Base UI Audit Remediation Implementation Plan

> **Status: ✅ COMPLETE** — Tasks 1–11 implemented and green (165/165 tests). Task 12 (Base UI upgrade) deferred — optional.
> **Completed:** 2026-03-15

**Goal:** Bring `packages/radiants/components/core` into contract alignment with Base UI, fix the confirmed behavior and accessibility regressions in the current wrappers, and isolate any true Base UI `1.3.x` migration work behind an explicit final task.

**Architecture:** Treat this remediation pass as a wrapper-hardening exercise against the installed dependency, `@base-ui/react@1.2.0`, because both `packages/radiants/package.json` and `packages/radiants/node_modules` resolve that version today. Fix verified bugs first with targeted Vitest coverage, then expand missing wrapper APIs where Base UI already supports them, and only then consider a docs-facing package upgrade.

**Tech Stack:** React 19, TypeScript, `@base-ui/react@1.2.0`, Vitest, Testing Library, pnpm

---

## Calibration Notes

- Confirmed bugs and gaps:
  - Toggle uncontrolled styling drifts from actual Base UI state.
  - Checkbox uncontrolled styling drifts from actual Base UI state.
  - Checkbox does not expose `indeterminate`, and does not explicitly cover `required` and `readOnly`.
  - Radio wraps each radio in its own group, so set-level arrow navigation is not modeled correctly.
  - Tabs sidebar layout never switches Base UI into vertical orientation.
  - Tabs `DotPill` is outside the ARIA tab model.
  - Tabs wrapper omits `Tabs.Indicator` and `keepMounted` support.
  - Tooltip creates a provider per tooltip and wraps triggers in a `div`.
  - HelpPanel bypasses Base UI overlay primitives entirely.
  - Select omits a portal, styles the wrong anatomy layer, and drops Base UI form and overlay hooks.
  - Combobox drops Base UI form and overlay hooks and omits `Combobox.Status`.
  - Switch, Slider, and several other form-like wrappers do not forward Base UI form props and event details.
  - Toast shadows manager state in local React state and omits `Action`, `swipeDirection`, `update`, and `promise`.
  - Menu-family wrappers omit submenu, checkbox/radio item, and group APIs.
- Downgraded from “bug” to version skew or cleanup:
  - `DrawerPreview` is the installed `1.2.0` export and is only a migration issue if Base UI is upgraded.
  - `Dialog`, `AlertDialog`, and `Sheet` are controlled wrappers, not true dual-state bugs.
  - Checkbox `defaultChecked` is forwarded via rest props; the real defect is visual-state desynchronization in uncontrolled mode.
  - Base UI ships `Slider.Value`, but not `Slider.Label`, in the installed API. Note: `Slider.Label` was added in 1.3.0 — Task 12 should wire it up post-upgrade.
- Critical composition bug:
  - `ContextMenu` uses split-primitive composition: `ContextMenu.Root` + `ContextMenu.Trigger` render one React tree, while `ContextMenuContent` renders `Menu.Portal` / `Menu.Positioner` / `Menu.Popup` from `@base-ui/react/menu` — a different primitive. These are genuinely disconnected roots. Task 9 must address this split-primitive composition, not treat it as cosmetic cleanup.
- Removed components (deprecated/deleted):
  - Accordion and Progress are intentionally removed from the component set. Stale references have been cleaned from the ESLint plugin, playground registry, and README.
- Deferred to Task 12 (require 1.3.0):
  - Drawer snap points and Provider/Indent/SwipeArea APIs (audit items #29/#30).
  - `Slider.Label` (added in 1.3.0).
  - Audit item #46 (Divider overlaps Separator, hardcoded h-[2px]).
- Do not upgrade `@base-ui/react` until Task 12. Fix behavior first, then decide whether the docs-facing API rename is worth the churn.

## Agent Topology

- Lead agent:
  - Task 1
  - Task 4
  - Task 12
- Agent A, selection and navigation:
  - Task 2
  - Task 3
  - Task 9
- Agent B, form contracts:
  - Task 5
  - Task 6
  - Task 7
- Agent C, feedback and overlays:
  - Task 8
  - Task 10
- Agent D, backlog cleanup:
  - Task 11 (was Task 12)
- Concurrency rule:
  - Do not let two agents edit the same wrapper file in parallel.
  - Treat `packages/radiants/components/core/index.ts` as a serial merge point.

## Work Signal Protocol

**work-start fires automatically** via `.claude/hooks/playground-work-signal.sh` whenever a component file is edited — no manual action needed.

After committing, signal completion for each component in the task:

```bash
node tools/playground/bin/rdna-playground.mjs work-end <component-id>
```

- `<component-id>` is **lowercase** (`toggle`, `dialog`, `dropdownmenu`, `alertdialog`, etc.)
- The hook fails silently if the playground isn't running on port 3004.

## Task 1: Baseline Contract Tests And Wrapper Policy

**Files:**
- Create: `packages/radiants/components/core/__tests__/base-ui-wrapper-policy.test.tsx`
- Modify: `packages/radiants/components/core/__tests__/smoke.test.tsx`
- Test: `packages/radiants/components/core/__tests__/base-ui-wrapper-policy.test.tsx`

**Step 1: Write the failing test**

Add a contract test that locks in the decisions for this remediation pass:

```tsx
it('pins the remediation pass to the installed Base UI 1.2.x contract', async () => {
  const pkg = await import('../../../node_modules/@base-ui/react/package.json');
  expect(pkg.version).toBe('1.2.0');
});
```

Add one smoke assertion per known wrapper cluster so later agents cannot silently remove exports while refactoring.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/__tests__/base-ui-wrapper-policy.test.tsx`

Expected: FAIL until the new test file exists.

**Step 3: Write minimal implementation**

- Create the new contract test file.
- Update the smoke test with any new exports that later tasks will add, such as `RadioGroup`, `Tabs.Indicator`, and `ToastAction`.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/__tests__/base-ui-wrapper-policy.test.tsx components/core/__tests__/smoke.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/__tests__/base-ui-wrapper-policy.test.tsx packages/radiants/components/core/__tests__/smoke.test.tsx
git commit -m "test: pin radiants base-ui wrapper baseline"
```

## Task 2: Toggle, Checkbox, And Radio State Modeling

**Files:**
- Modify: `packages/radiants/components/core/Toggle/Toggle.tsx`
- Create: `packages/radiants/components/core/Toggle/Toggle.test.tsx`
- Modify: `packages/radiants/components/core/Checkbox/Checkbox.tsx`
- Modify: `packages/radiants/components/core/Checkbox/Checkbox.test.tsx`
- Modify: `packages/radiants/components/core/index.ts`
- Test: `packages/radiants/components/core/Toggle/Toggle.test.tsx`
- Test: `packages/radiants/components/core/Checkbox/Checkbox.test.tsx`

**Step 1: Write the failing test**

Cover the actual failures instead of the misstated audit text:

```tsx
it('keeps Toggle styling in sync for uncontrolled defaultPressed usage', async () => {
  render(<Toggle defaultPressed>Power</Toggle>);
  expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button')).toHaveClass('bg-action-primary');
});

it('renders Checkbox visual state from uncontrolled defaultChecked and indeterminate state', () => {
  render(<Checkbox defaultChecked indeterminate label="Remember me" />);
  expect(screen.getByRole('checkbox')).toBePartiallyChecked();
});
```

Add radio-set coverage that fails until a real group model exists:

```tsx
it('supports arrow-key navigation across radios in the same set', async () => {
  render(
    <RadioGroup value="one" onValueChange={vi.fn()}>
      <Radio value="one" label="One" />
      <Radio value="two" label="Two" />
    </RadioGroup>,
  );
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/Toggle/Toggle.test.tsx components/core/Checkbox/Checkbox.test.tsx`

Expected: FAIL on uncontrolled styling, `indeterminate`, and radio group coverage.

**Step 3: Write minimal implementation**

- In `Toggle.tsx`, stop deriving variant classes from `pressed ?? defaultPressed`.
- Drive classes from Base UI render props or state attributes so uncontrolled state stays live after the first render.
- In `Checkbox.tsx`, explicitly support `defaultChecked`, `indeterminate`, `required`, and `readOnly`.
- Style Checkbox and Radio from live Base UI state instead of the incoming `checked` prop alone.
- Add a real `RadioGroup` wrapper that lets multiple `Radio` children share one Base UI group.
- Keep `Indicator` mounted when necessary so CSS transitions are possible. Add a test asserting `keepMounted` on Checkbox/Radio `Indicator` preserves the element in DOM when unchecked.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/Toggle/Toggle.test.tsx components/core/Checkbox/Checkbox.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Toggle/Toggle.tsx packages/radiants/components/core/Toggle/Toggle.test.tsx packages/radiants/components/core/Checkbox/Checkbox.tsx packages/radiants/components/core/Checkbox/Checkbox.test.tsx packages/radiants/components/core/index.ts
git commit -m "fix: align toggle and checkbox state contracts"
```

**Step 6: Signal work-end**

```bash
node tools/playground/bin/rdna-playground.mjs work-end toggle
node tools/playground/bin/rdna-playground.mjs work-end checkbox
node tools/playground/bin/rdna-playground.mjs work-end radio
```

## Task 3: Tabs Accessibility And Stateful Panels

**Files:**
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`
- Modify: `packages/radiants/components/core/Tabs/Tabs.test.tsx`
- Modify: `packages/radiants/components/core/index.ts`
- Test: `packages/radiants/components/core/Tabs/Tabs.test.tsx`

**Step 1: Write the failing test**

Cover the real gaps:

```tsx
it('uses vertical keyboard navigation in sidebar layout', async () => {
  render(<TestTabs layout="sidebar" />);
  await user.keyboard('{ArrowDown}');
  expect(screen.getByRole('tab', { name: /tab two/i })).toHaveFocus();
});

it('preserves panel state when keepMounted is enabled', async () => {
  render(<TestTabs keepMounted />);
  expect(screen.getByDisplayValue('draft value')).toBeInTheDocument();
});
```

Add a contract test for a public `Tabs.Indicator` export instead of keeping `DotPill` as the only animated selection UI.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/Tabs/Tabs.test.tsx`

Expected: FAIL on sidebar orientation, `keepMounted`, and `Indicator` coverage.

**Step 3: Write minimal implementation**

- Set `orientation="vertical"` for sidebar tabs on the relevant Base UI parts.
- Add `Tabs.Indicator` wrapper.
- Add `keepMounted` passthrough on `Tabs.Content`.
- Replace or demote `DotPill` so it is not the only interactive tab affordance outside the tablist model.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/Tabs/Tabs.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Tabs/Tabs.tsx packages/radiants/components/core/Tabs/Tabs.test.tsx packages/radiants/components/core/index.ts
git commit -m "fix: restore tabs accessibility and stateful panels"
```

**Step 6: Signal work-end**

```bash
node tools/playground/bin/rdna-playground.mjs work-end tabs
```

## Task 4: Overlay Callback And Imperative API Parity

**Files:**
- Modify: `packages/radiants/components/core/Dialog/Dialog.tsx`
- Modify: `packages/radiants/components/core/Dialog/Dialog.test.tsx`
- Modify: `packages/radiants/components/core/AlertDialog/AlertDialog.tsx`
- Create: `packages/radiants/components/core/AlertDialog/AlertDialog.test.tsx`
- Modify: `packages/radiants/components/core/Sheet/Sheet.tsx`
- Modify: `packages/radiants/components/core/Sheet/Sheet.test.tsx`
- Modify: `packages/radiants/components/core/Popover/Popover.tsx`
- Modify: `packages/radiants/components/core/Popover/Popover.test.tsx`
- Modify: `packages/radiants/components/core/Drawer/Drawer.tsx`
- Create: `packages/radiants/components/core/Drawer/Drawer.test.tsx`
- Modify: `packages/radiants/components/core/PreviewCard/PreviewCard.tsx`
- Create: `packages/radiants/components/core/PreviewCard/PreviewCard.test.tsx`
- Test: `packages/radiants/components/core/Dialog/Dialog.test.tsx`
- Test: `packages/radiants/components/core/AlertDialog/AlertDialog.test.tsx`
- Test: `packages/radiants/components/core/Sheet/Sheet.test.tsx`
- Test: `packages/radiants/components/core/Popover/Popover.test.tsx`
- Test: `packages/radiants/components/core/Drawer/Drawer.test.tsx`
- Test: `packages/radiants/components/core/PreviewCard/PreviewCard.test.tsx`

**Step 1: Write the failing test**

Add parity tests for each overlay family:

```tsx
it('forwards eventDetails.reason from onOpenChange', async () => {
  const onOpenChange = vi.fn();
  render(<DialogUnderTest onOpenChange={onOpenChange} />);
  await user.keyboard('{Escape}');
  expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'escape-key' }));
});

it('exposes actionsRef and onOpenChangeComplete', async () => {
  const actionsRef = { current: null };
  render(<PopoverUnderTest actionsRef={actionsRef} onOpenChangeComplete={vi.fn()} />);
  expect(actionsRef.current?.open).toBeTypeOf('function');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/Dialog/Dialog.test.tsx components/core/AlertDialog/AlertDialog.test.tsx components/core/Sheet/Sheet.test.tsx components/core/Popover/Popover.test.tsx components/core/Drawer/Drawer.test.tsx components/core/PreviewCard/PreviewCard.test.tsx`

Expected: FAIL until the wrappers expose Base UI callback details and imperative refs.

**Step 3: Write minimal implementation**

- Extend wrapper props and hooks to accept `onOpenChange(open, eventDetails)`.
- Forward `onOpenChangeComplete`.
- Forward `actionsRef`.
- Keep current convenience state hooks, but let them accept and re-emit Base UI event details.
- For `PreviewCard`, normalize the export style if needed while preserving current imports.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/Dialog/Dialog.test.tsx components/core/AlertDialog/AlertDialog.test.tsx components/core/Sheet/Sheet.test.tsx components/core/Popover/Popover.test.tsx components/core/Drawer/Drawer.test.tsx components/core/PreviewCard/PreviewCard.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Dialog/Dialog.tsx packages/radiants/components/core/Dialog/Dialog.test.tsx packages/radiants/components/core/AlertDialog/AlertDialog.tsx packages/radiants/components/core/AlertDialog/AlertDialog.test.tsx packages/radiants/components/core/Sheet/Sheet.tsx packages/radiants/components/core/Sheet/Sheet.test.tsx packages/radiants/components/core/Popover/Popover.tsx packages/radiants/components/core/Popover/Popover.test.tsx packages/radiants/components/core/Drawer/Drawer.tsx packages/radiants/components/core/Drawer/Drawer.test.tsx packages/radiants/components/core/PreviewCard/PreviewCard.tsx packages/radiants/components/core/PreviewCard/PreviewCard.test.tsx
git commit -m "feat: expose base-ui overlay callbacks and actions"
```

**Step 6: Signal work-end**

```bash
node tools/playground/bin/rdna-playground.mjs work-end dialog
node tools/playground/bin/rdna-playground.mjs work-end alertdialog
node tools/playground/bin/rdna-playground.mjs work-end sheet
node tools/playground/bin/rdna-playground.mjs work-end popover
node tools/playground/bin/rdna-playground.mjs work-end drawer
node tools/playground/bin/rdna-playground.mjs work-end previewcard
```

## Task 5: Tooltip Provider And Trigger Semantics

**Files:**
- Modify: `packages/radiants/components/core/Tooltip/Tooltip.tsx`
- Modify: `packages/radiants/components/core/Tooltip/Tooltip.test.tsx`
- Modify: `packages/radiants/components/core/index.ts`
- Test: `packages/radiants/components/core/Tooltip/Tooltip.test.tsx`

**Step 1: Write the failing test**

```tsx
it('does not inject an invalid wrapper around button triggers', () => {
  render(<Tooltip content="Info"><button>Open</button></Tooltip>);
  expect(screen.getByRole('button')).toBeInTheDocument();
});

it('supports shared provider delay at the app boundary', async () => {
  render(
    <Tooltip.Provider delay={600}>
      <Tooltip content="One"><button>One</button></Tooltip>
      <Tooltip content="Two"><button>Two</button></Tooltip>
    </Tooltip.Provider>,
  );
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/Tooltip/Tooltip.test.tsx`

Expected: FAIL until the wrapper exports a provider and stops forcing a `div` trigger wrapper.

**Step 3: Write minimal implementation**

- Export a `Tooltip.Provider`.
- Remove the per-instance provider from `Tooltip`.
- Render triggers with `render={children}` or another as-child-compatible pattern.
- Make `delay` opt-in instead of hard-coding `0`.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/Tooltip/Tooltip.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Tooltip/Tooltip.tsx packages/radiants/components/core/Tooltip/Tooltip.test.tsx packages/radiants/components/core/index.ts
git commit -m "fix: align tooltip provider and trigger semantics"
```

**Step 6: Signal work-end**

```bash
node tools/playground/bin/rdna-playground.mjs work-end tooltip
```

## Task 6: Select And Combobox Form And Portal Parity

**Files:**
- Modify: `packages/radiants/components/core/Select/Select.tsx`
- Modify: `packages/radiants/components/core/Select/Select.test.tsx`
- Modify: `packages/radiants/components/core/Combobox/Combobox.tsx`
- Create: `packages/radiants/components/core/Combobox/Combobox.test.tsx`
- Modify: `packages/radiants/components/core/index.ts`
- Test: `packages/radiants/components/core/Select/Select.test.tsx`
- Test: `packages/radiants/components/core/Combobox/Combobox.test.tsx`

**Step 1: Write the failing test**

```tsx
it('submits Select values through FormData and portals the popup', async () => {
  render(<SelectForm name="planet" defaultValue="mars" />);
  expect(new FormData(screen.getByTestId('form')).get('planet')).toBe('mars');
});

it('announces Combobox result count through Combobox.Status', async () => {
  render(<ComboboxUnderTest />);
  await user.type(screen.getByRole('combobox'), 'm');
  expect(screen.getByRole('status')).toHaveTextContent(/match/i);
});
```

Add callback tests that assert Base UI `eventDetails` is preserved for `onOpenChange` and `onValueChange`.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/Select/Select.test.tsx components/core/Combobox/Combobox.test.tsx`

Expected: FAIL on form submission, portal behavior, status region, and event-detail forwarding.

**Step 3: Write minimal implementation**

- Add `name`, `required`, `readOnly`, `onOpenChangeComplete`, and `actionsRef` passthrough where Base UI supports them.
- Wrap `Select.Content` in `BaseSelect.Portal`.
- Move popup styling from `Positioner` to `Popup`.
- Add `Combobox.Status`.
- Forward Base UI `eventDetails` instead of collapsing them to bare values.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/Select/Select.test.tsx components/core/Combobox/Combobox.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Select/Select.tsx packages/radiants/components/core/Select/Select.test.tsx packages/radiants/components/core/Combobox/Combobox.tsx packages/radiants/components/core/Combobox/Combobox.test.tsx packages/radiants/components/core/index.ts
git commit -m "fix: align select and combobox wrapper contracts"
```

**Step 6: Signal work-end**

```bash
node tools/playground/bin/rdna-playground.mjs work-end select
node tools/playground/bin/rdna-playground.mjs work-end combobox
```

## Task 7: Switch, Slider, And NumberField Form Contracts

**Files:**
- Modify: `packages/radiants/components/core/Switch/Switch.tsx`
- Modify: `packages/radiants/components/core/Switch/Switch.test.tsx`
- Modify: `packages/radiants/components/core/Slider/Slider.tsx`
- Modify: `packages/radiants/components/core/Slider/Slider.test.tsx`
- Modify: `packages/radiants/components/core/NumberField/NumberField.tsx`
- Create: `packages/radiants/components/core/NumberField/NumberField.test.tsx`
- Modify: `packages/radiants/components/core/index.ts`
- Test: `packages/radiants/components/core/Switch/Switch.test.tsx`
- Test: `packages/radiants/components/core/Slider/Slider.test.tsx`
- Test: `packages/radiants/components/core/NumberField/NumberField.test.tsx`

**Step 1: Write the failing test**

```tsx
it('forwards Switch name, required, and readOnly into form submission and validation', () => {
  render(<Switch checked={true} onChange={vi.fn()} name="enabled" required />);
  expect(screen.getByRole('switch')).toHaveAttribute('name', 'enabled');
});

it('forwards Slider name and eventDetails and exports Slider.Value', async () => {
  const onChange = vi.fn();
  render(<Slider value={10} onChange={onChange} name="volume" showValue />);
});

it('forwards NumberField readOnly and commit event details', async () => {
  render(<NumberField.Root readOnly onValueChange={vi.fn()} />);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/Switch/Switch.test.tsx components/core/Slider/Slider.test.tsx components/core/NumberField/NumberField.test.tsx`

Expected: FAIL on missing form props and missing event details.

**Step 3: Write minimal implementation**

- Add `name`, `required`, and `readOnly` props to `Switch`.
- Preserve Base UI `eventDetails` in `onCheckedChange` and `onValueChange`.
- Add `name` passthrough to `Slider`.
- Export `Slider.Value`; do not invent a `Slider.Label` wrapper — Base UI 1.2.0 does not ship it. (1.3.0 adds `Slider.Label`; wire it up in Task 12 post-upgrade.)
- Add `readOnly` passthrough to `NumberField.Root`.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/Switch/Switch.test.tsx components/core/Slider/Slider.test.tsx components/core/NumberField/NumberField.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Switch/Switch.tsx packages/radiants/components/core/Switch/Switch.test.tsx packages/radiants/components/core/Slider/Slider.tsx packages/radiants/components/core/Slider/Slider.test.tsx packages/radiants/components/core/NumberField/NumberField.tsx packages/radiants/components/core/NumberField/NumberField.test.tsx packages/radiants/components/core/index.ts
git commit -m "fix: restore form parity for switch slider and number-field"
```

**Step 6: Signal work-end**

```bash
node tools/playground/bin/rdna-playground.mjs work-end switch
node tools/playground/bin/rdna-playground.mjs work-end slider
node tools/playground/bin/rdna-playground.mjs work-end numberfield
```

## Task 8: Toast Manager Parity And Live Region Cleanup

**Files:**
- Modify: `packages/radiants/components/core/Toast/Toast.tsx`
- Modify: `packages/radiants/components/core/Toast/Toast.test.tsx`
- Modify: `packages/radiants/components/core/Alert/Alert.tsx`
- Modify: `packages/radiants/components/core/index.ts`
- Test: `packages/radiants/components/core/Toast/Toast.test.tsx`

**Step 1: Write the failing test**

```tsx
it('does not expose stale toast state through useToast', async () => {
  render(<ToastHarness />);
  await user.click(screen.getByText('Show Toast'));
  expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
});

it('supports toast action and toast promise flows', async () => {
  render(<ToastHarness />);
  await user.click(screen.getByText('Show Promise Toast'));
  expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
});
```

Add a test that verifies the rendered toast does not double-announce by nesting a custom `role="alert"` inside Base UI toast live-region behavior.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/Toast/Toast.test.tsx`

Expected: FAIL until the wrapper exposes manager-backed state and action APIs.

**Step 3: Write minimal implementation**

- Stop shadowing toast manager state in local `useState` unless it is strictly derived and synchronous.
- Add `Toast.Action`.
- Expose `toast.update()` and `toast.promise()` through the wrapper context.
- Configure `swipeDirection`.
- Let `Alert.Root` accept a configurable role or render a non-alert container inside toasts.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/Toast/Toast.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Toast/Toast.tsx packages/radiants/components/core/Toast/Toast.test.tsx packages/radiants/components/core/Alert/Alert.tsx packages/radiants/components/core/index.ts
git commit -m "feat: align toast wrapper with base-ui manager api"
```

**Step 6: Signal work-end**

```bash
node tools/playground/bin/rdna-playground.mjs work-end toast
node tools/playground/bin/rdna-playground.mjs work-end alert
```

## Task 9: Menu Family Expansion And ContextMenu Cleanup

**Files:**
- Modify: `packages/radiants/components/core/Menubar/Menubar.tsx`
- Modify: `packages/radiants/components/core/DropdownMenu/DropdownMenu.tsx`
- Modify: `packages/radiants/components/core/DropdownMenu/DropdownMenu.test.tsx`
- Modify: `packages/radiants/components/core/ContextMenu/ContextMenu.tsx`
- Modify: `packages/radiants/components/core/ContextMenu/ContextMenu.test.tsx`
- Modify: `packages/radiants/components/core/index.ts`
- Test: `packages/radiants/components/core/DropdownMenu/DropdownMenu.test.tsx`
- Test: `packages/radiants/components/core/ContextMenu/ContextMenu.test.tsx`

**Step 1: Write the failing test**

```tsx
it('supports submenu and checkbox item flows in dropdown menus', async () => {
  render(<DropdownMenuWithSubmenu />);
  expect(screen.getByRole('menuitemcheckbox')).toBeInTheDocument();
});

it('supports grouped context menu items with accessible labels', async () => {
  render(<ContextMenuWithGroups />);
  expect(screen.getByText('Clipboard')).toHaveAttribute('id');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/DropdownMenu/DropdownMenu.test.tsx components/core/ContextMenu/ContextMenu.test.tsx`

Expected: FAIL until submenu, group, and checkbox/radio item APIs exist.

**Step 3: Write minimal implementation**

- Add `Group`, `GroupLabel`, `CheckboxItem`, `RadioGroup`, `RadioItem`, `SubmenuRoot`, `SubmenuTrigger`, and `SubmenuContent` wrappers to the menu-family components.
- Remove redundant `if (!disabled)` click guards where Base UI already enforces disabled behavior.
- In `ContextMenu.tsx`, fix the split-primitive composition: unify the disconnected `ContextMenu.Root`/`ContextMenu.Trigger` tree with the `Menu.Portal`/`Menu.Positioner`/`Menu.Popup` tree so they share a single Base UI context root. This is a critical bug, not cosmetic cleanup.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/DropdownMenu/DropdownMenu.test.tsx components/core/ContextMenu/ContextMenu.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Menubar/Menubar.tsx packages/radiants/components/core/DropdownMenu/DropdownMenu.tsx packages/radiants/components/core/DropdownMenu/DropdownMenu.test.tsx packages/radiants/components/core/ContextMenu/ContextMenu.tsx packages/radiants/components/core/ContextMenu/ContextMenu.test.tsx packages/radiants/components/core/index.ts
git commit -m "feat: add missing menu-family primitives"
```

**Step 6: Signal work-end**

```bash
node tools/playground/bin/rdna-playground.mjs work-end menubar
node tools/playground/bin/rdna-playground.mjs work-end dropdownmenu
node tools/playground/bin/rdna-playground.mjs work-end contextmenu
```

## Task 10: HelpPanel Rebuild On Base UI Overlay Primitives

**Files:**
- Modify: `packages/radiants/components/core/HelpPanel/HelpPanel.tsx`
- Create: `packages/radiants/components/core/HelpPanel/HelpPanel.test.tsx`
- Test: `packages/radiants/components/core/HelpPanel/HelpPanel.test.tsx`

**Step 1: Write the failing test**

```tsx
it('traps focus, exposes aria-expanded, and portals content', async () => {
  render(<HelpPanelHarness />);
  await user.click(screen.getByRole('button'));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

Add assertions for `aria-controls`, `aria-expanded`, `Escape`, and focus return.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/HelpPanel/HelpPanel.test.tsx`

Expected: FAIL until the component uses Base UI overlay behavior instead of manual DOM listeners.

**Step 3: Write minimal implementation**

- Rebuild `HelpPanel` on `Dialog` or `Popover`, depending on whether it should behave as modal or modeless.
- Replace manual `role="button"` trigger handling with Base UI trigger primitives.
- Portal the content and rely on Base UI for escape handling and focus management.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/HelpPanel/HelpPanel.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/HelpPanel/HelpPanel.tsx packages/radiants/components/core/HelpPanel/HelpPanel.test.tsx
git commit -m "fix: rebuild help panel on base-ui overlay primitives"
```

**Step 6: Signal work-end**

```bash
node tools/playground/bin/rdna-playground.mjs work-end helppanel
```

## Task 11: Low-Priority Contract Cleanup

**Files:**
- Modify: `packages/radiants/components/core/Button/Button.tsx`
- Modify: `packages/radiants/components/core/Input/Input.tsx`
- Modify: `packages/radiants/components/core/Avatar/Avatar.tsx`
- Modify: `packages/radiants/components/core/Meter/Meter.tsx`
- Modify: `packages/radiants/components/core/ScrollArea/ScrollArea.tsx`
- Modify: `packages/radiants/components/core/Toolbar/Toolbar.tsx`
- Modify: `packages/radiants/components/core/Button/Button.test.tsx`
- Create: `packages/radiants/components/core/Meter/Meter.test.tsx`
- Create: `packages/radiants/components/core/ScrollArea/ScrollArea.test.tsx`
- Test: `packages/radiants/components/core/Button/Button.test.tsx`
- Test: `packages/radiants/components/core/Meter/Meter.test.tsx`
- Test: `packages/radiants/components/core/ScrollArea/ScrollArea.test.tsx`

**Step 1: Write the failing test**

```tsx
it('supports focusableWhenDisabled when Button delegates to Base UI Button', () => {
  render(<Button disabled focusableWhenDisabled>Open</Button>);
});

it('requires a meter label or aria-label', () => {
  render(<Meter value={10} aria-label="Signal strength" />);
});
```

Add a ScrollArea test that forces a decision on the dead `type` prop:

```tsx
it('either forwards type or removes it from the public API', () => {
  expectTypeOf<ScrollAreaProps>().not.toHaveProperty('type');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/Button/Button.test.tsx components/core/Meter/Meter.test.tsx components/core/ScrollArea/ScrollArea.test.tsx`

Expected: FAIL until the wrappers are cleaned up.

**Step 3: Write minimal implementation**

- Delegate `Button` to Base UI Button — adds `focusableWhenDisabled` as a net improvement.
- Evaluate whether `Input` should delegate to Base UI Input or integrate through `Field`.
- Fix audit #46: Divider overlaps Separator, hardcoded `h-[2px]` — normalize to semantic token or Separator primitive.
- Fix audit #38: Switch manual data attributes — ensure Base UI data attributes are forwarded, not hand-rolled.
- Add Avatar fallback delay.
- Add `Meter.Label` or explicit `aria-label` support.
- Either wire `ScrollArea.type` correctly or remove it from the public API.
- Remove redundant `role="toolbar"` from `Toolbar.Root`.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/Button/Button.test.tsx components/core/Meter/Meter.test.tsx components/core/ScrollArea/ScrollArea.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Button/Button.tsx packages/radiants/components/core/Input/Input.tsx packages/radiants/components/core/Avatar/Avatar.tsx packages/radiants/components/core/Meter/Meter.tsx packages/radiants/components/core/ScrollArea/ScrollArea.tsx packages/radiants/components/core/Toolbar/Toolbar.tsx packages/radiants/components/core/Button/Button.test.tsx packages/radiants/components/core/Meter/Meter.test.tsx packages/radiants/components/core/ScrollArea/ScrollArea.test.tsx
git commit -m "chore: clean up remaining radiants wrapper contracts"
```

**Step 6: Signal work-end**

```bash
node tools/playground/bin/rdna-playground.mjs work-end button
node tools/playground/bin/rdna-playground.mjs work-end input
node tools/playground/bin/rdna-playground.mjs work-end avatar
node tools/playground/bin/rdna-playground.mjs work-end meter
node tools/playground/bin/rdna-playground.mjs work-end scrollarea
node tools/playground/bin/rdna-playground.mjs work-end toolbar
```

## Task 12: Optional Base UI Docs/API Migration

**Files:**
- Modify: `packages/radiants/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `packages/radiants/components/core/Drawer/Drawer.tsx`
- Modify: any wrapper files affected by upstream API renames discovered during upgrade
- Test: `packages/radiants/components/core/**/*.test.tsx`

**Step 1: Write the failing test**

Create or update an upgrade guard test only after Tasks 1 through 11 are green:

```tsx
it('uses the stable drawer namespace export after the package upgrade', async () => {
  const mod = await import('@base-ui/react/drawer');
  expect(mod).toHaveProperty('Drawer');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @rdna/radiants exec vitest run components/core/__tests__/base-ui-wrapper-policy.test.tsx`

Expected: FAIL while the project still resolves `1.2.0`.

**Step 3: Write minimal implementation**

- Verify the latest published Base UI version before editing dependencies.
- Upgrade `@base-ui/react`.
- Rename `DrawerPreview` imports only if the upgraded package truly exports `Drawer`.
- Wire up `Slider.Label` (new in 1.3.0).
- Add Drawer snap points and Provider/Indent/SwipeArea APIs if available in the upgraded version.
- Reconcile any other upstream rename or prop changes revealed by the test suite.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @rdna/radiants exec vitest run`

Expected: PASS across the full Radiants component suite.

**Step 5: Commit**

```bash
git add packages/radiants/package.json pnpm-lock.yaml packages/radiants/components/core/Drawer/Drawer.tsx packages/radiants/components/core/__tests__/base-ui-wrapper-policy.test.tsx
git commit -m "chore: upgrade radiants to latest base-ui api"
```

**Step 6: Signal work-end**

```bash
node tools/playground/bin/rdna-playground.mjs work-end drawer
node tools/playground/bin/rdna-playground.mjs work-end slider
```

## Parallel Execution Order

1. Execute Task 1 first.
2. Start Tasks 2, 3, 5, 8, and 10 in parallel after Task 1 lands.
3. Start Tasks 4, 6, and 7 once the shared wrapper policy from Task 1 is merged.
4. Run Task 9 after Tasks 2 and 4, so shared menu and overlay conventions are already stable.
5. Run Task 11 after Tasks 5 through 7, because it touches the same form-control conventions.
6. Run Task 12 last, only if the dependency upgrade remains desirable after the behavior fixes are green.
