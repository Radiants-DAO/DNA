# fn-3-y8e.8 Divider: schema + token refactor

## Description
Add three-file pattern and refactor tokens for Divider component.

1. Create `Divider.schema.json` with props, variants, examples
2. Create `Divider.dna.json` with token bindings
3. Refactor className props from brand tokens to semantic tokens

Reference existing patterns: Button.schema.json, Button.dna.json
## Acceptance
- [ ] Divider.schema.json created with valid structure
- [ ] Divider.dna.json created with token bindings
- [ ] No brand tokens in className props (use semantic)
- [ ] Component renders in light mode
- [ ] Component renders in dark mode
## Done summary
Added three-file pattern for Divider component: created Divider.schema.json with props/variants/examples, Divider.dna.json with token bindings, and refactored component to use semantic tokens (edge-primary/20, action-primary) instead of brand tokens.
## Evidence
- Commits: c80d694826b252ccace689459f90b7de96307248
- Tests: python3 -m json.tool (validated JSON)
- PRs: