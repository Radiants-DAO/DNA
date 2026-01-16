# fn-7.10 Layout Section - Display tabs (Block/Flex/Grid/None), alignment controls

## Description
Implement the Layout section in the Designer Panel (RightPanel) with display type tabs, flex controls, grid controls, and alignment controls.

## Acceptance
- [x] Display tabs (Block/Flex/Grid/None) switch display mode
- [x] Flex mode shows direction controls (row/column/row-reverse/column-reverse)
- [x] Flex mode shows wrap controls (nowrap/wrap/wrap-reverse)
- [x] 9-point alignment grid for visual align-items + justify-content selection
- [x] Align items and justify content dropdowns for precise control
- [x] Gap preset buttons for common spacing values
- [x] Grid mode shows columns presets (1/2/3/4/6/12)
- [x] Grid mode shows rows presets (auto/1/2/3/4)
- [x] Grid mode includes gap and place-items controls
- [x] Block and None modes show informational text

## Done summary
## Summary
- Enhanced LayoutSection component in RightPanel with full display type controls
- Added display tabs: Block, Flex, Grid, None with proper state management
- Flex mode: direction arrows, wrap toggle, 9-point alignment grid, gap presets
- Grid mode: columns/rows presets, gap presets, place-items alignment grid
- 9-point alignment grid maps to align-items + justify-content for visual editing

## Why
Provides visual CSS layout property editing within the Designer Panel collapsible sections.

## Verification
pnpm vite build succeeded (77 modules transformed)
## Evidence
- Commits:
- Tests: pnpm vite build
- PRs: