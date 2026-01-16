# fn-7.20 Direct-Edit Mode - Debounced file writes with CSS custom properties

## Description
Direct-Edit mode writes changes to source files with debouncing. Uses fn-5's
style injection for instant preview and file write mechanism.

**Flow:**
1. User edits property in Designer Panel
2. fn-5.8 injects style into iframe for instant preview
3. After 500ms debounce, fn-5.10 writes to source files
4. File watcher triggers hot reload
5. Iframe shows persisted changes

**Write Format:**
- Add/update `style` prop on JSX element
- Use CSS custom properties: `style={{ padding: 'var(--space-m)' }}`
- Creates violation (inline style) for AI cleanup later

**Dependency on fn-5:**
- fn-5.8 for style injection (live preview)
- fn-5.10 for file write on save

## Acceptance
- [ ] Property changes show instant preview in iframe
- [ ] Changes debounced (500ms) before file write
- [ ] Writes use CSS custom properties format
- [ ] Hot reload shows persisted changes
- [ ] Mode toggle in Designer Panel header
- [ ] Status bar shows last save time

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
