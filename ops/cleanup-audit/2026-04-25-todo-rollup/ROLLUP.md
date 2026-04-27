# Cleanup Todo Rollup — 2026-04-25

Compiled from 8 stale Claude sessions over the last week (full text in
`SOURCES.md`), then verified by 4 parallel agents (lane reports in
`lane-{1,2,3,4}-*.md`).

This file is the **deduped, re-prioritized punch list**. Read this. The
lane reports have the evidence. SOURCES.md has the original raw todos.

---

## Headline

- **8 source sessions → 4 lane reports → ~30 actionable items + 4 user decisions.**
- **Many claims were stale.** Section 4 (`23a81cc7`) and Section 8 (`d51f5119`) contradicted each other on the strict-orphan tokens; both were partially wrong. Section 2's three TS errors are all gone. Section 3's `.bg-hover` stale-test claim is wrong (tests pass on `.pattern-backdrop`).
- **The biggest unresolved question: dark-mode token semantics.** DESIGN.md says ink/cream, runtime says sun-yellow. Lane 2 found a 5th drifted token (`--color-accent-inv`) not in any source. Five tokens need reconciliation before the accent-alias migration can finalize.
- **Highest-leverage cleanups available right now:** Combobox component delete · 6 typography-playground files delete · POPUP_FRAME extract · glow-alpha tokenization · DNA-999/001 placeholder cleanup.

---

## DROP entirely (claims that turned out to be wrong or already resolved)

These appeared in source sessions but verification proves they no longer apply. Don't put them on any new list.

- **Section 3 `.bg-hover` stale tests** — Dialog.test.tsx and Sheet.test.tsx both query `.pattern-backdrop` and pass. Section 8 was already right; Section 3 was stale.
- **Section 2 TS errors** — TS2307 (`unused-review/page.js`), TS2540×9 (`icon-conversion-review.ts`), TS2322 (`AppWindow.tsx:1014`) — all 3 absent from `tsc --noEmit` output. Next cache rebuilt; AxisProfile fields are mutable; the cited AppWindow.tsx:1014 is `chromeCtx`, not wrapperStyle.
- **`/unused-review` page deletion** — page never existed. Sections 3 + 7 were both wrong.
- **`pattern-playground/` 9-file delete** — directory already deleted.
- **`components/ui/index.ts` barrel delete** — file already deleted.
- **knip claim: `LCD_GLOW_TEXT_SHADOW`/`LCD_TEXT_COLOR` unused** — exports already removed; `radio/styles.ts` was rewritten to a 14-line module exporting only `lcdText`.
- **knip claim: `FONT_MAP`/`BROADSHEET`/`DESIGN_STATEMENT`/`TYPOGRAPHY_RULES` unused** — already gone from `typography-data.ts`.
- **"Run `pnpm install` after `react-draggable` removal"** — react-draggable still in use (AppWindow.tsx + TemplatePreview.tsx), not removed.
- **DESIGN.md "two-node" prose drift** — zero matches anywhere. (Section 8 already noted this; restating.)
- **`manifest.ts:4` stale generator comment** — actually historical narration, not stale.
- **`archive/.../2026-03-27-production-readiness-checklist.md:136` `[data-theme]` note** — accurately documents resolved item, not stale.
- **Typography primitives** (AlphabetRows, WeightParade, TemplateFrame, MomentCard) — zero matches in repo. Audit hallucinated names.
- **Radio primitives** (MeterChannel, LabeledLcdSlider) — zero matches. Fully migrated to `@rdna/ctrl`.
- **SrefCard triple-wrap in `BrandAssetsApp.tsx`** — `BrandAssetsApp.tsx` no longer exists.
- **LayerRow / QuietIconButton in `studio/LayerPanel.tsx`** — `LayerPanel.tsx` no longer exists; pattern may have moved to Studio*Rail files (re-audit if interested, otherwise drop).

---

## DECISIONS NEEDED (these gate downstream work)

| # | Decision | Blocks | Notes |
|---|---|---|---|
| **D1** | **Dark-mode token semantics:** runtime uses sun-yellow for `--color-flip` (cream), `--color-mute` (sun-yellow/60), `--color-line` (sun-yellow/20), `--color-rule` (sun-yellow/12), and `--color-accent-inv` (ink). DESIGN.md says ink/cream. **Match doc to runtime, or change runtime to match doc?** | Tier 4 accent-alias migration; glow-alpha consolidation naming | 5 tokens, ~10-LOC doc patch OR ~10-LOC runtime patch. (`--color-accent-inv` is a NEW finding from Lane 2.) |
| **D2** | **`typography-data.ts` chain delete:** SpecimenLayout (live, `BrandApp.tsx:9` → `TypographyPlayground` → `SpecimenLayout`) imports it. Test imports `FONTS` too. Options: (a) keep all 3, (b) delete only the 6 dead files (current Tier 1), (c) full chain (kill SpecimenLayout from TypographyPlayground, delete typography-data + test). | A1.4 typography-playground 6-file delete (already runnable as partial) | If you choose (c), pull SpecimenLayout out of TypographyPlayground first. |
| **D3** | **Strict-orphan tokens:** 32 of 33 are genuine orphans (`--ctrl-row-height` is the carve-out). Section 5 explicitly defers them as "public contract surface (README + Figma tokens); keep." **Prune them, keep them all, or split (drop motion/focus/z-index orphans, keep semantic-color orphans as API surface)?** | Tier 2 token cleanup | Lane 1 + Lane 2 agree Section 8's "all USED" reversal was wrong. The semantic-color orphans (`--color-action-*`, `--color-content-*`, `--color-edge-*`, `--color-surface-*`) ARE registered in `contract/system.ts` whitelist. Motion/focus-ring/z-index families are not — clean prune candidates. |
| **D4** | **Placeholder issue IDs:** real tracker — Linear, GitHub Issues, or just delete? 9× `DNA-999` + 41× `DNA-001` to rewrite. | A1.7 placeholder cleanup | Decision unblocks a single bulk codemod. |
| **D5** | **`Menubar.modal` default-path:** sole caller (ScratchpadApp) omits the prop. Drop the dead default branch or keep as public API? | A2.5 dead-prop trim | Section 8 said "keep as API." Defer to that unless you want minimal API surface. |
| **D6** | **Pretext subsystem (15 files in `apps/rad-os/components/apps/pretext/`):** zero imports outside tests. Kill or keep? | A4.4 large delete batch | Recurring question across 3 sessions; still pending. |
| **D7** | **`channels` mock-data export** in `lib/mockData/tracks.ts`: only `getTracksByChannel` is used. Drop or keep as documentation? | A1.10 unused-export trim | Trivial either way. |

---

## TIER 1 — Zero-risk, verified safe, ship today

These have all been verified by the lane agents against current code. No decisions required (some have D2/D4 sub-gates noted inline).

### A1 — Code deletes

**A1.1 Delete dead files (zero importers):**
- `apps/rad-os/components/apps/brand-assets/colors-tab/ColorDetail.tsx`
- `apps/rad-os/components/Rad_os/WindowTitleBar.tsx`
- `apps/rad-os/components/Rad_os/index.ts` (barrel; all callers import from source modules directly)
- `apps/rad-os/lib/dotting/utils/stack.ts`
- `apps/rad-os/scripts/import-radiants-pfps.mjs`
- After ColorDetail goes: also drop `BrandColorCard` + `ExtendedColorSwatch` exports from `ColorCards.tsx` (they have no other consumers).

**A1.2 Delete Combobox entirely** (zero apps/ callers, fully dead):
- `packages/radiants/components/core/Combobox/` (whole dir: Combobox.tsx, .meta.ts, .schema.json, .test.tsx, index.ts)
- Combobox entries in `packages/radiants/meta/index.ts:102-103`
- Combobox entry in `packages/radiants/schemas/index.ts:58`
- `packages/radiants/blocknote/renders/Combobox.tsx`
- Combobox refs at `packages/radiants/generated/blocknote-blocks.tsx:4,16,179,656` (re-run generator)
- Combobox demo block + import + `useComboboxFilter` line in `packages/radiants/registry/runtime-attachments.tsx:190-220`
- Combobox assertions in `__tests__/base-ui-wrapper-policy.test.tsx:45` + `__tests__/smoke.test.tsx:23,48`
- `ComboboxMeta` references in `registry/__tests__/preview-state-authoring.test.ts:31,37`
- Collapses the `Combobox.autoHighlight` dead-prop question.

**A1.3 Trim catalog `resizable` field** — confirmed always `true` on all 7 entries. Remove from `apps/rad-os/lib/apps/catalog.tsx` interface (line 69), 7 entries (lines 88, 109, 132, 143, 157, 168, 179), and `getWindowChrome` (line 256).

**A1.4 Delete 6 typography-playground dead files** (gated by **D2** only if you want full chain delete):
- `TypeManual.tsx`
- `TypeStyles.tsx`
- `TemplatePreview.tsx`
- `PlaygroundControls.tsx`
- `layouts/MagazineLayout.tsx`
- `layouts/BroadsheetLayout.tsx`
- After delete, drop `TEMPLATES` export in `typography-data.ts` (becomes orphan).
- `typography-data.ts` itself stays unless **D2** says full chain.

**A1.5 Trim verified-unused exports:**
- `useWindowsStore` (`apps/rad-os/store/index.ts:59`)
- `downloadPretextBundle` (`apps/rad-os/components/apps/pretext/serialization.ts:136`)
- `UILibraryGallery`, `UILibraryProps` (`apps/rad-os/components/ui/UILibraryTab.tsx`)
- `CANVAS_FG_VAR`, `CANVAS_BG_VAR` (`apps/rad-os/components/apps/pixel-playground/constants.ts:64-65`)

### A1 — Doc / comment patches

**A1.6 Stale doc references to dead shadow tokens:**
- `apps/rad-os/SPEC.md:369-371` — remove `--shadow-btn`/`--shadow-btn-hover`/`--shadow-card` block.
- `docs/theme-spec.md` lines 289, 303, 346-348, 623 — refresh shadow refs to `--shadow-resting`/`--shadow-lifted`/`pixel-shadow-*` or mark as illustrative.
- `packages/radiants/eslint/rules/no-clipped-shadow.mjs:29` — replace `shadow-inner` with `shadow-inset` in comment.

### A1 — Quick component cleanup

**A1.7 Placeholder issue IDs** (gated by **D4**):
- 9× `DNA-999`: `RadioDisc.tsx` lines 90, 92, 178, 190, 201, 220, 254 (+ Spinner.tsx:112, PixelIcon.test.tsx:73). Section 2 said 3 sites; actual is 7 in RadioDisc alone.
- 41× `DNA-001` across 13+ files (Desktop.tsx ×2, InvertOverlay.tsx, DesignSystemTab.tsx, UILibrarySidebar.tsx, ColorCards.tsx ×9, FibonacciMosaic.tsx ×2, ColorPrimaryCard.tsx ×5, RegistryList.tsx ×2, PatternPreview.tsx ×2, CornerPreview.tsx ×4, PixelThumb.tsx, BrandApp.tsx, typography-playground/{TypeStyles,TypeManual,EditorialLayout}). Section 2 said 4 files; actual is 13+.

**A1.8 ColorCards no-op `<div>` collapses** (3 sites, pure deletion, ~3 LOC):
- `ColorCards.tsx:13-14` — `BrandColorCard` outer + inner `flex flex-col` mergeable
- `ColorCards.tsx:60` — `ExtendedColorSwatch` bare-div no-op
- `ColorCards.tsx:151` — `SemanticCategoryCard` bare-div no-op

**A1.9 SettingsMenu Section local primitive** — 5 sites (audit said 6; actual is 5 — last section has no trailing Separator). Pure refactor inside `SettingsMenu.tsx`.

**A1.10 `border-ink` → `border-line` cleanup** — only 2 occurrences left outside brand-assets: `BrandApp.tsx:70`, `goodnews/GoodNewsLegacyApp.tsx:1131`. The original brand-assets toolbar drift is already gone.

---

## TIER 2 — Low-risk, decision-gated

### A2 — Token cleanup

**A2.1 Glow alpha consolidation in `dark.css`** — extract 27 sun-yellow + 12 cream inline `oklch(...)` literals into named tokens (`--glow-sun-yellow-{04,08,12,20,…}`, `--glow-cream-{12,20,35,…}`). ~40 LOC saved. Note: `--glow-cream-hover` and `--glow-cream-active` already partially extracted at `dark.css:141-142`.

**A2.2 Add `--color-lcd-black` brand token, then migrate 9 `oklch(0 0 0)` literals:**
- `packages/ctrl/layout/LCDScreen/LCDScreen.css:17`
- `packages/ctrl/readouts/LEDProgress/LEDProgress.css:15` (comment), `:24` (definition)
- `packages/ctrl/selectors/Dropdown/Dropdown.tsx:83`
- `packages/ctrl/selectors/TransportPill/TransportPill.css:22, 30, 31, 32`
- `packages/ctrl/selectors/TransportPill/TransportPill.tsx:55`
- `apps/rad-os/components/apps/radio/RadioDisc.tsx:91`
- (Lane 2 confirmed: ColorPicker and `ctrl.css` are already clean. Section 8's count of 20×6 was stale.)

**A2.3 Replace 2× `bg-black` in `apps/rad-os/app/ctrl-preview/page.tsx:112,156`** — needs new `--color-ctrl-surface` semantic token (decision: token name + value; could ride on the same PR as A2.2).

**A2.4 Drop genuinely orphan tokens** (gated by **D3**). The actually-unreferenced 32 tokens, partitioned by safety:
- *Safe to drop regardless of contract policy:* `--color-active-overlay`, `--color-hover-overlay`, `--color-warning-yellow`, `--color-error-red`, `--color-focus-state`, `--color-ctrl-active`, `--color-ctrl-rule`, `--ctrl-size-{sm,md,lg}`, `--font-blackletter-inline`, `--font-waves-tiny`, all motion (`--density-scale`, `--touch-target-default`, `--duration-scalar`, `--easing-default`, `--easing-spring`), all focus-ring (`--focus-ring-{color,offset,width}`), all 8 `--z-index-*`. None in `contract/system.ts`.
- *Keep if maintaining public API:* `--color-action-{accent,secondary,destructive}`, `--color-content-{heading,link,secondary}`, `--color-edge-{focus,hover,muted}`, `--color-surface-{elevated,muted,tertiary,overlay-medium,overlay-subtle}`. These ARE registered in `contract/system.ts` (Lane 2 finding).
- *Keep:* `--ctrl-row-height` (live in 7+ ctrl files).

### A2 — DOM collapses

**A2.5 Trim dead props** (gated by **D5** for Menubar.modal):
- Catalog `resizable` field — already in A1.3
- Keep: `Button.focusableWhenDisabled` (live, exercised by test), `Spinner.completed` (live, demo passes it), `Menubar.modal` (default-path technically unexercised but Section 8 says keep as API)

**A2.6 Flip `AppWindow.contentPadding` default to `false`** — verified all 7 catalog entries pass `false` explicitly. Strip per-entry overrides at `catalog.tsx:89,110,133,144,158,169,180` and `getWindowChrome:257`.

---

## TIER 3 — Refactor batches (primitives + DOM)

### A3 — `packages/ctrl/` primitives (Lane 3)

**A3.1 Extract POPUP_FRAME** — 2 identical 12-line constants in `Dropdown.tsx:69-80` and `ColorPicker.tsx:41-52` (with explicit dup-acknowledging comment at `ColorPicker.tsx:40`). Move to `packages/ctrl/primitives/portal-styles.ts`. ~25 LOC saved. **Top-leverage tiny extract.** Also collapses GLOW_HOVER_PORTAL dup.

**A3.2 Shared GLOW/SHADOW table** — `packages/ctrl/primitives/glows.ts` with ~6 named recipes. Currently the same 4–5 inline `textShadow`/`boxShadow` strings recur across ~12 files (PropertyRow, RegistryRow, LayerRow, LayerTreeRow, ColorSwatch, XYPad, NumberScrubber, Slider, Ribbon, Fader, Knob, Meter, Toggle, IconCell, ChipTag). Reduces drift risk.

**A3.3 CtrlRow primitive** — extract chrome + typography + selected-glow shared by PropertyRow, LayerRow, RegistryRow, LayerTreeRow. PropertyRow + LayerRow are nearly identical at the chrome level; RegistryRow + LayerTreeRow share the typography + glow recipe but diverge in root element. Medium effort, 4 consumers.

### A3 — RDNA component primitives

**A3.4 FormFieldShell / `fieldShellVariants`** — 4 call sites across 3 files (Input.tsx:260+310, Select.tsx:144, NumberField.tsx:188). Lift `pixel-rounded-xs ${INPUT_BACKGROUND} ${INPUT_DISABLED_WRAPPER} ${error ? 'pixel-border-danger' : ''}` into a shared cva. ~30 LOC + consistency win.

**A3.5 ControlLabel** — 4 sites (Checkbox.tsx:103/251/280, Switch.tsx:108). Switch's outer is a `<div>` not `<label>`; primitive needs to handle both.

### A3 — DOM collapses

**A3.6 Switch / Slider thumb wrappers** — extra `<div>` at Switch.tsx:127-131 and Slider.tsx:163-184. Both reference `switch-thumb` class — could share a `<Thumb>` primitive.

**A3.7 Alert.Root flatten** — fold inner `flex items-start gap-3` into outer `alertVariants` at Alert.tsx:134-137. 1-line semantic change.

**A3.8 Meter wrapper collapse** — Meter.tsx:101-112 has 3 nested wrappers; fold into BaseMeter.Root via composition. 1-line cleanup.

**A3.9 Taskbar Toolbar.Root wrap** — fold `flex items-center justify-{start,end}` at Taskbar.tsx:175-176 + 248-249 into Toolbar.Root className (verify className passthrough first).

**A3.10 StartMenu MenuRow ref-div** — pure-ref `<div>` at StartMenu.tsx:207-222. Move ref to MenuRow's underlying Button via forwardRef. Touches Button API.

**A3.11 DesignSystemTab merges** — 2 candidates at DesignSystemTab.tsx:75-79 and 222-227. Tread carefully (inner ref may be load-bearing for `useDeferredContent`).

**A3.12 Breadcrumbs separator pseudo** — stylistic; defer unless a11y QA flags.

### A3 — Audit gaps

**A3.13 Inline spacing in ctrl/** — Slider, NumberInput, Meter, Dropdown, ColorPicker, MatrixGrid have inline `style={{ gap: 4 }}` etc. (spot-confirmed in Dropdown + ColorPicker). RDNA `no-hardcoded-spacing` follow-up.

**A3.14 LayerTreeRow `role="button"` div vs RegistryRow `<button>`** — inconsistency, may trip RDNA `prefer-rdna-components` rule.

---

## TIER 4 — Migrations (gated, multi-PR)

**A4.1 Accent alias migration** (Lane 2, gated by **D1**) — actual count is **85 utility occurrences across 38 files** (Section 6 said 36×18, Section 8 said 388×13 — both wrong). Tractable single-codemod branch. Cannot finalize until D1 reconciliation lands.

**A4.2 ICON_ALIASES audit** — 43-entry map at `packages/radiants/icons/manifest.ts:17`. Before pruning, codemod 35+ live `name="<alias>"` consumers (close, search, plus, pencil, chevron-right, twitter, trash, download, discord, chevron-left, question, globe, eye, copy) to canonical names.

**A4.3 `dark.css` `!important` triage** — 93 declarations confirmed. Long-running per-site work, mostly inside button/glow/btn-tint cascade.

**A4.4 Pretext subsystem** (gated by **D6**) — 15 files in `apps/rad-os/components/apps/pretext/` plus 3 primitive subdirs, zero imports outside tests. Kill or keep?

**A4.5 Pattern registry trim** — ~6–9 of 51 patterns actually consumed (Lane 2 confirms Section 5's "9 of 51" estimate). Coordinate with `packages/pixel/src/patterns/registry.ts` since `patterns.css` is auto-generated.

**A4.6 Vitest 2 → 4** + **A4.7 TypeScript 5.9 → 6.0** — Section 8 placed both before the pixel-dither plan. Vitest is the harder migration (config + API).

---

## TIER 5 — Long-running

**A5.1 dark.css `!important` triage** (see A4.3)

**A5.2 Font CSS consolidation** — merge `fonts.css` + `fonts-core.css` + `fonts-editorial.css` (~35 LOC) after orphan font-token removal (A2.4). Both `fonts-core.css` and `fonts-editorial.css` still exist (1.8K each).

**A5.3 Refactor 6-deep `:not()` button hover selectors** in base.css to positive `[data-state]` selectors. Specificity fix, medium risk.

**A5.4 Card/Switch inset box-shadow bevels** at `base.css:859-882` — relocate from base.css to component-owned `@layer components`. ~24 LOC organizational.

**A5.5 Scrollbar styling extraction** from base.css (~66 LOC) to its own `scrollbar.css`. Organizational.

**A5.6 `pattern-shadows.css`** (Lane 2 new finding, 6.2K, never mentioned in any source) — worth a separate audit pass.

---

## NEW FINDINGS (not in any source — surfaced by verification)

1. **`--color-accent-inv` is also stale in DESIGN.md** (Lane 2). DESIGN.md `:253` says Moon = cream; runtime `dark.css:91` says ink. Add to D1 reconciliation list.
2. **5 real TS errors in `apps/rad-os`** (Lane 4), orthogonal to Section 2's claims:
   - `pixel-code-gen.ts:29, 34` — TS2339 (`'dither'` missing on options shape)
   - `pixel-code-gen.ts:56` — TS18048 (`'guidance' is possibly undefined`)
   - `StudioExportPanel.tsx:141, 167` — TS2345 (canvas null narrowing)
3. **`pattern-shadows.css`** (Lane 2) — 6.2K file at `packages/radiants/pattern-shadows.css`, never mentioned anywhere. Audit pass needed.
4. **DNA-001 / DNA-999 scope is much bigger than Section 2 said** — DNA-999: 9 sites (not 5); DNA-001: 41 sites across 13+ files (not 4 files).
5. **Accent alias count is in between** — 85 occurrences across 38 files (not 36 across 18 nor 388 across 13).
6. **`oklch(0 0 0)` in `packages/ctrl/` is 9, not 20** — ColorPicker and `ctrl.css` already cleaned up (Section 8 was working from stale data).
7. **Combobox is fully dead** — confirmed by both Lane 1 and Section 8. Promote to "delete component," not "remove prop."
8. **AxisProfile fields ARE mutable** — Section 2's TS2540 claim was false. The readonly is on the wrapper `CoordinateProfile`, not the inner `AxisProfile`.
9. **Section 8's "all 33 strict-orphan tokens are USED" reversal is wrong** — both Lane 1 and Lane 2 independently confirmed 32 of 33 are genuinely unreferenced. Only `--ctrl-row-height` is alive.
10. **`SettingsMenu` Section count is 5, not 6** — last section has no trailing Separator (Lane 3).
11. **`border-ink` drift in brand-assets is gone** — all four brand-assets/ toolbar lines now use `border-line` (Lane 2).
12. **`--glow-cream-hover`/`--glow-cream-active` already exist** at `dark.css:141-142` — partial extraction is in progress; A2.1 finishes the job.

---

## Recommended execution order

1. **One commit, today:** A1.1 + A1.2 + A1.3 + A1.4 (partial — 6 files only) + A1.5 + A1.6 + A1.8 + A1.9 + A1.10. All zero-decision, zero-risk, all re-verified. Plus drop the "DROP entirely" claims from any active todo lists.
2. **Decide D1** (dark-mode token semantics) so A2.1, A2.2, A4.1 can chain.
3. **Decide D3** (orphan token policy) so A2.4 can run.
4. **Decide D2** (typography-data chain) so A1.4 can finalize.
5. **Decide D4** (placeholder ID destination) so A1.7 can codemod.
6. **A2 + A3 batches** in any order after D1/D3.
7. **A4** migrations one-by-one, each its own PR.

---

## Files

- `SOURCES.md` — all 8 sessions verbatim
- `lane-1-dead-code.md` — Lane 1 evidence
- `lane-2-tokens-css.md` — Lane 2 evidence
- `lane-3-primitives.md` — Lane 3 evidence
- `lane-4-docs-tests-ts.md` — Lane 4 evidence
- `ROLLUP.md` — this file
