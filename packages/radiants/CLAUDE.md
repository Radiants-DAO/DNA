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

### ESLint plugin

- **Location:** `packages/radiants/eslint/`
- **Run:** `pnpm lint:design-system` (full scan) or `pnpm lint:design-system:staged` (pre-commit)
- **Config:** `eslint.rdna.config.mjs` at repo root
- **Review workflow:** [docs/solutions/tooling/rdna-design-review-workflow.md](/Users/rivermassey/Desktop/dev/DNA/docs/solutions/tooling/rdna-design-review-workflow.md)
- **Rules:**
  - `rdna/no-hardcoded-colors` — ban non-semantic color usage; require RDNA semantic color tokens
  - `rdna/no-hardcoded-spacing` — ban arbitrary spacing values (`p-[13px]`, inline pixel spacing)
  - `rdna/no-hardcoded-typography` — ban raw font-size/font-weight utilities
  - `rdna/prefer-rdna-components` — ban raw HTML elements when RDNA equivalent exists
  - `rdna/no-removed-aliases` — ban removed token aliases
  - `rdna/no-raw-radius` — ban raw radius values and arbitrary rounded classes
  - `rdna/no-raw-shadow` — ban raw shadow values and arbitrary shadow classes
  - `rdna/no-hardcoded-motion` — ban raw duration/easing values

Repo-local review rules stay in `eslint.rdna.config.mjs` instead of the exported shared plugin configs:
- `rdna/require-exception-metadata`
- `rdna/no-broad-rdna-disables`
- `rdna/no-mixed-style-authority`

Use lint for structural enforcement and the design review workflow for visual hierarchy, motion, overlays, and window-layout QA.

### Exception format

When a violation is intentional, use this exact format:

```tsx
// eslint-disable-next-line rdna/<rule> -- reason:<reason> owner:<team-slug> expires:YYYY-MM-DD issue:DNA-123
```

Rules:
- RDNA exceptions may only use `eslint-disable-next-line`. Broad `eslint-disable` and `eslint-disable-line` are invalid.
- `owner` must be a lowercase team slug such as `design-system` or `frontend-platform`.
- `issue` must be either `DNA-123` style or a full `https://...` URL.
- Expired exceptions are invalid and fail the RDNA lint run.
- Agents should fix RDNA violations instead of adding exceptions. New `rdna/*` exceptions require explicit approval in code review and are reported in CI.
