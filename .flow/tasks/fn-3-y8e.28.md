# fn-3-y8e.28 Tabs: schema + token refactor

## Description
Add three-file pattern and refactor tokens for Tabs component.

1. Create `Tabs.schema.json` with:
   - props, variants, examples
   - **subcomponents** array: [TabsList, TabsTrigger, TabsContent]
2. Create `Tabs.dna.json` with token bindings
3. Refactor className props from brand tokens to semantic tokens
   - Use Tailwind opacity modifiers: `text-content-primary/70`

Reference: Button.schema.json, Card.dna.json
## Acceptance
- [ ] Tabs.schema.json created with subcomponents array
- [ ] Tabs.dna.json created with token bindings
- [ ] No brand tokens in className props
- [ ] Component renders in light mode
- [ ] Component renders in dark mode
## Done summary
Added Tabs.schema.json with subcomponents array [TabsList, TabsTrigger, TabsContent] and Tabs.dna.json with token bindings. Refactored all className props from brand tokens (text-black, bg-sun-yellow, bg-warm-cloud, border-black) to semantic tokens (text-content-primary, bg-action-primary, bg-surface-primary, border-edge-primary).
## Evidence
- Commits: 1ee7fbba6a3fae80a886bbd644fd5760a680d1cd
- Tests: pnpm dev (verified server starts), grep check for brand tokens
- PRs: