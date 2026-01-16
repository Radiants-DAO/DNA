# fn-9.9 Hook Editors to Accumulator

## Description
Connect existing editor panels to the accumulator store.

**Editors to hook:**
- Variables panel → accumulates token changes
- Typography panel → accumulates text style changes
- Property panels → accumulates component style changes

**Each edit captures:**
- What changed (property name)
- Old value
- New value
- Context (DOM path, component name, element snippet)

**Integration:** Find where editors handle value changes and call addEdit with full context.
## Acceptance
- [ ] Variables panel edits appear in accumulator
- [ ] Typography panel edits appear in accumulator
- [ ] Property panel edits appear in accumulator
- [ ] Each edit has correct type ('token', 'typography', 'style')
- [ ] Context includes relevant metadata (file, selector, etc.)
- [ ] Old and new values captured correctly
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
