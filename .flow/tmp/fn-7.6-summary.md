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
