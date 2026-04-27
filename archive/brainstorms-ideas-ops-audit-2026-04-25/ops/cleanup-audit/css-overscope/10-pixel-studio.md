# Pixel Playground + Studio CSS Over-Scope Audit

Scope:
- `apps/rad-os/components/apps/pixel-playground/**/*.tsx`
- `apps/rad-os/components/apps/studio/**/*.tsx`

Method: JSX wrapper-depth walk starting from `PixelPlayground.tsx` and `PixelArtEditor.tsx` (studio root), cross-checked against the `AppWindow.Island`/`AppWindow.Content` primitives and against the `Toolbar`/`ToggleGroup` output.

## Findings

### F1: PixelPlayground left-island absolute-tab shim — High
- File: `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx:62-80`
- Pattern: wrapper-collapse | duplicate-layout
- Current:
  ```tsx
  <div className="relative h-full min-h-0">
    <div className="absolute top-0 left-0 right-0 z-10 px-3 py-2 border-b border-line bg-card">
      <ModeNav ... />
    </div>
    <div className="h-full pt-11 flex flex-col min-h-0">
      ...body...
    </div>
  </div>
  ```
- Proposal: collapse to a normal column: `<div className="flex flex-col h-full min-h-0"><div className="shrink-0 px-3 py-2 border-b border-line bg-card"><ModeNav/></div>...body with flex-1 min-h-0 overflow-y-auto...</div>`. The `absolute`+`pt-11` magic-number trick is only needed if the tabs must overlap something — they don't.
- Why safe: body already contains its own scroll region (`flex-1 min-h-0 overflow-y-auto` at :122); promoting tabs to a normal `shrink-0` sibling removes the `relative`/`absolute`/`z-10`/`pt-11` quartet and the fragile matching-height assumption.

### F2: PixelPlayground center-island column — pass-through wrapper — Med
- File: `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx:148-160`
- Pattern: pass-through
- Current:
  ```tsx
  <AppWindow.Island corners="pixel" padding="none" noScroll>
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 flex">
        <OneBitCanvas .../>
      </div>
      <div className="shrink-0 flex items-stretch border-t border-rule">...</div>
    </div>
  </AppWindow.Island>
  ```
- Proposal: `AppWindow.Island` already renders a full-height column when `padding="none" noScroll`; children can target it directly. Drop the two inner `flex flex-col h-full min-h-0` + `flex-1 min-h-0 flex` wrappers — `OneBitCanvas` itself applies `w-full h-full min-w-0 min-h-0 bg-depth flex items-center justify-center` (OneBitCanvas.tsx:73) and will absorb the available space.
- Why safe: duplicated `min-h-0`/`flex` chains are defensive, but `AppWindow.Island` already owns the inner layout contract; and `OneBitCanvas`'s root sizes itself. No content needs the intermediary to clip.

### F3: PixelPlayground bottom toolbar row — 3 wrappers for 2 items — Med
- File: `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx:162-173`
- Pattern: duplicate-layout | primitive-has-it
- Current:
  ```tsx
  <div className="shrink-0 flex items-stretch border-t border-rule">
    <div className="shrink-0 p-1.5">
      <ToolPalette .../>
    </div>
    <div className="flex-1 min-w-0 border-l border-rule">
      <EditorToolbar .../>
    </div>
  </div>
  ```
- Proposal: hoist the row to a single `<div className="shrink-0 flex items-stretch border-t border-rule divide-x divide-rule">` and let each child own its own padding. `ToolPalette` renders a `ToggleGroup` (already padded visually by item internals) — the extra `p-1.5` shim can live inside `ToolPalette` if needed, and `EditorToolbar` already applies `h-full flex items-center gap-1 px-2` (EditorToolbar.tsx:21).
- Why safe: `divide-x` replaces the inner `border-l` + outer `border-t`; moving the padding hint into the leaf removes one div per child.

### F4: PixelPlayground right-island column — pass-through wrapper — Med
- File: `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx:184-192`
- Pattern: pass-through
- Current:
  ```tsx
  <AppWindow.Island width="w-[18rem]" corners="pixel" padding="none" noScroll>
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 flex flex-col p-3 gap-2"><ModePreview .../></div>
      <div className="h-48 shrink-0 border-t border-rule"><PixelCodeOutput .../></div>
    </div>
  </AppWindow.Island>
  ```
- Proposal: same as F2 — `AppWindow.Island padding="none" noScroll` already owns `h-full flex flex-col min-h-0`; drop the first inner `<div>`. Also: `PixelCodeOutput`'s own root applies `h-full flex flex-col min-h-0 max-h-full overflow-hidden` (PixelCodeOutput.tsx:35) and its children declare their own `border-b/border-t`. The `h-48 shrink-0 border-t` wrapper duplicates borders the child already paints (PixelCodeOutput.tsx:36) — lift only the size (`h-48`) onto `PixelCodeOutput` via prop or move the sizing to `AppWindow.Island`'s internal layout slot.
- Why safe: duplicated `min-h-0 flex flex-col` is already provided by `AppWindow.Island`; the border is already declared inside the code-output header, so the surrounding `border-t` is double-lining when the two align.

### F5: Studio PixelArtEditor left canvas — centering wrapper duplicates Island — Med
- File: `apps/rad-os/components/apps/studio/PixelArtEditor.tsx:90-107`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="flex-1 min-w-0 min-h-0 flex items-center justify-center">
    <AppWindow.Island
      width="h-full aspect-square max-w-full"
      corners="pixel" padding="none" noScroll
    >
      <CanvasArea ... />
    </AppWindow.Island>
  </div>
  ```
- Proposal: if `AppWindow.Content layout="three"` were `display: grid; place-items: center` (or if the canvas slot used `place-self: center`), the `flex-1 min-w-0 min-h-0 flex items-center justify-center` wrapper collapses. Alternatively mark this slot on Island itself (e.g. `centered` prop) instead of wrapping every usage. Note the `width` prop value on Island is being abused to pass `h-full aspect-square max-w-full` — that's a smell that the current API can't express "square canvas" without a wrapping `flex`.
- Why safe: `CanvasArea` (CanvasArea.tsx:26) already wraps a `w-full h-full ... flex items-center justify-center` with another `aspect-square max-w-full max-h-full` child; the outer `flex items-center justify-center` in `PixelArtEditor` duplicates what `CanvasArea` and the child Island together already do.

### F6: Studio CanvasArea — double centering wrapper — High
- File: `apps/rad-os/components/apps/studio/CanvasArea.tsx:25-52`
- Pattern: duplicate-layout
- Current:
  ```tsx
  <div className="w-full h-full min-w-0 min-h-0 bg-depth flex items-center justify-center">
    <div className="aspect-square max-w-full max-h-full h-full w-auto">
      <Dotting width="100%" height="100%" ... />
    </div>
  </div>
  ```
- Proposal: collapse to one element — `<Dotting className="block mx-auto my-auto aspect-square max-w-full max-h-full h-full w-auto bg-depth" ... />` or keep a single container that does both jobs: `<div className="w-full h-full bg-depth grid place-items-center"><Dotting className="aspect-square max-w-full max-h-full h-full" /></div>`. (Identical issue exists in `OneBitCanvas.tsx:73-98`.)
- Why safe: `place-items-center` on a grid parent does exactly what the flex-center + aspect-square child pair is doing today; `<Dotting>` receives `width="100%" height="100%"` so sizing is delegated to its parent in either shape.

### F7: Studio right Island tool column — redundant column div — Low
- File: `apps/rad-os/components/apps/studio/PixelArtEditor.tsx:110-116`
- Pattern: pass-through
- Current:
  ```tsx
  <AppWindow.Island width="w-44" corners="pixel" padding="sm" noScroll>
    <div className="flex flex-col gap-2">
      <ToolPalette .../>
      <Separator />
      <ColorPalette .../>
    </div>
  </AppWindow.Island>
  ```
- Proposal: If `AppWindow.Island padding="sm"` already lays its body as a column (or gains a `stack="col"` prop), the inner `flex flex-col gap-2` drops. Also: with only 3 children and `<Separator/>` already bringing spacing, `gap-2` may be redundant.
- Why safe: `Separator` provides vertical rhythm by itself; the column wrapper is purely cosmetic.

### F8: LayerPanel row — 4 Tooltip+Button pairs that should be a `<LayerRow>` primitive — High
- File: `apps/rad-os/components/apps/studio/LayerPanel.tsx:84-164`
- Pattern: duplicate-layout
- Current: a 78-line per-row JSX block — name span + 4 `<Tooltip><Button mode="text" size="sm" iconOnly .../></Tooltip>` pairs, each with identical `onClick={(e) => { e.stopPropagation(); ...; }}` boilerplate. Move-up reuses `chevron-down` with `rotate-180` inline (L108) instead of a `chevron-up` icon.
- Proposal: hoist to a single primitive row — either a `<LayerRow>` component in this file or a generic `<ToolRow left={<Name/>} actions={[{icon,label,disabled,onClick}]} />` primitive shared with other panels. Internally, `Tooltip` + `Button mode="text" size="sm" iconOnly` can be wrapped into a `<QuietIconButton tooltip="...">` to kill 4 repetitions. Also: replace the inline `<span className="rotate-180 inline-flex"><Icon name="chevron-down"/></span>` with the real `chevron-up` icon or a `Button` flip prop.
- Why safe: the 4 actions share identical props + `stopPropagation` pattern; extracting is a pure refactor with no visual change. The `rotate-180 inline-flex` wrapper vanishes once a real icon is used.

### F9: LayerPanel row wrapper — manual role=button instead of primitive — Med
- File: `apps/rad-os/components/apps/studio/LayerPanel.tsx:85-96`
- Pattern: primitive-has-it
- Current:
  ```tsx
  <div role="button" tabIndex={0}
       onClick={...}
       onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCurrentLayer(layer.id); }}
       className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer transition-colors ${isCurrent ? 'bg-active' : 'hover:bg-hover'}`}>
  ```
- Proposal: use the existing RDNA list-row primitive (`RegistryList` does similar work with a real `<button>` + eslint-disable at pixel-playground/RegistryList.tsx:22,41) or wrap in `ListItem` / `ToggleGroup.Item`. That moves key handling, active/hover, and focus-ring out of the row and removes the `role="button" tabIndex={0}` pattern plus the manual `onKeyDown` handler.
- Why safe: native `<button>` already handles Enter/Space; `transition-colors` + hover state come free from `Button`/`ListItem`.

### F10: PixelPlayground ModeNav — Button used as ToggleGroup — Low
- File: `apps/rad-os/components/apps/pixel-playground/ModeNav.tsx:13-27`
- Pattern: primitive-has-it
- Current: `<div className="flex flex-wrap gap-1"> {modes.map(cfg => <Button quiet={mode !== cfg.mode} size="sm" compact onClick={...}>{cfg.label}</Button>)}</div>`
- Proposal: replace with `<ToggleGroup size="sm" value={[mode]} onValueChange={...}>` — the selected-vs-quiet mapping is precisely what ToggleGroup.Item ships. Kills the manual `quiet={mode !== cfg.mode}` ternary and the `flex flex-wrap gap-1` wrapper (ToggleGroup lays itself out).
- Why safe: exact same primitive used by `ToolPalette.tsx:20` for the same pick-one-of-N pattern.

### F11: PixelPlayground size stepper — ad-hoc row — Low
- File: `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx:81-120`
- Pattern: duplicate-layout
- Current: 40-line inline stepper (`flex items-center gap-2` + label + `Button minus` + number span + `Button plus`).
- Proposal: hoist to a `<NumberStepper label="Size" value min max onChange/>` primitive. The `font-mono text-sm tabular-nums min-w-[2ch] text-center text-main` value span is already a pattern — centralising it also fixes the `text-sm` that is a deliberate RDNA allowance (per MEMORY.md) but easy to lose.
- Why safe: pure refactor, zero visual change; same widget will recur for icon sizes etc.

### F12: Studio EditorToolbar — local `<Divider/>` reinvents Separator — Low
- File: `apps/rad-os/components/apps/studio/EditorToolbar.tsx:23-25`
- Pattern: primitive-has-it
- Current: `function Divider() { return <div className="w-px h-4 bg-rule mx-1 shrink-0" /> }` — used 6 times in the same file.
- Proposal: use `Separator orientation="vertical"` from `@rdna/radiants/components/core` (already imported in LayerPanel.tsx:5). Kills the per-file primitive and the magic `w-px h-4 bg-rule mx-1`.
- Why safe: the existing `Separator` primitive supports vertical orientation; visual parity with other panels improves.

### F13: PixelPlayground EditorToolbar — inline dividers reinvent Separator — Low
- File: `apps/rad-os/components/apps/pixel-playground/EditorToolbar.tsx:43,54`
- Pattern: primitive-has-it
- Current: `<span aria-hidden className="self-stretch w-px bg-rule mx-1" />`
- Proposal: same as F12 — swap for `<Separator orientation="vertical" />`.
- Why safe: unifies two divergent divider implementations (studio uses `h-4`, pixel-playground uses `self-stretch`) onto the shared primitive.

## Summary

Pixel Playground and Studio share a consistent over-wrapping pattern: every `AppWindow.Island` child re-declares `flex flex-col h-full min-h-0`, canvases are double-centered, and bottom toolbars stack 3+ wrappers to host two children. The biggest wins:

1. **Canvas centering (F5/F6)** — two levels of `flex items-center justify-center` + `aspect-square` wrappers in both apps. A single `place-items-center` on the Island (or a `centered` prop) collapses ~6 divs across the two editors.
2. **Island body columns (F2/F4/F7)** — `AppWindow.Island padding="none" noScroll` should own the column layout; every child re-adds `flex flex-col h-full min-h-0`. Either teach Island to do it or drop the duplicates.
3. **LayerPanel rows (F8/F9)** — 78 lines of repeated `Tooltip+Button mode="text" size="sm" iconOnly` per row, plus a hand-rolled `role="button" tabIndex=0` row wrapper. A `<LayerRow>` or shared `<QuietIconButton>` pulls this down to <20 lines.
4. **Divider reinvention (F12/F13)** — both EditorToolbars ship local dividers instead of using `Separator`.
5. **Toolbar top-row (F3)** — two wrappers around `ToolPalette` + `EditorToolbar` can collapse to one `divide-x` row.
6. **ModeNav / size stepper (F10/F11)** — ToggleGroup and a NumberStepper primitive both exist-or-should-exist and would replace ad-hoc `flex`-of-Button rows.

Secondary: `PixelPlayground.tsx:62-80` uses an `absolute`/`pt-11` height-match trick that should collapse into a normal `shrink-0` header sibling (F1).

Path: `/Users/rivermassey/Desktop/dev/DNA-logo-maker/ops/cleanup-audit/css-overscope/10-pixel-studio.md`
