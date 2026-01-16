# fn-7.20 Direct-Edit Mode - Debounced file writes with CSS custom properties

> **CANCELLED** - Direct-write paradigm sunset per fn-9. RadFlow is now a "Design System Manager for LLM CLI tools" - it browses and outputs context, not direct file writes. LLMs (Claude Code, Cursor) handle the actual file modifications.

## Description
Direct-Edit mode writes changes to source files with debouncing. Uses fn-5's
style injection for instant preview and file write mechanism.

**Flow:**
1. User edits property in Designer Panel
2. fn-5.5's INJECT_STYLE message injects style into iframe for instant preview
3. After 500ms debounce, fn-5.6's file write mechanism writes to source files
4. File watcher triggers hot reload
5. Iframe shows persisted changes

**Write Format:**
- Add/update `style` prop on JSX element
- Use CSS custom properties: `style={{ padding: 'var(--space-m)' }}`
- Creates violation (inline style) for AI cleanup later

**Dependency on fn-5:**
- fn-5.5 (Preview Shell) for style injection via INJECT_STYLE message
- fn-5.6 (Edit Accumulation + File Write) for debounced file writes

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
