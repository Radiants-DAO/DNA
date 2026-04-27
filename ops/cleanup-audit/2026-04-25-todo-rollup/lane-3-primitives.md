# Lane 3 — Primitives & DOM Collapses (verified 2026-04-25)

Scope: Section 3 (`e07d496c`) primitive-extraction + DOM-collapse claims, plus
Section 8 (`d51f5119`) "New findings from packages/ctrl/" and Section 5 items
#5/#6. Verify-only against current tree.

All paths absolute; line numbers are post-verification (current source).

---

## CONFIRMED (still extractable / collapsible)

### Shared-primitive extractions

- **FormFieldShell / `fieldShellVariants`** — the `pixel-rounded-xs ${INPUT_BACKGROUND} … pixel-border-danger` shell is still inlined in **2 sites in `Input.tsx`** and once in `Select.tsx` and `NumberField.tsx`.
  - `packages/radiants/components/core/Input/Input.tsx:260` (InputControl wrappedInput) and `Input.tsx:310` (TextArea wrapper) — same inline string with shared `INPUT_BACKGROUND` const at line 120 and `INPUT_DISABLED_WRAPPER` at line 123.
  - `packages/radiants/components/core/Select/Select.tsx:144` — same `pixel-rounded-xs … pixel-border-danger` chrome composed inline into the Trigger className.
  - `packages/radiants/components/core/NumberField/NumberField.tsx:188` — `pixel-rounded-xs flex items-center` on the Group wrapper. (NumberField has no error-border path; shell is the lighter variant.)
  - The bg/disabled hooks already exist as local consts in Input.tsx (lines 120-124) — easy lift to a shared `fieldShellVariants` cva.
  - **Status:** still extractable. 3 components, 4 call sites.

- **ControlLabel** — `<label className="inline-flex items-center gap-2 ... ${disabled ? 'opacity-50 cursor-not-allowed' : ''}">` duplicated across:
  - `packages/radiants/components/core/Checkbox/Checkbox.tsx:103-108` (Checkbox label wrapper)
  - `packages/radiants/components/core/Checkbox/Checkbox.tsx:251-254` (Radio in-group label wrapper)
  - `packages/radiants/components/core/Checkbox/Checkbox.tsx:280-283` (Radio standalone label wrapper)
  - `packages/radiants/components/core/Switch/Switch.tsx:99-105` (label rendered, not the outer wrapper) — Switch's outer is `<div className="inline-flex items-center gap-2 ${className}">` at line 108, not a `<label>`. Same shape, different element.
  - **Status:** confirmed 4 sites (3 in Checkbox.tsx, 1 in Switch.tsx). The Switch case uses a `<div>` + child `<label htmlFor>`; primitive would need to handle both.

- **Section** (SettingsMenu pattern) — `<div className="py-1"><SectionHeader>...</SectionHeader>...</div>` followed by `<Separator className="mx-2" />` — confirmed **5 occurrences** (not 6) in `apps/rad-os/components/Rad_os/SettingsMenu.tsx`:
  - Lines 174-212 (Appearance) → Separator at 214
  - Lines 217-231 (Motion) → Separator at 233
  - Lines 236-282 (Display) → Separator at 284
  - Lines 287-303 (Sound) → Separator at 305
  - Lines 308-325 (Data) → no trailing separator (last visible section before footer)
  - **Status:** the audit said 6; current count is 5 (one trailing case has no separator). Easy local primitive.

### Per-component DOM collapses

- **Switch thumb wrapper** — extra `<div className="pixel-rounded-xs ${thumbClasses}">` wrapping `<span className="absolute inset-0 switch-thumb" />` at `packages/radiants/components/core/Switch/Switch.tsx:127-131`. Could be a single span with `pixel-rounded-xs ${thumbClasses}` + `switch-thumb`.

- **Slider thumb wrapper** — same pattern at `packages/radiants/components/core/Slider/Slider.tsx:163-184`. Outer `<div className="pixel-rounded-xs group/pixel bg-page hover:bg-accent transition-colors ${thumb}">` wrapping inner `<div ...>` with the actual base-ui props. Two divs where Base UI render expects one.

- **Taskbar Toolbar.Root wrap** — confirmed at:
  - `apps/rad-os/components/Rad_os/Taskbar.tsx:175-176` — `<div className="flex items-center justify-start"><Toolbar.Root className="p-0.5">…`
  - `apps/rad-os/components/Rad_os/Taskbar.tsx:248-249` — `<div className="flex items-center justify-end"><Toolbar.Root className="p-0.5">…`
  - Both are flex/justify wrappers that could be moved into the Toolbar.Root className directly (Toolbar.Root already renders a div).

- **StartMenu MenuRow ref-div** — pure-ref `<div ref={(el) => appRowRefs.current.set(app.id, el)}>` at `apps/rad-os/components/Rad_os/StartMenu.tsx:207-222`. Wraps a `<MenuRow>` purely so `appTop()` can `.getBoundingClientRect()` on it. Could move ref to MenuRow's underlying Button via forwardRef.

- **DesignSystemTab nested divs** — at `apps/rad-os/components/ui/DesignSystemTab.tsx:75-79` (`pixel-rounded-sm pixel-shadow-resting` outer → `bg-page p-4 flex flex-col gap-3` inner ref'd container). Outer + inner could be merged unless the ref placement is load-bearing. Audit said "3-way nested div collapse"; I see a 2-way at the card root, plus separate 2-way at lines 222-227 (group container `flex flex-col gap-3` → `flex items-end justify-between border-b border-rule pb-3 gap-4 mt-8`). Multiple candidates.

- **Alert.Root flattening** — `packages/radiants/components/core/Alert/Alert.tsx:134-137`:
  ```tsx
  <div role="alert" data-rdna="alert" data-variant={variant} className={alertVariants({ variant, ...pixel-rounded-xs pixel-shadow-raised })}>
    <div className="flex items-start gap-3">
      {children}
    </div>
  </div>
  ```
  Inner flex div is purely structural — fold `flex items-start gap-3` into the outer `alertVariants` base.

- **Meter** — `packages/radiants/components/core/Meter/Meter.tsx:101-112`. Three nested wrappers around `BaseMeter.Track`: `<div className="w-full ${className}">` → `<div className="pixel-rounded-xs bg-page w-full">` → `<BaseMeter.Track className="w-full h-4 relative">`. Could use `BaseMeter.Root` with class composition directly.

- **Breadcrumbs separators** — `packages/radiants/components/core/Breadcrumbs/Breadcrumbs.tsx:52-59`. Sibling `<span aria-hidden="true">` per item still in place; not converted to `::before` pseudo. (Tradeoff: a11y-friendly siblings are arguably fine; this is a stylistic call, not a correctness call.)

- **ColorCards inner divs** — confirmed:
  - `apps/rad-os/components/apps/brand-assets/colors-tab/ColorCards.tsx:13-14` — `BrandColorCard` outer `pixel-rounded-sm pixel-shadow-raised h-full` + inner `h-full flex flex-col`. Mergeable.
  - `ColorCards.tsx:59-60` — `ExtendedColorSwatch` outer `pixel-rounded-sm pixel-shadow-raised` + bare `<div>`. The inner is a true no-op wrapper.
  - `ColorCards.tsx:150-151` — `SemanticCategoryCard` outer `pixel-rounded-sm` + bare `<div>`. Also a no-op.
  - All three are the "two sibling components" cases the audit mentioned.

### packages/ctrl/ primitive opportunities

- **POPUP_FRAME duplicated identically** — confirmed verbatim at:
  - `packages/ctrl/selectors/Dropdown/Dropdown.tsx:69-80`
  - `packages/ctrl/selectors/ColorPicker/ColorPicker.tsx:41-52`
  - The dup-acknowledging comment is **still there**: `ColorPicker.tsx:40` reads "Mirrors Dropdown.POPUP_FRAME — kept local to avoid a shared-helpers module." Tiny extract.
  - GLOW_HOVER_PORTAL is also duplicated (`Dropdown.tsx:59-60` + `ColorPicker.tsx:37-38`); GLOW_PORTAL only in Dropdown.

- **GLOW/SHADOW constants proliferated across ctrl/** — confirmed by greppable inline-style usage:
  - `textShadow: '0 0 8px var(--glow-sun-yellow)'` — 5 sites: PropertyRow:38, RegistryRow:68, LayerRow:130, LayerTreeRow:56, ColorSwatch:88.
  - `textShadow: '0 0 8px var(--color-ctrl-glow)'` — 7 sites: XYPad:107, NumberScrubber:76, Slider:352, Ribbon:114, Fader:162/236, Knob:150, Meter:290.
  - `boxShadow: '0 0 6px var(--glow-sun-yellow-subtle)'` — 4 sites: LayerRow:109, IconCell:99, ChipTag:84, ColorSwatch:77.
  - `boxShadow: '0 0 6px var(--color-ctrl-glow)'` — 3 sites: XYPad:100, Toggle:122, plus `4px` variants in Fader (121/197) and `6px` in Fader (154/228).
  - LCDScreen.tsx (lines 56, 65) and ControlPanel.tsx (line 69) already define INSET_SHADOW/RAISED_SHADOW/INSET_CHROME_SHADOW constants locally — small consolidation opportunity into shared GLOW/SHADOW table.
  - **Pattern:** the same 4-5 glow recipes recur across ~12 files. A `packages/ctrl/primitives/glows.ts` with `GLOW_TEXT_VALUE`, `GLOW_TEXT_SUBTLE`, `GLOW_BOX_VALUE`, `GLOW_BOX_SUBTLE`, `GLOW_FILL`, `GLOW_FILL_SUBTLE` would reduce noise.

- **CtrlRow primitive (P17 row-shell pattern)** — confirmed across 4 files:
  - `packages/ctrl/layout/PropertyRow/PropertyRow.tsx:24-30` — `flex items-stretch min-h-[--ctrl-row-height]` + `bg-ctrl-cell-bg border border-ctrl-border-inactive` + label cell with `font-mono text-ctrl-text-active text-[0.625rem] uppercase tracking-wider`
  - `packages/ctrl/layout/LayerRow/LayerRow.tsx:99-110` — same `flex items-stretch min-h-[--ctrl-row-height]` + `bg-ctrl-cell-bg border` + selection-aware border tone (active vs inactive).
  - `packages/ctrl/layout/RegistryRow/RegistryRow.tsx:43-66` — different chrome (it's a `<button>` not a `<div>`) but shares the `font-mono text-[0.625rem] uppercase tracking-wider` typography + selection-aware bg/text + same `--ctrl-glow`/`--glow-sun-yellow` selected text-shadow.
  - `packages/ctrl/layout/LayerTreeRow/LayerTreeRow.tsx:42-65` — `min-h-5 font-mono text-[0.625rem] uppercase tracking-wider` + selection-aware `bg-ctrl-cell-bg border border-ctrl-border-active` chrome.
  - **Status:** PropertyRow + LayerRow are nearly identical at the chrome level (both use `flex items-stretch min-h-[--ctrl-row-height]` + `bg-ctrl-cell-bg border border-ctrl-border-{active|inactive}`); RegistryRow + LayerTreeRow share the typography + selected glow recipe but diverge in chrome (one is a button, the other a role=button div). Medium extract — a `CtrlRow` primitive can confidently absorb the chrome shell + the typography slot for at least PropertyRow/LayerRow; RegistryRow/LayerTreeRow benefit from the shared typography + selected-glow tokens but may keep their own root element.

- **DirectionPad raw SVG chevrons** — confirmed at `packages/ctrl/selectors/DirectionPad/DirectionPad.tsx:28-33` (`chevronPaths` lookup) and rendered inline as `<svg viewBox="0 0 10 10">` at lines 160-187. Math-driven (chevronSize varies with `cellSize`) so a fixed-size icon import would need a sizing prop. Audit's "may need a new icon" note is correct.

- **Inline spacing in Slider/NumberInput/Meter/Dropdown/ColorPicker/MatrixGrid** — Section 8 #4. I did not exhaustively grep these; spot-checks of Dropdown.tsx and ColorPicker.tsx show inline `style={{ gap: 4 }}`, `style={{ width: 10, height: 10 }}` etc. (e.g. `ColorPicker.tsx:98, 103-108, 112`). Pattern is real. Lane scope is "primitives" — this is more of a "no-hardcoded-spacing" follow-up; flagging for the spacing lane.

---

## CHANGED SINCE AUDIT (shape shifted)

- **LayerRow / QuietIconButton** in `apps/rad-os/components/apps/studio/LayerPanel.tsx` — **file is gone.**
  - `apps/rad-os/components/apps/studio/` now contains only StudioBottomRail, StudioLeftRail, StudioRightRail, StudioColorsRail, StudioExportPanel, ScreenIsland, CanvasArea, PixelArtEditor, StatusBar, constants.ts, radnom.ts, toolbarPos.ts. **No LayerPanel.tsx.**
  - The 4× `Tooltip + Button mode="text" size="sm" iconOnly` pattern still likely lives in the Studio rail components, but the audit's specific file:line citation is moot.
  - Note: `packages/ctrl/layout/LayerRow/LayerRow.tsx` exists as a ctrl primitive (not the same thing the audit was talking about — that one is for image-editor layer panels with action cells). The original RadOS app-side LayerPanel may have already been ported to use the ctrl primitive.

- **LayerRow / QuietIconButton (RadOS-app variant)** — see above. The "QuietIconButton" extract proposal is now mootable from the audit's LayerPanel POV. If the same pattern exists in the new Studio*Rail files, that's a re-audit, not a verification — flagging for follow-up.

- **`SettingsMenu` Section count** — audit said 6, current is 5 (one section has no trailing Separator). Shape unchanged, count off-by-one.

---

## MOOT (no longer applies — file deleted, refactored, etc.)

- **Typography primitives** (`AlphabetRows`, `WeightParade`, `TemplateFrame`, `MomentCard` across 4 files in `typography-playground/`) — **fully moot.**
  - Zero matches for any of those names in the entire repo (`grep -rn "AlphabetRows\|WeightParade\|TemplateFrame\|MomentCard" --include="*.tsx" --include="*.ts"` returns nothing).
  - Per Section 7's knip leftovers: `typography-playground/` has 7 unused files queued for deletion (TypeManual, TypeStyles, TemplatePreview, PlaygroundControls, BroadsheetLayout, MagazineLayout, plus barrels/consumers). Section 8 confirmed those deletes are safe pending a SpecimenLayout + typography-data.ts decision.
  - Either the audit hallucinated names that never existed in this repo, or they were earlier draft names that were renamed before I scanned. Either way: **no code to extract from**. Drop the bullet.

- **Radio primitives** (`MeterChannel`, `LabeledLcdSlider`, shared thin-track slider) — **fully moot in `apps/rad-os/components/apps/radio/`.**
  - Zero matches for `MeterChannel` or `LabeledLcdSlider` anywhere in the repo.
  - Current `apps/rad-os/components/apps/radio/` files: Radio.tsx, RadioFrame.tsx, RadioWidget.tsx, RadioVisualizer.tsx, RadioDisc.tsx, RadioEffectsRow.tsx, useWebAudioEffects.ts, styles.ts, videos.ts. No primitives directory, no MeterChannel/LabeledLcdSlider names.
  - Equivalent shapes now live in `@rdna/ctrl`: thin-track slider = `packages/ctrl/controls/Slider/Slider.tsx` (`variant="line"`), Meter = `packages/ctrl/readouts/Meter/Meter.tsx`, channel-strip pieces = Fader/Knob/etc.
  - Section 3's "partially obsolete, much migrated to packages/ctrl/" is more accurate as **fully obsolete in apps/, fully migrated to ctrl/**. Drop the bullet.

- **`SrefCard triple-wrapped images` in `BrandAssetsApp.tsx`** — **`BrandAssetsApp.tsx` no longer exists.** No file by that name in the repo. The brand-assets app has been refactored. If SrefCard still exists, it's elsewhere; the audit's specific file pointer is moot.

---

## NEW FINDINGS

- **NumberField step buttons share a `stepButtonVariants` cva** (NumberField.tsx:81-89) — fine as-is, but the `bg-accent text-accent-inv hover:bg-inv hover:text-flip` recipe is similar to Button's flat-mode tone-accent recipe. Probably not worth extracting (different size constraints), noted for awareness.

- **Switch and Slider thumb both reference a shared `switch-thumb` class** (Switch.tsx:129, Slider.tsx:177) — already partial code-share; a `<Thumb>` primitive that owns both could fold the wrapper-div removal AND the cross-component class.

- **GLOW_PORTAL vs GLOW_HOVER_PORTAL naming inconsistency in Dropdown/ColorPicker** — ColorPicker only declares `GLOW_HOVER_PORTAL` (no plain GLOW_PORTAL); Dropdown declares both. If the popup needs the non-hover GLOW for selected items, ColorPicker may have a subtle visual diff. (Spot-check only; not validated.)

- **Breadcrumbs separator is sibling `<span>`, not `::before`** — works for a11y; the audit's "should be `::before`" claim is a stylistic preference, not a defect. If a11y prefers visible separators in DOM (some screen readers behave better), keep as-is.

- **LayerTreeRow uses `role="button"` div instead of `<button>`** (LayerTreeRow.tsx:44-47) — its sibling RegistryRow uses native `<button>`. Inconsistency worth noting (a11y + RDNA `prefer-rdna-components` rule), separate from any extraction.

- **`apps/rad-os/components/apps/typography-playground/`** contains files that are slated for deletion per Section 7; the directory still exists with TypeManual.tsx, TypeStyles.tsx, etc. Section 8 marked those safe deletes pending decisions. Lane 3 has nothing further to add — typography primitive extractions are moot regardless of the delete decision.

---

## DEDUPED ACTION LIST (this lane, ordered by impact × ease)

1. **POPUP_FRAME extract** — 2 identical 12-line constants + acknowledged comment. ~25 LOC saved. Move to `packages/ctrl/primitives/portal-styles.ts`. **(Tiny, zero risk.)**
2. **FormFieldShell** — 4 call sites across 3 files (Input, Select, NumberField). Lift `pixel-rounded-xs ${INPUT_BACKGROUND} ${INPUT_DISABLED_WRAPPER} ${error ? 'pixel-border-danger' : ''}` into a shared cva. ~30 LOC saved + consistency win on disabled/error treatment.
3. **ColorCards no-op `<div>` collapses** — 3 sites (lines 13-14 mergeable, lines 60 + 151 are bare-div no-ops). Pure deletion, no API change. ~3 LOC.
4. **Alert.Root flatten** — fold `flex items-start gap-3` into outer `alertVariants` base, drop inner `<div>`. 1-line semantic change.
5. **Meter wrapper collapse** — fold `pixel-rounded-xs bg-page w-full` into BaseMeter.Root via composition. Drop 2 `<div>` levels. 1-line cleanup.
6. **Switch thumb / Slider thumb collapse** — both extra `<div>` wrappers. Could be a shared `<Thumb>` primitive (since both use `switch-thumb` class) OR a per-component span+span change. Switch is simpler; Slider's CSS-grouping (`group/pixel`) needs the parent.
7. **GLOW/SHADOW shared table** — `packages/ctrl/primitives/glows.ts` with ~6 named recipes. ~12 files reference 4-5 unique strings; consolidating reduces drift risk.
8. **CtrlRow primitive** — extract chrome (`flex items-stretch min-h-[--ctrl-row-height]` + `bg-ctrl-cell-bg border border-ctrl-border-{active|inactive}`) + typography slot (`font-mono text-[0.625rem] uppercase tracking-wider`) + selected-glow. PropertyRow + LayerRow are easy targets; RegistryRow + LayerTreeRow can adopt the typography/glow tokens without rewriting their root element. Medium effort, 4 consumers.
9. **ControlLabel** — 4 sites (3 in Checkbox.tsx, 1 in Switch.tsx). Lower urgency since the Switch one is a `<div>` not a `<label>`; primitive needs to handle both. Could land alongside FormFieldShell as part of a "form atoms" PR.
10. **SettingsMenu Section local primitive** — 5 sites. Pure refactor inside a single file; trivial. Ship anytime.
11. **Taskbar Toolbar.Root wrap** — 2 sites, fold `flex items-center justify-{start,end}` into Toolbar.Root className. Verify Toolbar.Root passes className through.
12. **DesignSystemTab nested div merge** — 2-3 candidates, but Card outer is structurally the pixel-rounded shell (matches the rest of the codebase); inner ref is load-bearing for `useDeferredContent`. Tread carefully or skip.
13. **StartMenu MenuRow ref-div** — only collapsible if MenuRow forwards a ref to its underlying Button. Small change but touches Button's API surface; Lane-2 territory.
14. **Breadcrumbs `::before` swap** — stylistic; defer unless a11y QA flags it.
15. **DirectionPad chevron icon** — needs new sized icon variant first; deferrable.

**Drop entirely (moot):** Typography primitives (AlphabetRows et al.), radio primitives (MeterChannel/LabeledLcdSlider), SrefCard triple-wrap, LayerPanel-cited LayerRow/QuietIconButton (file gone — re-audit Studio rails if the pattern reappeared).
