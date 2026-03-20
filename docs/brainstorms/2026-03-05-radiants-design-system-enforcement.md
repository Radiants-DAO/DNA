# Radiants Design System Enforcement — 5-Layer Plan

**Date:** 2026-03-05
**Scope:** `packages/radiants` + all RDNA consumers (`rad-os`, `radiator`, any app importing RDNA tokens)
**Reference:** [Force Your Agent to Obey Your Design System](5-layer model) + [Expose Your Design System to LLMs](spec/audit model)

---

## Current State

| Layer | Status | What Exists |
|---|---|---|
| Canonical docs | Strong | `DESIGN.md` with RFC normative language, two-tier token spec, conformance checklist (manual) |
| Token layer | Strong | Closed `@theme` block (brand → semantic), `dark.css` overrides, reduced-motion support |
| Agent routing | Partial | `rdna-reviewer` skill exists globally; no per-package CLAUDE.md |
| Custom lint | Missing | Zero ESLint rules. No `lint` script in radiants. No hardcoded-value detection |
| Pre-commit hooks | Missing | No husky, no lint-staged, no git hooks |
| CI gate | Narrow | 3 checks only: symlink integrity, alias regression, doc guard. No component-level enforcement |

---

## Governance

- **Policy owner:** `packages/radiants` maintainers approve rule additions, removals, and exceptions longer than 30 days
- **Consumer owner:** each in-scope app owner fixes violations in their surface during rollout windows
- **Versioning:** new blocking rules land in `warn` mode first, then flip to `error` after migration issues are understood
- **Success metrics:** track violation count, exception count, CI failure rate, and median time-to-fix for design-system lint failures

---

## Layer 1: Canonical Docs (upgrade existing)

### What changes

DESIGN.md already uses RFC language. The gap is a **machine-enforceable rules section** that maps directly to ESLint rule names.

Add a `## Machine Enforcement` section to DESIGN.md:

```markdown
## Machine Enforcement

These rules are enforced by `eslint-plugin-rdna`. Rule names map 1:1 to policy.

| Rule | Enforces | Severity |
|---|---|---|
| `rdna/no-hardcoded-colors` | Ban hex/rgb/hsl literals and arbitrary Tailwind color classes | error |
| `rdna/no-hardcoded-spacing` | Ban arbitrary spacing values (`p-[13px]`, inline pixel spacing); allow standard Tailwind scale classes for now | error |
| `rdna/no-hardcoded-typography` | Ban raw font-size/font-weight utilities | error |
| `rdna/prefer-rdna-components` | Ban raw HTML elements when RDNA equivalent exists | error |
| `rdna/no-removed-aliases` | Ban removed token aliases | error |

### Exceptions

Use `// eslint-disable-next-line rdna/<rule> -- reason:<reason> owner:<team> expires:YYYY-MM-DD issue:<link-or-id>` for intentional violations.
Exceptions without owner, expiry, and issue reference fail review. Stale exceptions are audited monthly.

### Scope

Enforced in:
- `packages/radiants/components/core/**/*.tsx` (token rules only — wrapper rule exempt for internals)
- `apps/rad-os/**/*.tsx`
- `apps/radiator/**/*.tsx`
- Any package/app with `eslint-plugin-rdna` in its ESLint config

Not enforced (yet):
- `tools/` (non-UI code)
```

---

## Layer 2: Token Layer (already strong — minor additions)

The existing token architecture is solid:
- **Tier 1 (Brand):** `--color-cream`, `--color-ink`, `--color-sun-yellow`, etc.
- **Tier 2 (Semantic):** `--color-page`, `--color-head`, `--color-focus`, etc.

### What changes

1. **Token map file** — Create `packages/radiants/eslint/token-map.ts` that maps:
   - Hex values → semantic token names (for auto-fix)
   - Raw Tailwind classes → semantic Tailwind classes (for auto-fix)
   - Banned class patterns → suggested replacements

   This file is the single source of truth for exact-match auto-fixes and suggestion text.

2. **Spacing token contract** — Lock v1 to a single policy:
   - Allowed: standard Tailwind spacing scale classes (`mt-4`, `px-6`, `gap-2`) while RDNA does not expose named semantic spacing utilities
   - Banned: arbitrary bracket spacing values (`p-[12px]`, `gap-[13px]`) and inline spacing styles (`style={{ padding: 12 }}`)
   - Future upgrade path: if RDNA later defines named spacing tokens, tighten the rule in a separate migration

3. **Typography contract** — Document allowed typography classes:
   - Allowed: `text-xs` through `text-3xl` (maps to `--font-size-*` tokens)
   - Banned: arbitrary font sizes (`text-[44px]`, `text-[1.1rem]`)
   - Banned: arbitrary font weights (`font-[450]`)

---

## Layer 3: Agent Routing (new)

### 3a. Per-package CLAUDE.md

Create `packages/radiants/CLAUDE.md`:

```markdown
# Radiants — CLAUDE.md

## Before writing or modifying any UI code:

1. Read `packages/radiants/DESIGN.md` (canonical source of truth)
2. Check if an RDNA component exists for what you're building (`packages/radiants/components/core/`)
3. Use only semantic tokens from `tokens.css` — never hardcode colors, spacing, or typography
4. Run `pnpm lint:design-system` before committing
5. Zero errors required

## Token rules
- Colors: `bg-page`, `text-head` — never `bg-[#FEF8E2]`
- Spacing: standard Tailwind scale classes are allowed for now; arbitrary values are not
- Typography: `text-sm` through `text-3xl` — never `text-[44px]`
- Radius: use the exported RDNA radius utilities/tokens; never `rounded-[6px]`

## Component rules
- If an RDNA component exists, use it. Don't reach for raw `<button>`, `<input>`, `<dialog>`, etc.
- Exception: code inside `packages/radiants/components/core/` internals

## Enforcement
Design system rules are enforced by `eslint-plugin-rdna`. See DESIGN.md § Machine Enforcement.
```

### 3b. Enhance `rdna-reviewer` skill

Update the existing global skill to reference the ESLint plugin:
- Route all UI review tasks through the plugin first
- Skill should run `pnpm lint:design-system` as part of its review flow
- Skill output should include violation count and fix suggestions

---

## Layer 4: Custom ESLint Rules

### Plugin: `packages/radiants/eslint/`

Co-located with the design system. Structure:

```
packages/radiants/eslint/
├── index.ts              # Plugin entrypoint — exports rules + recommended config
├── token-map.ts          # Hex → token, class → token mappings (source of truth for auto-fix)
├── rules/
│   ├── no-hardcoded-colors.ts
│   ├── no-hardcoded-spacing.ts
│   ├── no-hardcoded-typography.ts
│   ├── prefer-rdna-components.ts
│   └── no-removed-aliases.ts
└── __tests__/
    ├── no-hardcoded-colors.test.ts
    ├── no-hardcoded-spacing.test.ts
    ├── no-hardcoded-typography.test.ts
    ├── prefer-rdna-components.test.ts
    └── no-removed-aliases.test.ts
```

### Rule details

#### `rdna/no-hardcoded-colors` (error)
- **Detects:** Hex/rgb/hsl/hsla literals in className strings, style objects, and CSS-in-JS
- **Detects:** Arbitrary Tailwind color classes: `bg-[#fff]`, `text-[rgb(0,0,0)]`
- **Auto-fix:** When a 1:1 mapping exists in `token-map.ts`, replace with semantic class
- **No auto-fix:** If more than one semantic token could match, emit a suggestion only
- **Exempt:** `packages/radiants/components/core/` internals (CSS custom property fallback values)

#### `rdna/no-hardcoded-spacing` (error)
- **Detects:** Arbitrary Tailwind spacing utilities: `p-[12px]`, `gap-[13px]`, `mx-[5%]`
- **Detects:** Inline spacing styles: `style={{ padding: 12 }}`, `style={{ gap: '13px' }}`
- **Allows:** Standard Tailwind spacing scale utilities: `mt-3`, `px-4`, `gap-2`
- **Auto-fix:** Only for exact mappings that preserve behavior exactly; otherwise suggestion only

#### `rdna/no-hardcoded-typography` (error)
- **Detects:** Arbitrary font sizes: `text-[44px]`, `text-[1.1rem]`, `fontSize: '14px'`
- **Detects:** Arbitrary font weights: `font-[450]`, `fontWeight: 450`
- **Allows:** `text-xs` through `text-3xl` (maps to `--font-size-*` tokens)
- **Allows:** `font-normal`, `font-medium`, `font-semibold`, `font-bold`
- **Auto-fix:** Only when an exact token match exists; never map to the "nearest" token

#### `rdna/prefer-rdna-components` (error)
- **Detects:** Raw HTML elements where RDNA equivalent exists:
  - `<button>` → `Button`
  - `<input>` → `Input`
  - `<select>` → `Select`
  - `<textarea>` → `Input` (multiline)
  - `<dialog>` → `Dialog`
  - `<details>/<summary>` → `Accordion`
- **v1 intentionally excludes:** pattern heuristics like "custom toast", "button-styled anchor", or generic `<div>` structures
- **Future rules:** add separate targeted rules for deep imports or known anti-patterns after measuring false positives
- **Exempt:** Files inside `packages/radiants/components/core/` (component internals)
- **Auto-fix:** No auto-fix (replacement is not a simple substitution — requires prop mapping)

#### `rdna/no-removed-aliases` (error)
- **Detects:** Usage of removed token aliases: `--color-black`, `--color-white`, `--color-green`, `--color-success-green`, `--glow-green`
- **Auto-fix:** Replace with current semantic equivalent where mapping is clear
- **Note:** This replaces the current CI grep check with a proper lint rule

### Flat config integration

Consuming apps already use ESLint 9 flat config, so the plugin must export flat-config-friendly rule sets.

```ts
import rdna from '@rdna/radiants/eslint';

export default [
  {
    files: ['apps/rad-os/**/*.{ts,tsx}', 'apps/radiator/**/*.{ts,tsx}'],
    plugins: { rdna },
    rules: {
      ...rdna.configs.recommended.rules,
    },
  },
  {
    files: ['packages/radiants/components/core/**/*.{ts,tsx}'],
    plugins: { rdna },
    rules: {
      ...rdna.configs.internals.rules,
    },
  },
];
```

---

## Layer 5: Pre-commit Hook + CI Gate

### Pre-commit: committed hook + staged-file script

Avoid symlinked hooks. Commit `.githooks/pre-commit`, set `git config core.hooksPath .githooks` during bootstrap, and keep staged-file selection inside a dedicated script.

`.githooks/pre-commit`:

```bash
#!/bin/sh
pnpm lint:design-system:staged
```

`lint:design-system:staged` should be implemented as a small Node script that:
- Reads staged files with `git diff --cached --name-only --diff-filter=ACMR -z`
- Filters to in-scope UI files only
- Invokes ESLint with explicit file arguments
- Handles spaces and special characters safely
- Prints the same exception format required by DESIGN.md

### CI gate: expand existing workflow

Extend `.github/workflows/rdna-design-guard.yml`:

```yaml
# Add to existing workflow:
  design-system-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: RDNA Design System Lint
        run: pnpm lint:design-system
```

### Orchestrator script

Add to root `package.json`:

```json
{
  "scripts": {
    "lint:design-system": "pnpm exec eslint --config eslint.rdna.config.mjs 'packages/radiants/components/core/**/*.{ts,tsx}' 'apps/rad-os/**/*.{ts,tsx}' 'apps/radiator/**/*.{ts,tsx}'",
    "lint:design-system:staged": "node scripts/lint-design-system-staged.mjs"
  }
}
```

Root `devDependencies` should own `eslint` and any config/runtime deps required by `eslint.rdna.config.mjs`.
Single entrypoint. Agents, hooks, and CI all call the same contract.

---

## Open Decisions

### 1. Cross-package import enforcement

Should we also enforce that consuming apps import from the radiants barrel export rather than reaching into internal paths?

```tsx
// Allowed
import { Button } from '@rdna/radiants'

// Banned
import { Button } from '@rdna/radiants/components/core/Button/Button'
```

**Recommendation:** Yes — add `rdna/no-deep-imports` as a future rule.

### 2. Rollout mode duration

New blocking rules should not go straight from brainstorm to hard-fail. Use this rollout:

1. Ship rule in `warn` mode and collect violations for one sprint
2. Fix baseline violations in in-scope paths
3. Flip pre-commit to blocking
4. Flip CI to blocking after local friction is acceptable

---

## Rollout Order

1. **ESLint plugin scaffold** — rules, tests, recommended config
2. **`no-hardcoded-colors`** — highest impact, clearest mappings
3. **`no-hardcoded-typography`** — small surface area, easy win
4. **`no-removed-aliases`** — replaces existing CI grep check
5. **`no-hardcoded-spacing`** — v1 bans arbitrary spacing only; keep Tailwind scale utilities legal
6. **`prefer-rdna-components`** — start with clear-cut elements only
7. **Warn-mode rollout** — collect baseline violations and migration effort
8. **Pre-commit hook** — wire up after rules are stable
9. **CI gate expansion** — add to existing workflow
10. **Agent routing** — add `packages/radiants/CLAUDE.md`, update skill

---

## What This Doesn't Cover (Yet)

- **Spec files** — Keeping current DESIGN.md + schema.json + dna.json pattern per user decision
- **Upstream drift detection** — Not applicable yet (RDNA is the upstream; no external DS dependency)
- **Separate themes** — Handle outside this enforcement pass
- **Runtime validation** — Only static analysis for now
