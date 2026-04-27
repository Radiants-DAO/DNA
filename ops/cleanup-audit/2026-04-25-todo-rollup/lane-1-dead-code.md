# Lane 1 — Dead Code & Deletes (verified 2026-04-25)

Scope: Section 4 buckets A/C/D, Section 7 knip leftovers, Section 8 dead-code surprises/confirmations + P2/P2b/P28 entries.

Method: graph + targeted grep against current tree. Excluded `.next/`, `.turbo/`, `node_modules/`, `tsbuildinfo`. Counted apps + packages source only.

---

## CONFIRMED DEAD (safe to delete)

### Files
- `apps/rad-os/components/apps/brand-assets/colors-tab/ColorDetail.tsx` — only self-reference at lines 7,11. Zero importers anywhere outside the file.
- `apps/rad-os/components/Rad_os/WindowTitleBar.tsx` — only references are the file itself (lines 24,87,96,108,130,267) + the barrel re-export at `apps/rad-os/components/Rad_os/index.ts:3`. No live callers. (Note: `AppWindowTitleBar` at `packages/radiants/components/core/AppWindow/AppWindow.tsx:595` is a different symbol.)
- `apps/rad-os/components/apps/typography-playground/TypeManual.tsx` — sole reference is its own definition. Imports `typography-data.ts`.
- `apps/rad-os/components/apps/typography-playground/TypeStyles.tsx` — sole reference is its own definition.
- `apps/rad-os/components/apps/typography-playground/TemplatePreview.tsx` — sole reference is its own definition. Imports `typography-data.ts`.
- `apps/rad-os/components/apps/typography-playground/PlaygroundControls.tsx` — sole reference is its own definition. Imports `typography-data.ts` (TEMPLATES).
- `apps/rad-os/components/apps/typography-playground/layouts/MagazineLayout.tsx` — sole reference is its own definition. Imports `typography-data.ts`.
- `apps/rad-os/components/apps/typography-playground/layouts/BroadsheetLayout.tsx` — sole reference is its own definition. Imports `typography-data.ts`.
- `apps/rad-os/components/Rad_os/index.ts` — barrel; zero importers (`grep -r "from '@/components/Rad_os'"` empty). Re-exports `AppWindow`, `WindowTitleBar`, `Desktop`, `Taskbar`, `StartMenu`, `RadOSDesktop`, `InvertModeProvider` — but every one of them is imported directly from its own module file by the live callers.
- `apps/rad-os/lib/dotting/utils/stack.ts` — zero importers (`grep -r "utils/stack"` empty in dotting tree).
- `apps/rad-os/scripts/import-radiants-pfps.mjs` — zero references in package.json scripts or any source file.

### Combobox component (P2b, P28)
Section 8 confirmed and verified again here: zero usages in `apps/`. References that exist:
- `packages/radiants/blocknote/renders/Combobox.tsx`, `packages/radiants/generated/blocknote-blocks.tsx` (auto-gen)
- `packages/radiants/meta/index.ts:102`, `packages/radiants/schemas/index.ts:58` (registries)
- `packages/radiants/registry/runtime-attachments.tsx:190` (Demo wrapper, only consumed by playground UI)
- `packages/radiants/components/core/__tests__/{base-ui-wrapper-policy,smoke}.test.tsx` (existence smoke tests)

Net: no application code uses Combobox. Promote to "delete component" — drop:
- `packages/radiants/components/core/Combobox/` (Combobox.tsx, .meta.ts, .schema.json, .test.tsx, index.ts)
- registry/meta/schema barrel entries
- blocknote auto-gen reference
- runtime-attachments demo entry
- two smoke-test assertions
- collapses `Combobox.autoHighlight` question (whole component dies)

### Catalog `resizable` field (Section 8)
`apps/rad-os/lib/apps/catalog.tsx` — `resizable: true` on lines 88, 109, 132, 143, 157, 168, 179. All 7 entries identical. Consumed at line 256 (`getWindowChrome`). Field is dead config — can be removed and `getWindowChrome` simplified.

### Knip "unused exports" — sample-verified
- `useWindowsStore` (`apps/rad-os/store/index.ts:59`) — definition only, zero importers in source.
- `downloadPretextBundle` (`apps/rad-os/components/apps/pretext/serialization.ts:136`) — definition only, zero importers.
- `UILibraryGallery`, `UILibraryProps` (`apps/rad-os/components/ui/UILibraryTab.tsx`) — zero references anywhere.
- `CANVAS_FG_VAR`, `CANVAS_BG_VAR` (`apps/rad-os/components/apps/pixel-playground/constants.ts:64-65`) — zero importers.
- `channels` export from `apps/rad-os/lib/mockData/tracks.ts:21` — `getTracksByChannel` is what callers use, not the raw `channels` constant.

### Strict-orphan tokens (P8 — Section 4 list, partial verification of Section 8 reversal)
Section 8 said "all 33 USED" — that is wrong. Section 4's "orphan" claim is closer to reality, but the tokens are likely intentionally kept as public-contract surface (Section 5 explicitly defers). Token-by-token, `var()` consumers in source (excluding `.next/`, `.turbo/`, `generated/`, `*.json`):

ZERO consumers (truly orphan in usage):
- `--color-edge-focus`, `--color-edge-hover`, `--color-edge-muted` — only defined in `tokens.css` / `dark.css`
- `--color-content-heading`, `--color-content-link`, `--color-content-secondary` — only defined in `tokens.css` / `dark.css`
- `--color-action-accent`, `--color-action-secondary`, `--color-action-destructive` — only defined in `tokens.css`
- `--color-active-overlay`, `--color-hover-overlay` — only defined in `dark.css`
- `--color-surface-elevated`, `--color-surface-muted`, `--color-surface-tertiary`, `--color-surface-overlay-medium`, `--color-surface-overlay-subtle` — only defined in `dark.css`
- `--color-error-red`, `--color-warning-yellow`, `--color-focus-state` — only defined in `tokens.css`
- `--font-blackletter-inline`, `--font-waves-tiny` (`fonts.css:34,36`) — no consumers, no Tailwind utility usage
- `--ctrl-size-sm`, `--ctrl-size-md`, `--ctrl-size-lg` (`packages/ctrl/ctrl.css:20-22`) — no consumers
- `--touch-target-default`, `--density-scale` — defined in `tokens.css`; only referenced by `packages/radiants/test/density-contract.test.ts` (pure existence assertion)
- `--easing-spring` — defined in `tokens.css:202`, listed in `contract/system.ts:114` (registry, not consumer); zero `var()` consumers
- `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width` — defined in `tokens.css:217-219`; only the figma-contract generator script touches them
- All eight `--z-index-*` tokens (`tokens.css:237-244`) — zero `var()` consumers, zero `z-base|desktop|windows|chrome|menus|toasts|modals|system` Tailwind utility usage in source

Live (NOT orphan, contradicting Section 4):
- `--color-ctrl-active`, `--color-ctrl-rule` — used in `packages/ctrl/ctrl.css` cascade (lines 33,41,53,61) — these are LIVE
- `--ctrl-row-height` — used in 7+ files (ActionButton, LayerRow, PropertyRow, Stepper, SegmentedControl) — LIVE
- `--duration-scalar` — set under reduced-motion media query at `tokens.css:257`, referenced in DESIGN.md and figma generator — LIVE in spirit (controls animation system)
- `--easing-default` — referenced in 5 files, contract includes it — LIVE

Recommendation: keep as public-contract surface per Section 5's explicit deferral. Document them as "API tokens reserved for consumers" rather than deleting. Section 4's "safe delete" framing was wrong; Section 8's "all USED" framing was also wrong.

---

## NOT DEAD (cross off the list)

- `Button.focusableWhenDisabled` — `packages/radiants/components/core/Button/Button.tsx:204,309` reads it; `Button.test.tsx:33` exercises it (`render(<Button disabled focusableWhenDisabled>...)`). Section 8 confirmed; keep.
- `Spinner.completed` — `packages/radiants/components/core/Spinner/Spinner.tsx` uses it on lines 18,31,36,47,58,62,90,94,101,115,118 (renders checkmark branch); `registry/runtime-attachments.tsx:568-569` Demo passes it. Section 8 confirmed; keep.
- `Menubar.modal` — has a sole live caller (`apps/rad-os/components/apps/ScratchpadApp.tsx:125 <Menubar.Root>`) that omits the prop. Default branch is technically unexercised, but Section 8 says "default stays" (public API). The prop wiring on `Menubar.tsx:18,77,81` is live.
- `Combobox.autoHighlight` — moot if Combobox is deleted entirely (P2b).
- `Rad_os/Desktop.tsx` — live, imported by `RadOSDesktop.tsx:2`. (Section 4 + Section 8 both confirmed.)
- `START_MENU_CATEGORIES`, `START_MENU_LINKS` (`lib/apps/catalog.tsx`) — live, imported by `apps/rad-os/components/Rad_os/CommandPalette.tsx:7-8`. Section 7's knip claim is STALE.
- `parseContent` (`apps/rad-os/components/apps/manifesto/manifesto-data.ts:37`) — live, called internally on lines 422-425. Knip false positive.
- `pointInTriangle` (`apps/rad-os/hooks/useSafeHover.ts:37`) — live, called internally at line 133. Knip false positive.
- `BrandColorCard`, `ExtendedColorSwatch` (`colors-tab/ColorCards.tsx`) — currently consumed only by `ColorDetail.tsx`; will become orphan once ColorDetail is deleted.
- `SemanticTokenRow`, `CopyableRow` (same file) — internal-only consumers (`ColorCards.tsx:173`, `:45-48`); may stay if file kept.
- `SemanticCategoryCard` (`ColorCards.tsx:148`) — live, used by `SemanticView.tsx:4`.
- `SubTabNav`, `TypographyPlayground`, `SpecimenLayout`, `EditorialLayout` — live (TypographyPlayground imported by `BrandApp.tsx:9,76`; it imports SpecimenLayout + EditorialLayout). EditorialLayout is self-contained (no typography-data import).
- `typography-data.ts` — STILL needed by SpecimenLayout (`layouts/SpecimenLayout.tsx:2` imports `CORE_FONTS, EDITORIAL_FONTS, TYPE_SCALE, ELEMENT_STYLES, FontEntry`) and the test (`apps/rad-os/test/typography-data.test.ts:2` imports `FONTS`). Cannot delete unless SpecimenLayout + test go too.
- `react-draggable` package dep — STILL imported by `packages/radiants/components/core/AppWindow/AppWindow.tsx:4` and `apps/rad-os/components/apps/typography-playground/TemplatePreview.tsx:4`. Section 7's "after react-draggable removal" comment is moot — it has not been removed.

---

## CHANGED SINCE AUDIT

- `apps/rad-os/components/apps/pattern-playground/` — DIRECTORY GONE. Section 7's "9 files to delete" is moot; already done.
- `apps/rad-os/components/ui/index.ts` — FILE GONE. Section 7's "dead barrel" is moot; already deleted.
- `apps/rad-os/app/unused-review/page.tsx` — DOES NOT EXIST. Sections 3 + 7 both reference it; only Section 8 was right (no such page). Existing app pages: `assets/`, `color-mapping/`, `ctrl-preview/`, `icon-conversion-review/`, `pixel-corners/`, plus root `page.tsx`. Drop the bullet.
- `LCD_GLOW_TEXT_SHADOW`, `LCD_TEXT_COLOR` exports — GONE. `apps/rad-os/components/apps/radio/styles.ts` was rewritten to a single 14-line module exporting only `lcdText`. Section 7's knip claim is stale.
- `FONT_MAP`, `BROADSHEET`, `DESIGN_STATEMENT`, `TYPOGRAPHY_RULES` exports — GONE from `typography-data.ts`. Section 7's claim is stale (those names no longer exist as exports). `TEMPLATES` is still exported at line 201 but is only consumed by the soon-to-be-deleted `PlaygroundControls` + `TemplatePreview`; will become orphan after the 6-file delete.
- `Combobox` — Section 4 said "verify separately"; Section 8 verified and called it fully dead. Re-verified: zero `apps/` callers; component is dead at the application layer.

---

## STILL AMBIGUOUS / NEEDS USER DECISION

- **Strict-orphan tokens (33 listed in Section 4)** — Section 5 explicitly defers them as "public contract surface (README + Figma tokens); keep." Sections 4 and 8 disagree on whether they're dead. Recommendation: keep them, but the decision is yours. If you want to prune, the safe-to-actually-delete list per the var()/utility analysis above is: `--color-edge-{focus,hover,muted}`, `--color-content-{heading,link,secondary}`, `--color-action-{accent,secondary,destructive}`, `--color-active-overlay`, `--color-hover-overlay`, `--color-surface-{elevated,muted,tertiary,overlay-medium,overlay-subtle}`, `--color-error-red`, `--color-warning-yellow`, `--color-focus-state`, `--font-blackletter-inline`, `--font-waves-tiny`, `--ctrl-size-{sm,md,lg}`, `--easing-spring`, `--focus-ring-{color,offset,width}`, all 8 `--z-index-*`. Excludes `--touch-target-default`, `--density-scale` (test asserts existence), `--duration-scalar` (live behavior), `--color-ctrl-{active,rule}` (live in ctrl.css), `--ctrl-row-height` (live in 7+ ctrl/ files), `--easing-default` (live in 5 files).
- **`Menubar.modal` default-path** — sole caller (ScratchpadApp) omits the prop, so the `false` branch is the only path exercised. Keep for API surface (Section 8) or trim to dead-code? User call.
- **typography-data.ts + SpecimenLayout + typography-data.test.ts** — Section 8 chain-delete sub-step. Three options: (a) keep all three; (b) delete only the 6 files in the "confirmed dead" list and leave typography-data + Specimen + test alone; (c) full chain delete (kill SpecimenLayout from TypographyPlayground, then drop typography-data + test). User call.
- **`channels` export in `lib/mockData/tracks.ts`** — only the function `getTracksByChannel` is used. The raw `channels` array could be deleted, but keeping it as documentation of the mock data shape may have value. User call.

---

## DEDUPED ACTION LIST (this lane only)

Order: zero-decision deletes first, then bundled deletes, then questions.

1. Delete `apps/rad-os/components/apps/brand-assets/colors-tab/ColorDetail.tsx`. After delete, also drop `BrandColorCard` + `ExtendedColorSwatch` exports from `ColorCards.tsx` (they have no other consumers).
2. Delete `apps/rad-os/components/Rad_os/WindowTitleBar.tsx` and remove `export { WindowTitleBar } from './WindowTitleBar';` line in `apps/rad-os/components/Rad_os/index.ts:3`.
3. Delete `apps/rad-os/components/Rad_os/index.ts` entirely (barrel has zero importers; lines 2-12 each re-export a symbol whose live callers already import from the source module).
4. Delete the 6 typography-playground dead files:
   - `TypeManual.tsx`
   - `TypeStyles.tsx`
   - `TemplatePreview.tsx`
   - `PlaygroundControls.tsx`
   - `layouts/MagazineLayout.tsx`
   - `layouts/BroadsheetLayout.tsx`
   After delete, `TEMPLATES` export in `typography-data.ts` becomes orphan — drop it too. (`type-manual-copy.ts` still exists in the dir; verify standalone before treating as dead.)
5. Delete `apps/rad-os/lib/dotting/utils/stack.ts`.
6. Delete `apps/rad-os/scripts/import-radiants-pfps.mjs`.
7. Delete Combobox component fully:
   - `packages/radiants/components/core/Combobox/` (whole dir)
   - Combobox entries in `packages/radiants/meta/index.ts:102-103`
   - Combobox entries in `packages/radiants/schemas/index.ts:58`
   - `packages/radiants/blocknote/renders/Combobox.tsx`
   - Combobox refs in `packages/radiants/generated/blocknote-blocks.tsx:4,16,179,656` (re-run generator)
   - Combobox demo block in `packages/radiants/registry/runtime-attachments.tsx:190-220` + the `Combobox` import + `useComboboxFilter` line
   - Combobox assertions in `__tests__/base-ui-wrapper-policy.test.tsx:45` + `__tests__/smoke.test.tsx:23,48`
   - `ComboboxMeta` references in `registry/__tests__/preview-state-authoring.test.ts:31,37`
8. Trim catalog `resizable` field — remove from interface (`catalog.tsx:69`) and the 7 entries (88, 109, 132, 143, 157, 168, 179) and from `getWindowChrome` at line 256.
9. Flip `AppWindow.contentPadding` default to `false` in the AppWindow component, then strip `contentPadding: false` from all 7 catalog entries (lines 89, 110, 133, 144, 158, 169, 180) and from `getWindowChrome` at line 257.
10. Trim unused exports (knip-confirmed):
    - `useWindowsStore` (`store/index.ts:59`)
    - `downloadPretextBundle` (`apps/rad-os/components/apps/pretext/serialization.ts:136`)
    - `UILibraryGallery`, `UILibraryProps` (`components/ui/UILibraryTab.tsx`)
    - `CANVAS_FG_VAR`, `CANVAS_BG_VAR` (`pixel-playground/constants.ts:64-65`)
11. Drop these claims from the rollup as STALE:
    - "delete `app/unused-review` page" — page doesn't exist
    - "delete `pattern-playground/` 9 files" — directory already gone
    - "delete `components/ui/index.ts` barrel" — file already gone
    - "knip: `LCD_GLOW_TEXT_SHADOW`, `LCD_TEXT_COLOR` unused" — exports already removed from styles.ts
    - "knip: `FONT_MAP`, `BROADSHEET`, `DESIGN_STATEMENT`, `TYPOGRAPHY_RULES` unused" — exports already gone from typography-data.ts
    - "Run `pnpm install` after react-draggable removal" — react-draggable still in use, not removed
    - Section 4 P8 "safe delete strict-orphan tokens" — too aggressive; Section 5 is the canonical position (keep as public contract)
    - Section 8's "P8 all 33 USED" — also wrong; many tokens have zero `var()` or utility consumers, but they are kept intentionally as API
12. User decisions:
    - typography-data.ts + SpecimenLayout + test chain — keep, partial-delete, or full-delete?
    - Menubar.modal default — drop or keep as API?
    - Strict-orphan tokens — prune the truly-zero-consumer list, or keep all per Section 5?
    - `channels` mock data export — drop or keep for documentation?
