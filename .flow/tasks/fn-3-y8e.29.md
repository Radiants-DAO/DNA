# fn-3-y8e.29 Final verification and smoke test

## Description
Final verification that all spec compliance work is complete.

1. Run pnpm install
2. Start dev server: `cd packages/radiants/apps/rad_os && pnpm dev`
3. Test all components in light mode
4. Toggle to dark mode, test all components
5. Verify all schema files exist
6. Verify all dna files exist
7. Check no brand tokens remain in component classNames
## Acceptance
- [ ] pnpm install succeeds
- [ ] Dev server starts without errors
- [ ] All components render in light mode
- [ ] All components render in dark mode
- [ ] 25 .schema.json files exist
- [ ] 25 .dna.json files exist
- [ ] No TypeScript errors
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
