# fn-2.7 Text Edit Mode - contentEditable with clipboard

## Description

Implement Text Edit Mode with contentEditable and clipboard accumulation.

## Technical Details

1. **Mode activation**
   - T key toggles Text Edit mode
   - Mode indicator in toolbar
   - Text elements become editable

2. **Rich text editing**
   - contentEditable on text elements
   - Support: Bold, italic, headings, lists
   - Consider TipTap integration (evaluate vs raw contentEditable)

3. **Change tracking**
   - Track all text changes during session
   - Store original value, new value, element location
   - Accumulate changes in store

4. **Clipboard accumulation**
   - Each text edit creates clipboard entry
   - On exit, all changes available
   - Format for LLM consumption:
     ```
     Text change @ app/page.tsx:47
     Old: "Welcome to our app"
     New: "Welcome to RadFlow"
     ```

5. **Exit behavior**
   - Escape exits mode
   - Changes remain in clipboard buffer
   - Toast shows change count

## References

- Feature spec: `/docs/features/06-tools-and-modes.md:185-220`
- Current implementation: TextEditMode.tsx, TextEditOverlay.tsx
## Acceptance
- [x] T key toggles Text Edit mode
- [x] Text elements become editable
- [x] Changes tracked in store
- [x] Escape exits with changes preserved
- [x] Clipboard contains all accumulated changes
- [x] Rich text (bold, italic) supported
## Done summary
Implemented Text Edit Mode with contentEditable and clipboard accumulation.

**New component**: `src/components/TextEditMode.tsx` (~350 lines)
- T key toggles mode via keyboard shortcuts
- Purple mode indicator with Direct Write toggle
- Pending edits counter in top-right
- Click text elements to edit with contentEditable
- Rich text: Cmd+B (bold), Cmd+I (italic), Cmd+U (underline)
- Formatting toolbar on active edit

**Change tracking**: Uses existing textEditSlice.addPendingEdit()
- Format: `// ComponentName @ file.tsx:line\n- "old"\n+ "new"`

**Exit behavior**: Escape copies all edits to clipboard, shows toast with count

**Updates**:
- `src/components/index.ts`: Export TextEditMode
- `src/App.tsx`: Add TextEditMode overlay
- `src/hooks/useKeyboardShortcuts.ts`: Defer Escape to TextEditMode when active
## Evidence
- Commits:
- Tests: typescript, build
- PRs: