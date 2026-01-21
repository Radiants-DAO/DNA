# fn-3-y8e.17 Accordion: schema + token refactor

## Description
Add three-file pattern and refactor tokens for Accordion component.

1. Create `Accordion.schema.json` with:
   - props, variants, examples
   - **subcomponents** array: [AccordionItem, AccordionTrigger, AccordionContent]
2. Create `Accordion.dna.json` with token bindings
3. Refactor className props from brand tokens to semantic tokens
   - Use Tailwind opacity modifiers: `text-content-primary/70`

Reference: Button.schema.json, Card.dna.json
## Acceptance
- [ ] Accordion.schema.json created with subcomponents array
- [ ] Accordion.dna.json created with token bindings
- [ ] No brand tokens in className props
- [ ] Component renders in light mode
- [ ] Component renders in dark mode
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
