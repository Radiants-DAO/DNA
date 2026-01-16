# fn-7.9 Designer Panel Shell - Collapsible sections, icon rail collapse

## Description
Implement the Designer Panel (right panel) shell with collapsible sections, icon rail collapse functionality, and mode toggle (Clipboard/Direct-Edit). This provides the foundation for the property editor sections that will be implemented in subsequent tasks.

## Acceptance
- [x] Right panel has collapsible sections with smooth transitions
- [x] Sections can be expanded/collapsed individually via header click
- [x] Expand All / Collapse All controls available
- [x] Panel collapses to icon rail showing section icons
- [x] Clicking icon rail button expands panel and scrolls to that section
- [x] Mode toggle (Clipboard/Direct-Edit) in panel header
- [x] State selector for hover/focus/active states
- [x] Breadcrumb navigation showing element path
- [x] CSS output preview at bottom of panel
- [x] Mode-aware footer (Copy CSS vs Save/Discard buttons)
- [x] Context-aware default sections (Layout, Spacing, Colors open by default)

## Done summary
- Implemented centralized section state management with expand/collapse functionality
- Added icon rail collapse pattern with scroll-to-section navigation
- Added mode toggle (Clipboard/Direct-Edit) in header and collapsed rail
- Added Expand All / Collapse All controls for section management
- Why: Provides the foundation shell for the Designer Panel property sections
- Verification: pnpm vite build succeeded, TypeScript compilation passed
## Evidence
- Commits: 5f17244b10bfdded11e24d5a0f0364a51f2743c8
- Tests: pnpm vite build
- PRs: