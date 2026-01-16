# fn-7.22 Breakpoint Selector - Theme breakpoints in top bar

## Description
Implement a breakpoint selector in the RadFlow top bar that allows resizing the preview iframe to different viewport widths. Breakpoints are read from the target project's theme configuration.

**Breakpoint Sources (priority order):**
1. tailwind.config.js `theme.screens`
2. CSS custom properties with `--breakpoint-*` pattern
3. Default fallback: sm/md/lg/xl/2xl

**Default Breakpoints (Tailwind defaults):**
```typescript
const defaultBreakpoints = {
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536,
};
```

**Layout:**
```
┌───────────────────────────────────────────────────┐
│ RadFlow    [sm] [md] [lg] [xl] [2xl] [100%]  ...  │
└───────────────────────────────────────────────────┘
         ↑
   Breakpoint buttons with width indicators
```

**Behavior:**
- Clicking a breakpoint resizes the preview iframe
- Current breakpoint highlighted
- "100%" or "Full" option for full-width preview
- Custom width input for arbitrary sizes
- Preview container shows width indicator

**UI States:**
- Button shows breakpoint name and width on hover
- Active breakpoint has visual indicator
- Responsive preview container centers smaller viewports

## Acceptance
- [ ] Read breakpoints from tailwind.config.js if present
- [ ] Fall back to default Tailwind breakpoints
- [ ] Breakpoint buttons in top bar
- [ ] Clicking breakpoint resizes preview iframe width
- [ ] Active breakpoint visually indicated
- [ ] "Full width" / "100%" option
- [ ] Custom width input for arbitrary sizes
- [ ] Width indicator shown below preview
- [ ] Preview centers when smaller than container
- [ ] Keyboard shortcuts (Cmd+1-5 for breakpoints)

## Files
- `src/components/layout/TopBar.tsx` (BreakpointSelector component)
- `src/stores/slices/previewSlice.ts` (viewport state)
- Integration with preview iframe in main layout

## Done summary
Implemented - merged from fn-7 branch
## Evidence
- Commits:
- Tests:
- PRs: