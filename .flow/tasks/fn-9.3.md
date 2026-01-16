# fn-9.3 Update Feature Specs

## Description
Update feature specs in `docs/features/` to remove direct-write references and add context output sections.

**Files to update:**
- `01-variables-editor.md`: Remove "Save Action", "Direct write mode"
- `02-typography-editor.md`: Remove direct write references
- `06-tools-and-modes.md`: Remove "Direct-Edit Mode" section
- `07-search-and-navigation.md`: Remove git-related shortcuts

**Additions:**
- Add "Context Output" sections to relevant specs explaining how edits become prompts
## Acceptance
- [ ] 01-variables-editor.md updated (no Save Action, no Direct write)
- [ ] 02-typography-editor.md updated (no direct write refs)
- [ ] 06-tools-and-modes.md updated (no Direct-Edit Mode)
- [ ] 07-search-and-navigation.md updated (no git shortcuts)
- [ ] Context Output sections added where appropriate
## Done summary
Updated feature specs to remove direct-write references and add context output sections:

**07-search-and-navigation.md:**
- Changed key principle from "Git is save" to context engineering
- Replaced "Git as Save" section with "Context Output" section
- Updated keyboard shortcuts (Cmd+C for copy, removed Cmd+S commit)
- Updated Research Notes to reference context output instead of git
- Updated Rust backend section (removed git2, added clipboard)

**01-variables-editor.md:**
- Renamed "Persistence" section to "Edit Accumulation"
- Changed "Save Action" to "Copy Action" with prompt export
- Updated inline editing to use "apply" instead of "commit"
- Updated batch operations for prompt output

**02-typography-editor.md:**
- Changed "Persistence" to "Edit Accumulation"
- Updated "Where Styles Save" to "Context Output Format"
- Updated on-page editing to accumulate changes

**06-tools-and-modes.md:**
- Removed "Toggle Mode (Direct Write)" from Text Edit Mode
- Updated output options to accumulation-only
- Updated undo references for accumulated edits
## Evidence
- Commits:
- Tests:
- PRs: