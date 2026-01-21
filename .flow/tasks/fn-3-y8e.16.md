# fn-3-y8e.16 Toast: schema + token refactor

## Description
Add three-file pattern and refactor tokens for Toast component.

1. Create `Toast.schema.json` with:
   - props, variants, examples
   - **subcomponents** array: [ToastProvider, useToast]
2. Create `Toast.dna.json` with token bindings
3. Refactor className props from brand tokens to semantic tokens
   - Use Tailwind opacity modifiers: `text-content-primary/70`

Reference: Button.schema.json, Card.dna.json
## Acceptance
- [ ] Toast.schema.json created with subcomponents array
- [ ] Toast.dna.json created with token bindings
- [ ] No brand tokens in className props
- [ ] Component renders in light mode
- [ ] Component renders in dark mode
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
