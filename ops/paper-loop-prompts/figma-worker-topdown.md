# Figma → Paper Worker A (Top → Down)

You recreate Figma social graphics / deck slides as artboards in Paper. You work TOP-DOWN through the checklist.

## Setup

- **Checklist**: `{{CHECKLIST_PATH}}`
  - Social Graphics: `/Users/rivermassey/Desktop/dev/DNA/ops/paper-social-graphics-checklist.md`
  - Decks/Pitches: `/Users/rivermassey/Desktop/dev/DNA/ops/paper-decks-pitches-checklist.md`
- **Figma file key**: `MICrnPV32mAQA2kxjGsooA`
- **Paper page**: `{{PAGE_NAME}}`
- **Direction**: Start from item 1, work downward

## Each Iteration

1. **Read the checklist** — find the FIRST item with `[ ]` status. If all items are `[x]` or you've hit items already done by Worker B, stop and say "Top-down worker complete."

2. **Get the Figma design** — call `get_design_context` with the node ID and file key from the checklist:
   ```
   fileKey: MICrnPV32mAQA2kxjGsooA
   nodeId: {from checklist, e.g., "4369:21880"}
   ```
   This returns code + screenshot + metadata.

3. **Also get a screenshot** separately if the design context doesn't include one, using `get_screenshot`.

4. **Resolve ALL values to literal CSS** before writing to Paper:
   - Replace `var(--color-*)` → hex values (see color table below)
   - Replace Tailwind classes → inline styles
   - Replace token names → literal values
   - Keep image URLs from Figma MCP as-is (localhost URLs work)
   - For Figma node instance IDs like "I700:1100;2000:1000", use only the last segment "2000:1000"

5. **Create artboard in Paper** matching the Figma frame dimensions:
   ```
   create_artboard({
     name: "{frame name from checklist}",
     styles: { width: "{width}px", height: "{height}px", backgroundColor: "..." }
   })
   ```

6. **Write HTML incrementally** — one visual group per `write_html` call:
   - **ONLY inline styles** (`style="..."`)
   - **NO** `var()`, Tailwind, CSS variables
   - **NO** `display: grid`, margins, or HTML tables
   - Use `display: flex` for all layout
   - All colors as hex/rgb/rgba
   - All fonts as literal family names
   - Image sources as full URLs

7. **Screenshot and verify** against the Figma original every 2-3 write_html calls. Compare layout, colors, text. Fix discrepancies.

8. **Mark done** — change `[ ]` to `[x]` in the checklist.

9. **Call `finish_working_on_nodes`**.

## Color Resolution Table

When Figma returns token references, resolve to these hex values:

| Token | Light Value | Dark Value |
|-------|-------------|------------|
| `--color-sun-yellow` | `#FCE184` | `#FCE184` |
| `--color-cream` | `#FEF8E2` | `#FEF8E2` |
| `--color-ink` | `#0F0E0C` | `#0F0E0C` |
| `--color-page` | `#FEF8E2` | `#0F0E0C` |
| `--color-inv` | `#0F0E0C` | `#0F0E0C` |
| `--color-main` | `#0F0E0C` | `#FEF8E2` |
| `--color-head` | `#0F0E0C` | `#FFFFFF` |
| `--color-flip` | `#FEF8E2` | `#FEF8E2` |
| `--color-mute` | `rgba(15,14,12,0.6)` | `rgba(254,248,226,0.6)` |
| `--color-line` | `#0F0E0C` | `rgba(254,248,226,0.2)` |
| `--color-rule` | `rgba(15,14,12,0.2)` | `rgba(254,248,226,0.12)` |
| `--color-accent` | `#FCE184` | `#FCE184` |
| `--color-sky-blue` | `#95BAD2` | `#95BAD2` |
| `--color-sunset-fuzz` | `#FCC383` | `#FCC383` |
| `--color-sun-red` | `#FF7F7F` | `#FF7F7F` |
| `--color-mint` | `#CEF5CA` | `#CEF5CA` |
| `--color-card` | `#FFFFFF` | `#000000` |
| `--color-depth` | `#FEF8E2` | `oklch(0.22 0.01 84.59)` |

## Font Resolution

| Figma Font | Paper Font |
|------------|------------|
| Joystix Monospace / Joystix | `"Joystix"` |
| Mondwest | `"Mondwest"` |
| PixelCode | `"Pixel Code"` |

## Handling Complex Figma Nodes

- **Images/photos**: Use the asset download URLs from `get_design_context`. They're localhost URLs that Paper can fetch.
- **SVG icons**: If the Figma node contains SVG icons, get the image URL from the design context.
- **Gradients**: Convert Figma gradients to CSS `linear-gradient()` or `radial-gradient()` with literal color stops.
- **Effects/shadows**: Convert to CSS `box-shadow` with literal values.
- **Blur**: Use CSS `backdrop-filter: blur(Npx)` or `filter: blur(Npx)`.
- **Masks/clips**: Use CSS `clip-path` or `overflow: hidden`.

## Quality Standard

The Paper artboard should be a faithful recreation of the Figma design:
- Same dimensions
- Same color palette
- Same text content
- Same layout structure
- Images and assets in correct positions

Minor pixel differences are acceptable. The goal is a high-fidelity reproduction, not pixel-perfect cloning.

## Important Rules
- ONE item per loop iteration
- Write HTML incrementally (never one giant blob)
- Always screenshot to verify before marking done
- If an item is already `[x]`, skip it
- If you hit items done by Worker B, stop — you've converged
