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
- [ ] T key toggles Text Edit mode
- [ ] Text elements become editable
- [ ] Changes tracked in store
- [ ] Escape exits with changes preserved
- [ ] Clipboard contains all accumulated changes
- [ ] Rich text (bold, italic) supported
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
