# Lane 4 — Docs, Comments, Tests, TS Errors (verified 2026-04-25)

Verified against working tree at `/Users/rivermassey/Desktop/dev/DNA-logo-maker`,
branch `feat/logo-asset-maker`. Source rollup: `SOURCES.md`. Section 8
(`d51f5119`) preferred on contradictions per instructions.

## CONFIRMED (claim still true)

- **DESIGN.md dark-token mismatch (Section 5 #2 / Section 8 P5).** `packages/radiants/DESIGN.md:232–246` still describes Moon Mode as ink-based:
  - `--color-flip` → "ink" (line 236) vs runtime `var(--color-cream)` (`dark.css:73`)
  - `--color-mute` → "cream (60%)" (line 235) vs runtime `oklch(0.9126 0.1170 93.68 / 0.6)` (sun-yellow @ 60%, `dark.css:72`)
  - `--color-line` → "cream (20%)" (line 243) vs runtime sun-yellow @ 20% (`dark.css:80`)
  - `--color-rule` → "cream (12%)" (line 244) vs runtime sun-yellow @ 12% (`dark.css:81`)
  Decision still pending: keep sun-yellow runtime or revert to ink/cream as documented.

- **SPEC.md dead shadow tokens (Section 6 #1 / Section 8 P4).** `apps/rad-os/SPEC.md:369–371` still lists:
  ```
  --shadow-btn: 2px 2px 0px 0px var(--border-primary);
  --shadow-btn-hover: 3px 3px 0px 0px var(--border-primary);
  --shadow-card: 4px 4px 0px 0px var(--border-primary);
  ```
  Tokens are no longer defined in `tokens.css`. Doc is stale.

- **theme-spec.md dead shadow refs (Section 6 #1).** `docs/theme-spec.md`:
  - line 289 — `--shadow-card` listed under "Shadows" reference block
  - line 303 — table row `Shadow | --shadow-{name} | Box shadows | --shadow-card`
  - lines 346–348 — example `@theme` block still emits `--shadow-btn`/`--shadow-card`
  - line 623 — example className `shadow-card hover:shadow-card-hover`

- **`no-clipped-shadow.mjs` stale comment (Section 6 #4 / Section 8 P4).** Rule lives at `packages/radiants/eslint/rules/no-clipped-shadow.mjs:29` (path nuance — Section 6 said `eslint/no-clipped-shadow.mjs:29`, the `.mjs` is in `eslint/rules/`). The line still reads:
  ```
  // Excludes: pixel-shadow-* (correct), shadow-none, shadow-inner, arbitrary shadow-[...]
  ```
  `shadow-inner` is no longer a token; should reference `shadow-inset`.

- **DNA-999 placeholder issue IDs still pervasive (Section 2 #16).** 9 occurrences:
  - `apps/rad-os/components/apps/radio/RadioDisc.tsx` lines 90, 92, 178, 190, 201, 220, 254 — Section 2 said 3 sites; current count is 7 (more drift than reported)
  - `packages/radiants/components/core/Spinner/Spinner.tsx:112`
  - `packages/radiants/components/core/PixelIcon/PixelIcon.test.tsx:73`

- **DNA-001 placeholder issue IDs (Section 2 #16).** 41 occurrences across 13+ files (Section 2 said 4 files; bigger drift). Notable hosts:
  - `apps/rad-os/components/Rad_os/Desktop.tsx:93, 95`
  - `apps/rad-os/components/Rad_os/InvertOverlay.tsx:21`
  - `apps/rad-os/components/ui/DesignSystemTab.tsx:92`
  - `apps/rad-os/components/ui/UILibrarySidebar.tsx:77`
  - `apps/rad-os/components/apps/brand-assets/colors-tab/ColorCards.tsx` — 9 sites
  - `apps/rad-os/components/apps/brand-assets/colors-tab/FibonacciMosaic.tsx` — 2 sites
  - `apps/rad-os/components/apps/brand-assets/colors-tab/ColorPrimaryCard.tsx` — 5 sites
  - `apps/rad-os/components/apps/pixel-playground/RegistryList.tsx` — 2 sites
  - `apps/rad-os/components/apps/pixel-playground/previews/PatternPreview.tsx` — 2 sites
  - `apps/rad-os/components/apps/pixel-playground/previews/CornerPreview.tsx` — 4 sites
  - `apps/rad-os/components/apps/pixel-playground/PixelThumb.tsx`
  - `apps/rad-os/components/apps/BrandApp.tsx`
  - `apps/rad-os/components/apps/typography-playground/TypeStyles.tsx`, `TypeManual.tsx`, `layouts/EditorialLayout.tsx`

- **ICON_ALIASES still live (Section 6 #3).** `packages/radiants/icons/manifest.ts:17` exports a 43-entry alias map (`as const`). Type alias at `:62`. Self-consumed at `:5300` (the file itself runs `Object.entries(ICON_ALIASES)` to populate the SVG manifest). Old alias names are still consumed by `name=` props in app code:
  - `close` (6), `search` (5), `plus` (4), `pencil` (4), `chevron-right` (3), `twitter` (2), `trash` (2), `download` (2), `discord` (2), `chevron-left` (2), `question`/`globe`/`eye`/`copy` (1 each)
  - Migration is non-trivial: 35+ live call sites would need rename.

## INVALIDATED (claim no longer true)

- **Dialog.test.tsx / Sheet.test.tsx querying removed `.bg-hover` (Section 3).** Both files now query `.pattern-backdrop`:
  - `Dialog.test.tsx:89` → `document.querySelector('.pattern-backdrop')`
  - `Sheet.test.tsx:88` → `document.querySelector('.pattern-backdrop')`
  Both pass. Section 8 P3 was correct; Section 3 was already stale at the time of that rollup.

- **TS2307 — `.next/types/validator.ts:98` referencing `app/unused-review/page.js` (Section 2).** No longer present. The line now references `../../app/assets/fonts/[fontFile]/route.js`. Stale Next cache has been rebuilt; `apps/rad-os/app/unused-review` directory does not exist. No TS2307 from `tsc --noEmit`.

- **TS2540 ×9 — `apps/rad-os/lib/icon-conversion-review.ts:142, 173, 175` assigning to readonly props (Section 2).** No longer present. Inspection: `interface AxisProfile { int: number; half: number; other: number; }` (lines 38–42) — fields are mutable. Only `CoordinateProfile` wraps them with `readonly x` / `readonly y`. The `axis[bucketCoordinate(value)] += 1` assignments at lines 144, 175, 177 mutate the (writable) field of an AxisProfile. `tsc --noEmit` in `apps/rad-os` reports zero TS2540.

- **TS2322 — `packages/radiants/.../AppWindow.tsx:1014` `wrapperStyle` missing `--app-content-max-height` (Section 2).** Not present. Line 1014 is inside the `chromeCtx = useMemo<AppWindowChromeContext>` literal, not a `wrapperStyle`. Real `wrapperStyle` is built at line 1387 and consumed at line 1947; both branches at lines 1372 and 1378 explicitly set `'--app-content-max-height': \`${maxContentHeight}px\``. `tsc --noEmit` in `apps/rad-os` reports zero TS2322.

- **DESIGN.md "two-node" prose drift (Section 8 P33 — already noted there as nonexistent).** Confirmed: zero matches for "two-node", "two node", or "two_node" in `packages/radiants/DESIGN.md`. Drop the bullet (Section 8 already did).

- **`manifest.ts:4` stale generator comment (Section 6 / contradicted by Section 8).** Reading lines 1–13 in context, the comment is *historical narration*, not an instruction:
  > "Originally generated by the legacy `scripts/generate-icons.ts` pipeline. That generator was removed in Stage 4 of the pixel-icon migration; this file is now a checked-in source of truth..."
  The follow-up sentences explicitly state the generator is gone and the file is hand-edited. Not stale — Section 8 is right.

- **`archive/reports/2026-03-27-production-readiness-checklist.md:136` stale `[data-theme]` note (Section 5 #12).** The note documents a *resolved-and-explained* check item:
  > "Duplicate dark mode tokens... ✅ Verified intentional: base.css uses `[data-theme="dark"]` (attribute forcing), dark.css uses `.dark` (preference-driven) — different selectors, different token sets"
  This is in the archived production-readiness report; the explanation is still accurate. Not stale — Section 8 is right.

## TESTS — RUN STATUS

- **Dialog.test.tsx** — PASS (10 tests passed). Selector queried: `.pattern-backdrop` (line 89).
- **Sheet.test.tsx** — PASS (7 tests passed). Selector queried: `.pattern-backdrop` (line 88).
- **`pattern-backdrop-contract.test.ts`** also passes (1 test) — confirms the selector is locked in by a contract test.

Run command: `cd packages/radiants && pnpm test`. Both files appear in the green list.

## TYPECHECK STATUS

Ran `pnpm exec tsc --noEmit` in `apps/rad-os` (no repo-root `typecheck` script exists). 5 errors total, none from Section 2's claimed list:

| Section 2 claim | Status | Evidence |
|---|---|---|
| TS2307 `.next/types/validator.ts:98` → `app/unused-review/page.js` | **ABSENT** | `validator.ts:98` now points to `app/assets/fonts/[fontFile]/route.js`; cache rebuilt. |
| TS2540 ×9 in `apps/rad-os/lib/icon-conversion-review.ts:142,173,175` | **ABSENT** | `AxisProfile` fields are mutable. Zero TS2540 in tsc output. |
| TS2322 `packages/radiants/.../AppWindow.tsx:1014` (`wrapperStyle` missing `--app-content-max-height`) | **ABSENT** | Real `wrapperStyle` literal at line 1387 includes the var via spread of `'--app-content-max-height': '${maxContentHeight}px'` (lines 1372, 1378). Zero TS2322 in tsc output. |

Current real TS errors in `apps/rad-os` (orthogonal to Section 2 claims, but worth flagging):
- `components/apps/pixel-playground/pixel-code-gen.ts:29` — TS2339 `Property 'dither' does not exist on type '{ patterns: string; icons: string; corners: string; }'`
- `components/apps/pixel-playground/pixel-code-gen.ts:34` — TS2339 same shape (array variant)
- `components/apps/pixel-playground/pixel-code-gen.ts:56` — TS18048 `'guidance' is possibly 'undefined'`
- `components/apps/studio/StudioExportPanel.tsx:141, 167` — TS2345 `HTMLCanvasElement | null | undefined` not assignable to `HTMLCanvasElement | undefined`

Did not run typecheck for `packages/radiants` (no `tsconfig.json` at the package root — uses inherited config; tsc -p failed). Worth a follow-up if a separate radiants typecheck is wanted.

## DEDUPED ACTION LIST (this lane)

1. **Doc patches — shadow tokens** (~10 LOC, no behavior change):
   - `apps/rad-os/SPEC.md:369-371` — remove or annotate the dead `--shadow-btn`/`--shadow-btn-hover`/`--shadow-card` block.
   - `docs/theme-spec.md` — refresh lines 289, 303, 346–348, 623 to reference live shadow tokens (e.g. `--shadow-resting`, `--shadow-lifted`, `pixel-shadow-*`) or note them as illustrative only.

2. **DESIGN.md dark-token reconciliation** (Section 5 #2). Doc says ink/cream-based, runtime is sun-yellow-based. **Decision required** before any edit — match doc to runtime, or change runtime back to match doc. Affected rows in `packages/radiants/DESIGN.md:232–244`: `--color-flip`, `--color-mute`, `--color-line`, `--color-rule`.

3. **`no-clipped-shadow.mjs:29` comment fix.** Replace `shadow-inner` with `shadow-inset` in the inline comment at `packages/radiants/eslint/rules/no-clipped-shadow.mjs:29`. 1-LOC change.

4. **Placeholder issue IDs — DNA-999 / DNA-001 cleanup**. Scope is bigger than Section 2 said:
   - 9 × `DNA-999` (RadioDisc x7, Spinner.tsx:112, PixelIcon.test.tsx:73)
   - 41 × `DNA-001` across 13+ files (full list in CONFIRMED above)
   - Decision required: real issue tracker (Linear vs GitHub) — then bulk rewrite.

5. **ICON_ALIASES audit** (Section 6 #3 / Section 8 P10). 43-entry map at `manifest.ts:17`. Before pruning, codemod the 35+ `name="<alias>"` consumers across apps to use the canonical name (e.g. `name="check" → name="checkmark"`). Then drop the alias entries. The Section 8 estimate that "old-name usage" needed grepping is correct — old names ARE still consumed.

6. **Drop these bullets from the global todo** (already invalidated):
   - Section 3 stale `.bg-hover` test claim — tests pass on `.pattern-backdrop`.
   - Section 2 TS2307 / TS2540×9 / TS2322 — none reproducible.
   - Section 8 P33 two-node DESIGN.md drift — confirmed nonexistent.
   - `manifest.ts:4` stale generator comment — historical narration, not stale.
   - `archive/.../checklist.md:136` `[data-theme]` note — accurately documents resolved item.

7. **Optional follow-up** (not in source rollup but surfaced by tsc): triage the 5 real TS errors (`pixel-code-gen.ts` × 3, `StudioExportPanel.tsx` × 2) — small fixes, narrow types or null-guard.
