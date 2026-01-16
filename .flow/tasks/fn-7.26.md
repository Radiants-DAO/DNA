# fn-7.26 Layers Panel Keyboard Navigation - Arrow keys for tree navigation

## Description
Add arrow key navigation to Layers panel tree for efficient keyboard-driven workflow.
Reference: Webflow Navigator, VS Code Explorer, macOS Finder list view.

**Behavior:**
- **Left arrow**: Collapse current node (if expanded) OR move to parent
- **Right arrow**: Expand current node (if collapsed) OR move to first child
- **Up arrow**: Move to previous visible sibling or parent
- **Down arrow**: Move to next visible sibling or first child
- **Enter**: Select/focus the current node in preview

**Implementation:**
- Panel needs `tabIndex` to receive keyboard focus
- Track "focused" node separately from "selected" node
- Visual focus ring/highlight on keyboard-focused node
- Arrow keys only work when Layers panel has focus

## Acceptance
- [ ] Arrow keys navigate tree when Layers panel has focus
- [ ] Left/Right expand/collapse nodes appropriately
- [ ] Up/Down navigate through visible nodes in tree order
- [ ] Visual focus indicator shows current keyboard position
- [ ] Enter key selects the focused node
- [ ] Focus doesn't jump unexpectedly when tree structure changes

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
