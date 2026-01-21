# fn-2-gnc.5 Expand Style Panel to 16 Sections

## Description
Expand style panel from 8 to 16 modular sections with context awareness.

## Context
**RadFlow current** (8 sections in RightPanel.tsx):
Layout, Spacing, Size, Position, Typography, Colors, Borders, Effects

**Webstudio** (16 sections):
layout, flexChild, gridChild, listItem, space, size, position, typography, backgrounds, borders, outline, boxShadows, filter, backdropFilter, transitions, transforms, advanced

Key difference: Webstudio shows/hides sections based on context (e.g., `flexChild` only when parent is flex).

## Two-Phase Approach (Reduces Risk)

### Phase 1: Extract Existing 8 Sections
Refactor current RightPanel.tsx to use section components WITHOUT adding new sections.
- Extract 8 existing sections to `sections/*.tsx`
- RightPanel.tsx becomes orchestration only (< 500 lines)
- All existing functionality preserved
- Edit accumulation still works
- No visual changes
- **Commit after Phase 1 passes all tests**

### Phase 2: Add 8 New Sections + Context Awareness
Only after Phase 1 is stable, add new sections:
- 8 new sections (FlexChild, GridChild, etc.)
- Context-aware visibility
- Section registry for easy addition

## Implementation

1. **Phase 1**: Refactor `/src/components/layout/RightPanel.tsx`:
   - Extract each section to separate component
   - Create `/src/components/designer/sections/` directory
   - Preserve all existing edit accumulation logic

2. **Phase 2**: Create section components:
```
sections/
├── LayoutSection.tsx
├── FlexChildSection.tsx      # NEW
├── GridChildSection.tsx      # NEW
├── SpaceSection.tsx
├── SizeSection.tsx
├── PositionSection.tsx
├── TypographySection.tsx
├── BackgroundsSection.tsx    # Renamed from Colors
├── BordersSection.tsx
├── OutlineSection.tsx        # NEW
├── BoxShadowsSection.tsx     # NEW (from Effects)
├── FilterSection.tsx         # NEW
├── BackdropFilterSection.tsx # NEW
├── TransitionsSection.tsx    # NEW
├── TransformsSection.tsx     # NEW
└── AdvancedSection.tsx       # NEW
```

3. Add context awareness:
```typescript
const parentDisplay = useParentComputedStyle('display');
const showFlexChild = parentDisplay?.includes('flex');
const showGridChild = parentDisplay?.includes('grid');
```

4. Create section registry:
```typescript
const sections = new Map([
  ['layout', { Section: LayoutSection, showWhen: () => true }],
  ['flexChild', { Section: FlexChildSection, showWhen: (ctx) => ctx.parentDisplay?.includes('flex') }],
  // ...
]);
```

## Key Files
- **Modify**: `src/components/layout/RightPanel.tsx` (refactor to use registry)
- **Create**: `src/components/designer/sections/*.tsx` (16 section components)
- **Create**: `src/components/designer/sections/index.ts` (registry)
## Context
**RadFlow current** (8 sections in RightPanel.tsx):
Layout, Spacing, Size, Position, Typography, Colors, Borders, Effects

**Webstudio** (16 sections):
layout, flexChild, gridChild, listItem, space, size, position, typography, backgrounds, borders, outline, boxShadows, filter, backdropFilter, transitions, transforms, advanced

Key difference: Webstudio shows/hides sections based on context (e.g., `flexChild` only when parent is flex).

## Implementation

1. Refactor `/src/components/layout/RightPanel.tsx`:
   - Extract each section to separate component
   - Create `/src/components/designer/sections/` directory

2. Create section components:
```
sections/
├── LayoutSection.tsx
├── FlexChildSection.tsx      # NEW
├── GridChildSection.tsx      # NEW
├── SpaceSection.tsx
├── SizeSection.tsx
├── PositionSection.tsx
├── TypographySection.tsx
├── BackgroundsSection.tsx    # Renamed from Colors
├── BordersSection.tsx
├── OutlineSection.tsx        # NEW
├── BoxShadowsSection.tsx     # NEW (from Effects)
├── FilterSection.tsx         # NEW
├── BackdropFilterSection.tsx # NEW
├── TransitionsSection.tsx    # NEW
├── TransformsSection.tsx     # NEW
└── AdvancedSection.tsx       # NEW
```

3. Add context awareness:
```typescript
const parentDisplay = useParentComputedStyle('display');
const showFlexChild = parentDisplay?.includes('flex');
const showGridChild = parentDisplay?.includes('grid');
```

4. Create section registry:
```typescript
const sections = new Map([
  ['layout', { Section: LayoutSection, showWhen: () => true }],
  ['flexChild', { Section: FlexChildSection, showWhen: (ctx) => ctx.parentDisplay?.includes('flex') }],
  // ...
]);
```

## Key Files
- **Modify**: `src/components/layout/RightPanel.tsx` (refactor to use registry)
- **Create**: `src/components/designer/sections/*.tsx` (16 section components)
- **Create**: `src/components/designer/sections/index.ts` (registry)
## Acceptance
### Phase 1 (Extract Existing)
- [ ] 8 existing sections extracted to `sections/*.tsx`
- [ ] RightPanel.tsx < 500 lines (orchestration only)
- [ ] All existing edit functionality preserved (no regressions)
- [ ] Sections communicate correctly with editsSlice
- [ ] Scrub controls work as before
- [ ] Manual QA confirms no visual changes
- [ ] Phase 1 committed before Phase 2 begins

### Phase 2 (Add New)
- [ ] 16 total section components exist in `sections/` directory
- [ ] FlexChild section only shows when parent has `display: flex`
- [ ] GridChild section only shows when parent has `display: grid`
- [ ] Each section uses StyleValue types (not raw strings)
- [ ] Sections are collapsible (match current UX)
- [ ] Section registry allows easy addition of new sections
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
