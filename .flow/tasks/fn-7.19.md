# fn-7.19 Clipboard Mode - Full CSS rule output

## Description
Clipboard mode accumulates style changes without writing to files. Uses fn-5's
style injection for live preview and clipboard accumulation pattern.

**Flow:**
1. User edits property in Designer Panel
2. fn-5.8 injects style into iframe for instant preview
3. fn-5.9 accumulates change in clipboard buffer
4. UI shows pending changes count
5. "Copy All" or Escape copies accumulated changes to clipboard

**Output Format:**
```css
/* Button @ components/Button.tsx:42 */
.button { background: var(--color-primary); }

/* Card @ components/Card.tsx:15 */
.card { padding: var(--space-m); border-radius: var(--radius-md); }
```

**Dependency on fn-5:**
- fn-5.8 for style injection (live preview)
- fn-5.9 for clipboard accumulation

## Acceptance
- [ ] Property changes show instant preview in iframe
- [ ] Changes accumulate in clipboard buffer
- [ ] Pending changes count shown in UI
- [ ] "Copy All" copies formatted CSS to clipboard
- [ ] Escape key copies and clears buffer
- [ ] Output includes component @ file:line comments

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
