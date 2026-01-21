# fn-3-y8e.19 ContextMenu: schema + token refactor

## Description
Add three-file pattern and refactor tokens for ContextMenu component.

1. Create `ContextMenu.schema.json` with:
   - props, variants, examples
   - **subcomponents** array: [ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator]
2. Create `ContextMenu.dna.json` with token bindings
3. Refactor className props from brand tokens to semantic tokens
   - Use Tailwind opacity modifiers: `text-content-primary/70`

Reference: Button.schema.json, Card.dna.json
## Acceptance
- [ ] ContextMenu.schema.json created with subcomponents array
- [ ] ContextMenu.dna.json created with token bindings
- [ ] No brand tokens in className props
- [ ] Component renders in light mode
- [ ] Component renders in dark mode
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
