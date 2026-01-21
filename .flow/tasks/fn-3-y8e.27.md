# fn-3-y8e.27 DropdownMenu: schema + token refactor

## Description
Add three-file pattern and refactor tokens for DropdownMenu component.

1. Create `DropdownMenu.schema.json` with:
   - props, variants, examples
   - **subcomponents** array: [DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel]
2. Create `DropdownMenu.dna.json` with token bindings
3. Refactor className props from brand tokens to semantic tokens
   - Use Tailwind opacity modifiers: `text-content-primary/70`

Reference: Button.schema.json, Card.dna.json
## Acceptance
- [ ] DropdownMenu.schema.json created with subcomponents array
- [ ] DropdownMenu.dna.json created with token bindings
- [ ] No brand tokens in className props
- [ ] Component renders in light mode
- [ ] Component renders in dark mode
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
