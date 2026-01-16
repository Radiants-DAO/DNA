# fn-7.12 Size Section - Width/height with unit selectors

## Description
Implement the Size section in the Designer Panel with width/height controls, min/max constraints, overflow, and aspect ratio.

**Controls:**
- Width/Height inputs with unit dropdown (px/rem/%/vw/vh/auto)
- Min-Width, Max-Width, Min-Height, Max-Height with same units
- Overflow controls: visible/hidden/scroll/auto (icon buttons)
- Aspect ratio presets: auto, 1:1, 16:9, 4:3, 3:2, custom
- Object-fit dropdown: fill/contain/cover/none/scale-down

**Layout:**
```
┌─────────────────────────────────────┐
│ Size                            [▼] │
├─────────────────────────────────────┤
│ W [____] [px▼]    H [____] [px▼]   │
│                                     │
│ Min W [____]      Max W [____]     │
│ Min H [____]      Max H [____]     │
│                                     │
│ Overflow: [👁] [⊟] [↕] [⊞]         │
│                                     │
│ Aspect Ratio: [Auto ▼]             │
│ Object Fit:   [Fill ▼]             │
└─────────────────────────────────────┘
```

**Reference:** `reference/webflow-panels/design-panels/size/size:overflow.png`

## Acceptance
- [ ] Width and Height inputs with per-input unit selectors
- [ ] Unit dropdown includes: px, rem, %, vw, vh, auto
- [ ] Min/Max width and height inputs
- [ ] Overflow icon buttons (visible/hidden/scroll/auto)
- [ ] Aspect ratio presets dropdown
- [ ] Object-fit dropdown for images/replaced elements
- [ ] Values update selected element via style injection
- [ ] Section collapsible like other Designer Panel sections

## Files
- `src/components/layout/RightPanel.tsx` (SizeSection component)

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
