# Lane 5: Hard-Won Implementation Rules Audit

> Source agent ran read-only and reported findings inline; transcribed verbatim here.

## Summary
- 1 high, 3 medium, 2 low
- Z-index scale leaks (real code uses arbitrary `z-[9999]` etc.); status tokens silently mode-invariant in dark.css; isolated `text-[12px]` violation.

## §15 Z-Index Scale (lines 1216-1256)

### High-severity drift

Arbitrary z-index values outside the documented scale:
- `z-[9999]` — `apps/rad-os/components/Rad_os/ZoomRects.tsx`
- `z-[1000]` — `packages/radiants/components/core/Tooltip/Tooltip.tsx`, `packages/radiants/components/core/ContextMenu/ContextMenu.tsx`
- `z-[950]` — `apps/rad-os/components/Rad_os/Desktop.tsx`
- `z-[80]` — `apps/rad-os/components/apps/radio/RadioWidget.tsx`
- `z-[5]` — `apps/rad-os/components/apps/brand-assets/colors-tab/FibonacciMosaic.tsx`

DESIGN.md scale (`tokens.css:237-244`): bands `0, 10, 100, 200, 300, 400, 500, 900`. Real code violates this repeatedly.

### In-app stacking contexts ✓
- `AppWindow.tsx` z-20 (pattern overlay), `Input.tsx` z-10 (icon overlay), `Slider.tsx` z-[0] (range fill) — internal contexts, doc explicitly allows this. No violation.

## §16 Pointer-Events on Overlay Layers (lines 1257-1285)

### Verified ✓
Pattern matches doc throughout: full-viewport containers `pointer-events-none`, interactive children `pointer-events-auto`. Confirmed in Desktop.tsx, InvertOverlay.tsx, ZoomRects.tsx, Toast.tsx, RadioWidget.tsx, AppWindow.tsx, Slider.tsx. No violations.

## §17 Icon Source — No Emojis, Ever (lines 1286-1322)

### Verified ✓
- `packages/radiants/assets/icons/` exists with 16px and 24px subdirectories.
- Zero emoji usage in `.tsx` across `apps/` and `packages/radiants/`.
- ESLint rule `no-arbitrary-icon-size.mjs:50-53` enforces 16/24-only sizes and bans removed `iconSet` prop.
- Icon imports follow `@rdna/radiants/icons` pattern. No violations.

## §18 CSS Unit Rules (lines 1323-1356)

### Medium-severity drift

**Hardcoded px font-size in component code:**
- `packages/radiants/components/core/NumberField/NumberField.tsx` uses `text-[12px] leading-none`. Should be `text-sm` (`0.75rem` per `generated/typography-tokens.css:19`).

DESIGN.md §18 rule: "Font sizes MUST use rem via Tailwind tokens, never hardcoded px."

Confirmed `text-xs` = 0.625rem (10px) per `generated/typography-tokens.css:18` — DESIGN.md's claim is accurate.

## §19 Dark Mode Completeness (lines 1357-1403)

### Medium-severity drift / contradiction

`tokens.css:106-109` defines status tokens:
```css
--color-status-success: var(--color-mint);
--color-status-warning: var(--color-sun-yellow);
--color-status-error: var(--color-sun-red);
--color-status-info: var(--color-sky-blue);
```

**No dark.css overrides exist** for any `--color-status-*` (grep returns 0 matches).

DESIGN.md §19:
- Line 1361: "Every semantic token … that changes between modes MUST have a corresponding override in dark.css. There are no exceptions."
- Line 1373-1377: Lists `--color-status-*` tokens as intentionally mode-invariant.
- Line 1379: Mode-invariant tokens "should get comments documenting the decision."

**Contradiction:** Doc says status tokens are intentionally invariant, but `dark.css` is silent — no comment, no documentation in code. Either the override should exist or the intentional invariance should be commented per the doc's own rule.

## §20 Font Source (lines 1404-1441)

### Verified ✓
`fonts.css:18-36` @theme block:
- `--font-sans: 'Mondwest'`
- `--font-heading: 'Joystix Monospace'`
- `--font-mono: 'PixelCode'`
- Editorial: Waves Blackletter, Pixeloid Sans, Waves Tiny

`@font-face` files all present in `packages/radiants/fonts/`:
- Mondwest, Mondwest-Bold (`fonts-core.css:12, 20`)
- Joystix (`fonts-core.css:31`)
- PixelCode + variants (`fonts-core.css:42`)
- Editorial fonts (`fonts-editorial.css:9-61`)

### Low-severity note (memory drift, not doc/code drift)

User memory says "H1 should use Mondwest, not Joystix" but `typography.css:5` ships h1 with `font-heading` (Joystix). DESIGN.md §20 doesn't specify which font h1 uses — so this is memory-vs-code drift, not DESIGN.md drift. Worth flagging during the doc rewrite.

## Rules / fonts / icons missing from DESIGN.md

None detected for §15-20. All documented rules are at least attempted in code; no undocumented hard-won rules surfaced in this lane.
