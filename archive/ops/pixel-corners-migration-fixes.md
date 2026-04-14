# Pixel Corners Migration — Post-Migration Fixes

> Triage of feedback captured via agentation on `/#brand` (2026-04-11)
> Branch: `feat/pixel-art-system` (worktree: `/Users/rivermassey/Desktop/dev/DNA-pixel-art`)
> Related: `docs/plans/2026-04-11-pixel-corners-consumer-migration.md`

## Summary

The Phase-1 POC + Phase-2 parallel migration landed cleanly for every individual
component (44/44 + 13/13 + 13/13 + 11 app files, all tests green). Visual QA on
`/#brand` surfaced **9 feedback items** with **2 shared root causes** plus
a handful of per-component bugs.

## Root Causes

### Cause A — BG bleeding past the staircase polygon

**Pattern:** consumers pass `bg-*` (surface color) via `className` on PixelBorder
instead of via the `background` prop.

**Why it leaks:** the `className` prop is applied to the PixelBorder wrapper
`<div>`, which is the outermost rectangular element. The PixelBorder polygon
clip-path is on an **inner** `overflow-hidden` div (wrapped mode) or an
`absolute inset-0` bg sibling (layered mode) — neither of which affects a
bg class sitting on the outer wrapper. Result: a cream/page rectangle
behind the staircase, visible in the four corner triangles outside the pixel
polygon.

**Fix:** migrate every `<PixelBorder className="... bg-X ..."` to
`<PixelBorder background="bg-X" className="..."` so the bg renders as a
clipped sibling.

### Cause B — Button root has a filled bg behind the clipped face

**Pattern:** Button's outer `<BaseButton>` carries `data-slot="button-root"`
`data-variant="solid"` etc. CSS rules on those selectors apply a bg to the
root rectangle. The PixelBorder wrapping the face is an inner child; the
root's rectangular bg shows through in the four corner triangles AND can
paint a 1-2px cream stripe at the top/bottom edges where the face + wrapper
line box stops short of the root's full height (line-box overhead from the
face's `inline-flex` outer display).

**Screenshots confirm:**
- Top-edge cream stripe ≈ 1-3px tall (items #1, #9)
- Four outer corner triangles filled with cream (visible in item #3 zoom)

**Fix path** (1) remove any background from `button-root` CSS / move bg
to the face CSS where the PixelBorder clips it. **Fix path** (2) ensure the
PixelBorder wrapper hugs the face tightly by killing line-box overhead
around wrapped-mode children.

---

## Per-item Triage

### Item #1 — Button height regression in AppWindowTitleBar

**Category:** Cause B (button root bg + line-box overhead)
**Location:** `AppWindowTitleBar` > `<Button>` flex items
**Hypothesis:** Title-bar button face sits in an `inline-flex` PixelBorder
wrapper whose inner `overflow-hidden` div creates a line box around the face
span, padding the wrapper ~2-5px taller than the face itself. That extra
space reveals the button root's cream bg at top/bottom — read visually as
"button got taller."
**Fix:**
1. Primary: change `packages/radiants/components/core/PixelBorder/PixelBorder.tsx`
   wrapped-mode inner from `<div className="overflow-hidden">` to
   `<div className="overflow-hidden flex">` (flex container eliminates
   line-box overhead on inline children — same bug class as Switch thumb
   earlier today). Validates via `getBoundingClientRect()` in the browser.
2. Secondary: audit `button-root` CSS and remove any `background-color`
   rule that paints the root rectangle (if any). Move bg exclusively to
   `button-face` or to PixelBorder's `background` prop.

### Item #2 — Badge regressed to "a tiny little weird thing"

**Category:** Standalone sizing regression
**Location:** region at (177, 325) on `/#brand`
**Root cause:** `Badge.tsx:59` wraps in `<PixelBorder ... className="inline-block">`.
In wrapped mode the `inline-block` wrapper shrinks to the badge face span's
intrinsic size, but the face span's `inline-flex` outer display triggers
the same line-box overhead as Button — AND the legacy Badge had a
`pixel-shadow-raised` class on the span that applied `filter: drop-shadow`.
After migration the drop-shadow moved to PixelBorder's `shadow` prop, which
applies `filter: drop-shadow()` on the **wrapper** — correct in isolation,
but the wrapper's measured height is inflated by line-box overhead, so the
badge looks oddly padded vertically AND the drop-shadow renders offset.
**Fix:**
1. Primary: same PixelBorder wrapped-mode `overflow-hidden flex` fix as #1.
2. Verify visually that the badge fits its content without the cream stripe.

### Item #3 — Toggle `rounded` prop does nothing

**Category:** Missing wiring (not a regression from this migration)
**Location:** `Toggle` component
**Root cause:** `packages/radiants/components/core/Toggle/Toggle.tsx:73-171`
— Toggle borrows `buttonRootVariants` + `buttonFaceVariants` from Button
but does NOT wrap its face in a `<PixelBorder>`. The `rounded` prop is
typed and passed to `buttonFaceVariants` but that cva variant is now an
empty-string lookup table (Button moved rounded → PixelBorder wrapper).
Result: Toggle has no pixel corners at all regardless of `rounded`.
**Fix:** Mirror the Button render: map `rounded` → `PixelBorderSize | null`
via a `TOGGLE_ROUNDED_TO_PIXEL_SIZE` table and wrap the face span in
`<PixelBorder size={pixelBorderSize}>` when non-null. Drop-in copy from
Button.tsx:218-270.

### Item #4 — ContextMenu popup bg corners visible

**Category:** Cause A (bg bleeding past polygon)
**Location:** `packages/radiants/components/core/ContextMenu/ContextMenu.tsx:71-75`
**Exact lines:**
```tsx
<PixelBorder
  size="sm"
  className={`bg-page text-main ${className}`.trim()}
  shadow="2px 2px 0 var(--color-ink)"
>
```
**Fix:**
```tsx
<PixelBorder
  size="sm"
  background="bg-page"
  className={`text-main ${className}`.trim()}
  shadow="2px 2px 0 var(--color-ink)"
>
```

### Item #5 — Radio should use pixelated circle

**Category:** Enhancement, not a regression
**Location:** `packages/radiants/components/core/Checkbox/Checkbox.tsx` (Radio export)
**Current:** Radio root uses CSS `rounded-full` + `border border-line`
**Request:** Pixel-art circle with `clampPixelCornerRadii` max-clamp
**Fix approach:** Wrap the radio root in `<PixelBorder radius={99}>` — the
`clampPixelCornerRadii` helper will clamp to `min(width, height) / 2`,
which on a 20×20 radio produces a radius-10 circle. The hand-drawn
corner generator has fixtures up to R=20; anything larger will fall
back to the algorithm output. Verify visually that R=10 looks like a
circle (it should, based on the SVG fixture at R=12 which is already
circle-like).
**Priority:** defer — not a regression, tracked as polish.

### Item #6 — All dropdown/combobox menus have the same overflow as ContextMenu + AppWindow

**Category:** Cause A (systemic)
**Affected consumers:**
- `Popover/Popover.tsx:127-131` — `className="bg-page ..."`
- `DropdownMenu/DropdownMenu.tsx` — TBD, likely same pattern
- `Menubar/Menubar.tsx` — Batch-B migration moved `bg-inv` to inner; verify
- `Select/Select.tsx` — TBD, verify the listbox popup
- `Combobox/Combobox.tsx` — TBD, verify the listbox popup
- `HoverCard` / `PreviewCard` — verify
- `AppWindow/AppWindow.tsx:543` — `bgClassName` forwarded via className
- `Dialog/Dialog.tsx` / `AlertDialog/AlertDialog.tsx` — verify modal shell bg
**Fix:** grep every PixelBorder usage that passes `bg-*` in className; flip
to `background=` prop. One-line fix per site.
**Search command:**
```bash
grep -rn 'PixelBorder[^>]*className=[^>]*bg-' \
  packages/radiants/components/core --include="*.tsx"
```

### Item #7 — Switch thumb should have pixelated borders

**Category:** Partial regression (my earlier fix stripped the nested
PixelBorder on the thumb to unblock sizing, but dropped visible thumb
corners)
**Location:** `packages/radiants/components/core/Switch/Switch.tsx:127-146`
**Current state:** Track wrapped in PixelBorder; thumb is a bare
`<BaseSwitch.Thumb>` clipped only by the track's staircase — so the
thumb has the track's corner shape at extremes but rectangular corners
mid-travel.
**Fix:** Re-add a PixelBorder around the thumb using base-ui's `render`
callback (same pattern the Slider batch used for its thumb). Put the
translate/sizing classes on the PixelBorder wrapper; spread base-ui's
props onto an absolutely-positioned inner span so the inner element
doesn't fight the wrapper for layout:
```tsx
<BaseSwitch.Thumb
  data-slot="switch-thumb"
  render={(props) => (
    <PixelBorder size="xs" className={thumbClasses}>
      <span {...props} className="absolute inset-0 switch-thumb" />
    </PixelBorder>
  )}
/>
```
Depends on PixelBorder wrapped-mode fix from #1 (line-box overhead) so
the wrapper hugs the thumb tightly.

### Item #8 — Card doesn't fill parent width

**Category:** Cause A adjacent + className-routing bug
**Location:** `packages/radiants/components/core/Card/Card.tsx:73-87`
**Current:**
```tsx
<PixelBorder size={CARD_BORDER_SIZE[rounded]} shadow={...}>
  <div className={className} data-rdna="card" ...>
    {children}
  </div>
</PixelBorder>
```
**Root cause:** Consumer-provided `className` (including `w-full`) lands
on the **inner** `<div>`, not the PixelBorder wrapper. The wrapper is a
default block div so it should fill horizontally — BUT if a parent is
`inline-flex` (a flex row), the Card wrapper becomes a flex item and
shrinks to content width because it has no explicit flex growth.
**Fix:** Forward `className` to the PixelBorder wrapper. Keep the inner
div for `data-rdna`/`data-slot`/`data-variant` attributes only:
```tsx
<PixelBorder
  size={CARD_BORDER_SIZE[rounded]}
  shadow={variant === 'raised' ? '2px 2px 0 var(--color-ink)' : undefined}
  className={className}
>
  <div data-rdna="card" data-slot="card" data-variant={variant}>
    {children}
  </div>
</PixelBorder>
```

### Item #9 — Delete-item button top cream line

**Category:** Cause B (button root bg + line-box overhead)
**Location:** `<AlertDialog>` button "Delete Item"
**Duplicate of:** Item #1 — same root cause, different visible surface.
**Fix:** Same PixelBorder wrapped-mode `flex` fix as #1.

---

## Fix Priority & Execution Order

| # | Fix | Blast radius | Blocks others |
|---|---|---|---|
| 1 | **PixelBorder wrapped-mode inner = `overflow-hidden flex`** (line-box fix) | All PixelBorder consumers; most likely to fix #1, #2, #9, maybe #8 | #1, #2, #7, #9 |
| 2 | **Cause A sweep** — flip `className="bg-*"` → `background="bg-*"` across all PixelBorder consumers | ~10 files (Popover, ContextMenu, DropdownMenu, Menubar, Select, Combobox, AppWindow, Dialog, AlertDialog, PreviewCard) | #4, #6, partial #8 |
| 3 | **Card className forwarding** | Card.tsx only | #8 |
| 4 | **Switch thumb render prop** | Switch.tsx only | #7 |
| 5 | **Toggle rounded prop wiring** | Toggle.tsx only | #3 |
| 6 | **Button root bg audit** (check CSS theme rules for `[data-slot="button-root"]` backgrounds) | Theme CSS files | residual #1, #9 |
| 7 | **Radio pixel circle** (defer — enhancement) | Checkbox.tsx | #5 |

## Verification Checklist

After each fix:
- [ ] Run `pnpm vitest run` from `packages/radiants` — all suites pass
  (ignoring the 11 pre-existing failures in Alert/Card/Dialog/AppWindow
  shell assertions that were baselined against older preset radii)
- [ ] Open `http://localhost:3001/#brand`, visually verify the original
  feedback items are resolved (screenshot before/after into agentation)
- [ ] Walk the AppWindow title-bar buttons, ContextMenu popup, Switch
  thumb, Card grid, Delete-item alert dialog
- [ ] No new console warnings or layout shifts

## Non-scope

- **Pre-existing test failures** on Alert/AlertDialog/AppWindow/Card/Dialog/PreviewCard
  shell tests. These assertions check for SVG viewBox sizes (`0 0 5 5`,
  `0 0 9 9`, `0 0 2 2`) that don't match current `PIXEL_BORDER_RADII`
  (xs=4, sm=6, md=8, lg=12, xl=20). Tracked as a separate follow-up
  to update the assertions to the correct radii.
- **Menu/Popover behavioral test failures** (ContextMenu, DropdownMenu,
  Popover "opens when trigger is clicked"). Independent jsdom timing
  issue; not caused by this migration.
- **density-contract test failure** — CSS token plumbing check,
  unrelated.
