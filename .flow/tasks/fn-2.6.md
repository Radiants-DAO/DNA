# fn-2.6 Component ID Mode - multi-select and violations

## Description

Extend Component ID Mode with multi-select, rectangle selection, select-all-of-type, and violation highlighting.

## Technical Details

1. **Shift+Click - Add to selection**
   - Add clicked element to current selection
   - Visual indicator on all selected
   - Clipboard contains list:
     ```
     AnimatedStatCard @ app/dashboard/page.tsx:47
     MetricsCard @ app/dashboard/page.tsx:52
     Button @ app/dashboard/page.tsx:61
     ```

2. **Shift+Cmd+Click - Select all of type**
   - Select all instances of that component on page
   - Clipboard format:
     ```
     ALL AnimatedStatCard on /dashboard (4 instances)
     → app/dashboard/page.tsx:47, 89, 134, 201
     ```

3. **Click+Drag - Rectangle selection**
   - Draw rectangle to select multiple elements
   - All elements within rectangle selected
   - Same clipboard format as Shift+Click

4. **Violation highlighting**
   - Query backend for components with:
     - Hardcoded colors (not tokens)
     - Inline styles
     - Non-semantic tokens
   - Show visual indicator (red dot/badge)
   - Filter UI: "Show violations only"

## References

- Feature spec: `/docs/features/06-tools-and-modes.md:98-158`
- Violation detection: `/docs/features/08-canvas-editor.md:104-127`
## Acceptance
- [ ] Shift+Click adds to selection
- [ ] Multi-select copies list format to clipboard
- [ ] Shift+Cmd+Click selects all of same component type
- [ ] Click+Drag rectangle selection works
- [ ] Violation indicators visible on offending components
- [ ] Can filter to show only violations
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
