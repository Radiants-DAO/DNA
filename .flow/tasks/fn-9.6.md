# fn-9.6 Remove Rust Write Commands

## Description
Audit and remove/disable Rust write commands in the Tauri backend.

**Actions:**
- Audit `src-tauri/src/commands/` for write commands
- Remove or comment out `file_write.rs` usage
- Keep read/parse commands (still needed for browsing)
- Update command registrations in `lib.rs`

**Note:** Keep all read functionality intact - RadFlow still needs to parse and display design systems.
## Acceptance
- [ ] Write commands identified and documented
- [ ] Write commands removed or disabled
- [ ] Read/parse commands still functional
- [ ] `lib.rs` command registrations updated
- [ ] Rust builds without errors
- [ ] App can still load and display design system files
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
