# fn-7.6 Layers Panel - Full page DOM tree with collapsible sections

## Description
Enhanced Layers Panel content in the left panel with a full-page DOM tree structure (Webflow Navigator style), collapsible sections, additional node types, and visibility toggles.

## Acceptance
- [x] Full page DOM tree starting from Body element
- [x] Semantic page sections (nav, hero, features, testimonials, pricing, CTA, footer)
- [x] Component highlighting in green (following Webflow convention)
- [x] Symbol/Global Styles type support with distinct icon
- [x] Additional node types: section, link, button, form, input, symbol
- [x] Collapsible sections with "Expand All" / "Collapse All" controls
- [x] Visibility toggle (eye icon) on hover for each node
- [x] Selection highlighting with blue background
- [x] Chevron expand/collapse indicators
- [x] Footer showing currently selected element
- [x] TypeScript compiles without errors
- [x] Vite build succeeds

## Done summary
Implemented comprehensive Layers Panel with full page DOM tree and collapsible sections (Webflow Navigator style).

Key changes:
1. Full page DOM tree structure with 7 semantic sections (nav, hero, features, testimonials, pricing, CTA, footer)
2. Extended node types: div, component, symbol, text, image, link, button, form, input, section
3. New icons for each node type (section, link, button, form, input, symbol, eye toggle)
4. Section-level collapse controls ("Expand All" / "Collapse All" buttons)
5. Per-node visibility toggle appearing on hover
6. Component and symbol nodes highlighted in green
7. Section nodes with medium font weight for hierarchy
8. Hidden nodes shown with reduced opacity (40%)
9. Selection state footer showing currently selected element

Files modified:
- src/components/layout/LeftPanel.tsx
## Evidence
- Commits:
- Tests: TypeScript compiles, Vite build succeeds
- PRs: