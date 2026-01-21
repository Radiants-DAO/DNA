# fn-3-y8e.25 Popover: schema + token refactor

## Description
Add three-file pattern and refactor tokens for Popover component.

1. Create `Popover.schema.json` with:
   - props, variants, examples
   - **subcomponents** array: [PopoverTrigger, PopoverContent]
2. Create `Popover.dna.json` with token bindings
3. Refactor className props from brand tokens to semantic tokens
   - Use Tailwind opacity modifiers: `text-content-primary/70`

Reference: Button.schema.json, Card.dna.json
## Acceptance
- [ ] Popover.schema.json created with subcomponents array
- [ ] Popover.dna.json created with token bindings
- [ ] No brand tokens in className props
- [ ] Component renders in light mode
- [ ] Component renders in dark mode
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
