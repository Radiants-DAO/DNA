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
## Summary

Implemented file watcher integration for live updates when source files change.

### Changes Made

**Rust Backend (src-tauri/):**
- Added 100ms debounce to watcher config in `watcher.rs`
- Watcher already had extension filtering for .css and .tsx files
- Events emitted via Tauri's "file-changed" event system

**Frontend (src/):**
- Created `WatcherSlice` in stores for watcher state management
- Created `useFileWatcher` hook that:
  - Starts watcher when project opens
  - Stops watcher when project closes
  - Subscribes to Tauri file-changed events
  - Routes events to appropriate refresh actions
- Created `WatcherStatus` component showing:
  - Green pulsing indicator when watcher is active
  - Brief notification when files change
- Integrated watcher into App.tsx

### Implementation Notes

- CSS changes trigger token refresh via `loadTokens()`
- TSX changes trigger component rescan via `scanComponents()` and violation rescan via `scanViolations()`
- Incremental updates - only re-parses the changed file
- No jarring full-page refresh - UI updates smoothly
## Evidence
- Commits:
- Tests: rust, typescript
- PRs: