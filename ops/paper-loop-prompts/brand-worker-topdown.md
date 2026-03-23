# Brand Manual Worker A (Top → Down)

You are building a brand manual in Paper from the Radiants design system codebase. You work TOP-DOWN through the checklist.

## Setup

- **Checklist**: `/Users/rivermassey/Desktop/dev/DNA/ops/paper-brand-manual-checklist.md`
- **Brand Brief**: `/Users/rivermassey/Desktop/dev/DNA/ops/paper-brand-brief.md`
- **Paper page**: "Brand Assets/Icons/etc"
- **Direction**: Start from item 1.1, work downward

## Each Iteration

1. **Read the checklist** — find the FIRST item with `[ ]` status (unchecked). If no unchecked items remain from the top half (sections 1-5), stop and say "Top-down worker complete."

2. **Read the brand brief** — get the resolved literal values you need for this item.

3. **Create an artboard** with `create_artboard`:
   - Name it descriptively (e.g., "Logos — Cream on Ink", "Color Palette — Sun Mode")
   - Size based on content type:
     - Logo cards: 400x300 per card, or a grid artboard
     - Color swatches: 1200x800
     - Typography specimens: 1200x600
     - Icon grids: 1440x900 (or taller for all 153)
     - Pattern grids: 1200x800 per group

4. **Write HTML incrementally** — one visual group per `write_html` call:
   - Use ONLY inline styles (`style="..."`)
   - NO `var()`, NO Tailwind classes, NO CSS variables
   - All colors as literal hex: `#FCE184`, `#FEF8E2`, `#0F0E0C`
   - All fonts by Paper name: `"Joystix"`, `"Mondwest"`, `"Pixel Code"`
   - Use `display: flex` for layout (NO grid, NO margins, NO tables)
   - Reference local SVGs as: `<img src="http://localhost:29979/media/Users/rivermassey/Desktop/dev/DNA/packages/radiants/assets/{path}">`
   - Reference logos as: `<img src="http://localhost:29979/media/Users/rivermassey/Desktop/dev/DNA/packages/radiants/assets/{file}.svg">`
   - Reference icons as: `<img src="http://localhost:29979/media/Users/rivermassey/Desktop/dev/DNA/packages/radiants/assets/icons/{name}.svg">`

5. **Screenshot and verify** — take a screenshot after every 2-3 write_html calls. Check spacing, alignment, contrast, clipping.

6. **Mark done** — update the checklist: change `[ ]` to `[x]` for the completed item.

7. **Call `finish_working_on_nodes`** to release the artboard.

## Design Language

### Colors (resolved)
- Sun Yellow: `#FCE184`
- Cream: `#FEF8E2`
- Ink: `#0F0E0C`
- Sky Blue: `#95BAD2`
- Sunset Fuzz: `#FCC383`
- Sun Red: `#FF7F7F`
- Mint: `#CEF5CA`
- Pure White: `#FFFFFF`
- Pure Black: `#000000`

### Fonts
- Headings/UI: `font-family: "Joystix"` (weight 400)
- Body/descriptions: `font-family: "Mondwest"` (weight 400 or 700)
- Code/mono: `font-family: "Pixel Code"` (weight 400)

### Type Scale (px at 16px root)
- xs: 10px, sm: 12px, base: 16px, lg: 20px, xl: 24px, 2xl: 28px, 3xl: 32px

### Layout Style
- Swiss editorial: generous whitespace, strong type hierarchy
- Dark artboards: `#0F0E0C` bg, `#FEF8E2` text, `#FCE184` accents
- Light artboards: `#FEF8E2` bg, `#0F0E0C` text, `#FCE184` accents
- Section headers: Joystix uppercase, 10px, with subtle rule below
- Labels: Joystix, 10px, uppercase, `rgba(15,14,12,0.6)` or `rgba(254,248,226,0.6)`
- Values: Pixel Code, 12px

## Section-Specific Guidance

### 1. Logos (items 1.1-1.9)
- 3x3 grid: rows = RadSun/Mark/Wordmark, cols = Cream-on-Ink / Black-on-Cream / Yellow-on-Ink
- Each cell: background matches the "on" color, logo SVG centered
- Label below each: variant + color in Joystix 10px

### 2-3. Colors (items 2.1-3.7)
- Large swatch rectangles with hex/oklch/role labels
- Sun Mode (light bg) and Moon Mode (dark bg) as separate artboards
- Brand Primitives: 3 large swatches side-by-side
- Extended: 4 medium swatches
- Semantic tokens: grouped by category (Surface/Content/Edge/Action/Status) with light+dark swatch pairs

### 4. Typography (items 4.1-4.5)
- Specimen artboard per font showing all weights/sizes
- The type scale as a visual ladder

### 5. Icons (items 5.1-5.2)
- Dense grid: 12-15 icons per row, labeled
- Each icon: 24x24 SVG + name below in Pixel Code 8px
- Light version (ink on cream) and dark version (cream on ink)

## Patterns (items 6.1-6.7) — CSS Background-Image

For each pattern, convert hex bitmap to a CSS background using an inline SVG data URI:

```
The hex "AA 55 AA 55 AA 55 AA 55" means:
Row 0: 10101010 (AA)
Row 1: 01010101 (55)
... (checkerboard)
```

Generate a 8x8 SVG with 1x1 pixel rectangles for "on" bits, then use:
```html
<div style="width: 64px; height: 64px; background-image: url('data:image/svg+xml,...'); background-size: 8px 8px; background-repeat: repeat; image-rendering: pixelated;"></div>
```

Use the pattern foreground color as rect fill. Scale up the display div to show the pattern clearly.

## Important Rules
- ONE item per loop iteration
- Write HTML incrementally (never one giant blob)
- Always screenshot to verify before marking done
- If an item is already `[x]`, skip it
- If you hit a `[x]` item that worker B did, you're converging — stop
