# fn-7: RadFlow UI Interface

A native desktop visual design system editor combining Cursor's browser tool inspection, Webflow's design panels, and Figma's component preview. Full-screen Tauri app with resizable/collapsible panels for visual CSS editing with clipboard or direct-to-file output.

## Reference Files

**Overall Layout & Interactivity:**
- `reference/component-editor/index.html` - HTML prototype showing 3-panel layout, properties panel, preview area

**Left Panel References (Webflow):**
- `reference/webflow-panels/navigator:layers panel.png` - Layers/DOM tree panel
- `reference/webflow-panels/assetspanel.png` - Assets panel
- `reference/webflow-panels/pages panel.png` - Pages/navigation panel
- `reference/webflow-panels/libraries:themes panel.png` - Libraries/themes panel

**Right Panel Design References (Webflow):**
- Layout: `reference/webflow-panels/design-panels/layout/layout-flex.png`, `layout-grid.png`, `layout-options.png`, `flex-child.png`
- Spacing: `reference/webflow-panels/design-panels/spacing/spacing (margin:padding).png`, `spacing-options.png`
- Size: `reference/webflow-panels/design-panels/size/size:overflow.png`, `aspect-ratio.png`, `fit.png`, `fit-position.png`
- Position: `reference/webflow-panels/design-panels/position/position.png`, `relative.png`, `absolute.png`, `fixed.png`, `sticky.png`
- Typography: `reference/webflow-panels/design-panels/typography.png`
- Backgrounds: `reference/webflow-panels/design-panels/New Folder With Items/backgrounds.png`, `background-img.png`, `background-gradient-linear.png`, `background-gradient-radial.png`, `background-solid.png`
- Borders: `reference/webflow-panels/design-panels/borders.png`
- Effects: `reference/webflow-panels/design-panels/effects/effects.png`, `box shadow.png`, `transforms.png`, `backdrop-filters.png`

**Existing Code to Port:**
- `radflow/packages/devtools/src/DevToolsPanel.tsx` - Main panel structure
- `radflow/packages/devtools/src/components/LeftRail.tsx` - Icon rail pattern

## Problem Statement

Designers and developers need a visual interface to inspect, edit, and manage design system components without context-switching between code editors and browsers. Current workflows require manual CSS editing and lack real-time visual feedback with integrated design token awareness.

## Technical Approach

### Architecture Overview

**Three-Panel Layout:**
- **Left Panel** (resizable, collapsible to icon rail): Variables Editor (fn-2), Component Browser, Assets Manager, Layers Tree
- **Center Area**: Live React component preview with variant grid view, element selection via click/inspector/tree
- **Right Panel** (resizable, collapsible to icon rail): Context-aware Designer Panel with Webflow-style property sections
- Reference: `reference/component-editor/index.html` - HTML prototype showing layout structure and interactivity patterns

**Two Edit Modes:**
1. **Clipboard Mode**: All property changes generate full CSS rules copied to clipboard
2. **Direct-Edit Mode**: Debounced writes (500ms) to source files using CSS custom properties

### Window Chrome

- Frameless window with custom controls
- Traffic lights (close/minimize/fullscreen) in top-left corner
- Minimal top bar: Search (Cmd+F) + Breakpoint selector (from theme) + Mode toggle (Clipboard/Direct-Edit)
- Minimal status bar: file path, last save time, error count

### Left Panel Structure

**Icon Rail Navigation** (port existing LeftRail pattern from radflow/devtools):

1. **Variables** (1): Full Variables Editor from fn-2 scope - colors, shadows, radius, animation, effects with editing capabilities
2. **Components** (2): Flat list with categories, click to load in preview
3. **Assets** (3): Icons and logos browser, click-to-copy names
   - Reference: `reference/webflow-panels/assetspanel.png`
4. **Layers** (4): Full page DOM tree with collapsible sections (Webflow-style), element selection
   - Reference: `reference/webflow-panels/navigator:layers panel.png`

**Shortcuts:**
- Number keys 1-4 switch sections (optimized for frequency)
- Design tool conventions: V=select, T=text, etc.
- Cmd+1-4 for search scope filtering (macOS Finder style)

### Center Preview Area

**Component Grid Overview** (default when nothing selected):
- All components displayed in Storybook-style grid
- Click component to focus and enable editing

**Live Component Preview:**
- Actual React component mounted and rendered
- Full interactivity (state changes work)
- Variant grid view showing all prop variations
- Theme breakpoint selector in top bar

**Element Selection Methods:**
1. Click element directly (hover shows outline)
2. Inspector mode with element picker (Cursor-style)
3. Component tree navigation (Layers panel)

**Selection Feedback:**
- Breadcrumb path always visible at top of right panel: `div > section > button`
- Click breadcrumb segment to select parent element

**External Changes:**
- Auto-refresh preview via file watcher when files change externally

### Right Panel: Designer Panel

**Header:**
- Mode toggle (Clipboard / Direct-Edit)
- CSS output preview

**Sections (All collapsible, context-aware - collapse non-applicable by default):**

1. **Layout**
   - Display tabs: Block / Flex / Grid / None
   - Flex: 9-point alignment grid + gap + direction
   - Grid: Separate alignment controls (rows/columns)
   - Width/Height with per-input unit selectors (px/rem/%/vw/auto)
   - Reference: `reference/webflow-panels/design-panels/layout/layout-flex.png`, `layout-grid.png`, `layout-options.png`

2. **Spacing**
   - Chrome DevTools-style box model visual
   - Click to edit individual sides (margin/padding)
   - Linked/unlinked toggle for uniform values
   - Reference: `reference/webflow-panels/design-panels/spacing/spacing (margin:padding).png`, `spacing-options.png`

3. **Size**
   - Width, Height, Min/Max constraints
   - Overflow controls
   - Aspect ratio
   - Reference: `reference/webflow-panels/design-panels/size/size:overflow.png`, `aspect-ratio.png`, `fit.png`

4. **Position**
   - Static / Relative / Absolute / Fixed / Sticky selector
   - Directional inputs (top/right/bottom/left) when not static
   - Z-index
   - Reference: `reference/webflow-panels/design-panels/position/position.png`, `relative.png`, `absolute.png`, `fixed.png`, `sticky.png`

5. **Typography** (with violation detection if not using tokens)
   - Font family, size, weight
   - Line-height, letter-spacing
   - Text-align, decoration
   - Full controls but warn if violating design system
   - Reference: `reference/webflow-panels/design-panels/typography.png`

6. **Appearance/Colors**
   - Background: Solid, linear/radial gradient, image with size/position/repeat
   - Hybrid color picker: quick tokens/swatches inline, "add color" for hex input
   - Token picker integration + autocomplete (typing '--' or 'var(')
   - Reference: `reference/webflow-panels/design-panels/New Folder With Items/backgrounds.png`, `background-gradient-linear.png`, `background-gradient-radial.png`, `background-solid.png`

7. **Borders**
   - Border width, style, color
   - Border radius: uniform slider + toggle for individual corners
   - Reference: `reference/webflow-panels/design-panels/borders.png`

8. **Effects** (single value only for MVP)
   - Box shadow
   - Backdrop filter/blur
   - Opacity
   - Reference: `reference/webflow-panels/design-panels/effects/effects.png`, `box shadow.png`, `backdrop-filters.png`

**State Selector:**
- Dropdown to switch between default/hover/focus/active
- Only show states that exist in source (don't create new states)
- Edit existing state selectors only

**Icon Rail (Collapsed State):**
- Section icons: Layout, Spacing, Colors, Typography, Effects, Borders
- Tool icons: Mode toggle, settings
- Click icon expands full panel scrolled to that section

### CSS/Tailwind Handling

**Read:**
- Read computed styles from DOM for selected element
- Show effective value when conflicting styles exist

**Write:**
- Primary format: CSS custom properties (`style={{padding: 'var(--space-4)'}}`)
- New properties added as inline styles
- Debounced writes (500ms) in Direct-Edit mode

**Clipboard Output:**
- Full CSS rule with selector: `.button { background: #fff; }`

**Validation:**
- Allow invalid values but create violation for AI to fix
- Typography violations when not using design tokens

### Multi-File/Tab Support

- Tab-based editing for multiple files
- Single file active at a time for editing
- Tabs show filename + modified indicator

### Undo/Redo

- Local undo stack (Cmd+Z / Cmd+Shift+Z)
- Separate from git history
- Per-session, clears on close

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+B | Toggle both panels |
| Cmd+F | Global search |
| Cmd+1-4 | Search scope filter (Variables/Components/Assets/Layers) |
| 1-4 | Switch left panel section |
| V | Select tool |
| T | Text tool |
| Escape | Select parent element |
| Cmd+Z | Undo |
| Cmd+Shift+Z | Redo |

### Component Reuse Strategy

**Hybrid approach:**
- Port structure from existing radflow/devtools components
- Restyle for new desktop app layout context
- Reuse: VariablesTab, ComponentsTab, AssetsTab patterns
- New: LayersTree, DesignerPanel, PreviewCanvas

### Project Loading

- File picker dialog to select project folder
- Welcome screen when no project loaded (recent projects list)
- Single project per app instance (multi-project is future work)

### Window Constraints

- Minimum recommended: 1440x900
- Dark mode only (matches design tool conventions)
- Design tokens from fn-6 strictly applied

### Theme Integration

- Theme mode switcher in Variables panel controls preview background
- Breakpoints loaded from theme configuration
- All UI uses fn-6 design tokens

## Key Decisions

1. **Resizable + collapsible panels** with icon rail collapse pattern
2. **Context-aware right panel** - non-applicable sections collapsed by default
3. **Debounced writes** (500ms) for Direct-Edit mode
4. **CSS custom properties** as primary write format
5. **Full Webflow panel set** (Layout, Spacing, Size, Position, Typography, Colors, Borders, Effects)
6. **Skip Transitions panel** for MVP
7. **Single value effects** for MVP (no multi-shadow)
8. **Chrome DevTools box model** for spacing visualization
9. **Live React component** rendering in preview
10. **Variant grid view** for component variations

## Edge Cases

1. **Property doesn't exist in source**: Add as inline style
2. **Conflicting styles**: Show effective value only
3. **Invalid CSS value**: Allow but create violation for AI
4. **External file changes**: Auto-refresh preview
5. **States (hover/focus)**: Only show existing, don't create new

## Dependencies

- **fn-6**: Design tokens (theme) - must be complete before UI implementation
- **fn-2**: Variables Editor - port to left panel
- Existing radflow/devtools components for porting

## Acceptance Criteria

- [ ] Three-panel layout with resizable dividers
- [ ] Left panel icon rail with 4 sections (Variables, Components, Assets, Layers)
- [ ] Center preview renders live React components
- [ ] Right panel shows context-aware CSS properties
- [ ] Clipboard mode outputs full CSS rules
- [ ] Direct-Edit mode writes debounced changes to files
- [ ] Element selection via click, inspector, and tree
- [ ] Breadcrumb navigation for nested elements
- [ ] Theme breakpoint selector in top bar
- [ ] Mode toggle (Clipboard/Direct-Edit) in right panel header
- [ ] All sections collapsible
- [ ] State selector for existing hover/focus/active states
- [ ] Subtle toast notifications for save feedback
- [ ] Local undo/redo stack
- [ ] Frameless window with custom traffic lights
- [ ] Welcome screen when no project loaded

## Quick Commands

```bash
# Development
pnpm tauri dev

# Build
pnpm tauri build

# Test
cargo test
```

## Task Breakdown Suggestions

1. **Window Shell**: Frameless window, traffic lights, panel layout skeleton
2. **Left Panel Icon Rail**: Port existing LeftRail, add Layers section
3. **Variables Panel**: Port VariablesTab from fn-2
4. **Components Panel**: Flat list with categories
5. **Assets Panel**: Port AssetsTab
6. **Layers Panel**: Full page DOM tree with collapsible sections
7. **Preview Canvas**: Live React component rendering
8. **Element Selection**: Click, inspector, tree navigation
9. **Designer Panel Shell**: Collapsible sections, icon rail collapse
10. **Layout Section**: Display tabs, flex/grid controls
11. **Spacing Section**: Chrome-style box model
12. **Size Section**: Width/height with unit selectors
13. **Position Section**: Position type + offset inputs
14. **Typography Section**: Full controls with violation detection
15. **Colors Section**: Hybrid color picker with tokens
16. **Borders Section**: Uniform + individual corners
17. **Effects Section**: Single-value shadow/blur/opacity
18. **State Selector**: Existing states only
19. **Clipboard Mode**: Full CSS rule output
20. **Direct-Edit Mode**: Debounced file writes
21. **Undo/Redo Stack**: Local session history
22. **Breakpoint Selector**: Theme breakpoints in top bar
23. **Search Integration**: Cmd+F with scope filters
24. **Welcome Screen**: Project picker and recents
