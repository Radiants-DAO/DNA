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
# fn-7.12 Size Section Implementation Summary

## What was done

Implemented a comprehensive Size Section in the Designer Panel with the following features:

### Width/Height Controls
- Width and Height inputs with per-input unit selector dropdown
- Unit dropdown includes: px, rem, %, vw, vh, auto
- Reusable `SizeInput` component for consistent input+unit pairing

### Min/Max Constraints
- Min-Width, Max-Width inputs with unit selectors
- Min-Height, Max-Height inputs with unit selectors
- Same unit options as width/height

### Overflow Controls
- Icon button group for: visible, hidden, scroll, auto
- SVG icons matching each overflow mode
- Active state styling with primary color highlight

### Aspect Ratio
- Dropdown with presets: Auto, Square (1:1), Widescreen (16:9), Landscape (4:3), Photo (3:2), Portrait (2:3), Univisium (2:1), Custom
- Custom ratio option shows W:H input fields when selected

### Object Fit
- Dropdown for: Fill, Contain, Cover, None, Scale Down
- For images and replaced elements

## Files Modified
- `src/components/layout/RightPanel.tsx` - Added SizeSection component with all controls

## Technical Details
- New types: `SizeUnit`, `OverflowValue`, `AspectRatioPreset`, `ObjectFitValue`
- New component: `SizeInput` - reusable input with unit selector
- State management for all size properties
- Follows existing section styling patterns from LayoutSection/SpacingSection
## Evidence
- Commits:
- Tests:
- PRs: