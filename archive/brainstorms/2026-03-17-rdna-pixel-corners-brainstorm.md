# RDNA Pixel Corners + Retro UI Refactor

**Date:** 2026-03-17
**Status:** Decided

## What We're Building

Moving pixel corners (clip-path polygon technique) from rad-os `globals.css` into the `@rdna/radiants` package as a permanent rendering feature. All `rounded-xs`, `rounded-sm`, `rounded-md`, `rounded-lg` classes get pixelated staircase corners via clip-path. Every RDNA component needs to work correctly within clip-path constraints: no clipped shadows, no double borders, retro-OS bevel styling for interactive controls.

## Why This Approach

Clip-path polygon gives pixel-perfect staircase corners with zero JS, and the `::after` pseudo-element border ring technique provides crisp 1px pixel borders. The technique is proven — AppWindow and Button primary already ship with it. The trade-off (clip-path clips box-shadow) is manageable: external shadows use `filter: drop-shadow()`, internal depth uses `inset box-shadow`.

## Key Decisions

- **CSS location**: New `packages/radiants/pixel-corners.css`, imported by `index.css`
- **Technique**: `clip-path: polygon()` with `::after` border ring (current approach, permanent)
- **Tailwind override**: `rounded-xs/sm/md/lg` → pixel corners globally; `rounded-full` untouched (circles/pills)
- **Border strategy**: Components remove their own CSS `border`; `::after` is the single source of visible borders on pixel-cornered elements
- **Shadow strategy (Sun Mode)**: External shadows → `filter: drop-shadow()`. Interactive controls get retro-OS inset bevel (`inset box-shadow` light TL / dark BR, swap on `:active`)
- **Shadow strategy (Moon Mode)**: Retro-OS inset bevel (same as Sun, with mode-appropriate colors) PLUS glow halos via `filter: drop-shadow()` (preserves atmospheric moon personality)
- **Circles**: `rounded-full` stays as regular `border-radius`. Radio buttons (when built) use `rounded-full`
- **Global shadow tokens**: `shadow-resting`, `shadow-lifted` etc. may need revision — they use `box-shadow` which gets clipped. Evaluate whether to convert to `filter` equivalents or deprecate lift-shadow pattern in favor of retro bevel

## Component Fix Categories

### Category A: Double borders (remove component's own border)
- Button (all variants) — primary done, others need same treatment
- ToggleGroup
- NavigationMenu dropdown
- Combobox

### Category B: Clipped/missing borders (::after needs to render)
- Card
- ScrollArea
- Meter
- Form fields (Input, Select, Combobox input)
- NumberField

### Category C: Unwanted borders (::after firing where it shouldn't)
- Breadcrumb links
- Ghost/text button variants (border should be transparent/invisible)

### Category D: Retro-OS refactors (new bevel/behavior pattern)
- Button — all variants (primary done as reference)
- Switch — retro toggle lever, remove hover lift
- Slider — retro track + thumb, remove hover lift, fix double border
- Tabs — consume button-like styles, skeuomorphic tab look

### Category E: Circles / pills
- Radio button (doesn't exist yet — build with `rounded-full`)
- Switch thumb (currently `rounded-xs` — keep pixelated or go `rounded-full`?)
- Meter/progress bar fill (pill shape — `rounded-full` or sharp?)

## Open Questions

- **Switch thumb shape**: Pixelated square thumb (retro) or round thumb (modern toggle)?
- **Progress/Meter fill**: Sharp-edged fill bar or pill-shaped? Sharp feels more retro-OS
- **Shadow token overhaul**: Do we convert all shadow tokens from `box-shadow` to `filter: drop-shadow()` format, or keep them as-is and let components choose? Tokens are consumed by many components — changing the format is breaking
- **Focus rings**: `focus-visible:ring-2` uses `box-shadow` internally in Tailwind — does clip-path clip it? If so, need `outline` instead
- **Transition from rad-os**: Delete pixel corners from `globals.css` after radiants ships them, or keep both during migration?

## Worktree Context

- Path: `/private/tmp/claude/rdna-pixel-corners`
- Branch: `feat/rdna-pixel-corners`

## Research Notes

- **Sun/Moon philosophy** (DESIGN.md): Sun = harsh pixel-art directional, Moon = soft ambient glow. Same utility class auto-switches via token overrides in dark.css
- **Shadow tokens** (tokens.css): 7-level elevation scale, all `box-shadow` format. Sun mode uses hard pixel offsets (`0 4px 0 0 ink`), moon mode overrides to ambient glows
- **Dark mode buttons** (dark.css): Flat ink bg, yellow text, glow halos on hover/active via `box-shadow: 0 0 Npx`. No spread — directly convertible to `filter: drop-shadow()`
- **Component radius usage**: `rounded-xs` (~20 components), `rounded-sm` (~10 components). Pattern: inline controls = xs, overlay panels = sm
- **No Radio component** exists yet in RDNA
- **Pixel corners technique**: https://lukeb.co.uk/blog/2022/01/17/pixelated-rounded-corners-with-css-clip-path/
- **Checkpoint**: `pixel-corners-experiment` stash exists for rollback
- **Mask-image future**: dithered-corner approach explored in a separate brainstorm (2026-03-16). Could replace clip-path later for shadow-friendly rendering
