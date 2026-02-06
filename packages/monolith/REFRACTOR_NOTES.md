# Monolith Theme Refactor Notes

## Migration Guide for apps/monolith-hackathon

### Step 1: Install Theme

```bash
pnpm add @rdna/monolith
```

### Step 2: Update globals.css

Replace the entire contents with:

```css
@import '@rdna/monolith';

/* App-specific overrides only */
```

### Step 3: Token Mapping

| App Variable | Theme Token | Notes |
|--------------|-------------|-------|
| `--black` | `--color-black` | Use `bg-surface-primary` instead |
| `--white` | `--color-white` | Use `text-content-primary` instead |
| `--green` | `--color-green` | Use `text-content-secondary` or `bg-action-success` |
| `--ultraviolet` | `--color-ultraviolet` | Use `bg-action-secondary` |
| `--magma` | `--color-magma` | Use `bg-action-primary` |
| `--amber` | `--color-amber` | Use `bg-action-accent` |
| `--ocean` | `--color-ocean` | Use `bg-surface-elevated` |
| `--slate` | `--color-slate` | Use `bg-surface-muted` |
| `--ease-drift` | `--easing-drift` | |
| `--ease-dock` | `--easing-dock` | |
| `--ease-launch` | `--easing-launch` | |
| `--ease-photon` | `--easing-photon` | |
| `--bevel-hi` | `--color-bevel-highlight` | |
| `--bevel-lo` | `--color-bevel-shadow` | |

### Step 4: Font Token Changes

`--font-body` is added and `--font-sans` remains as an alias for backward compatibility.

| Recommended | Alias |
|-------------|-------|
| `var(--font-body)` | `var(--font-sans)` |

### Step 5: Viewport Scaling (Keep em)

The theme keeps em-based tokens. The only change is clamping the base font size:

```css
body { font-size: clamp(14px, 1vw, 16px); }
```

### Step 6: Component Replacements

| App Component | Theme Component | Import |
|---------------|-----------------|--------|
| `.button_mono` class | `<Button variant="mono">` | `@rdna/monolith/components` |
| `CrtTabs` | `<CrtTabs>` | `@rdna/monolith/components` |
| `CrtAccordion` | `<CrtAccordion>` | `@rdna/monolith/components` |
| `InfoWindow` | `<InfoWindow>` | `@rdna/monolith/components` |
| `CountdownTimer` | `<CountdownTimer>` | `@rdna/monolith/components` |
| `AnimatedSubtitle` | `<AnimatedSubtitle>` | `@rdna/monolith/components` |
| `OrbitalNav` | `<OrbitalNav>` | `@rdna/monolith/components` |
| `ShaderBackground` | `<ShaderBackground>` | `@rdna/monolith/components` |
| `CalendarGrid` | `<CalendarGrid>` | `@rdna/monolith/components` |

### CSS Blocks to Delete from globals.css

After migration, these sections can be removed:

- [ ] Lines 7-48: Font @font-face declarations
- [ ] Lines 54-73: :root color variables
- [ ] Lines 79-121: Base styles (box-sizing, body)
- [ ] Lines 399-454: .button_mono styles
- [ ] All @keyframes that duplicate theme animations

### New Components API

#### Button (mono variant)

```tsx
import { Button } from '@rdna/monolith/components';

<Button variant="mono">Gradient Button</Button>
```

#### CrtTabs (compound API)

```tsx
import { CrtTabs } from '@rdna/monolith/components';

<CrtTabs defaultValue="tab1">
  <CrtTabs.List>
    <CrtTabs.Trigger value="tab1">First</CrtTabs.Trigger>
    <CrtTabs.Trigger value="tab2">Second</CrtTabs.Trigger>
  </CrtTabs.List>
  <CrtTabs.Content value="tab1">Content 1</CrtTabs.Content>
  <CrtTabs.Content value="tab2">Content 2</CrtTabs.Content>
</CrtTabs>
```

#### CrtAccordion (compound API)

```tsx
import { CrtAccordion } from '@rdna/monolith/components';

<CrtAccordion type="single" collapsible>
  <CrtAccordion.Item value="item1">
    <CrtAccordion.Trigger>Question 1</CrtAccordion.Trigger>
    <CrtAccordion.Content>Answer 1</CrtAccordion.Content>
  </CrtAccordion.Item>
</CrtAccordion>
```

#### Badge

```tsx
import { Badge } from '@rdna/monolith/components';

<Badge variant="success">Complete</Badge>
<Badge variant="custom" color="#14f1b2">Launch</Badge>
```

#### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@rdna/monolith/components';

<Card variant="glass">
  <CardHeader>
    <Badge variant="info">New</Badge>
  </CardHeader>
  <CardTitle>Title</CardTitle>
  <CardContent>Content here</CardContent>
</Card>
```
