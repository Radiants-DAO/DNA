# fn-3-y8e.7 Badge: schema + token refactor

## Description
Add three-file pattern and refactor tokens for Badge component.

1. Create `Badge.schema.json` with props, variants, examples
2. Create `Badge.dna.json` with token bindings
3. Refactor className props from brand tokens to semantic tokens

Reference existing patterns: Button.schema.json, Button.dna.json
## Acceptance
- [ ] Badge.schema.json created with valid structure
- [ ] Badge.dna.json created with token bindings
- [ ] No brand tokens in className props (use semantic)
- [ ] Component renders in light mode
- [ ] Component renders in dark mode
## Done summary
Added Badge.schema.json and Badge.dna.json following the three-file pattern. Refactored Badge.tsx to use semantic tokens (surface-primary, content-primary, edge-primary, status-*) instead of brand tokens (warm-cloud, black, green, sun-yellow, error-red, sky-blue).
## Evidence
- Commits: f75e8caf2e30f5a797c2b09f4d5a0b7424511ad7
- Tests: pnpm --filter @dna/radiants/../rad_os tsc --noEmit
- PRs: