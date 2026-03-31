# AppWindow Container Audit

> Current vs ideal DOM structure for the AppWindow compound API.

***

## Current Structure (window presentation)

What actually renders to the DOM today. Every line is a real DOM node.

```text
<Draggable>                                           ← react-draggable wrapper (no DOM node)
  <div.absolute.pixel-rounded-md>                     ← [WINDOW] outer shell, position/size/shadow
    <div.absolute.inset-0 />                          ← unfocused overlay (conditional)
    <div [data-drag-handle]>                          ← [TITLEBAR] drag handle
      <div>                                           ← traffic-light buttons
        <Button /> <Button /> <Button /> ...
      </div>
      <span.absolute.font-joystix />                  ← centered title
      <div.flex-1> <Separator /> </div>               ← separator line
      <div [tablist]> ... </div>                      ← nav tabs (registered via context)
    </div>
    <div ref={toolbarRef}> ... </div>                 ← [TOOLBAR] (conditional, measured)
    <div.flex-1.min-h-0.@container                    ← [CONTENT-ZONE] sets --app-content-max-height
      style="--app-content-max-height">
      <AppWindowChromeCtx.Provider>                   ← React context (no DOM)
        {children}                                    ← app's compound children land here
      </AppWindowChromeCtx.Provider>
    </div>
    <div.absolute /> × 8                              ← resize handles (conditional)
  </div>
</Draggable>
```

### What `<AppWindow.Content>` adds

```text
<div.h-full.flex.flex-col.px-1.5.pb-1.5>             ← [CONTENT-OUTER] chrome padding
  {banners}                                           ← AppWindow.Banner children (conditional)
  <div.flex-1.min-h-0.{layout}>                      ← [CONTENT-INNER] layout wrapper (flex-col | flex row)
    {islands / rest}
  </div>
</div>
```

### What `<AppWindow.Island>` adds (scrollable, default)

```text
<div.flex-1.min-w-0.min-h-0.{corners}.{bg}>          ← [ISLAND-SHELL] corner style + bg
  <ScrollArea.Root>                                   ← calls Root() which auto-wraps in Viewport
    <BaseScrollArea.Root.relative.overflow-hidden>     ← [SA-ROOT]
      <BaseScrollArea.Viewport>                       ← [SA-VIEWPORT-1] ⚠️ auto-created by Root()
        <BaseScrollArea.Content>                      ← [SA-CONTENT-1] ⚠️ auto-created by Root()
          ┌─ children of Root() = the explicit Viewport passed by Island: ─┐
          │ <BaseScrollArea.Viewport>                 ← [SA-VIEWPORT-2] ⚠️ DUPLICATE
          │   <BaseScrollArea.Content>                ← [SA-CONTENT-2] ⚠️ DUPLICATE
          │     {padding div?}                        ← conditional on padding prop
          │       {children}
          │   </BaseScrollArea.Content>
          │ </BaseScrollArea.Viewport>
          └────────────────────────────────────────────┘
        </BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar />                    ← vertical scrollbar
    </BaseScrollArea.Root>
  </ScrollArea.Root>
</div>
```

**Bug:** `AppWindowIsland` calls `ScrollArea.Root` (which internally wraps children in `Viewport > Content`) and *also* explicitly passes `ScrollArea.Viewport` as a child. This creates a **double viewport/content nesting** — 4 extra wrapper divs that do nothing.

### What `<AppWindow.Island noScroll>` adds

```text
<div.flex-1.min-w-0.min-h-0.{corners}.{bg}>          ← [ISLAND-SHELL]
  <div.h-full.{padding}>                              ← padding wrapper
    {children}
  </div>
</div>
```

No ScrollArea, no double nesting. Clean.

***

## Full trace: BrandAssetsApp "Pixels" tab

Combining all layers from the outermost AppWindow div down to `<PatternPreview>`:

```text
div.absolute.pixel-rounded-md                         ← WINDOW shell
  div.flex-1.min-h-0.@container                       ← CONTENT-ZONE (--app-content-max-height)
    div.h-full.flex.flex-col.px-1.5.pb-1.5            ← Content outer (chrome padding)
      div.flex-1.min-h-0.flex.flex-col                ← Content inner (layout=single)
        div.flex-1.pixel-rounded-sm.bg-card.@container ← Island shell
          div.relative.overflow-hidden.h-full         ← SA-ROOT
            div (BaseScrollArea.Viewport)             ← SA-VIEWPORT-1 (auto)
              div (BaseScrollArea.Content)            ← SA-CONTENT-1 (auto)
                div (BaseScrollArea.Viewport)         ← SA-VIEWPORT-2 ⚠️ duplicate
                  div (BaseScrollArea.Content)        ← SA-CONTENT-2 ⚠️ duplicate
                    div.flex-1.overflow-y-auto        ← BrandAssetsApp manual scroll ⚠️ redundant
                      <PatternPlayground>
                        div.h-full.flex.flex-col       ← Content outer (nested!) ⚠️
                          div.flex-1.min-h-0           ← Content inner (nested!) ⚠️
                            ...PatternPreview
```

**13 wrapper divs** between the window shell and actual content. Should be ~5.

***

## Ideal Structure

Goals:

* Every DOM node has a clear, named role

* Scroll is owned by Island — nothing else adds overflow

* No double viewport

* Apps never nest `AppWindow.Content` inside `AppWindow.Content`

* `data-aw-*` attributes on structural nodes for debugging

* **ScrollArea.Root is absolute-positioned** — always fills its Island regardless of resize

### Scroll strategy: absolute fill

The Island shell is `position: relative` and gets its size from the flex algorithm.\
ScrollArea.Root is `position: absolute; inset: 0` — it fills whatever the Island is,\
without participating in layout. Content inside can never push the Island larger than\
the flex algorithm determined. Resize, fullscreen, drag-resize — all automatic, zero\
layout recalc race conditions.

```text
[ISLAND]   position: relative;  flex: 1;  min-height: 0;
  [SA-ROOT]  position: absolute;  inset: 0;       ← always fills Island exactly
    [VIEWPORT] overflow: auto;
      [CONTENT]
        {app content}
```

### Full ideal tree

```text
<Draggable>                                           ← react-draggable (no DOM)
  <div data-aw="window">                              ← [WINDOW] position, size, shadow, pixel corners
    <div data-aw="titlebar">                          ← [TITLEBAR] drag, traffic lights, title, nav tabs
      ...
    </div>
    <div data-aw="toolbar">                           ← [TOOLBAR] (conditional, measured)
      ...
    </div>
    <div data-aw="stage">                             ← [STAGE] flex container, chrome padding, --max-height
      <div data-aw="banner"> ... </div>               ← [BANNER] (conditional, above islands)
      <div data-aw="layout" data-layout="{mode}">     ← [LAYOUT] single | split | sidebar | bleed
        <div data-aw="island"                         ← [ISLAND] relative, corners, bg
             style="position: relative">
          <ScrollArea.Root                            ← absolute inset-0, single scroll owner
               style="position: absolute; inset: 0">
            <ScrollArea.Viewport>
              <ScrollArea.Content>
                <div data-aw="island-pad">            ← [PAD] padding wrapper (omitted when none)
                  {app content}
                </div>
              </ScrollArea.Content>
            </ScrollArea.Viewport>
          </ScrollArea.Root>
        </div>
      </div>
    </div>
  </div>
</Draggable>
```

### Ideal: BrandAssetsApp "Pixels" tab

```text
div [data-aw="window"]
  div [data-aw="titlebar"]
  div [data-aw="stage"]
    div [data-aw="layout" data-layout="single"]
      div [data-aw="island"]                          ← relative, pixel corners, bg-card
        div [ScrollArea.Root]                         ← absolute inset-0
          div [ScrollArea.Viewport]                   ← overflow: auto
            div [ScrollArea.Content]                  ← measured by Base UI for scrollbar
              <PatternPlayground />                   ← no wrapper, no nested Content
```

**5 structural divs** + 3 ScrollArea nodes. Down from 13.

The 3 ScrollArea nodes are unavoidable — Base UI needs Root (positions the scrollbar track), Viewport (the scroll surface), and Content (measured to determine if scrollbars appear). But because Root is absolute, it adds zero layout cost.

### `<AppWindow.Island noScroll>` (ideal)

When an app manages its own scroll or needs full layout control:

```text
<div data-aw="island" style="position: relative">     ← still relative for consistent API
  <div data-aw="island-pad"                           ← padding wrapper (omitted when none)
       style="position: absolute; inset: 0">          ← absolute fill, same pattern as scroll
    {app content}
  </div>
</div>
```

Same absolute-fill pattern, just without the ScrollArea. Consistent mental model.

### Styling approach: `data-aw` selectors + Tailwind `@apply`

Structural nodes use `data-aw` attribute selectors instead of inline Tailwind classes.\
These are just Tailwind compounders — no custom CSS logic, just named bundles of the\
same utilities that were previously scattered across JSX.

Lives in a single file (e.g. `appwindow.css`, imported by AppWindow):

```css
/* AppWindow structural skeleton — Tailwind @apply compounders */

[data-aw="window"] {
  @apply absolute flex flex-col p-0 pixel-rounded-md;
  /* position/size/zIndex/shadow set via inline style (dynamic) */
}

[data-aw="titlebar"] {
  @apply flex items-center gap-3 pl-1 pr-2 py-1.5 h-fit cursor-move select-none;
}

[data-aw="toolbar"] {
  @apply shrink-0;
}

[data-aw="stage"] {
  @apply flex flex-col flex-1 min-h-0 px-1.5 pb-1.5;
}

[data-aw="layout"] {
  @apply flex-1 min-h-0;
}
[data-aw="layout"][data-layout="single"]  { @apply flex flex-col; }
[data-aw="layout"][data-layout="split"]   { @apply flex gap-1.5; }
[data-aw="layout"][data-layout="sidebar"] { @apply flex gap-1.5; }

[data-aw="island"] {
  @apply relative flex-1 min-w-0 min-h-0;
}

[data-aw="island-scroll"] {
  @apply absolute inset-0 overflow-hidden;
}

[data-aw="island-pad"] {
  @apply absolute inset-0;
  /* padding class set via prop → inline style or data attr */
}

[data-aw="banner"] {
  @apply shrink-0;
}
```

**What this buys:**

* **DevTools clarity** — `data-aw="island"` in the Elements panel vs decoding `flex-1 min-w-0 min-h-0 relative pixel-rounded-sm bg-card`

* **Single source of truth** — structural layout lives in one CSS file, not spread across 5 functions in AppWindow.tsx

* `data-aw`**&#x20;does triple duty** — debug label, CSS selector, and test selector

* **Tailwind stays for what varies** — corner styles, bg colors, padding overrides, app-level content styling

The JSX becomes just:

```tsx
<div data-aw="island" className={`${cornerClass} ${bgClassName}`}>
```

Corner style and bg are the only things that vary per-island — those stay as Tailwind classes.\
Everything structural is handled by the attribute selector.

### Kill the presentation forks

Currently AppWindow has **3 completely separate render paths** based on `presentation`:

| Presentation | What it renders | Difference from `window` |
|---|---|---|
| `window` | Draggable → shell → titlebar → toolbar → content zone → resize handles | The real one |
| `fullscreen` | Same shell but `fixed inset-0`, no Draggable, no resize handles | Just a size/position change |
| `mobile` | Completely different DOM: custom `<header>`, `<main>`, no titlebar component, no unfocused overlay | A whole second component hiding in an `if` branch |

**Ideal:** Delete both forks. One render path. Fullscreen = set position to `{x:0, y:0}` and size to viewport dimensions, disable drag/resize. Mobile = same shell, responsive tweaks come later as CSS (not a separate DOM tree).

This eliminates ~90 lines of duplicated JSX and means every structural fix (data-aw, absolute scroll, etc.) only needs to happen once.

### Key changes from current → ideal

| # | Change | Why |
|---|--------|-----|
| 1 | **Delete `fullscreen` and `mobile` presentation forks** | 3 render paths → 1. Fullscreen is just a resize. Mobile gets identical structure, responsive tweaks via CSS later. ~90 lines of duplicated JSX removed. |
| 2 | **Merge CONTENT-ZONE + Content outer + Content inner → STAGE + LAYOUT** | 3 divs → 2. `--app-content-max-height` moves to STAGE. Chrome padding moves to STAGE. Layout mode stays on LAYOUT. |
| 3 | **Fix double ScrollArea in Island** | Island should use `ScrollArea.Root` *without* also nesting `ScrollArea.Viewport`. Either use the compound `Root` (which auto-wraps) or use `BaseScrollArea.Root` + explicit `Viewport` — not both. |
| 4 | **Absolute-position ScrollArea.Root inside Island** | Island shell is `relative`, ScrollArea.Root is `absolute inset-0`. Content can never push the Island past its flex-determined size. Resize is automatic — no layout recalc race. |
| 5 | **Ban nested `AppWindow.Content`** | Apps like PatternPlayground that render inside an Island must not re-wrap in `AppWindow.Content`. Content is a chrome-level primitive, not a layout helper. Add a dev-mode warning. |
| 6 | **Add `data-aw` debug attributes** | Every structural node gets `data-aw="window|titlebar|toolbar|stage|banner|layout|island|island-pad"`. Zero runtime cost, massive DevTools clarity. |
| 7 | **Island owns all scrolling** | Remove any `overflow-y-auto` / `overflow-auto` divs that apps add inside Islands. If an app needs no-scroll, use `<Island noScroll>`. |

### Layout modes on LAYOUT node

| `data-layout` | CSS             | Use case                                     |
| ------------- | --------------- | -------------------------------------------- |
| `single`      | `flex flex-col` | One island, full width                       |
| `split`       | `flex gap-1.5`  | Two+ islands side by side                    |
| `sidebar`     | `flex gap-1.5`  | Fixed-width island + flex island             |
| `bleed`       | (none)          | No padding, no island wrapper — raw children |

***

## Action items

### Phase 1 — Quick wins (no API change, ship independently)

1. Fix `AppWindowIsland` double Viewport bug
2. Remove `PatternPlayground`'s nested `<AppWindow.Content>` wrapper
3. Remove `BrandAssetsApp`'s manual `overflow-y-auto` div (line 528)

### Phase 2 — Structural refactor

4. Delete `fullscreen` and `mobile` presentation forks — one render path
5. Merge the 3-div content zone into 2 (STAGE + LAYOUT)
6. Make Island shell `position: relative`, ScrollArea.Root `position: absolute; inset: 0`
7. Apply same absolute-fill pattern to `<Island noScroll>` for consistency
8. Add `data-aw` attributes to structural nodes
9. Create `appwindow.css` with `data-aw` selector rules (`@apply` compounders), strip matching Tailwind classes from JSX
10. Add dev-mode `console.warn` if `AppWindow.Content` is nested inside another `AppWindow.Content`
11. Evaluate whether `--app-content-max-height` can be removed (absolute-fill may make it unnecessary)

⠀