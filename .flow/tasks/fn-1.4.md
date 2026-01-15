# fn-1.4 POC: notify file watching

## Description

Test notify crate for file system watching. Needed for live reload when theme files change externally.

### Scenarios to Test
1. Watch single file for changes
2. Watch directory recursively
3. Filter events (only .css, .tsx files)
4. Debounce rapid changes
5. Handle file creation/deletion

### Watch Targets
- `packages/theme-*/tokens.css`
- `packages/theme-*/components/**/*.tsx`
- `packages/theme-*/*.css`

## Acceptance

- [ ] Create Rust POC project at `research/pocs/notify-poc/`
- [ ] Watch a directory recursively
- [ ] Detect file modifications
- [ ] Detect file creation
- [ ] Detect file deletion
- [ ] Filter to only .css and .tsx files
- [ ] Implement debouncing (100ms)
- [ ] Send events via channel for async handling

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
