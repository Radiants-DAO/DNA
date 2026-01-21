# fn-3-y8e.23 MockStatesPopover: schema + token refactor

## Description
Add three-file pattern and refactor tokens for MockStatesPopover component.

1. Create `MockStatesPopover.schema.json` with:
   - props, variants, examples
   - **subcomponents** array: [MockStatesPopoverTrigger, MockStatesPopoverContent]
2. Create `MockStatesPopover.dna.json` with token bindings
3. Refactor className props from brand tokens to semantic tokens
   - Use Tailwind opacity modifiers: `text-content-primary/70`

Reference: Button.schema.json, Card.dna.json
## Acceptance
- [ ] MockStatesPopover.schema.json created with subcomponents array
- [ ] MockStatesPopover.dna.json created with token bindings
- [ ] No brand tokens in className props
- [ ] Component renders in light mode
- [ ] Component renders in dark mode
## Done summary
Created MockStatesPopover.schema.json with subcomponents array and MockStatesPopover.dna.json with token bindings. Component already used semantic tokens - no refactoring needed.
## Evidence
- Commits: ea16a9e7d4ce19aab86b9db7d4ac888f6472d542
- Tests: grep check for brand tokens
- PRs: