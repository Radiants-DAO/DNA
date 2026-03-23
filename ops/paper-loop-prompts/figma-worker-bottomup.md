# Figma → Paper Worker B (Bottom → Up)

You recreate Figma social graphics / deck slides as artboards in Paper. You work BOTTOM-UP through the checklist.

## Setup

- **Checklist**: `{{CHECKLIST_PATH}}`
  - Social Graphics: `/Users/rivermassey/Desktop/dev/DNA/ops/paper-social-graphics-checklist.md`
  - Decks/Pitches: `/Users/rivermassey/Desktop/dev/DNA/ops/paper-decks-pitches-checklist.md`
- **Figma file key**: `MICrnPV32mAQA2kxjGsooA`
- **Paper page**: `{{PAGE_NAME}}`
- **Direction**: Start from the LAST item, work upward

## Each Iteration

1. **Read the checklist** — find the LAST item with `[ ]` status. If all items are `[x]` or you've hit items already done by Worker A, stop and say "Bottom-up worker complete."

2. **Get the Figma design** — call `get_design_context`:
   ```
   fileKey: MICrnPV32mAQA2kxjGsooA
   nodeId: {from checklist}
   ```

3. **Get screenshot** if not included in design context.

4. **Resolve ALL values to literal CSS** (see color/font tables below).

5. **Create artboard in Paper** matching Figma frame dimensions.

6. **Write HTML incrementally** — one visual group per `write_html` call:
   - **ONLY inline styles** — NO `var()`, NO Tailwind, NO CSS variables
   - **NO** `display: grid`, margins, tables
   - Use `display: flex` for all layout
   - All colors as hex/rgb/rgba
   - Image sources as full URLs from Figma MCP

7. **Screenshot and verify** every 2-3 calls.

8. **Mark done** — change `[ ]` to `[x]`.

9. **Call `finish_working_on_nodes`**.

## Color Resolution Table

| Token | Light | Dark |
|-------|-------|------|
| `--color-sun-yellow` | `#FCE184` | `#FCE184` |
| `--color-cream` | `#FEF8E2` | `#FEF8E2` |
| `--color-ink` | `#0F0E0C` | `#0F0E0C` |
| `--color-page` | `#FEF8E2` | `#0F0E0C` |
| `--color-inv` | `#0F0E0C` | `#0F0E0C` |
| `--color-main` | `#0F0E0C` | `#FEF8E2` |
| `--color-flip` | `#FEF8E2` | `#FEF8E2` |
| `--color-mute` | `rgba(15,14,12,0.6)` | `rgba(254,248,226,0.6)` |
| `--color-line` | `#0F0E0C` | `rgba(254,248,226,0.2)` |
| `--color-rule` | `rgba(15,14,12,0.2)` | `rgba(254,248,226,0.12)` |
| `--color-accent` | `#FCE184` | `#FCE184` |
| `--color-sky-blue` | `#95BAD2` | `#95BAD2` |
| `--color-sunset-fuzz` | `#FCC383` | `#FCC383` |
| `--color-sun-red` | `#FF7F7F` | `#FF7F7F` |
| `--color-mint` | `#CEF5CA` | `#CEF5CA` |

## Font Resolution

| Figma | Paper |
|-------|-------|
| Joystix Monospace | `"Joystix"` |
| Mondwest | `"Mondwest"` |
| PixelCode | `"Pixel Code"` |

## Important Rules
- ONE item per loop iteration (start from bottom)
- Write HTML incrementally
- Screenshot to verify before marking done
- Skip `[x]` items
- Stop when you hit items Worker A already completed
