# DESIGN.md Rewrite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Bring `packages/radiants/DESIGN.md` back in sync with the current codebase without turning the work into a general docs-cleanup or refactor branch.

**Scope:** This plan edits `packages/radiants/DESIGN.md`, adds the DESIGN.md generator and drift check, and makes only the minimal `apps/rad-os/SPEC.md` change required to stop DESIGN.md from carrying RadOS product-specific sections. Broader docs cleanup lives in `docs/plans/2026-04-25-docs-audit-cleanup.md`. Code cleanup/refactors from the verified todo rollup live in `docs/plans/2026-04-25-cleanup-todo-rollup-execution.md`.

**Architecture:**
- Add one generator, `packages/radiants/scripts/generate-design-md.ts`, that rewrites marker-bounded regions in `DESIGN.md`.
- Generate only stable, source-backed tables: color tokens, typography scale, motion/easing tokens, and shipped ESLint rules.
- Wire the generator into `pnpm registry:generate` only after all marker regions exist.
- Keep RadOS-specific material out of DESIGN.md with a short cross-link to `apps/rad-os/SPEC.md`; do not fully rewrite SPEC.md in this plan.
- Block generated color tables on an explicit decision for the five dark-mode token mismatches, and represent dark-only token families explicitly instead of inventing Sun Mode values.

**Tech Stack:** TypeScript (Node 22 strip-types), Vitest, ESLint, pnpm Turborepo, Markdown.

---

## Phase 0: Setup & audit orientation

### Task 0.1: Create worktree or confirm fallback

**Files:** None.

**Step 1:** If using a fresh worktree:
```bash
git -C /Users/rivermassey/Desktop/dev/DNA-logo-maker worktree add ../DNA-design-md-rewrite -b feat/design-md-rewrite main
cd /Users/rivermassey/Desktop/dev/DNA-design-md-rewrite
pnpm install
```

Fallback: stay in `/Users/rivermassey/Desktop/dev/DNA-logo-maker` on `feat/logo-asset-maker`, but keep commits narrowly scoped.

**Step 2:** Run baseline registry tests.
```bash
pnpm registry:test:radiants
```

**Step 3:** Commit nothing.

---

### Task 0.2: Read only the audit inputs that affect DESIGN.md

**Files:**
- Read: `ops/cleanup-audit/design-md-audit/ROLLUP.md`
- Read: `ops/cleanup-audit/design-md-audit/lane-1-philosophy-color-typography.md`
- Read: `ops/cleanup-audit/design-md-audit/lane-2-shadow-motion-interactive.md`
- Read: `ops/cleanup-audit/design-md-audit/lane-3-components-spacing-a11y-enforcement.md`
- Read: `ops/cleanup-audit/design-md-audit/lane-4-radOS-windows-desktop-routing.md`
- Read: `ops/cleanup-audit/design-md-audit/lane-5-hard-won-rules.md`
- Read: `ops/cleanup-audit/2026-04-25-todo-rollup/lane-2-tokens-css.md`
- Read: `ops/cleanup-audit/2026-04-25-todo-rollup/lane-4-docs-tests-ts.md`

**Step 1:** Confirm the DESIGN audit headline: 13 high / 14 medium / 9 low.

**Step 2:** Confirm the cleanup-rollup overlap:
- `--color-flip`
- `--color-mute`
- `--color-line`
- `--color-rule`
- `--color-accent-inv`

**Step 3:** Commit nothing.

---

### Task 0.3: Resolve dark-mode token semantics before generating color tables

**Files:**
- Read: `packages/radiants/DESIGN.md`
- Read: `packages/radiants/dark.css`
- Read: `packages/radiants/tokens.css`

**Step 1:** Compare the five blocked token rows.

Current verified mismatch:
- `--color-flip`: DESIGN says Moon = ink; runtime says `var(--color-cream)`.
- `--color-mute`: DESIGN says Moon = cream/60; runtime says sun-yellow/60.
- `--color-line`: DESIGN says Moon = cream/20; runtime says sun-yellow/20.
- `--color-rule`: DESIGN says Moon = cream/12; runtime says sun-yellow/12.
- `--color-accent-inv`: DESIGN says Moon = cream; runtime says `var(--color-ink)`.

**Step 2:** Get the owner decision before committing generated color tables.

Decision options:
- **Runtime wins:** generated DESIGN.md documents the current `dark.css` values.
- **DESIGN intent wins:** stop this docs-only plan and either broaden scope explicitly or create a small code-change branch to update `dark.css` first.

**Step 3:** Record the decision in the PR body. Do not silently edit `dark.css` inside this plan unless the scope has been explicitly expanded.

---

## Phase A: Build the generator

### Task A.1: Add marker-region rewriting

**Files:**
- Create: `packages/radiants/scripts/generate-design-md.ts`
- Create: `packages/radiants/test/generate-design-md.test.ts`

**Step 1:** Test `rewriteMarkerRegion`.

Cover:
- replaces content inside matching markers;
- throws when markers are missing;
- preserves content outside the generated region.

**Step 2:** Implement `rewriteMarkerRegion(source, id, replacement)`.

Use exact markers:
```markdown
<!-- BEGIN GENERATED:section-id -->
<!-- END GENERATED:section-id -->
```

**Step 3:** Run:
```bash
pnpm --filter @rdna/radiants exec vitest run test/generate-design-md.test.ts
```

**Step 4:** Commit.
```bash
git add packages/radiants/scripts/generate-design-md.ts packages/radiants/test/generate-design-md.test.ts
git commit -m "feat(design-md): add marker-region rewriter"
```

---

### Task A.2: Add CSS token extraction and table renderers

**Files:**
- Modify: `packages/radiants/scripts/generate-design-md.ts`
- Modify: `packages/radiants/test/generate-design-md.test.ts`

**Step 1:** Add tests for:
- `extractCssTokens(css, namePattern)`;
- `renderBrandPaletteTable`;
- `renderSemanticTable`;
- `renderTypographyScale`;
- `renderMotionTables`.

**Step 2:** Implement each renderer with deterministic ordering constants.

Required generated sections:
- `color-brand-palette`
- `color-surface`
- `color-content`
- `color-edge`
- `color-action`
- `color-status`
- `color-overlay`
- `color-window-chrome`
- `typography-scale`
- `motion-tokens`

Semantic-table rule: if a token exists only in `dark.css` and not in light `tokens.css`, render the Sun cell as `_(not defined in Sun)_` or put the token in a clearly named Moon-only table. Do not infer a light value from a similarly named alias.

**Step 3:** Verify typography renders `text-xs` as `0.625rem (10px)`.

**Step 4:** Run:
```bash
pnpm --filter @rdna/radiants exec vitest run test/generate-design-md.test.ts
```

**Step 5:** Commit.
```bash
git add packages/radiants/scripts
git commit -m "feat(design-md): render token and typography tables"
```

---

### Task A.3: Add ESLint rule extraction

**Files:**
- Modify: `packages/radiants/scripts/generate-design-md.ts`
- Modify: `packages/radiants/test/generate-design-md.test.ts`
- Possibly modify: `packages/radiants/eslint/rules/*.mjs`

**Step 1:** Test `extractEslintRules(plugin)` and `renderEslintRulesTable(rules)`.

**Step 2:** Implement extraction from `eslint/index.mjs`, rendering exported rules as `rdna/<rule-name>`.

Also render or document which rules are included in `recommended`, `internals`, and `recommended-strict`; do not claim every exported rule is present in every config unless the config proves it.

**Step 3:** If a rule lacks `meta.docs.description`, add a concise description in the rule file.

**Step 4:** Run relevant tests:
```bash
pnpm --filter @rdna/radiants exec vitest run test/generate-design-md.test.ts
node --test packages/radiants/eslint/__tests__/*.test.mjs
```

**Step 5:** Commit.
```bash
git add packages/radiants/scripts packages/radiants/eslint/rules
git commit -m "feat(design-md): render eslint rules table"
```

---

### Task A.4: Add full regenerate pipeline and CLI

**Files:**
- Modify: `packages/radiants/scripts/generate-design-md.ts`
- Create: `packages/radiants/test/generate-design-md.integration.test.ts`

**Step 1:** Add `regenerate(source, repoRoot)`.

It should read:
- `tokens.css`
- `dark.css`
- `generated/typography-tokens.css`
- `eslint/index.mjs`

Resolve all script paths from `import.meta.url` / `import.meta.dirname`, not `process.cwd()`, because the generator will run both from repo-root commands and through `pnpm --filter @rdna/radiants`. Use `pathToFileURL()` for dynamic imports and include a cache-busting query param.

**Step 2:** Add CLI behavior:
```bash
node --experimental-strip-types packages/radiants/scripts/generate-design-md.ts
```

It should rewrite `packages/radiants/DESIGN.md`.

**Step 3:** Keep the integration test skipped until Phase C inserts markers.

**Step 4:** Run unit tests.

**Step 5:** Commit.
```bash
git add packages/radiants/scripts
git commit -m "feat(design-md): add regenerate pipeline"
```

---

## Phase B: Minimal RadOS extraction

### Task B.1: Replace RadOS-heavy DESIGN.md section with a stub

**Files:**
- Modify: `packages/radiants/DESIGN.md`
- Modify: `apps/rad-os/SPEC.md`

**Step 1:** In `packages/radiants/DESIGN.md`, replace only RadOS product-specific desktop/taskbar/catalog/hash-routing/mobile sections with:
```markdown
# Part 2: RadOS Application

> RadOS-specific design (windows, desktop/taskbar, app registration, hash routing, mobile) lives in [`apps/rad-os/SPEC.md`](../../apps/rad-os/SPEC.md). DESIGN.md is the portable design system; SPEC.md is the product adapter.
```

**Step 2:** In `apps/rad-os/SPEC.md`, add a short note near the top:
```markdown
> This document owns RadOS product-specific behavior. `packages/radiants/DESIGN.md` owns portable Radiants design-system behavior.
```

Do not rewrite SPEC.md inventory here. That belongs to `2026-04-25-docs-audit-cleanup.md`.

Keep portable `@rdna/radiants` AppWindow guidance in DESIGN.md. AppWindow is a core Radiants component; only RadOS product usage belongs behind the SPEC link.

**Step 3:** Commit.
```bash
git add packages/radiants/DESIGN.md apps/rad-os/SPEC.md
git commit -m "docs(design-md): move RadOS specifics behind SPEC link"
```

---

## Phase C: Insert generated regions and rewrite DESIGN.md prose

### Task C.1: Insert generated color markers

**Files:**
- Modify: `packages/radiants/DESIGN.md`

**Step 1:** Confirm Task 0.3 is resolved.

**Step 2:** Replace the relevant color tables with generated markers:
- `color-brand-palette`
- `color-surface`
- `color-content`
- `color-edge`
- `color-action`
- `color-status`
- `color-overlay`
- `color-window-chrome`

**Step 3:** Run:
```bash
pnpm --filter @rdna/radiants generate:design-md
```

**Step 4:** Spot-check the five dark-mode decision tokens and `--color-cream`.

**Step 5:** Commit.
```bash
git add packages/radiants/DESIGN.md
git commit -m "docs(design-md): generate color token tables"
```

---

### Task C.2: Insert typography marker and fix typography prose

**Files:**
- Modify: `packages/radiants/DESIGN.md`

**Step 1:** Replace the type-scale table with:
```markdown
<!-- BEGIN GENERATED:typography-scale -->
<!-- END GENERATED:typography-scale -->
```

**Step 2:** Add prose that the scale is generated by `packages/radiants/scripts/generate-typography-tokens.ts`.

**Step 3:** Add a short note about fluid variants `--font-size-fluid-{sm,base,lg,xl,2xl,3xl,4xl}`.

**Step 4:** Run generator and verify `text-xs` is `0.625rem (10px)`.

**Step 5:** Commit.
```bash
git add packages/radiants/DESIGN.md
git commit -m "docs(design-md): generate typography scale"
```

---

### Task C.3: Rewrite shadow, motion, and interactive prose

**Files:**
- Modify: `packages/radiants/DESIGN.md`

**Step 1:** Rewrite shadow prose from current `dark.css`, including moon-mode ring layers and `pixel-shadow-*` overrides.

**Step 2:** Replace the "one easing" claim with the three current easings.

**Step 3:** Insert:
```markdown
<!-- BEGIN GENERATED:motion-tokens -->
<!-- END GENERATED:motion-tokens -->
```

**Step 4:** Add a TODO note that `animations.css` still uses hardcoded literals and should be tokenized in a follow-up.

**Step 5:** Fix Button size/tone/mode prose from `Button.tsx` and `Button.meta.ts`.

**Step 6:** Run generator and commit.
```bash
pnpm --filter @rdna/radiants generate:design-md
git add packages/radiants/DESIGN.md
git commit -m "docs(design-md): rewrite shadows motion and interactive sections"
```

---

### Task C.4: Rewrite component architecture and enforcement prose

**Files:**
- Modify: `packages/radiants/DESIGN.md`

**Step 1:** Add sibling package callouts for:
- `@rdna/radiants`
- `@rdna/ctrl`
- `@rdna/pixel`
- `@rdna/preview`

**Step 2:** Replace the ESLint table with:
```markdown
<!-- BEGIN GENERATED:eslint-rules -->
<!-- END GENERATED:eslint-rules -->
```

**Step 3:** Add short hand-written notes for:
- shipped plugin configs;
- repo-local review rules;
- exception owner slugs, if confirmed.

**Step 4:** Run generator and commit.
```bash
pnpm --filter @rdna/radiants generate:design-md
git add packages/radiants/DESIGN.md
git commit -m "docs(design-md): update component architecture and enforcement"
```

---

### Task C.5: Rewrite hard-won rules that remain in DESIGN.md

**Files:**
- Modify: `packages/radiants/DESIGN.md`

**Step 1:** Rewrite z-index prose as documentation only: list leaks and point to the cleanup plan for code fixes.

**Step 2:** Rewrite dark-mode completeness prose to declare status tokens mode-invariant by design.

**Step 3:** Commit.
```bash
git add packages/radiants/DESIGN.md
git commit -m "docs(design-md): update hard-won rules"
```

---

## Phase D: Wire generator and drift check

### Task D.1: Add package scripts

**Files:**
- Modify: `packages/radiants/package.json`
- Modify: `package.json`

**Step 1:** Add radiants script:
```json
"generate:design-md": "node --experimental-strip-types scripts/generate-design-md.ts"
```

**Step 2:** Add it to root `registry:generate` after schemas and figma contracts.

**Step 3:** Run:
```bash
pnpm registry:generate
git diff packages/radiants/DESIGN.md
```

Expected: no diff outside generated regions, ideally no diff at all.

**Step 4:** Commit.
```bash
git add package.json packages/radiants/package.json
git commit -m "chore(design-md): wire generator into registry"
```

---

### Task D.2: Add drift check

**Files:**
- Create: `scripts/check-design-md-drift.mjs`
- Modify: `package.json`

**Step 1:** Add a script that runs `pnpm --filter @rdna/radiants generate:design-md`, then fails if `git diff -- packages/radiants/DESIGN.md` is non-empty.

**Step 2:** Add root script:
```json
"check:design-md-drift": "node scripts/check-design-md-drift.mjs"
```

**Step 3:** Add it to `test:ci` after `pnpm test:scripts`.

**Step 4:** Run:
```bash
pnpm check:design-md-drift
```

**Step 5:** Commit.
```bash
git add scripts/check-design-md-drift.mjs package.json
git commit -m "ci(design-md): check generated doc drift"
```

---

## Phase E: Validation

### Task E.1: Final checks

**Step 1:** Run:
```bash
pnpm registry:generate
pnpm check:design-md-drift
pnpm test:ci
pnpm lint
```

**Step 2:** Render `packages/radiants/DESIGN.md` and spot-check:
- color tables;
- typography scale;
- motion tokens;
- ESLint rule list;
- RadOS stub link.

**Step 3:** Self-review:
```bash
git diff main...HEAD --stat
git diff main...HEAD -- packages/radiants/DESIGN.md apps/rad-os/SPEC.md
```

Expected: no README/CODEMAP/plan-deletion churn in this branch.

---

## Open questions before execute

1. **Dark-mode token semantics:** runtime wins or DESIGN intent wins for the five mismatched tokens?
2. **ctrl schema decision:** declare ctrl intentionally schema-free, or queue schema generation as follow-up?
3. **Slug registry list:** confirm `design-system`, `frontend-platform`, `rad-os`.
4. **Animation-duration follow-up:** keep `animations.css` hardcoded-literal note and defer tokenization?
