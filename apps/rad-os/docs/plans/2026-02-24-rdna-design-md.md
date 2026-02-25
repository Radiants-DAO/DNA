# RDNA DESIGN.md Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Write the canonical DESIGN.md for the RDNA design system — the single source of truth for tokens, components, patterns, and aesthetic philosophy. Lives in both `@rdna/radiants` and `rad-os`.

**Architecture:** One markdown document with two major sections: "Design System" (portable, theme-level rules) and "RadOS Application" (app-specific window system, desktop, taskbar). Philosophy-first, rules-heavy, do/don't code examples for every section. Written for AI agents.

**Tech Stack:** Markdown, Tailwind CSS v4 `@theme` tokens, CVA, React 19, Zustand

**Source of truth:** `docs/brainstorms/2026-02-24-rdna-design-md-brainstorm.md` — all 26 decisions are captured there.

---

## Task 1: Document Header + Design Philosophy

**Files:**
- Create: `packages/radiants/DESIGN.md`

**Step 1: Write the document header and philosophy section**

Write the opening of DESIGN.md with:

```markdown
# RDNA Design System

> Radiant Design Nexus Architecture — the design language for Radiants.

## How to Use This Document

This document is the **canonical source of truth** for the RDNA design system. It defines what the system _should_ be — current code may not match. When code and this document conflict, this document wins.

**Audience:** AI agents implementing UI. Every rule includes do/don't code examples.

**Scope:** Section 1 (Design System) applies to all RDNA consumers. Section 2 (RadOS Application) applies only to the rad-os app.

---

# Part 1: Design System

## 1. Design Philosophy

### Art Is the Environment, UI Is the Overlay

Radiants treats art as the centerpiece. The background canvas, fullscreen video in the music player, dithered textures — these are the _environment_. UI floats on top as translucent, minimal chrome.

**Three-layer model:**

| Layer | Role | Examples |
|-------|------|----------|
| **Environment** | Art, video, canvas — the deepest, most expansive layer | WebGL sun, Rad Radio fullscreen video, dither textures |
| **Surface** | Windows, cards, panels — containers for content | AppWindow, Card, Dialog, Sheet |
| **Chrome** | Title bars, buttons, controls — minimal and functional | WindowTitleBar, Button, Tabs, Taskbar |

**Rule:** Chrome should never compete with art. When in doubt, reduce chrome.

### Sun Mode / Moon Mode

The design system has two named modes that go beyond light/dark color swapping:

| | Sun Mode (Light) | Moon Mode (Dark) |
|---|---|---|
| **Metaphor** | Harsh overhead sun | Soft ambient moonlight |
| **Shadows** | Sharp pixel-art offsets (directional, hard-edged) | Soft ambient glows (omnidirectional, diffused) |
| **Borders** | Solid black, high contrast | Translucent cream, subtle |
| **Surfaces** | Warm cream backgrounds | Deep black backgrounds |
| **Personality** | Bold, graphic, printwork | Atmospheric, cinematic, neon |

AI agents should understand: swapping modes doesn't just invert colors — it changes the _character_ of every visual element.

### The Discovery Layer

Easter eggs are a first-class design concern. In an agentic web, humans find delight through exploration — not through AI-mediated summaries.

**Rules for Easter eggs:**
- Delightful, never annoying
- Non-destructive — never alter user data or state
- Session-scoped — reset on page reload unless explicitly persisted
- Never block functionality — always dismissible
- Do not document specific Easter eggs in this file
```

**Step 2: Verify the file renders correctly**

Run: `cat packages/radiants/DESIGN.md | head -80`
Expected: Clean markdown with no broken formatting

**Step 3: Commit**

```bash
git add packages/radiants/DESIGN.md
git commit -m "docs: RDNA DESIGN.md — header and design philosophy"
```

---

## Task 2: Color System

**Files:**
- Modify: `packages/radiants/DESIGN.md`

**Step 1: Write the Color System section**

Append to DESIGN.md:

```markdown
## 2. Color System

### Brand Palette (Tier 1)

Raw color values. Never use these directly in component code — they exist only to be referenced by semantic tokens.

| Token | Value | Name |
|-------|-------|------|
| `--color-cream` | `#FEF8E2` | Primary warm neutral |
| `--color-black` | `#0F0E0C` | Primary dark |
| `--color-sun-yellow` | `#FCE184` | Brand accent |
| `--color-sky-blue` | `#95BAD2` | Secondary accent |
| `--color-sunset-fuzz` | `#FCC383` | Warm accent |
| `--color-sun-red` | `#FF6B63` | Error / destructive |
| `--color-green` | `#CEF5CA` | Success |
| `--color-white` | `#FFFFFF` | Pure white |

> **Deprecated:** `--color-warm-cloud` is removed. Use `--color-cream` instead. They were identical (`#FEF8E2`).

### Semantic Tokens (Tier 2)

Purpose-based tokens that flip between Sun Mode and Moon Mode. **All component code MUST use these.**

#### Surface Tokens

| Token | Sun Mode | Moon Mode |
|-------|----------|-----------|
| `--color-surface-primary` | cream | black |
| `--color-surface-secondary` | black | cream |
| `--color-surface-tertiary` | sunset-fuzz | `#3D2E1A` |
| `--color-surface-elevated` | white | `#000000` |
| `--color-surface-muted` | cream | `rgba(252,225,132, 0.08)` |

#### Content Tokens

| Token | Sun Mode | Moon Mode |
|-------|----------|-----------|
| `--color-content-primary` | black (100%) | cream |
| `--color-content-secondary` | black (85% opacity) | cream |
| `--color-content-heading` | black | white |
| `--color-content-muted` | black (60% opacity) | cream (60% opacity) |
| `--color-content-inverted` | cream | black |
| `--color-content-link` | sky-blue | sky-blue |

#### Edge Tokens (Borders)

| Token | Sun Mode | Moon Mode |
|-------|----------|-----------|
| `--color-edge-primary` | black | cream (20% opacity) |
| `--color-edge-muted` | black (20% opacity) | cream (12% opacity) |
| `--color-edge-hover` | black (30% opacity) | cream (35% opacity) |
| `--color-edge-focus` | sun-yellow | sun-yellow |

#### Action Tokens

| Token | Sun Mode | Moon Mode |
|-------|----------|-----------|
| `--color-action-primary` | sun-yellow | sun-yellow |
| `--color-action-secondary` | black | cream |
| `--color-action-destructive` | sun-red | sun-red |

#### Status Tokens

| Token | Value |
|-------|-------|
| `--color-status-success` | green |
| `--color-status-warning` | sun-yellow |
| `--color-status-error` | sun-red |
| `--color-status-info` | sky-blue |

### Token Usage Rules

<!-- DO -->
```tsx
// DO: Use semantic tokens
<div className="bg-surface-primary text-content-primary border-edge-primary">
  <p className="text-content-secondary">Description text</p>
  <span className="text-content-muted">Metadata</span>
</div>
```

<!-- DON'T -->
```tsx
// DON'T: Use brand tokens in component code
<div className="bg-cream text-black border-black">
  <p className="text-black/85">Description text</p>
</div>
```

<!-- DON'T -->
```tsx
// DON'T: Hardcode hex values
<div className="bg-[#FEF8E2] text-[#0F0E0C]">
```

**Rule:** If you need a color that doesn't exist as a semantic token, propose a new semantic token — don't reach for a brand token.
```

**Step 2: Commit**

```bash
git add packages/radiants/DESIGN.md
git commit -m "docs: RDNA DESIGN.md — color system with token tables and do/don't"
```

---

## Task 3: Typography

**Files:**
- Modify: `packages/radiants/DESIGN.md`

**Step 1: Write the Typography section**

Append to DESIGN.md:

```markdown
## 3. Typography

### Fonts

| Semantic Name | Font Family | Tailwind Class | Usage |
|---------------|-------------|----------------|-------|
| `--font-heading` | Joystix Monospace | `font-joystix` | **Default body font.** Headings, buttons, labels, all UI chrome |
| `--font-sans` | Mondwest | `font-mondwest` | Paragraphs, descriptions, form inputs, long-form text |
| `--font-mono` | PixelCode | `font-mono` | Code blocks, monospace data |

> **Important:** The default body font is Joystix (the pixel/heading font), NOT Mondwest. This is intentional — the retro OS aesthetic means most UI text uses the pixel font. Mondwest is applied explicitly where readability of longer text matters. Do not "fix" this to a conventional sans-serif default.

### Type Scale

rem-based on a uniform 0.25rem (4px) grid. The entire scale flexes with the root font size clamp.

| Token | Value | At 16px root |
|-------|-------|-------------|
| `--font-size-2xs` | `0.5rem` | 8px |
| `--font-size-xs` | `0.75rem` | 12px |
| `--font-size-base` | `1rem` | 16px |
| `--font-size-lg` | `1.25rem` | 20px |
| `--font-size-xl` | `1.5rem` | 24px |
| `--font-size-2xl` | `1.75rem` | 28px |
| `--font-size-3xl` | `2rem` | 32px |

> **Note:** There is no `sm` size. The scale jumps from `xs` (0.75rem) to `base` (1rem).

### Root Font Size Clamp

```css
html {
  font-size: clamp(14px, 1vw + 12px, 16px);
}
```

This means:
- On narrow viewports (~200px): base = 14px
- On wide viewports (>400px): base = 16px
- All rem values scale proportionally

### Usage Rules

<!-- DO -->
```tsx
// DO: Use Joystix for UI chrome (it's the default, no class needed)
<button className="text-xs uppercase">Submit</button>
<h2 className="text-lg">Section Title</h2>

// DO: Apply Mondwest explicitly for body text
<p className="font-mondwest text-base">This is a longer description...</p>
```

<!-- DON'T -->
```tsx
// DON'T: Override the default font to sans on UI elements
<button className="font-mondwest text-xs">Submit</button>

// DON'T: Use px-based font sizes
<p className="text-[14px]">Text</p>

// DON'T: Use the removed 'sm' size
<span className="text-sm">This token no longer exists</span>
```
```

**Step 2: Commit**

```bash
git add packages/radiants/DESIGN.md
git commit -m "docs: RDNA DESIGN.md — typography with rem scale and font rules"
```

---

## Task 4: Shadow & Elevation System

**Files:**
- Modify: `packages/radiants/DESIGN.md`

**Step 1: Write the Shadow & Elevation section**

Append to DESIGN.md:

```markdown
## 4. Shadow & Elevation

Shadows tell an elevation story. In Sun Mode, a harsh overhead sun casts sharp directional shadows — higher elements cast longer offsets. In Moon Mode, objects emit soft ambient glow — higher elements radiate wider halos.

### Elevation Scale (6 levels)

| Level | Token | Sun Mode | Moon Mode | Used by |
|-------|-------|----------|-----------|---------|
| **Inset** | `shadow-inset` | `inset 0 0 0 1px black` | `inset 0 0 8px glow-subtle` | Slider tracks, recessed containers |
| **Surface** | `shadow-surface` | `0 1px 0 0 black` | `0 0 2px glow-subtle` | Nested containers, sections within cards |
| **Resting** | `shadow-resting` | `0 2px 0 0 black` | `0 0 6px glow-subtle` | Buttons at rest, badges, inputs |
| **Raised** | `shadow-raised` | `2px 2px 0 0 black` | `0 0 10px glow + 20px subtle` | Cards, panels, popovers |
| **Floating** | `shadow-floating` | `4px 4px 0 0 black` | `0 0 12px glow + 24px subtle` | Windows, dialogs, sheets |
| **Focused** | `shadow-focused` | `4px 4px 0 0 black` | `0 0 12px + 24px + 36px glow` | Active/focused window only |

### Status Glows

Colored variants of the `raised` level for status feedback:

| Token | Sun Mode | Moon Mode |
|-------|----------|-----------|
| `shadow-glow-success` | `2px 2px 0 0 green` | `0 0 8px glow-green` |
| `shadow-glow-error` | `2px 2px 0 0 sun-red` | `0 0 8px glow-sun-red` |
| `shadow-glow-info` | `2px 2px 0 0 sky-blue` | `0 0 8px glow-sky-blue` |

### Usage Rules

<!-- DO -->
```tsx
// DO: Match shadow level to component role
<Card className="shadow-raised">...</Card>
<Dialog className="shadow-floating">...</Dialog>
<Button className="shadow-resting hover:shadow-raised">...</Button>
```

<!-- DON'T -->
```tsx
// DON'T: Use raw shadow values
<div className="shadow-[4px_4px_0_0_#0F0E0C]">...</div>

// DON'T: Over-elevate — a card shouldn't float like a window
<Card className="shadow-floating">...</Card>

// DON'T: Mix elevation metaphors — no glows in Sun Mode
<div className="shadow-resting dark:shadow-[0_0_20px_gold]">...</div>
```

**Rule:** Shadows are managed entirely by the token system. The same utility class produces pixel offsets in Sun Mode and ambient glows in Moon Mode automatically. Never override shadow values per-mode in component code.
```

**Step 2: Commit**

```bash
git add packages/radiants/DESIGN.md
git commit -m "docs: RDNA DESIGN.md — shadow elevation system with 6 levels"
```

---

## Task 5: Motion & Animation

**Files:**
- Modify: `packages/radiants/DESIGN.md`

**Step 1: Write the Motion section**

Append to DESIGN.md:

```markdown
## 5. Motion & Animation

### Duration Scale

| Token | Value | Use |
|-------|-------|-----|
| `--duration-instant` | `0ms` | Immediate state changes, reduced-motion fallback |
| `--duration-fast` | `100ms` | Hover states, focus rings, micro-interactions |
| `--duration-base` | `150ms` | Standard transitions (opacity, color, border) |
| `--duration-moderate` | `200ms` | Medium complexity (accordion expand, tab switch) |
| `--duration-slow` | `300ms` | Complex animations (dialog open, sheet slide, toast enter) |

**Hard ceiling:** No animation may exceed 300ms.

### Easing

| Token | Value | Use |
|-------|-------|-----|
| `--easing-default` | `cubic-bezier(0, 0, 0.2, 1)` | All transitions |

**Rule:** Ease-out only. No ease-in, no ease-in-out, no linear (except progress bars). One easing curve for the entire system.

### Reduced Motion

All durations multiply by `--duration-scalar`:
- Default: `--duration-scalar: 1`
- `prefers-reduced-motion: reduce`: `--duration-scalar: 0`

When scalar is 0, all transitions resolve to `0ms` — instant state changes with no animation.

### Defined Animations

| Class | Effect | Duration |
|-------|--------|----------|
| `animate-fadeIn` | Opacity 0 → 1 | `--duration-base` |
| `animate-scaleIn` | Scale 0.95 + opacity → 1 | `--duration-base` |
| `animate-slideIn` | TranslateX(100%) → 0 + opacity | `--duration-moderate` |
| `animate-slide-in-right` | TranslateX(100%) → 0 | `--duration-moderate` |

> **Note:** These are enter-only animations. No exit animations are defined — elements are removed immediately.

### Usage Rules

<!-- DO -->
```tsx
// DO: Use duration tokens via Tailwind
<div className="transition-colors duration-fast">...</div>
<div className="transition-opacity duration-base ease-default">...</div>
```

<!-- DON'T -->
```tsx
// DON'T: Hardcode durations
<div className="transition-all duration-[250ms]">...</div>

// DON'T: Use non-standard easing
<div className="ease-in-out">...</div>

// DON'T: Exceed 300ms
<div className="duration-[500ms]">...</div>
```
```

**Step 2: Commit**

```bash
git add packages/radiants/DESIGN.md
git commit -m "docs: RDNA DESIGN.md — motion system with duration scale and easing"
```

---

## Task 6: Interactive Elements & Borders

**Files:**
- Modify: `packages/radiants/DESIGN.md`

**Step 1: Write the Interactive Elements section**

Append to DESIGN.md:

```markdown
## 6. Interactive Elements

### Size Scale

All interactive elements (buttons, inputs, selects) share a consistent height scale on an 8px grid:

| Size | Height | Use |
|------|--------|-----|
| `sm` | 24px (`h-6`) | Compact UI: title bar buttons, inline actions, tight layouts |
| `md` | 32px (`h-8`) | Standard: most buttons, inputs, selects |
| `lg` | 40px (`h-10`) | Hero CTAs, primary form inputs, prominent actions |

### Borders

**One width: 1px.** No exceptions.

All containers, inputs, cards, dialogs, alerts, and windows use `border` (1px). There is no `border-2` in the system.

| Token | Use |
|-------|-----|
| `border-edge-primary` | Standard borders (inputs, cards, windows, buttons) |
| `border-edge-muted` | Subtle separators (dividers, internal section borders) |
| `border-edge-hover` | Hover state borders |
| `border-edge-focus` | Focus state (sun-yellow in both modes) |

### Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `rounded-xs` | 2px | Checkbox |
| `rounded-sm` | 4px | Buttons, inputs, badges, toasts |
| `rounded-md` | 8px | Cards, windows, dialogs |
| `rounded-full` | 50% | Switch tracks, radio buttons |

### Focus Rings

All interactive elements use a consistent focus ring:

```css
ring-2 ring-edge-focus ring-offset-1
```

Sun-yellow in both modes — high contrast against cream and black backgrounds.

**Touch targets:** Minimum 44px (WCAG AA). All `sm` (24px) buttons must have padding or margin to reach 44px effective tap area.

### Scrollbar

The custom scrollbar is a signature design element:

| Part | Sun Mode | Moon Mode |
|------|----------|-----------|
| **Track** | SVG dot pattern background | Transparent |
| **Thumb** | Cream fill, 1px black inset border | 15% cream, no dot pattern |
| **Thumb hover** | Sun-yellow fill | 25% cream |
| **Width** | Oversized container (1.75rem) with border-clip trick for visual narrowing |

Apply via `.custom-scrollbar` utility class. Dark mode variant: `.custom-scrollbar-dark`.

### Usage Rules

<!-- DO -->
```tsx
// DO: Use consistent size prop across element types
<Button size="md">Save</Button>
<Input size="md" />
<Select size="md" />

// DO: Use 1px borders everywhere
<Card className="border border-edge-primary">...</Card>
<Dialog className="border border-edge-primary">...</Dialog>
```

<!-- DON'T -->
```tsx
// DON'T: Use border-2 on any component
<Dialog className="border-2 border-edge-primary">...</Dialog>
<Alert className="border-2">...</Alert>

// DON'T: Mix size scales
<Button size="lg">Next to<Input size="sm" /></Button>

// DON'T: Use hardcoded heights
<button className="h-[36px]">Odd height</button>
```
```

**Step 2: Commit**

```bash
git add packages/radiants/DESIGN.md
git commit -m "docs: RDNA DESIGN.md — interactive elements, borders, scrollbar"
```

---

## Task 7: Component Architecture

**Files:**
- Modify: `packages/radiants/DESIGN.md`

**Step 1: Write the Component Architecture section**

Append to DESIGN.md:

```markdown
## 7. Component Architecture

### Three-File Pattern

Every component in `@rdna/radiants` follows this structure:

```
ComponentName/
├── ComponentName.tsx          # Implementation
├── ComponentName.schema.json  # Prop types and AI interface
└── ComponentName.dna.json     # Token bindings per variant
```

### Tiered Composition Model

Choose the pattern based on component complexity:

| Tier | Pattern | When | Example |
|------|---------|------|---------|
| **Simple** | Flat props + variant enum | 1-2 variants, no internal structure | `<Button variant="primary" size="md">` |
| **Container** | Children composition | Named regions, no shared state | `<Card><CardHeader /><CardBody /></Card>` |
| **Complex** | Compound + Context | Shared internal state, interactive sub-parts | `<Dialog.Provider><Dialog.Trigger /><Dialog.Content /></Dialog.Provider>` |

### Variant Definitions with CVA

All component variants MUST use [class-variance-authority](https://cva.style/docs) (CVA) for type-safe variant resolution:

<!-- DO -->
```tsx
// DO: Define variants with CVA
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-heading uppercase rounded-sm cursor-pointer border border-edge-primary',
  {
    variants: {
      variant: {
        primary: 'bg-action-primary text-content-primary shadow-resting hover:shadow-raised',
        secondary: 'bg-surface-secondary text-content-inverted shadow-resting hover:shadow-raised',
        outline: 'bg-transparent hover:bg-surface-muted',
        ghost: 'border-transparent hover:bg-hover-overlay',
      },
      size: {
        sm: 'h-6 px-2 text-2xs',
        md: 'h-8 px-3 text-xs',
        lg: 'h-10 px-4 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);
```

<!-- DON'T -->
```tsx
// DON'T: Manual conditional class building
const classes = [
  'inline-flex items-center',
  variant === 'primary' ? 'bg-sun-yellow' : '',
  variant === 'secondary' ? 'bg-black text-cream' : '',
  size === 'sm' ? 'h-8' : size === 'lg' ? 'h-8' : 'h-8', // all the same!
].join(' ');
```

### No Boolean Prop Proliferation

<!-- DO -->
```tsx
// DO: Create explicit variant components
<ThreadComposer channelId="abc" />
<EditMessageComposer messageId="xyz" />
```

<!-- DON'T -->
```tsx
// DON'T: Boolean props create exponential state space
<Composer isThread isDMThread={false} isEditing={false} isForwarding />
```

### React 19 Rules

- **No `forwardRef`** — ref is a regular prop in React 19
- **Use `use()` hook** for reading Context (not `useContext`)
- Children composition over render props for static structure

### State Management

**Two lanes:**

| Lane | Mechanism | Scope | Examples |
|------|-----------|-------|---------|
| **Component UI state** | React Context (as DI interface) | Local to a compound component tree | Dialog open/close, Accordion expanded, Select highlighted |
| **Application state** | Zustand (slices) | Global, cross-component | Windows, preferences, radio playback, mock data |

Context is dependency injection, not state management. The Provider decides the state implementation (useState, Zustand, server sync). UI sub-components consume the interface.

<!-- DO -->
```tsx
// DO: Context for compound component internal state
const DialogContext = createContext<DialogContextValue | null>(null);

function DialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DialogContext value={{ open, setOpen }}>
      {children}
    </DialogContext>
  );
}

// DO: Zustand for app-level state
const useRadOSStore = create<RadOSStore>()((...args) => ({
  ...createWindowsSlice(...args),
  ...createPreferencesSlice(...args),
}));
```

<!-- DON'T -->
```tsx
// DON'T: Context for global/cross-component state
const AppContext = createContext<{ windows: Window[], preferences: Prefs }>(null);

// DON'T: Zustand for component-local UI state
const useAccordionStore = create(() => ({ openItems: new Set() }));
```
```

**Step 2: Commit**

```bash
git add packages/radiants/DESIGN.md
git commit -m "docs: RDNA DESIGN.md — component architecture with CVA and composition tiers"
```

---

## Task 8: Accessibility & Spacing

**Files:**
- Modify: `packages/radiants/DESIGN.md`

**Step 1: Write the Accessibility and Spacing sections**

Append to DESIGN.md:

```markdown
## 8. Spacing

Use Tailwind's native 4px grid directly. No custom spacing tokens.

| Tailwind | Value | Common use |
|----------|-------|-----------|
| `p-1` / `gap-1` | 4px | Tight gaps (icon + label) |
| `p-2` / `gap-2` | 8px | Standard gap (button groups, form fields) |
| `p-3` / `gap-3` | 12px | Card internal padding |
| `p-4` / `gap-4` | 16px | Window content padding, section spacing |
| `p-6` / `gap-6` | 24px | Large section spacing |
| `p-8` / `gap-8` | 32px | Page-level spacing |

## 9. Accessibility

### Approach: Pragmatic

RDNA targets practical accessibility for a creative/art project — not enterprise WCAG compliance. Cover the basics well.

### What We Do

- **Focus rings** on all interactive elements: `ring-2 ring-edge-focus ring-offset-1` (sun-yellow, visible in both modes)
- **ARIA labels** on icon-only buttons and non-text interactive elements
- **Escape to close** all overlays (dialogs, sheets, menus, start menu)
- **Reduced motion** via `--duration-scalar: 0` when `prefers-reduced-motion: reduce`
- **Touch targets** minimum 44px effective area (WCAG AA)

### What We Don't Do

- No keyboard shortcuts for window management (conflicts with OS shortcuts)
- No full screen reader navigation optimization
- No WCAG AAA color contrast targets (the cream/yellow palette doesn't support it)

### Usage Rules

<!-- DO -->
```tsx
// DO: ARIA labels on icon-only buttons
<Button variant="ghost" size="sm" iconOnly aria-label="Close window">
  <Icon name="close" />
</Button>

// DO: Respect reduced motion
<div className="transition-colors duration-base">
  {/* duration-base resolves to 0ms when reduced motion is on */}
</div>
```

<!-- DON'T -->
```tsx
// DON'T: Icon buttons without labels
<Button variant="ghost" size="sm" iconOnly>
  <Icon name="close" />
</Button>

// DON'T: Hardcode animation durations (bypasses reduced motion)
<div style={{ transition: 'all 200ms ease-out' }}>...</div>
```
```

**Step 2: Commit**

```bash
git add packages/radiants/DESIGN.md
git commit -m "docs: RDNA DESIGN.md — spacing grid and pragmatic accessibility"
```

---

## Task 9: RadOS Application Layer

**Files:**
- Modify: `packages/radiants/DESIGN.md`

**Step 1: Write the RadOS-specific section**

Append to DESIGN.md:

```markdown
---

# Part 2: RadOS Application

> These patterns apply specifically to the rad-os desktop application, not to all RDNA consumers.

## 10. Window System

### Window Chrome

| Property | Value |
|----------|-------|
| Border | `border border-edge-primary rounded-md` |
| Shadow | `shadow-floating` (active: `shadow-focused`) |
| Background | Gradient: `linear-gradient(0deg, window-chrome-from, window-chrome-to)` |
| Title bar height | Compact: `pt-[4px] pb-1 pl-4 pr-1` |
| Min size | 300 x 200px |
| Content max height | `--app-content-max-height` CSS variable |

### Window Chrome in Sun/Moon Mode

| | Sun Mode | Moon Mode |
|---|---|---|
| Gradient | Yellow-to-cream (bottom up) | Flat black |
| Focused shadow | 4px 4px hard black offset | Multi-layer sun-yellow glow |
| Border | Solid black | 20% translucent cream |

### Window Behaviors

| Behavior | Description |
|----------|-------------|
| **Open** | Appears at default position, cascaded if multiple |
| **Focus** | Click anywhere → highest z-index, receives `data-focused` attribute |
| **Minimize** | Hides window, restore from Start Menu |
| **Close** | Removes window, state persists for reopening |
| **Drag** | Title bar is drag handle (`data-drag-handle`) |
| **Resize** | Per-app configuration (some apps fixed size) |
| **Fullscreen** | Toggle via title bar button |
| **Edge snap** | Drag to left/right screen edge → outline appears → snaps to half-screen width |

### Window Limit

Soft limit of 5 windows. Opening a 6th shows a toast warning about performance but does not block.

### Title Bar Buttons

All use `Button variant="ghost" size="md" iconOnly`:
- Help (optional, per-app config)
- MockStates (dev only, per-app config)
- Widget/PiP (optional)
- Fullscreen toggle
- Copy link
- Close

## 11. Desktop & Taskbar

### Desktop
- Icons in grid layout, left side
- Double-click to open (no single-click selection)
- Icon positions saved to localStorage

### Taskbar
- Fixed at bottom of viewport, 48px height
- **Start Button** → opens Start Menu
- **Window Buttons** → shown only when >1 window open
- **Social Links** → Twitter, Discord, GitHub (GitHub hidden on mobile)
- **System Tray** → Invert toggle, volume (if Rad Radio active)
- **Clock** → Real time, HH:MM format, updates every minute

### Start Menu
- Full-screen overlay on mobile
- Popup menu on desktop
- Sections: Apps, Connect (social links)

## 12. App Registration

All apps register in `lib/constants.tsx` via `APP_REGISTRY`:

```typescript
const APP_REGISTRY: Record<AppId, AppConfig> = {
  [APP_IDS.BRAND]: {
    id: APP_IDS.BRAND,
    title: 'Brand Assets',
    icon: <RadMarkIcon size={20} />,
    component: BrandAssetsApp,
    resizable: true,
    defaultSize: { width: 800, height: 600 },
    contentPadding: false,
  },
  // ...
};
```

### AppConfig Shape

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `AppId` | Yes | Unique identifier, used in URL hash |
| `title` | `string` | Yes | Window title bar text |
| `icon` | `ReactNode` | Yes | Icon for desktop, taskbar, start menu |
| `component` | `ComponentType<AppProps>` | Yes | Lazy-loaded app component |
| `resizable` | `boolean` | Yes | Whether window can be resized |
| `defaultSize` | `{ width, height }` | No | Initial window dimensions |
| `contentPadding` | `boolean` | No | Bottom padding below scroll area (default: true) |
| `helpConfig` | object | No | Help panel configuration |
| `mockStatesConfig` | object | No | Mock state switcher (dev only) |
| `showWidgetButton` | `boolean` | No | PiP/widget mode in title bar |

## 13. Hash Routing

```
https://rados.app/#brand           → Opens Brand Assets
https://rados.app/#brand,manifesto → Opens multiple windows
```

- Valid IDs open windows; invalid IDs silently ignored
- Opening/closing updates URL hash
- Comma-separated for multiple windows

## 14. Mobile (Unresolved)

> **Status:** Mobile aesthetic is not yet defined. This section is a placeholder.

**Current behavior (to be redesigned):**
- Windows → fullscreen modals (`MobileAppModal`)
- Taskbar → simplified (Start button + essential icons)
- Desktop icons → horizontal row at top
- Start Menu → full-screen overlay
- Breakpoint: 768px

**Open questions:**
- What is the mobile-native aesthetic for Radiants?
- How does "art is the environment" translate to mobile?
- Does the window metaphor work on mobile at all?

Mobile design requires its own dedicated brainstorm session.
```

**Step 2: Commit**

```bash
git add packages/radiants/DESIGN.md
git commit -m "docs: RDNA DESIGN.md — RadOS application layer (windows, desktop, routing)"
```

---

## Task 10: Copy to rad-os + Update References

**Files:**
- Copy: `packages/radiants/DESIGN.md` → `apps/rad-os/DESIGN.md`
- Modify: `apps/rad-os/CLAUDE.md` — update RadTools references to RDNA
- Modify: `apps/rad-os/SPEC.md` — update RadTools references to RDNA
- Modify: `apps/rad-os/README.md` — update RadTools references to RDNA

**Step 1: Copy DESIGN.md to rad-os**

```bash
cp packages/radiants/DESIGN.md apps/rad-os/DESIGN.md
```

**Step 2: Update CLAUDE.md**

Replace 4 RadTools references:
- `"Development-only design system tooling (RadTools):"` → `"Development-only design system tooling (RDNA devtools):"`
- `"renders the RadTools panel only in development"` → `"renders the RDNA devtools panel only in development"`
- `"radtools"` skill name → `"rdna"` (skills table)
- `"extracting designs to restyle with RadTools"` → `"extracting designs to restyle with RDNA components"`

**Step 3: Update SPEC.md**

Replace 4 RadTools references:
- `"# RadTools design system primitives"` → `"# RDNA design system primitives"`
- `"for RadTools primitives"` → `"for RDNA primitives"`
- `"Restyle with RadTools"` → `"Restyle with RDNA components"`
- `"## 10. Design System (RadTools)"` → `"## 10. Design System (RDNA)"`

**Step 4: Update README.md**

Replace all 10 RadTools references with RDNA equivalents. This file has the most references — update each one contextually.

**Step 5: Update low-priority files**

- `packages/layer33/components/icons.tsx` — update JSDoc header comment
- Flow POC fixture — skip (frozen reference code)

**Step 6: Commit**

```bash
git add packages/radiants/DESIGN.md apps/rad-os/DESIGN.md apps/rad-os/CLAUDE.md apps/rad-os/SPEC.md apps/rad-os/README.md packages/layer33/components/icons.tsx
git commit -m "docs: copy DESIGN.md to rad-os, deprecate RadTools name → RDNA"
```

---

## Task 11: Final Review Pass

**Files:**
- Modify: `packages/radiants/DESIGN.md` (if needed)
- Modify: `apps/rad-os/DESIGN.md` (keep in sync)

**Step 1: Read the full DESIGN.md end-to-end**

Verify:
- [ ] All 26 brainstorm decisions are represented
- [ ] Every section has do/don't code examples
- [ ] No references to "RadTools" remain
- [ ] No raw brand tokens used in do examples
- [ ] Token tables are complete and accurate
- [ ] Mobile section clearly marked as unresolved
- [ ] Sun Mode / Moon Mode naming is consistent throughout

**Step 2: Cross-check against brainstorm**

Read `docs/brainstorms/2026-02-24-rdna-design-md-brainstorm.md` and verify each decision has a corresponding section in DESIGN.md.

**Step 3: Sync copies**

```bash
cp packages/radiants/DESIGN.md apps/rad-os/DESIGN.md
```

**Step 4: Final commit**

```bash
git add packages/radiants/DESIGN.md apps/rad-os/DESIGN.md
git commit -m "docs: RDNA DESIGN.md — final review pass, sync copies"
```
