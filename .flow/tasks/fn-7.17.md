# fn-7.17 Effects Section - Single-value shadow/blur/opacity

## Description
Implement the Effects section in the Designer Panel with simplified controls for common visual effects. Focus on single-value presets rather than full control (V1 simplicity).

**Controls:**
- Opacity slider (0-100%)
- Box shadow presets (none/sm/md/lg/xl/2xl)
- Custom shadow inputs (when preset = custom)
- Backdrop blur presets (none/sm/md/lg)
- Cursor dropdown

**Layout:**
```
┌─────────────────────────────────────┐
│ Effects                         [▼] │
├─────────────────────────────────────┤
│ Opacity: [═══════●════] 100%        │
│                                     │
│ Shadow: [Medium (md)      ▼]        │
│                                     │
│ [Custom Shadow - collapsed]         │
│ ┌─────────────────────────────────┐ │
│ │ X: [0] Y: [4] Blur: [6] Spread:[0]│
│ │ Color: [■] shadow-color          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Backdrop Blur: [None       ▼]       │
│                                     │
│ Cursor: [Default          ▼]        │
└─────────────────────────────────────┘
```

**Shadow Presets (following Tailwind convention):**
- none: `none`
- sm: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- md: `0 4px 6px -1px rgb(0 0 0 / 0.1)`
- lg: `0 10px 15px -3px rgb(0 0 0 / 0.1)`
- xl: `0 20px 25px -5px rgb(0 0 0 / 0.1)`
- 2xl: `0 25px 50px -12px rgb(0 0 0 / 0.25)`
- custom: Opens full shadow editor

**Backdrop Blur Presets:**
- none: `none`
- sm: `blur(4px)`
- md: `blur(8px)`
- lg: `blur(16px)`

**Reference:**
- `reference/webflow-panels/design-panels/effects/effects.png`
- `reference/webflow-panels/design-panels/effects/box shadow.png`

## Acceptance
- [ ] Opacity slider (0-100%) with numeric input
- [ ] Shadow preset dropdown
- [ ] Custom shadow inputs revealed when "Custom" selected
- [ ] Shadow X/Y offset, blur, spread inputs
- [ ] Shadow color using ColorPicker component
- [ ] Backdrop blur preset dropdown
- [ ] Cursor dropdown (default/pointer/text/move/not-allowed/grab/etc.)
- [ ] Values update selected element via style injection
- [ ] Section collapsible like other Designer Panel sections

## Files
- `src/components/layout/RightPanel.tsx` (EffectsSection component)

## Done summary
Implemented - merged from fn-7 branch
## Evidence
- Commits:
- Tests:
- PRs: