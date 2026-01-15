# fn-2.10 Property Panels - Typography, Spacing, Layout

## Description

Implement Typography, Spacing, and Layout property panels following the same pattern as Colors.

## Technical Details

1. **Typography panel**
   - Font family (from tokens)
   - Font size (from scale)
   - Font weight
   - Line height
   - Letter spacing
   - Text alignment

2. **Spacing panel**
   - Padding (all sides, individual)
   - Margin (all sides, individual)
   - Gap (for flex/grid)
   - Visual spacing diagram

3. **Layout panel**
   - Display (flex, grid, block)
   - Flex: direction, wrap, align, justify
   - Grid: columns, rows, gap
   - Visual preview of layout

4. **Shared patterns**
   - Token picker for all values
   - Spacing scale tokens
   - Same output mode toggle
   - Reuse panel component structure from Colors

## References

- Feature spec: `/docs/features/06-tools-and-modes.md:236-267`
- Webflow panels: `/webflow-panels/design-panels/typography.png`, `spacing/`, `layout/`
## Acceptance
- [ ] Typography panel with all font properties
- [ ] Spacing panel with padding/margin/gap controls
- [ ] Layout panel with flex/grid options
- [ ] All panels use token pickers
- [ ] Visual spacing diagram shows current values
- [ ] Changes output correctly to clipboard/file
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
