# Dithwather Playground -- Radiants Design Spec

> Design brief for re-skinning the playground app with the Radiants pixel-art design system.
> This document contains exact values for an engineer to implement. No code is included.

---

## 1. Design Tokens Reference

### Colors

| Token | Hex | Usage |
|---|---|---|
| surface-primary | `#0F0E0C` | Page background |
| surface-secondary | `#FEF8E2` | Cream -- primary text, borders |
| surface-tertiary | `#3D2E1A` | Deep brown -- section dividers, card accents |
| surface-elevated | `#1A1918` | Cards, panels, elevated containers |
| surface-muted | `#252422` | Subtle backgrounds, hover states |
| content-primary | `#FEF8E2` | Body text |
| content-heading | `#FFFFFF` | Headings |
| content-muted | `rgba(254, 248, 226, 0.6)` | Secondary text, descriptions, labels |
| edge-primary | `#FEF8E2` | Borders |
| edge-muted | `rgba(254, 248, 226, 0.2)` | Subtle borders, grid lines |
| edge-focus | `#FCE184` | Focus rings |
| action-primary | `#FCE184` | Sun yellow -- primary actions, CTA |
| action-accent | `#FCC383` | Sunset fuzz -- secondary accents |
| action-destructive | `#FF6B63` | Destructive / sun-red |
| status-success | `#CEF5CA` | Green |
| status-warning | `#FCE184` | Yellow (same as action-primary) |
| status-error | `#FF6B63` | Red |
| status-info | `#95BAD2` | Sky blue |
| brand-sun-yellow | `#FCE184` | Primary brand accent |
| brand-sky-blue | `#95BAD2` | Secondary brand accent |
| brand-sunset-fuzz | `#FCC383` | Tertiary brand accent |
| brand-sun-red | `#FF6B63` | Warm accent |
| brand-green | `#CEF5CA` | Organic accent |

### Typography

| Role | Font Stack | Fallback |
|---|---|---|
| Heading | `'Joystix Monospace'` | `monospace` |
| Body | `'Mondwest'` | `system-ui, sans-serif` |
| Code / Labels | `'PixelCode'` | `'SF Mono', 'Fira Code', monospace` |

| Scale Token | Size |
|---|---|
| 2xs | 8px |
| xs | 12px |
| sm | 14px |
| base | 14px |
| lg | 16px |
| xl | 20px |
| 2xl | 24px |
| 3xl | 32px |

### Shadows

| Element | Shadow |
|---|---|
| Card | `2px 2px 0 0 #000000` |
| Button idle | `0 1px 0 0 #000000` |
| Button hover | `0 3px 0 0 #000000` |
| Glow (sun-yellow) | `0 0 12px rgba(252, 225, 132, 0.3)` |
| Glow (sky-blue) | `0 0 12px rgba(149, 186, 210, 0.3)` |

### Spacing

Base unit: 8px. Use multiples: 8, 12, 16, 24, 32, 48, 64.

---

## 2. Page Shell

### Body / Root Container

- **Background**: `#0F0E0C` (surface-primary)
- **Default text color**: `#FEF8E2` (content-primary)
- **Default body font**: `'Mondwest', system-ui, sans-serif` at `14px`
- **Max width**: `960px`
- **Horizontal padding**: `24px` (mobile), `48px` (desktop)
- **Vertical padding**: `48px` top, `64px` bottom
- **Margin**: `0 auto` (centered)

### Scrollbar Styling (optional enhancement)

- Track: `#0F0E0C`
- Thumb: `#3D2E1A` with 1px `#FEF8E2` border
- Width: 8px

---

## 3. Header

### Layout

- **Margin bottom**: `64px`
- **Text alignment**: left

### Title ("DITHWATHER")

- **Font**: `'Joystix Monospace', monospace`
- **Size**: `3xl` (32px)
- **Weight**: 700
- **Color**: `#FFFFFF` (content-heading)
- **Letter spacing**: `0.05em` (slightly wide -- pixel font reads better with spacing)
- **Text transform**: `uppercase`
- **Text shadow**: `2px 2px 0 #3D2E1A` (flat retro shadow in tertiary brown)

### Subtitle

- **Font**: `'PixelCode', 'SF Mono', monospace`
- **Size**: `sm` (14px)
- **Color**: `rgba(254, 248, 226, 0.6)` (content-muted)
- **Margin top**: `8px`
- **Content**: `binary tile pipeline + canvas pipeline -- dithering effects for react`
- **Letter spacing**: `0.02em`

### Header Accent

- A thin horizontal rule below the subtitle:
  - **Margin top**: `24px`
  - **Height**: `1px`
  - **Background**: `linear-gradient(90deg, #FCE184, #FCC383, #FF6B63, #95BAD2, transparent)`
  - **Width**: `100%`
  - This gradient bar uses all four brand accents and fades out, establishing the palette visually at the top of the page.

---

## 4. Section Containers (Shared Pattern)

Each of the 5 sections follows this structure:

### Section Wrapper

- **Margin bottom**: `64px`

### Section Heading

- **Font**: `'Joystix Monospace', monospace`
- **Size**: `xl` (20px)
- **Weight**: 700
- **Color**: `#FFFFFF` (content-heading)
- **Text transform**: `uppercase`
- **Letter spacing**: `0.04em`
- **Margin bottom**: `8px`

### Section Description

- **Font**: `'PixelCode', 'SF Mono', monospace`
- **Size**: `xs` (12px)
- **Color**: `rgba(254, 248, 226, 0.6)` (content-muted)
- **Margin bottom**: `24px`

### Section Divider (between sections)

- **Element**: A subtle horizontal rule between sections (placed after each section's content, before the next section heading)
- **Height**: `1px`
- **Background**: `rgba(254, 248, 226, 0.1)` (very faint cream)
- **Margin**: `0 0 64px 0` (sits inside the section's bottom margin)
- Only between sections, not after the last one.

---

## 5. Section 1: Bayer Tile Pipeline

### Section Identity Color

- Bayer uses **sun-yellow** (`#FCE184`) as its signature color throughout this section.

### Heading Badge

- Before the heading text, show a small colored square: `8px x 8px`, background `#FCE184`, `border-radius: 2px`, inline with text, `margin-right: 8px`. This acts as a color swatch "bullet" identifying the section.

### Grid Layout

- **Display**: `grid`
- **Grid template**: `repeat(3, 1fr)` (3 columns)
- **Gap**: `16px`
- **Total cells**: 9 (3 algorithms x 3 modes)

### Grid Column Headers (above grid)

- Show mode labels ("BACKGROUND", "MASK", "FULL") above the three columns.
- **Font**: `'Joystix Monospace', monospace`
- **Size**: `2xs` (8px)
- **Color**: `rgba(254, 248, 226, 0.4)`
- **Text transform**: `uppercase`
- **Letter spacing**: `0.08em`
- **Text align**: `center`
- **Margin bottom**: `8px`

### Grid Row Labels (left side)

- Show algorithm labels ("BAYER 2x2", "BAYER 4x4", "BAYER 8x8") to the left of each row.
- Accomplished by making the grid `repeat(4, auto)` columns where column 1 is the label.
- **Font**: `'PixelCode', monospace`
- **Size**: `xs` (12px)
- **Color**: `#FCE184` (sun-yellow -- matches section identity)
- **Text align**: `right`
- **Padding right**: `12px`
- **Vertical alignment**: `center`

Alternative simpler approach: Keep the 3-column grid but add a row label above each row as a full-width span.

### DitherBox Cells (Bayer)

- **Width**: `100%` (fills grid cell)
- **Height**: `120px`
- **Border**: `1px solid rgba(254, 248, 226, 0.2)` (edge-muted)
- **Border radius**: `4px`
- **Box shadow**: `2px 2px 0 0 #000000` (card shadow)
- **Background**: inherits from DitherBox rendering
- **Display**: `flex`, `align-items: center`, `justify-content: center`

#### Dither Color Palette (Bayer cells)

- **Foreground (fg)**: `#FCE184` (sun-yellow)
- **Background (bg)**: `#0F0E0C` (surface-primary, near-black)
- This creates golden dither patterns on the dark background -- warm, cohesive with radiants.
- **Threshold**: `0.45`
- **Pixel scale**: `3`

#### Cell Inner Label

- **Font**: `'PixelCode', monospace`
- **Size**: `xs` (12px)
- **Weight**: 600
- **Color**: `#FCE184` (sun-yellow)
- **Text shadow**: `0 1px 2px rgba(0, 0, 0, 0.8)`
- Shows the algorithm name (e.g., "bayer2x2")

#### Cell Caption (below each cell)

- **Font**: `'PixelCode', monospace`
- **Size**: `2xs` (8px) -- very small, acts as metadata
- **Color**: `rgba(254, 248, 226, 0.4)` (very muted cream)
- **Text align**: `center`
- **Margin top**: `6px`
- **Text transform**: `uppercase`
- Shows the mode name (e.g., "BACKGROUND")

---

## 6. Section 2: Floyd-Steinberg Canvas Pipeline

### Section Identity Color

- Floyd-Steinberg uses **sky-blue** (`#95BAD2`) as its signature color throughout this section.

### Heading Badge

- `8px x 8px` square, background `#95BAD2`, same treatment as Bayer section.

### Grid Layout

- **Display**: `grid`
- **Grid template**: `repeat(3, 1fr)` (3 columns for 3 modes)
- **Gap**: `16px`

### DitherBox Cells (Floyd-Steinberg)

- **Width**: `100%`
- **Height**: `120px`
- **Border**: `1px solid rgba(254, 248, 226, 0.2)` (edge-muted)
- **Border radius**: `4px`
- **Box shadow**: `2px 2px 0 0 #000000`
- **Display**: `flex`, `align-items: center`, `justify-content: center`

#### Dither Color Palette (F-S cells)

- **Foreground (fg)**: `#95BAD2` (sky-blue)
- **Background (bg)**: `#0F0E0C` (surface-primary)
- **Gradient colors**: `['#0F0E0C', '#95BAD2']` -- dark to sky-blue
- **Gradient angle**: `135`
- **Threshold**: `0.5`
- Creates cool blue-toned error diffusion patterns contrasting the warm Bayer section above.

#### Cell Inner Label

- **Font**: `'PixelCode', monospace`
- **Size**: `xs` (12px)
- **Weight**: 600
- **Color**: `#95BAD2` (sky-blue)
- **Text shadow**: `0 1px 2px rgba(0, 0, 0, 0.8)`

#### Cell Caption

- Same pattern as Bayer section but using `rgba(254, 248, 226, 0.4)` for text color.

---

## 7. Section 3: Interactive Demo

### Section Identity Color

- This section uses both algorithm colors to show contrast: sun-yellow (Bayer) vs sky-blue (F-S). The section heading itself uses **sunset-fuzz** (`#FCC383`) as a neutral warm accent.

### Heading Badge

- `8px x 8px` square, background `#FCC383` (sunset-fuzz).

### Grid Layout

- **Display**: `grid`
- **Grid template**: `1fr 1fr` (two columns, side by side)
- **Gap**: `24px` (slightly wider gap to give each demo room)

### Interactive DitherBox -- Left (Bayer)

- **Width**: `100%`
- **Height**: `200px` (taller than tile grid cells for emphasis)
- **Border**: `1px solid rgba(254, 248, 226, 0.2)`
- **Border radius**: `4px`
- **Box shadow**: `2px 2px 0 0 #000000`
- **Cursor**: `pointer`
- **Transition on hover**: box-shadow shifts to `0 0 12px rgba(252, 225, 132, 0.3)` (sun-yellow glow)

#### Dither Colors (left)

- **fg**: `#FCE184` (sun-yellow)
- **bg**: `#0F0E0C`
- **Algorithm**: `bayer8x8`
- **Source**: `solid`
- **Pixel scale**: `2`
- **Animate idle threshold**: `0.3`
- **Animate hover threshold**: `0.7`
- **Transition**: `300ms`

#### Label (left)

- **Font**: `'PixelCode', monospace`
- **Size**: `sm` (14px)
- **Weight**: 600
- **Color**: `#FCE184`
- **Text shadow**: `0 1px 3px rgba(0, 0, 0, 0.9)`
- **Content**: `bayer8x8 -- hover me`

#### Caption (left)

- **Font**: `'PixelCode', monospace`
- **Size**: `2xs` (8px)
- **Color**: `rgba(254, 248, 226, 0.4)`
- **Content**: `TILE PIPELINE / SUN-YELLOW`
- **Text transform**: `uppercase`

### Interactive DitherBox -- Right (Floyd-Steinberg)

- Same dimensions and structural styles as left box.
- **Transition on hover**: box-shadow shifts to `0 0 12px rgba(149, 186, 210, 0.3)` (sky-blue glow)

#### Dither Colors (right)

- **fg**: `#FCC383` (sunset-fuzz -- differentiated from Bayer's sun-yellow)
- **bg**: `#0F0E0C`
- **Algorithm**: `floyd-steinberg`
- **Source**: `gradient`
- **Gradient colors**: `['#0F0E0C', '#FCC383']`
- **Gradient angle**: `90`
- **Animate idle threshold**: `0.3`
- **Animate hover threshold**: `0.7`
- **Transition**: `300ms`

#### Label (right)

- **Font**: `'PixelCode', monospace`
- **Size**: `sm` (14px)
- **Weight**: 600
- **Color**: `#FCC383`
- **Text shadow**: `0 1px 3px rgba(0, 0, 0, 0.9)`
- **Content**: `floyd-steinberg -- hover me`

#### Caption (right)

- **Content**: `CANVAS PIPELINE / SUNSET-FUZZ`

---

## 8. Section 4: Button Showcase

### Section Identity Color

- Uses **action-primary** (`#FCE184`) since buttons are actions.

### Heading Badge

- `8px x 8px` square, background `#FCE184`.

### Layout

- **Display**: `flex`
- **Gap**: `16px`
- **Flex wrap**: `wrap`
- **Align items**: `center`

### Button Base Styles (applied to all DitherButtons via `buttonStyle`)

- **Font**: `'Joystix Monospace', monospace`
- **Size**: `xs` (12px)
- **Weight**: 700
- **Color**: `#FFFFFF` (content-heading)
- **Text transform**: `uppercase`
- **Letter spacing**: `0.04em`
- **Padding**: `12px 24px`
- **Border**: `1px solid rgba(254, 248, 226, 0.2)`
- **Border radius**: `4px`
- **Box shadow (idle)**: `0 1px 0 0 #000000`
- **Transition**: `transform 150ms ease-out, box-shadow 150ms ease-out`

### Button Hover/Active States

These are handled by the DitherBox animate config (threshold changes), plus CSS for the physical button feel:

- **Hover**: `transform: translateY(-0.5px)`, `box-shadow: 0 3px 0 0 #000000`
- **Active**: `transform: translateY(0.5px)`, `box-shadow: 0 0 0 0 #000000`

### Individual Button Dither Colors

Each button gets a different radiants palette color to showcase variety:

| Button | Algorithm | fg | bg | Source |
|---|---|---|---|---|
| BAYER 2x2 | `bayer2x2` | `#CEF5CA` (green) | `#0F0E0C` | `solid` |
| BAYER 4x4 | `bayer4x4` | `#95BAD2` (sky-blue) | `#0F0E0C` | `solid` |
| BAYER 8x8 | `bayer8x8` | `#FF6B63` (sun-red) | `#0F0E0C` | `solid` |
| FLOYD-STEINBERG | `floyd-steinberg` | `#FCE184` (sun-yellow) | `#0F0E0C` | `gradient` |

- **Pixel scale** for Bayer buttons: `4` (2x2), `3` (4x4), `2` (8x8)
- **Gradient colors** for F-S button: `['#0F0E0C', '#FCE184']`

### Button Glow on Hover (per button)

Each button gets a subtle glow matching its fg color on hover:

| Button | Hover glow |
|---|---|
| BAYER 2x2 | `0 0 12px rgba(206, 245, 202, 0.25)` |
| BAYER 4x4 | `0 0 12px rgba(149, 186, 210, 0.25)` |
| BAYER 8x8 | `0 0 12px rgba(255, 107, 99, 0.25)` |
| FLOYD-STEINBERG | `0 0 12px rgba(252, 225, 132, 0.25)` |

---

## 9. Section 5: Editor Demo

### Section Identity Color

- Uses **sunset-fuzz** (`#FCC383`) as the editor accent.

### Heading Badge

- `8px x 8px` square, background `#FCC383`.

### Editor Container

The DitherEditor component itself will need to be styled. Since it currently accepts `className`, the playground can wrap it or pass styles. The design spec defines the desired visual outcome:

#### Outer Container

- **Display**: `flex`
- **Gap**: `24px`
- **Padding**: `16px`
- **Background**: `#1A1918` (surface-elevated)
- **Border**: `1px solid rgba(254, 248, 226, 0.2)` (edge-muted)
- **Border radius**: `4px`
- **Box shadow**: `2px 2px 0 0 #000000`
- **Font family**: `'Mondwest', system-ui, sans-serif`

#### Controls Panel (left side, 280px)

##### Section Sub-Headings ("Dithering", "Color", "Adjustments", "Export")

- **Font**: `'Joystix Monospace', monospace`
- **Size**: `xs` (12px)
- **Weight**: 700
- **Color**: `#FCC383` (sunset-fuzz -- editor accent)
- **Text transform**: `uppercase`
- **Letter spacing**: `0.04em`
- **Margin bottom**: `12px`

##### Labels (slider labels, select labels)

- **Font**: `'PixelCode', monospace`
- **Size**: `xs` (12px)
- **Color**: `rgba(254, 248, 226, 0.6)` (content-muted)

##### Slider Value Display

- **Font**: `'PixelCode', monospace`
- **Size**: `xs` (12px)
- **Color**: `rgba(254, 248, 226, 0.4)` (dimmer than label)

##### Slider Track

- **Height**: `4px`
- **Background**: `#252422` (surface-muted)
- **Border radius**: `2px`

##### Slider Thumb

- **Width x Height**: `12px x 12px`
- **Background**: `#FCE184` (sun-yellow)
- **Border**: `1px solid #0F0E0C`
- **Border radius**: `2px` (square-ish, pixel aesthetic)
- **Cursor**: `pointer`

##### Select Dropdown

- **Background**: `#252422` (surface-muted)
- **Color**: `#FEF8E2` (content-primary)
- **Border**: `1px solid rgba(254, 248, 226, 0.2)` (edge-muted)
- **Border radius**: `4px`
- **Padding**: `8px`
- **Font**: `'PixelCode', monospace`
- **Size**: `sm` (14px)

##### Color Input (text field part)

- **Background**: `#252422`
- **Color**: `#FEF8E2`
- **Border**: `1px solid rgba(254, 248, 226, 0.2)`
- **Border radius**: `4px`
- **Padding**: `8px`
- **Font**: `'PixelCode', monospace`

##### Color Swatch (color picker)

- **Width**: `40px`
- **Height**: `32px`
- **Border**: `1px solid rgba(254, 248, 226, 0.2)`
- **Border radius**: `4px`
- **Cursor**: `pointer`

##### Export Buttons

- **Font**: `'Joystix Monospace', monospace`
- **Size**: `2xs` (8px)
- **Weight**: 700
- **Text transform**: `uppercase`
- **Letter spacing**: `0.04em`
- **Background**: `#252422` (surface-muted)
- **Color**: `#FEF8E2` (content-primary)
- **Border**: `1px solid rgba(254, 248, 226, 0.2)`
- **Border radius**: `4px`
- **Padding**: `8px 16px`
- **Box shadow**: `0 1px 0 0 #000000`
- **Cursor**: `pointer`
- **Hover**: background `#3D2E1A`, `transform: translateY(-0.5px)`, `box-shadow: 0 3px 0 0 #000000`
- **Active**: `transform: translateY(0.5px)`, `box-shadow: 0 0 0 0 #000000`

#### Preview Panel (right side, flex: 1)

- **Background**: `#0F0E0C` (surface-primary -- slightly darker than the elevated container, creating depth)
- **Border**: `1px solid rgba(254, 248, 226, 0.1)` (very subtle inner border)
- **Border radius**: `4px`
- **Min height**: `300px`
- **Display**: `flex`, `align-items: center`, `justify-content: center`

##### Preview DitherBox

- **Width**: `200px`
- **Height**: `80px`
- **Border radius**: `4px`

##### Preview Label

- **Font**: `'PixelCode', monospace`
- **Color**: `#FFFFFF`
- **Weight**: 600

### Export Output (pre block, shown after export)

- **Margin top**: `16px`
- **Padding**: `16px`
- **Background**: `#0F0E0C` (surface-primary)
- **Border**: `1px solid rgba(254, 248, 226, 0.15)`
- **Border radius**: `4px`
- **Box shadow**: `2px 2px 0 0 #000000` (inset feel via card shadow)
- **Font**: `'PixelCode', 'SF Mono', monospace`
- **Size**: `2xs` (8px) -- very small code output
- **Color**: `rgba(254, 248, 226, 0.5)` (muted cream)
- **Max height**: `200px`
- **Overflow**: `auto`

---

## 10. Color Strategy for Dither Demos

The dithering effects themselves should use radiants palette colors to feel cohesive rather than arbitrary. Here is the mapping:

| Section / Context | fg Color | bg Color | Rationale |
|---|---|---|---|
| Bayer Tile Grid | `#FCE184` (sun-yellow) | `#0F0E0C` (surface-primary) | Warm gold dithering -- signature Bayer look |
| Floyd-Steinberg Row | `#95BAD2` (sky-blue) | `#0F0E0C` | Cool blue -- visually distinct from Bayer |
| Interactive Bayer | `#FCE184` | `#0F0E0C` | Consistent with Bayer identity |
| Interactive F-S | `#FCC383` (sunset-fuzz) | `#0F0E0C` | Warm but distinct from Bayer's yellow |
| Button: Bayer 2x2 | `#CEF5CA` (green) | `#0F0E0C` | Each button showcases a different palette color |
| Button: Bayer 4x4 | `#95BAD2` (sky-blue) | `#0F0E0C` | |
| Button: Bayer 8x8 | `#FF6B63` (sun-red) | `#0F0E0C` | |
| Button: Floyd-Steinberg | `#FCE184` (sun-yellow) | `#0F0E0C` | |
| Editor Preview | Controlled by user | Controlled by user | Editor lets user pick freely |

This ensures the page reads as a cohesive warm-dark palette rather than a disconnected demo of random colors.

---

## 11. Hover and Focus States

### DitherBox Cards (Sections 1, 2)

- **Default border**: `1px solid rgba(254, 248, 226, 0.2)`
- **Hover border**: `1px solid rgba(254, 248, 226, 0.4)` (brighter)
- **Transition**: `border-color 200ms ease-out`
- No transform or shadow change on these static demo cards.

### Interactive Demo Boxes (Section 3)

- **Default shadow**: `2px 2px 0 0 #000000`
- **Hover shadow**: Replace flat shadow with glow matching the box's fg color (see Section 7 spec above)
- **Transition**: `box-shadow 200ms ease-out`
- **Cursor**: `pointer`

### Buttons (Section 4)

- See Section 8 spec above for full hover/active states.

### Focus Ring (global)

- **Outline**: `2px solid #FCE184` (edge-focus / sun-yellow)
- **Outline offset**: `2px`
- Applied to all interactive elements on `:focus-visible`.

---

## 12. Responsive Behavior

### Breakpoints

| Breakpoint | Max width | Changes |
|---|---|---|
| Desktop | > 768px | Full layout as specified |
| Tablet | 481-768px | Bayer grid becomes 3 columns (modes only, algorithm rows stack). Interactive demo stays 2-col. Editor stacks vertically. |
| Mobile | <= 480px | All grids become single column. Buttons wrap. Editor stacks (controls on top, preview below). |

### Mobile-Specific Adjustments

- **Page padding**: Reduce to `16px` horizontal
- **Heading size**: `2xl` (24px) instead of `3xl`
- **Section margin bottom**: `48px` instead of `64px`
- **DitherBox height**: Reduce to `100px` from `120px` in tile grids
- **Interactive demo height**: `160px` instead of `200px`

---

## 13. Animation and Motion

### Transitions

- All CSS transitions: `200ms ease-out` (default)
- Interactive demo hover: `300ms` (via DitherBox animate config)
- Button hover: `150ms ease-out`
- `@media (prefers-reduced-motion: reduce)`: disable all transitions, set `transition: none`

### Scroll Behavior

- `scroll-behavior: smooth` on the page (if anchoring to sections in future)

### No Entrance Animations

- The playground loads statically. No fade-ins, slide-ins, or staggered reveals. Content appears immediately. The dithering itself provides enough visual interest.

---

## 14. Visual Hierarchy Summary

The page flows top-to-bottom with clear visual rhythm:

```
[HEADER] -- Large pixel title, gradient accent bar
  |
  | 64px gap
  |
[BAYER TILE PIPELINE] -- 3x3 golden-yellow dither grid
  |
  | 1px divider + 64px gap
  |
[FLOYD-STEINBERG] -- 1x3 cool-blue dither row
  |
  | 1px divider + 64px gap
  |
[INTERACTIVE DEMO] -- Two large side-by-side hover boxes with glow
  |
  | 1px divider + 64px gap
  |
[BUTTONS] -- Horizontal row of colorful dither buttons
  |
  | 1px divider + 64px gap
  |
[EDITOR] -- Elevated card with controls + preview
```

### Contrast and Emphasis

- Headings are bright white on near-black: maximum contrast
- Body text is warm cream: high contrast but softer than pure white
- Labels and captions are muted cream (40-60% opacity): recede visually
- Accent colors (yellow, blue, fuzz, red, green) appear only in dither fills and interactive elements
- The page is mostly dark with warm cream text -- the colorful dithering effects become the focal points

---

## 15. Font Loading Notes

The three fonts (`Joystix Monospace`, `Mondwest`, `PixelCode`) should be loaded via `@font-face` declarations in the playground's CSS. If the fonts are not available:

- Headings fall back to `monospace` -- still reads as retro
- Body falls back to `system-ui` -- clean and readable
- Code/labels fall back to `'SF Mono', 'Fira Code', monospace` -- standard code font

The design should look acceptable with fallback fonts. The pixel fonts are enhancement, not requirement.

---

## 16. Implementation Notes for Engineer

1. **Inline styles vs CSS**: The current playground uses all inline styles. The radiants redesign can continue with inline styles but should extract the shared tokens into a `const TOKENS = { ... }` object at the top of the file for maintainability.

2. **DitherEditor styling**: The editor component currently has its own hardcoded styles. For the playground, wrap the editor in a styled container and pass `className` to override where possible. Sub-component styles (slider, select, color input) will need changes inside `DitherEditor.tsx` -- the design spec above defines what those should look like.

3. **The header gradient bar** is purely decorative and should be a simple `<div>` with a linear gradient background.

4. **Section heading badges** (small colored squares) can be implemented as `<span>` elements with inline-block display, or as `::before` pseudo-elements if using CSS classes.

5. **Button hover/active transforms**: Since DitherButton wraps DitherBox which handles the animate config for dithering, the physical button translate-y and shadow changes need to be applied via CSS `:hover` and `:active` pseudo-classes on the button element. This may require adding a small CSS block (either in-document `<style>` or a CSS file) since inline styles cannot target pseudo-classes.

6. **Glow effects on hover**: Similarly, box-shadow transitions on hover require CSS pseudo-class selectors. Consider a small utility CSS class system or a `<style>` tag in the playground.
