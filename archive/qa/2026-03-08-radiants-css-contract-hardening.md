# QA: Radiants CSS Contract Hardening

**Date:** 2026-03-08
**Branch:** `feat/rdna-css-contract-hardening`

## Narrow Theme Audit

```
No mixed style authority findings.
Theme CSS audit: clean.
```

## ESLint (rdna/no-mixed-style-authority at error)

```
packages/radiants/components/core/**/*.{ts,tsx} — 0 errors, 0 warnings
Exit code: 0
```

## Vitest

```
Test Files  31 passed (31)
     Tests  212 passed (212)
```

## Manual Light/Dark Smoke Test

| Component | Light | Dark | Notes |
|-----------|-------|------|-------|
| Button    | pass  | pass | all variants render correctly |
| Select    | pass  | pass | glow on hover/open works |
| Switch    | pass  | pass | track + thumb styling correct |
| Tabs      | pass  | pass | pill tabs, selected state ok |
| Accordion | pass  | pass | trigger hover glow works |
