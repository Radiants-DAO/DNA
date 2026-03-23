# Paper Loop Learnings

> Shared knowledge base for all loop agents. **Read this FIRST every iteration.**
> When you hit a gotcha, workaround, or discovery, append it here so future iterations (yours and other agents') benefit.

## Format

```markdown
### [CATEGORY] Short title
**Agent**: worker-a | worker-b | reviewer
**Item**: checklist item that triggered this
**Problem**: What went wrong
**Solution**: What worked
**Rule**: One-line rule for future agents
---
```

## Categories
- `PAPER-MCP` — Paper tool behavior, quirks, limitations
- `FIGMA-MCP` — Figma tool behavior, asset handling
- `CSS` — Inline style gotchas, unsupported properties
- `FONTS` — Font rendering, availability, naming
- `IMAGES` — SVG/image loading, URLs, sizing
- `PATTERNS` — Hex bitmap conversion issues
- `LAYOUT` — Flexbox quirks, sizing, overflow
- `WORKFLOW` — Checklist management, convergence, coordination

---

## Learnings

(Agents append below this line)

### [IMAGES] Logo SVGs are NOT in packages/radiants/assets/
**Agent**: smoke-test
**Item**: Pre-launch validation
**Problem**: `packages/radiants/assets/` only contains `icons/` and 2 scrollbar SVGs. Logo SVGs (radsun, rad-mark, wordmark) live at `apps/rad-os/public/assets/logos/`.
**Solution**: Use path `apps/rad-os/public/assets/logos/{name}.svg` for logos.
**Rule**: Logos → `http://localhost:29979/media/Users/rivermassey/Desktop/dev/DNA/apps/rad-os/public/assets/logos/{name}.svg`; Icons → `http://localhost:29979/media/Users/rivermassey/Desktop/dev/DNA/packages/radiants/assets/icons/{name}.svg`
---

### [IMAGES] SVG logos load as SVG elements, not raster images
**Agent**: smoke-test
**Item**: Pre-launch validation
**Problem**: Paper imports `<img src="...svg">` as native SVG elements (Frame with SVGVisualElement children), not raster images. The `width`/`height` on the `<img>` tag may not propagate as expected.
**Solution**: Wrap SVG img in a sized container div: `<div style="width: 48px; height: 48px;"><img src="...svg" style="width: 100%; height: 100%;" /></div>`. Or use `update_styles` after insertion to resize the SVG node.
**Rule**: Always wrap SVG `<img>` tags in a sized container div to control dimensions.
---

### [PATTERNS] CSS background-image with data URI SVGs works but node gets named "Missing image"
**Agent**: smoke-test
**Item**: Pre-launch validation
**Problem**: `background-image: url('data:image/svg+xml,...')` renders the pattern visually in Paper, but the node gets auto-named "Missing image" (a Rectangle).
**Solution**: It still works visually — ignore the node name. Optionally use `rename_nodes` to fix the layer name afterward.
**Rule**: CSS background-image data URI SVGs work for patterns. Rename the node after creation if the name matters.
---

### [CSS] Paper does NOT support display: grid, margins, or HTML tables
**Agent**: smoke-test
**Item**: Pre-launch validation (from Paper docs)
**Problem**: Paper only supports flexbox layout.
**Solution**: Use `display: flex` with `flex-direction`, `gap`, `flex-wrap` for all layouts. Use padding instead of margins.
**Rule**: All layout must use `display: flex`. No grid, no margins, no tables.
---

### [FONTS] PixelCode font name in Paper is "Pixel Code" (with space)
**Agent**: smoke-test
**Item**: Pre-launch validation
**Problem**: `font-family: "PixelCode"` doesn't resolve. Paper has it registered as "Pixel Code" with a space.
**Solution**: Always use `font-family: "Pixel Code"` in Paper HTML.
**Rule**: Use `"Pixel Code"` (with space), not `"PixelCode"`, in Paper.

