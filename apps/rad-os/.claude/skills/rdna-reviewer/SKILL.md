---
name: rdna-reviewer
description: Audit RDNA UI code for design-system conformance and Tailwind v4 CSS guardrails. Use when reviewing frontend PRs, editing tokens/theme/CSS, migrating components, or before merging UI changes in RadOS/RDNA apps.
---

# RDNA Reviewer

Run this skill to enforce the non-negotiable RDNA rules while keeping migration practical.

## Workflow
1. Resolve the canonical spec at `design.md` (symlink) or `packages/radiants/DESIGN.md`.
2. Run automated checks:
```bash
python3 .claude/skills/rdna-reviewer/scripts/rdna_qc.py --profile migration
```
3. For net-new apps or full rewrites, run strict mode:
```bash
python3 .claude/skills/rdna-reviewer/scripts/rdna_qc.py --profile greenfield
```
4. Fix all errors first, then warnings.
5. Re-run the audit and `npx tsc --noEmit`.
6. Report findings as `severity → file:line → violated rule`.

## Profiles

- `migration` (default): blocks only high-confidence regressions.
- `greenfield`: applies stricter typography and Tailwind utility discipline.

Use `migration` for existing codebases and CI bootstrap.
Use `greenfield` for new screens/apps where you want clean conformance from day one.

## Enforced Rules

- No removed/deprecated token aliases.
- Sun Mode overlay tokens remain opaque primitives.
- No Tailwind config files in v4 projects.
- No `@apply` in source CSS/TSX.
- No Tailwind v4 `max-w-*` T-shirt utilities (`max-w-md`, etc.).
- Greenfield-only strict checks:
  - No typography skin classes on semantic tags (`h1-h4`, `p`, `label`).
  - No `text-sm` in RDNA scale.
  - No arbitrary px utilities for text/spacing.

## Tailwind v4 Guardrails

- Keep semantic token chains in `@theme`.
- Do not reintroduce `@apply`.
- Avoid old width abstractions (`max-w-md`, etc.) that changed semantics in v4.
- Prefer tokenized utilities over raw/arbitrary one-off styling.

## References

- See `references/checks.md` for rule IDs and rationale.

## Script

`scripts/rdna_qc.py`

Examples:
```bash
# Default migration gate
python3 .claude/skills/rdna-reviewer/scripts/rdna_qc.py

# Strict mode for new surfaces
python3 .claude/skills/rdna-reviewer/scripts/rdna_qc.py --profile greenfield

# CI mode that fails on warnings too
python3 .claude/skills/rdna-reviewer/scripts/rdna_qc.py --profile migration --fail-on-warn
```
