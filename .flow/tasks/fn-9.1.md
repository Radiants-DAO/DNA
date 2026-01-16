# fn-9.1 Audit & Document Direct-Write References

## Description
Search all code for direct-write patterns and create a comprehensive removal checklist.

**Search targets:**
- `grep -r "directWrite" src/`
- `grep -r "git.*save" docs/`
- `grep -r "update_token" src-tauri/`
- `grep -r "Cmd+S commits" docs/`

**Output:** Cleanup checklist documenting every file/location that references direct-write functionality.
## Acceptance
- [ ] All `directWrite` references in src/ documented
- [ ] All "git is save" references in docs/ documented
- [ ] All Rust write commands in src-tauri/ documented
- [ ] Cleanup checklist created at .flow/tasks/fn-9.1-checklist.md
- [ ] Each item has file path, line number, and removal notes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
