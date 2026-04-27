# CSS Over-scope Audit — Master Report

**Date:** 2026-04-20
**Branch:** feat/logo-asset-maker
**Scope:** Wrappers/containers that shouldn't exist or can collapse into primitives. 12 parallel agents, ~150 findings across 12 files in this directory.

Per-area reports:
`01-appwindow` · `02-modals` · `03-tabs-toolbar` · `04-button-forms` · `05-radio` · `06-brand-assets` · `07-typography` · `08-rados-shell` · `09-manifesto-pretext` · `10-pixel-studio` · `11-shared-ui` · `12-rdna-small`

---

## 1. Real bugs + confirmed lint violations (fix first, separate from refactor)

| # | Location | Class | Issue |
|---|----------|-------|-------|
| A | `packages/radiants/components/core/Toolbar/Toolbar.tsx:106-119` | runtime bug | `ToolbarSeparator` vertical variant = `h-px mx-1`, no `w-full`/`self-stretch` → renders **0-width** in vertical toolbars. |
| B | `packages/radiants/components/core/Drawer/Drawer.tsx:156-166` | lint / design-system violation (`rdna/no-pixel-border`, `rdna/no-clipped-shadow`) | `border border-line` + `shadow-floating` on `pixel-rounded-sm`. Visible border gets clipped by pixel-corners mask. |
| C | `typography-playground/UsageGuide.tsx:53`, `TypeManual.tsx:254` | footgun | `inline-block … block` — trailing `block` silently overrides `inline-block`. |
| D | `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx:62-80` | layout fragility | Absolute-positioned tab strip with `pt-11` magic-number body offset. |

## 2. Safe to delete/inline after rewiring remaining consumers

None of these are orphaned by the usual definition — each has a consumer this audit walked past. Listed here because the scope of the audit says these wrappers/files add no value once the consumer is rewired.

| Path | Remaining consumer | Action before removal |
|------|-------------------|----------------------|
| `colors-tab/ColorDetail.tsx` | `apps/rad-os/app/unused-review/page.tsx:15` (triage page) | Decide in triage whether ColorDetail keeps a real home; if not, delete from both sites. |
| `typography-playground/TypeManual.tsx` (285 LOC) | `app/unused-review/page.tsx:26` (triage page) — **not** rendered in the typography-playground app (default `'manual'` subtab → `SpecimenLayout`) | Same triage-page decision. The "not rendered in the app" angle is the actionable find. |
| `components/apps/ManifestoApp.tsx` | `lib/apps/catalog.tsx:7` (`lazy(() => import(...))`) | Inline: change the catalog's lazy import to `'@/components/apps/manifesto/ManifestoBook'`, then delete the shell. |
| `components/apps/StudioApp.tsx`, `GoodNewsApp.tsx` | `lib/apps/catalog.tsx:11`, `:9` | Same pattern — point `lazy()` at the real module, delete the shim. |
| `components/ui/index.ts` | None found | Safe to delete if no `@/components/ui` importers remain — confirm with a grep. |
| `Tabs/Tabs.tsx` — `tabsListVariants.mode.chrome` | None (internal, unreferenced CVA branch) | Delete the branch; `List` already bypasses CVA for chrome mode. |

## 3. Cross-cutting: popup/overlay wrappers — split by family before rollout

A single "every popup has shell+pad" summary is wrong. Split into three families; each has a different correct shape:

### 3a. Centered dialogs — Dialog, AlertDialog
`Popup` is fullscreen (`fixed inset-0 flex items-center justify-center`); an intermediate wrapper carries **width + margin + enter/exit animation state** (`w-full max-w-[32rem] mx-4 transition-[opacity,transform,filter] group-data-[starting-style]:…`); an inner card div owns `pixel-rounded-sm bg-page pixel-shadow-floating`.
- **Dialog.tsx:121-137**, **AlertDialog.tsx:115-131**
- The animation-state wrapper is load-bearing — it's the group target for `group-data-[starting-style]`. Don't collapse it away.
- **Possible collapse:** merge the card div into the animation wrapper (transition + surface classes on one node). That's one node saved per open dialog, not two.

### 3b. Edge sheets / drawers — Sheet, Drawer
`Popup` carries side positioning directly and `children` render as direct descendants (Sheet.tsx:148-160 is already one-node-per-surface). Drawer is the odd one out — it adds the lint violation (§1 B) and has room to tighten, but isn't shell+pad either.
- **Reference shape:** Sheet — one `Popup` with side styles and children inline.
- **Actionable:** bring Drawer in line with Sheet; fix bug B at the same time.

### 3c. Positioner-based popups/menus — Popover, Tooltip, ContextMenu, DropdownMenu, Menubar, Combobox, NavigationMenu, Select, PreviewCard
These wrap `Base*.Popup` in a `pixel-rounded-* bg-* pixel-shadow-*` surface div plus (sometimes) an inner padding div. Team 12 F1 is the real target here — collapse both inner wrappers onto `Popup`. ~16 redundant nodes across this family.

### 3d. Non-primitive occurrences
`ColorCards.tsx` × 3 (no-op inner div), `SrefCard` (triple-wrapped images), `CodeBlock`, `FontCard`, typography element-styles — these are plain wrapper-collapses, handled by per-area reports (06, 07).

## 4. High-impact shared primitive extractions

Hoist these — each absorbs 3-8 individual findings from per-area reports.

| Proposed primitive | Replaces | Consumers |
|---|---|---|
| `<SegmentGroup>` | capsule/segmented-bar pattern | Tabs.List, Toolbar.Root, ToolbarGroup, future Accordion header |
| `<ModalShell.{Header,Body,Footer,Title,Description}>` | 12 byte-identical sub-primitives duplicated 4× | Dialog, AlertDialog, Sheet, Drawer |
| `<PatternBackdrop>` | confetti-mask backdrop block | All 4 modal files (Drawer drifted to raw `duration-200`) |
| `<FormFieldShell>` / `fieldShellVariants` | `pixel-rounded-xs bg-page … pixel-border-danger` shell | Input, Select, NumberField, Input w/ icon branch |
| `<ControlLabel>` | `inline-flex items-center gap-2 …` + disabled handling | Checkbox, Radio (×2 branches), Switch |
| `<LayerRow>` / `<QuietIconButton>` | Tooltip + `Button mode="text" size="sm" iconOnly` rows | LayerPanel (×4), likely studio toolbars |
| `<Section>` | `<div className="py-1"><SectionHeader>…</SectionHeader>…</div><Separator/>` | SettingsMenu (×5) |
| `<AlphabetRows>` | uppercase/lowercase/digits/punct specimen rows | TypeManual, SpecimenLayout, BroadsheetLayout |
| `<WeightParade>` | weight specimens 1–9 | TypeManual, SpecimenLayout, BroadsheetLayout, MagazineLayout |
| `<TemplateFrame>` | `bg-inv text-flip p-[8%]` template scaffold | Document, Dictionary, Quote, Poster templates |
| `<MomentCard>` | `border border-rule p-6 space-y-*` card | MagazineLayout |
| `<MeterChannel>` | L/R mirror-image meter column | RadioEffectsRow (2 sites) |
| `<LabeledLcdSlider>` | `flex-col items-center gap-0.5` label + LcdSlider | RadioEffectsRow (SLOW/REVERB) |
| Shared thin-track slider | VolumeSlider + LcdSlider with identical shadows/fills | Radio, RadioEffectsRow |
| `<NumberStepper>` | Inline 40-LOC stepper | Pixel playground |
| Use existing `<Separator orientation="vertical">` | Hand-rolled `w-px h-4` dividers | Pixel/Studio EditorToolbars |

## 5. High-impact per-component collapses (no shared primitive needed)

- **AppWindow.Titlebar** — `.relative` + inner `flex items-center gap-1` duplicate what `[data-aw="titlebar"]` CSS already sets. (Team 01 F1)
- **AppWindow.Content** — `stage` + nested `layout` divs both apply `flex flex-col` in single/bleed layouts. (Team 01 F4/F14)
- **AppWindowIsland** — `min-h-0` declared 3× (sizeClass + literal append + CSS). (Team 01 F5)
- **Button + Toggle** — outer interactive + inner `<span data-slot="*-face">` duplicate every `data-*` attr; outer only adds focus ring. (Team 04 F1/F10)
- **Switch thumb, Slider thumb** — extra `<div>` inside Base UI render node to split "shape/color" from Base UI props. Merge. (Team 04 F6/F7)
- **Taskbar** — wraps `Toolbar.Root` in a `flex items-center justify-*` div (twice). Toolbar.Root already flexes. (Team 08 F1)
- **StartMenu** — pure ref-`<div>` around each MenuRow for position measurement. Forward ref through MenuRow. (Team 08 F4)
- **DesignSystemTab** — card merges outer `pixel-rounded-sm pixel-shadow-resting` shell with inner `bg-page p-4 flex flex-col gap-3`; also drops `overflow-auto` wrapper. (Team 11 F1-F3)
- **Alert.Root** — `<div role="alert"><div flex items-start gap-3>` → merge. Shaves a level off every Toast too. (Team 12 F24)
- **Meter** — 3 nested divs where `BaseMeter.Root` alone suffices. (Team 12 F14)
- **Breadcrumbs separators** — sibling `<span>`s → `::before` halves node count. (Team 12 F3)

## 6. Token/asset drift spotted

- `oklch(0 0 0)` hardcoded in `RadioDisc.tsx:91` + `RadioVisualizer.tsx:29` with separate eslint-disables — needs `--color-lcd-black` token. (Team 05 F10)
- Raw SVG chevrons inlined in NavigationMenu, Select, Combobox — use generated `ChevronDown`. (Team 12 F20)
- Pixel-art checkmark SVG duplicated in Checkbox, ContextMenu, DropdownMenu. (Team 12 F21)
- `border-line` vs `border-ink` drift in 3 toolbar strips (ColorsTab ×2, BrandAssetsApp fonts). (Team 06 F13)

## 7. Intentional wrappers (do not collapse)

Flagged so future sweeps don't chase them:

- **StartMenu `SubmenuPanel`, StartMenu root, SettingsMenu root** — documented `pixel-rounded-*` (sets `position: relative`) vs outer absolute positioning collision. (Team 08 F6/F7/F9)
- **MEMORY.md rule** bans `overflow-hidden` on `pixel-rounded` — this is why SettingsMenu needs a third div for scroll.

---

## Suggested rollout

1. **Bugs + lint violations first** (section 1) — one PR. Toolbar vertical separator, Drawer pixel-border/clipped-shadow, UsageGuide/TypeManual `inline-block block` collisions, PixelPlayground magic offset.
2. **Unused-review triage pass** (section 2) — decide per entry whether the `/unused-review` page loses sections or the catalog shims get inlined. Execute deletions + catalog rewiring in one PR so the triage page doesn't break.
3. **Modal family in one pass** (sections 3a + 3b + §4 `ModalShell` + `PatternBackdrop`) — extract the shared primitives **while** collapsing the wrappers. Reopening Dialog/AlertDialog/Sheet/Drawer twice would be churn. Include Drawer's lint fix here too.
4. **Positioner-based popup family** (section 3c) — one PR per cluster (menu-family, tooltip-popover, combobox/select) to keep diffs reviewable.
5. **`SegmentGroup` extraction** (§4) — Tabs + Toolbar both refactor onto it.
6. **Remaining shared primitive extractions** (§4) — `FormFieldShell`, `ControlLabel`, typography primitives, radio primitives, etc. One PR per primitive; batch typography and radio within their own app dirs.
7. **Per-component collapses** (section 5) — batch by directory.

All per-area reports are in this directory; each finding has `file:line` refs, before/after snippets, and a "why safe" line.
