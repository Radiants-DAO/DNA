---
title: "ESLint RDNA Drift Bugs (March 2026)"
category: tooling
date: 2026-03-22
tags: [eslint, rdna, drift, bug, token-map, semantic-colors, theme-variants, false-positive]
---

# ESLint RDNA Drift Bugs (March 2026)

## Symptom

Three drift bugs discovered during design contract architecture research. All caused by hand-maintained ESLint data falling out of sync with CSS/component reality.

## Bug 1: Stale `SEMANTIC_COLOR_SUFFIXES` (ACTIVE — false positives)

**File:** `packages/radiants/eslint/rules/no-hardcoded-colors.mjs:76-89`

The hardcoded allowlist includes old naming convention tokens (`page`, `card`, `inv`, `main`, etc.) but is **missing all new naming convention tokens**:
- `surface-primary`, `surface-secondary`, `surface-elevated`
- `content-primary`, `content-heading`, `content-secondary`, `content-inverted`, `content-muted`, `content-link`
- `edge-primary`, `edge-muted`, `edge-hover`, `edge-focus`
- `action-primary`, `action-secondary`, `action-destructive`, `action-accent`
- `status-success`, `status-warning`, `status-error`, `status-info`

These tokens exist in `tokens.css` and are used as autofix targets in `oklchToSemantic` (token-map.mjs:70-115), but `bg-surface-primary` in a className triggers a false positive.

**Fix:** Add all new naming convention suffixes to the allowlist. Long-term: generate from `tokens.css`.

## Bug 2: Wrong `themeVariants` list (ACTIVE — false negatives + potential false positives)

**File:** `eslint.rdna.config.mjs:93-96`

```js
themeVariants: [
  'primary', 'secondary', 'outline', 'ghost', 'destructive',
  'select', 'switch', 'accordion',
]
```

- `primary`, `secondary`, `outline`, `ghost`, `destructive` are **NOT** `data-variant` selectors in `base.css`
- Card's actual variants (`default`, `inverted`, `raised`) **ARE** in CSS but **NOT** in this list

Result: `no-mixed-style-authority` misses Card's mixed-authority violations (false negatives) and may falsely report for non-existent CSS selectors.

**Fix:** Audit `base.css` for actual `data-variant` selectors and update the list. Long-term: derive from component `styleOwnership` metadata.

## Bug 3: Incomplete `rdnaComponentMap` (LOW — missing enforcement)

**File:** `packages/radiants/eslint/token-map.mjs:126-134`

Only 5 element replacements enforced:
- `button` → Button, `input` → Input, `select` → Select, `textarea` → Input, `dialog` → Dialog

Missing:
- `hr` → Separator
- `meter` / `progress` → Meter
- `details` → Collapsible
- `label` → Label (lives in Input directory)

**Fix:** Add missing entries. Long-term: generate from component `replaces` field in `*.meta.ts`.

## Root Cause

All three bugs share the same root cause: **hand-maintained ESLint data is disconnected from the source of truth** (CSS tokens and component metadata). There is no automated validation that these maps match reality.

## Solution

Immediate: fix each bug individually by updating the hardcoded data.

Long-term: the design contract architecture (see `docs/solutions/tooling/design-contract-architecture-decision.md`) eliminates these drift surfaces by generating all ESLint data from `*.meta.ts` + `tokens.css`.

## Prevention

- Short-term: add a CI script that validates `SEMANTIC_COLOR_SUFFIXES` against `tokens.css` `@theme` `--color-*` entries
- Short-term: add a test that validates `rdnaComponentMap` against actual component directories
- Long-term: generate `eslint-contract.json` from the design contract, eliminating manual sync entirely
