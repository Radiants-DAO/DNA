# fn-3-y8e.24 Dialog: schema + token refactor

## Description
Add three-file pattern and refactor tokens for Dialog component.

1. Create `Dialog.schema.json` with:
   - props, variants, examples
   - **subcomponents** array: [DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose]
2. Create `Dialog.dna.json` with token bindings
3. Refactor className props from brand tokens to semantic tokens
   - Use Tailwind opacity modifiers: `text-content-primary/70`

Reference: Button.schema.json, Card.dna.json
## Acceptance
- [ ] Dialog.schema.json created with subcomponents array
- [ ] Dialog.dna.json created with token bindings
- [ ] No brand tokens in className props
- [ ] Component renders in light mode
- [ ] Component renders in dark mode
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
