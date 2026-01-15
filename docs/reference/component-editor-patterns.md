# Component Editor Reference Patterns

Source: `/Users/rivermassey/Downloads/component-editor/`

## Layout Structure

**3-Column Grid:**
```css
.app {
  display: grid;
  grid-template-columns: 280px 1fr 340px;  /* sidebar | preview | properties */
  grid-template-rows: 56px 1fr;            /* header | content */
  height: 100vh;
}
```

## Key UI Patterns

### 1. Component List (Left Sidebar)
- Categorized sections with uppercase headers
- Items show: name + CSS selector (monospace)
- Active state with accent border
- Click to select → loads in preview

### 2. Preview Area (Center)
- Background toggle (dark/light)
- Centered preview frame
- Empty state with icon + hint text

### 3. Properties Panel (Right Sidebar)
Organized into collapsible sections:

**Auto Layout Section:**
- Direction toggles (row/column/wrap/none) - icon buttons
- Size controls (W/H inputs)
- 9-point alignment grid
- Gap controls
- Padding (horizontal/vertical)
- Clip content checkbox

**Appearance Section:**
- Color picker + text input for each:
  - Background color
  - Text color
  - Border color
- Box shadow input

**Typography Section:**
- Font size slider + input
- Font weight slider + input

**Effects Section:**
- Backdrop blur slider
- Opacity slider

**CSS Output:**
- Live syntax-highlighted CSS
- Copy button

## Interaction Patterns

### Slider + Input Combo
```javascript
const styleControls = {
  borderRadius: {
    slider: 'radiusSlider',
    value: 'radiusValue',
    prop: 'border-radius',
    unit: 'px'
  },
  // ... more controls
};

// Bidirectional sync
slider.addEventListener('input', () => {
  valueInput.value = slider.value + config.unit;
  currentStyles[config.prop] = slider.value + config.unit;
  updatePreview();
  updateCSSOutput();
});

valueInput.addEventListener('change', () => {
  slider.value = parseFloat(valueInput.value);
  // ...
});
```

### Color Picker Pattern
```html
<div class="color-row">
  <div class="color-swatch">
    <input type="color" id="bgColorPicker" value="#000000">
  </div>
  <input type="text" class="property-input" id="bgColorInput" value="rgba(0, 0, 0, 0.7)">
</div>
```
- Native color picker for quick selection
- Text input for precise rgba/hex values

### 9-Point Alignment Grid
```html
<div class="alignment-grid">
  <button class="align-point" data-align="start-start"><span class="dot"></span></button>
  <button class="align-point" data-align="start-center"><span class="dot"></span></button>
  <!-- ... 9 total points -->
</div>
```
- Maps to flexbox justify-content + align-items
- Visual representation of alignment options

### Toast Notifications
```javascript
function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.add('show', 'success');
  setTimeout(() => toast.classList.remove('show', 'success'), 3000);
}
```
- Slide-up animation from bottom
- Auto-dismiss after 3 seconds

### Figma Paste Integration
- Paste area in "Create New" tab
- Parses CSS from clipboard
- Creates new component from parsed styles

## Component Templates
Pre-defined starting points:
- Button
- Card
- Badge
- Input

## CSS Variable Naming
```css
:root {
  --bg-primary: #0a0a0a;
  --bg-secondary: #141414;
  --bg-tertiary: #1a1a1a;
  --bg-elevated: #222;
  --border-color: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.15);
  --text-primary: #fff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.4);
  --accent: #3b82f6;
  --accent-hover: #60a5fa;
  --success: #22c55e;
  --warning: #f59e0b;
}
```

## Applicable to RadFlow

1. **Property Panels (fn-2.9, fn-2.10)**
   - Use same section organization (Auto Layout, Appearance, Typography, Effects)
   - Slider + input combo pattern
   - Color swatch + text input pattern
   - CSS output preview

2. **Component ID Mode (fn-2.5)**
   - Component list with category grouping
   - Active state styling

3. **General UI**
   - Toast notification pattern
   - Background toggle (dark/light preview)
   - Empty state design

---

# Webflow Panel Reference

Source: `/webflow-panels/`

## Panel Organization (Top to Bottom)

1. **Layout** - Display type, direction, alignment, gap
2. **Spacing** - Margin/padding box model visualization
3. **Size** - Width, height, min/max, overflow, aspect ratio
4. **Position** - Static, relative, absolute, fixed, sticky
5. **Typography** - Font, weight, size, color, alignment, decoration
6. **Backgrounds** - Color, image, gradient
7. **Borders** - Radius, style, width, color (per-side)
8. **Effects** - Opacity, shadows, transforms, transitions, filters

## Key UI Patterns from Webflow

### Spacing Box Model
Visual nested rectangles showing margin (outer) and padding (inner):
```
┌─ MARGIN ──────────────────┐
│           0               │
│     ┌─ PADDING ─────┐     │
│  0  │      0        │  0  │
│     │   [element]   │     │
│     │      0        │     │
│     └───────────────┘     │
│           0               │
└───────────────────────────┘
```
- Click individual sides to edit
- Shows "0" for unset values

### Layout Flex Panel
- **Display**: Block | Flex | Grid | None (segmented buttons)
- **Direction**: Row | Column | Reverse icons
- **Align**: 9-point grid + X/Y dropdowns (space-between, center, etc.)
- **Gap**: Slider + input with PX unit + lock icon

### Typography Panel
- **Font**: Dropdown with font preview
- **Weight**: Dropdown "400 - Normal"
- **Size + Height**: Two inputs side-by-side with units
- **Color**: Swatch + token name ("text primary")
- **Align**: Icon button group (left, center, right, justify)
- **Decor**: Icon buttons (none, strikethrough, underline, overline)
- **Expandable "More type options"**: Letter spacing, text indent, columns
- **Capitalize**: Toggle buttons (normal, uppercase, lowercase, title)
- **Direction**: LTR/RTL toggle
- **Breaking**: Word/Line dropdowns
- **Wrap**: Dropdown
- **Truncate**: Clip | Ellipsis toggle
- **Stroke**: Width + color
- **Text shadows**: Expandable list with + button

### Borders Panel
- **Radius**: All corners toggle | Individual corners, slider + input
- **Per-side selector**: Visual box with clickable sides
- **Style**: None | Solid | Dashed | Dotted (icon buttons)
- **Width**: Input with PX
- **Color**: Swatch + name

### Effects Panel
- **Blending**: Dropdown (Normal, Multiply, etc.)
- **Opacity**: Slider + input with %
- **Outline**: Style buttons (none, solid, dashed, dotted)
- **Expandable sections** with + button:
  - Box shadows
  - 2D & 3D transforms
  - Transitions
  - Filters
  - Backdrop filters
- **Cursor**: Dropdown with icon preview
- **Events**: Auto | None toggle

### Box Shadow Editor
- **Type**: Outside | Inside toggle
- **X, Y, Blur, Size**: Each has slider + input with PX
- **Color**: Swatch + rgba value

### Size Panel
- **Width/Height**: Input with unit dropdown + "Auto" option
- **Min W/H, Max W/H**: Inputs with "None" option
- **Overflow**: Icon buttons (visible, hidden, scroll, auto)
- **Expandable "More size options"**
- **Ratio**: Dropdown (Auto, 1:1, 16:9, etc.)
- **Box size**: Content-box | Border-box toggle
- **Fit**: Dropdown (Fill, Contain, Cover, etc.)

### Position Panel
- Dropdown with descriptions:
  - Static (default)
  - Relative (offset from normal)
  - Absolute (removed from flow)
  - Fixed (viewport-relative)
  - Sticky (hybrid)
- Shows helpful description text for selected option

### Flex Child Panel
- **Sizing**: Shrink | Grow | Don't icons
- **Expandable "Alignment and order"**
- **Align**: Self-alignment overrides (auto, start, center, end, stretch)
- **Order**: X | First | Last | custom

### Navigator (Layers Panel)
- Tree structure with expand/collapse arrows
- Checkboxes for visibility
- Element type icons:
  - □ for divs/containers
  - 🧩 for components (green "OS Taskbar")
  - 🖼 for images
  - 📄 for text/content
- Selected item highlighted in blue
- Hover shows eye icon for quick visibility toggle
- Pin icon in header for panel pinning

## Token Display Pattern
Colors show token name, not raw value:
```
Color: [■] text primary
```
Not:
```
Color: [■] #ffffff
```

## Collapsible Sections
- Section header with chevron
- Click to expand/collapse
- "+" button for adding items (shadows, transforms, etc.)
