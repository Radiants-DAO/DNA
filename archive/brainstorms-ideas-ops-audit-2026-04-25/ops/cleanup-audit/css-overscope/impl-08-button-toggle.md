# impl-08 — Button + Toggle node collapse (F1, F10)

## LOC delta

| File | Before | After | Δ |
|---|---|---|---|
| `packages/radiants/components/core/Button/Button.tsx` | 330 | 313 | −17 |
| `packages/radiants/components/core/Toggle/Toggle.tsx` | 167 | 160 | −7 |

## DOM nodes saved

**1 node per Button render, 1 per Toggle render.** Both components previously
rendered `outer <BaseButton|button>` + inner `<span data-slot="*-face">`.
Both now render a single element carrying every data-attribute and every
visual class. For a RadOS frame with ~40 buttons + toggles visible, that's
~40 fewer DOM nodes.

## Consumer-audit findings

### `[data-slot="button-face"]` / `[data-slot="toggle-face"]` — kept

CSS targeting `[data-slot="button-face"]` (base.css ≈60 rules, dark.css ≈25
rules) still applies — the collapsed element still carries `data-slot="button-face"`.
`[data-slot="toggle-face"]` (~8 rules in base.css) same story.

No changes needed for:
- `packages/radiants/base.css` — `[data-slot="button-face"]` rules (color tokens,
  mode styling, flush/quiet, forced-state previews)
- `packages/radiants/dark.css` — `[data-slot="button-face"]` rules (tone overrides,
  quiet/flat/pattern/text, forced-state force-hover/force-pressed)
- `packages/radiants/components/core/Toolbar/Toolbar.tsx` — `data-slot="button-face"`
  on the ghost control borrows the face surface; unchanged
- `packages/radiants/components/core/NavigationMenu/NavigationMenu.tsx` — same
- `packages/radiants/components/core/Collapsible/Collapsible.tsx` — same
- `apps/rad-os/test/dark-text-glow.test.ts` — asserts glow selector still
  lists `[data-slot="button-face"]`; still true

### `[data-slot="button-root"]` — renamed to `[data-rdna="button"]`

With a single node, we can't carry two `data-slot` values. Rather than force
one of the pair to lose CSS, I rescoped root-specific rules to `data-rdna="button"`
(already emitted by the component, already unique to the actual Button —
Toolbar/NavMenu/Collapsible do NOT set it). This keeps the lift/press transforms
and disabled cursor isolated to the Button component and does not leak to
face-borrowing consumers.

Files reworked:
- `packages/radiants/base.css` — 7 rule-groups: disabled cursor, hover lift,
  press drop, disabled-no-transform, selected-no-transform, flat-no-transform,
  forced-state hover/pressed/focus. Descendant combinator
  `[data-slot="button-root"][x] [data-slot="button-face"]` was collapsed to a
  single compound `[data-rdna="button"][data-slot="button-face"][x]` (one element now).
- `packages/radiants/dark.css` — 28 occurrences inside the `.dark { … }`
  block, `[data-slot="button-root"]` → `[data-rdna="button"]` (replace_all).
- `packages/radiants/registry/__tests__/forced-state-source.test.ts` — 2
  assertions updated from `button-root` to `data-rdna="button"`.

### `[data-slot="toggle-root"]` — removed

Not referenced in any CSS, tests, or querySelectors (only in Toggle.tsx itself).
Dropped cleanly.

## CVA merge approach

**Manual dedupe, not twMerge.** The old `buttonRootVariants` (focus/cursor/layout)
and `buttonFaceVariants` (visual treatment) had only one overlapping key:
`fullWidth` (both emitted `w-full`). Merged into a single `buttonVariants` CVA
with the union of variant axes — `mode`, `rounded`, `size`, `iconOnly`, `compact`,
`textOnly`, `fullWidth`, `disabled`. Compound variants (padding per size / icon-only
width) unchanged. Justify/pixel-rounded classes are appended via `className` at
call site (same as before, just onto the single node). `text` mode keeps its
`!h-auto !p-0` overrides so it still collapses sizing correctly.

Toggle: old `toggleFaceVariants` + the inline outer `<button>` classes merged
into `toggleVariants`. Cursor/outline/focus-visible/disabled now live on the
same node as the face visuals. `data-[state=selected]:bg-[var(--btn-fill)]`
still paints correctly (the attribute is on the same node the selector targets).

Exports renamed: `buttonRootVariants` + `buttonFaceVariants` → `buttonVariants`;
`toggleFaceVariants` → `toggleVariants`. Updated `components/core/index.ts`.
Neither old name was imported outside the package (verified via grep); the
`NON_COMPONENT_EXPORTS` set in `registry/runtime-attachments.tsx` still lists
both legacy names plus `buttonVariants` so auto-component detection stays correct.

## Test result

- `pnpm --filter @rdna/radiants test -- --run Button Toggle`: Button = 9/9 pass,
  Toggle = 8/8 pass. No test assertions needed updating — tests use
  `.closest('[data-slot="button-face"]')` / `container.querySelector('[data-slot="toggle-face"]')`
  which both return the single collapsed element (it carries that `data-slot`).
- 2 unrelated pre-existing failures (`Dialog closes on backdrop click`,
  `Sheet closes on backdrop click`) were confirmed failing on `HEAD~` with
  `git stash` — unrelated to this change.
- `npx tsc --noEmit -p packages/radiants`: clean.

## Deferred / follow-ups

- `archive/plans/*` and `docs/plans/*` reference `[data-slot="button-root"]`
  and `[data-slot="button-face"]` in design doc prose — left untouched (docs,
  not shipped CSS).
- `packages/radiants/DESIGN.md` — still documents `button-root` / `button-face`
  as the two-node authoring model. Needs a prose update to reflect the collapse,
  but that's docs work, not a shipping blocker.
- F2 (leader-line `<span>` in Button) intentionally left alone — separate finding.
