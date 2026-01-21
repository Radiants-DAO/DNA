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
Added three-file pattern for Popover component: created Popover.schema.json with subcomponents array [PopoverTrigger, PopoverContent], created Popover.dna.json with token bindings, and refactored className props from brand tokens (bg-warm-cloud, border-black) to semantic tokens (bg-surface-primary, border-edge-primary).
## Evidence
- Commits: 1ee7fbba6a3fae80a886bbd644fd5760a680d1cd
- Tests: pnpm build (Next.js 16 build passed)
- PRs: