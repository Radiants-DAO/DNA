# fn-9.5 Archive Sunset Features

## Description
Create archive folder and move sunset feature specs.

**Actions:**
- Create `docs/archive/` folder
- Move fn-11 (Git Integration) spec to archive
- Move any direct-write related specs to archive
- Update fn-11 status to 'archived' in .flow/
- Add README to archive explaining why these features are sunset
## Acceptance
- [ ] `docs/archive/` folder created
- [ ] fn-11 spec moved to `docs/archive/fn-11-git-integration.md`
- [ ] fn-11 status updated to 'archived' in .flow/epics/fn-11.json
- [ ] Archive README explains sunset reason (LLMs handle git, context engineering focus)
## Done summary
Archived sunset features:

1. **Created `docs/archive/` folder**
2. **Archived fn-11 (Git Integration)**
   - Created `docs/archive/fn-11-git-integration.md` with archive note and original content
   - Updated `.flow/epics/fn-11.json` status to "archived"
3. **Created `docs/archive/README.md`** explaining the context engineering pivot
## Evidence
- Commits:
- Tests:
- PRs: