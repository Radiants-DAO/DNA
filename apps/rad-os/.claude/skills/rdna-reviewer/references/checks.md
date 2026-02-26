# RDNA Reviewer Checks

This file defines the check IDs emitted by `scripts/rdna_qc.py`.

## Core Errors (`migration` + `greenfield`)

- `spec.canonical-design-missing`
  - `design.md` or `packages/radiants/DESIGN.md` must exist.

- `tailwind.no-v3-config`
  - Tailwind v4 projects must not keep `tailwind.config.*`.

- `tailwind.no-apply`
  - `@apply` is a warning in `migration` and an error in `greenfield`.

- `tokens.no-deprecated-aliases`
  - Removed aliases must not reappear:
    - `--color-black`
    - `--color-white`
    - `--color-green`
    - `--color-success-green`
    - `--color-warm-cloud`
    - `--glow-green`
    - `--color-success-green-dark`
    - `--color-warning-yellow-dark`
    - `--color-error-red-dark`

- `tokens.sun-overlays-opaque`
  - In `tokens.css`, these must be opaque primitive `var(...)` references:
    - `--color-surface-overlay-subtle`
    - `--color-surface-overlay-medium`
    - `--color-hover-overlay`
    - `--color-active-overlay`
  - `rgba(...)` assignments are invalid in Sun Mode token definitions.

- `tailwind.maxw-no-tshirt`
  - Disallow Tailwind v4 `max-w-{size}` t-shirt utilities (`max-w-md`, etc.).

## Strict Rules (`greenfield`; warnings in `migration`)

- `typography.semantic-tag-overrides`
  - Avoid typography skin classes on semantic tags (`h1-h4`, `p`, `label`).

- `tailwind.no-arbitrary-px-utility`
  - Avoid arbitrary px classes for text/spacing.
