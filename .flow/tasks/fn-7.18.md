# fn-7.18 State Selector - Show existing hover/focus/active states only

## Description
Implement the State Selector in the Designer Panel that allows viewing and editing styles for different element states (hover, focus, active, etc.). V1 approach: Read-only detection of existing states, no creation of new state variants.

**States to Detect:**
- default (base styles)
- :hover
- :focus
- :focus-visible
- :active
- :disabled
- :checked (for form elements)
- :first-child / :last-child
- ::before / ::after (pseudo-elements)

**Layout:**
```
┌─────────────────────────────────────┐
│ Element: Button                     │
│ State: [Default ▼]                  │
│        ┌──────────────────┐         │
│        │ Default      ✓   │         │
│        │ :hover       ●   │ ← has styles
│        │ :focus       ●   │ ← has styles
│        │ :active          │ ← no styles
│        │ :disabled    ●   │ ← has styles
│        └──────────────────┘         │
├─────────────────────────────────────┤
│ [Rest of Designer Panel sections]   │
└─────────────────────────────────────┘
```

**Behavior:**
- Scan element's stylesheets for matching state rules
- Show indicator (●) next to states that have existing styles
- Selecting a state shows those state-specific styles in panel sections
- Grayed out states have no existing style definitions
- V1: Cannot create new state variants (future feature)

**Detection Method:**
1. Get element's matching CSS rules via `getMatchedCSSRules()` or CSSOM
2. Filter for rules containing state pseudo-selectors
3. Parse which states have style definitions

**Reference:** Webflow's state selector dropdown

## Acceptance
- [ ] State selector dropdown in Designer Panel header
- [ ] Detect existing :hover styles
- [ ] Detect existing :focus and :focus-visible styles
- [ ] Detect existing :active styles
- [ ] Detect existing :disabled styles
- [ ] Visual indicator for states with existing styles
- [ ] Selecting state updates all Designer Panel sections to show state styles
- [ ] Default state always available
- [ ] States without existing styles are visible but marked as empty
- [ ] Clear indication that state creation is not supported in V1

## Files
- `src/components/layout/RightPanel.tsx` (StateSelector component in header)
- `src/utils/cssStateDetection.ts` (stylesheet parsing utilities)

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
