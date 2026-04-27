# Cleanup Todo Rollup Execution Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Execute the verified cleanup backlog from `ops/cleanup-audit/2026-04-25-todo-rollup/ROLLUP.md` in safe, reviewable batches after re-verifying claims that may have gone stale.

**Scope:** This plan owns code cleanup, token cleanup, deletion/refactor work, and placeholder issue IDs from the todo rollup. It does not own DESIGN.md generation or broad docs archiving. Counts and delete candidates must be re-verified immediately before execution.

**Architecture:** Start with zero-decision, verified-safe changes. Gate ambiguous work behind explicit owner decisions. Keep each batch small enough to review and revert independently.

**Tech Stack:** TypeScript, React, CSS, Vitest, ESLint, pnpm.

---

## Phase 0: Orientation and decisions

### Task 0.1: Read verified cleanup rollup

**Files:**
- Read: `ops/cleanup-audit/2026-04-25-todo-rollup/ROLLUP.md`
- Read: `ops/cleanup-audit/2026-04-25-todo-rollup/lane-1-dead-code.md`
- Read: `ops/cleanup-audit/2026-04-25-todo-rollup/lane-2-tokens-css.md`
- Read: `ops/cleanup-audit/2026-04-25-todo-rollup/lane-3-primitives.md`
- Read: `ops/cleanup-audit/2026-04-25-todo-rollup/lane-4-docs-tests-ts.md`

**Step 1:** Confirm the rollup's DROP section. Do not re-add invalidated claims to any active todo list.

**Step 2:** Confirm current decision gates:
- D1 dark-mode token semantics;
- D2 typography-data chain delete;
- D3 strict-orphan token policy;
- D4 placeholder issue ID destination;
- D5 `Menubar.modal` default-path;
- D6 Pretext subsystem;
- D7 `channels` mock-data export.

**Step 3:** Commit nothing.

---

### Task 0.2: Record owner decisions

**Files:**
- Create: `docs/plans/2026-04-25-cleanup-decisions.md`

**Step 1:** Add a table with one row per D1-D7 decision.

Columns:
- Decision
- Chosen option
- Rationale
- Unblocks

**Step 2:** Fill only decisions that the owner has actually made.

**Step 3:** Commit.
```bash
git add docs/plans/2026-04-25-cleanup-decisions.md
git commit -m "docs: record cleanup rollout decisions"
```

---

## Phase A: Tier 1 zero-risk cleanup

### Task A.1: Delete verified dead files

**Files:**
- Delete: `apps/rad-os/components/apps/brand-assets/colors-tab/ColorDetail.tsx`
- Delete: `apps/rad-os/components/Rad_os/WindowTitleBar.tsx`
- Delete: `apps/rad-os/components/Rad_os/index.ts`
- Delete: `apps/rad-os/lib/dotting/utils/stack.ts`
- Delete: `apps/rad-os/scripts/import-radiants-pfps.mjs`

**Step 1:** Re-verify zero importers with `rg`.

**Step 2:** Delete files and remove any now-invalid exports.

**Step 3:** Run targeted tests/lint available for touched areas.

**Step 4:** Commit.
```bash
git add apps/rad-os
git commit -m "refactor(rad-os): remove verified dead files"
```

---

### Task A.2: Decide whether to remove Combobox public API surface

**Files:**
- Read: `packages/radiants/components/core/Combobox/`
- Read: `packages/radiants/components/core/index.ts`
- Read: `packages/radiants/meta/index.ts`
- Read: `packages/radiants/schemas/index.ts`
- Read: `packages/radiants/generated/figma/contracts/`
- Read: `packages/radiants/generated/contract.freshness.json`
- Read: `packages/radiants/registry/runtime-attachments.tsx`

**Step 1:** Treat Combobox as a public API/registry removal decision, not zero-risk dead cleanup.

Combobox still has exports, metadata/schema/generated/blocknote/registry/test coverage. It may have zero app callers, but removing it changes the Radiants public surface.

**Step 2:** If the owner chooses to keep public API stability, stop and leave Combobox in place.

**Step 3:** If the owner chooses removal, create a dedicated removal commit that includes component files, exports, meta/schema, generated blocknote/figma/freshness artifacts, registry demos, docs, and tests.

**Step 4:** Run focused and registry tests:
```bash
pnpm --filter @rdna/radiants test
pnpm registry:test:radiants
```

**Step 5:** Commit only if removal was approved.
```bash
git add packages/radiants
git commit -m "refactor(radiants): remove Combobox public surface"
```

---

### Task A.3: Trim catalog `resizable` field only in RadOS

**Files:**
- Modify: `apps/rad-os/lib/apps/catalog.tsx`
- Modify: any tests referencing `resizable`

**Step 1:** Verify every catalog entry still has `resizable: true`.

As of the factual review, there are 8 entries and all are `true`.

**Step 2:** Remove `resizable` from the RadOS catalog interface and all entries if still universally true.

**Step 3:** Update `getWindowChrome` or related code paths that assume the field.

Do not flip the core `@rdna/radiants` `AppWindow.contentPadding` default here. That is a public component behavior change and needs its own decision/tests.

**Step 4:** Run app catalog/window tests.

**Step 5:** Commit.
```bash
git add apps/rad-os/lib/apps/catalog.tsx apps/rad-os/test
git commit -m "refactor(rad-os): trim redundant catalog resizable field"
```

---

### Task A.4: Delete six typography-playground dead files

**Decision gate:** D2. Execute only the partial-delete option unless owner chooses full chain delete.

**Files:**
- Delete: `apps/rad-os/components/apps/typography-playground/TypeManual.tsx`
- Delete: `apps/rad-os/components/apps/typography-playground/TypeStyles.tsx`
- Delete: `apps/rad-os/components/apps/typography-playground/TemplatePreview.tsx`
- Delete: `apps/rad-os/components/apps/typography-playground/PlaygroundControls.tsx`
- Delete: `apps/rad-os/components/apps/typography-playground/layouts/MagazineLayout.tsx`
- Delete: `apps/rad-os/components/apps/typography-playground/layouts/BroadsheetLayout.tsx`
- Modify: `apps/rad-os/components/apps/typography-playground/typography-data.ts`

**Step 1:** Re-verify importers.

**Step 2:** Delete only the verified dead files.

**Step 3:** Drop `TEMPLATES` export if it becomes orphaned.

**Step 4:** Run typography tests.

**Step 5:** Commit.
```bash
git add apps/rad-os/components/apps/typography-playground apps/rad-os/test
git commit -m "refactor(rad-os): remove dead typography playground files"
```

---

### Task A.5: Trim verified-unused exports and no-op wrappers

**Files:** See A1.5, A1.8, A1.9, A1.10 in the rollup.

**Step 1:** Remove verified-unused exports:
- `useWindowsStore`
- `downloadPretextBundle`
- `CANVAS_FG_VAR`
- `CANVAS_BG_VAR`

Do not include `UILibraryGallery` / `UILibraryProps`; `apps/rad-os/components/ui/UILibraryTab.tsx` does not exist in the current repo.

**Step 2:** Re-verify each target with `rg` before deleting. If any target is gone or live, skip it.

**Step 3:** Collapse the `ColorCards.tsx` no-op wrappers.

**Step 4:** Extract the local `SettingsMenu` Section primitive if still duplicated.

**Step 5:** Replace remaining `border-ink` drift outside brand-assets with `border-line` if still present.

**Step 6:** Run targeted tests and commit.

---

## Phase B: Decision-gated token cleanup

### Task B.1: Dark-mode token semantics and accent aliases

**Decision gate:** D1.

**Files:**
- Modify: `packages/radiants/dark.css`
- Modify: token docs/tests as needed

**Step 1:** Apply the owner decision from D1.

**Step 2:** Do not start accent-alias migration until the five-token decision is committed.

**Step 3:** Run relevant token/design-system checks.

**Step 4:** Commit.

---

### Task B.2: Glow alpha consolidation

**Files:**
- Modify: `packages/radiants/dark.css`

**Step 1:** Extract the verified remaining 27 sun-yellow and 12 cream inline glow literals into named tokens.

**Step 2:** Preserve computed values exactly.

**Step 3:** Run visual/token checks available in the repo.

**Step 4:** Commit.
```bash
git add packages/radiants/dark.css
git commit -m "refactor(tokens): consolidate moon-mode glow alpha tokens"
```

---

### Task B.3: Add `--color-lcd-black` and migrate literals

**Files:**
- Modify: `packages/radiants/tokens.css`
- Modify: `packages/ctrl/layout/LCDScreen/LCDScreen.css`
- Modify: `packages/ctrl/readouts/LEDProgress/LEDProgress.css`
- Modify: `packages/ctrl/selectors/Dropdown/Dropdown.tsx`
- Modify: `packages/ctrl/selectors/TransportPill/TransportPill.css`
- Modify: `packages/ctrl/selectors/TransportPill/TransportPill.tsx`
- Modify: `apps/rad-os/components/apps/radio/RadioDisc.tsx`

**Step 1:** Add the semantic token.

**Step 2:** Replace verified `oklch(0 0 0)` literals.

**Step 3:** Separately audit current `bg-black` users in `packages/ctrl`, including `Dropdown`, `TransportPill`, `IconRadioGroup`, and `ControlPanel`. Migrate only if the new token is semantically correct for each site.

**Step 4:** Run ctrl/radio tests.

**Step 5:** Commit.

---

### Task B.4: Re-audit orphan tokens before any pruning

**Decision gate:** D3.

**Files:**
- Read: `packages/radiants/tokens.css`
- Read: `packages/radiants/dark.css`
- Read: `packages/radiants/contract/system.ts`
- Read: token-related tests/scripts/generated artifacts

**Step 1:** Re-audit every proposed orphan before deleting.

The prior "safe to drop" list is not reliable. Factual review found runtime/test/script/contract references for tokens previously called safe, including `--touch-target-default`, `--density-scale`, `--duration-scalar`, `--easing-default`, `--easing-spring`, `--z-index-*`, and semantic `--color-*` contract/generated-token surfaces.

**Step 2:** Produce a new candidate list with evidence:
- definition path;
- runtime `var()` consumers;
- Tailwind utility consumers;
- tests/scripts/generated/contract references;
- public API decision.

**Step 3:** Get owner approval on the new list.

**Step 4:** Only then prune in a separate token-cleanup commit.

---

## Phase C: Refactor batches

### Task C.1: Extract ctrl popup and glow primitives

**Files:**
- Modify: `packages/ctrl/selectors/Dropdown/Dropdown.tsx`
- Modify: `packages/ctrl/selectors/ColorPicker/ColorPicker.tsx`
- Create: `packages/ctrl/primitives/portal-styles.ts`
- Possibly create: `packages/ctrl/primitives/glows.ts`

**Step 1:** Extract `POPUP_FRAME`.

**Step 2:** Extract shared glow/shadow recipes only where duplication is exact or near-exact.

**Step 3:** Run ctrl tests.

**Step 4:** Commit.

---

### Task C.2: Extract Radiants form/control primitives

**Files:**
- Modify: `packages/radiants/components/core/Input/Input.tsx`
- Modify: `packages/radiants/components/core/Select/Select.tsx`
- Modify: `packages/radiants/components/core/NumberField/NumberField.tsx`
- Modify: `packages/radiants/components/core/Checkbox/Checkbox.tsx`
- Modify: `packages/radiants/components/core/Switch/Switch.tsx`

**Step 1:** Extract `fieldShellVariants` or equivalent.

**Step 2:** Extract `ControlLabel` only if it simplifies Checkbox/Switch without changing semantics.

**Step 3:** Run component tests.

**Step 4:** Commit.

---

## Phase D: Placeholder IDs and optional deletes

### Task D.1: Rewrite placeholder issue IDs

**Decision gate:** D4.

**Files:** See A1.7 in rollup.

**Step 1:** Regenerate current counts after any typography deletes.

As of factual review before typography deletes, current app/package code had 9 `DNA-999` and 35 `DNA-001`, not the older 41 `DNA-001` count.

**Step 2:** Use the chosen tracker destination.

**Step 3:** Replace `DNA-999` and `DNA-001` placeholders.

**Step 4:** Run lint/tests for touched files.

**Step 5:** Commit.

---

### Task D.2: Pretext subsystem decision

**Decision gate:** D6.

**Files:**
- Potentially delete: `apps/rad-os/components/apps/pretext/`
- Modify tests/importers accordingly

**Step 1:** If owner says keep, document why and stop.

**Step 2:** If owner says kill, remove subsystem and tests/imports in one reviewable branch.

**Step 3:** Run full RadOS tests.

**Step 4:** Commit.

---

## Phase E: TypeScript and long-running follow-ups

### Task E.1: Re-run TypeScript before creating any TS fix

**Files:**
- Read or modify only if errors still exist: `apps/rad-os/components/apps/pixel-playground/pixel-code-gen.ts`
- Read or modify only if errors still exist: `apps/rad-os/components/apps/studio/StudioExportPanel.tsx`

**Step 1:** Re-run:
```bash
cd apps/rad-os
pnpm exec tsc --noEmit
```

As of factual review, this command exits cleanly and the previous five errors are stale.

**Step 2:** If clean, commit nothing and remove TS-error work from the active cleanup batch.

**Step 3:** If errors reappear, fix only current compiler errors, not stale lane-4 claims.

**Step 4:** Run tests and commit only if files changed.

---

### Task E.2: Track long-running migrations separately

**Files:** None unless creating follow-up plans.

**Step 1:** Create separate plans if needed for:
- accent alias migration;
- `dark.css` `!important` triage;
- pattern registry trim;
- Vitest 2 to 4;
- TypeScript 5.9 to 6.0;
- font CSS consolidation.

**Step 2:** Do not combine these migrations into Tier 1 cleanup commits.

---

## Validation

### Task V.1: Final checks

**Step 1:** Run:
```bash
pnpm lint
pnpm test:ci
pnpm lint:design-system
```

**Step 2:** Review diff size and split if needed:
```bash
git diff main...HEAD --stat
```

**Step 3:** Confirm no invalidated DROP claims from the rollup were implemented.

---

## Open questions before execute

1. D1: dark-mode token semantics.
2. D2: typography-data partial vs full chain delete.
3. D3: strict-orphan token policy.
4. D4: placeholder issue ID destination.
5. D5: `Menubar.modal` default-path.
6. D6: Pretext subsystem.
7. D7: `channels` mock-data export.
