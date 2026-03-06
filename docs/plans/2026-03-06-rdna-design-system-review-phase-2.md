# RDNA Design System Review Phase 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend `eslint-plugin-rdna` beyond token/primitive enforcement into a stronger design-system review layer, then back it with visual QA and exception governance.

**Architecture:** Build on the existing `eslint-plugin-rdna` structure instead of introducing a second plugin or review tool. Add a small set of high-signal rules that enforce RDNA invariants already documented in `DESIGN.md`, keep rollout in `warn` mode, and pair static linting with a lightweight visual review checklist centered on RadOS and the BrandAssets component viewer.

**Tech Stack:** ESLint 9 flat config, `typescript-eslint`, Vitest, `RuleTester`, direct `Linter` assertions for edge cases, Tailwind v4 utility scanning, RadOS visual QA docs.

---

## Execution Context

- Implement this plan in the dedicated feature worktree/branch that already contains `eslint-plugin-rdna`.
- Current plugin entrypoints live in:
  - `eslint.rdna.config.mjs`
  - `packages/radiants/eslint/index.mjs`
  - `packages/radiants/eslint/utils.mjs`
  - `packages/radiants/eslint/rules/*.mjs`
  - `packages/radiants/eslint/__tests__/*.test.mjs`
- Current baseline doc:
  - `docs/qa/2026-03-05-rdna-lint-baseline.md`
- Current test harness:
  - `packages/radiants/test/setup.ts`

## Priorities

- **Easy wins:** `no-raw-radius`, `no-raw-shadow`, `no-hardcoded-motion`
- **High leverage:** `no-viewport-breakpoints-in-window-layout`, `require-exception-metadata`
- **Architectural linting:** `no-mixed-style-authority`
- **Review layer:** visual QA checklist and workflow docs tied to RadOS / BrandAssets viewer
- **Non-goal for this phase:** flip `recommended` from `warn` to `error`

## Task 1: Add Shared Utility Scaffolding For New Rules

**Files:**
- Modify: `packages/radiants/eslint/utils.mjs`
- Modify: `packages/radiants/eslint/index.mjs`
- Modify: `eslint.rdna.config.mjs`
- Test: `packages/radiants/eslint/__tests__/no-hardcoded-colors.test.mjs`
- Test: `packages/radiants/eslint/__tests__/no-hardcoded-spacing.test.mjs`

**Step 1: Write the failing utility tests**

Add focused tests that prove the shared extraction utilities can support the new rules without duplicating parser logic. Add at least one case each for:
- `cn(active && "rounded-[6px]")`
- `clsx(active ? "shadow-[0_0_0_1px_#000]" : "shadow-floating")`
- `cn(["duration-[175ms]"])`
- `md:grid-cols-2` inside a normal string segment

Use direct `Linter` assertions if `RuleTester` does not express the edge case cleanly.

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-hardcoded-colors.test.mjs eslint/__tests__/no-hardcoded-spacing.test.mjs --cache=false
```

Expected:
- New assertions fail because shared extraction / matching helpers do not yet support all needed inputs.

**Step 3: Write minimal utility implementation**

Update `packages/radiants/eslint/utils.mjs` with reusable helpers for:
- arbitrary radius utility detection
- arbitrary shadow utility detection
- arbitrary duration/easing utility detection
- viewport breakpoint prefix detection (`sm:`, `md:`, `lg:`, etc.)
- disable-comment parsing helper for `eslint-disable` / `eslint-disable-next-line` metadata

Keep utilities generic enough for the new rules, but do not add speculative helpers for rules not in this plan.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-hardcoded-colors.test.mjs eslint/__tests__/no-hardcoded-spacing.test.mjs --cache=false
```

Expected:
- Targeted tests pass.

**Step 5: Commit**

```bash
git add packages/radiants/eslint/utils.mjs packages/radiants/eslint/__tests__/no-hardcoded-colors.test.mjs packages/radiants/eslint/__tests__/no-hardcoded-spacing.test.mjs
git commit -m "refactor(rdna): add shared helpers for phase 2 rules"
```

## Task 2: Add `rdna/no-raw-radius`

**Files:**
- Create: `packages/radiants/eslint/rules/no-raw-radius.mjs`
- Create: `packages/radiants/eslint/__tests__/no-raw-radius.test.mjs`
- Modify: `packages/radiants/eslint/index.mjs`
- Modify: `packages/radiants/DESIGN.md`
- Modify: `packages/radiants/CLAUDE.md`

**Step 1: Write the failing test**

Create `packages/radiants/eslint/__tests__/no-raw-radius.test.mjs` with:
- valid:
  - `className="rounded-sm"`
  - `className="rounded-md"`
  - `className="rounded-none"`
  - `className="rounded-[var(--radius-window)]"` only if RDNA already treats that as canonical, otherwise make it invalid
- invalid:
  - `className="rounded-[6px]"`
  - `className="rounded-t-[8px]"`
  - `style={{ borderRadius: "6px" }}`
  - `const classes = cn(active && "rounded-[6px]")`

Use direct `Linter` assertions for the builder-call cases.

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-raw-radius.test.mjs --cache=false
```

Expected:
- FAIL because the rule is not implemented.

**Step 3: Write minimal implementation**

Implement `packages/radiants/eslint/rules/no-raw-radius.mjs` to report:
- arbitrary Tailwind radius classes such as `rounded-[...]`
- inline `borderRadius` style literals
- optionally `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomLeftRadius`, `borderBottomRightRadius`

Message should point callers toward RDNA radius utilities/tokens.

Register the rule in `packages/radiants/eslint/index.mjs`, but keep it `warn` in both `recommended` and `internals` for this phase.

Update docs in:
- `packages/radiants/DESIGN.md`
- `packages/radiants/CLAUDE.md`

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-raw-radius.test.mjs --cache=false
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add packages/radiants/eslint/rules/no-raw-radius.mjs packages/radiants/eslint/__tests__/no-raw-radius.test.mjs packages/radiants/eslint/index.mjs packages/radiants/DESIGN.md packages/radiants/CLAUDE.md
git commit -m "feat(rdna): add no-raw-radius rule"
```

## Task 3: Add `rdna/no-raw-shadow`

**Files:**
- Create: `packages/radiants/eslint/rules/no-raw-shadow.mjs`
- Create: `packages/radiants/eslint/__tests__/no-raw-shadow.test.mjs`
- Modify: `packages/radiants/eslint/index.mjs`
- Modify: `packages/radiants/DESIGN.md`

**Step 1: Write the failing test**

Create tests for:
- valid:
  - `className="shadow-floating"`
  - `className="shadow-focused"`
  - `className="shadow-none"`
- invalid:
  - `className="shadow-[0_0_0_1px_#000]"`
  - `className="drop-shadow-[0_4px_0_#000]"`
  - `style={{ boxShadow: "0 4px 0 #000" }}`
  - `const classes = clsx(active ? "shadow-[0_0_0_1px_#000]" : "shadow-floating")`

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-raw-shadow.test.mjs --cache=false
```

Expected:
- FAIL because the rule is not implemented.

**Step 3: Write minimal implementation**

Implement the rule to catch:
- arbitrary Tailwind shadow/drop-shadow classes
- inline `boxShadow` values with string or template literal content

Do not try to parse shadow semantics beyond the documented canonical utilities. Keep message scoped to “use RDNA elevation/shadow tokens/utilities.”

Register the rule in `packages/radiants/eslint/index.mjs` as `warn`.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-raw-shadow.test.mjs --cache=false
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add packages/radiants/eslint/rules/no-raw-shadow.mjs packages/radiants/eslint/__tests__/no-raw-shadow.test.mjs packages/radiants/eslint/index.mjs packages/radiants/DESIGN.md
git commit -m "feat(rdna): add no-raw-shadow rule"
```

## Task 4: Add `rdna/no-hardcoded-motion`

**Files:**
- Create: `packages/radiants/eslint/rules/no-hardcoded-motion.mjs`
- Create: `packages/radiants/eslint/__tests__/no-hardcoded-motion.test.mjs`
- Modify: `packages/radiants/eslint/index.mjs`
- Modify: `packages/radiants/DESIGN.md`
- Modify: `packages/radiants/CLAUDE.md`

**Step 1: Write the failing test**

Create tests for:
- valid:
  - `className="duration-base ease-standard"`
  - `className="transition-colors duration-base"`
  - `style={{ transitionDuration: "var(--duration-base)" }}`
- invalid:
  - `className="duration-[175ms]"`
  - `className="ease-[cubic-bezier(0.4,0,0.2,1)]"`
  - `style={{ transition: "all 200ms ease-out" }}`
  - `style={{ animationDuration: "150ms" }}`
  - `const classes = cn(["duration-[175ms]"])`

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-hardcoded-motion.test.mjs --cache=false
```

Expected:
- FAIL because the rule is not implemented.

**Step 3: Write minimal implementation**

Implement the rule to catch:
- Tailwind arbitrary duration/easing classes
- inline transition / animation duration strings
- inline `transition`, `transitionDuration`, `animationDuration`, `animationTimingFunction`

Keep messages pointed at RDNA duration/easing tokens.

Register the rule in `packages/radiants/eslint/index.mjs` as `warn`.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-hardcoded-motion.test.mjs --cache=false
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add packages/radiants/eslint/rules/no-hardcoded-motion.mjs packages/radiants/eslint/__tests__/no-hardcoded-motion.test.mjs packages/radiants/eslint/index.mjs packages/radiants/DESIGN.md packages/radiants/CLAUDE.md
git commit -m "feat(rdna): add no-hardcoded-motion rule"
```

## Checkpoint A: Re-scan Baseline After Easy Wins

**Files:**
- Modify: `docs/qa/2026-03-05-rdna-lint-baseline.md`

**Step 1: Run the baseline scan**

Run:

```bash
pnpm lint:design-system
```

Expected:
- Existing pre-RDNA errors remain possible.
- New RDNA warnings from radius/shadow/motion appear.

**Step 2: Update the baseline doc**

Append a new dated section documenting:
- total warning delta
- counts per new rule
- top files by new rule
- whether the noise level is acceptable

**Step 3: Commit**

```bash
git add docs/qa/2026-03-05-rdna-lint-baseline.md
git commit -m "docs(rdna): update baseline after easy-win rules"
```

## Task 5: Add `rdna/no-viewport-breakpoints-in-window-layout`

**Files:**
- Create: `packages/radiants/eslint/rules/no-viewport-breakpoints-in-window-layout.mjs`
- Create: `packages/radiants/eslint/__tests__/no-viewport-breakpoints-in-window-layout.test.mjs`
- Modify: `packages/radiants/eslint/index.mjs`
- Modify: `eslint.rdna.config.mjs`
- Modify: `packages/radiants/DESIGN.md`

**Step 1: Write the failing test**

Create tests that prove the rule only applies in RadOS window content contexts:
- valid:
  - `className="@sm:grid-cols-2"`
  - `className="@md:flex-row"`
  - ordinary `md:` usage outside targeted window files if you intentionally scope by filepath
- invalid:
  - `className="md:grid-cols-2"`
  - `className="lg:flex"`
  - `className="sm:hidden"`

Use filename-based fixtures for:
- `apps/rad-os/components/Rad_os/AppWindow.tsx`
- `apps/rad-os/components/Rad_os/MobileAppModal.tsx`
- app content paths known to render inside those containers

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-viewport-breakpoints-in-window-layout.test.mjs --cache=false
```

Expected:
- FAIL because the rule is not implemented.

**Step 3: Write minimal implementation**

Implement the rule conservatively:
- start with explicit file-path scoping for RadOS app/window content
- detect viewport breakpoint prefixes in Tailwind class strings
- do not flag Tailwind container query variants like `@sm:`

Register it in `packages/radiants/eslint/index.mjs`, then enable it only for RadOS scopes in `eslint.rdna.config.mjs`.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-viewport-breakpoints-in-window-layout.test.mjs --cache=false
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add packages/radiants/eslint/rules/no-viewport-breakpoints-in-window-layout.mjs packages/radiants/eslint/__tests__/no-viewport-breakpoints-in-window-layout.test.mjs packages/radiants/eslint/index.mjs eslint.rdna.config.mjs packages/radiants/DESIGN.md
git commit -m "feat(rdna): add no-viewport-breakpoints-in-window-layout rule"
```

## Task 6: Add `rdna/require-exception-metadata`

**Files:**
- Create: `packages/radiants/eslint/rules/require-exception-metadata.mjs`
- Create: `packages/radiants/eslint/__tests__/require-exception-metadata.test.mjs`
- Modify: `packages/radiants/eslint/index.mjs`
- Modify: `packages/radiants/CLAUDE.md`
- Modify: `packages/radiants/DESIGN.md`

**Step 1: Write the failing test**

Create tests for:
- valid:
  - `// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy owner:design expires:2026-04-01 issue:DNA-123`
- invalid:
  - missing `reason`
  - missing `owner`
  - missing `expires`
  - missing `issue`
  - `eslint-disable` comments for `rdna/*` with no metadata block

Keep the rule scoped to RDNA disables only. It should not police non-RDNA disable comments in this phase.

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/require-exception-metadata.test.mjs --cache=false
```

Expected:
- FAIL because the rule is not implemented.

**Step 3: Write minimal implementation**

Implement comment scanning against `context.sourceCode.getAllComments()`:
- match `eslint-disable` and `eslint-disable-next-line`
- only inspect comments that disable `rdna/`
- require `reason:`, `owner:`, `expires:`, `issue:`

Register the rule in `packages/radiants/eslint/index.mjs` as `warn`.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/require-exception-metadata.test.mjs --cache=false
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add packages/radiants/eslint/rules/require-exception-metadata.mjs packages/radiants/eslint/__tests__/require-exception-metadata.test.mjs packages/radiants/eslint/index.mjs packages/radiants/CLAUDE.md packages/radiants/DESIGN.md
git commit -m "feat(rdna): add require-exception-metadata rule"
```

## Task 7: Add `rdna/no-mixed-style-authority`

**Files:**
- Create: `packages/radiants/eslint/rules/no-mixed-style-authority.mjs`
- Create: `packages/radiants/eslint/__tests__/no-mixed-style-authority.test.mjs`
- Modify: `packages/radiants/eslint/utils.mjs`
- Modify: `packages/radiants/eslint/index.mjs`
- Modify: `eslint.rdna.config.mjs`
- Modify: `packages/radiants/DESIGN.md`
- Modify: `packages/radiants/CLAUDE.md`

**Step 1: Write the failing test**

Create tests that prove the rule flags components when both are true:
- a component emits `data-variant="..."` or another explicit styling hook such as `data-slot="..."` + `data-variant="..."`
- the same component hardcodes semantic RDNA `bg-*`, `text-*`, `border-*`, or equivalent design-token utilities in CVA/class strings while theme CSS also targets that variant/hook

Create fixtures for:
- valid:
  - a button-style component that uses structural CVA classes only and exposes `data-slot="button-face"` + `data-variant="secondary"`
  - a component with semantic color utilities but no matching theme CSS selector
  - a role-based component with no local variant/state color utilities
- invalid:
  - a `Select`-style trigger with `data-variant="select"` plus `bg-surface-primary text-content-primary border-edge-primary` in local variants while theme CSS targets `[data-variant="select"]`
  - a `Switch`-style track with `data-variant="switch"` plus local tokenized `bg-*`/`border-*` classes while theme CSS targets `[data-variant="switch"]`
  - a `Button`-style face with `data-slot="button-face"` + `data-variant="secondary"` plus local tokenized color utilities while theme CSS targets the same face

Use direct `Linter` assertions if `RuleTester` is too awkward for multi-file fixture setup. If a standalone audit script already exists by the time this task starts, port its matching logic into reusable plugin helpers instead of re-inventing the detection from scratch.

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-mixed-style-authority.test.mjs --cache=false
```

Expected:
- FAIL because the rule is not implemented.

**Step 3: Write minimal implementation**

Implement the rule conservatively:
- inspect class strings extracted from JSX/class-builder calls using the shared helpers in `packages/radiants/eslint/utils.mjs`
- detect semantic RDNA color utilities (`bg-*`, `text-*`, `border-*`) rather than arbitrary Tailwind classes
- only report when the file also renders the matching `data-variant`/`data-slot` hook and the theme layer contains a matching selector
- avoid duplicate reports for the same source line / same styling hook
- ignore test files and fixture files

Keep the initial scope to RDNA component files and explicit attribute-based theme hooks. Do not attempt to catch broad role-based selectors such as `[role="tab"]` in the first version unless the implementation stays low-noise.

Register the rule in `packages/radiants/eslint/index.mjs` as `warn`, and only enable it in scopes where RDNA component internals are being authored.

Document the rule in:
- `packages/radiants/DESIGN.md`
- `packages/radiants/CLAUDE.md`

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-mixed-style-authority.test.mjs --cache=false
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add packages/radiants/eslint/rules/no-mixed-style-authority.mjs packages/radiants/eslint/__tests__/no-mixed-style-authority.test.mjs packages/radiants/eslint/utils.mjs packages/radiants/eslint/index.mjs eslint.rdna.config.mjs packages/radiants/DESIGN.md packages/radiants/CLAUDE.md
git commit -m "feat(rdna): add no-mixed-style-authority rule"
```

## Task 8: Update Plugin Configs And Rule Inventory

**Files:**
- Modify: `packages/radiants/eslint/index.mjs`
- Modify: `eslint.rdna.config.mjs`
- Modify: `packages/radiants/package.json`

**Step 1: Write the failing inventory assertions**

Add or extend tests so the plugin fails if:
- a new rule file exists but is not exported
- a rule is exported but omitted from the intended config

If there is no clean home for this yet, create a small plugin-shape test near `packages/radiants/eslint/__tests__/`.

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/plugin-configs.test.mjs --cache=false
```

Expected:
- FAIL until all new rules are wired up consistently.

**Step 3: Write minimal implementation**

Ensure:
- `recommended` includes the new phase-2 rules at `warn`
- `internals` includes token-like rules that should apply to core components
- `recommended-strict` mirrors the rule inventory but still uses `error`
- `eslint.rdna.config.mjs` only enables RadOS-specific rules in the right scopes
- `rdna/no-mixed-style-authority` is only enabled where authoring RDNA component internals / design-system primitives makes sense, not in broad consumer app code by default

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/plugin-configs.test.mjs --cache=false
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add packages/radiants/eslint/index.mjs eslint.rdna.config.mjs packages/radiants/package.json packages/radiants/eslint/__tests__/plugin-configs.test.mjs
git commit -m "chore(rdna): wire phase 2 rules into plugin configs"
```

## Task 9: Add Visual Review Workflow Doc

**Files:**
- Create: `docs/solutions/tooling/rdna-design-review-workflow.md`
- Modify: `docs/qa/2026-03-05-radiants-base-ui-visual-compare.md`
- Modify: `packages/radiants/CLAUDE.md`

**Step 1: Write the failing documentation checklist**

Create a short checklist in the task notes first, then confirm the current docs do not yet explain:
- when to use lint vs visual QA
- where to compare current vs modified RadOS
- that BrandAssets viewer is the primary regression surface
- what to screenshot / sanity check for radius, shadow, motion, overlays, window layout

**Step 2: Write minimal documentation**

Create `docs/solutions/tooling/rdna-design-review-workflow.md` with:
- static lint pass
- dual-localhost RadOS compare
- BrandAssets component viewer pass
- manual QA checklist:
  - chrome vs environment hierarchy
  - motion timing / reduced motion
  - radius consistency
  - elevation consistency
  - container queries inside windows

Link it from:
- `packages/radiants/CLAUDE.md`
- `docs/qa/2026-03-05-radiants-base-ui-visual-compare.md`

**Step 3: Commit**

```bash
git add docs/solutions/tooling/rdna-design-review-workflow.md docs/qa/2026-03-05-radiants-base-ui-visual-compare.md packages/radiants/CLAUDE.md
git commit -m "docs(rdna): add design review workflow"
```

## Checkpoint B: Full Verification

**Files:**
- Modify: `docs/qa/2026-03-05-rdna-lint-baseline.md`

**Step 1: Run targeted rule tests**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/*.test.mjs --cache=false
```

Expected:
- All ESLint rule tests pass.

**Step 2: Run full radiants suite**

Run:

```bash
pnpm --dir packages/radiants exec vitest run --config vitest.config.ts --cache=false
```

Expected:
- Full suite passes with no stderr noise.

**Step 3: Run full RDNA baseline**

Run:

```bash
pnpm lint:design-system
```

Expected:
- New warning categories appear for the new rules.
- Existing unrelated non-RDNA errors may still exist and should be documented, not misrepresented.

**Step 4: Update baseline doc**

Append a final dated section covering:
- counts for all phase-2 rules
- whether each rule is “keep”, “narrow”, or “too noisy”
- recommended next rollout step

**Step 5: Commit**

```bash
git add docs/qa/2026-03-05-rdna-lint-baseline.md
git commit -m "docs(rdna): capture phase 2 baseline and rollout recommendation"
```

## Rollout Recommendation Criteria

Do not flip any new rule from `warn` to `error` in this phase unless all are true:
- baseline count is low enough to fix in one branch
- false-positive rate is low
- RadOS visual QA passes
- exception metadata rule is in place

If a rule is too noisy, narrow scope before debating severity.

## Deliverables

- New rules:
  - `rdna/no-raw-radius`
  - `rdna/no-raw-shadow`
  - `rdna/no-hardcoded-motion`
  - `rdna/no-viewport-breakpoints-in-window-layout`
  - `rdna/require-exception-metadata`
  - `rdna/no-mixed-style-authority`
- Updated plugin configs and docs
- Updated lint baseline doc
- Added design review workflow doc

Plan complete and saved to `docs/plans/2026-03-06-rdna-design-system-review-phase-2.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
