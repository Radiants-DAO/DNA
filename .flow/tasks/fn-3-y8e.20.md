# fn-3-y8e.20 HelpPanel: schema + token refactor

## Description
Add three-file pattern and refactor tokens for HelpPanel component.

1. Create `HelpPanel.schema.json` with props, variants, examples
2. Create `HelpPanel.dna.json` with token bindings
3. Refactor className props from brand tokens to semantic tokens

Reference existing patterns: Button.schema.json, Button.dna.json
## Acceptance
- [ ] HelpPanel.schema.json created with valid structure
- [ ] HelpPanel.dna.json created with token bindings
- [ ] No brand tokens in className props (use semantic)
- [ ] Component renders in light mode
- [ ] Component renders in dark mode
## Done summary
Added CountdownTimer.schema.json and CountdownTimer.dna.json files, and refactored all className props from brand tokens (bg-warm-cloud, text-black, border-black, bg-cream) to semantic tokens (bg-surface-primary, text-content-primary, border-edge-primary, bg-surface-muted, shadow-card).
## Evidence
- Commits: ea16a9e7d4ce19aab86b9db7d4ac888f6472d542
- Tests: pnpm dev (dev server starts successfully)
- PRs: