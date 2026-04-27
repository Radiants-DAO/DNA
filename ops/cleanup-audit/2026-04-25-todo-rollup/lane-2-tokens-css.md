# Lane 2 — Token Drift & CSS (verified 2026-04-25)

Verified against the working tree at `/Users/rivermassey/Desktop/dev/DNA-logo-maker` (branch `feat/logo-asset-maker`). Excludes `.next/`, `node_modules/`, and `generated/` from all greps. Build artifacts were ignored.

---

## CONFIRMED (claims still true)

- **Accent aliases still defined in `tokens.css`** (Section 6) — `--color-accent`, `--color-accent-inv`, `--color-accent-soft`, `--color-danger`, `--color-success`, `--color-warning` defined at `packages/radiants/tokens.css:113-118` (and re-bound under `.dark` at `packages/radiants/dark.css:90-95`).
- **`--color-flip` resolves to cream in dark mode** (Section 5 #2) — `packages/radiants/dark.css:73`: `--color-flip: var(--color-cream);`. DESIGN.md table at `packages/radiants/DESIGN.md:234` says Moon = ink. Mismatch confirmed.
- **`--color-mute` resolves to sun-yellow/60 in dark mode** (Section 5 #2) — `packages/radiants/dark.css:72`: `oklch(0.9126 0.1170 93.68 / 0.6)`. DESIGN.md `:235` says Moon = cream/60. Mismatch confirmed.
- **`--color-line` resolves to sun-yellow/20 in dark mode** (Section 5 #2) — `packages/radiants/dark.css:80`: `oklch(0.9126 0.1170 93.68 / 0.2)`. DESIGN.md `:243` says Moon = cream/20. Mismatch confirmed.
- **`--color-rule` resolves to sun-yellow/12 in dark mode** (Section 5 #2) — `packages/radiants/dark.css:81`: `oklch(0.9126 0.1170 93.68 / 0.12)`. DESIGN.md `:244` says Moon = cream/12. Mismatch confirmed.
- **Glow alpha literals in `dark.css`** (Section 5 #1, Section 8) — 27 sun-yellow `oklch(0.9126 0.1170 93.68 / X)` + 12 cream `oklch(0.9780 0.0295 94.34 / X)` = 39 inline literals. Exact match.
- **`dark.css` `!important` count = 93** (Section 2 item #14) — confirmed exact.
- **`oklch(0 0 0)` literal in `RadioDisc.tsx`** (Section 3 token-drift) — still at `apps/rad-os/components/apps/radio/RadioDisc.tsx:91` (`backgroundColor: 'oklch(0 0 0)'`).
- **`bg-black` in ctrl-preview** (Section 2 item #7) — exactly 2 occurrences at `apps/rad-os/app/ctrl-preview/page.tsx:112,156`. Audit's revised count of 2 is correct.
- **`--color-lcd-black` token does NOT exist** — proposed replacement token in Section 3 / Section 8 P7 has not been added to `tokens.css`, `dark.css`, or `ctrl.css`. Migration target needs to be authored.

---

## CHANGED SINCE AUDIT (counts/locations have shifted)

- **Accent alias usages — 85 occurrences across 38 files** (task regex: `\b(bg|text|border|ring|fill|stroke|outline)-(accent|accent-inv|accent-soft|danger|success|warning)(?:-|/|\b)`). Section 6 said 36×18, Section 8 said 388×13. **Both are wrong.** Truth is 85 className utility hits across 38 files. (Adding `var(--color-accent…)` CSS consumers brings the total to ~163 references, but those are not in the task's regex form.)
- **`oklch(0 0 0)` in `packages/ctrl/` — 9 occurrences across 5 files**, not 20 across 6 files (Section 8). Current matches:
  - `packages/ctrl/layout/LCDScreen/LCDScreen.css:17`
  - `packages/ctrl/readouts/LEDProgress/LEDProgress.css:15` (comment), `:24` (definition)
  - `packages/ctrl/selectors/Dropdown/Dropdown.tsx:83`
  - `packages/ctrl/selectors/TransportPill/TransportPill.css:22,30,31,32`
  - `packages/ctrl/selectors/TransportPill/TransportPill.tsx:55`
  - **No occurrences in ColorPicker or ctrl.css** (Section 8 had stale data; those were already cleaned up).
- **In `packages/radiants/`**, `oklch(0 0 0)` appears only as the `--color-pure-black` definition itself at `tokens.css:26` (`oklch(0.0000 0.0000 0)`), plus generator references in `pixel-corners.css` / tests. No raw component-level usages remain.
- **`border-line` vs `border-ink` drift in `brand-assets/`** (Section 3) — drift is GONE inside `apps/rad-os/components/apps/brand-assets/`. All four occurrences there now use `border-line` (`ColorCards.tsx:18,64`, `ColorsTab.tsx:21,34`). The remaining `border-ink` cases live OUTSIDE brand-assets:
  - `apps/rad-os/components/apps/BrandApp.tsx:70`
  - `apps/rad-os/components/apps/goodnews/GoodNewsLegacyApp.tsx:1131`
  Different scope than the audit; the original brand-assets toolbar drift is resolved.

---

## INVALIDATED (claim is no longer true)

- **Section 8 verification said "P8 strict-orphan tokens are actually USED" — WRONG.** Independently verified: zero `var()` consumers and zero Tailwind utility consumers for ALL 33 listed orphan tokens, except `--ctrl-row-height` (heavily used inside `packages/ctrl/`). Section 4 / agent-3 was right; Section 8's reversal is incorrect. Per-token orphan status:
  - **Color (all 0 consumers outside their own definition):** `--color-action-accent`, `--color-action-secondary`, `--color-action-destructive`, `--color-active-overlay`, `--color-content-heading`, `--color-content-link`, `--color-content-secondary`, `--color-ctrl-active`, `--color-ctrl-rule`, `--color-edge-focus`, `--color-edge-hover`, `--color-edge-muted`, `--color-error-red`, `--color-focus-state`, `--color-hover-overlay`, `--color-surface-elevated`, `--color-surface-muted`, `--color-surface-tertiary`, `--color-surface-overlay-medium`, `--color-surface-overlay-subtle`, `--color-warning-yellow` — all defined in `tokens.css` and/or `dark.css`, none referenced elsewhere.
  - **Font tokens:** `--font-blackletter-inline` (`packages/radiants/fonts.css:34`) and `--font-waves-tiny` (`fonts.css:36`) — defined, zero consumers.
  - **Ctrl tokens defined in `packages/ctrl/ctrl.css`:** `--ctrl-size-sm/md/lg`, `--color-ctrl-active`, `--color-ctrl-rule` — defined, zero consumers. **EXCEPTION:** `--ctrl-row-height` (`ctrl.css:17`) IS heavily consumed (ActionButton, LayerRow, PropertyRow, Stepper, SegmentedControl) — Section 8 was right about this one.
  - **Motion tokens:** `--density-scale`, `--touch-target-default`, `--duration-scalar`, `--easing-default`, `--easing-spring` — defined in `tokens.css`, zero `var()` consumers in any css/tsx file. (Note: `--duration-scalar` is referenced by figma-contracts script, not runtime CSS.)
  - **Focus ring:** `--focus-ring-width`, `--focus-ring-offset`, `--focus-ring-color` — `tokens.css:217-219`, zero consumers.
  - **Z-index family:** all 8 (`--z-index-base/desktop/windows/chrome/menus/toasts/modals/system`) at `tokens.css:237-244` — zero consumers.
  - **Net:** 32 of 33 are genuine orphans. Only `--ctrl-row-height` is alive. **Drop Section 8's reversal; restore Section 4 bucket D as actionable** (with the `--ctrl-row-height` carve-out).

---

## NEW FINDINGS (drift that wasn't in any source)

- **`--color-accent-inv` is also stale in DESIGN.md** — DESIGN.md table at `packages/radiants/DESIGN.md:253` says Moon = cream; runtime at `dark.css:91` says ink (`var(--color-ink)`). Add this fifth token to the Section 5 #2 reconciliation list.
- **`--color-action-accent` IS referenced in the contract whitelist** at `packages/radiants/contract/system.ts:40,72` (registered as a valid sunset-fuzz binding). It is still NOT consumed at the CSS level. If it's part of the public Figma/contract surface (per Section 5 deferred list — "long-form semantic token tiers … keep"), the orphan label may not apply. Treat the entire `--color-content-*`, `--color-edge-*`, `--color-action-*`, `--color-status-*`, `--color-surface-*` families as "contract surface, not orphan" if Section 5's deferred decision is honored — but `--color-active-overlay`, `--color-hover-overlay`, `--color-warning-yellow`, `--color-error-red`, `--color-focus-state`, ctrl-active/rule/size, motion, focus-ring, z-index families remain genuinely unreferenced and not in the contract whitelist.
- **`pattern-playground/` directory has been deleted** — Section 7 listed it as 9 unused files; verified gone. Pattern usage in code is now minimal: only 6 patterns have `var(--pat-X)` consumers (`checkerboard`, `diagonal-dots`, `diagonal-right`, `dust`, `mist`, `spray-grid`). 6 patterns referenced via `<Pattern pat="X">` JSX. Total used ≈ 6–9 of 51 patterns in the registry. **Section 5 #9 estimate of "9 of 51" is essentially correct.**
- **`fonts-core.css` (1.8K) and `fonts-editorial.css` (1.8K) both still exist** alongside `fonts.css` (1.6K) — Section 5 #10 consolidation candidate is still pending. The orphan `--font-blackletter-inline` / `--font-waves-tiny` live in `fonts.css:34,36`.
- **`pattern-shadows.css` (6.2K)** — exists at `packages/radiants/pattern-shadows.css`, never mentioned in any source. Worth a separate audit pass.
- **`@theme` glow-alpha tokens in dark.css are partially extracted already** — `--glow-cream-hover` and `--glow-cream-active` exist (`dark.css:141-142`). The 39 inline literal count in Section 5 #1 reflects the remaining un-tokenized usages, so the consolidation work is real and ~40 LOC remains to extract.

---

## DEDUPED ACTION LIST (this lane only, prioritized)

**P1 — Decision required (blocks downstream work)**
1. **DESIGN.md ↔ runtime token mismatch** — reconcile 5 tokens in dark mode: `--color-flip` (doc: ink, runtime: cream), `--color-mute` (doc: cream/60, runtime: sun-yellow/60), `--color-line` (doc: cream/20, runtime: sun-yellow/20), `--color-rule` (doc: cream/12, runtime: sun-yellow/12), `--color-accent-inv` (doc: cream, runtime: ink). Either keep the sun-yellow/ink runtime and update doc, or revert runtime to match doc. Until decided, P29 cannot finalize.

**P2 — Zero-risk token cleanup (verified safe)**
2. **Glow alpha consolidation in `dark.css`** — extract 27 sun-yellow + 12 cream inline `oklch(...)` literals into named tokens (`--glow-sun-yellow-{04,08,12,20,…}`, `--glow-cream-{12,20,35,…}`). ~40 LOC saved, internal to dark.css.
3. **Add `--color-lcd-black` brand token** then migrate the 9 remaining `oklch(0 0 0)` literals in `packages/ctrl/` (LCDScreen.css, LEDProgress.css, Dropdown.tsx, TransportPill.css, TransportPill.tsx) and `RadioDisc.tsx:91`.
4. **Drop genuinely orphan tokens** (32 of 33 from Section 4 bucket D). Section 8's reversal was wrong. Carve-out: keep `--ctrl-row-height`. Subset that may stay if part of public contract surface (per Section 5 deferred): `--color-action-*`, `--color-content-*`, `--color-edge-*`, `--color-surface-*`. Genuine prune candidates regardless of contract: `--color-active-overlay`, `--color-hover-overlay`, `--color-warning-yellow`, `--color-error-red`, `--color-focus-state`, `--color-ctrl-active`, `--color-ctrl-rule`, `--ctrl-size-{sm,md,lg}`, all motion orphans, all focus-ring orphans, all 8 z-index tokens, `--font-blackletter-inline`, `--font-waves-tiny`.

**P3 — Counted, ready to execute**
5. **Replace 2× `bg-black` in `apps/rad-os/app/ctrl-preview/page.tsx:112,156`** with a new `--color-ctrl-surface` (or chosen) semantic token. Decision still pending: token name + value.
6. **Pattern registry trim** — 42 of 51 `--pat-*` tokens have zero consumers. Coordinate with `packages/pixel/src/patterns/registry.ts` since `patterns.css` is auto-generated.
7. **Resolve remaining `border-ink` outside brand-assets** — `BrandApp.tsx:70`, `goodnews/GoodNewsLegacyApp.tsx:1131`. The original brand-assets drift is already gone.

**P4 — Larger, gated**
8. **Accent alias migration** — 85 utility occurrences across 38 files. Smaller than Section 8's 388 estimate; larger than Section 6's 36. Tractable single-codemod branch. Blocked by P1 (need final dark-mode mapping before swapping `bg-accent` → `bg-sun-yellow`).
9. **`dark.css` `!important` triage** — 93 declarations, mostly inside button/glow/btn-tint cascade. Long-running per-site work.
10. **Font CSS consolidation** — merge `fonts.css` + `fonts-core.css` + `fonts-editorial.css` (~35 LOC, after orphan font-token removal in P2.4).
