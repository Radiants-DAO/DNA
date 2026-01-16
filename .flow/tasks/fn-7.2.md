# fn-7.2 Left Panel Icon Rail - Port existing LeftRail, add Layers section

## Description
Enhanced Left Panel with icon rail navigation pattern ported from radflow/devtools LeftRail component, featuring four sections (Variables, Components, Assets, Layers) with keyboard shortcuts (1-4), panel collapse functionality, and a Webflow-style Layers panel with collapsible DOM tree.

## Acceptance
- [x] Icon rail with 4 sections (Variables, Components, Assets, Layers)
- [x] Keyboard shortcuts 1-4 for section switching (without modifier keys)
- [x] Panel collapse/expand functionality (click active section to collapse)
- [x] Collapse button in panel header
- [x] Variables section with color swatches and spacing tokens
- [x] Components section with category grouping
- [x] Assets section with click-to-copy asset names
- [x] Layers section with Webflow-style collapsible DOM tree
- [x] Component nodes highlighted in green (matching Webflow convention)
- [x] Selection highlighting for layer nodes
- [x] Chevron expand/collapse for tree nodes
- [x] Settings button placeholder at bottom of icon rail
- [x] TypeScript compiles without errors
- [x] Vite build succeeds

## Done summary
Implemented enhanced LeftPanel component with:
1. Icon rail navigation (48px wide, 36x36px buttons)
2. Four sections with dedicated icons and keyboard shortcuts (1-4)
3. Panel collapse to icon-rail-only state
4. Webflow-style Layers panel with recursive tree rendering
5. Component type distinction (green highlighting)
6. Click-to-expand tree nodes with chevron indicators
## Evidence
- Commits:
- Tests:
- PRs: