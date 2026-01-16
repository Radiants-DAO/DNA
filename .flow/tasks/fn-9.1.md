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
Comprehensive audit completed. Created `.flow/tasks/fn-9.1-checklist.md` documenting:

- **8 UI components** with ~70 directWriteMode references
- **3 store/type files** with ~15 references
- **3 doc files** with ~20 "git is save" references  
- **2 Rust files** with 4 write command registrations

All items have file paths, line numbers, and removal actions specified.
## Evidence
- Commits:
- Tests:
- PRs: