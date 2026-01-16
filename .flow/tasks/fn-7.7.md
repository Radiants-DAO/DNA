# fn-7.7 Preview Canvas - Live React component rendering with variant grid

## Description
Center area of RadFlow showing the target project via iframe. Uses fn-5's iframe shell
to load the target project's dev server.

**Implementation:**
- Embed fn-5's iframe component in center preview area
- Add variant grid view for showing all prop variations
- Component grid overview when nothing selected (Storybook-style)
- Theme breakpoint selector controls iframe width

**Dependency on fn-5:**
- Uses fn-5.1's iframe shell to render target project
- Preview is NOT RadFlow's own React - it's the target project in iframe

## Acceptance
- [ ] Target project renders in center preview area via iframe
- [ ] Variant grid shows all prop variations
- [ ] Component grid overview when nothing selected
- [ ] Breakpoint selector resizes iframe width
- [ ] Auto-refresh when files change externally

## Done summary
Implemented - merged from fn-7 branch
## Evidence
- Commits:
- Tests:
- PRs: