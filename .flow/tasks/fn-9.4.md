# fn-9.4 Remove Direct-Write UI Code

## Description
Remove all direct-write UI code from the React frontend.

**Changes:**
- Remove `directWriteMode` state and toggles from stores
- Remove Save/Write buttons (replace with Copy where appropriate)
- Remove fn-7.19 (Clipboard Mode) and fn-7.20 (Direct-Edit Mode) references
- Clean up any related store state
- Update any components that reference direct write functionality
## Acceptance
- [ ] No `directWriteMode` state in any store
- [ ] No Save/Write buttons in UI
- [ ] fn-7.19 and fn-7.20 removed from scope/task tracking
- [ ] `grep -r "directWriteMode" src/` returns nothing
- [ ] App builds without errors
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
