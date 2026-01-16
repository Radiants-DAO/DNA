# fn-7.11 Spacing Section - Chrome DevTools-style box model

## Description
Implement a Chrome DevTools-style box model visualization for the Spacing section in the Designer Panel. The box model shows nested margin and padding areas with clickable values that can be edited individually or linked together.

## Acceptance
- [x] Chrome DevTools-style nested box model visualization
- [x] Click to edit individual margin/padding sides
- [x] Linked/unlinked toggle for uniform values
- [x] Token picker with common spacing values (0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64)
- [x] Custom value input support
- [x] Gap control for flex/grid layouts
- [x] Visual feedback for active editing state
- [x] Color-coded margin (orange) and padding (green) areas

## Done summary
Enhanced the SpacingSection component in RightPanel.tsx with a full Chrome DevTools-style box model. Features include:
- Nested visual representation with margin (orange) and padding (green) layers
- Clickable values on all four sides for both margin and padding
- Link/unlink toggles to sync all sides or edit individually
- Token picker popup with common spacing values
- Custom value input with Enter key support
- Gap control for flex/grid layouts

## Evidence
- Commits: feat: Implement Spacing Section with Chrome DevTools-style box model (fn-7.11)
- Tests: Build passes (pnpm run build)
- PRs:
