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

- Feature spec: `/docs/features/06-tools-and-modes.md` (Component ID Mode section, lines 47-265)
- Current implementation: ComponentIdMode.tsx (port selection/highlight logic)

## UX Decisions (2026-01-15)

1. **Layers Panel** - Right sidebar with tree structure mirroring code/folder hierarchy
   - Expandable/collapsible nodes
   - Bidirectional sync: hover canvas → highlight in panel, hover panel → highlight in canvas
   - Click to select, shows component names and HTML elements

2. **Hover Behavior** - Outline with component name label

3. **Right-click** - Opens tree-structured context menu showing parent/child hierarchy
   - Current component marked with visual indicator (●)
   - Click item to select

4. **Violations Mode** (fn-2.6) - Toggleable for compliance auditing
   - Warning (yellow): inline styles, hardcoded colors
   - Error (red): non-token values like `p-[13px]`

## Acceptance
- [ ] V key toggles Component ID mode
- [ ] Element pills appear showing component names
- [ ] Single click copies location to clipboard
- [ ] Toast confirms copy with component name
- [ ] Escape exits mode
- [ ] Layers panel shows tree structure in right sidebar
- [ ] Bidirectional hover sync (canvas ↔ layers panel)
- [ ] Right-click shows hierarchy context menu
- [ ] Works with theme-rad-os components
## Done summary
- Added ComponentIdMode component with crosshair cursor, hover tooltip, and copy toast
- Added LayersPanel right sidebar with expandable tree structure and bidirectional hover sync
- Right-click shows hierarchy context menu, single click copies location to clipboard
- Updated componentIdSlice for single selection mode with clipboard format ComponentName @ file.tsx:line

- Implements core Component ID Mode for LLM context provision
- Follows patterns from original RadFlow implementation adapted for Tauri architecture

- TypeScript check passes (npx tsc --noEmit)
- Rust backend builds successfully (cargo build)
## Evidence
- Commits: 74755fb1ee9f40a00e82bf99a1ca91127aabff04
- Tests: npx tsc --noEmit, cargo build
- PRs: