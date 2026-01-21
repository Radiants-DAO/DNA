# fn-3-y8e.26 Sheet: schema + token refactor

## Description
Add three-file pattern and refactor tokens for Sheet component.

1. Create `Sheet.schema.json` with:
   - props, variants, examples
   - **subcomponents** array: [SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose]
2. Create `Sheet.dna.json` with token bindings
3. Refactor className props from brand tokens to semantic tokens
   - Use Tailwind opacity modifiers: `text-content-primary/70`

Reference: Button.schema.json, Card.dna.json
## Acceptance
- [ ] Sheet.schema.json created with subcomponents array
- [ ] Sheet.dna.json created with token bindings
- [ ] No brand tokens in className props
- [ ] Component renders in light mode
- [ ] Component renders in dark mode
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
