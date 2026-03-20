# DNA Webflow Conversion Guide

This document describes the process and gotchas for converting Webflow-exported projects into DNA-compliant theme packages.

## Overview

Webflow exports are different from pre-existing Radtools themes. This guide covers the key differences and conversion steps specific to Webflow projects.

## Key Differences from Radtools Conversion

| Aspect | Radtools | Webflow |
|--------|----------|---------|
| CSS Variables | Already semantic (e.g., `--color-primary`) | Brand-scoped (e.g., `--base-color-brand--green`) |
| Component System | React/JSX | Static HTML + jQuery |
| Interactivity | React state | jQuery UI / GSAP |
| Font Loading | @font-face in CSS | Webflow-managed fonts |
| Responsive | Tailwind breakpoints | Webflow breakpoint classes |

## Conversion Steps

### 1. Extract Color Palette

Webflow exports CSS variables in `:root`. Look for patterns like:

```css
/* Webflow naming */
--base-color-brand--green: #14f1b2;
--background-color--background-primary: var(--black);
--text-color--text-primary: var(--white);

/* Convert to DNA naming */
--color-green: #14f1b2;
--color-page: var(--color-black);
--color-main: var(--color-white);
```

### 2. Clean Deleted Variable Artifacts

Webflow exports may contain deleted variable placeholders:

```css
/* Before - contains artifact */
--base-color-brand--green-1\<deleted\|variable-66883d0c-d36a-f8ff-eb97-aa29448bb6f4\>: #14f1b2;

/* After - cleaned */
--color-green: #14f1b2;
```

### 3. Handle Responsive Typography

Webflow uses viewport-relative font sizing:

```css
/* Webflow pattern */
body {
  font-size: 1vw;
}

@media screen and (min-width: 1920px) {
  body { font-size: 1rem; }
}

@media screen and (max-width: 1440px) {
  body { font-size: 1rem; }
}
```

This creates fluid typography. Preserve this pattern in `typography.css`.

### 4. Convert jQuery Interactivity to React

**Webflow draggable windows:**
```javascript
$(".app_wrap").draggable({
  containment: "#containment-wrapper",
  scroll: false,
});
```

**DNA React equivalent:**
```tsx
import Draggable from 'react-draggable';

<Draggable
  nodeRef={nodeRef}
  handle="[data-drag-handle]"
  bounds="parent"
>
  <div ref={nodeRef}>...</div>
</Draggable>
```

### 5. Extract Inline Styles to Tokens

Webflow embeds styles inline. Extract to token CSS:

**Webflow (inline in HTML):**
```html
<style>
.crt-overlay:before {
  background: repeating-linear-gradient(
    rgb(218, 49, 49) 0px,
    rgb(112, 159, 115) 2px,
    rgb(40, 129, 206) 4px
  );
}
</style>
```

**DNA (tokens.css):**
```css
@theme inline {
  --color-crt-red: rgb(218, 49, 49);
  --color-crt-green: rgb(112, 159, 115);
  --color-crt-blue: rgb(40, 129, 206);
}
```

### 6. Font File Conversion

Webflow exports fonts in various formats. For optimal web performance:

1. Keep `.woff2` files (best compression)
2. Keep `.woff` files (fallback)
3. Convert `.otf` to `.woff2` using tools like `woff2_compress` if needed
4. Update `@font-face` declarations accordingly

### 7. z-index Management

**Webflow:** Uses inline z-index values managed by JavaScript
```javascript
let zIndex = 0;
function bringToFront(el) {
  el.style.zIndex = ++zIndex;
}
```

**DNA:** Uses Zustand store for window state
```typescript
focusWindow: (id) => {
  const { nextZIndex } = get();
  set({
    windows: windows.map(w =>
      w.id === id ? { ...w, zIndex: nextZIndex } : w
    ),
    nextZIndex: nextZIndex + 1,
  });
}
```

## Common Gotchas

### 1. Webflow Class Name Prefixes

Webflow generates utility classes with specific prefixes:
- `.w-layout-vflex` - Vertical flex
- `.w-richtext` - Rich text containers
- `.w-tab-*` - Tab components
- `.w-mod-*` - Modifier classes

These are Webflow-specific and should be converted to Tailwind utilities or custom classes.

### 2. Background Gradients

Webflow uses complex gradient syntax:

```css
background-image: linear-gradient(225deg, #8dfff0b3, #14f1b280);
```

Convert to CSS variables for theme flexibility:

```css
background: var(--color-surface-glass);

/* In tokens.css */
--color-surface-glass: linear-gradient(225deg,
  rgba(141, 255, 240, 0.7),
  rgba(20, 241, 178, 0.5)
);
```

### 3. Selection Styling

Webflow often includes custom selection colors:

```css
::selection {
  color: #0f0e0c;
  background: #FCE184;
}
```

Include in `typography.css` using token variables.

### 4. Scrollbar Styling

Webflow projects often have custom scrollbar styles using vendor prefixes:

```css
::-webkit-scrollbar { /* ... */ }
::-webkit-scrollbar-thumb { /* ... */ }
::-webkit-scrollbar-track { /* ... */ }
```

These are browser-specific and should be placed in `base.css`.

### 5. Asset Paths

Webflow uses CDN URLs or relative paths:

```html
<img src="images/logo.svg" />
<!-- or -->
<img src="https://cdn.prod.website-files.com/.../logo.svg" />
```

Download assets locally and update paths to theme-relative:

```tsx
<img src="./assets/logo.svg" />
// or via public folder
<img src="/assets/logo.svg" />
```

### 6. iframe Embeds

Webflow often embeds third-party content via iframes (forms, videos). These should be:
1. Documented as external dependencies
2. Wrapped in responsive containers
3. Given proper security attributes (`sandbox`, `allow`)

## Validation Checklist

After conversion, verify:

- [ ] All color variables use DNA semantic naming (`surface-*`, `content-*`, `edge-*`)
- [ ] No Webflow artifact strings in CSS (e.g., `\<deleted\|variable-*\>`)
- [ ] All fonts load correctly with `@font-face`
- [ ] Responsive typography scales properly
- [ ] Interactive components work (draggable, resizable)
- [ ] z-index management via Zustand store
- [ ] Custom scrollbar renders in WebKit browsers
- [ ] CRT overlay effect (if applicable) animates correctly
- [ ] All assets are local (no CDN dependencies)

1. jQuery UI draggable → `react-draggable` + Zustand
2. Inline CRT CSS → `animations.css` keyframes + React component
3. Webflow variables → DNA three-tier token system
4. Static HTML → React components with TypeScript
