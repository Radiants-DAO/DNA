# Todo Rollup — Source Sessions (2026-04-25)

Compiled from 8 Claude sessions (last week) that ended with "verified todo
list" snapshots. Each section reproduces the **last assistant message**
verbatim — that is the canonical re-entry artifact for the session.

This file is the INPUT to a verification/dedup pass. The output of that
pass lives in `ROLLUP.md` in this directory.

| Session | Date | Topic | Section |
|---|---|---|---|
| `19601cd4` | 04-24 13:39 | Op-status snapshot — Studio rail refactor | [Section 1](#1-19601cd4--studio-rail-refactor-op-status) |
| `0e924415` | 04-24 06:41 | Knip/depcruise/refactor cleanup audit | [Section 2](#2-0e924415--cleanup-audit-rollup) |
| `e07d496c` | 04-24 09:35 | Over-scoped CSS audit — primitive extractions | [Section 3](#3-e07d496c--over-scoped-css-audit) |
| `23a81cc7` | 04-24 09:37 | Box/filter shadow grep — light-mode shadow consolidation | [Section 4](#4-23a81cc7--shadow-consolidation--dead-code) |
| `a1f2afb2` | 04-24 09:36 | Light↔dark color mapping — glow alpha consolidation | [Section 5](#5-a1f2afb2--color-mapping--glow-alpha) |
| `bb64ca66` | 04-24 06:41 | Pre-launch backwards-compat sweep | [Section 6](#6-bb64ca66--backwards-compat-sweep) |
| `2c3f5f06` | 04-24 06:41 | Desktop icon sizing + knip leftovers | [Section 7](#7-2c3f5f06--desktop-icons--knip-leftovers) |
| `d51f5119` | 04-24 09:46 | Five-team verification rollup against `e07d496c` | [Section 8](#8-d51f5119--five-team-verification-rollup) |

---

## 1. `19601cd4` — Studio rail refactor (op-status)

> Note: This session's "todos" are an op-status snapshot, not a remaining-work
> list. Persisted to `ops/session-status.md`. Reproduced here for completeness.

```markdown
## Session Status — 2026-04-24 13:40

**Plan:** no active plan (ad-hoc Studio rail refactor)
**Branch:** `feat/logo-asset-maker`

### Completed
- [x] Ripped rails: one rounded drawer + inner dark-mode LCD island (no cream lip / yellow crossbars)
- [x] Content-driven width via RailContentMeasurer + maxWidth; content-driven height via in-flow drawer
- [x] Top-aligned rails at TOP_INSET + toolbarHeight; 8px TUCK_PX into window + 4px extra anchored padding + checkerboard window-shadow strip
- [x] Drop shadow = main window's pat-pixel-shadow + translate(0, 4px) on all sides
- [x] Drawer padding halved (p-1); island padding removed; drawer bg = bg-accent (yellow)
- [x] Multi-slot-per-side (React.useId keys); vertical surfaces stack via verticalStackOffsets (height + chrome + 8px gap)
- [x] Footer → StudioBottomRail using @rdna/ctrl
- [x] Studio: Tools (single col) + Colors on LEFT; Layers/Export on right; Status bottom
- [x] Tabs: top-anchored, widened with TAB_TUCK_PX (12) + zIndex:-1 to sit behind drawer; rotated labels face drawer
- [x] 32/32 AppWindow tests pass

### In Progress
- ~none~ — last batch uncommitted

### Next Action
> Verify visually: two stacked left drawers (Tools + Colors) with vertical tab labels; right Layers drawer; bottom Status rail; tabs tuck ~12px behind their drawer.
```

**Status carries forward** — see `ops/session-status.md` for the live snapshot.

---

## 2. `0e924415` — Cleanup audit rollup

```markdown
## Remaining Cleanup Audit TODOs (verified against current code)

**User-judgement gated (from original rollup):**

- [ ] **Item #7** — ctrl-preview DAW tokens. `apps/rad-os/app/ctrl-preview/page.tsx` still has **2 `bg-black`** uses (audit flagged 6 — some resolved). Needs new `--color-ctrl-surface` semantic token introduced into `@rdna/ctrl` design vocab. Decision: token name + value.
- [ ] **Item #10** — `dark.css` pure-white audit (per-site visual QA). Not yet touched.
- [ ] **Item #11 / REACT-002** — Brand-showcase escape hatches. `ColorCards.tsx` + `FibonacciMosaic.tsx` still carry `rdna/prefer-rdna-components` disables on raw `<button>`/clickable `<div>` sites. Decision: extract `<InteractiveRow>` primitive vs. keep file-top escape hatch.
- [ ] **Item #13** — Slider math dedup. Both `packages/ctrl/controls/Slider/Slider.tsx` (15.3K) and `packages/radiants/components/core/Slider/Slider.tsx` (6.8K) present. Decision: extract shared `useSliderDragMath` hook vs. keep split (DAW vs. general audiences).
- [ ] **Item #14** — `dark.css` `!important` triage. Still **93 occurrences** in `packages/radiants/dark.css`. Long-running — triage per-site.
- [ ] **Item #16** — RadioDisc `DNA-999` placeholder issue IDs. Still **3 sites** in `RadioDisc.tsx` (lines 90, 92, 178), plus `Spinner.tsx:112` and `PixelIcon.test.tsx:73`. Also **4 `DNA-001` placeholders** in `Desktop.tsx`, `UILibrarySidebar.tsx`, `DesignSystemTab.tsx`, `InvertOverlay.tsx`. Decision: real issue-tracker destination (Linear? GitHub?).

**Pre-existing TS errors (orthogonal — not from audit):**

- [ ] **TS2307** — `.next/types/validator.ts:98` references `app/unused-review/page.js`. The `app/unused-review` directory **does not exist** in source. Stale Next build cache. Fix: delete `apps/rad-os/.next/types/` and rebuild. Should auto-resolve.
- [ ] **TS2540 × 9** — `apps/rad-os/lib/icon-conversion-review.ts:142, 173, 175` — assigning to readonly properties `half`/`int`/`other`. Needs a struct-shape fix (make writable or restructure).
- [ ] **TS2322** — `packages/radiants/components/core/AppWindow/AppWindow.tsx:1014` — `wrapperStyle` literal missing required `--app-content-max-height`. Add it to the branch or narrow the type.

**Moot / superseded:**

- ~~Item #19 LogoMaker file-top comment~~ — `LogoMaker.tsx` was refactored to canvas-only; raw-button sites moved to `LogoMakerControls.tsx`. My file-top comment is gone (replaced by a canvas-only docblock). If the raw buttons moved to Controls, the exception bucket may need re-documenting there — worth a quick re-audit.

**Note on the monolithic commit:** `a0cd11e7` bundled all my cleanup with your concurrent in-flight work (`base.css` scrollbar badge, `Button.tsx` CVA collapse, later `Tabs.tsx` `indicator` prop, `Pattern` import, `IconCell` barrel addition, LogoMaker refactor). History rewrite is no longer safe.
```

---

## 3. `e07d496c` — Over-scoped CSS audit

```markdown
# Remaining TODOs — verified against current tree

## Shared-primitive extractions (not done)
- [ ] **FormFieldShell / `fieldShellVariants`** — `pixel-rounded-xs bg-page … pixel-border-danger` shell still inlined in `Input/Input.tsx`, `Select/Select.tsx`, `NumberField/NumberField.tsx`
- [ ] **ControlLabel** — `<label className="inline-flex items-center gap-2 …">` + disabled styling duplicated across `Checkbox/Checkbox.tsx` (Checkbox + Radio branches) + `Switch/Switch.tsx`
- [ ] **LayerRow / QuietIconButton** — 4× Tooltip+`Button mode="text" size="sm" iconOnly` in `apps/rad-os/components/apps/studio/LayerPanel.tsx`
- [ ] **Section** — `<div className="py-1"><SectionHeader>…</SectionHeader>…</div><Separator />` pattern (6 occurrences in `Rad_os/SettingsMenu.tsx`)
- [ ] **Typography primitives** — `AlphabetRows`, `WeightParade`, `TemplateFrame`, `MomentCard` (spans 4 files in `typography-playground/`)
- [ ] **Radio primitives** (`MeterChannel`, `LabeledLcdSlider`, shared thin-track slider) — **partially obsolete**: much radio logic migrated to `packages/ctrl/`; needs re-audit before execution

## Per-component collapses (not done)
- [ ] **Switch thumb wrapper** — `Switch/Switch.tsx:125-132` extra `<div>` inside Base UI render node
- [ ] **Slider thumb wrapper** — `Slider/Slider.tsx:163-184` same pattern
- [ ] **Taskbar** — lines 175 + 248 still wrap `<Toolbar.Root>` in `<div className="flex items-center justify-*">`
- [ ] **StartMenu MenuRow ref-div** — pure-ref `<div>` for position measurement (audit F4)
- [ ] **DesignSystemTab card merge** — 3-way nested div collapse in `apps/rad-os/components/ui/DesignSystemTab.tsx`
- [ ] **Alert.Root flattening** — `<div role="alert"><div flex items-start gap-3>` → merge
- [ ] **Meter** — 3 nested divs where `BaseMeter.Root` alone suffices
- [ ] **Breadcrumbs separators** — sibling `<span>`s → `::before`
- [ ] **ColorCards no-op inner divs** — verified still present: `ColorCards.tsx:13-14` (`BrandColorCard`) + two sibling components
- [ ] **SrefCard triple-wrapped images** — `BrandAssetsApp.tsx`

## Token drift
- [ ] **`oklch(0 0 0)` → `--color-lcd-black`** — still at `RadioDisc.tsx:91` + **new occurrences** in `packages/ctrl/` (LEDProgress.css, LCDScreen.css, TransportPill.css+.tsx, Dropdown.tsx, Tooltip.tsx) that didn't exist at audit time
- [ ] **Raw SVG chevrons** — still inline in NavigationMenu/Select/Combobox (no `ChevronDown` icon import found)
- [x] ~~Duplicated pixel-art checkmark~~ — **ALREADY DONE**: all call sites use `<BitmapIcon name="checkmark" size={16}>`
- [ ] **`border-line` vs `border-ink` drift** — 2 occurrences each in `brand-assets/` toolbars

## Stale tests (still red)
- [ ] `Dialog.test.tsx:89` — queries removed `.bg-hover` class
- [ ] `Sheet.test.tsx:88` — same
- [ ] Broader fix: choose a stable backdrop selector (`[data-rdna="backdrop"]` or similar) and update both tests

## Audit scope gaps
- [ ] **`packages/ctrl/` never audited** — sprouted since the scan (LEDProgress, Meter, LCDScreen, TransportPill, Dropdown, Tooltip). Contains its own `oklch(0 0 0)` literals and likely its own wrapper bloat.
- [ ] **DESIGN.md prose drift** — describes the old two-node Button/Toggle authoring model (post-collapse docs stale)
- [ ] **TypeManual.tsx** (285 LOC) still exists, only rendered in `app/unused-review/page.tsx` — triage decision pending
- [ ] **ColorDetail.tsx** — same triage

## Deferred by agents (intentional)
- [ ] **AppWindow F11** — inactive-dim overlay → `::before` (JSDOM test-flakiness blocker)
- [ ] **AppWindow F13** — RadOS wrapper prop count (out of scope, no DOM impact)

**Biggest remaining wins by impact**: FormFieldShell (3 primitives), ControlLabel (3 primitives), packages/ctrl/ audit (unknown, potentially big), Taskbar double-wrap (visible on every render), Switch/Slider thumb (consistency with Button/Toggle collapse).
```

---

## 4. `23a81cc7` — Shadow consolidation + dead code

```markdown
## Remaining todos

### A. Safe deletes (no user decision needed)

1. `apps/rad-os/components/apps/brand-assets/colors-tab/ColorDetail.tsx` — **verified zero imports** anywhere.
2. `apps/rad-os/components/Rad_os/WindowTitleBar.tsx` + remove `export { WindowTitleBar }` from `Rad_os/index.ts:3` — **verified barrel-only**, only the export line references it.
3. Typography-playground extras (TypographyPlayground doesn't import any of them; nothing else does either):
   - `typography-playground/TypeManual.tsx`
   - `typography-playground/TypeStyles.tsx`
   - `typography-playground/TemplatePreview.tsx`
   - `typography-playground/PlaygroundControls.tsx`
   - `typography-playground/layouts/BroadsheetLayout.tsx`
   - `typography-playground/layouts/MagazineLayout.tsx`
   - `typography-playground/typography-data.ts` (worth double-checking before deleting)

### B. Needs your decision

4. **Pretext subsystem** — 15 files in `apps/rad-os/components/apps/pretext/` (plus 3 primitive subdirs) have **zero imports outside tests**. Kill or keep? *Previously asked — still pending.*

### C. Safe prop/default simplifications

5. **Flip `AppWindow.contentPadding` default to `false`** — verified all 7 catalog entries explicitly pass `false`. Remove per-entry overrides in `lib/apps/catalog.tsx` once default flips.
6. Delete dead prop surfaces (verified zero live call sites):
   - `Button.focusableWhenDisabled`
   - `Menubar.modal` default-path (sole caller omits)
   - `Spinner.completed` (checkmark branch never renders)
   - `Combobox.autoHighlight` (Combobox has zero live callers at all — whole component may be dead, verify separately)
7. Remove `resizable` field from catalog entries — agent says always `true`; verify before removing.

### D. CSS token retirement

8. Strict-orphan tokens from agent 3 (no `var()` consumer, no Tailwind utility generation):
   - Semantic colors: `--color-action-accent/secondary/destructive`, `--color-active-overlay`, `--color-content-heading/link/secondary`, `--color-ctrl-active/rule`, `--color-edge-focus/hover/muted`, `--color-error-red`, `--color-focus-state`, `--color-hover-overlay`, `--color-surface-elevated/muted/tertiary/overlay-medium/overlay-subtle`, `--color-warning-yellow`
   - Fonts: `--font-blackletter-inline`, `--font-waves-tiny`
   - Ctrl: `--ctrl-row-height`, `--ctrl-size-sm/md/lg`
   - Base/motion: `--density-scale`, `--touch-target-default`, `--duration-scalar`, `--easing-default`, `--easing-spring`
   - Focus ring: `--focus-ring-color/offset/width`
   - All `--z-index-*` (8 tokens)

   ⚠️ Note: the agent ran against the OLD `dark.css`. Since dark.css has been heavily edited since, re-verify at least the token refs for `--color-surface-*` / `--color-content-*` / `--color-edge-*` / `--color-ctrl-*` against the current file before deleting.

### E. Verified NOT dead (cross off agent suspicions)

- `Rad_os/Desktop.tsx` — **live**, imported by `RadOSDesktop.tsx:2`. WebGLSun/ZoomRects cascade does not apply.

### F. Skipped (high blast radius — not for last-minute push)

- Deprecated `AppWindowBody / SplitView / Pane` exports (LEGACY-002)
- `useTabsState` deprecated hook (LEGACY-003)
- `Input.iconName` deprecated prop (LEGACY-004) — worth checking if still relevant
- `AppWindow` titlebar portal-slot fallback (LEGACY-006)
- `pretext/legacy.ts` — covered by (4)
```

---

## 5. `a1f2afb2` — Color mapping + glow alpha

```markdown
### Concrete, unambiguous todos

1. **Glow alpha scale consolidation** — dark.css has **27 inline `oklch(0.9126 0.1170 93.68 / X)`** (sun-yellow) and **12 inline `oklch(0.9780 0.0295 94.34 / X)`** (cream) literals. Replace with named tokens (`--glow-sun-yellow-{20,40,60,…}`, `--glow-cream-{12,20,35,…}`). ~40 LOC saved, readability + discoverability win. Low risk, internal to dark.css.

2. **DESIGN.md is stale in 4 places** (`packages/radiants/DESIGN.md:232-244`):
   - `--color-flip` says dark = **ink**; runtime says **cream** (dark.css:73)
   - `--color-mute` says dark = cream/60; runtime says **sun-yellow/60** (dark.css:72)
   - `--color-line` says dark = cream/20; runtime says **sun-yellow/20** (dark.css:80)
   - `--color-rule` says dark = cream/12; runtime says **sun-yellow/12** (dark.css:81)
   Doc-only fix. Decision required on flip: keep runtime (cream) or change runtime to match doc (ink).

3. **`inv`/`flip` semantic fix** (blocked on #2) — once spec is reconciled, decide whether to actually flip the tokens in dark mode + audit the override scaffolding. User-flagged as "not low-risk until spec is reconciled."

4. **Verify `/color-mapping` page** after recent token changes — should re-check that swatches render the new sun-yellow-ified dark values correctly. 5-min visual QA.

### Ctrl follow-ups the last round flagged

5. **`TransportPill` inline warnings** — other raw CSS in its tsx (padding/gap spacing at lines 106-107) still emits warnings per the first agent's report. Not color-related; RDNA spacing enforcement.

6. **`ChannelBar.peakCapColor` internal type** — still `string`, could rename to `peakCapColorValue` for clarity now that the public API is an enum. Cosmetic.

### Earlier Tier 2 "maybe later"

7. **Card/Switch inset box-shadow bevels** at `base.css:859-882` — move from base.css into component-owned `@layer components` (architecture/ownership, not deletion). ~24 LOC relocated.

8. **Scrollbar styling extraction** from base.css (~66 LOC) — relocate to its own `scrollbar.css` or component-layer. Organizational.

### Tier 3 (user said "skip for now" but tracking)

9. **Prune 44 unused patterns from `patterns.css`** — 9 of 51 patterns are actually used. ~120 LOC. Requires editing the registry at `packages/radiants/scripts/generate-pattern-css.ts` too.

10. **Consolidate `fonts.css` + `fonts-core.css` + `fonts-editorial.css`** — split was for lazy-load but `@theme` blocks duplicate. ~35 LOC.

11. **Refactor 6-deep `:not()` button hover selectors** in base.css to positive `[data-state]` selectors. Specificity fix, not LOC savings. Medium risk.

### Housekeeping

12. **Archive doc drift** — `archive/reports/2026-03-27-production-readiness-checklist.md:136` has a stale "verified intentional" note about the `[data-theme]` pattern we deleted. Low priority, archive.

### Audit-flagged but **deferred** (user said "not cleanup")

- Long-form semantic token tiers (`--color-content-*`, `--color-edge-*`, `--color-action-*`, `--color-status-*`) — part of the public contract surface per README + Figma tokens; keep.
- `animations.css` — confirmed in use (`Toast.tsx:243`, package entry); keep.
- Tailwind preflight duplicates in base.css — base.css is exported as a standalone import, resets are part of its contract; keep.
- Shadow utility mode overrides (dark.css:308-341) — Tailwind v4 build-time limitation; unavoidable.
```

---

## 6. `bb64ca66` — Backwards-compat sweep

```markdown
**Verified remaining todos** (checked against current code):

1. **Docs reference dead shadow tokens** ✅ confirmed
   - `apps/rad-os/SPEC.md:369-371` — still shows `--shadow-btn`, `--shadow-btn-hover`, `--shadow-card`
   - `docs/theme-spec.md:289, 303, 346-348, 623` — `--shadow-card` / `--shadow-btn` referenced as live examples

2. **Color accent aliases still live** ✅ confirmed, narrower than first estimate
   - `--color-accent`, `--color-accent-inv`, `--color-accent-soft`, `--color-danger`, `--color-success`, `--color-warning` defined in `tokens.css:114-119`
   - **36 className usages across 18 app files** (regex tightened to actual Tailwind utility form `bg-accent`, `text-danger`, etc.) — scale is manageable but still a multi-file migration

3. **`ICON_ALIASES` still exists** ✅ confirmed, but moved
   - `generated-aliases.ts` was deleted in commit `06d5f215`, but the map relocated into `packages/radiants/icons/manifest.ts:17` and is consumed at `manifest.ts:5300`. Same audit required: grep old-name usage, then strip entries.

4. **`no-clipped-shadow.mjs:29` comment** ✅ confirmed stale
   - Still reads `shadow-inner` (which no longer exists as a token). Should be `shadow-inset`.

**Not on previous list, but surfaced:**
- `manifest.ts:4` comment references `legacy scripts/generate-icons.ts` — that script was deleted; comment is stale.
```

---

## 7. `2c3f5f06` — Desktop icons + knip leftovers

```markdown
**Canvas size fix** — ✅ both files applied (CanvasArea was simplified further; OneBitCanvas has the flex + aspect-square pattern)

**Studio flex/toolbar work** — superseded. PixelArtEditor was rewritten to use a right-side dock via `useControlSurfaceSlot` instead of an inline Island. Canvas parent still `flex-1` (line 228). The toolbar flex-grow / min-w-10 / basis-0 tuning no longer applies because the toolbar isn't a flex sibling anymore.

**Still open from knip:**

Unused files (20 — not yet deleted):
- `components/apps/pattern-playground/` (9 files)
- `components/apps/typography-playground/` (7 files: layouts/BroadsheetLayout, layouts/MagazineLayout, PlaygroundControls, TemplatePreview, TypeManual, TypeStyles, and the barrels/consumers that depended on them)
- `components/apps/brand-assets/colors-tab/ColorDetail.tsx`
- `components/Rad_os/WindowTitleBar.tsx`
- `components/Rad_os/index.ts`, `components/ui/index.ts` (dead barrel files)
- `lib/dotting/utils/stack.ts`
- `scripts/import-radiants-pfps.mjs`

Dependencies:
- `postcss` unlisted — should be added to rad-os `devDependencies` (used by `postcss.config.mjs`)

Unused exports (notable ones worth pruning):
- `LCD_GLOW_TEXT_SHADOW`, `LCD_TEXT_COLOR` in `components/apps/radio/styles.ts`
- `FONT_MAP`, `TEMPLATES`, `BROADSHEET`, `DESIGN_STATEMENT`, `TYPOGRAPHY_RULES` (typography-playground — likely deleted with the files above)
- `START_MENU_CATEGORIES`, `START_MENU_LINKS` in `lib/apps/catalog.tsx`
- `CANVAS_FG_VAR`, `CANVAS_BG_VAR` in `components/apps/pixel-playground/constants.ts`
- `channels` in `lib/mockData/tracks.ts`
- `useWindowsStore` in `store/index.ts`
- `downloadPretextBundle` in `components/apps/pretext/serialization.ts`
- `BrandColorCard`, `ExtendedColorSwatch`, `SemanticTokenRow`, `CopyableRow` in `colors-tab/ColorCards.tsx`
- `parseContent` in `manifesto/manifesto-data.ts`
- `UILibraryGallery`, `UILibraryProps` in `components/ui/UILibraryTab.tsx`
- `pointInTriangle` in `hooks/useSafeHover.ts`

Unused dotting internals (77 types + 13 runtime exports) — keep-or-trim decision pending, as we discussed

**Housekeeping:**
- `/unused-review` page exists (`apps/rad-os/app/unused-review/page.tsx`) — delete after pattern-playground / typography-playground / WindowTitleBar / ColorDetail decisions are made
- Run `pnpm install` to regenerate lockfile after `react-draggable` removal

**Separate bugs noted but not fixed:**
- UI patterns / corners tabs sizing issue (user mentioned in passing) — not yet investigated; likely different root cause than the container-query one
```

---

## 8. `d51f5119` — Five-team verification rollup

> This is itself a verification pass against the prior `e07d496c` /
> `a1f2afb2` / `23a81cc7` / `bb64ca66` outputs. **Highest-truth source**
> of the eight — most of the prior session contradictions were resolved
> here.

```markdown
## Verification results — revised action list

Five teams reported back. Major deltas below, then the corrected priority list.

### Surprises from verification
- **P8 (strict-orphan tokens) is wrong.** All 33 tokens the audit flagged as orphan are actually USED (23 color + 10 font/dim + z-index family). The previous agent ran against stale state. **Drop P8 wholesale** or re-audit one-by-one before touching.
- **P3 (stale tests) is wrong.** Dialog.test.tsx:89 and Sheet.test.tsx:88 query `.pattern-backdrop`, which is live (applied in `PatternBackdrop.tsx:71`). Tests are passing. **Drop P3.**
- **P29 (accent aliases) is 10× larger than thought.** 388 usages across 13 files, not 36 across 18. Still tractable (fewer files) but the codemod has to handle more call sites. Promote in scope.
- **P28 Combobox is fully dead, not just the prop.** Zero live call sites in apps/ or packages/. Promote from "remove prop" to "delete component". Matches the `Combobox.autoHighlight` signal.
- **P32 `/unused-review` page doesn't exist.** Delete the bullet.
- **P33 DESIGN.md "two-node" prose drift doesn't exist.** No matches for "two-node". Implementation and docs agree. Drop.
- **P28(a) Button.focusableWhenDisabled NOT dead** — live at `Button.tsx:277`. Keep.
- **P28(c) Spinner.completed NOT dead** — demo call site passes it. Keep.
- **typography-data.ts chain-delete.** It IS imported (by the other typography-playground files in the delete list + `SpecimenLayout.tsx` + `test/typography-data.test.ts`). If you delete the 6 layout/template files, `SpecimenLayout.tsx` + the test also need a decision before `typography-data.ts` can go. Add a sub-step.

### Confirmations
- **P5 DESIGN.md dark-token mismatch CONFIRMED.** Doc says ink-based; runtime is sun-yellow-based. Decision still needed.
- **P6 glow alpha counts CONFIRMED** — 27 sun-yellow + 12 cream. Consolidation is real ~40 LOC.
- **P7 oklch(0 0 0) in ctrl/ CONFIRMED and bigger.** 20 matches across 5 files (LCDScreen, Dropdown, TransportPill, ColorPicker, ctrl.css, LEDProgress).
- **P4 shadow-token doc refs CONFIRMED stale** in SPEC.md and theme-spec.md. `no-clipped-shadow.mjs:29` comment CONFIRMED stale (says `shadow-inner`, should be `shadow-inset`). `manifest.ts:4` + `archive/.../checklist.md:136` NOT stale — drop those two bullets.
- **P27 AppWindow.contentPadding flip SAFE** — all 7 catalog entries pass `false` explicitly.
- **catalog `resizable` field IS always true.** Confirmed dead config, can remove.
- **Rad_os/Desktop.tsx confirmed ALIVE** — imported at `RadOSDesktop.tsx:2`.

### New findings from packages/ctrl/ fresh audit (replaces vague "P17")
1. **POPUP_FRAME duplicated identically** in `Dropdown.tsx:69-80` and `ColorPicker.tsx:41-52` (author even left a comment acknowledging the dup). **Tiny extract.**
2. **GLOW/SHADOW constants proliferated** across ~8 components with partially-overlapping values (ControlPanel, LCDScreen, Dropdown, ColorPicker, IconRadioGroup, Toggle, TransportPill, NumberInput). **Small consolidation.**
3. **Row-shell pattern duplicated 4×** — PropertyRow, LayerRow, RegistryRow, LayerTreeRow all share `flex items-stretch min-h-[--ctrl-row-height]` + `bg-ctrl-cell-bg border border-ctrl-border-*` + `font-mono text-[0.625rem] uppercase tracking-wider`. **Medium extract — CtrlRow primitive.**
4. Inline spacing in Slider, NumberInput, Meter, Dropdown, ColorPicker, MatrixGrid.
5. DirectionPad has raw `<svg>` chevrons (math-driven, may need a new icon).
6. No accent/border-line drift in `packages/ctrl/`. Clean there.

### Corrected, verified priority list

**Do now (zero risk, verified):**
- P1 dep patches + minor dev tooling
- P2 safe deletes: **ColorDetail, WindowTitleBar (+ barrel)**, **6 typography-playground files** (TypeManual, TypeStyles, TemplatePreview, PlaygroundControls, BroadsheetLayout, MagazineLayout). Decide SpecimenLayout + typography-data.ts + typography-data.test.ts together before removing.
- **P2b (NEW): Delete Combobox entirely** — Combobox.tsx, .meta.ts, .schema.json, .test.tsx, barrel export, blocknote auto-gen reference.
- P4 doc fixes (SPEC.md lines 369-371, theme-spec.md lines 289/303/346-348/623, no-clipped-shadow.mjs:29 comment). Skip manifest.ts:4 and archive checklist — not stale.

**Next (low risk, verified):**
- P5 DESIGN.md dark-token reconciliation (still needs your decision — keep sun-yellow runtime or revert to ink?)
- P6 glow alpha consolidation (dark.css, 39 literals → named tokens)
- P7 oklch(0 0 0) → --color-lcd-black across 5 ctrl/ files + RadioDisc.tsx
- P9 raw SVG chevrons → ChevronDown icon (NavigationMenu, Select — skip Combobox since it's deleted)
- P10 ICON_ALIASES audit in manifest.ts:17
- P27 flip AppWindow.contentPadding default + strip per-entry overrides
- P28 trim dead props: **Menubar.modal default stays**, **Button.focusableWhenDisabled stays**, **Spinner.completed stays**. Remove catalog `resizable` field only.

**Before pixel plan:** P11 Vitest 2→4, P12 TS 5.9→6.0.

**Refactor batch (primitives):** P13 FormFieldShell, P14 ControlLabel, P15 LayerRow/QuietIconButton, P16 Section, **P17 packages/ctrl/ primitives** (POPUP_FRAME extract + GLOW/SHADOW consolidation + CtrlRow primitive).

**DOM collapses (P18-P26):** unchanged.

**Bigger migration:** P29 accent alias migration — now 388 usages × 13 files. Probably a dedicated codemod branch.

**Decisions still pending:** P5 dark-token semantics, P30 pretext subsystem kill/keep.

**Dropped from list:** P3 (stale tests — not actually stale), P8 (orphan tokens — not actually orphan), P32 (no unused-review page), P33 (no two-node prose).
```
