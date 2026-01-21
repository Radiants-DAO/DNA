# fn-3-y8e.21 CountdownTimer: schema + token refactor

## Description
Add three-file pattern and refactor tokens for CountdownTimer component.

1. Create `CountdownTimer.schema.json` with props, variants, examples
2. Create `CountdownTimer.dna.json` with token bindings
3. Refactor className props from brand tokens to semantic tokens

Reference existing patterns: Button.schema.json, Button.dna.json
## Acceptance
- [ ] CountdownTimer.schema.json created with valid structure
- [ ] CountdownTimer.dna.json created with token bindings
- [ ] No brand tokens in className props (use semantic)
- [ ] Component renders in light mode
- [ ] Component renders in dark mode
## Done summary
Added three-file pattern for ContextMenu with schema.json (including subcomponents array) and dna.json files. Refactored all className props from brand tokens to semantic tokens using Tailwind opacity modifiers.
## Evidence
- Commits: ea16a9e7d4ce19aab86b9db7d4ac888f6472d542
- Tests: pnpm dev (dev server starts successfully)
- PRs: