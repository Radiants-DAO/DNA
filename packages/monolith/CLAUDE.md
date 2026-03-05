# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Overview

`@rdna/monolith` is a CRT cyberpunk theme package for the DNA design system, built for the Solana Mobile Hackathon. It implements a dark-only, glassmorphic aesthetic with retro CRT scanline effects.

## Architecture

### CSS Layer Structure

Entry point `index.css` imports in order:
1. `tokens.css` — Design tokens using Tailwind v4 `@theme` blocks
2. `fonts.css` — @font-face declarations for Mondwest, Pixeloid Sans, Pixeloid Mono
3. `typography.css` — Base element styles in `@layer base`
4. `base.css` — Resets, scrollbar styling, utility classes
5. `animations.css` — CRT effects and standard animation keyframes

### Token System (tokens.css)

**Tier 1 (Private):** Brand colors defined in `@theme inline` — never use directly
```css
--color-green: #14f1b2;      /* Primary accent */
--color-ultraviolet: #6939ca; /* Secondary */
--color-magma: #ef5c6f;       /* Tertiary */
```

**Tier 2 (Public):** Semantic tokens in `@theme` — always use these
```tsx
// Surfaces: bg-surface-primary, bg-surface-elevated
// Content: text-content-primary, text-content-secondary
// Edges: border-edge-primary, ring-edge-focus
// Actions: bg-action-primary (magma), bg-action-secondary (purple)
```

### Three-File Component Pattern

Each component has three files:
```
components/core/Button/
├── Button.tsx          # Implementation
├── Button.schema.json  # Props/slots for AI interface
└── Button.dna.json     # Token bindings per variant
```

### Components

| Component | Purpose |
|-----------|---------|
| `AppWindow` | Draggable/resizable glassmorphic window with z-index management |
| `Button` | Retro lift/drop shadow button with 4 variants |
| `CrtOverlay` | Full-screen scanline effect layer (z-9999) |
| `NebulaBackground` | Layered parallax background with blur glow |

### State Management

`useWindowManager` hook (Zustand store) manages:
- Window open/close state
- Z-index focus ordering
- Position and size persistence
- Cascade positioning for new windows

## Styling Patterns

**Retro button effect:** Uses shadow-btn for lift, translate on hover/active
```tsx
className="shadow-btn hover:shadow-btn-hover hover:-translate-y-[2px] active:translate-y-[2px]"
```

**Glassmorphic windows:** Linear gradient + backdrop-blur + inner glow on hover
```tsx
background: 'linear-gradient(225deg, rgba(141, 255, 240, 0.7), rgba(20, 241, 178, 0.5))'
backdropFilter: 'blur(0.25em)'
```

**Em-based sizing:** All spacing/sizing uses em units for responsive scaling
```tsx
className="px-[1em] py-[0.5em] text-[0.875em]"
```

## Fonts

| Alias | Font | Usage |
|-------|------|-------|
| `--font-heading` | Mondwest | Display titles |
| `--font-body` / `--font-sans` | Pixeloid Sans | Body text |
| `--font-ui` | Pixeloid Sans | UI elements, buttons |
| `--font-mono` | Pixeloid Mono | Code, monospace |

## Peer Dependencies

- React 18/19
- Tailwind CSS v4
- react-draggable (for AppWindow)
- zustand (for useWindowManager)
