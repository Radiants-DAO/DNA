# impl-06 — SegmentGroup extraction + Tabs/Toolbar refactor

Ref: `03-tabs-toolbar.md` (F1, F2, F4, F5, F6, F7, F8, F9, F10, F11, F12).

## Files changed (LOC delta)

| File | Before | After | Δ |
|---|--:|--:|--:|
| `packages/radiants/components/core/_shared/SegmentGroup.tsx` | 0 | 109 | +109 (new) |
| `packages/radiants/components/core/Tabs/Tabs.tsx` | 450 | 457 | +7 |
| `packages/radiants/components/core/Toolbar/Toolbar.tsx` | 253 | 267 | +14 |

Net `Tabs`/`Toolbar` LOC is ~flat because comments documenting the shared
primitive replaced CVA bloat. The new `_shared/` directory is shared with
the concurrent ModalShell work.

## New `SegmentGroup` API

```tsx
<SegmentGroup
  orientation="horizontal" | "vertical"
  density="compact" | "comfortable" | "none"   // gap + padding
  surface="card" | "page" | "none"             // bg paint
  corner="xs" | "sm" | "none"                  // pixel-rounded-*
  render?={({ className }) => ReactElement}    // escape hatch for headless primitives
  className?
/>
```

Emits `inline-flex items-center` + `flex-{row|col}` + density + surface + corner.
When `render` is supplied (all 3 current call sites) SegmentGroup hands the
resolved className to the caller's primitive (`BaseTabs.List`,
`BaseToolbar.Root`, `BaseToolbar.Group`) so the DOM element stays
`activateOnFocus`-aware / keyboard-orchestrated.

## Call sites

| Consumer | Variants |
|---|---|
| `Tabs.List` (capsule only) | `card` + `xs` + `comfortable` (gap-1 p-1) |
| `Toolbar.Root` | `page` + `sm` + `compact` (gap-0.5 p-0.5) |
| `ToolbarGroup` | `none` + `none` + `none` (layout-only; inherits parent paint) |

Chrome-mode `Tabs.List` does NOT use SegmentGroup — absolute-positioned
chrome has its own alignment needs (`CHROME_ALIGN_CLASS`). Intentional.
Sidebar (`position="left"`) List also stays unchanged.

## Bugs fixed

- **F10 (ToolbarSeparator vertical 0-width)** — fixed. Vertical toolbars
  now emit `h-px w-full my-1` (was `h-px mx-1` — no width, no stretch).
  Horizontal variant cleaned up: `w-px self-stretch mx-0.5` (dropped
  the duplicate `self-stretch` that used to live on the CVA base).
- **F8 (Toolbar `inline-block` + `inline-flex` collision)** — fixed at
  all 3 sites (`ToolbarRoot`, `ToolbarButton`, `ToolbarLink`). The
  dead `inline-block` class no longer appears in any rendered
  className.

## CVA branches deleted

- `tabsListVariants.mode.chrome` — dead code; `List` already bypassed
  CVA for chrome (F6). The whole `mode` variant on `tabsListVariants`
  is gone — capsule now flows through SegmentGroup, not CVA.
- `tabsContentVariants` — replaced with a 1-line ternary; two of three
  position branches were empty strings (F12).
- `toolbarRootVariants.orientation` — moved to SegmentGroup; only the
  `disabled` state stays on the Toolbar-specific CVA.

## Other findings applied

- **F1** — capsule `List` outer `<div>` collapsed; `shrink-0 self-center
  my-2` now lives on the BaseTabs.List className.
- **F2** — `DotPill` double-div flattened into one element carrying
  `pixel-rounded-sm bg-main flex ... h-4 py-0.5 px-1 gap-1`. Test
  still finds `bg-main` + `pixel-rounded-sm` on same element.
- **F4** — `pixel-rounded-xs` moved onto `<button>` via
  `tabsTriggerVariants.mode.capsule` base. Pass-through wrapper `<div>`
  in the non-chrome Trigger branch removed. Test uses `closest(...)`
  which still matches (closest includes self).
- **F5** — `bg-transparent` folded into
  `tabsTriggerVariants.mode.chrome` base (was repeated on both
  active/inactive inline branches).
- **F7** — `tabsRootVariants.position.top/bottom` stay as two entries
  with identical strings, but commented to note they're intentionally
  distinct for consumer data-attr semantics. Low priority; no behavior
  change.
- **F9** — SegmentGroup's `compact` density == `toolbarRootVariants`'
  old base. ToolbarGroup now composes the same primitive with
  `density="none"`; layout duplication eliminated.
- **F12** — `toolbarButtonVariants` / `toolbarLinkVariants` now include
  `pixel-rounded-xs` in base (was tacked on in the JSX template
  string). Removes the `inline-block` collision site.

## Deferred / explicit non-goals

- **F3 sidebar `List` wrapper** — left as-is. The `<div>` stacks
  `DotPill` + `BaseTabs.List` vertically; swapping to sibling-of-Root
  render would change Tabs' public markup shape and risk the
  `position="left"` ARIA tree the test suite relies on for arrow-key
  nav. Out of scope for this pass.
- **F7 top/bottom identical strings** — left with two entries for
  readability; collapsing into a single key would require routing
  `data-position` separately.
- Chrome-mode `List` alignment (absolute positioning) — kept
  hand-built. SegmentGroup doesn't model absolute layout; forcing it
  to would over-generalize.

## Validation

- `pnpm --filter @rdna/radiants test -- --run Tabs Toolbar` — all Tabs
  + Toolbar tests pass. The 2 failing tests in the output
  (Dialog/Sheet `.bg-hover` backdrop click) are pre-existing and
  unrelated to this change.
- `npx tsc --noEmit --project packages/radiants/tsconfig.json` — clean.
- Public exports of `Tabs.{Root,List,Trigger,Content,Indicator,DotPill}`
  and `Toolbar.{Root,Button,Separator,Link,Group}` unchanged.
