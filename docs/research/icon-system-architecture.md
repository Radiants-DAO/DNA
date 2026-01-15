# Icon System Architecture Research

> Task: fn-4.3 - Research icon system architecture (grid, naming, SVG optimization, animation)

## Executive Summary

RadFlow needs a consistent, performant icon system that aligns with the RadOS design aesthetic. Based on research into Lucide, Heroicons, Phosphor, and Radix Icons, this document outlines architectural decisions for grid standards, naming conventions, SVG optimization, and animation patterns.

**Recommendation**: Use **Lucide Icons** as the base icon library, customized to RadOS styling, with SVGO-based optimization pipeline.

---

## Grid Standards

### Industry Analysis

| Library | Grid Size | Stroke Width | Design Philosophy |
|---------|-----------|--------------|-------------------|
| **Lucide** | 24×24px | 2px default | Consistent, adjustable |
| **Heroicons** | 24×24px (outline), 20/16px (solid) | 1.5px (outline) | Size-based variants |
| **Phosphor** | 16×16px (design), 256×256px (export) | Multiple weights | Weight flexibility |
| **Radix** | 15×15px | Fixed | Pixel-perfect crispness |
| **Material** | 24×24px | Varies | Google's icon guidelines |
| **IBM** | 32×32px (design), scaled down | Varies | Enterprise clarity |

### RadFlow Recommendation

**Primary Grid: 24×24px** with **2px stroke width**

Rationale:
- Matches Lucide and Heroicons (industry standard)
- 24px is divisible by 8 (aligns with RadOS 8-point grid)
- 2px stroke provides good visibility and consistency
- Scales cleanly to 16px, 20px, 32px, 48px

**Size Variants:**

| Token | Size | Use Case |
|-------|------|----------|
| `icon-xs` | 12px | Inline text, badges |
| `icon-sm` | 16px | Dense UI, tables |
| `icon-md` | 20px | Default buttons, nav |
| `icon-lg` | 24px | Primary actions, headers |
| `icon-xl` | 32px | Feature highlights |
| `icon-2xl` | 48px | Hero sections |

**Stroke Behavior:**

Follow Lucide's `absoluteStrokeWidth` pattern - stroke width remains constant (2px) regardless of icon size. This prevents thin icons at large sizes and thick icons at small sizes.

---

## Naming Conventions

### Industry Patterns

| Library | Pattern | Example |
|---------|---------|---------|
| Lucide | kebab-case | `arrow-right`, `file-text` |
| Heroicons | PascalCase + Icon suffix | `BeakerIcon`, `UserIcon` |
| Phosphor | PascalCase | `ArrowRight`, `FileText` |
| Radix | PascalCase | `ArrowRight`, `Pencil1` |
| General | `ic_{name}_{style}_{size}` | `ic_check_outline_md` |

### RadFlow Convention

**File Naming:** `kebab-case.svg`
```
icons/
├── arrow-right.svg
├── file-text.svg
├── chevron-down.svg
└── ...
```

**React Component:** `PascalCase` with `Icon` suffix
```tsx
import { ArrowRightIcon, FileTextIcon } from '@radflow/icons'
```

**CSS/Token Reference:** `icon-{name}`
```css
--icon-arrow-right: url('/icons/arrow-right.svg');
```

**Naming Rules:**
1. Use noun-first naming (`file-text` not `text-file`)
2. Avoid redundant words (`arrow-right` not `arrow-pointing-right`)
3. Use generic names for reusability (`ruler` covers measure, length, size)
4. Include state suffixes only when needed (`check-circle-filled`)
5. No version numbers in names (handle variants separately)

**Category Organization:**
```
icons/
├── actions/       # play, pause, save, delete
├── arrows/        # arrow-*, chevron-*, caret-*
├── communication/ # mail, chat, bell
├── files/         # file-*, folder-*, document-*
├── interface/     # menu, settings, search
├── media/         # image, video, music
├── navigation/    # home, external-link
└── shapes/        # circle, square, triangle
```

---

## SVG Optimization

### SVGO Configuration

**Recommended `svgo.config.mjs`:**
```javascript
export default {
  multipass: true,
  plugins: [
    'preset-default',
    // Keep viewBox for scalability
    { name: 'removeViewBox', active: false },
    // Remove fixed dimensions for CSS control
    { name: 'removeDimensions', active: true },
    // Clean up IDs for consistency
    { name: 'cleanupIds', params: { force: true } },
    // Remove editor metadata
    { name: 'removeAttrs', params: { attrs: ['data.*', 'class'] } },
    // Keep stroke properties for styling
    { name: 'removeAttrs', params: { attrs: [], elemSeparator: '.' } },
    // Merge paths where possible
    { name: 'mergePaths' },
    // Round/rewrite numbers
    { name: 'cleanupNumericValues', params: { floatPrecision: 2 } },
    // Remove empty containers
    { name: 'removeEmptyContainers' },
    // Collapse useless groups
    { name: 'collapseGroups' }
  ]
}
```

### Export Guidelines

1. **Flatten paths**: Merge all shapes into single `<path>` elements
2. **Remove fills/strokes**: Let CSS control colors via `currentColor`
3. **No boolean operations**: Flatten before export
4. **No embedded styles**: Remove `<style>` blocks
5. **24×24 viewBox**: Always `viewBox="0 0 24 24"`

**Target SVG Structure:**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M5 12h14M12 5l7 7-7 7"/>
</svg>
```

### Build Pipeline

```
Design (Figma)
    ↓
Export SVG
    ↓
SVGO Optimization
    ↓
Validation (viewBox, stroke, no fill)
    ↓
Generate React components
    ↓
Generate CSS sprite (optional)
    ↓
Publish to @radflow/icons
```

---

## Icon Animation States

### RadOS Animation Philosophy

From DESIGN_SYSTEM.md:
- Max duration: 300ms
- Easing: ease-out only
- No bounce or spring physics
- No color animations

### Supported Animation Patterns

**1. Rotation (Loading States)**
```css
@keyframes icon-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.icon-loading {
  animation: icon-spin 1s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .icon-loading {
    animation: none;
    opacity: 0.7;
  }
}
```

**2. Pulse (Attention States)**
```css
@keyframes icon-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.icon-attention {
  animation: icon-pulse 2s ease-out infinite;
}
```

**3. State Transitions (Hover/Active)**
```css
.icon-interactive {
  transition: transform 200ms ease-out;
}

.icon-interactive:hover {
  transform: scale(1.1);
}

.icon-interactive:active {
  transform: scale(0.95);
}
```

**4. Line Drawing (Progress)**
```css
.icon-draw {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: icon-draw 300ms ease-out forwards;
}

@keyframes icon-draw {
  to { stroke-dashoffset: 0; }
}
```

### Animation Tokens

| Token | Duration | Easing | Use |
|-------|----------|--------|-----|
| `--icon-transition-fast` | 150ms | ease-out | Hover states |
| `--icon-transition` | 200ms | ease-out | State changes |
| `--icon-transition-slow` | 300ms | ease-out | Complex animations |

### Accessibility

All animated icons MUST respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  .icon-animated {
    animation: none;
    transition: none;
  }
}
```

---

## Icon + Text Baseline Alignment

### The Challenge

CSS has no native baseline alignment for SVG icons. Icons default to top-left alignment, not text baseline.

### Solution: Vertical Alignment System

**Approach 1: Inline Icons (Recommended)**
```css
.icon-inline {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  /* Slight optical adjustment */
  margin-top: -0.125em;
}

/* For icons inside text */
.text-with-icon .icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
}
```

**Approach 2: Flexbox Container**
```css
.icon-text-group {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
}

.icon-text-group .icon {
  flex-shrink: 0;
}
```

**Approach 3: Button with Icon**
```css
.button-with-icon {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
}

/* Icons in buttons should match text size */
.button-with-icon .icon {
  width: 1.25em;
  height: 1.25em;
}
```

### Size-to-Text Mapping

| Text Size | Icon Token | Icon Size |
|-----------|------------|-----------|
| `text-xs` (10px) | `icon-xs` | 12px |
| `text-sm` (12px) | `icon-xs` | 12px |
| `text-base` (14px) | `icon-sm` | 16px |
| `text-lg` (18px) | `icon-md` | 20px |
| `text-xl` (20px) | `icon-md` | 20px |
| `text-2xl` (24px) | `icon-lg` | 24px |

---

## Implementation Recommendations

### 1. Use Lucide as Base

**Why Lucide:**
- 1000+ consistent icons
- Same 24×24 grid we're adopting
- `absoluteStrokeWidth` feature
- MIT licensed
- Active development
- React, Vue, Svelte packages

**Customization for RadOS:**
- Stroke width: 2px (Lucide default)
- Stroke linecap/linejoin: round (Lucide default)
- Colors: Use `currentColor` (inherit from text)

### 2. Custom Icon Guidelines

For icons not in Lucide:

1. Design on 24×24 grid in Figma
2. Use 2px stroke, round caps/joins
3. Align to pixel grid where possible
4. Export as optimized SVG
5. Run through SVGO pipeline
6. Add to `@radflow/icons` package

### 3. Icon Component API

```tsx
interface IconProps {
  /** Icon name from the library */
  name: string;
  /** Size token or custom size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  /** Override stroke width (not recommended) */
  strokeWidth?: number;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
  /** Loading animation */
  loading?: boolean;
}

// Usage
<Icon name="arrow-right" size="md" />
<Icon name="settings" size="lg" aria-label="Settings" />
<Icon name="loader" size="md" loading />
```

### 4. Tauri/Rust Considerations

For Rust-side icon handling:
- Store SVG strings in a HashMap for fast lookup
- Use `resvg` crate if rasterization needed
- Consider embedding critical icons at compile time
- Lazy-load less common icons

---

## References

### Sources Consulted

- [Lucide Icon Design Guide](https://lucide.dev/guide/design/icon-design-guide)
- [Lucide Stroke Width](https://lucide.dev/guide/basics/stroke-width)
- [Heroicons GitHub](https://github.com/tailwindlabs/heroicons)
- [Phosphor Icons](https://phosphoricons.com/)
- [Radix Icons](https://github.com/radix-ui/icons)
- [SVGO](https://github.com/svg/svgo)
- [Design Systems Iconography Guide](https://www.designsystems.com/iconography-guide/)
- [IBM Design Language - UI Icons](https://www.ibm.com/design/language/iconography/ui-icons/design/)
- [Material Design System Icons](https://m2.material.io/design/iconography/system-icons.html)
- [SVG Animation Guide 2025](https://www.svggenie.com/blog/svg-animations-complete-guide)
- [CSS Baseline Grids](https://edgdesign.co/blog/baseline-grids-in-css)

### Related RadFlow Docs

- `/docs/features/` - Feature specs
- Theme: `/Users/rivermassey/Desktop/dev/radflow/packages/theme-rad-os/DESIGN_SYSTEM.md`

---

## Summary Checklist

- [x] Grid: 24×24px base, 2px stroke
- [x] Sizes: xs/sm/md/lg/xl/2xl tokens
- [x] Naming: kebab-case files, PascalCase components
- [x] Organization: Category-based folders
- [x] Optimization: SVGO pipeline configured
- [x] Animation: Spin, pulse, draw, transitions
- [x] Accessibility: prefers-reduced-motion support
- [x] Baseline: Vertical alignment strategies
- [x] Library: Lucide as base, custom pipeline for additions
