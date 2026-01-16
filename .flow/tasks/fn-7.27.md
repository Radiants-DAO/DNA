# fn-7.27 Resizable Panel Dividers - Drag handles for left and right panels

## Description
Both left and right panels should be resizable via drag handles.
Reference: VS Code sidebar resize, Figma panel resize.

**Behavior:**
- Vertical divider between left panel and center preview
- Vertical divider between center preview and right panel
- Drag to resize panels
- Double-click to reset to default width
- Minimum/maximum constraints prevent panels from disappearing
- Cursor changes to `col-resize` on hover

**Constraints:**
- Left panel: min 200px, max 400px, default 312px (56px rail + 256px content)
- Right panel: min 280px, max 500px, default 320px
- Center preview: remaining space (min ~400px)

**State:**
- Store panel widths in Zustand (persist across sessions optional)
- Respect collapsed state (collapsed panel = rail only for left, hidden for right)

## Acceptance
- [ ] Left panel resizable via drag handle
- [ ] Right panel resizable via drag handle
- [ ] Dividers show `col-resize` cursor on hover
- [ ] Double-click resets to default width
- [ ] Min/max constraints enforced
- [ ] Resize state persists during session
- [ ] Smooth drag experience (no jitter)

## Done summary
Implemented - merged from fn-7 branch
## Evidence
- Commits:
- Tests:
- PRs: