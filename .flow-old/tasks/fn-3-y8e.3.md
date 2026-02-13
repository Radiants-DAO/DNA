# fn-3-y8e.3 Add spacing tokens

## Description
Add spacing tokens per DNA spec. Edit `packages/radiants/tokens.css` to add:
`--spacing-xs` (4px), `--spacing-sm` (8px), `--spacing-md` (16px), `--spacing-lg` (24px), `--spacing-xl` (32px), `--spacing-2xl` (48px)
## Acceptance
- [ ] All spacing tokens defined (xs through 2xl)
- [ ] Tokens resolve without errors
## Done summary
Added spacing tokens (xs through 2xl) to tokens.css per DNA spec, enabling consistent spacing for layout and components.
## Evidence
- Commits: ed3fae99415b4c9d9fe6a6e25a14e91f57e06739
- Tests: pnpm install, pnpm dev (verified server starts)
- PRs: