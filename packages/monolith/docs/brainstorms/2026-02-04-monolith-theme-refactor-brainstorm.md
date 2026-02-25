# Monolith Theme Refactor Brainstorm

**Date:** 2026-02-04
**Status:** Decided

## What We're Building

Refactoring `@rdna/monolith` theme package to match `apps/monolith-hackathon` website styling, so the app can later swap to the theme with minimal changes. The app becomes the visual source of truth; `@rdna/radiants` is the structural reference for DNA patterns.

## Why This Approach

The app currently duplicates ~2400 lines of CSS that should live in the theme. By reconciling styles and migrating components to the theme package, we enable:
1. Single source of truth for Monolith styling
2. Reusable components across future apps
3. Consistent a11y via Radix primitives
4. Clean app migration (delete globals.css duplications, import theme)

## Key Decisions

### 1. Component Migration Scope

**All components migrate to theme** (12 total):

| Component | Type | Radix? | Notes |
|-----------|------|--------|-------|
| CrtTabs | Interactive | Yes | Radix Tabs |
| CrtAccordion | Interactive | Yes | Radix Accordion |
| InfoWindow | Panel | No | Floating panel (non-modal) |
| OrbitalNav | Custom | No | App-specific interaction |
| CountdownTimer | Display | No | Time display |
| AnimatedSubtitle | Display | No | Text animation |
| ShaderBackground | Canvas | No | WebGL effect |
| CRTShader | Canvas | No | WebGL effect |
| CalendarGrid | Data display | No | Month calendar |
| DetailsPanel | Layout | No | Uses CrtAccordion internally |
| Badge | Display | No | Extract from StatusBadge/AssetStatusBadge |
| Card | Layout | No | Extract from PostCard/EventCard |

### 2. Radix UI Strategy

**Use Radix for complex interactive primitives:**
- Dialog, Popover, Tooltip
- Tabs, Accordion
- Select, Menu/Dropdown
- Toast, Switch, Slider

**Don't use Radix for:**
- Buttons, Cards, Badges
- Hero sections, backgrounds
- Orbital nav, shaders
- Layout shells

### 3. Button Consolidation

Merge all button styles into unified Button component:
- **Color variants:** `primary` (magma/orange), `secondary` (purple), `destructive` (red)
- **Gradient variant:** `mono` (the app's `.button_mono` gradient + bevel style)
- Keep: `outline`, `ghost` variants

### 4. Token Additions

Add app tokens to `tokens.css`:

```css
/* Easing curves */
--ease-drift: cubic-bezier(0.45, 0, 0.55, 1);
--ease-dock: cubic-bezier(0.25, 0, 0.55, 1);
--ease-launch: cubic-bezier(0.45, 0, 0.75, 1);
--ease-photon: cubic-bezier(0.2, 0, 0.8, 1);

/* Bevel borders */
--bevel-hi: rgba(167, 145, 216, 0.45);
--bevel-lo: #553691;
```

### 5. Font Variable Rename

**Breaking change:** Rename `--font-sans` → `--font-body`

- `--font-body`: PP Mori (body text)
- `--font-ui`: Pixeloid Sans (UI elements)
- `--font-heading`: Mondwest (headings)
- `--font-mono`: Pixeloid Mono (code)

### 6. Unit Strategy

**Rem-based with clamp() for responsive scaling.**

Current app mixes px, em, and rem inconsistently. Standardize to:

| Use Case | Unit | Example |
|----------|------|---------|
| Spacing (margins, padding, gaps) | `rem` | `p-4` (1rem) |
| Font sizes | `rem` or `clamp()` | `text-base` or `clamp(1rem, 2vw, 1.5rem)` |
| Borders, outlines | `px` | `border` (1px) |
| Responsive typography | `clamp()` | `font-size: clamp(2rem, 5vw, 4rem)` |
| Responsive containers | `clamp()` | `max-width: clamp(20rem, 80vw, 60rem)` |

**Theme token updates needed:**
- Convert `--spacing-*` from em to rem
- Update typography scale to use rem
- Add clamp-based fluid tokens where needed

**App migration:** Replace all `em` and inconsistent `px` with Tailwind utilities or rem values.

### 7. Entry Point Update

Add Tailwind import to `index.css` (matching radiants pattern):

```css
@import 'tailwindcss';

@import './tokens.css';
@import './fonts.css';
@import './typography.css';
@import './base.css';
@import './animations.css';
```

## Component Sub-structure Considerations

Several components should be broken into sub-components:

- **Badge** → extracted from StatusBadge, AssetStatusBadge patterns
- **Card** → extracted from PostCard, EventCard patterns
- **CrtTabs** → TabsList, TabsTrigger, TabsContent (Radix structure)
- **CrtAccordion** → AccordionItem, AccordionTrigger, AccordionContent (Radix structure)

## Open Questions

1. **Category colors** - CalendarGrid has hardcoded `CATEGORY_COLORS`. Should these become theme tokens or stay component-local?
2. **Intern-specific classes** - Many `.intern-*` classes in globals.css. Delete after migration or keep as app overrides?
3. **Existing em-based tokens** - Current theme has em-based spacing tokens. Full conversion to rem or keep some em for specific use cases?

## Research Notes

**Current Theme Structure:**
- `index.css` - Entry (missing tailwindcss import)
- `tokens.css` - 2-tier semantic tokens (~268 lines)
- `fonts.css` - @font-face declarations
- `typography.css` - Base element styles
- `base.css` - Resets, scrollbars, containers
- `animations.css` - CRT effects, keyframes

**App Duplications to Delete Post-Migration:**
- Font @font-face declarations (lines 7-48 of globals.css)
- :root color variables (lines 54-73)
- Base styles duplicating theme (lines 79-121)
- Button styles `.button_mono` (lines 399-454)
- Animation keyframes duplicating theme

**Dependencies to Add:**
- `@radix-ui/react-tabs`
- `@radix-ui/react-accordion`
- (Future: dialog, popover, tooltip, select, etc.)

## Next Steps

1. **Proceed to planning** — run `/writing-plans` to create implementation tasks
2. **Refine further** — continue discussing specific components
3. **Done for now** — return later
