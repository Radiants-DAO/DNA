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
- Added TypographyPanel with font family, size, weight, line height, letter spacing, text alignment
- Added SpacingPanel with visual margin/padding diagram (Webflow-style nested box) and gap control
- Added LayoutPanel with display type (block/flex/grid/none), flex options, grid options, and live preview
- All panels follow ColorsPanel pattern: token pickers, clipboard/direct write toggle, toast notifications

Why:
- Completes property panel implementation for visual design system editing
- Provides Webflow-like editing experience for typography, spacing, and layout properties

Verification:
- pnpm tsc --noEmit passes
- pnpm vite build completes successfully
- cargo check passes
## Evidence
- Commits: 89384b71883cfa52c5d57abb9f3574576afb191c
- Tests: pnpm tsc --noEmit, pnpm vite build, cargo check
- PRs: