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
