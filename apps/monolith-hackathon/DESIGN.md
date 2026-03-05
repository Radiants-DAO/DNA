# MONOLITH Design System

> Canonical design reference for the MONOLITH hackathon site. When code and this document conflict, this document wins.

---

## Part 1: Design System

### Section 1: Design Philosophy

CRT-space-punk aesthetic — dark immersive surfaces, beveled chrome, pixel fonts, and subtle CRT effects. The visual language channels a retro terminal operating system floating in deep space, where every surface feels like it was rendered on a phosphor display. Two accent contexts coexist: **orbital** (amber/magma gradient) for global hero elements and CTAs, and **panel** (lavender `#b494f7`) for window chrome, headers, and UI borders.

Key adjectives: **immersive, beveled, phosphorescent, retro-futuristic, dark.**

### Section 2: Color System

#### Tier 1: Brand Palette (NEVER use directly in code)

| Name | Token | Hex | Role |
|------|-------|-----|------|
| Black | `--color-black` | `#010101` | Base dark |
| White | `--color-white` | `#f6f6f5` | Primary text |
| Green | `--color-green` | `#14f1b2` | CRT cyan-green accent |
| Ultraviolet | `--color-ultraviolet` | `#6939ca` | Deep purple accent |
| Magma | `--color-magma` | `#ef5c6f` | Bright pink-red accent |
| Amber | `--color-amber` | `#fd8f3a` | Warm orange accent |
| Ocean | `--color-ocean` | `#10282c` | Dark neutral blue-black |
| Slate | `--color-slate` | `#0e151a` | Darker neutral slate |

**Transparent variants:**

| Token | Value |
|-------|-------|
| `--color-black-50` | `rgba(1, 1, 1, 0.5)` |
| `--color-black-40` | `rgba(1, 1, 1, 0.4)` |
| `--color-green-40` | `rgba(20, 241, 178, 0.4)` |
| `--color-green-20` | `rgba(20, 241, 178, 0.2)` |
| `--color-green-hover` | `#12d9a0` |
| `--color-green-active` | `#10c794` |

**CRT effect colors:**

| Token | Value |
|-------|-------|
| `--color-crt-red` | `var(--color-magma)` / `#ef5c6f` |
| `--color-crt-green` | `var(--color-green)` / `#14f1b2` |
| `--color-crt-blue` | `var(--color-ultraviolet)` / `#6939ca` |

**Glow/Glass colors:**

| Token | Value |
|-------|-------|
| `--color-glow-cyan` | `#8dfff0` |
| `--color-glow-cyan-70` | `rgba(141, 255, 240, 0.7)` |
| `--color-glow-cyan-50` | `rgba(141, 255, 240, 0.5)` |
| `--color-teal-glow` | `#00b49f` |
| `--color-selection` | `#FCE184` |

**Bevel colors:**

| Token | Value |
|-------|-------|
| `--color-bevel-hi` | `rgba(167, 145, 216, 0.45)` |
| `--color-bevel-lo` | `#553691` |

**Gradient colors:**

| Token | Value |
|-------|-------|
| `--color-gradient-start` | `#fc8e43` |
| `--color-gradient-mid` | `#ef5c6f` |
| `--color-gradient-end` | `#6939c9` |

**Category colors (calendar/badges):**

| Token | Value | Category |
|-------|-------|----------|
| `--color-category-launch` | `#14f1b2` | Launch events |
| `--color-category-vibecoding` | `#fd8f3a` | Vibecoding sessions |
| `--color-category-devshop` | `#6939ca` | Dev shop events |
| `--color-category-deadline` | `#ef5c6f` | Deadlines |
| `--color-category-milestone` | `#b494f7` | Milestones |
| `--color-category-mtndao` | `#8dfff0` | mtnDAO events |

#### Tier 2: Semantic Tokens (ALWAYS use in code)

**Surface** (background colors for containers):

| Token | Maps To | Resolved |
|-------|---------|----------|
| `--color-surface-primary` | `--color-black` | `#010101` |
| `--color-surface-secondary` | `--color-ultraviolet` | `#6939ca` |
| `--color-surface-tertiary` | `--color-magma` | `#ef5c6f` |
| `--color-surface-elevated` | `--color-ocean` | `#10282c` |
| `--color-surface-muted` | `--color-slate` | `#0e151a` |
| `--color-surface-body` | (direct) | `#060b0a` |
| `--color-surface-alternate` | `--color-amber` | `#fd8f3a` |

**Content** (text and foreground):

| Token | Maps To | Resolved |
|-------|---------|----------|
| `--color-content-primary` | `--color-white` | `#f6f6f5` |
| `--color-content-secondary` | `--color-green` | `#14f1b2` |
| `--color-content-inverted` | `--color-black` | `#010101` |
| `--color-content-muted` | | `rgba(246, 246, 245, 0.6)` |
| `--color-content-tertiary` | | `rgba(246, 246, 245, 0.4)` |
| `--color-content-link` | `--color-green` | `#14f1b2` |
| `--color-content-alternate` | `--color-ultraviolet` | `#6939ca` |

**Edge** (borders, outlines, focus indicators):

| Token | Maps To | Resolved |
|-------|---------|----------|
| `--color-edge-primary` | `--color-black` | `#010101` |
| `--color-edge-secondary` | `--color-black-40` | `rgba(1, 1, 1, 0.4)` |
| `--color-edge-muted` | | `rgba(1, 1, 1, 0.2)` |
| `--color-edge-focus` | `--color-green` | `#14f1b2` |
| `--color-edge-alternate` | `--color-amber` | `#fd8f3a` |
| `--color-edge-subtle` | | `rgba(246, 246, 245, 0.2)` |
| `--color-edge-glow` | `--color-magma` | `#ef5c6f` |

**Action** (interactive elements):

| Token | Maps To | Resolved |
|-------|---------|----------|
| `--color-action-primary` | `--color-magma` | `#ef5c6f` |
| `--color-action-secondary` | `--color-ultraviolet` | `#6939ca` |
| `--color-action-success` | `--color-green` | `#14f1b2` |
| `--color-action-accent` | `--color-amber` | `#fd8f3a` |
| `--color-action-destructive` | `--color-magma` | `#ef5c6f` |

**Status** (feedback indicators):

| Token | Maps To | Resolved |
|-------|---------|----------|
| `--color-status-success` | `--color-green` | `#14f1b2` |
| `--color-status-warning` | `--color-amber` | `#fd8f3a` |
| `--color-status-error` | `--color-magma` | `#ef5c6f` |
| `--color-status-info` | `--color-ultraviolet` | `#6939ca` |

**Bevel** (3D beveled border effects):

| Token | Maps To | Resolved |
|-------|---------|----------|
| `--color-bevel-highlight` | `--color-bevel-hi` | `rgba(167, 145, 216, 0.45)` |
| `--color-bevel-shadow` | `--color-bevel-lo` | `#553691` |

**Gradients:**

| Token | Value |
|-------|-------|
| `--gradient-action-primary` | `linear-gradient(76deg, var(--color-gradient-start), var(--color-gradient-mid) 46%, var(--color-gradient-end))` |
| `--gradient-action-hover` | `linear-gradient(76deg, #fd8f3a, #ff6b7f 46%, #8b5cf6)` |
| `--gradient-action-active` | `linear-gradient(76deg, #d9743a, #c94d5e 46%, #5530a3)` |
| `--gradient-glass` | `linear-gradient(225deg, rgba(141, 255, 240, 0.7), rgba(20, 241, 178, 0.5))` |

**Panel Accent Scale** (scoped to `.app-window`):

| Token | Value |
|-------|-------|
| `--panel-accent` | `#b494f7` |
| `--panel-accent-65` | `rgba(180, 148, 247, 0.65)` |
| `--panel-accent-50` | `rgba(180, 148, 247, 0.5)` |
| `--panel-accent-40` | `rgba(180, 148, 247, 0.4)` |
| `--panel-accent-30` | `rgba(180, 148, 247, 0.3)` |
| `--panel-accent-20` | `rgba(180, 148, 247, 0.2)` |
| `--panel-accent-15` | `rgba(180, 148, 247, 0.15)` |
| `--panel-accent-08` | `rgba(180, 148, 247, 0.08)` |

### Section 3: Typography

#### Font Families

| Role | Family | Fallbacks | Usage |
|------|--------|-----------|-------|
| Display/Heading | Mondwest | Times New Roman, sans-serif | Hero titles, display stats, large headings |
| UI | Pixeloid Sans | Trebuchet MS, sans-serif | Buttons, labels, section headings, subsection heads |
| Chrome/Technical | Pixeloid Mono | ui-monospace, monospace | Taskbar text, timestamps, code, section headings |
| Body | Geist Pixel | Georgia, sans-serif | Readable paragraphs, descriptions, body text |

CSS variable mappings:
- `--font-heading`: `'Mondwest', 'Times New Roman', sans-serif`
- `--font-ui`: `'Pixeloid Sans', 'Trebuchet MS', sans-serif`
- `--font-mono`: `'Pixeloid Mono', ui-monospace, monospace`
- `--font-body` / `--font-sans`: `'Geist Pixel', Georgia, sans-serif`

#### Type Scale

| Token | Em | Px (at 16px base) | Usage |
|-------|----|--------------------|-------|
| `--font-size-5xl` | 8em | 128px | Hero "MONOLITH" title |
| `--font-size-4xl` | 5em | 80px | Display |
| `--font-size-3xl` | 4em | 64px | H1, H2 |
| `--font-size-2xl` | 2em | 32px | Large headings |
| `--font-size-xl` | 1.5em | 24px | H3 |
| `--font-size-lg` | 1.25em | 20px | H5 |
| `--font-size-md` | 1.125em | 18px | Medium |
| `--font-size-base` / `--font-size-sm` | 1em | 16px | Body base |
| `--font-size-xs` | 0.875em | 14px | Small UI, buttons |
| `--font-size-2xs` | 0.75em | 12px | Tiny labels, captions |

#### Panel Typography Hierarchy

| Level | Font | Size | Weight | Color | Transform |
|-------|------|------|--------|-------|-----------|
| Display stat (money) | Mondwest | 2rem | 400 | `#b494f7` | none |
| Display stat (date) | Mondwest | 1.5rem | 400 | `rgba(255,255,255,0.9)` | none |
| Section heading | Pixeloid Mono | 1rem | 700 | `#b494f7` | uppercase |
| Subsection heading | Pixeloid Sans | 0.875rem | 700 | `rgba(255,255,255,0.9)` | uppercase |
| Body text | Geist Pixel | 0.8125rem | 400 | `rgba(255,255,255,0.85)` | none |
| Label/caption | Pixeloid Mono | 0.75rem | 400 | `rgba(180,148,247,0.65)` | uppercase |
| Muted/secondary | Geist Pixel | 0.75rem | 400 | `rgba(255,255,255,0.55)` | none |

#### Font Rendering

All pixel fonts (Pixeloid Mono, Pixeloid Sans) MUST use `text-rendering: optimizeSpeed` to preserve crispness. Geist Pixel uses default rendering. Display numbers SHOULD use `font-variant-numeric: tabular-nums`. Display stats and section headings SHOULD use `text-wrap: balance`.

### Section 4: Spacing

em-based scale for responsive sizing:

| Token | Em | Px (at 16px) | Usage |
|-------|-----|--------------|-------|
| `--spacing-2xs` | 0.125em | 2px | Tiny gap |
| `--spacing-xs` | 0.25em | 4px | Tight |
| `--spacing-sm` | 0.5em | 8px | Compact |
| `--spacing-md` | 1em | 16px | Standard |
| `--spacing-lg` | 1.5em | 24px | Comfortable |
| `--spacing-xl` | 2em | 32px | Spacious |
| `--spacing-2xl` | 3em | 48px | Section gap |
| `--spacing-3xl` | 4em | 64px | Large section |
| `--spacing-4xl` | 6em | 96px | Huge |
| `--spacing-5xl` | 8em | 128px | Extra huge |

**Panel-specific spacing:**
- Between major sections: 1.5em
- Between heading and body: 0.625em
- Between body paragraphs: 0.75em
- Panel padding: 1em 1.25em
- Entry padding: 0.75em 1em

### Section 5: Shadows & Elevation

**Button shadows (retro lift):**

| Token | Value |
|-------|-------|
| `--shadow-btn` | `0 2px 0 0 var(--color-black)` |
| `--shadow-btn-hover` | `0 4px 0 0 var(--color-black)` |
| `--shadow-btn-active` | `0 0 0 0 var(--color-black)` |

**Card/Window shadows:**

| Token | Value |
|-------|-------|
| `--shadow-card` | `0 2px 0 0 var(--color-ocean)` |
| `--shadow-card-hover` | `inset 0 0 5em 0 var(--color-teal-glow), 0 2px 0 0 var(--color-ocean)` |
| `--shadow-card-lg` | `4px 4px 0 0 var(--color-black)` |

**Glow effects:**

| Token | Value |
|-------|-------|
| `--shadow-glow-cyan` | `0 0 11em var(--color-green-20)` |
| `--shadow-glow-magma` | `0 0 2em -0.6em var(--color-magma)` |
| `--shadow-glow-ultraviolet` | `0 0 0.2em var(--color-ultraviolet)` |

**Inner shadows:**

| Token | Value |
|-------|-------|
| `--shadow-inner` | `inset 0 0 0 1px var(--color-black)` |
| `--shadow-scrollbar` | `inset 0 0 0 1px var(--color-slate)` |

### Section 6: Motion

**Duration tokens:**

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | 0ms | Reduced motion fallback |
| `--duration-fast` | 100ms | Hover states |
| `--duration-base` | 200ms | Standard transitions |
| `--duration-moderate` | 300ms | Medium complexity |
| `--duration-slow` | 500ms | Complex animations |
| `--duration-scanline` | 6s | CRT scanline sweep |
| `--duration-wobble` | 4s | CRT wobble |
| `--duration-bloom` | 3s | CRT bloom pulse |

**Easing curves:**

| Token | Value | Character |
|-------|-------|-----------|
| `--easing-default` / `--easing-out` | `cubic-bezier(0, 0, 0.2, 1)` | Standard decelerate |
| `--easing-in` | `cubic-bezier(0.4, 0, 1, 1)` | Accelerate |
| `--easing-in-out` | `cubic-bezier(0.785, 0.135, 0.15, 0.86)` | Symmetric |
| `--easing-drift` | `cubic-bezier(0.45, 0, 0.55, 1)` | Gentle float |
| `--easing-dock` | `cubic-bezier(0.25, 0, 0.55, 1)` | Decelerate to stop |
| `--easing-launch` | `cubic-bezier(0.45, 0, 0.75, 1)` | Accelerate away |
| `--easing-photon` | `cubic-bezier(0.2, 0, 0.8, 1)` | Near-instant |

**Reduced motion:** All durations collapse to 0ms when `prefers-reduced-motion: reduce` is active. CRT animation durations (scanline, wobble, bloom) also disable.

### Section 7: Component Patterns

#### Button: `.button_mono`

Gradient CTA with bevel border and retro lift shadow.

- **Background:** `--gradient-action-primary` (amber -> magma -> ultraviolet at 76deg)
- **Border:** 1px solid `rgba(180, 148, 247, 0.8)`, bottom/right use `--bevel-lo` (`#553691`) for 3D bevel
- **Shadow:** `0 0.125em 0 0 var(--black)` (retro offset)
- **Text:** `--color-white`, Pixeloid Sans or inherits, 0.875em, 700 weight, uppercase
- **Hover:** brighter gradient, full lavender border, magma glow (`0 0 2em 0 var(--magma)`)
- **Active:** darkened gradient, inverted bevel (bottom/right become highlight), inset shadow
- **Animation:** `button-pulse` — subtle magma glow breathing every 2s
- **Size:** height 2.5em, padding 0 1em, max-width 20em

#### Window: `.app_wrap` + `.app-window`

Glassmorphic CRT window with beveled chrome.

- **`.app_wrap` (outer shell):**
  - Background: `--gradient-glass` (cyan-green glassmorphic)
  - Border: 1px solid `rgba(180, 148, 247, 0.8)`, bevel bottom/right
  - Shadow: `0 0.125em 0 0 var(--ocean)`
  - Min/max width: 20em / 77em
  - Hover: inner teal glow (`inset 0 0 5em 0 rgba(0, 180, 159, 0.97)`)

- **`.app-window` (inner content window):**
  - Background: `rgb(1, 1, 1)` (near-black)
  - Border: 1px solid `rgba(180, 148, 247, 0.8)`, bevel bottom/right
  - Shadow: `0 0 2em var(--panel-accent-08)`
  - Defines `--panel-accent` scale (lavender at 8 opacity levels)
  - Hover: `0 0 2em var(--panel-accent-20)`

#### Taskbar: `.taskbar_wrap`

- Background: `--color-black`
- Border-bottom: 1px solid `--bevel-lo`
- Text: Pixeloid Mono, 0.8125em, uppercase, `--color-white`
- Decorative lines: gradient from transparent -> `--panel-accent-20` -> transparent
- Cursor: `move` (draggable)

#### Bevel Border System

Applied to buttons, windows, and panels. Creates a 3D inset/outset effect:
- **Highlight (top/left):** `--color-bevel-highlight` — `rgba(167, 145, 216, 0.45)` (lavender)
- **Shadow (bottom/right):** `--color-bevel-shadow` — `#553691` (deep purple)
- **Active state:** invert — bottom/right become highlight, top/left become shadow

#### Custom Scrollbar

Beveled scrollbar matching the window chrome:
- Track: `rgba(1, 1, 1, 0.4)` with 1px `--bevel-lo` left border
- Thumb: `--panel-accent-08` background, 1px `rgba(180, 148, 247, 0.8)` border with bevel bottom/right
- Thumb hover: `rgba(105, 57, 202, 0.3)` with full lavender border
- Width: 0.625em
- Horizontal scrollbar: hidden

#### Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-none` | 0 | Sharp corners |
| `--radius-xs` | 0.125em (2px) | Subtle rounding |
| `--radius-sm` | 0.25em (4px) | Buttons, inputs |
| `--radius-md` | 0.5em (8px) | Cards, windows |
| `--radius-lg` | 1em (16px) | Large elements |
| `--radius-full` | 9999px | Pills, circles |

---

## Part 2: Application-Specific

### Window System

MONOLITH uses a draggable window system where content panels float over a portal background:
- Windows are absolutely positioned with z-index layering
- Taskbar provides drag handle + title + action buttons
- Content area (`.app_contents`) scrolls independently with custom scrollbar
- Window constraints: min 20em wide, max 77em wide, max 90vh tall

### Panel Accent Context

Panel chrome uses lavender (`#b494f7`) scoped via `--panel-accent` custom properties on `.app-window`. This separates panel UI from the orbital amber/magma palette used in hero elements and CTAs. The CTA gradient (`--gradient-action-primary`) MUST remain amber -> magma -> ultraviolet — CTAs are actions, not chrome.

### Portal Background

Layered image system with rotation animations:
- `.portal.bg` — 40% opacity, 180s rotation
- `.portal.mid` — 66% opacity, 120s rotation
- `.portal.door` — full opacity, pixelated rendering
- `.background.blur` — brightness 147%, blur 3em, lighten blend mode

### Hero Typography

The "MONOLITH" title uses Mondwest at `clamp(2.5em, 12vw, 8em)` with:
- `-webkit-text-stroke: 1px #ffc99f` (peach outline)
- `text-shadow: 0 0 0.1em #d9c4ff` (lavender glow)
- Individual letter styling with amber drop-shadow

Subtitle uses Pixeloid Mono at `clamp(1em, 4vw, 1.5em)`, uppercase, with amber drop-shadow filter.

### Responsive Behavior

- Body font-size: `1vw` (fluid), clamped to `1rem` at 1440px and 1920px breakpoints
- Full-height viewport (`100dvh`), overflow hidden on `.monolith-body`
- Breakpoint tokens defined from 360px (xs) to 1920px (3xl)

---

## Part 3: Social Graphic Templates

All templates use a **1600x900** artboard unless noted. Background: `--color-surface-primary` (`#010101`). Text: `--color-content-primary` (`#f6f6f5`) unless overridden.

### Template 1: Hook Card

Bold headline grab for opening tweet graphics.

- **Artboard:** 1600x900, background `#010101`
- **Layout:** `flex-direction: column; justify-content: center; align-items: center; padding: 80px;`
- **Headline:** Mondwest, 80px, weight 400, color `#f6f6f5`, `text-align: center`, max 8 words
- **Subline:** Pixeloid Sans, 24px, weight 400, color `rgba(180, 148, 247, 0.65)`, uppercase, `letter-spacing: 0.05em`
- **Accent line:** 120px wide, 2px tall, `--gradient-action-primary` (amber -> magma -> ultraviolet), centered below headline with 32px gap
- **Optional badge:** Clone from brand manual badge component, positioned top-right with 40px inset
- **Background treatment:** Subtle `--panel-accent-08` (`rgba(180, 148, 247, 0.08)`) radial glow at center

### Template 2: Stat Hero

Leads with a number or data point.

- **Artboard:** 1600x900, background `#010101`
- **Layout:** `flex-direction: column; justify-content: center; align-items: flex-start; padding: 80px 120px;`
- **Stat number:** Mondwest, 160px, weight 400, color `#b494f7` (panel-accent), `font-variant-numeric: tabular-nums`
- **Stat label:** Pixeloid Mono, 20px, weight 400, color `rgba(180, 148, 247, 0.65)`, uppercase, `letter-spacing: 0.08em`, 16px gap below stat
- **Body text:** Geist Pixel, 24px, weight 400, color `rgba(255, 255, 255, 0.85)`, max 2 lines, 40px gap below label
- **Accent:** Left border 3px solid gradient (amber -> magma), full height of stat + label group
- **Background treatment:** Faint horizontal scanline pattern at 4% opacity

### Template 3: Quote Panel

Features someone's words with panel chrome styling.

- **Artboard:** 1600x900, background `#010101`
- **Layout:** `flex-direction: column; justify-content: center; align-items: center; padding: 80px;`
- **Quote container:** 1200px max-width, border 1px solid `rgba(180, 148, 247, 0.4)`, bevel bottom/right `#553691`, background `rgba(1, 1, 1, 0.5)`, padding 60px
- **Quote text:** Mondwest, 48px, weight 400, color `#f6f6f5`, `text-wrap: balance`
- **Attribution:** Pixeloid Mono, 16px, weight 400, color `rgba(180, 148, 247, 0.65)`, uppercase, 32px gap above, preceded by "-- " dash
- **Decorative:** Large open-quote glyph in Mondwest, 120px, color `rgba(180, 148, 247, 0.15)`, absolute positioned top-left of container at -20px, -10px

### Template 4: List Graphic

Tips, steps, or key points.

- **Artboard:** 1600x900, background `#010101`
- **Layout:** `flex-direction: row; gap: 80px; padding: 80px;`
- **Left column (40%):** Title area
  - Title: Mondwest, 56px, weight 400, color `#f6f6f5`
  - Subtitle: Pixeloid Mono, 16px, weight 400, color `rgba(180, 148, 247, 0.65)`, uppercase, 16px gap
- **Right column (60%):** List items, `flex-direction: column; gap: 24px;`
  - Each item: `flex-direction: row; gap: 20px; align-items: flex-start;`
  - Number: Mondwest, 32px, weight 400, color `#b494f7`, min-width 40px
  - Text: Geist Pixel, 22px, weight 400, color `rgba(255, 255, 255, 0.85)`, max 2 lines
- **Max items:** 5 (for readability at social media scale)
- **Divider:** 1px solid `rgba(180, 148, 247, 0.15)` between items

### Template 5: Announcement

Dramatic news or launch card.

- **Artboard:** 1600x900, background `#010101`
- **Layout:** `flex-direction: column; justify-content: center; align-items: center; padding: 60px 80px;`
- **Tag line:** Pixeloid Mono, 16px, weight 400, color `#b494f7`, uppercase, `letter-spacing: 0.1em`
- **Headline:** Mondwest, 96px, weight 400, background `--gradient-action-primary` with `-webkit-background-clip: text` and `-webkit-text-fill-color: transparent`, `text-align: center`, max 6 words
- **Body:** Geist Pixel, 24px, weight 400, color `rgba(255, 255, 255, 0.85)`, `text-align: center`, max 2 lines, 32px gap
- **CTA area:** Clone `.button_mono` from brand manual, centered, 48px below body
- **Background treatment:** Radial gradient from `rgba(105, 57, 202, 0.15)` at center to transparent, plus subtle amber glow at top edge

---

## Part 4: Hard-Won Rules

> Populate as implementation issues are discovered.

- Pixel fonts (Pixeloid Mono, Pixeloid Sans) render poorly at fractional sizes or with subpixel antialiasing. Always use `text-rendering: optimizeSpeed` and integer-pixel sizes where possible.
- The bevel border system inverts on `:active` — bottom/right become highlight, top/left become shadow. This MUST be maintained for the 3D effect to feel physical.
- Panel accent tokens (`--panel-accent-*`) are scoped to `.app-window`. Do NOT use them outside window components. Use the orbital palette (amber/magma/gradient) for hero and global elements instead.
- CTA buttons (`--gradient-action-primary`) MUST NOT use panel-accent lavender. CTAs are actions with orbital energy, not panel chrome.
- Body font-size uses `1vw` with `1rem` clamps at 1440px and 1920px. This means em-based tokens scale fluidly between those breakpoints.
