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
- Implemented full Position Section with static/relative/absolute/fixed/sticky type selector
- Added offset inputs (top/right/bottom/left) with unit selectors (px, rem, %, auto)
- Offset inputs automatically hidden when position type is static
- Included position origin grid visualization for absolute positioning
- Added z-index input with quick preset buttons (0, 10, 50, 100)
- Sticky position shows warning about scroll container requirement
- Shows "relative to" indicator for absolute positioning context

Why:
- Completes Designer Panel position controls matching Webflow reference
- Enables visual CSS position editing with proper unit selection

Verification:
- TypeScript compilation passes
- Frontend build succeeds
- Cargo tests pass (17 tests)
## Evidence
- Commits: cf0e2b499668f5e7c27437a053c258222ada991e
- Tests: pnpm exec tsc --noEmit, pnpm build, cargo test
- PRs: