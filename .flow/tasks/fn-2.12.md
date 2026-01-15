# fn-2.12 File watcher integration and live updates

## Description

Integrate file watcher for live updates when source files change.

## Technical Details

1. **Watcher setup**
   - Use notify crate (from POC)
   - Watch project directory recursively
   - Filter: .css, .tsx files only
   - 100ms debounce

2. **Event handling**
   - File modified → re-parse that file
   - Update component index incrementally
   - Update token index if CSS changed

3. **Tauri events**
   - Emit events from Rust to frontend
   - `file-changed` event with path
   - Frontend subscribes and updates state

4. **UI updates**
   - Component pills update if line numbers change
   - Token pickers refresh if tokens change
   - No jarring full-page refresh

5. **Performance**
   - Incremental updates only
   - Don't re-parse unchanged files
   - Cache parsed results

## References

- notify POC: `/research/pocs/notify-poc/src/lib.rs`
- Feature spec: `/docs/features/06-tools-and-modes.md:163-169`
## Acceptance
- [ ] File watcher running when project open
- [ ] CSS changes trigger token refresh
- [ ] TSX changes trigger component index update
- [ ] Frontend receives file-changed events
- [ ] UI updates without full refresh
- [ ] 100ms debounce prevents rapid re-parsing
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
