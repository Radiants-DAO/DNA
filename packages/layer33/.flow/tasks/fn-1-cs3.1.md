# fn-1-cs3.1 Delete devtools directory

## Description
Delete the entire `/devtools` directory containing 45 files.

## Files to delete
- `devtools/index.ts`
- `devtools/DevToolsPanel.tsx`
- `devtools/DevToolsProvider.tsx`
- `devtools/types/`
- `devtools/hooks/`
- `devtools/store/`
- `devtools/lib/`
- `devtools/components/`
- `devtools/tabs/`

## Command
```bash
rm -rf devtools/
```
## Acceptance
- [ ] `devtools/` directory no longer exists
- [ ] No files remain in the devtools path
## Done summary
Deleted the entire devtools/ directory containing 50 files including DevToolsPanel, DevToolsProvider, store, hooks, components, tabs, types, and lib subdirectories.
## Evidence
- Commits: 8ef16bd3e07f748ac77e412ee339f3845682605a
- Tests: test -d devtools, find devtools -type f | wc -l
- PRs: