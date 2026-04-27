# AppWindow CSS Over-Scope Audit

Scope: `packages/radiants/components/core/AppWindow/` + `apps/rad-os/components/Rad_os/AppWindow.tsx`.
Method: JSX tree depth analysis + cross-check against `appwindow.css` (`[data-aw=...]` selectors).

## Findings

### F1: Titlebar — redundant inner row wrapper — High
- File: `packages/radiants/components/core/AppWindow/AppWindow.tsx:342-455`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="relative" data-aw="titlebar" ...>
    <div className="flex items-center gap-1 text-head pl-0.5">
      {/* buttons */}
    </div>
    <div className="flex-1 min-w-0">{navContent || <div id=... className="contents" />}</div>
    <span ...>{title}</span>
  </div>
  ```
- Proposal: drop the `className="relative"` outer + inner `flex items-center gap-1` row; the CSS already applies `flex items-center gap-3 ...` to `[data-aw="titlebar"]`. Put buttons, nav, title as direct children of `[data-aw="titlebar"]`. The `text-head pl-0.5` moves onto a single button-group `<div>` only if truly needed, otherwise delete.
- Why safe: `appwindow.css:16-18` already declares titlebar as flex row; the inner `relative` wrapper has no positioned children needing it (tooltip buttons position themselves via portals).

### F2: Titlebar nav slot — useless `<div className="flex-1 min-w-0">` when content is null — Med
- File: `AppWindow.tsx:444-447`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="flex-1 min-w-0">
    {navContent || <div id={`window-titlebar-slot-${id}`} className="contents" />}
  </div>
  ```
- Proposal: render the slot `<div id=...>` directly with `className="flex-1 min-w-0"`; drop the wrapper `<div>`. When `navContent` exists, wrap nav in the `flex-1 min-w-0` itself or give Tabs an explicit grow class.
- Why safe: the `className="contents"` on the fallback explicitly disables its own box — so the outer flex-1 wrapper is only ever there for the "no nav" case. Collapsing saves one node per render.

### F3: AppWindowBanner pass-through wrapper — High
- File: `AppWindow.tsx:531-537`
- Pattern: pass-through
- Current:
  ```tsx
  function AppWindowBanner({ children, className = '' }) {
    return <div className={className.trim()} data-aw="banner">{children}</div>;
  }
  ```
- Proposal: banner CSS is just `shrink-0` (`appwindow.css:80-82`). Either (a) expose banner as a `<Slot>`-style component that merges props onto its single child (no added node), or (b) drop `AppWindow.Banner` entirely and have consumers add `shrink-0` themselves. There's no structural value in the wrapper.
- Why safe: only one CSS rule (`shrink-0`) is associated with the node. Banner has no state or behavior.

### F4: AppWindowContent — always-added `<div data-aw="layout">` inner node — High
- File: `AppWindow.tsx:625-638`
- Pattern: duplicate-layout
- Current:
  ```tsx
  <div data-aw="stage" data-layout={layout} data-content-padding=...>
    {banners}
    <div data-aw="layout" data-layout={layout}>
      {rest}
    </div>
  </div>
  ```
- Proposal: merge `[data-aw="layout"]` styles into `[data-aw="stage"]` or render `{banners}` as a peer to stage (banner already has its own `shrink-0`). The split exists only to exclude banners from the `flex gap-1.5` layout — but banners are `shrink-0` anyway, so a single flex-col parent handles both. For `split|sidebar|three` the layout div becomes a real column/row container — there it's justified. For `single` and `bleed` it's redundant with `stage`.
- Why safe: in `single` mode, `[data-aw="stage"]` already declares `flex flex-col flex-1 min-h-0` (appwindow.css:28-30) and `[data-aw="layout"][data-layout="single"]` repeats `flex flex-col` (line 44-46). Collapse the `single`/`bleed` branch to render `{banners}{rest}` directly under stage.

### F5: AppWindowIsland — duplicate `min-h-0` on parent — High
- File: `AppWindow.tsx:566, 575, 591`
- Pattern: duplicate-layout
- Current:
  ```tsx
  // pixel branch:
  <div className={`pixel-rounded-sm ${bgClassName} ${sizeClass} min-h-0 ${className}`} />
  // sizeClass already = '... min-h-0' for both shrink-0 and flex-1 cases
  ```
- Proposal: `sizeClass` at line 549 already includes `min-h-0` in both branches — appending ` min-h-0` again on line 566 duplicates. Also `appwindow.css:64-66` sets `[data-aw="island"] { min-h-0 }` — so the class is duplicated a third time. Remove the literal `min-h-0` from line 566 and rely on CSS. Note: the pixel branch at line 565-566 doesn't emit `data-aw="island"` — unify so all islands get the attribute and let CSS handle `min-h-0`.
- Why safe: three sources of the same rule; one wins by CSS cascade. Consolidation is stylistically trivial.

### F6: AppWindowIsland noScroll branch — wrapper chain `island > island-pad[data-fill]` — Med
- File: `AppWindow.tsx:572-586`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div data-aw="island" className={`${sizeClass} ${cornerClass} ${bgClassName} ...`}>
    <div data-aw="island-pad" data-fill="true" className={paddingClass}>{children}</div>
  </div>
  ```
  - `[data-aw="island-pad"][data-fill="true"]` = `absolute inset-0 min-h-0 flex flex-col` (appwindow.css:76-78)
- Proposal: for noScroll, padding can apply directly to the island node — drop the inner `island-pad`. The `absolute inset-0` is only needed because the outer island uses `relative min-h-0` for scroll overlay positioning; without a scroll child, the inner absolute-fill is pointless.
- Why safe: noScroll means no ScrollArea is rendered, so the "island-pad must be absolutely positioned to sit above scroll content" invariant doesn't apply. Merge padding onto the island div itself.

### F7: AppWindowIsland scroll branch — `island-pad` wrapper only needed for padding — Med
- File: `AppWindow.tsx:589-599`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div data-aw="island" ...>
    <ScrollArea.Root className="" data-aw="island-scroll">
      <div data-aw="island-pad" className={paddingClass}>{children}</div>
    </ScrollArea.Root>
  </div>
  ```
- Proposal: if `paddingClass` is empty, drop the `island-pad` wrapper entirely (currently always rendered). Already done in the pixel branch (line 561: `paddingClass ? <div>...</div> : children`). Apply the same conditional to the non-pixel branch.
- Why safe: symmetric with the pattern used in the pixel branch of the same component.

### F8: AppWindowIsland pixel-branch inner wrapper duplication — Med
- File: `AppWindow.tsx:554-563`
- Pattern: duplicate-layout
- Current:
  ```tsx
  const inner = noScroll
    ? <div className={`h-full ${paddingClass}`.trim()}>{children}</div>
    : <ScrollArea.Root className="h-full" style={...}>
        {paddingClass ? <div className={paddingClass}>{children}</div> : children}
      </ScrollArea.Root>;
  return <div className="pixel-rounded-sm ...">{inner}</div>;
  ```
- Proposal: the `h-full` on the inner div duplicates what the flex parent's `flex-1 min-h-0` (from `sizeClass`) communicates. Also this branch bypasses `data-aw="island"` entirely — you get different structure between pixel and standard. Unify the branches: always emit `data-aw="island"`, let corner class be orthogonal.
- Why safe: avoiding dual code paths reduces divergence risk and lets CSS own layout.

### F9: Toolbar double-render path (chrome + no-chrome) — Low
- File: `AppWindow.tsx:505-528` (Toolbar component) + `AppWindow.tsx:1070-1079` (main shell render)
- Pattern: duplicate-layout
- Current: when inside an `AppWindowChromeCtx`, `AppWindowToolbar` returns `null` and the shell renders the toolbar via context state. When outside (tests), it renders its own `<div data-aw="toolbar">`. This means the toolbar JSX is authored twice (lines 518-524 and 1071-1078) with identical attributes.
- Proposal: extract a `<ToolbarNode>` inner component used by both paths; avoid duplicating the `className.trim()` + `data-aw="toolbar"` + `data-window-toolbar=""` shape.
- Why safe: purely a DRY refactor — no behavior change.

### F10: Resize handles — 8 absolutely-positioned sibling divs inside shell — Low
- File: `AppWindow.tsx:1086-1135`
- Pattern: wrapper-collapse (structural) / pass-through
- Current: 8 `<div>` nodes as children of the shell, each with 4 props (className, data-resize-handle, style, onPointerDown) and hard-coded class strings duplicating `absolute … cursor-…-resize z-10`.
- Proposal: extract a `<ResizeHandles />` subcomponent that returns a `<>` with the 8 handles, or a single `<div role="group">` wrapper. Also move the hard-coded `touchAction:'none'` into CSS on `[data-resize-handle]`. This isolates resize DOM from the shell body and lets a single CSS rule own the handles.
- Why safe: handles are already pure UI wiring — encapsulation doesn't change positioning or event behavior.

### F11: Inactive-window dim overlay — absolutely-positioned wrapper at sibling depth — Low
- File: `AppWindow.tsx:1041-1046`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  {!focused && isWindowPresentation ? (
    <div className="absolute inset-0 z-20 pointer-events-none rdna-pat rdna-pat--diagonal-dots"
         style={{ ['--pat-color' as string]: 'var(--color-ink)' }} />
  ) : null}
  ```
- Proposal: move to `::before` on `[data-aw="window"][data-presentation="window"]:not([data-focused])` in `appwindow.css`; eliminates the React node entirely. The only dynamic piece is `--pat-color`, which is a static custom prop — put it in the CSS rule.
- Why safe: `data-focused` is already wired on the shell (line 1039). No JS state needed; it's presentational.

### F12: Chromeless shell — identical dialog shell JSX to main shell — Low
- File: `AppWindow.tsx:958-997` vs `AppWindow.tsx:1024-1137`
- Pattern: duplicate-layout (structural)
- Current: two nearly-identical `<div ref={nodeRef} role="dialog" aria-labelledby=... data-aw="window" ...>` returns, one chromeless, one with chrome. Roughly 30 lines of attribute/data-attribute duplication.
- Proposal: one shell render with `chromeless` driving conditional children (skip `AppWindowTitleBar`, toolbar, resize handles, dim overlay). The data-attributes are already distinct via `data-chromeless` and `data-presentation`.
- Why safe: unifies two render paths; easier to keep `data-aw="window"` contract in sync.

### F13: RadOS thin wrapper — no DOM added, but prop pass-through sprawl — Low
- File: `apps/rad-os/components/Rad_os/AppWindow.tsx:77-112`
- Pattern: pass-through (prop level, not DOM)
- Current: wrapper forwards 23 props to `CoreAppWindow`. No extra DOM (good).
- Proposal: not a DOM issue. Optional: spread `{...derivedProps}` from a single hook (`useAppWindowBindings(id)`) to shrink the JSX. Noting for completeness — no CSS over-scope here.
- Why safe: wrapper is already thin; this is a readability nit only.

### F14: AppWindowContent stage always emits wrapper even when className is empty and no banners — Med
- File: `AppWindow.tsx:625-638`
- Pattern: wrapper-collapse
- Current: always renders two nested `<div>` (stage + layout) plus context provider, even when `layout='single'` with no banners and no className.
- Proposal: when `layout === 'single'` and `banners.length === 0` and `className === ''`, render `<>{rest}</>` under the depth provider. This turns the common case (single-column app body) into zero extra DOM nodes. Gate behind a feature flag if needed; measurement: this is the hottest path in every app.
- Why safe: the stage/layout CSS is only meaningful when there are multiple siblings or a non-single layout; for a single child, the child's own flex classes are sufficient.

## Summary

14 findings total: 4 High, 6 Med, 4 Low. Heaviest waste is in the `titlebar` (F1, F2), `AppWindow.Content` (F4, F14), and `AppWindow.Island` variants (F5-F8). Collapsing F1+F4+F14 alone removes 3-4 DOM nodes from every rendered window in the common case. The `appwindow.css` file is already doing most of the layout via `[data-aw=...]` — the JSX frequently duplicates those rules inline (F5) or adds wrapper nodes whose only purpose is to re-apply the same classes (F2, F3, F6, F7).

Note: F11 (pattern overlay -> `::before`) and F3 (Banner -> slot) are the two structural wins that also simplify the React tree. F10 and F12 are DRY refactors with no DOM savings but reduce drift risk.
