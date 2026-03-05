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
| `rdna/no-hardcoded-spacing` | Ban raw numeric spacing utilities (mt-3, px-4, gap-2) | error |
| `rdna/no-hardcoded-typography` | Ban raw font-size/font-weight utilities | error |
| `rdna/prefer-rdna-components` | Ban raw HTML elements when RDNA equivalent exists | error |
| `rdna/no-removed-aliases` | Ban deprecated token names | error |

### Exceptions

Use `// eslint-disable-next-line rdna/<rule> -- <reason>` for intentional violations.
Exceptions are reviewed as code debt. Stale exceptions are audited quarterly.

### Scope

Enforced in:
- `packages/radiants/components/core/**/*.tsx` (token rules only — wrapper rule exempt for internals)
- `apps/rad-os/**/*.tsx`
- `apps/radiator/**/*.tsx`
- Any package/app with `eslint-plugin-rdna` in its ESLint config

Not enforced (yet):
- `apps/monolith-hackathon/` (separate theme, separate migration)
- `tools/` (non-UI code)
```

---

## Layer 2: Token Layer (already strong — minor additions)

The existing token architecture is solid:
- **Tier 1 (Brand):** `--color-cream`, `--color-ink`, `--color-sun-yellow`, etc.
- **Tier 2 (Semantic):** `--color-surface-primary`, `--color-content-heading`, `--color-edge-focus`, etc.

### What changes

1. **Token map file** — Create `packages/radiants/eslint/token-map.ts` that maps:
   - Hex values → semantic token names (for auto-fix)
   - Raw Tailwind classes → semantic Tailwind classes (for auto-fix)
   - Banned class patterns → suggested replacements

   This file is the single source of truth for the ESLint plugin's auto-fixer.

2. **Spacing token contract** — Document which Tailwind spacing utilities are allowed vs banned:
   - Allowed: semantic spacing classes that map to RDNA tokens (if defined)
   - Banned: raw numeric utilities (`mt-3`, `px-4`, `gap-2`, `p-[12px]`)
   - Decision needed: Does RDNA define named spacing tokens (like `mt-s`, `gap-m`), or are raw Tailwind spacing utilities acceptable since they're already on a consistent 4px grid?

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
4. Run `npm run lint:design-system` before committing
5. Zero errors required

## Token rules
- Colors: `bg-surface-primary`, `text-content-heading` — never `bg-[#FEF8E2]`
- Spacing: Use RDNA spacing tokens — never arbitrary values
- Typography: `text-sm` through `text-3xl` — never `text-[44px]`
- Radius: `rounded-radius-sm` through `rounded-radius-full` — never `rounded-[6px]`

## Component rules
- If an RDNA component exists, use it. Don't reach for raw `<button>`, `<input>`, `<dialog>`, etc.
- Exception: code inside `packages/radiants/components/core/` internals

## Enforcement
Design system rules are enforced by `eslint-plugin-rdna`. See DESIGN.md § Machine Enforcement.
```

### 3b. Enhance `rdna-reviewer` skill

Update the existing global skill to reference the ESLint plugin:
- Route all UI review tasks through the plugin first
- Skill should run `npm run lint:design-system` as part of its review flow
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
- **Exempt:** `packages/radiants/components/core/` internals (CSS custom property fallback values)

#### `rdna/no-hardcoded-spacing` (error)
- **Detects:** Raw numeric Tailwind spacing utilities: `mt-3`, `px-4`, `gap-2`, `p-[12px]`
- **Auto-fix:** When clear mapping exists (e.g., `mt-4` → `mt-spacing-m`)
- **Decision point:** Need to define which spacing classes are allowed. Options:
  - a) Ban ALL raw numeric and allow only named semantic classes (requires defining `spacing-xs` through `spacing-xl` tokens)
  - b) Allow raw Tailwind spacing utilities since they're already on a 4px grid, but ban arbitrary bracket values (`p-[13px]`)
  - c) Allowlist specific values that align with the token scale

#### `rdna/no-hardcoded-typography` (error)
- **Detects:** Arbitrary font sizes: `text-[44px]`, `text-[1.1rem]`, `fontSize: '14px'`
- **Detects:** Arbitrary font weights: `font-[450]`, `fontWeight: 450`
- **Allows:** `text-xs` through `text-3xl` (maps to `--font-size-*` tokens)
- **Allows:** `font-normal`, `font-medium`, `font-semibold`, `font-bold`
- **Auto-fix:** Map common arbitrary values to nearest token

#### `rdna/prefer-rdna-components` (error)
- **Detects:** Raw HTML elements where RDNA equivalent exists:
  - `<button>` → `Button`
  - `<input>` → `Input`
  - `<select>` → `Select`
  - `<textarea>` → `Input` (multiline)
  - `<dialog>` → `Dialog`
  - `<details>/<summary>` → `Accordion`
  - `<a>` with button styling → `Button` with `asChild`
  - Custom toast/notification patterns → `Toast`
  - Custom alert/banner patterns → `Alert`
  - Custom dropdown patterns → `DropdownMenu`
  - Custom popover patterns → `Popover`
  - Custom tooltip patterns → `Tooltip`
  - Custom tab patterns → `Tabs`
  - Custom slider patterns → `Slider`
  - Custom checkbox patterns → `Checkbox`
  - Custom switch/toggle patterns → `Switch`
  - Custom progress patterns → `Progress`
  - Custom sheet/drawer patterns → `Sheet`
  - Custom context-menu patterns → `ContextMenu`
  - Custom breadcrumb patterns → `Breadcrumbs`
- **Exempt:** Files inside `packages/radiants/components/core/` (component internals)
- **Auto-fix:** No auto-fix (replacement is not a simple substitution — requires prop mapping)

#### `rdna/no-removed-aliases` (error)
- **Detects:** Usage of deprecated token names: `--color-black`, `--color-white`, `--color-green`, `--color-success-green`, `--glow-green`
- **Auto-fix:** Replace with current semantic equivalent where mapping is clear
- **Note:** This replaces the current CI grep check with a proper lint rule

### Recommended config

The plugin exports a `recommended` config:

```ts
export const configs = {
  recommended: {
    plugins: ['rdna'],
    rules: {
      'rdna/no-hardcoded-colors': 'error',
      'rdna/no-hardcoded-spacing': 'error',
      'rdna/no-hardcoded-typography': 'error',
      'rdna/prefer-rdna-components': 'error',
      'rdna/no-removed-aliases': 'error',
    },
  },
  // For use inside packages/radiants/components/core/ — no wrapper rule
  internals: {
    plugins: ['rdna'],
    rules: {
      'rdna/no-hardcoded-colors': 'error',
      'rdna/no-hardcoded-spacing': 'error',
      'rdna/no-hardcoded-typography': 'error',
      'rdna/prefer-rdna-components': 'off',
      'rdna/no-removed-aliases': 'error',
    },
  },
};
```

---

## Layer 5: Pre-commit Hook + CI Gate

### Pre-commit: simple git hook

`.git/hooks/pre-commit` (committed as `scripts/pre-commit` and symlinked during setup):

```bash
#!/bin/sh
# RDNA Design System — pre-commit gate
# Runs ESLint design-system rules on staged .tsx/.ts/.css files

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(tsx?|css)$')

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

echo "RDNA: checking staged files for design system violations..."
npx eslint --no-eslintrc -c eslint.rdna.config.mjs $STAGED_FILES

if [ $? -ne 0 ]; then
  echo ""
  echo "RDNA: design system violations found. Fix before committing."
  echo "Use // eslint-disable-next-line rdna/<rule> -- <reason> for intentional exceptions."
  exit 1
fi
```

### CI gate: expand existing workflow

Extend `.github/workflows/rdna-design-guard.yml`:

```yaml
# Add to existing workflow:
  design-system-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - name: RDNA Design System Lint
        run: npx eslint --config eslint.rdna.config.mjs 'packages/radiants/components/core/**/*.{ts,tsx}' 'apps/rad-os/**/*.{ts,tsx}' 'apps/radiator/**/*.{ts,tsx}'
```

### Orchestrator script

Add to root `package.json`:

```json
{
  "scripts": {
    "lint:design-system": "eslint --config eslint.rdna.config.mjs 'packages/radiants/components/core/**/*.{ts,tsx}' 'apps/rad-os/**/*.{ts,tsx}' 'apps/radiator/**/*.{ts,tsx}'",
    "lint:design-system:staged": "scripts/pre-commit"
  }
}
```

Single entrypoint. Agents, hooks, and CI all call the same contract.

---

## Open Decisions

### 1. Spacing token strategy

RDNA defines raw CSS custom properties for spacing in some components, but Tailwind's numeric utilities (`mt-4`, `gap-6`) are already on a consistent 4px base grid. Three options:

| Option | Pros | Cons |
|---|---|---|
| **A: Named semantic spacing** (`gap-spacing-m`) | Fully token-controlled, easy to retheme | Requires defining and maintaining a spacing token scale; large migration surface |
| **B: Allow Tailwind numeric, ban arbitrary** | Zero migration needed for Tailwind classes; only `p-[13px]` style violations | Not fully token-controlled; can't retheme spacing by changing one variable |
| **C: Allowlist specific values** | Precise control | Tedious to maintain |

**Recommendation:** Start with **Option B** — ban arbitrary bracket spacing values but allow standard Tailwind numeric utilities. Upgrade to Option A later if you define a named spacing scale.

### 2. Component detection heuristic

`prefer-rdna-components` for simple elements (`<button>`, `<input>`) is straightforward. For complex patterns (detecting "custom toast" vs legitimate `<div>` usage), the rule gets fuzzy.

**Recommendation:** Start with the clear-cut elements (button, input, select, textarea, dialog, details) and add pattern detection incrementally.

### 3. Cross-package import enforcement

Should we also enforce that consuming apps import from the radiants barrel export rather than reaching into internal paths?

```tsx
// Allowed
import { Button } from '@rdna/radiants'

// Banned
import { Button } from '@rdna/radiants/components/core/Button/Button'
```

**Recommendation:** Yes — add `rdna/no-deep-imports` as a future rule.

---

## Rollout Order

1. **ESLint plugin scaffold** — rules, tests, recommended config
2. **`no-hardcoded-colors`** — highest impact, clearest mappings
3. **`no-hardcoded-typography`** — small surface area, easy win
4. **`no-removed-aliases`** — replaces existing CI grep check
5. **`no-hardcoded-spacing`** — depends on spacing strategy decision
6. **`prefer-rdna-components`** — start with clear-cut elements
7. **Pre-commit hook** — wire up after rules are stable
8. **CI gate expansion** — add to existing workflow
9. **Agent routing** — add `packages/radiants/CLAUDE.md`, update skill

---

## What This Doesn't Cover (Yet)

- **Spec files** — Keeping current DESIGN.md + schema.json + dna.json pattern per user decision
- **Upstream drift detection** — Not applicable yet (RDNA is the upstream; no external DS dependency)
- **Monolith theme** — Separate theme, separate enforcement pass
- **Runtime validation** — Only static analysis for now
