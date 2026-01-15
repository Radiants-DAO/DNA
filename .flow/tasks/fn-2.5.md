# fn-2.5 Component ID Mode - basic selection and clipboard

## Description

Implement basic Component ID Mode: single-click to select component and copy file:line to clipboard.

## Technical Details

1. **Mode activation**
   - V key toggles Component ID mode
   - Cursor changes to crosshair
   - Mode indicator in toolbar

2. **Element pills**
   - Small tags showing component name on elements
   - Position to not obscure content
   - Semi-transparent until hovered

3. **Click behavior**
   - Click element → highlight it
   - Copy to clipboard: `ComponentName @ path/to/file.tsx:lineNumber`
   - Show toast: "Copied: ComponentName @ file.tsx:47"

4. **Component detection**
   - Query Rust backend for component index
   - Match clicked DOM element to component via data attributes or class names
   - Fall back to HTML tag name if no component match

5. **Clipboard format**
   ```
   AnimatedStatCard @ app/dashboard/page.tsx:47
   ```
   For HTML elements:
   ```
   <button> @ app/dashboard/page.tsx:52 "Click me"
   ```

## References

- Feature spec: `/docs/features/06-tools-and-modes.md:47-103`
- Current implementation: ComponentIdMode.tsx (port selection/highlight logic)
## Acceptance
- [ ] V key toggles Component ID mode
- [ ] Element pills appear showing component names
- [ ] Single click copies location to clipboard
- [ ] Toast confirms copy with component name
- [ ] Escape exits mode
- [ ] Works with theme-rad-os components
## Done summary
Blocked:
Needs UX/design decisions - collaborative review required
## Evidence
- Commits:
- Tests:
- PRs:
