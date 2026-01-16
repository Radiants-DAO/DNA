# fn-9.11 Copy UX

## Description
Implement copy functionality for the accumulator output.

**Primary action:** "Copy Prompt" button in accumulator panel

**Keyboard shortcuts:**
- Cmd+C (when accumulator focused) = smart default (prompt format)
- Cmd+Shift+C = full prompt with extra context

**Feedback:**
- Visual feedback on copy (toast notification or animation)
- Button state change on success

**Integration:** Use Tauri clipboard API or browser clipboard API
## Acceptance
- [ ] "Copy Prompt" button in accumulator panel
- [ ] Clicking button copies formatted output to clipboard
- [ ] Cmd+C works when accumulator is focused
- [ ] Cmd+Shift+C copies with extra context
- [ ] Visual feedback shows on successful copy
- [ ] Format can be selected (prompt/code/diff)
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
