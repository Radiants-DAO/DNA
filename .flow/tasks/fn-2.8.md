# fn-2.8 Text Edit Mode - direct file write toggle

## Description

Add direct file write toggle to Text Edit Mode with undo support.

## Technical Details

1. **Toggle UI**
   - Toggle switch in toolbar: "Clipboard" vs "Direct Write"
   - Visual indicator of current mode
   - Persist preference

2. **Direct write mode**
   - Changes write directly to source files via Tauri command
   - `write_text_change(path, line, old_text, new_text)`
   - Immediate file update

3. **Undo system**
   - Full Cmd+Z undo history
   - Store undo stack in memory
   - Each change is undoable
   - Cmd+Shift+Z for redo

4. **Conflict handling**
   - Check file modified time before write
   - If file changed externally, show warning
   - Options: Overwrite / Reload / Cancel

5. **Save indicator**
   - Show "Unsaved changes" when in direct write mode
   - Per-file tracking of modified state

## References

- Feature spec: `/docs/features/06-tools-and-modes.md:206-219`
- Undo requirement: `/docs/features/06-tools-and-modes.md:27`
## Acceptance
- [ ] Toggle between clipboard and direct write modes
- [ ] Direct write saves to source file immediately
- [ ] Cmd+Z undoes last text change
- [ ] Cmd+Shift+Z redoes
- [ ] External file change detected and warned
- [ ] Preference persists across sessions
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
