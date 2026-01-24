# fn-3-y8e.5 Update package.json exports

## Description
Update `packages/radiants/package.json` exports to add missing paths:
- `"./typography": "./typography.css"`
- `"./fonts": "./fonts.css"`
## Acceptance
- [ ] ./typography export added
- [ ] ./fonts export added
- [ ] Exports work: `import '@dna/radiants/typography'`
## Done summary
Added ./typography and ./fonts exports to @dna/radiants package.json, enabling imports like `import '@dna/radiants/typography'`.
## Evidence
- Commits: 6082b0734528af88e13b713777808b9b426ae157
- Tests: pnpm --filter @dna/rad-os exec -- node -e "require.resolve('@dna/radiants/typography'); require.resolve('@dna/radiants/fonts');"
- PRs: