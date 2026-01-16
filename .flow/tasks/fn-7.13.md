# fn-7.13 Position Section - Position type + offset inputs

## Description
Implement the Position section in the Designer Panel with position type selector and offset controls that dynamically show/hide based on position type.

**Controls:**
- Position type buttons: static, relative, absolute, fixed, sticky
- Offset inputs (top/right/bottom/left) with unit selectors
- Z-index input
- Inset shorthand toggle (for setting all 4 offsets at once)

**Layout:**
```
┌─────────────────────────────────────┐
│ Position                        [▼] │
├─────────────────────────────────────┤
│ Type: [Static] [Rel] [Abs] [Fix] [Stk]│
│                                     │
│ ┌───────────────────────────────┐   │
│ │      [top] [px▼]              │   │
│ │ [left]           [right]      │   │
│ │ [px▼]             [px▼]       │   │
│ │      [bottom] [px▼]           │   │
│ └───────────────────────────────┘   │
│                                     │
│ Z-Index: [____]                     │
└─────────────────────────────────────┘
```

**Behavior:**
- Static: Hide offset inputs entirely
- Relative: Show offset inputs (offsets from normal position)
- Absolute: Show offset inputs + position origin diagram
- Fixed: Show offset inputs (relative to viewport)
- Sticky: Show offset inputs + warn if no scroll container

**Reference:**
- `reference/webflow-panels/design-panels/position/position.png`
- `reference/webflow-panels/design-panels/position/relative.png`
- `reference/webflow-panels/design-panels/position/absolute.png`

## Acceptance
- [ ] Position type buttons (static/relative/absolute/fixed/sticky)
- [ ] Offset inputs hidden when position is static
- [ ] Offset inputs (top/right/bottom/left) with unit selectors
- [ ] Unit selector includes: px, rem, %, auto
- [ ] Z-index numeric input
- [ ] Visual indicator when using positioned parent context (absolute)
- [ ] Values update selected element via style injection
- [ ] Section collapsible like other Designer Panel sections

## Files
- `src/components/layout/RightPanel.tsx` (PositionSection component)

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
