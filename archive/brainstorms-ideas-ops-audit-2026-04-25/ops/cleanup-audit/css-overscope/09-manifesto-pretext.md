# CSS Over-scope Audit — Manifesto & Pretext Editorial Primitives

Scope:
- `apps/rad-os/components/apps/manifesto/` — ManifestoBook.tsx (557 LOC), CoverPage.tsx, ForwardPage.tsx
- `apps/rad-os/components/apps/pretext/` — PretextDocumentView.tsx, PretextPreviewFrame.tsx
- `apps/rad-os/components/apps/pretext/primitives/` — BookView.tsx, BroadsheetView.tsx, EditorialView.tsx

Pretext is an absolute-positioning layout engine: it computes `{x, y, width}` per glyph-run OUTSIDE the DOM and the views simply place those runs with `position: absolute`. Any wrapper that establishes "flow" (flex, grid, padding-for-column, gutters, margins) is redundant — the engine already baked it into the x/y.

---

### F1: Section-title branch duplicates page wrapper shell — Med
- File: `apps/rad-os/components/apps/manifesto/ManifestoBook.tsx:463-475` vs `:476-529`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  ) : contentPage && contentPage.els.length === 1 && contentPage.els[0]!.kind === 'section-title' ? (
    <div className="relative bg-card flex items-center justify-center"
         style={{ width: pageWidth, height: pageHeight }}>
      <div className="text-head text-center px-8" style={{ font: contentPage.els[0]!.font }}>
        {contentPage.els[0]!.text}
      </div>
    </div>
  ) : contentPage ? (
    <div className="relative bg-card" style={{ width: pageWidth, height: pageHeight }}>
      ...
  ```
- Proposal: fold the section-title into the main content branch the way BookView already does (`BookView.tsx:49-58` uses `flex h-full items-center justify-center` on the element itself, not a sibling page wrapper). One page shell, element is rendered in-place.
- Why safe: the page shell is identical (`relative bg-card width/height`); only the single inner element differs and can absorb the centering classes.

### F2: Outer container duplicates AppWindow chrome — Med
- File: `apps/rad-os/components/apps/manifesto/ManifestoBook.tsx:453`
- Pattern: pass-through
- Current: `<div className="h-full w-full flex flex-col items-center justify-center bg-card">`
- Proposal: AppWindow already provides `h-full w-full` scroll container and the window body. `bg-card` + `flex flex-col` are the only genuine responsibilities. Drop `items-center justify-center` — they collapse to nothing because the inner container is already `w-full flex-1`.
- Why safe: inner `flex-1 w-full` stretches across the full width regardless of parent's `items-center` (flex item stretches on cross axis by default).

### F3: Page shell is repeated in three branches — Low
- File: `apps/rad-os/components/apps/manifesto/ManifestoBook.tsx:459-529` and `CoverPage.tsx:97-101`, `ForwardPage.tsx:78`
- Pattern: duplicate-layout
- Current: Every special page repeats `<div className="relative bg-card" style={{ width: pageWidth, height: pageHeight }}>`.
- Proposal: ManifestoBook's `containerRef` div (`ManifestoBook.tsx:455-458`) already supplies width/height via `useContainerSize` and has `relative`. Make it `bg-card` and remove the inner shell from CoverPage, ForwardPage, and the two content branches — children can render as absolute fragments.
- Why safe: the ref div already owns `relative flex-1 w-full overflow-hidden`; bounds are identical.

### F4: Pretext preview frame wraps a primitive that already owns its frame — Med
- File: `apps/rad-os/components/apps/pretext/PretextPreviewFrame.tsx:22-29`
- Pattern: wrapper-collapse
- Current: outer `div` with `rounded-md border border-line bg-card shadow-sm`, header `div`, then ANOTHER `div ref={frameRef} min-h-0 flex-1`. Inside, each primitive view already sets `h-full w-full overflow-auto bg-card` (e.g. `EditorialView.tsx:178`, `BookView.tsx:123`, `BroadsheetView.tsx:197`).
- Proposal: the `bg-card` on the outer frame is shadowed by the primitive's own `bg-card`. The `frameRef` wrapper exists only to read a size — merge it with the outer frame (`ref` on the outer `div` itself) and drop the duplicate `bg-card`.
- Why safe: the ref div's only job is to report size; no child depends on its being a separate stacking/flex context.

### F5: EditorialView inner `relative` wrapper is unnecessary — Low
- File: `apps/rad-os/components/apps/pretext/primitives/editorial/EditorialView.tsx:171-187`
- Pattern: wrapper-collapse
- Current: outer div (testid host, `overflow-auto`) → inner `<div className="relative" style={{ height: layout.height }}>` → absolute children.
- Proposal: the outer is already a block-level containing box. Set `position: relative` on the outer (or on the first element that needs it) and lift `height: layout.height` there. Saves one DOM node per primitive render.
- Why safe: `overflow-auto` does NOT establish containing block for `position: absolute`; `relative` does. Moving `relative` to the outer is a lateral change.

### F6: Pullquote bakes lines into stacked `<div>`s instead of using the line wrapper it already has — Low
- File: `apps/rad-os/components/apps/pretext/primitives/editorial/EditorialView.tsx:85-104`
- Pattern: primitive-has-it
- Current: outer absolute block contains `element.lines.map((line) => <div>{line}</div>)`.
- Proposal: pretext's layout engine could pre-compose the pullquote as regular `line` elements with a `variant: 'pullquote'` tag (same pattern used for `variant: 'code'` at `EditorialView.tsx:29`). Then the outer block becomes a single styled backdrop rectangle. This mirrors how the engine already handles per-line positioning for prose.
- Why safe: code-variant already demonstrates the pattern — per-line styling happens in the line renderer, not a wrapping block.

### F7: Drop-cap uses flex centering on a pretext-positioned element — Low
- File: `apps/rad-os/components/apps/pretext/primitives/editorial/EditorialView.tsx:66-83`
- Pattern: pass-through
- Current: `className="absolute flex items-start justify-center text-head"` with explicit `width/height` and `fontSize`.
- Proposal: pretext already computes where to place the glyph (x, y, w, h). A single glyph doesn't need flex centering — remove `flex items-start justify-center`, let the character draw from the content box. If alignment is needed, bake it into the layout calculation (`x`/`y`).
- Why safe: flex for a single text node produces the same visual as the natural text baseline when x/y are already computed.

### F8: Trigger-image and placeholder divs repeat identical absolute-positioning shell — Low
- File: `apps/rad-os/components/apps/manifesto/ManifestoBook.tsx:485-527`
- Pattern: duplicate-layout
- Current: three branches (`isPlaceholder`, `isVideo`, `<img>`) each set `absolute`, `left/top/width/height`, `cursor-pointer`, and handle onClick — ~45 LOC.
- Proposal: extract a `<TriggerAsset trigger obs onToggle />` renderer (semantic HTML + className) so the page-level JSX is one `.map(...)` call.
- Why safe: the three branches already share the full style object and click handler; only the inner element type varies.

### F9: Page-indicator row duplicates AppWindow footer conventions — Low
- File: `apps/rad-os/components/apps/manifesto/ManifestoBook.tsx:532-553`
- Pattern: pass-through
- Current: hand-rolled `<div className="flex items-center gap-3 py-2 text-mute font-joystix text-xs select-none">` + two raw `<button>` elements.
- Proposal: use the RDNA `<Button variant="ghost">` or a shared `Pager` primitive. Raw `<button>` is also flagged by `rdna/prefer-rdna-components`.
- Why safe: same semantics, same visual, RDNA component handles tokens.

### F10: ForwardPage rebuilds a mini layout engine inline — Med
- File: `apps/rad-os/components/apps/manifesto/ForwardPage.tsx:21-117` (and similarly `CoverPage.tsx:73-130`)
- Pattern: duplicate-layout
- Current: 90 LOC of `prepareWithSegments` + `layoutWithLines` + manual cursorY accounting + per-line absolute divs. The main `ManifestoBook` already owns `paginateManifesto` + `renderElement` + font cache.
- Proposal: teach `paginateManifesto` / `MANIFESTO_ELEMENTS` about `cover` and `forward` element kinds; render them through the same element-level absolute renderer. The shell would collapse to one page renderer instead of three.
- Why safe: both special pages already use the same pretext primitives; only the cursorY + startY math is inlined — that math belongs in the layout engine.

### F11: Trigger/glossary span inlines hover/bg utilities that duplicate the rule surface tokens — Low
- File: `apps/rad-os/components/apps/manifesto/ManifestoBook.tsx:123-138` and `:192-207`
- Pattern: duplicate-layout
- Current: two nearly-identical span emitters (one for justified, one for non-justified) with `bg-accent / bg-accent-soft / cursor-help / hover:bg-depth`.
- Proposal: extract `<TriggerSpan>` and `<GlossarySpan>` components; one definition each instead of four copies across the two code paths.
- Why safe: the two paths only differ in the outer layout wrapper; inner span markup is identical.

---

## Cross-cutting observations

- **Pretext positions elements absolutely from OUTSIDE the DOM.** Any flexbox/grid/padding on the page shell is decoration, not layout. The only container semantics that matter are: `position: relative` (so `absolute` children anchor to it) and an explicit `width/height`.
- **`bg-card` on nested wrappers.** Repeated on PretextPreviewFrame outer, its ref-child, and each primitive view. Only one is visible; pick the outermost and remove the others.
- **No traditional side-nav (w-48) found** in manifesto/pretext. The memory rule applies to ManifestoApp.tsx (not in this audit scope) — these files are internal page renderers.
- **No viewport breakpoints found** (`md:` / `lg:`) in any file audited — clean on the per-window-width rule.
- **Raw `<button>` usage** (F9) should be caught by `rdna/prefer-rdna-components` — worth re-running the linter.
- The biggest single win is F10 (ForwardPage + CoverPage collapse) and F4 (PretextPreviewFrame ref-split collapse): ~180 LOC of duplicated layout plumbing that the engine already owns.
