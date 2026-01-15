# Design System Infrastructure

> Synthesized findings from fn-4: Design System Infrastructure research

This document consolidates research from 10 infrastructure topics into a unified reference for RadFlow's design system implementation.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Tooling Decisions](#tooling-decisions)
3. [Extended Token Systems](#extended-token-systems)
4. [AI Integration](#ai-integration)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Token Reference](#token-reference)

---

## Executive Summary

RadFlow's design system infrastructure extends beyond core theme tokens (colors, spacing, typography) to encompass tooling integrations, extended token categories, and AI-assisted workflows.

### Key Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Storybook** | CSF Parsing Only | Parse `.stories.tsx` for component discovery without embedding Storybook runtime |
| **RepoPrompt** | Companion App | Manual context in v1; RepoPrompt as external companion for prompt development |
| **Prompt Library** | Scaffold Now, Build Later | Directory structure + basic docs; don't over-invest until app stabilizes |
| **Motion** | CSS-First, Ease-Out Only | RadOS aesthetic requires simple, predictable animations (max 300ms) |
| **Icons** | Lucide Base + Custom Pipeline | 24x24 grid, 2px stroke, SVGO optimization |
| **Accessibility** | WCAG 2.2 AA Minimum | Focus rings, touch targets, contrast validation |
| **Density** | Three Modes (Compact/Default/Comfortable) | CSS custom properties with density multiplier |
| **Responsive** | Container Queries for Components | Media queries for layouts, fluid scales via `clamp()` |
| **Sound** | Research Complete (Deferred) | Token architecture defined; implementation postponed |
| **i18n** | CSS Logical Properties | Automatic RTL support, language-family typography overrides |
| **AI UX** | Assistant Model with Governors | Human-in-the-loop for all code changes |

---

## Tooling Decisions

### Storybook Integration

**Decision: CSF Parsing Only**

RadFlow will parse Component Story Format (CSF) files to discover components without embedding the full Storybook runtime.

**Approach:**
- Use `@storybook/csf-tools` to parse `.stories.tsx` files
- Extract component metadata (props, variants, examples)
- Display in RadFlow's native component browser
- Keep Storybook as optional external tool for developers who want it

**Rationale:** Embedding Storybook adds complexity (webpack/vite integration, addon ecosystem) with diminishing returns. Parsing CSF gives us component discovery without the overhead.

### RepoPrompt Integration

**Decision: Companion App Strategy**

RepoPrompt remains an external companion tool rather than deeply integrated infrastructure.

**v1 Approach:**
- Manual context assembly in RadFlow
- Users can export context to RepoPrompt for advanced prompt development
- MCP/CLI available for power users

**Future Considerations:**
- Evaluate deeper integration once RadFlow UI stabilizes
- Consider MCP server for agent workflows

### Prompt Library Architecture

**Decision: Scaffold Now, Build Later**

Create the directory structure and basic context documents without heavy investment in prompt templates.

**Structure:**
```
prompt-library/
├── context/              # Reference docs for AI (DESIGN_SYSTEM.md exists)
├── generation/           # Component scaffolding templates (future)
└── migration/            # Project migration prompts (future)
```

**Rationale:** The app's feature set will evolve; premature prompt investment risks wasted effort. Basic structure enables future expansion.

---

## Extended Token Systems

### Icon System

**Base Library:** Lucide Icons (MIT licensed, 1000+ icons, consistent style)

**Grid Standards:**
| Token | Size | Use Case |
|-------|------|----------|
| `icon-xs` | 12px | Inline text, badges |
| `icon-sm` | 16px | Dense UI, tables |
| `icon-md` | 20px | Default buttons, nav |
| `icon-lg` | 24px | Primary actions, headers |
| `icon-xl` | 32px | Feature highlights |
| `icon-2xl` | 48px | Hero sections |

**Stroke:** 2px constant (`absoluteStrokeWidth` pattern)

**Naming Convention:**
- Files: `kebab-case.svg`
- Components: `PascalCase` + `Icon` suffix
- Categories: actions/, arrows/, communication/, files/, interface/, media/, navigation/, shapes/

**Optimization Pipeline:**
```
Design (Figma) → Export SVG → SVGO → Validation → React Components → @radflow/icons
```

**Animation Patterns:**
- Rotation (loading): 1s linear infinite
- Pulse (attention): 2s ease-out infinite
- State transitions: 200ms ease-out
- Line drawing (progress): 300ms ease-out

All animations respect `prefers-reduced-motion`.

### Motion Token System

**Philosophy:** RadOS uses ease-out easing only, max 300ms duration, no springs or bounce.

**Duration Scale:**
| Token | Value | Use Case |
|-------|-------|----------|
| `--duration-instant` | 0ms | Reduced motion fallback |
| `--duration-fast` | 100ms | Hover states, micro-interactions |
| `--duration-base` | 150ms | Standard transitions |
| `--duration-moderate` | 200ms | Medium complexity |
| `--duration-slow` | 300ms | Complex animations, entrances |

**Duration Scalar Pattern:**
```css
:root {
  --duration-scalar: 1;
  --duration-fast: calc(100ms * var(--duration-scalar));
  /* ... */
}

@media (prefers-reduced-motion: reduce) {
  :root { --duration-scalar: 0; }
}
```

**Easing Tokens:**
| Token | Value | Use Case |
|-------|-------|----------|
| `--ease-default` | `cubic-bezier(0, 0, 0.2, 1)` | All standard transitions |
| `--ease-linear` | `linear` | Progress indicators |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exiting elements |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Entering elements |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Symmetric transitions |

**Transition Shorthands:**
- `--transition-fast`: 100ms ease-out
- `--transition-base`: 150ms ease-out
- `--transition-slow`: 300ms ease-out

**Stagger Tokens:**
| Token | Value | Use Case |
|-------|-------|----------|
| `--stagger-none` | 0ms | Simultaneous |
| `--stagger-fast` | 30ms | Quick cascade |
| `--stagger-base` | 50ms | Standard list |
| `--stagger-slow` | 80ms | Emphasized sequence |

### Accessibility Tokens

**Focus Ring System:**
| Token | Value | Description |
|-------|-------|-------------|
| `--focus-ring-width` | 2px | Ring stroke width |
| `--focus-ring-offset` | 2px | Gap between element and ring |
| `--focus-ring-color` | var(--edge-focus) | Sky Blue #95BAD2 |

**Double Ring Pattern (high contrast):**
```css
:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  box-shadow:
    0 0 0 var(--focus-ring-width) var(--surface-primary),
    0 0 0 calc(var(--focus-ring-width) * 2) var(--focus-ring-color);
}
```

**Touch Target Tokens:**
| Token | Value | Use Case |
|-------|-------|----------|
| `--touch-target-min` | 24px | WCAG AA minimum |
| `--touch-target-default` | 44px | Standard interactive elements |
| `--touch-target-comfortable` | 48px | Primary actions, mobile-first |

**Contrast Requirements:**
| Context | Minimum Ratio |
|---------|---------------|
| Normal text (<24px) | 4.5:1 |
| Large text (24px+) | 3:1 |
| UI components | 3:1 |

**Known Issue:** Sky Blue link color (#95BAD2) fails on Warm Cloud background. Fix options:
1. Always underline links (recommended)
2. Use darker blue (#4A7A9E) for light backgrounds
3. Context-aware color switching

### Density/Responsive System

**Three Density Modes:**
| Mode | Scale | Use Case |
|------|-------|----------|
| Compact | 0.5x | Data tables, dashboards |
| Default | 1x | General UI |
| Comfortable | 1.5x | Content-focused, accessibility |

**Breakpoint Tokens (Tailwind v4 compatible):**
| Token | rem | px | Device |
|-------|-----|-----|--------|
| `--breakpoint-xs` | 22.5rem | 360px | Small phones |
| `--breakpoint-sm` | 40rem | 640px | Large phones |
| `--breakpoint-md` | 48rem | 768px | Tablets |
| `--breakpoint-lg` | 64rem | 1024px | Laptops |
| `--breakpoint-xl` | 80rem | 1280px | Desktops |
| `--breakpoint-2xl` | 96rem | 1536px | Large desktops |

**Query Strategy:**
- **Container queries** for components (respond to container width)
- **Media queries** for page layouts (respond to viewport)

**Fluid Typography (Utopia-style):**
```css
--text-base: clamp(0.875rem, 0.82rem + 0.19vw, 1rem);
--text-lg: clamp(1.125rem, 1.07rem + 0.19vw, 1.25rem);
```

**Fluid Spacing:**
```css
--space-s: clamp(1rem, 0.89rem + 0.37vw, 1.25rem);
--space-m: clamp(1.5rem, 1.28rem + 0.74vw, 2rem);
```

### Sound Design (Deferred)

**Status:** Research complete, implementation deferred.

**Token Architecture Defined:**

Volume Scale:
- `--volume-silent`: 0
- `--volume-whisper`: 0.1
- `--volume-soft`: 0.25
- `--volume-low`: 0.4
- `--volume-medium`: 0.6
- `--volume-high`: 0.8
- `--volume-full`: 1.0

Sound Categories:
- Feedback (clicks, toggles): soft volume, 50-100ms
- Confirmation (success): medium volume, 150-200ms
- Error (alerts): high volume, 150-250ms
- Notification (messages): medium volume, 150-200ms
- Hero (celebrations): high volume, 300-400ms
- Ambient (background): whisper volume, continuous

**RadOS Sound Character:** Mechanical, tactile, 8-bit inspired, warm tones, no reverb (matches hard pixel shadows).

### i18n Token Patterns

**Core Principle:** Use CSS logical properties exclusively for automatic RTL support.

**Logical Property Mapping:**
| Physical | Logical |
|----------|---------|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `text-align: left` | `text-align: start` |

**Language Family Categories:**
| Category | Languages | Line Height |
|----------|-----------|-------------|
| Western | Latin, Greek, Cyrillic, Hebrew | 1.6 |
| Tall | Arabic, Hindi, Thai | 1.8 |
| Dense (CJK) | Chinese, Japanese, Korean | 1.7 |

**Font Stack Strategy:**
- Specify Latin fonts first (brand fonts for Latin text)
- CJK fonts follow (fallback for CJK characters)
- System fonts last (ultimate fallback)

```css
--font-family-cjk-body:
  'Mondwest',           /* Brand Latin */
  'Noto Sans CJK SC',   /* CJK */
  system-ui,            /* Fallback */
  sans-serif;
```

**Text Expansion Buffer:** 40% (`--text-expansion-buffer: 1.4`) to accommodate German/Finnish translations.

---

## AI Integration

### AI UX Pattern Framework

RadFlow implements AI as an **assistant**, not autonomous agent. All code changes require human approval.

**Pattern Categories (from Shape of AI):**

| Category | RadFlow Implementation |
|----------|----------------------|
| **Wayfinders** | Prompt gallery, contextual suggestions, templates |
| **Tuners** | Parameters (WCAG level, output format), filters (locked tokens), attachments |
| **Governors** | Action plans, verification gates, visual preview, version history |
| **Trust Builders** | AI disclosure badges, caveats, data ownership controls |
| **Identifiers** | Diamond avatar (◇), Sky Blue accent, sparkle icon (✨) |

### Critical Patterns for RadFlow

**1. Action Plan (Governor)**
Before any AI-generated changes apply:
- Show current value
- Show proposed value
- Explain reasoning
- List affected components

**2. Verification Gate (Governor)**
Three-step flow: Plan Review → Visual Preview → Confirm Apply

**3. AI Disclosure (Trust Builder)**
- ✨ AI Generated: Token created by AI
- 🔄 AI Modified: Existing token adjusted
- ✓ Verified: Human reviewed
- ⚠ Unverified: Pending review

**4. Prompt Gallery (Wayfinder)**
Example prompts by category:
- Token adjustments: "Make spacing more generous"
- Accessibility: "Audit colors for WCAG AA"
- Migration: "Convert Tailwind config to CSS variables"
- Analysis: "Find inconsistent spacing values"

### AI Architecture

```
┌─────────────────────────────────┐
│  Frontend (React)               │
│  - AI UI Patterns               │
│  - Token Editors                │
│  - Component Browser            │
└─────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  AI Integration Layer (Tauri)   │
│  - Request validation           │
│  - Context assembly             │
│  - Response parsing             │
│  - Change tracking              │
└─────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  LLM Backend                    │
│  - Claude API (primary)         │
│  - Local model (future)         │
└─────────────────────────────────┘
```

---

## Implementation Roadmap

### Phase 1: Foundation (Token Files)

| Task | Complexity | Priority |
|------|------------|----------|
| Motion tokens (duration, easing) | Low | P1 |
| Focus ring tokens | Low | P1 |
| Touch target tokens | Low | P1 |
| Breakpoint tokens | Low | P1 |
| Density scale tokens | Low | P1 |
| Logical property migration | Medium | P1 |

### Phase 2: Core Features

| Task | Complexity | Priority |
|------|------------|----------|
| Fluid typography scale | Medium | P2 |
| Fluid spacing scale | Medium | P2 |
| Animation keyframes | Medium | P2 |
| Icon system setup (Lucide) | Medium | P2 |
| Container query patterns | Medium | P2 |
| DensityProvider context | Medium | P2 |

### Phase 3: AI Integration

| Task | Complexity | Priority |
|------|------------|----------|
| Action Plan UI | Medium | P3 |
| Verification flow | Medium | P3 |
| AI disclosure badges | Low | P3 |
| Prompt gallery | Low | P3 |
| Version history (branches) | High | P3 |

### Phase 4: Extended Features

| Task | Complexity | Priority |
|------|------------|----------|
| CJK font loading | Medium | P4 |
| RTL testing infrastructure | Medium | P4 |
| Sound system (when ready) | High | P4 |
| View Transitions API | Medium | P4 |
| Spring presets (non-RadOS themes) | High | P4 |

---

## Token Reference

### Quick Reference: All Token Categories

```css
/* Motion */
--duration-instant | --duration-fast | --duration-base | --duration-moderate | --duration-slow
--ease-default | --ease-linear | --ease-in | --ease-out | --ease-in-out
--transition-fast | --transition-base | --transition-slow
--stagger-none | --stagger-fast | --stagger-base | --stagger-slow
--duration-scalar  /* 1 or 0 for reduced motion */

/* Icons */
--icon-xs (12px) | --icon-sm (16px) | --icon-md (20px) | --icon-lg (24px) | --icon-xl (32px) | --icon-2xl (48px)
--icon-transition-fast (150ms) | --icon-transition (200ms) | --icon-transition-slow (300ms)

/* Accessibility */
--focus-ring-width (2px) | --focus-ring-offset (2px) | --focus-ring-color
--touch-target-min (24px) | --touch-target-default (44px) | --touch-target-comfortable (48px)

/* Density */
--density-scale  /* 0.5 | 1 | 1.5 */
--density-padding-xs | --density-padding-sm | --density-padding-md | --density-padding-lg | --density-padding-xl
--lift-distance | --press-distance

/* Responsive */
--breakpoint-xs | --breakpoint-sm | --breakpoint-md | --breakpoint-lg | --breakpoint-xl | --breakpoint-2xl
--bp-min (360px) | --bp-max (1440px)

/* Fluid Type */
--text-xs | --text-sm | --text-base | --text-lg | --text-xl | --text-2xl | --text-3xl | --text-4xl

/* Fluid Space */
--space-3xs | --space-2xs | --space-xs | --space-s | --space-m | --space-l | --space-xl | --space-2xl | --space-3xl
--space-s-m | --space-s-l | --space-m-xl  /* Dramatic variance pairs */

/* Sound (future) */
--volume-silent | --volume-whisper | --volume-soft | --volume-low | --volume-medium | --volume-high | --volume-full
--sound-volume-master | --sound-volume-{category}
--sound-duration-micro | --sound-duration-short | --sound-duration-medium | --sound-duration-long

/* i18n */
--text-direction (ltr | rtl)
--icon-flip (1 | -1)
--typography-line-height-body | --typography-line-height-heading
--typography-letter-spacing | --font-style-emphasis | --font-weight-emphasis
--text-expansion-buffer (1.4)
--font-family-heading | --font-family-body
--font-family-cjk-heading | --font-family-cjk-body
--font-family-arabic | --font-family-hebrew
```

---

## Research Documents

Detailed findings are available in `docs/research/`:

| Document | Task | Topic |
|----------|------|-------|
| `icon-system-architecture.md` | fn-4.3 | Grid, naming, SVG optimization, animation |
| `motion-token-system.md` | fn-4.4 | Durations, easings, springs, reduced-motion |
| `accessibility-tokens.md` | fn-4.5 | Focus, touch targets, contrast, ARIA |
| `sound-design-patterns.md` | fn-4.6 | Audio sprites, categories, volume tokens |
| `density-responsive-system.md` | fn-4.7 | Breakpoints, density, fluid scales |
| `i18n-token-patterns.md` | fn-4.8 | RTL/LTR, text expansion, CJK fonts |
| `ai-ux-patterns.md` | fn-4.10 | Wayfinders, tuners, governors, trust |

Tooling decisions (fn-4.1, fn-4.2, fn-4.9) are captured in task done summaries.

---

## Dependencies

This infrastructure builds on:

- **fn-3**: Theme Spec Research (core token architecture)
- **theme-rad-os**: Existing DESIGN_SYSTEM.md constraints

Future implementation will be tracked in separate epics.
