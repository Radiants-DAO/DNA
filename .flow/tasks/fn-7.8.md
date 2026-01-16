# fn-7.8 Element Selection - Click, inspector, tree navigation

## Description
Element selection in the preview area using fn-5's React fiber hooks and postMessage bridge.

**Selection Methods:**
1. Click element directly (hover shows outline via fn-5's style injection)
2. Inspector mode with element picker (Cursor-style)
3. Component tree navigation (fn-7.6 Layers panel)

**Dependency on fn-5:**
- Uses fn-5.2's React fiber hooks + componentMap for component detection
- Uses fn-5.3's postMessage bridge for hover/click events
- Uses componentMap's `source` field for file:line resolution

**Selection Feedback:**
- Breadcrumb path at top of right panel: `div > section > button`
- Click breadcrumb segment to select parent element
- Selected element highlighted in iframe via style injection

## Acceptance
- [ ] Click in iframe selects element (via postMessage from bridge)
- [ ] Hover shows outline on elements
- [ ] Inspector mode activates element picker
- [ ] Layers panel click selects element in preview
- [ ] Breadcrumb shows selection path
- [ ] Click breadcrumb selects parent element

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
