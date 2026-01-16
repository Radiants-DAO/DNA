# fn-7.14 Typography Section - Full controls with violation detection

## Description
Implement the Typography section in the Designer Panel with full text styling controls and design system violation detection.

**Controls:**
- Font family dropdown (from theme + system fonts)
- Font size input with unit selector
- Font weight dropdown (100-900 + named weights)
- Line height input
- Letter spacing input
- Text align buttons (left/center/right/justify)
- Text decoration buttons (none/underline/strikethrough/overline)
- Text transform buttons (none/uppercase/lowercase/capitalize)
- Color picker (integrated with fn-7.15)

**Layout:**
```
┌─────────────────────────────────────┐
│ Typography                      [▼] │
├─────────────────────────────────────┤
│ Font: [Inter            ▼]         │
│ Weight: [400 - Regular  ▼]         │
│                                     │
│ Size [16] [px▼]   Height [24] [px▼]│
│ Spacing [0] [em▼]                   │
│                                     │
│ Color: [■] text-primary             │
│                                     │
│ Align: [≡] [≡] [≡] [≡]             │
│ Decor: [—] [U̲] [S̶] [O̅]             │
│ Case:  [Aa] [AA] [aa] [Aa]         │
│                                     │
│ ⚠️ Font size not using token       │
└─────────────────────────────────────┘
```

**Violation Detection:**
- Warn if font-size doesn't match a design token
- Warn if font-family not in theme
- Warn if color is raw hex instead of token
- Violations shown as subtle warning, not blocking

**Reference:** `reference/webflow-panels/design-panels/typography.png`

## Acceptance
- [ ] Font family dropdown with theme fonts
- [ ] Font weight dropdown (100-900)
- [ ] Font size and line height with unit selectors
- [ ] Letter spacing input
- [ ] Text align icon buttons (left/center/right/justify)
- [ ] Text decoration icon buttons
- [ ] Text transform icon buttons
- [ ] Color picker integration
- [ ] Violation warnings for non-token values
- [ ] Values update selected element via style injection

## Files
- `src/components/layout/RightPanel.tsx` (TypographySection component)

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
