# fn-3-y8e.14 Checkbox: schema + token refactor

## Description
Add three-file pattern and refactor tokens for Checkbox component.

1. Create `Checkbox.schema.json` with props, variants, examples
2. Create `Checkbox.dna.json` with token bindings
3. Refactor className props from brand tokens to semantic tokens

Reference existing patterns: Button.schema.json, Button.dna.json
## Acceptance
- [ ] Checkbox.schema.json created with valid structure
- [ ] Checkbox.dna.json created with token bindings
- [ ] No brand tokens in className props (use semantic)
- [ ] Component renders in light mode
- [ ] Component renders in dark mode
## Done summary
Added Checkbox.schema.json and Checkbox.dna.json files with valid structure including subcomponents array for the compound component (Checkbox + Radio). Refactored both Checkbox and Radio components from brand tokens (warm-cloud, sun-yellow, black) to semantic tokens (surface-primary, action-primary, edge-primary, content-primary, edge-focus).
## Evidence
- Commits: 0ba90ebb328502e336a626ecfbb61646e6065e69
- Tests: pnpm dev (dev server smoke test), json parse validation, grep brand token check
- PRs: