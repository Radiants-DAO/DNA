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

### [IMAGES] SVG img inside a wrapper div may not load — use direct img or replace the empty wrapper
**Agent**: worker-1.1
**Item**: 1.1 RadSun logo — cream on ink
**Problem**: `<div style="width:220px;height:220px"><img src="...svg" style="width:100%;height:100%" /></div>` rendered the outer div at correct size but the img produced an empty child Frame with 0 children. The SVG paths were not imported.
**Solution**: Use `replace` mode on the empty inner Frame with a direct `<img src="...svg" style="width:220px;height:220px" />` (no wrapper div). Paper then correctly imported the SVG with all its path children.
**Rule**: When an SVG img inside a wrapper div loads empty, replace the empty node with a bare `<img>` tag using `replace` mode. Avoid nesting `<img>` inside a sized `<div>` for SVGs — use direct `<img>` with explicit width/height instead.
---

### [CSS] Inline SVG elements render well in Paper for curve visualizations
**Agent**: worker-9.2
**Item**: 9.2 Easing curves reference
**Problem**: Needed to visually represent cubic-bezier curves without animation support. Considered using background-image data URIs but wanted cleaner layer names.
**Solution**: Inline `<svg>` with `<path>` elements using cubic bezier `C` commands renders cleanly in Paper. The SVG becomes a proper SVG node in the layer tree. Control points in the SVG `C` command map directly from the cubic-bezier values: for `cubic-bezier(x1, y1, x2, y2)`, use `C (x1*w) (h - y1*h) (x2*w) (h - y2*h) w 0` where w/h are the viewBox dimensions and the curve goes from bottom-left (0, h) to top-right (w, 0).
**Rule**: Use inline SVG `<path>` with cubic bezier `C` commands for static curve visualizations in Paper. They render as proper SVG nodes with clean layer names.
---

### [IMAGES] Figma MCP asset URLs don't load in Paper — use inline SVG or local files
**Agent**: worker-a
**Item**: #1 Slide 16:9 - 16 (Radiants pixel logo, light bg)
**Problem**: Both `<img src="https://www.figma.com/api/mcp/asset/...">` and local `<img src="http://localhost:29979/media/.../wordmark-black.svg">` failed to render the SVG logo in Paper. The container div appeared but the image was invisible/empty.
**Solution**: Embed the SVG content directly inline in the HTML: `<svg viewBox="..." width="..." height="..."><path ... /></svg>`. Paper parsed each path correctly and the logo rendered perfectly.
**Rule**: For SVG logos, prefer inline `<svg>` with `<path>` elements over `<img>` tags. Figma asset URLs are not accessible from Paper.
---

### [WORKFLOW] Checklist duration values don't match codebase tokens
**Agent**: worker-9.1
**Item**: 9.1 Duration scale reference
**Problem**: The checklist listed durations as "75ms, 100ms, 150ms, 200ms, 300ms" but `packages/radiants/tokens.css` defines `--duration-instant: 0ms` (not 75ms), `--duration-fast: 100ms`, `--duration-base: 150ms`, `--duration-moderate: 200ms`, `--duration-slow: 300ms`. There is no 75ms token in the codebase.
**Solution**: Used actual codebase values from `tokens.css` as the source of truth. Updated checklist item to reflect the real values.
**Rule**: Always cross-reference checklist descriptions against the actual codebase (`tokens.css`, `animations.css`). The codebase is the source of truth, not the checklist description.
---

### [LAYOUT] Figma translate-y/x 50% positioning — compute actual top/left manually for Paper
**Agent**: worker-a
**Item**: #2 11432 (1080x1080 "burn event!" social graphic)
**Problem**: Figma code uses `-translate-y-1/2` and `top: calc(50%+Npx)` for centered positioning. Paper does not support CSS `transform: translate()` or `calc()` in position offsets.
**Solution**: Pre-compute the actual pixel positions. For `-translate-y-1/2` with a known element height, actual top = specified_top - (element_height / 2). For `left: calc(50% - Npx)`, actual left = (canvas_width / 2) - N. Do all math before passing to Paper.
**Rule**: Always resolve Figma `calc()` and `translate` positioning to absolute pixel values before writing to Paper.
---

### [IMAGES] Figma raster assets (PNG ticket art, background images) load via two-step approach
**Agent**: worker-a
**Item**: #2 11432 (1080x1080 "burn event!" social graphic)
**Problem**: The ticket asset (pixel art stub with dashed borders) and background Latin text image were served as PNG from Figma MCP asset URLs.
**Solution**: Download PNGs with curl to `/private/tmp/claude-501/`, create a container div first via `write_html`, then insert `<img>` into it with a second `write_html` call. Reference via `http://localhost:29979/media/private/tmp/claude-501/{filename}`. Box-shadow glow on the container div renders correctly.
**Rule**: For raster Figma assets: download locally, create container div first, insert img second. Box-shadow glow effects work on the container.
---

### [PATTERNS] Pixel-art shapes with glow: use absolute-positioned divs with box-shadow
**Agent**: worker-b
**Item**: #87 Frame 2085660717 (dual pixel icons on dark panels)
**Problem**: Needed to recreate pixel-art cross and hamburger icons made of many small cream squares (~25px and ~73px) with a golden glow effect on dark backgrounds. The Figma export showed dozens of individual squares with absolute positions.
**Solution**: Use absolute-positioned divs for each pixel square with `background-color: #FEF8E2` and `box-shadow: 0px 0px 20px #FCE184, 0px 0px 50px rgba(252,225,132,0.4)` for the glow. Group them inside a positioned container. The combined box-shadows from adjacent squares create a natural merged glow effect matching the Figma design.
**Rule**: For pixel-art shapes with glow effects, use individual absolute-positioned divs with box-shadow. Adjacent squares' shadows merge naturally to create the correct glow halo.
---

### [IMAGES] Inline SVG confirmed best approach for pixel logos in Paper
**Agent**: worker-a
**Item**: #2 Slide 16:9 - 18 (Radiants pixel logo, light bg, "Be Kind, Make Rad Shit.")
**Problem**: Previous learnings already established that Figma asset URLs and local img-src SVGs fail in Paper.
**Solution**: Reading the SVG file from disk (`wordmark-black.svg`) and embedding paths directly in `<svg>` worked perfectly on first try. The wordmark-black.svg (940x130 viewBox) contains the full RADIANTS wordmark with sun icon and border box.
**Rule**: For the Radiants wordmark logo, use `wordmark-black.svg` (940x130) which includes the full boxed wordmark + sun icon. Embed inline — no img tag needed.
---

### [IMAGES] Figma asset URLs must be downloaded locally, SVGs need var() resolved before Paper can use them
**Agent**: worker-b
**Item**: #33 Frame 1272628807 ("Solution? WAYY")
**Problem**: Figma MCP asset URLs (`https://www.figma.com/api/mcp/asset/...`) don't load in Paper. Downloaded assets locally, but SVG files contained `var(--fill-0, #0F0E0C)` and `var(--stroke-0, #0F0E0C)` references which Paper can't resolve.
**Solution**: Download assets with curl, rename SVGs (Figma serves them with wrong extension), sed-replace `var()` references with literal hex colors, then copy to project directory for Paper's localhost media server.
**Rule**: Download Figma assets locally, fix SVG `var()` references to literal colors, save to project dir, and use `http://localhost:29979/media/Users/rivermassey/Desktop/dev/DNA/ops/paper-assets/{name}` path.
---

### [PAPER-MCP] img inside div doesn't render in single write_html call — use two-step approach
**Agent**: worker-b
**Item**: #33 Frame 1272628807 ("Solution? WAYY")
**Problem**: `<div style="..."><img src="..." /></div>` in a single `write_html` call creates the container div but drops the img child entirely (childCount: 0). This affects both SVG and PNG images nested inside divs.
**Solution**: Create the container div first with `write_html(insert-children)`, then call `write_html(insert-children)` again on the container node ID with just the bare `<img>` tag. The img then renders correctly as a child.
**Rule**: Never nest `<img>` inside a `<div>` in a single `write_html` call. Always create the container first, then insert the image into it with a second `write_html` call.
---

### [IMAGES] wordmark-cream.svg works perfectly for dark bg slides with inline SVG
**Agent**: worker-a
**Item**: #3 Slide 16:9 - 1 (dark bg, glowing pixel logo)
**Problem**: Needed cream-colored Radiants wordmark on dark (#0F0E0C) background.
**Solution**: Read `apps/rad-os/public/assets/logos/wordmark-cream.svg` (940x130 viewBox, all paths fill="#FEF8E2") and embedded directly as inline `<svg>` in Paper HTML. Rendered perfectly on first try.
**Rule**: For dark bg slides, use `wordmark-cream.svg` with inline SVG embedding. The SVG has 940x130 viewBox and includes the full boxed wordmark + sun icon, all in cream (#FEF8E2).
---

### [LAYOUT] Table layouts with borders work well using nested flex containers
**Agent**: worker-b
**Item**: #88 Frame 2085660718 (Stages of Immutability on Solana)
**Problem**: Needed to recreate a bordered data table (3 cols x 3 rows) with yellow borders in Paper, which doesn't support CSS grid or HTML tables.
**Solution**: Use a flex-column outer container with `border: 2px solid #color`, then flex-row children for each row with `border-bottom` for horizontal dividers. Each cell is a flex item with `border-right` for vertical dividers. The last cell in each row uses `flex: 1` instead of fixed width to fill remaining space without an extra right border.
**Rule**: For bordered tables in Paper, nest flex-row divs inside a flex-column container. Use border-bottom on rows and border-right on cells (skip the last cell's right border by using `flex: 1`).
---

### [LAYOUT] Artboard clips absolutely-positioned children in nested wrapper divs
**Agent**: worker-b
**Item**: #33 Frame 1272628807 ("Solution? WAYY")
**Problem**: Created a full-width/height wrapper `<div>` inside the artboard and placed all absolutely-positioned children inside it. Even after setting the wrapper to 1920x1080, images and SVGs were invisible in the artboard screenshot despite rendering correctly when screenshotted individually.
**Solution**: Place all absolutely-positioned elements directly as children of the artboard (no intermediate wrapper div). SVG imgs should use bare `<img>` tags directly on the artboard. PNG images need the two-step approach (container div first, then img insert).
**Rule**: For slide-style artboards, place all elements directly as children of the artboard — avoid intermediate wrapper divs for absolute-positioned layouts.
---

### [CSS] text-shadow glow effect works in Paper for neon/glowing text
**Agent**: worker-a
**Item**: #4 Slide 16:9 - 49 ("The Radiator")
**Problem**: Needed to recreate a glowing cream text effect with golden glow halo on dark background.
**Solution**: CSS `text-shadow` with multiple layers works in Paper: `text-shadow: 0px 0px 13px #fce696, 0px 0px 110px #fce696;` produces the correct inner glow + outer halo effect matching the Figma design.
**Rule**: Use multi-layer `text-shadow` for glow effects in Paper. Both tight (13px) and wide (110px) spread values render correctly.
---

### [FONTS] Coolvetica font is not available in Paper — use Nunito as substitute
**Agent**: worker-b
**Item**: #31 Frame 1272628805 ("H4ckerhouse 2026" WAYY cover variant)
**Problem**: Figma design uses `Coolvetica:Italic` and `Coolvetica:Condensed` font families. Neither `Coolvetica`, `Coolvetica Condensed`, nor `Coolvetica Rg` are available in Paper (not on Google Fonts or locally installed).
**Solution**: Substitute with `Nunito` (Google Font) which has similar rounded sans-serif character and full italic + weight support (200-900, all with italic variants). Use `font-weight: 700; font-style: italic` for Coolvetica Italic bold headings.
**Rule**: When Figma uses Coolvetica, substitute with Nunito in Paper. Nunito has italic variants; Comfortaa and Quicksand do not.
---

### [IMAGES] SVG filters (feMorphology glow) render in Paper inline SVGs but viewBox must be padded
**Agent**: worker-a
**Item**: #1 11431 (1080x1080 "new additions!" social graphic)
**Problem**: SVG `<filter>` with `feMorphology` + `feGaussianBlur` for golden glow renders in Paper, but the glow bleeds outside the viewBox and gets clipped. The filter effect is visually correct but needs extra padding in the viewBox to accommodate the glow spread.
**Solution**: Expand the SVG viewBox by the glow radius (e.g., `-65 -65 577 577` instead of `0 0 447 447`) and match the filter region accordingly. This prevents clipping while keeping the paths at the correct position.
**Rule**: When using SVG filters with large blur/morphology radii in Paper, pad the viewBox and filter region by at least the blur stdDeviation to prevent glow clipping.
---

### [FIGMA-MCP] Figma SVG fill colors may not match visual appearance — verify against screenshot
**Agent**: worker-b
**Item**: #32 Frame 1272628806 ("the Problem?")
**Problem**: Figma exported an SVG speech bubble shape with `fill="#0F0E0C"` (solid black) and the text on top had `color: var(--black, #0f0e0c)`. But the Figma screenshot clearly showed the speech bubble as an outlined/bordered box with yellow fill and dark text visible inside. Using the exported fill literally created an opaque black rectangle that hid all text.
**Solution**: Compare the exported SVG against the Figma screenshot. The speech bubble needed `fill="#FCE184"` (matching the artboard yellow bg) with a dark stroke border instead of a solid dark fill. Always trust the visual screenshot over the raw code export when there's a discrepancy.
**Rule**: When Figma exports a shape with a dark fill but the screenshot shows it as an outlined box, change the fill to match the background color and keep only the stroke as dark. Screenshot is the source of truth, not the exported code.
---

### [IMAGES] Raster background images load via localhost media path in Paper
**Agent**: worker-a
**Item**: #1 11431 (1080x1080 "new additions!" social graphic)
**Problem**: Needed to display a large raster background image (Latin text texture) downloaded from Figma. Figma asset URLs are not accessible from Paper.
**Solution**: Download the image with curl to `/private/tmp/claude-501/`, then reference it via `http://localhost:29979/media/private/tmp/claude-501/{filename}`. The image loaded correctly as a child `<img>` inside a container div. PNG files from Figma work fine despite the `.jpg` extension used during download.
**Rule**: Downloaded raster images can be served from `/private/tmp/claude-501/` via Paper's localhost media server. Check `file` command output for actual format (Figma may serve PNG regardless of requested extension).
---

### [IMAGES] Figma asset downloads may have wrong extensions — always use `file` command to check
**Agent**: worker-b
**Item**: #30 WAYY /PITCHDECK-8 (closing slide, loading ducks)
**Problem**: Figma MCP asset URLs for SVGs sometimes serve PNG data (e.g., the WAYY pixelmark was labeled `.svg` but `file` revealed `PNG image data`). Similarly, assets labeled as `.png` were actually SVGs (the loading bar rectangle). This caused rendering issues when Paper expected one format but got another.
**Solution**: After downloading any Figma asset, run `file /path/to/asset` to check the actual format. Rename extensions to match the real format before using in Paper.
**Rule**: Always verify downloaded Figma asset formats with `file` command and rename extensions to match actual content type (PNG, SVG, JPEG).
---

### [IMAGES] Full-frame raster background as single PNG avoids complex compositing
**Agent**: worker-b
**Item**: #86 Frame 2085660711 (1080x1440 "Solana's best Tools and Apps")
**Problem**: Previous attempt failed with image processing API error. The frame has a complex collage (retro computer, browser windows, search bar, "Saas" bubble) composited onto a textured yellow background, with text overlays on top.
**Solution**: Download the entire background layer (node covering full 1080x1440) as a single raster PNG from Figma. This PNG already contains the full composited collage. Then overlay text elements (title, bottom labels) and small icons (logo SVG, gear PNG) as separate absolute-positioned elements on top. Avoids needing to reconstruct the complex collage piece by piece.
**Rule**: When a Figma frame has a complex raster collage as its background, export the entire background layer as one PNG rather than trying to reconstruct individual elements. Overlay text and vector icons separately.
---

### [LAYOUT] Figma percentage insets with overflow SVG — pre-compute absolute pixel positions
**Agent**: worker-a
**Item**: #3 11433 (1080x1080 "Phase Labs" social graphic)
**Problem**: Figma code used percentage-based insets (e.g., `inset: 27.13% 39.66% 52.26% 39.66%`) for a container, then negative percentage insets on the child SVG (e.g., `inset: -58.4% -58.22%`) to extend the SVG beyond its container for glow effects. Paper doesn't support CSS `inset` or percentage-based negative offsets.
**Solution**: Pre-compute all positions to absolute pixel values: multiply percentages by the 1080px canvas size to get the container bounds, then compute the SVG overflow extension (negative % of container height/width) and derive final `left`, `top`, `width`, `height` in pixels.
**Rule**: For Figma designs using nested percentage insets with overflow, resolve to absolute pixel values before writing to Paper. Calculate: container bounds from canvas percentages, then SVG bounds from container percentages.
---

### [CSS] Box-shadow on square containers creates rectangular glow — not suitable for icon glow
**Agent**: worker-a
**Item**: #4 11434 (1080x1080 "not just about NFTs" social graphic)
**Problem**: Figma RadSun icon had a large feMorphology+feGaussianBlur glow filter. Tried box-shadow on the container div but it produced a rectangular halo around the square frame, not a radial glow around the icon shape.
**Solution**: For subtle icon glows on busy dark backgrounds, the glow effect is often imperceptible and can be safely omitted. A radial-gradient background div placed behind the icon works better than box-shadow for a soft circular glow, though it's also very subtle on dark backgrounds.
**Rule**: Don't use box-shadow on square containers for icon glow effects — it creates rectangular halos. Use radial-gradient background divs for circular glow, or skip the glow if the background is busy enough to mask it.
---

### [LAYOUT] Tall multi-section artboards: use flex-direction column with gap on the artboard itself
**Agent**: worker-a
**Item**: #6 be kind make rad shit (1920x4854 tall brand art page)
**Problem**: A tall artboard containing 4 stacked 1920x1080 sections with 178px gaps between them. Initially created the artboard without gap, making sections appear flush together.
**Solution**: Set `gap: 178px` on the artboard via `update_styles` after creation. Each section is a flex-shrink: 0 child with explicit 1920x1080 dimensions. Total height: (4 * 1080) + (3 * 178) = 4854px matches the artboard height exactly.
**Rule**: For tall multi-section artboards, calculate the gap from (total_height - n_sections * section_height) / (n_sections - 1) and set it on the artboard's flex column layout.
---

### [LAYOUT] Multi-part vector logos: compose SVG paths in a single inline SVG with transform offsets
**Agent**: worker-a
**Item**: #5 11435 (1080x1080 "ALIGN by Phase Labs" social graphic)
**Problem**: Figma exports a multi-part logo (geometric "A" made of 4 overlapping triangle/trapezoid shapes) as separate vector images with percentage-based inset positioning. Downloading and placing each SVG separately is tedious and fragile.
**Solution**: Download all SVG pieces, extract the `<path>` elements, then compose them into a single `<svg>` with `<g transform="translate(x, y)">` wrappers. Compute pixel offsets from the Figma inset percentages: `left = leftInset% * containerWidth`, `top = topInset% * containerHeight`. The SVG viewBox should match the container dimensions.
**Rule**: For multi-part vector logos, compose all paths into one inline SVG with translate transforms rather than placing individual SVG images.
---

### [CSS] Box-shadow on transparent frames creates visible dark rectangle — use radial-gradient for ambient glow
**Agent**: worker-a
**Item**: #5 11435 (1080x1080 "ALIGN by Phase Labs" social graphic)
**Problem**: Applying `box-shadow: 0px 0px 110px #fce696, 0px 0px 13px #fce696` to a transparent frame container creates a visible dark rectangle outline in Paper, not a soft ambient glow around the content inside.
**Solution**: Remove box-shadow from the container. Instead, place a separate div behind the content with `background: radial-gradient(ellipse at center, rgba(252,230,150,0.25) 0%, transparent 70%)` to simulate the ambient glow effect.
**Rule**: For ambient glow behind transparent vector content, use a radial-gradient background div behind the content instead of box-shadow on the container.
---

### [LAYOUT] Complex dashboard UIs: build panel-by-panel with flex columns, not as raster export
**Agent**: worker-b
**Item**: #29 WAYY /PITCHDECK-7 ("EVERYTHING YOU NEED AS A CREATOR ON-CHAIN" dashboard UI)
**Problem**: Dashboard frame (1184x916) contains 5+ panels with dozens of nested notification rows, avatar images, icons, tab bars, and pagination. Exporting as a single raster image was attempted but Figma MCP doesn't provide direct raster export for arbitrary nodes. Trying to get full code export exceeded context limits (130K+ chars).
**Solution**: Build the dashboard container as a flex-column parent, then add a flex-row content area with 3 columns (left/middle/right). Each panel is a flex-column with border, header row (icon + title), divider line, and notification rows. Avatar images are simplified as colored rectangles. Notification rows follow a consistent pattern: icon + avatar + text column + timestamp. Pagination footers use PREV/1/4/NEXT pattern. Building one row at a time keeps each write_html call small.
**Rule**: For complex multi-panel dashboard UIs, build the structure panel-by-panel using flex columns and rows. Simplify avatar images as colored rectangles. Use consistent row patterns (icon + avatar + text + timestamp) to efficiently build many rows.
---

### [CSS] Rotated axis labels — use inline SVG text with transform instead of CSS rotation
**Agent**: worker-b
**Item**: #84 Frame 2085660698 ("The Lindy Effect" chart)
**Problem**: Paper does not support CSS `transform: rotate(-90deg)` for vertically rotated text labels (e.g., Y-axis labels on a chart). The Figma design had "LIFE EXPECTANCY/VALUE" rotated -90 degrees along the left side.
**Solution**: Use an inline `<svg>` element with `<text transform="rotate(-90, cx, cy)">` to render the rotated text. The SVG text element supports the `transform` attribute natively, and Paper renders SVG text with correct font rendering including custom fonts like Joystix.
**Rule**: For rotated text labels in Paper, use inline SVG `<text transform="rotate(...)">` instead of CSS rotation. Paper renders SVG text transforms correctly.
---

### [LAYOUT] Alternating dark/light sections: use artboard bg as separator color
**Agent**: worker-a
**Item**: #6 be kind make rad shit (1920x4854 tall brand art page)
**Problem**: Artboard had `gap: 178px` with `backgroundColor: #FCE184` (yellow), making separator bands between sections yellow. The Figma design has dark (#0F0E0C) separator bands between alternating light/dark sections. Section 3 was also missing its dark background -- it had yellow bg instead of dark.
**Solution**: Changed artboard `backgroundColor` to `#0F0E0C` so the 178px gaps render as dark separator bands. Each yellow section already had its own explicit `backgroundColor: #FCE184`, so they remained yellow. For Section 3 (dark): changed section bg to `#0F0E0C`, changed BG Texture rectangle to dark, replaced black wordmark SVG with cream one (`wordmark-cream.svg` paths), and changed tagline text color to `#FEF8E2`.
**Rule**: For alternating light/dark section artboards with separator bands, set the artboard bg to the separator color. Each section must have its own explicit background color. Use `update_styles` to flip bg colors and `replace` mode to swap SVG logos between color variants.
---

### [CSS] white-space: pre-wrap preserves paragraph breaks in multi-paragraph text blocks
**Agent**: worker-a
**Item**: #8 Slide 16:9 - 3 ("Creating Substance")
**Problem**: A text block with three paragraphs separated by blank lines rendered as a single run-on block in Paper when using a regular div. The newline characters between paragraphs were collapsed.
**Solution**: Add `white-space: pre-wrap` to the text container style. This preserves the literal newline characters in the HTML content while still wrapping text within the width constraint. Paragraph breaks render correctly as visible blank lines.
**Rule**: For multi-paragraph body text in Paper, use `white-space: pre-wrap` on the text element to preserve paragraph breaks (blank lines between paragraphs).
---

### [LAYOUT] Complex slide with overlapping text and phone mockup — build incrementally, accept z-order layering
**Agent**: worker
**Item**: #26 WAYY /PITCHDECK-4 ("IT'S YOUR WEB3 ART RESUME")
**Problem**: The Figma design has large heading text intentionally overlapping with a mobile app mockup (phone window). In Paper, elements created later appear on top. The heading text was created before the phone, so the phone covered parts of the text ("IT'S" partially hidden).
**Solution**: Accept the overlap as close-enough to the Figma intent. To get exact z-ordering, create elements in the desired stacking order (background first, then phone, then text last). Alternatively, delete and re-create text elements after other layers are placed.
**Rule**: When a slide has intentional text-over-UI overlap, create text elements AFTER the underlying UI elements to ensure correct z-ordering in Paper.
---

### [IMAGES] Large gallery/collage images — download as single PNG from Figma, insert via two-step container approach
**Agent**: worker
**Item**: #26 WAYY /PITCHDECK-4 (3x3 art gallery grid)
**Problem**: The gallery grid on the right side of the slide contains 9+ art images with labels, badges, and overlays composited together. Rebuilding each cell individually would be extremely tedious.
**Solution**: Downloaded the entire gallery node as a single PNG (2178x2202px) from Figma MCP, then placed it in a sized container (663x670px) in Paper. The PNG already contained the full composited grid with all labels and overlays. Two-step: create container div first, insert img second.
**Rule**: For composited grid/gallery images with many sub-elements, export the entire container as one PNG. Much faster than reconstructing each grid cell.
---

### [IMAGES] Complex radial wheel graphics: download SVG asset, fix var() refs, embed via img tag
**Agent**: worker-a
**Item**: #6 11436 (1080x1080 "burn NFTs" roulette wheel social graphic)
**Problem**: The design featured a complex radial wheel made of many wedge-shaped paths with alternating gold/dark fills. Rebuilding this from individual paths would be extremely tedious. The Figma MCP exported the wheel as a single SVG asset with var() references.
**Solution**: Download the SVG asset, use sed to replace all `var(--fill-0, #HEX)` and `var(--stroke-0, #HEX)` patterns with their literal fallback hex values, then load via img tag into a sized container in Paper. The SVG rendered with all paths correctly.
**Rule**: For complex vector compositions (wheels, patterns, multi-path logos), download as SVG, fix var() refs with sed, and load via img in Paper. Much faster than reconstructing individual paths.
---

### [LAYOUT] Figma rotated elements with translate centering: pre-compute final absolute positions
**Agent**: worker-7
**Item**: #7 11437 (1080x1080 "NETRUNNER" social graphic)
**Problem**: Figma code used `-translate-x-1/2` + `left: 50%` for horizontal centering and `-translate-y-1/2` for vertical centering of text. Also used `-rotate-90` for a decorative line element. Paper doesn't support CSS transforms.
**Solution**: Pre-compute positions: for `left: calc(50% - Npx)` with `-translate-x-1/2`, the text left = canvasWidth/2 - N. For `-translate-y-1/2`, actual top = specified_top - elementHeight/2. For rotated decorative lines, recreate the visual effect with an inline SVG oriented correctly (vertical line with diamond) rather than rotating a horizontal element.
**Rule**: For Figma elements using translate centering + rotation, compute the final pixel positions manually and recreate rotated graphics as correctly-oriented inline SVGs.
---

### [IMAGES] Figma images with overflow clipping: use container with overflow hidden + oversized img
**Agent**: worker-10
**Item**: #10 Slide 16:9 - 5 ("The cNFT Gallows")
**Problem**: Figma exported an image (merkle tree + NFT thumbnails) with the img scaled larger than its container (165.1% height, slight negative top offset). The container clips the visible portion. Paper needs this reproduced with absolute pixel values since it doesn't support percentage-based img sizing within clipped containers.
**Solution**: Create a container div with `overflow: hidden` at the clipped dimensions (375x374px), then insert the img with computed pixel dimensions (375x618px) and absolute position offset (top: -22px). The container clips correctly, showing only the intended portion of the larger image.
**Rule**: For Figma images with overflow clipping, create an overflow-hidden container at the visible size, then position the oversized img with absolute pixel offsets inside it.
---

### [LAYOUT] Complex dual-phone mockup slides: build simplified HTML recreations instead of raster exports
**Agent**: worker-27
**Item**: #27 WAYY /PITCHDECK-5 ("SELECT YOUR PROFILE TYPE" -- Collector vs Creator UI)
**Problem**: The slide contains two deeply nested phone mockups (Collector and Creator profiles) with 200+ Figma nodes each, including dozens of image thumbnails, nested frames, timeline elements, and pixel-art social icons. Figma MCP asset URLs don't load in Paper, making raster export of individual images impossible. Exporting the full phone as a single raster also failed since Figma MCP doesn't support arbitrary node raster export.
**Solution**: Build simplified but faithful HTML recreations of each phone mockup using Paper's flex layout. Use colored placeholder rectangles for NFT thumbnail grids (matching approximate colors from the Figma screenshot). Build the profile sections, tags, stats, progress bars, and timeline cards as nested flex containers with the correct typography (Joystix for UI, Mondwest for body text). Social icons rendered as inline SVGs. Both phones clipped at the 1080px viewport boundary naturally via the artboard.
**Rule**: For slides containing complex app UI mockups with many images, build simplified HTML recreations with colored placeholder rectangles for images. Focus on matching the structural layout, typography, and UI chrome (borders, shadows, tags) rather than pixel-perfect image content.
---

### [FONTS] Joystix font renders at 30px but clips in 34px height containers
**Agent**: worker-27
**Item**: #27 WAYY /PITCHDECK-5 (Creator phone "WAYY" title bar)
**Problem**: The "WAYY" text at font-size 30px in a 34px-height container with border was being clipped/truncated. The Joystix font has tall ascenders/descenders that exceed the line-height expectations.
**Solution**: Reduce font-size slightly (26px) or set overflow:visible on the container. The Joystix pixel font needs more vertical breathing room than the raw font-size suggests.
**Rule**: When Joystix text at large sizes (24px+) is clipped in tight containers, either reduce font-size or set overflow:visible. Joystix needs ~15% more vertical space than its font-size value.
---

### [IMAGES] Hub-and-spoke diagrams with many vector lines: use single inline SVG with <line> elements
**Agent**: worker-11
**Item**: #11 Slide 16:9 - 6 ("Seizing the Market" ecosystem diagram)
**Problem**: Figma exported 13 separate vector SVG assets for the radiating lines in a hub-and-spoke diagram. Each was a simple straight line from point A to point B, but with complex CSS transforms (rotate-180, -scale-y-100) making it tedious to compute actual positions from individual SVGs.
**Solution**: Instead of downloading and placing 13 individual SVG images, extract the endpoint dot positions from the Figma code (small glowing squares at each line terminus) and the common center point. Create a single inline `<svg>` overlay at artboard size (1920x1080) with `<line>` elements from center to each dot center. The lines render perfectly as 1px stroked golden (#FCE184) paths.
**Rule**: For hub-and-spoke or radial line diagrams, skip individual vector SVG downloads. Instead, identify the center point and endpoint positions from the Figma code, then compose all lines in a single inline SVG with `<line>` elements. Much faster and more maintainable than handling individual rotated/scaled vector assets.
---

### [IMAGES] Mirrored/flipped SVG arcs: redraw the path instead of CSS transforms
**Agent**: worker-25
**Item**: #25 WAYY /PITCHDECK-3 ("Solution? WAYY: The On-Chain Artfolio Platform")
**Problem**: Figma code used `-scale-y-100 rotate-180` on an SVG arc path to create a mirrored version. Paper does not support CSS transforms on SVG elements.
**Solution**: Instead of downloading the SVG and trying to apply transforms, redraw the path with the mirrored coordinates directly. For an arc going left-to-bottom (`M right H left C left bottom`), the mirrored version goes right-to-bottom (`M left H right C right bottom`). Just swap the x-coordinates in the SVG path commands.
**Rule**: When Figma uses CSS transforms (rotate, scale) on SVG elements, don't download the SVG and try to transform it. Redraw the path with mirrored/rotated coordinates directly in inline SVG.
---

### [IMAGES] Card background images with text variations: overlay dark rects + corrected text
**Agent**: worker-8
**Item**: #8 11438 (1080x1080 "RADIANT 022" burn UI social graphic)
**Problem**: The Figma card_bg image (browser window with NFT burn UI) contained a different text version ("CURRENT SACRIFICE") than the target design ("SELECT TO BURN" / "CURRENT TICKETS"). The Figma code uses many dark background rectangles and text overlays to patch the differences.
**Solution**: Keep the card_bg image as-is for the base UI chrome (browser bar, navigation, layout structure). Overlay dark background rectangles at exact Figma positions to cover incorrect text, then place the correct text on top. This is much faster than rebuilding the entire card UI from scratch.
**Rule**: When a Figma design uses a background image with text overlay corrections, apply the dark masking rects and corrected text overlays on top rather than rebuilding the base UI.
---

### [IMAGES] Complex decorative pipe SVGs with var() references: batch sed-replace and use sized containers
**Agent**: worker-24
**Item**: #24 WAYY /PITCHDECK-2 ("the Problem?" slide)
**Problem**: Slide had 7+ decorative SVG pipe/curve elements, each downloaded from Figma with `var(--fill-0, #HEX)` and `var(--stroke-0, #HEX)` references. Processing them individually would be slow.
**Solution**: Batch sed-replace all var() references in a shell loop: `for f in *.svg; do sed -e 's/var(--fill-0, #0F0E0C)/#0F0E0C/g' ... "$f" > "output/$f"; done`. Place each SVG in a sized absolute-positioned container div matching Figma coordinates. SVGs with `preserveAspectRatio="none"` stretch to fill their container correctly.
**Rule**: For slides with many decorative SVGs, batch-process var() fixes with a shell loop. SVGs with `preserveAspectRatio="none"` stretch to match their container dimensions, making positioned containers a reliable approach.
---

### [CSS] SVG filter drop shadows render in Paper but are subtle
**Agent**: worker-24
**Item**: #24 WAYY /PITCHDECK-2 (speech bubble with 2px drop shadow filter)
**Problem**: The speech bubble SVG included an SVG `<filter>` with `feOffset dx=2 dy=2` for a subtle drop shadow. Wasn't sure if SVG filters would render in Paper.
**Solution**: The SVG filter rendered correctly in Paper — the 2px offset drop shadow appeared as expected. No extra CSS box-shadow needed when the SVG already contains its own filter definition.
**Rule**: SVG `<filter>` elements (feOffset, feColorMatrix, feBlend) render in Paper. Keep the original SVG filter for subtle drop shadow effects rather than adding redundant CSS box-shadow.
---

### [FIGMA-MCP] When Figma MCP rate limit is hit, replicate from existing Paper slides as style reference
**Agent**: worker-16
**Item**: #16 Slide 16:9 - 50 ("NFT Projects Aren't Reflexive")
**Problem**: Both `get_design_context` and `get_screenshot` returned rate-limit errors. Could not access the original Figma design for this slide.
**Solution**: Used `get_jsx` and `get_screenshot` on existing completed Paper slides in the same deck section (Slide 16:9 - 2, Slide 16:9 - 3, Slide 16:9 - 4) to extract exact positioning, font sizes, colors, and layout patterns. Built the new slide following the identical pattern: title at (158, 197), subtitle at (158, 374), bullets at (158, 433), same fonts/sizes/colors/glow.
**Rule**: When Figma MCP is rate-limited, use existing completed Paper slides as style templates. Get JSX from a sibling slide to extract exact positioning and style values.
---

### [LAYOUT] Multi-card slide with translate centering: pre-compute absolute positions, use flex-column inside cards
**Agent**: worker-12
**Item**: #12 Slide 16:9 - 7 ("Creating Value, Creating Revenue")
**Problem**: Figma code uses `-translate-x-1/2 -translate-y-1/2` centering on text elements and `calc(50% +/- N)` for top positioning. Cards have absolute positions with backdrop-blur, dividers as separate SVG vector lines, and body text using Saira font at font-weight normal with `fontVariationSettings`.
**Solution**: For centered text, compute actual top = (540 +/- offset) - (elementHeight / 2). For the three equal cards, use absolute positioning at exact Figma left/top values. Inside each card, use flex-column layout (title row with padding, 1px colored divider div, body text with padding and flex:1) instead of absolute-positioning card children. The simple SVG divider line (just a horizontal stroke) is better replaced with a colored div (1px height). Saira font renders correctly in Paper without fontVariationSettings.
**Rule**: For equal-width card layouts, use flex-column inside each card (title + divider div + body) rather than absolute-positioning each card child. Replace simple SVG line dividers with colored 1px-height divs.
---

### [FONTS] Outfit font (Google Font) renders correctly in Paper for both Bold and Regular weights
**Agent**: worker-23
**Item**: #23 WAYY /PITCHDECK-1 (Collosseum Eternal cover)
**Problem**: WAYY pitch deck slides use Outfit font (Bold for headings, Regular for body) which hadn't been tested in Paper before.
**Solution**: Both `font-family: 'Outfit', sans-serif; font-weight: 700` (Bold) and `font-weight: 400` (Regular) render correctly in Paper at all tested sizes (23px, 32px, 42px). No need for special font-family naming — just use 'Outfit' directly.
**Rule**: Outfit (Google Font) works in Paper with standard weight values. Use `font-family: 'Outfit', sans-serif` with `font-weight: 400` or `700`.
---

### [IMAGES] Flipped SVGs (-scale-y-100): use SVG group transform instead of CSS
**Agent**: worker-9
**Item**: #9 11439 (1080x1080 "gleam" social graphic)
**Problem**: Figma code used `-scale-y-100` on the "gleam" pixel text SVG to flip it vertically. Paper does not support CSS transforms.
**Solution**: Apply the flip inside the SVG using `<g transform="translate(0, height) scale(1, -1)">` wrapping the path group. This flips the content within the SVG coordinate system without needing CSS transforms.
**Rule**: For Figma elements with -scale-y-100, apply `transform="translate(0, viewBoxHeight) scale(1, -1)"` on a `<g>` wrapper inside the inline SVG.
---

### [LAYOUT] Simple vector divider lines: use div with background-color instead of SVG img
**Agent**: worker-14
**Item**: #14 Slide 16:9 - 9 ("Reaching the Right Audience")
**Problem**: Figma exported a horizontal divider line as an SVG asset (486.5x1 path with `stroke: var(--stroke-0, #FCE184)`). Downloading and inserting SVG images requires multi-step handling (download, fix var() refs, two-step img insert).
**Solution**: Replace simple vector lines with a `<div>` of the same dimensions and `background-color` matching the stroke color. A 487x1px div with `background-color: #FCE184` is visually identical and takes one write_html call.
**Rule**: For simple straight-line SVG assets (horizontal/vertical lines, dividers), use a colored div instead of downloading and inserting the SVG. Much faster and avoids var() reference issues.
---

### [LAYOUT] Figma "contents" display property: children position relative to grandparent
**Agent**: worker-22
**Item**: #22 Slide 16:9 - 36 ("Seizing the Market" variant)
**Problem**: Figma code had a container div with `className="absolute contents left-[514px] top-[306px]"`. The `contents` value means the element is invisible in layout — it collapses and its children appear as if they are children of the grandparent. The `left`/`top` on the `contents` element are ignored. Child `calc(50%+N)` offsets resolve against the artboard (1920px), not the container.
**Solution**: Ignore the container with `contents` entirely. Compute all child positions as `left = 960 + offset` (half of 1920) minus half the element width for `-translate-x-1/2` centering. Same for vertical: `top = value - height/2` for `-translate-y-1/2`.
**Rule**: When Figma exports a `display: contents` wrapper, ignore its left/top and compute all child positions relative to the full artboard dimensions.
---

### [LAYOUT] Overlapping text and UI panels: push text right to clear panel, not rely on z-order
**Agent**: worker
**Item**: #26 WAYY /PITCHDECK-4 ("IT'S YOUR WEB3 ART RESUME" redo)
**Problem**: The Figma design has the title text starting at calc(50%-29px) within a 1074px container, placing it at x=668 absolute — which overlaps the phone panel (ending at x=607). The original Paper attempt placed the text at the Figma coordinate, but in Paper the phone panel rendered on top of the text, making "IT'S" and the left edge of the title invisible. Review failed because the profile panel overlapped the title.
**Solution**: Move the title text further right (x=630) so it clears the phone panel entirely (phone right edge at ~607px). Sacrifice the small intentional overlap from Figma in favor of clear readability. Also ensure text elements are created AFTER the phone panel so they have higher z-order in Paper.
**Rule**: When Figma has intentional text-behind-UI overlap and the text must remain readable, push the text to clear the UI element rather than relying on z-order. Paper's z-order follows tree insertion order, so create text AFTER underlying panels.
---

### [FIGMA-MCP] Figma MCP rate limits — use completed slides as visual reference
**Agent**: worker-20
**Item**: #20 Slide 16:9 - 59 ("Radiate My JPEGs" Radiator UI mockup)
**Problem**: Figma MCP `get_design_context` and `get_screenshot` both returned rate-limit errors ("You've reached the Figma MCP tool call limit for your Full seat on the Professional plan"). Could not retrieve the design code or reference screenshot for the target slide.
**Solution**: Used a previously completed related slide (11438 social graphic showing the same Radiator burn UI) as visual reference via Paper's `get_screenshot`. Cross-referenced the project design system colors, fonts, and layout patterns from LEARNINGS.md and completed slides to reconstruct the UI faithfully. The bg-texture-49.png asset (already downloaded for slide #4) was reused for the dark background.
**Rule**: When Figma MCP is rate-limited, use Paper screenshots of previously completed related slides as visual reference. Reuse downloaded assets (bg textures, logos) from the `ops/paper-assets/` directory. The existing LEARNINGS.md and completed slides contain enough design system context to reconstruct similar slides.
---

### [FIGMA-MCP] Figma MCP rate limit — use existing Paper slides as reference for variant builds
**Agent**: worker-18
**Item**: #18 Slide 16:9 - 54 ("The cNFT Gallows" use-cases variant)
**Problem**: Figma MCP tool call limit was reached (Professional plan), so `get_design_context` and `get_screenshot` both failed. Could not access the Figma design for the variant slide at all.
**Solution**: Used the already-built original slide (#10, "The cNFT Gallows" at node 2HO-0) in Paper as reference. Extracted its computed styles (`get_computed_styles`) and text content (`get_node_info`) to match fonts, sizes, colors, and positions exactly. Built the variant slide with the same visual structure but use-case-focused content (GALLOWS.EXE window, flow diagram, tag badges).
**Rule**: When Figma MCP is rate-limited, use existing Paper artboards of the original/sibling slide as a style reference. Extract computed styles and text content from the original to maintain visual consistency for variant slides.
---

### [WORKFLOW] Variant slides can be built from existing Paper artboard JSX when Figma MCP is rate-limited
**Agent**: worker
**Item**: #19 Slide 16:9 - 56 ("Once Permissionless, Chaos Reigns")
**Problem**: Figma MCP rate limit hit (both get_design_context and get_screenshot). Needed to build a variant of slide #12 (same 3-card layout, different title and first card).
**Solution**: Used `get_jsx` on the existing Paper artboard for slide #12 to extract exact styles (positions, fonts, colors, shadows, backdrop-filter, card dimensions). Then recreated the variant with modified title/subtitle/card content, reusing all the same style values. The result was visually identical in structure.
**Rule**: When Figma MCP is rate-limited, use `get_jsx(format: 'inline-styles')` on an existing similar Paper artboard to extract exact style values for variant slides. This avoids needing Figma at all for layout-identical variants.
---

### [CSS] Inline <span> tags inside <pre> break into separate text nodes — use single-color text
**Agent**: worker-4.3
**Item**: 4.3 PixelCode specimen (code block with syntax highlighting)
**Problem**: Used `<span style="color: #FCE184;">` inside a `<pre>` tag to create syntax-highlighted code (property names in yellow, values in cream). Each `<span>` became a separate inline-block Text node in Paper, breaking the pre-formatted layout — tokens wrapped randomly across lines instead of staying on their original lines.
**Solution**: Remove all `<span>` tags and use a single text color for the entire `<pre>` block. Paper's rich text limitation (noted in write_html docs) means inline elements get converted to inline-block, breaking whitespace preservation.
**Rule**: Never use `<span>` inside `<pre>` for syntax highlighting in Paper. Use a single text color for the entire code block. Rich text / multi-color inline text is not supported.
---

### [LAYOUT] Flex spacer ordering matters — insert spacer before divider/footer
**Agent**: worker-3.6
**Item**: 3.6 Action tokens row — dark
**Problem**: Added a divider element to the artboard, then added a flex-grow spacer afterward. The spacer appeared after the divider (at the very bottom) instead of before it, so the divider wasn't pushed to the bottom of the artboard.
**Solution**: Delete both elements and re-insert in the correct order: spacer first (with flex-grow: 1), then divider, then footer. Paper appends children in insertion order with no reorder API.
**Rule**: When using flex-grow spacers to push content to the bottom, insert the spacer BEFORE the divider/footer elements. Delete and re-insert if ordering is wrong.
---

### [FONTS] Typography specimen metadata subtitle must use Pixel Code, not Mondwest
**Agent**: reviewer
**Item**: 4.3 PixelCode specimen
**Problem**: The metadata subtitle line ("Mono / Code · Weight 400 · --font-mono · font-mono") was rendered in Mondwest instead of Pixel Code. Items 4.1 and 4.2 both use Pixel Code 12px for this metadata line, so 4.3 was inconsistent.
**Solution**: Updated fontFamily on node 4T3-0 from Mondwest to Pixel Code via update_styles.
**Rule**: In typography specimens (4.x), the metadata subtitle under the header (role · weights · CSS var · Tailwind class) must always be in Pixel Code 12px — not Mondwest. Mondwest is only for the footer description.
---

### [FONTS] Weight showcase samples must render at their described fontWeight
**Agent**: reviewer
**Item**: 4.5 Dark mode typography
**Problem**: In the PixelCode specimen's weight showcase section, all 4 weight sample lines (300 Light, 400 Regular, 500 Medium, 700 Bold) were rendering at fontWeight 400. The text described different weights but didn't actually demonstrate them visually.
**Solution**: Updated fontWeight on nodes 4LS-0 (300), 4LU-0 (500), 4LV-0 (700) via update_styles. Node 4LT-0 was already correct at 400.
**Rule**: When a typography specimen showcases font weights, each sample line must have its fontWeight set to the weight it describes — not just label the weight in text.
---

### [WORKFLOW] Figma MCP rate limit blocks items with no prior visual reference — must defer
**Agent**: worker (item 10)
**Item**: #10 11440 (1080x1080 social graphic, node 4369:22342)
**Problem**: All Figma MCP tools (get_design_context, get_screenshot, get_metadata) returned rate-limit errors. Unlike item #20 (Slide 16:9 - 59) which was a variant of a known UI (Radiator burn UI), item #10 has no sibling or variant relationship to any completed graphic — its content (text, icons, layout) is completely unknown. Fabricating content would produce a graphic that fails review 100% of the time.
**Solution**: Deferred the item. Did NOT mark [x] or create an artboard. The orchestrator should retry this item in a later iteration when the Figma MCP rate limit has reset.
**Rule**: When Figma MCP is rate-limited AND the item has no known content (no variant of a completed item, no cached assets, no description in any doc), defer rather than fabricate. Only proceed without Figma when the content is known from a sibling/variant slide or explicit description.
---

### [WORKFLOW] Item #79 also blocked by Figma MCP rate limit
**Agent**: worker (item 79)
**Item**: #79 Frame 2085660680 (738x738, node 4369:16386)
**Problem**: Same Figma MCP rate limit as item #10. All tools returned limit errors. No Figma REST API token available. Frame is an unnamed 738x738 graphic with unknown content — no sibling or variant of any completed item exists.
**Solution**: Deferred per existing rule. Did not create artboard or mark [x].
**Rule**: Same as above — defer unnamed frames with unknown content when Figma MCP is rate-limited.
---

### [LAYOUT] Rotated SVG arrows in diagram graphics
**Agent**: worker (batch2)
**Item**: #79 Frame 2085660680 (738x738 treasury governance diagram)
**Problem**: Figma exports arrow vectors as thin SVGs with CSS `transform: rotate()` to create diagonal lines. Paper supports SVG with inline style rotation. The key is matching the exact container dimensions and rotation angles from Figma.
**Solution**: Use inline SVG elements inside absolutely-positioned div containers. Match the Figma container width/height and apply the same rotation via `style="transform: rotate(Xdeg)"` on the SVG itself. For mirrored arrows, add `scaleY(-1)` to the transform.
**Rule**: For rotated vector arrows from Figma, preserve the exact container size and rotation angle — Paper handles SVG transform rotation correctly.
---

### [CSS] Unicode escape sequences (\u201C) render literally in Paper — use HTML entities instead
**Agent**: worker-b
**Item**: #78 Frame 2085660712 (754x754 vulnerability quote)
**Problem**: Passing curly quotes as `\u201C` and `\u201D` in the HTML string to `write_html` rendered them as literal text "\u201CYou..." instead of as the actual Unicode characters.
**Solution**: Use HTML entities `&#x201C;` and `&#x201D;` instead of JavaScript Unicode escapes. Paper's HTML parser correctly converts HTML entities to their corresponding characters.
**Rule**: In Paper `write_html`, use HTML entities (`&#x201C;`, `&#x201D;`, `&#x2019;`, etc.) for special Unicode characters, not JS escape sequences (`\u201C`).
---

### [LAYOUT] NFT card grids: group cards into flex-row containers, insert images per card frame
**Agent**: worker-a
**Item**: #10 11440 (1080x1080 "Gleam's former Ape Energy Labs NFT's" social graphic)
**Problem**: Figma design had 17 small NFT card thumbnails (~41x55px each) arranged in 3 rows across 3 column groups, each with yellow borders and golden glow box-shadow. Creating each card individually with absolute positioning would be tedious and fragile.
**Solution**: Group cards into flex-row containers (one per row-group) with `gap: 6px`, where each card is a `display: flex` div (Frame) with border and box-shadow. Then insert `<img>` into each card Frame as a second step. Using `display: flex` on the card div ensures it creates a Frame (not a Rectangle), which can accept children. Empty divs without `display: flex` become Rectangles that reject children.
**Rule**: For grids of small image cards, create flex-row container divs with card children using `display: flex` on each card. Insert images into each card Frame individually. The `display: flex` ensures Frame creation (not Rectangle) so children can be added.
---

### [PAPER-MCP] Mass duplicate_nodes detaches sibling nodes from artboard
**Agent**: worker-b
**Item**: #10 11440
**Problem**: Calling `duplicate_nodes` with 16 copies of the same node in a single call caused ALL other sibling children of the artboard to be detached (parentId became null, childCount became 0). The artboard's childIds only listed the duplicated nodes. All carefully built elements (background, heading, card, connection lines, etc.) were orphaned and lost.
**Solution**: Do NOT mass-duplicate 16+ nodes in a single `duplicate_nodes` call. Either create each node individually via `write_html`, or duplicate in small batches (1-3 at a time). For repeated elements at different positions, creating each one individually with `write_html` + `insert-children` is safer and more reliable.
**Rule**: Avoid mass duplicate_nodes calls (>5 copies). Create repeated elements individually via write_html to prevent sibling detachment.
---

### [IMAGES] Nested img inside write_html div may not render — use two-step approach
**Agent**: worker-b
**Item**: #10 11440
**Problem**: Writing `<div><img src="..." /></div>` in a single write_html call sometimes results in the div being created but the img child not rendering (childCount=0). The image loads as black or is invisible.
**Solution**: Use the two-step approach: (1) create the container div via write_html, (2) insert the img as a separate write_html call targeting the container as parent. This reliably creates the image as a Rectangle with the fill loaded.
**Rule**: Always use two-step approach for images inside containers: create container first, then insert img separately.
---

### [FIGMA-MCP] Some Figma frames are empty solid-color backgrounds with no children
**Agent**: worker-b
**Item**: #75 Frame 2085660686 (754x754)
**Problem**: Figma MCP returned only `bg-[var(--black,#0f0e0c)] size-full` with no children. Screenshot confirmed a solid dark square. Spent extra API calls verifying there was no hidden content.
**Solution**: Create a simple artboard with matching dimensions and background color. No children needed.
**Rule**: When Figma design context and screenshot both show only a solid background with no children, trust the data — create a matching artboard and move on. Don't over-investigate.
---

### [IMAGES] Flipping SVGs vertically: use SVG transform on the group element, not CSS
**Agent**: worker-a
**Item**: #11 11441 (1080x1080 "Together, we'll chart a new course" social graphic)
**Problem**: Figma code used `-scale-y-100` CSS transform to flip a pixel-art icon SVG vertically. Paper doesn't support CSS transforms.
**Solution**: Edit the SVG file to add `transform="scale(1,-1) translate(0,-H)"` on the `<g>` element wrapping the paths, where H is the viewBox height. This flips the paths within the SVG's own coordinate system. The SVG's built-in glow filter still renders correctly with the transform applied.
**Rule**: For vertically flipped SVGs, add `transform="scale(1,-1) translate(0,-viewBoxHeight)"` to the inner `<g>` element. SVG filters survive group transforms.
---

### [LAYOUT] Figma negative-inset SVG overlays: compute actual SVG bounds from percentage insets
**Agent**: worker-a
**Item**: #12 11444 (1080x1080 "Phase Passports" social graphic)
**Problem**: Figma exported SVG connector lines and gear icon inside containers with negative percentage insets (e.g., `inset: -54.51% -26.88%`), meaning the SVG extends far beyond its logical container. Paper doesn't support CSS `inset` or percentage positioning.
**Solution**: Compute actual SVG pixel bounds: actual_width = container_width * (1 + 2 * abs_inset_pct), actual_height = container_height * (1 + 2 * abs_inset_pct). Verify against SVG viewBox dimensions. Position the SVG div at computed absolute coordinates: svg_left = container_left - (inset_pct * container_width), svg_top = container_top - (inset_pct * container_height). Use inline SVG with the full viewBox and filter definitions.
**Rule**: For Figma SVGs with negative percentage insets, expand the container to the full SVG viewBox size and offset the position accordingly. The SVG viewBox dimensions serve as a cross-check for the computed bounds.
---

### [IMAGES] Figma MCP asset URLs render as gray placeholders in Paper
**Agent**: worker-b
**Item**: #71 Frame 2085660696 (The Waitress Problem, 1175x1033)
**Problem**: Figma MCP asset URLs (`https://www.figma.com/api/mcp/asset/...`) for vector SVG exports (bracket connectors, arrows) render as gray placeholder rectangles in Paper. The images never load even after waiting.
**Solution**: Replace Figma asset SVGs with CSS-drawn equivalents (border-based brackets) or inline `<svg>` elements (for arrows with polygon arrowheads). CSS borders work perfectly for bracket/connector shapes; inline SVG with `<polygon>` and `<line>` elements render correctly in Paper.
**Rule**: When Figma assets are simple geometric shapes (brackets, arrows, lines), skip the asset URL and draw them with CSS borders or inline SVG instead. Reserve Figma asset URLs for raster images and complex vector art only.
---

