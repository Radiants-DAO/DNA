# fn-3-y8e.10 Switch: schema + token refactor

## Description
Add three-file pattern and refactor tokens for Switch component.

1. Create `Switch.schema.json` with props, variants, examples
2. Create `Switch.dna.json` with token bindings
3. Refactor className props from brand tokens to semantic tokens

Reference existing patterns: Button.schema.json, Button.dna.json
## Acceptance
- [ ] Switch.schema.json created with valid structure
- [ ] Switch.dna.json created with token bindings
- [ ] No brand tokens in className props (use semantic)
- [ ] Component renders in light mode
- [ ] Component renders in dark mode
## Done summary
Added Slider.schema.json and Slider.dna.json files, and refactored all className props from brand tokens to semantic tokens (text-content-primary, bg-edge-primary, bg-action-primary, bg-surface-muted, border-edge-primary, ring-edge-focus).
## Evidence
- Commits: f75e8caf2e30f5a797c2b09f4d5a0b7424511ad7
- Tests: grep brand tokens check - passed
- PRs: