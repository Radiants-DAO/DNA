# AppWindow Container Audit

> Current vs ideal DOM structure for the AppWindow compound API.

---

## Current Structure (window presentation)

What actually renders to the DOM today. Every line is a real DOM node.

```
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

```
<div.h-full.flex.flex-col.px-1.5.pb-1.5>             ← [CONTENT-OUTER] chrome padding
  {banners}                                           ← AppWindow.Banner children (conditional)
  <div.flex-1.min-h-0.{layout}>                      ← [CONTENT-INNER] layout wrapper (flex-col | flex row)
    {islands / rest}
  </div>
</div>
```

### What `<AppWindow.Island>` adds (scrollable, default)

```
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

```
<div.flex-1.min-w-0.min-h-0.{corners}.{bg}>          ← [ISLAND-SHELL]
  <div.h-full.{padding}>                              ← padding wrapper
    {children}
  </div>
</div>
```

No ScrollArea, no double nesting. Clean.

---

## Full trace: BrandAssetsApp "Pixels" tab

Combining all layers from the outermost AppWindow div down to `<PatternPreview>`:

```
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

---

## Ideal Structure

Goals:
- Every DOM node has a clear, named role
- Scroll is owned by Island — nothing else adds overflow
- No double viewport
- Apps never nest `AppWindow.Content` inside `AppWindow.Content`
- `data-aw-*` attributes on structural nodes for debugging
- **ScrollArea.Root is absolute-positioned** — always fills its Island regardless of resize

### Scroll strategy: absolute fill

The Island shell is `position: relative` and gets its size from the flex algorithm.
ScrollArea.Root is `position: absolute; inset: 0` — it fills whatever the Island is,
without participating in layout. Content inside can never push the Island larger than
the flex algorithm determined. Resize, fullscreen, drag-resize — all automatic, zero
layout recalc race conditions.

```
[ISLAND]   position: relative;  flex: 1;  min-height: 0;
  [SA-ROOT]  position: absolute;  inset: 0;       ← always fills Island exactly
    [VIEWPORT] overflow: auto;
      [CONTENT]
        {app content}
```

### Full ideal tree

```
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

```
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

```
<div data-aw="island" style="position: relative">     ← still relative for consistent API
  <div data-aw="island-pad"                           ← padding wrapper (omitted when none)
       style="position: absolute; inset: 0">          ← absolute fill, same pattern as scroll
    {app content}
  </div>
</div>
```

Same absolute-fill pattern, just without the ScrollArea. Consistent mental model.

### Key changes from current → ideal

| # | Change | Why |
|---|--------|-----|
| 1 | **Merge CONTENT-ZONE + Content outer + Content inner → STAGE + LAYOUT** | 3 divs → 2. `--app-content-max-height` moves to STAGE. Chrome padding moves to STAGE. Layout mode stays on LAYOUT. |
| 2 | **Fix double ScrollArea in Island** | Island should use `ScrollArea.Root` *without* also nesting `ScrollArea.Viewport`. Either use the compound `Root` (which auto-wraps) or use `BaseScrollArea.Root` + explicit `Viewport` — not both. |
| 3 | **Absolute-position ScrollArea.Root inside Island** | Island shell is `relative`, ScrollArea.Root is `absolute inset-0`. Content can never push the Island past its flex-determined size. Resize is automatic — no layout recalc race. |
| 4 | **Ban nested `AppWindow.Content`** | Apps like PatternPlayground that render inside an Island must not re-wrap in `AppWindow.Content`. Content is a chrome-level primitive, not a layout helper. Add a dev-mode warning. |
| 5 | **Add `data-aw` debug attributes** | Every structural node gets `data-aw="window|titlebar|toolbar|stage|banner|layout|island|island-pad"`. Zero runtime cost, massive DevTools clarity. |
| 6 | **Island owns all scrolling** | Remove any `overflow-y-auto` / `overflow-auto` divs that apps add inside Islands. If an app needs no-scroll, use `<Island noScroll>`. |

### Layout modes on LAYOUT node

| `data-layout` | CSS | Use case |
|---------------|-----|----------|
| `single` | `flex flex-col` | One island, full width |
| `split` | `flex gap-1.5` | Two+ islands side by side |
| `sidebar` | `flex gap-1.5` | Fixed-width island + flex island |
| `bleed` | (none) | No padding, no island wrapper — raw children |

---

## Action items

1. Fix `AppWindowIsland` double Viewport (bug, no API change)
2. Make Island shell `position: relative`, ScrollArea.Root `position: absolute; inset: 0`
3. Apply same absolute-fill pattern to `<Island noScroll>` for consistency
4. Remove `PatternPlayground`'s nested `<AppWindow.Content>` wrapper
5. Remove `BrandAssetsApp`'s manual `overflow-y-auto` div (line 528)
6. Add `data-aw` attributes to structural nodes
7. Merge the 3-div content zone into 2 (STAGE + LAYOUT)
8. Add dev-mode `console.warn` if `AppWindow.Content` is nested inside another `AppWindow.Content`
