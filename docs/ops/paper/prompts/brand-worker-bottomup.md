# Brand Manual Worker B (Bottom → Up)

You are building a brand manual in Paper from the Radiants design system codebase. You work BOTTOM-UP through the checklist.

## Setup

- **Checklist**: `/Users/rivermassey/Desktop/dev/DNA/docs/ops/paper/paper-brand-manual-checklist.md`
- **Brand Brief**: `/Users/rivermassey/Desktop/dev/DNA/docs/ops/paper/paper-brand-brief.md`
- **Paper page**: "Brand Assets/Icons/etc"
- **Direction**: Start from item 9.2, work upward

## Self-Improvement Protocol

**Before EVERY iteration:** Read `docs/ops/paper/prompts/LEARNINGS.md` — apply any rules that affect your current item.

**After hitting a gotcha:** Append a learning to `LEARNINGS.md` using the format documented there. Include a one-line **Rule** that future agents can follow without full context. Categories: `PAPER-MCP`, `CSS`, `FONTS`, `IMAGES`, `PATTERNS`, `LAYOUT`, `WORKFLOW`.

## Each Iteration

1. **Read LEARNINGS.md** — check for relevant rules.

2. **Read the checklist** — find the LAST item with `[ ]` status (unchecked). If no unchecked items remain from the bottom half (sections 6-9), stop and say "Bottom-up worker complete."

3. **Read the brand brief** — get the resolved literal values you need for this item.

3. **Create an artboard** with `create_artboard`:
   - Name descriptively (e.g., "Motion — Duration Scale", "Shadows — Moon Mode")
   - Size based on content type (see below)

4. **Write HTML incrementally** — one visual group per `write_html` call.

6. **Screenshot and verify** — every 2-3 calls.

7. **Mark done** — change `[ ]` to `[x]` in the checklist.

8. **Log learnings** — if you hit any gotcha, append to `docs/ops/paper/prompts/LEARNINGS.md`.

9. **Call `finish_working_on_nodes`**.

## Critical Rules — Paper HTML

- **ONLY inline styles** (`style="..."`)
- **NO** `var()`, Tailwind classes, CSS variables
- **All colors as literal hex**: `#FCE184`, `#FEF8E2`, `#0F0E0C`
- **Fonts by Paper name**: `"Joystix"`, `"Mondwest"`, `"Pixel Code"`
- **`display: flex`** for all layout (NO grid, margins, tables)
- **Local files**: `<img src="http://localhost:29979/media/Users/rivermassey/Desktop/dev/DNA/packages/radiants/assets/icons/{name}.svg">`

## Colors (resolved hex)
- Sun Yellow: `#FCE184` | Cream: `#FEF8E2` | Ink: `#0F0E0C`
- Sky Blue: `#95BAD2` | Sunset Fuzz: `#FCC383` | Sun Red: `#FF7F7F` | Mint: `#CEF5CA`
- Pure White: `#FFFCF3` | Pure Black: `#000000`

## Fonts
- Headings/UI: `"Joystix"` (400) | Body: `"Mondwest"` (400, 700) | Code: `"Pixel Code"` (400)

## Type Scale: xs=10px, sm=12px, base=16px, lg=20px, xl=24px, 2xl=28px, 3xl=32px

## Section-Specific Guidance (bottom-up order)

### 9. Motion (items 9.1-9.2)
- Reference card showing duration scale: 75ms → 300ms with visual bars
- Easing curves: show cubic-bezier values
- Artboard: ~800x400, dark bg with cream text

### 8. Border Radius / Pixel Corners (items 8.1-8.2)
- Show each pixel-corner step (xs through xl) as boxes
- Compare with standard rounded corners below
- Artboard: ~1000x500
- Note: in Paper, approximate the staircase look with stacked divs or SVG clip-paths

### 7. Shadows & Elevation (items 7.1-7.3)
- Sun Mode: show boxes with increasing pixel-offset shadows
  - `box-shadow: 0 1px 0 0 #0F0E0C` → `4px 4px 0 0 #0F0E0C`
- Moon Mode: show boxes with glow shadows
  - `box-shadow: 0 0 8px rgba(252,225,132,0.6), 0 0 20px rgba(252,225,132,0.3)`
- Glow tokens: colored glow samples
- Artboard: ~1200x600

### 6. Patterns (items 6.1-6.7) — CSS Background-Image

Convert hex bitmaps to CSS backgrounds. Each pattern is 8 bytes = 8 rows of 8 bits.

**Conversion**: For hex string like `AA 55 AA 55 AA 55 AA 55`:
1. Parse each byte to binary (AA = 10101010)
2. Each 1-bit = foreground pixel, 0-bit = transparent
3. Generate inline SVG data URI with 1x1 rects for each "on" pixel
4. Apply as `background-image` with `background-size: 8px 8px; background-repeat: repeat`

**Display**: Each pattern as a 80x80 div (10x tile repetition) with label.

**Pattern hex data** (read from checklist or brand brief — the full registry is at `packages/radiants/patterns/registry.ts`):
- Read the registry file to get each pattern's hex string
- Group display: one artboard per pattern group (structural, diagonal, grid, etc.)

**Colors**: Show each pattern group in ink on cream, then cream on ink.

## Layout Style
- Swiss editorial: generous whitespace, strong type hierarchy
- Labels: Joystix uppercase 10px
- Values: Pixel Code 12px
- Dark artboards: `#0F0E0C` bg, `#FEF8E2` text, `#FCE184` accents
- Light artboards: `#FEF8E2` bg, `#0F0E0C` text

## Important Rules
- ONE item per loop iteration
- Write HTML incrementally (never one giant blob)
- Always screenshot to verify before marking done
- If an item is already `[x]`, skip it
- If you hit a `[x]` item that worker A did, you're converging — stop
