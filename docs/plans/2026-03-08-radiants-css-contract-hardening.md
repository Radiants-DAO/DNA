# Radiants CSS Contract Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the avoidable complexity cluster in `packages/radiants/dark.css`, keep theme ownership simple, and add one narrow audit so the same drift cannot quietly return.

**Architecture:** Treat `dark.css` as the single dark-theme implementation surface for Radiants. Keep its legitimate role narrow: token overrides plus slot/variant styling for real package components. Delete the undocumented generic class layer and delete the duplicate `prefers-color-scheme` activation path. Keep `rdna/no-mixed-style-authority` as the component-side guardrail, and add one small theme-side audit for the two regressions ESLint cannot see.

**Tech Stack:** Tailwind v4 CSS entrypoints, plain CSS in `packages/radiants`, ESLint 9 flat config, existing `rdna/no-mixed-style-authority`, Vitest, Node audit script.

---

## Current Problem Statement

`packages/radiants/dark.css` is currently carrying three styling systems at once:

1. token overrides for dark mode
2. undocumented generic class APIs such as `.btn-*`, `.card`, `.panel`, `.badge-*`, `.tab`, `.text-glow*`
3. a second dark-mode activation path via `@media (prefers-color-scheme: dark)`

That mix is the biggest avoidable complexity cluster in the package. This plan is scoped to collapsing that cluster first, not to building a general-purpose CSS governance framework.

## Non-Goals

- Do not add Stylelint.
- Do not build a broad selector grammar or full CSS contract parser in this pass.
- Do not refactor component CVA structure unless `rdna/no-mixed-style-authority` surfaces a real violation.
- Do not migrate colors to OKLCH in this pass. That is a follow-up once the CSS surface is clean and stable.

## Files In Scope

- Theme CSS:
  - `packages/radiants/dark.css`
  - `packages/radiants/base.css`
  - `packages/radiants/typography.css`
  - `packages/radiants/index.css`
- Theme docs:
  - `packages/radiants/README.md`
  - `packages/radiants/DESIGN.md`
  - `packages/radiants/CLAUDE.md`
- Enforcement:
  - `scripts/audit-style-authority.mjs`
  - `package.json`
  - `eslint.rdna.config.mjs`
  - `packages/radiants/eslint/__tests__/no-mixed-style-authority.test.mjs`
  - `packages/radiants/components/core/__tests__/style-authority-audit.test.tsx`
- QA evidence:
  - `docs/qa/2026-03-08-radiants-css-contract-hardening.md`

## Enforcement Model

- **Theme-side drift:** use one narrow audit/test only.
  - fail if any package CSS file contains `@media (prefers-color-scheme: dark)`
  - fail if `packages/radiants/dark.css` contains banned legacy selector prefixes
- **Component-side drift:** keep `rdna/no-mixed-style-authority` as the main enforcement mechanism.
- **Docs:** update once the CSS is clean, not before.

## Banned Legacy Selector Prefixes

The new audit should ban these prefixes in `packages/radiants/dark.css`:

- `.btn-`
- `.card`
- `.panel`
- `.surface-interactive`
- `.icon-item`
- `.grid-item`
- `.list-item-interactive`
- `.tab`
- `.toolbar-btn`
- `.mode-btn`
- `.badge-`
- `.text-glow`
- `.text-accent`
- `.text-muted`

If any of these are intended public API, stop and document that explicitly before keeping them.

## Task 1: Add The Narrow Theme Audit

**Files:**
- Modify: `scripts/audit-style-authority.mjs`
- Modify: `packages/radiants/components/core/__tests__/style-authority-audit.test.tsx`
- Modify: `package.json`

**Step 1: Write the failing test**

Extend `packages/radiants/components/core/__tests__/style-authority-audit.test.tsx` with fixture-based tests for a narrow audit helper:

- valid:

```css
.dark { --color-surface-primary: var(--color-ink); }
[data-slot="button-face"][data-variant="primary"] { background: var(--color-ink); }
```

- invalid:

```css
@media (prefers-color-scheme: dark) { :root:not(.light) { --color-surface-primary: var(--color-ink); } }
.btn-primary { background: red; }
.badge-success { color: green; }
```

Then add one repo-level assertion that the helper reports current failures against `packages/radiants/dark.css`.

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir packages/radiants exec vitest run components/core/__tests__/style-authority-audit.test.tsx --cache=false
```

Expected:
- FAIL because the audit helper does not yet exist and `dark.css` still contains banned patterns.

**Step 3: Write minimal implementation**

Extend `scripts/audit-style-authority.mjs` with a second export dedicated to theme-side contract checks. Keep it intentionally small.

Suggested shape:

```js
const PACKAGE_CSS_FILES = [
  'packages/radiants/base.css',
  'packages/radiants/dark.css',
  'packages/radiants/typography.css',
  'packages/radiants/index.css',
];

const BANNED_DARK_SELECTOR_PREFIXES = [
  '.btn-',
  '.card',
  '.panel',
  '.surface-interactive',
  '.icon-item',
  '.grid-item',
  '.list-item-interactive',
  '.tab',
  '.toolbar-btn',
  '.mode-btn',
  '.badge-',
  '.text-glow',
  '.text-accent',
  '.text-muted',
];
```

The audit should:
- read the package CSS files
- fail if any file contains `@media (prefers-color-scheme: dark)`
- fail if `packages/radiants/dark.css` contains any banned prefix

Also add or keep a root script:

```json
"audit:style-authority": "node scripts/audit-style-authority.mjs"
```

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir packages/radiants exec vitest run components/core/__tests__/style-authority-audit.test.tsx --cache=false
node scripts/audit-style-authority.mjs
```

Expected:
- Fixture tests pass.
- The repo-level audit still reports current `dark.css` violations until Tasks 2 and 3.

**Step 5: Commit**

```bash
git add scripts/audit-style-authority.mjs packages/radiants/components/core/__tests__/style-authority-audit.test.tsx package.json
git commit -m "feat(rdna): add narrow theme-side drift audit"
```

## Task 2: Delete The Duplicate System-Dark Path

**Files:**
- Modify: `packages/radiants/dark.css`

**Step 1: Write the failing test**

Add a repo-level assertion in `packages/radiants/components/core/__tests__/style-authority-audit.test.tsx` that fails if `packages/radiants/dark.css` contains:

```css
@media (prefers-color-scheme: dark)
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir packages/radiants exec vitest run components/core/__tests__/style-authority-audit.test.tsx --cache=false
```

Expected:
- FAIL because the duplicate system-dark path still exists.

**Step 3: Write minimal implementation**

Refactor `packages/radiants/dark.css` to delete the entire fallback branch that starts near the current `@media (prefers-color-scheme: dark)` section.

Keep:
- `.dark` token overrides
- `.dark` slot/variant styling for actual package components

Delete:
- the second activation path only

Do not edit docs yet.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir packages/radiants exec vitest run components/core/__tests__/style-authority-audit.test.tsx --cache=false
node scripts/audit-style-authority.mjs
```

Expected:
- No `prefers-color-scheme` finding remains.
- Banned legacy selector findings still remain until Task 3.

**Step 5: Commit**

```bash
git add packages/radiants/dark.css packages/radiants/components/core/__tests__/style-authority-audit.test.tsx
git commit -m "refactor(rdna): remove duplicate system-dark path"
```

## Task 3: Remove The Undocumented Generic Class Layer

**Files:**
- Modify: `packages/radiants/dark.css`

**Step 1: Write the failing test**

Add repo-level assertions that fail if `packages/radiants/dark.css` contains any banned legacy selector prefix from this plan.

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir packages/radiants exec vitest run components/core/__tests__/style-authority-audit.test.tsx --cache=false
node scripts/audit-style-authority.mjs
```

Expected:
- FAIL because `dark.css` still contains the legacy class layer.

**Step 3: Write minimal implementation**

Delete the obviously undocumented selector groups in `packages/radiants/dark.css`, including the sections anchored around the current:

- `.btn-*`
- `.card` / `.panel` / `.surface-interactive`
- `.tab`
- `.toolbar-btn` / `.mode-btn`
- `.badge-*`
- `.text-glow*` / `.text-accent` / `.text-muted`

Keep only:
- `.dark` token overrides
- selectors keyed to actual package hooks such as `[data-slot]`, `[data-variant]`, `[data-state]`, `[data-open]`, `[data-invalid]`, `[role="tab"]`, `[aria-selected="true"]`
- justified scrollbar selectors

Do not broaden the cleanup beyond `dark.css` in this task.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir packages/radiants exec vitest run components/core/__tests__/style-authority-audit.test.tsx --cache=false
pnpm --dir packages/radiants exec vitest run --config vitest.config.ts --cache=false
node scripts/audit-style-authority.mjs
```

Expected:
- Narrow theme audit passes cleanly.
- Existing component and ESLint-rule tests still pass.

**Step 5: Commit**

```bash
git add packages/radiants/dark.css packages/radiants/components/core/__tests__/style-authority-audit.test.tsx
git commit -m "refactor(rdna): remove undocumented generic dark selectors"
```

## Task 4: Keep Component-Side Enforcement Tight

**Files:**
- Modify: `packages/radiants/eslint/__tests__/no-mixed-style-authority.test.mjs`
- Modify: `eslint.rdna.config.mjs`

**Step 1: Write the failing test**

Align the `lint()` helper in `packages/radiants/eslint/__tests__/no-mixed-style-authority.test.mjs` with the real variant list from `eslint.rdna.config.mjs`.

Change the default list from the current narrow set to the full package set:

```js
[
  'primary',
  'secondary',
  'outline',
  'ghost',
  'destructive',
  'physical',
  'select',
  'switch',
  'accordion',
]
```

Then add:
- one valid structural-only `primary` case
- one invalid semantic-color `primary` case
- one invalid `ghost` or `destructive` case

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-mixed-style-authority.test.mjs --cache=false
```

Expected:
- FAIL because the test helper coverage does not yet match runtime scope.

**Step 3: Write minimal implementation**

First, update the unit-test helper default and get the new tests green.

Then tighten enforcement by flipping `rdna/no-mixed-style-authority` from `warn` to `error` for:

- `packages/radiants/components/core/**/*.{ts,tsx}`

Do not change the variant list itself unless the codebase proves it is wrong.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-mixed-style-authority.test.mjs --cache=false
pnpm exec eslint --config eslint.rdna.config.mjs 'packages/radiants/components/core/**/*.{ts,tsx}' --cache=false
```

Expected:
- Mixed-style-authority tests pass with the full runtime variant set.
- The Radiants component tree stays clean under `error` severity.

**Step 5: Commit**

```bash
git add packages/radiants/eslint/__tests__/no-mixed-style-authority.test.mjs eslint.rdna.config.mjs
git commit -m "feat(rdna): tighten component-side style authority enforcement"
```

## Task 5: Update Docs After Code Is Clean

**Files:**
- Modify: `packages/radiants/README.md`
- Modify: `packages/radiants/DESIGN.md`
- Modify: `packages/radiants/CLAUDE.md`
- Modify: `packages/radiants/index.css`
- Create: `docs/qa/2026-03-08-radiants-css-contract-hardening.md`

**Step 1: Write the failing checklist**

Create `docs/qa/2026-03-08-radiants-css-contract-hardening.md` with placeholders for:
- narrow theme audit result
- ESLint result
- Vitest result
- manual light/dark smoke notes for Button, Select, Switch, Tabs, Accordion

**Step 2: Run verification commands**

Run:

```bash
node scripts/audit-style-authority.mjs
pnpm exec eslint --config eslint.rdna.config.mjs 'packages/radiants/components/core/**/*.{ts,tsx}' --cache=false
pnpm --dir packages/radiants exec vitest run --config vitest.config.ts --cache=false
```

Expected:
- all checks pass before docs are finalized

**Step 3: Write minimal implementation**

Update docs only after the code is clean:

- `packages/radiants/README.md`
- `packages/radiants/DESIGN.md`
- `packages/radiants/CLAUDE.md`
- `packages/radiants/index.css`

Document:
- `.dark` is the only package-level dark activation contract
- `rdna/no-mixed-style-authority` is the component-side enforcement mechanism
- the generic class layer was removed and is not public API

Fill `docs/qa/2026-03-08-radiants-css-contract-hardening.md` with the actual command outputs and manual smoke notes.

**Step 4: Run verification to verify it passes**

Run:

```bash
node scripts/audit-style-authority.mjs
pnpm exec eslint --config eslint.rdna.config.mjs 'packages/radiants/components/core/**/*.{ts,tsx}' --cache=false
pnpm --dir packages/radiants exec vitest run --config vitest.config.ts --cache=false
```

Expected:
- docs match the cleaned codebase
- QA note contains real evidence, not placeholders

**Step 5: Commit**

```bash
git add packages/radiants/README.md packages/radiants/DESIGN.md packages/radiants/CLAUDE.md packages/radiants/index.css docs/qa/2026-03-08-radiants-css-contract-hardening.md
git commit -m "docs(rdna): document dark css contract cleanup"
```

## Follow-Up: OKLCH Token Migration After Cleanup

Do this only after the cleanup above lands cleanly.

**Why after:** OKLCH is a good token foundation, but it is a palette migration, not a fix for the current `dark.css` architecture problem. The architecture needs to be stable first.

**Scope of the follow-up:**
- convert primitive brand colors in `packages/radiants/tokens.css`
- keep semantic token names stable
- avoid rewriting component selectors or variant hooks
- visually tune yellows, reds, overlays, and glow colors instead of mechanically converting every value

**Non-goal of the follow-up:**
- do not combine the OKLCH migration with the `dark.css` cleanup branch

## Success Criteria

- `packages/radiants/dark.css` keeps only two roles:
  - dark token overrides
  - real component/slot styling
- `@media (prefers-color-scheme: dark)` is gone from package CSS
- the undocumented generic class layer is gone from `packages/radiants/dark.css`
- `rdna/no-mixed-style-authority` stays as the component-side guardrail and runs at `error` for Radiants internals
- the narrow theme audit passes
- docs are updated once, after the code is clean
- the OKLCH migration is explicitly deferred to a follow-up plan
