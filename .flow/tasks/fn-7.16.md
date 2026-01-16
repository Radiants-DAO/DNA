# fn-7.16 Borders Section - Uniform + individual corner controls

## Description
Implement the Borders section in the Designer Panel with border width, style, color, and radius controls. Supports both uniform and per-side/per-corner editing.

**Controls:**
- Border width (uniform or per-side)
- Border style dropdown (none/solid/dashed/dotted/double)
- Border color (uses ColorPicker from fn-7.15)
- Border radius (uniform or per-corner)
- Link toggle to sync all sides/corners

**Layout:**
```
┌─────────────────────────────────────┐
│ Borders                         [▼] │
├─────────────────────────────────────┤
│ Style: [Solid          ▼]          │
│ Color: [■] border-default          │
│                                     │
│ Width:              [🔗] linked     │
│ ┌───────────────────────────────┐   │
│ │      [1] px                   │   │
│ │ [1]           [1]             │   │
│ │      [1] px                   │   │
│ └───────────────────────────────┘   │
│                                     │
│ Radius:             [🔗] linked     │
│ ┌───────────────────────────────┐   │
│ │ [4]             [4]           │   │
│ │   ╭───────────╮               │   │
│ │   │           │               │   │
│ │   ╰───────────╯               │   │
│ │ [4]             [4]           │   │
│ └───────────────────────────────┘   │
│                                     │
│ Units: [px▼]                        │
└─────────────────────────────────────┘
```

**Behavior:**
- Linked mode: Changing any value updates all sides/corners
- Unlinked mode: Each side/corner independent
- Visual preview of corner radius on mini rectangle
- Per-side border style (advanced, collapsed by default)

**Reference:** `reference/webflow-panels/design-panels/borders.png`

## Acceptance
- [ ] Border style dropdown (none/solid/dashed/dotted/double)
- [ ] Border color using ColorPicker component
- [ ] Border width input (uniform mode)
- [ ] Per-side border width (unlinked mode)
- [ ] Link toggle for border width
- [ ] Border radius input (uniform mode)
- [ ] Per-corner border radius (unlinked mode)
- [ ] Link toggle for border radius
- [ ] Visual preview showing radius on mini rectangle
- [ ] Unit selector for radius (px/rem/%)
- [ ] Values update selected element via style injection
- [ ] Section collapsible like other Designer Panel sections

## Files
- `src/components/layout/RightPanel.tsx` (BordersSection component)

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
