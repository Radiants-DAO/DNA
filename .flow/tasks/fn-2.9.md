# fn-2.9 Property Panels - Colors panel with token picker

## Description

Implement Colors property panel with token picker for background, text, and border colors.

## Technical Details

1. **Panel UI**
   - Fixed right sidebar
   - Colors section at top (priority 1)
   - Three color properties: background, text, border

2. **Token picker**
   - Dropdown showing available color tokens
   - Token name display (--color-primary)
   - Color swatch preview
   - Search/filter tokens
   - Use react-colorful for custom color input as fallback

3. **Token data**
   - Fetch from Rust backend via `parse_tokens`
   - Show semantic token names, not resolved values
   - Group by category if tokens are namespaced

4. **Apply changes**
   - Select token → update element style
   - Same output modes as Text Edit (clipboard/direct)
   - Format: `background-color: var(--color-primary);`

5. **Inline fallback**
   - If no token matches, allow custom hex input
   - Show warning that inline values are discouraged

## References

- Feature spec: `/docs/features/06-tools-and-modes.md:229-267`
- Webflow reference: `/webflow-panels/design-panels/`
- react-colorful: https://github.com/omgovich/react-colorful
## Acceptance
- [ ] Colors panel visible in right sidebar
- [ ] Token picker shows available color tokens
- [ ] Tokens searchable/filterable
- [ ] Selecting token updates element
- [ ] Custom color input available as fallback
- [ ] Changes output to clipboard or file per toggle
## Done summary
## Evidence
- Commits:
- Tests:
- PRs:
