# fn-7.5 Assets Panel - Port AssetsTab with click-to-copy

## Description
TBD

## Acceptance
- [ ] TBD

## Done summary
- Created AssetsPanel component with Icons, Logos, Images sub-tabs
- Implemented click-to-copy functionality that copies asset names to clipboard  
- Added icon size selector (16/20/24/32) for the Icons tab
- Included search/filter across all asset types

Why:
- Ported AssetsTab from original radflow/devtools to the narrower left panel context
- Follows same patterns as ComponentsPanel and VariablesPanel

Verification:
- TypeScript check: npx tsc --noEmit (no errors)
- Rust tests: cargo test (11 passed)
## Evidence
- Commits: f0f5f454d5058591d0c3bd35a3f5f83e3ff4a4b1
- Tests: npx tsc --noEmit, cargo test
- PRs: