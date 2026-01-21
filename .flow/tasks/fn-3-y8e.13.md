# fn-3-y8e.13 Select: schema + token refactor

## Description
Add three-file pattern and refactor tokens for Select component.

1. Create `Select.schema.json` with props, variants, examples
2. Create `Select.dna.json` with token bindings
3. Refactor className props from brand tokens to semantic tokens

Reference existing patterns: Button.schema.json, Button.dna.json
## Acceptance
- [ ] Select.schema.json created with valid structure
- [ ] Select.dna.json created with token bindings
- [ ] No brand tokens in className props (use semantic)
- [ ] Component renders in light mode
- [ ] Component renders in dark mode
## Done summary
Added Select.schema.json and Select.dna.json files, refactored Select.tsx from brand tokens (bg-warm-cloud, text-black, border-black, bg-sun-yellow, border-error) to semantic tokens (bg-surface-primary, text-content-primary, border-edge-primary, bg-action-primary, border-status-error).
## Evidence
- Commits: 0ba90ebb328502e336a626ecfbb61646e6065e69
- Tests: grep check for brand tokens
- PRs: