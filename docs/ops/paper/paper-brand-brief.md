# Radiants Brand Brief — Paper Agent Reference

> Extracted from the DNA codebase on 2026-03-23. Single source of truth for agents recreating brand assets in Paper.

---

## Color Palette

### Brand Primitives (Tier 1)

Raw color values. **Never use directly in component code** — these exist only to feed semantic tokens.

| Name | Hex | OKLCH | CSS Var | Tailwind | Role |
|------|-----|-------|---------|----------|------|
| Sun Yellow | `#FCE184` | `oklch(0.9126 0.1170 93.68)` | `--color-sun-yellow` | `sun-yellow` | Primary Accent — actions, highlights, focus states, energy. The signature color. |
| Cream | `#FEF8E2` | `oklch(0.9780 0.0295 94.34)` | `--color-cream` | `cream` | Canvas — surfaces, backgrounds, warm foundation of all layouts. |
| Ink | `#0F0E0C` | `oklch(0.1641 0.0044 84.59)` | `--color-ink` | `ink` | Anchor — typography, borders, depth. Grounds the visual hierarchy. |
| Pure Black | `#000000` | `oklch(0.0000 0.0000 0)` | `--color-pure-black` | `pure-black` | Absolute black (reserved) — deepest Moon Mode surfaces only. |
| Pure White | `#FFFCF3` | `oklch(0.9909 0.0123 91.51)` | `--color-pure-white` | `pure-white` | Warm white (reserved) — hard contrast points only. |

### Extended Palette

Accent colors for status, links, and editorial moments.

| Name | Hex | OKLCH | CSS Var | Tailwind | Role |
|------|-----|-------|---------|----------|------|
| Sky Blue | `#95BAD2` | `oklch(0.7701 0.0527 236.81)` | `--color-sky-blue` | `sky-blue` | Links & Info |
| Sunset Fuzz | `#FCC383` | `oklch(0.8546 0.1039 68.93)` | `--color-sunset-fuzz` | `sunset-fuzz` | Warm CTA |
| Sun Red | `#FF7F7F` | `oklch(0.7429 0.1568 21.43)` | `--color-sun-red` | `sun-red` | Error & Danger |
| Mint | `#CEF5CA` | `oklch(0.9312 0.0702 142.51)` | `--color-mint` | `mint` | Success |

### Semantic Tokens (Tier 2) — Light (Sun Mode) / Dark (Moon Mode)

All component code MUST use these — they flip automatically between modes.

#### Surface Tokens

| Token | CSS Var | Tailwind | Light Value | Dark Value | Usage |
|-------|---------|----------|-------------|------------|-------|
| page | `--color-page` | `bg-page` | Cream `#FEF8E2` | Ink `#0F0E0C` | Main page background |
| inv | `--color-inv` | `bg-inv` | Ink `#0F0E0C` | Ink `#0F0E0C` | Inverted sections (stays ink in dark) |
| tinted | `--color-tinted` | `bg-tinted` | Sunset Fuzz `#FCC383` | `oklch(0.3129 0.0389 73.57)` / `#3D2E1A` | Accent containers |
| card | `--color-card` | `bg-card` | Pure White `#FFFCF3` | Pure Black `#000000` | Cards, raised panels |
| depth | `--color-depth` | `bg-depth` | Cream `#FEF8E2` | `oklch(0.22 0.01 84.59)` | Subtle backgrounds, sidebar |
| hover | `--color-hover` | `bg-hover` | Sun Yellow | Sun Yellow at 8% | Hover overlay |
| active | `--color-active` | `bg-active` | Sun Yellow | Sun Yellow at 12% | Pressed overlay |

#### Content Tokens

| Token | CSS Var | Tailwind | Light Value | Dark Value | Usage |
|-------|---------|----------|-------------|------------|-------|
| main | `--color-main` | `text-main` | Ink `#0F0E0C` | Cream `#FEF8E2` | Body text |
| head | `--color-head` | `text-head` | Ink `#0F0E0C` | Pure White `#FFFCF3` | Headings |
| sub | `--color-sub` | `text-sub` | Ink at 85% | Cream at 85% | Supporting text |
| mute | `--color-mute` | `text-mute` | Ink at 60% | Cream at 60% | Captions, hints |
| flip | `--color-flip` | `text-flip` | Cream `#FEF8E2` | Cream `#FEF8E2` | Text on dark/inv bg (stays cream) |
| link | `--color-link` | `text-link` | Sky Blue `#95BAD2` | Sky Blue `#95BAD2` | Hyperlinks |

#### Edge Tokens (Borders)

| Token | CSS Var | Tailwind | Light Value | Dark Value | Usage |
|-------|---------|----------|-------------|------------|-------|
| line | `--color-line` | `border-line` | Ink `#0F0E0C` | Cream at 20% | Default borders |
| rule | `--color-rule` | `border-rule` | Ink at 20% | Cream at 12% | Subtle dividers |
| line-hover | `--color-line-hover` | `border-line-hover` | Ink at 30% | Cream at 35% | Hover state borders |
| focus | `--color-focus` | `border-focus` | Sun Yellow `#FCE184` | Sun Yellow `#FCE184` | Focus rings |

#### Action Tokens

| Token | CSS Var | Tailwind | Light Value | Dark Value | Usage |
|-------|---------|----------|-------------|------------|-------|
| accent | `--color-accent` | `bg-accent` | Sun Yellow `#FCE184` | Sun Yellow `#FCE184` | Primary buttons |
| accent-inv | `--color-accent-inv` | `bg-accent-inv` | Ink `#0F0E0C` | Cream `#FEF8E2` | Secondary buttons |
| danger | `--color-danger` | `bg-danger` | Sun Red `#FF7F7F` | Sun Red `#FF7F7F` | Delete, remove |
| accent-soft | `--color-accent-soft` | `bg-accent-soft` | Sunset Fuzz `#FCC383` | Sunset Fuzz `#FCC383` | Warm highlight CTA |

#### Status Tokens

| Token | CSS Var | Tailwind | Value | Usage |
|-------|---------|----------|-------|-------|
| success | `--color-success` | `bg-success` | Mint `#CEF5CA` | Success states |
| warning | `--color-warning` | `bg-warning` | Sun Yellow `#FCE184` | Warnings, caution |
| danger | `--color-danger` | `bg-danger` | Sun Red `#FF7F7F` | Errors, failures |
| link (info) | `--color-link` | `text-link` | Sky Blue `#95BAD2` | Informational |

#### Window Chrome Tokens

| Token | CSS Var | Light | Dark |
|-------|---------|-------|------|
| window-chrome-from | `--color-window-chrome-from` | Sun Yellow | Ink |
| window-chrome-to | `--color-window-chrome-to` | Cream | Ink |

---

## Typography

### Font Families

| Semantic Role | Font Family | CSS Var | Tailwind Class | Weights Available | Usage |
|---------------|-------------|---------|----------------|-------------------|-------|
| **Heading** (default body) | Joystix Monospace | `--font-heading` | `font-heading` / `font-joystix` | 400 (Regular) | Headings, buttons, labels, all UI chrome. This is the DEFAULT body font. |
| **Sans / Body** | Mondwest | `--font-sans` | `font-sans` / `font-mondwest` | 400 (Regular), 700 (Bold) | Paragraphs, descriptions, form inputs, long-form text. Applied explicitly. |
| **Mono / Code** | PixelCode | `--font-mono` | `font-mono` | 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold) — each with italic | Code blocks, monospace data |

> **Important:** The default body font is Joystix (the pixel/heading font), NOT Mondwest. The retro OS aesthetic means most UI text uses the pixel font. Mondwest is applied explicitly where readability of longer text matters.

### Font File Paths

All font files live in `packages/radiants/fonts/`:

| File | Family | Weight | Style |
|------|--------|--------|-------|
| `Mondwest.woff2` | Mondwest | 400 | Normal |
| `Mondwest-Bold.woff2` | Mondwest | 700 | Normal |
| `Joystix.woff2` | Joystix Monospace | 400 | Normal |
| `PixelCode.woff2` | PixelCode | 400 | Normal |
| `PixelCode-Italic.woff2` | PixelCode | 400 | Italic |
| `PixelCode-Bold.woff2` | PixelCode | 700 | Normal |
| `PixelCode-Bold-Italic.woff2` | PixelCode | 700 | Italic |
| `PixelCode-Light.woff2` | PixelCode | 300 | Normal |
| `PixelCode-Light-Italic.woff2` | PixelCode | 300 | Italic |
| `PixelCode-Medium.woff2` | PixelCode | 500 | Normal |
| `PixelCode-Medium-Italic.woff2` | PixelCode | 500 | Italic |

### Type Scale

rem-based on a uniform 0.25rem (4px) grid. Root font size: `clamp(14px, 1vw + 12px, 16px)`.

| Token | CSS Var | Value | At 16px root | Tailwind |
|-------|---------|-------|--------------|----------|
| xs | `--font-size-xs` | `0.625rem` | 10px | `text-xs` |
| sm | `--font-size-sm` | `0.75rem` | 12px | `text-sm` |
| base | `--font-size-base` | `1rem` | 16px | `text-base` |
| lg | `--font-size-lg` | `1.25rem` | 20px | `text-lg` |
| xl | `--font-size-xl` | `1.5rem` | 24px | `text-xl` |
| 2xl | `--font-size-2xl` | `1.75rem` | 28px | `text-2xl` |
| 3xl | `--font-size-3xl` | `2rem` | 32px | `text-3xl` |

### Heading Styles

| Element | Size | Font | Weight | Additional |
|---------|------|------|--------|------------|
| h1 | `text-4xl` | Joystix (`font-heading`) | Bold | `leading-none tracking-tight` |
| h2 | `text-3xl` | Joystix | Normal | `leading-none tracking-tight` |
| h3 | `text-2xl` | Joystix | Semibold | `leading-none tracking-tight` |
| h4 | `text-xl` | Joystix | Medium | `leading-none tracking-tight` |
| h5 | `text-lg` | Joystix | Medium | `leading-none tracking-tight` |
| h6 | `text-base` | Joystix | Medium | `leading-none tracking-tight` |
| p | `text-base` | Mondwest (`font-sans`) | Normal | `leading-snug tracking-tight` |

---

## Logos

### Variants

Three logo forms, each available in three color options:

| Variant | Description | Component |
|---------|-------------|-----------|
| **Wordmark** | Full "RADIANTS" text logotype | `<WordmarkLogo color={color} />` |
| **Mark** | "R" lettermark / icon | `<RadMarkIcon size={n} />` |
| **RadSun** | Sun-burst symbol (primary brand mark) | `<RadSunLogo color={color} />` |

### Color Options

| Color | On Background | Use Case |
|-------|---------------|----------|
| **Cream** (`#FEF8E2`) | Black/Ink | Primary dark-background usage |
| **Black/Ink** (`#0F0E0C`) | Cream | Primary light-background usage |
| **Yellow** (`#FCE184`) | Black/Ink | Accent / highlight usage |

### Logo Files (SVG)

All at `apps/rad-os/public/assets/logos/`:

| File | Variant | Color |
|------|---------|-------|
| `wordmark-cream.svg` | Wordmark | Cream |
| `wordmark-black.svg` | Wordmark | Black |
| `wordmark-yellow.svg` | Wordmark | Yellow |
| `rad-mark-cream.svg` | Mark | Cream |
| `rad-mark-black.svg` | Mark | Black |
| `rad-mark-yellow.svg` | Mark | Yellow |
| `radsun-cream.svg` | RadSun | Cream |
| `radsun-black.svg` | RadSun | Black |
| `radsun-yellow.svg` | RadSun | Yellow |

### Logo Grid (All 9 Combinations)

| | Cream on Black | Black on Cream | Yellow on Black |
|---|---|---|---|
| **RadSun** | `radsun-cream` | `radsun-black` | `radsun-yellow` |
| **Mark** | `rad-mark-cream` | `rad-mark-black` | `rad-mark-yellow` |
| **Wordmark** | `wordmark-cream` | `wordmark-black` | `wordmark-yellow` |

---

## Patterns (Pixel Dither Library)

48 bitmap patterns available via `<Pattern pat="name" />`. All are 8x8px base tiles, scalable to 2x/3x/4x. Used with any brand color as foreground and optional background.

### Pattern Names by Category

**Fills (solid/empty):**
`solid`, `empty`

**Checkerboard:**
`checkerboard`, `checkerboard-alt`

**Pinstripe:**
`pinstripe-v`, `pinstripe-v-wide`, `pinstripe-h`, `pinstripe-h-wide`

**Diagonal:**
`diagonal`, `diagonal-dots`, `diagonal-right`

**Structural:**
`grid`, `brick`, `shelf`, `columns`, `stagger`

**Geometric:**
`diamond`, `confetti`, `weave`, `brick-diagonal`, `brick-diagonal-alt`, `caret`, `trellis`, `arch`, `cross`, `sawtooth`, `chevron`, `basket`, `tweed`

**Noise / Scatter:**
`dust`, `mist`, `scatter`, `scatter-alt`, `scatter-pair`, `rain`, `rain-cluster`, `spray`, `spray-grid`, `spray-mixed`

**Density Fills (75-97%):**
`fill-75`, `fill-75-rows`, `fill-75-sweep`, `fill-75-offset`, `fill-75-inv`, `fill-75-bars`, `fill-81`, `fill-88`, `fill-88-alt`, `fill-94`, `fill-94-alt`, `fill-97`

### Scale Options

| Scale | Tile Size | CSS Class |
|-------|-----------|-----------|
| 1x (default) | 8x8px | — |
| 2x | 16x16px | `rdna-pat--2x` |
| 3x | 24x24px | `rdna-pat--3x` |
| 4x | 32x32px | `rdna-pat--4x` |

### Available Pattern Colors

Any CSS color works, but the brand-sanctioned options are:
- Ink (`var(--color-ink)`)
- Pure White (`var(--color-pure-white)`)
- Cream (`var(--color-cream)`)
- Sun Yellow (`var(--color-sun-yellow)`)
- Sunset Fuzz (`var(--color-sunset-fuzz)`)
- Sun Red (`var(--color-sun-red)`)
- Sky Blue (`var(--color-sky-blue)`)
- Mint (`var(--color-mint)`)

---

## Icons

152 custom pixel-art SVG icons at `packages/radiants/assets/icons/`. 24x24 grid, 2px stroke (Lucide-based).

<details>
<summary>Full icon inventory (152 icons)</summary>

broadcast-dish, broken-battery, calendar, calendar2, camera, cd, cd-horizontal, cell-bars, checkmark, chevron-down, chevron-left, chevron-right, clock, close, close-filled, code-file, code-folder, code-window, code-window-filled, coins, comments-blank, comments-typing, computer, copied-to-clipboard, copy, copy-to-clipboard, crosshair-3, crosshair1, crosshair2, crosshair2-retro, crosshair4, cursor-text, cursor2, cursors1, cut, discord, document, document-image, document2, download, eject, electric, envelope-closed, envelope-open, equalizer, eye, eye-hidden, fill-bucket, film-camera, film-strip, film-strip-outline, fire, folder-closed, folder-open, full-screen, game-controller, globe, go-forward, grid-3x3, grip-horizontal, grip-vertical, hamburger, hand-point, hard-drive, headphones, heart, home, home2, hourglass, info, info-filled, joystick, lightbulb, lightbulb2, line-chart, list, lock-closed, lock-open, microphone, microphone-mute, minus, money, moon, more-horizontal, more-vertical, multiple-images, music-8th-notes, outline-box, paper-plane, pause, pencil, picture-in-picture, pie-chart, play, plug, plus, power1, power2, print, question, question-filled, queue, rad-mark, radiants-logo, record-playback, record-player, refresh-filled, refresh1, reload, resize-corner, save, save-2, search, seek-back, seek-forward, settings-cog, share, skip-back, skip-forward, skull-and-crossbones, sort-descending, sort-filter-empty, sort-filter-filled, sparkles, stop-playback, swap, tape, telephone, trash, trash-full, trash-open, trophy, trophy2, tv, twitter, underline, upload, usb, usb-icon, USDC, usericon, volume-faders, volume-high, volume-mute, warning-filled, warning-filled-outline, warning-hollow, wifi, window-error, windows, wrench, zip-file, zip-file2

</details>

---

## Shadow & Elevation

### Sun Mode (Light) — Sharp Pixel-Art Offsets

| Level | Token | Value | Used By |
|-------|-------|-------|---------|
| Inset | `shadow-inset` | `inset 0 0 0 1px ink` | Slider tracks, recessed containers |
| Surface | `shadow-surface` | `0 1px 0 0 ink` | Nested containers |
| Resting | `shadow-resting` | `0 2px 0 0 ink` | Buttons at rest, badges, inputs |
| Lifted | `shadow-lifted` | `0 4px 0 0 ink` | Interactive hover (vertical only) |
| Raised | `shadow-raised` | `2px 2px 0 0 ink` | Cards, panels, popovers (diagonal) |
| Floating | `shadow-floating` | `4px 4px 0 0 ink` | Windows, dialogs, sheets (diagonal) |
| Focused | `shadow-focused` | Sun-yellow glow ring | Active/focused window |

### Moon Mode (Dark) — Soft Ambient Glows

Same token names, but values switch to ambient sun-yellow glow halos. Example:
- `shadow-raised`: `0 0 0 1px line, 0 0 8px glow-sun-yellow, 0 0 20px glow-sun-yellow-subtle`
- `shadow-floating`: `0 0 0 1px line, 0 0 10px glow-sun-yellow, 0 0 24px glow-sun-yellow-subtle`

### Glow Tokens (Moon Mode only)

| Token | OKLCH / Alpha |
|-------|---------------|
| `--glow-sun-yellow` | `oklch(0.9126 0.1170 93.68 / 0.6)` |
| `--glow-sun-yellow-subtle` | `oklch(0.9126 0.1170 93.68 / 0.3)` |
| `--glow-sun-red` | `oklch(0.7429 0.1568 21.43 / 0.5)` |
| `--glow-mint` | `oklch(0.9312 0.0702 142.51 / 0.5)` |
| `--glow-sky-blue` | `oklch(0.7701 0.0527 236.81 / 0.5)` |

### Moon Mode Text Glow

All text in dark mode gets a subtle phosphor halo:
```css
text-shadow: 0 0 10px glow-sun-yellow-subtle, 0 0 40px oklch(0.9126 0.1170 93.68 / 0.08);
```

---

## Border Radius

RDNA uses **pixel-staircase corners** (clip-path polygons) instead of smooth CSS border-radius.

| Token | Pixel Radius | Utility Class | Use |
|-------|-------------|---------------|-----|
| xs | 2px staircase | `pixel-rounded-xs` | Buttons, inputs, badges |
| sm | 4px staircase | `pixel-rounded-sm` | Tabs, toasts |
| md | 8px staircase | `pixel-rounded-md` | Cards, windows, dialogs |
| lg | 16px staircase | `pixel-rounded-lg` | Large panels |
| full | Smooth CSS radius | `rounded-full` | Switch tracks, radio buttons (no pixel corners) |

---

## Motion

### Duration Scale

| Token | Value | Use |
|-------|-------|-----|
| `--duration-instant` | `0ms` | Reduced motion fallback |
| `--duration-fast` | `100ms` | Hover states, focus rings |
| `--duration-base` | `150ms` | Standard transitions |
| `--duration-moderate` | `200ms` | Accordion expand, tab switch |
| `--duration-slow` | `300ms` | Dialog open, sheet slide, toast enter |

**Hard ceiling: 300ms maximum.** No animation may exceed this.

### Easing

| Token | Value | Use |
|-------|-------|-----|
| `--easing-default` | `cubic-bezier(0, 0, 0.2, 1)` | All standard transitions |
| `--easing-out` | `cubic-bezier(0, 0, 0.2, 1)` | Entering elements |
| `--easing-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exiting elements |
| `--easing-spring` | `cubic-bezier(0.22, 1, 0.36, 1)` | Popup/badge overshoot |

**Rule:** Ease-out only for most transitions. No ease-in-out, no linear (except progress bars).

### Sun Mode Motion Character

- Cursor response (hover, press, focus): **Instant snap** — no transition
- State transitions (toggle, slide, open/close): **Eased** with `duration-base`

### Moon Mode Motion Character

- Everything eases. Glow effects need smooth transitions to feel ambient.

---

## Interactive Element Sizes

8px grid height scale:

| Size | Height | Use |
|------|--------|-----|
| `sm` | 24px (`h-6`) | Compact UI: title bar buttons, inline actions |
| `md` | 32px (`h-8`) | Standard: most buttons, inputs, selects |
| `lg` | 40px (`h-10`) | Hero CTAs, primary form inputs |

---

## Design Rules

### DO

- Use semantic tokens for all colors: `bg-page`, `text-main`, `border-line`
- Use the type scale tokens: `text-xs` through `text-3xl`
- Use elevation tokens: `shadow-raised`, `pixel-shadow-floating`
- Use `pixel-shadow-*` on pixel-cornered elements (not `shadow-*`)
- Keep all animations under 300ms
- Use ease-out only
- Use 1px borders everywhere — no `border-2`
- Use Joystix for UI chrome, Mondwest for long-form text

### DO NOT

- Hardcode hex colors (`bg-[#FEF8E2]`)
- Use brand tokens directly in components (`bg-cream`, `text-ink`)
- Use px-based font sizes (`text-[14px]`)
- Use arbitrary spacing (`p-[13px]`)
- Exceed 300ms on any animation
- Use ease-in-out or linear easing
- Set `border-color` on pixel-cornered elements
- Use `box-shadow` on pixel-cornered elements (use `filter: drop-shadow`)
- Use `overflow-hidden` on pixel-cornered elements
- Use T-shirt `max-w-*` classes in Tailwind v4 (use explicit rem: `max-w-[28rem]`)

---

## AI Toolkit (Midjourney SREFs)

Style reference codes for generating on-brand imagery:

| Code | Notes |
|------|-------|
| `--sref 2686106303 1335137003 --p 28kclbj` | Primary style — cowboy/portrait aesthetic |
| `--sref 1335137003 --p 28kclbj` | Secondary style — bandana/product detail aesthetic |

---

## Quick Reference: The Three Core Colors

For any brand asset, the palette reduces to three anchors:

```
Sun Yellow  #FCE184  oklch(0.9126 0.1170 93.68)   — Energy, action, warmth
Cream       #FEF8E2  oklch(0.9780 0.0295 94.34)   — Canvas, foundation, calm
Ink         #0F0E0C  oklch(0.1641 0.0044 84.59)   — Weight, contrast, ground
```

Everything else (sky blue, sunset fuzz, sun red, mint) is supporting cast for specific semantic roles.
