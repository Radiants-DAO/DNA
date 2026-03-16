# RDNA DESIGN.md Brainstorm

**Date:** 2026-02-24
**Status:** Decided

## What We're Building

A comprehensive `DESIGN.md` — the canonical source of truth for the RDNA (Radiant Design Nexus Architecture) design system. Written primarily for AI agents, it defines every interaction pattern, token, component rule, and aesthetic philosophy. Lives in both `@rdna/radiants` (theme package) and `rad-os` (application).

## Why This Approach

The codebase has inconsistencies (raw brand tokens in components, duplicate color names, dead tokens, broken motion scalar). Rather than documenting what exists, the DESIGN.md defines what the system **should** be — becoming the target for a polish pass. AI-first authoring means rules-heavy, do/don't examples, minimal prose.

## Key Decisions

### Naming & Identity
- **System name**: RDNA (Radiant Design Nexus Architecture). RadTools is deprecated — all references to be removed.
- **Mode names**: **Sun Mode** (light) = harsh sun, sharp pixel-art shadows, black borders. **Moon Mode** (dark) = soft ambient glows, translucent borders.

### Design Philosophy
- **"Art is the environment, UI is the overlay."** Three-layer model: Environment (art/video/canvas) → Surface (windows/cards) → Chrome (title bars, buttons). Art is always the deepest, most expansive layer.
- **Discovery Layer**: Easter eggs are a first-class design concern. In an AI-agent world, human discovery and delight matter more. Rules: delightful, non-destructive, session-scoped, never block functionality.

### Color System
- Consolidate `--color-cream` and `--color-warm-cloud` → **cream only**
- **Strict semantic token rule**: Components MUST use semantic tokens (`surface-*`, `content-*`, `edge-*`, `action-*`). Raw brand tokens (`cream`, `sun-yellow`) forbidden in component code.
- Dead tokens to remove: `--color-success-green-dark`, `--color-warning-yellow-dark`, `--color-error-red-dark`

### Typography
- **Default font**: Joystix (intentional — retro OS aesthetic). Mondwest applied explicitly for body/long text.
- **Type scale**: rem-based, 0.25rem (4px) uniform grid. No `sm` size.
  - `2xs=0.5rem`, `xs=0.75rem`, `base=1rem`, `lg=1.25rem`, `xl=1.5rem`, `2xl=1.75rem`, `3xl=2rem`
- **Root clamp**: `font-size: clamp(14px, 1vw + 12px, 16px)` — whole scale flexes with viewport

### Interactive Elements
- **Button size scale**: sm=24px, md=32px, lg=40px (8px grid). Applies to all interactive elements.
- **Borders**: Standardize to 1px everywhere. No more border-2 on Dialog/Alert.

### Shadow Elevation System (6 levels + status)

| Level | Sun Mode | Moon Mode | Used by |
|-------|----------|-----------|---------|
| inset | inset 0 0 0 1px black | inset 0 0 8px glow-subtle | Slider tracks, recessed |
| surface | 0 1px 0 0 black | 0 0 2px glow-subtle | Nested containers |
| resting | 0 2px 0 0 black | 0 0 6px glow-subtle | Buttons, badges |
| raised | 2px 2px 0 0 black | 0 0 10px glow + 20px subtle | Cards, panels |
| floating | 4px 4px 0 0 black | 0 0 12px glow + 24px subtle | Windows, dialogs |
| focused | 4px 4px 0 0 black | 0 0 12px + 24px + 36px glow | Active window |

Status glows: success (green), error (red), info (blue) — colored variants of `raised`.

### Motion
- 5 durations: instant(0ms), fast(100ms), base(150ms), moderate(200ms), slow(300ms)
- Fix `--duration-scalar` so `prefers-reduced-motion` multiplies to 0 properly
- All ease-out, max 300ms (per DNA spec)

### Spacing
- Use Tailwind's native 4px grid directly (`p-1`, `gap-2`, `p-4`). No custom spacing tokens.

### Component Architecture
- **Tiered composition**: flat props (simple) → children slots (containers) → compound+context (complex)
- **Adopt CVA** (class-variance-authority) for type-safe variant definitions
- **No boolean prop proliferation** — explicit variant components instead
- **React 19**: No forwardRef needed (ref is a regular prop)

### State Management
- **Two lanes**: React Context for compound component DI (local UI state), Zustand for application state (windows, preferences, etc.)
- Context is dependency injection, not state management

### Content Hierarchy (Light Mode Fix)
- `main` stays at `var(--color-black)` (100%)
- `sub` changes from `var(--color-black)` → 85% opacity black. Defined as a proper `@theme` token, consumed as `text-sub` in Tailwind. Never inline rgba in components.
- `mute` already exists at 60% opacity (no change)

### Window System
- Current behaviors: drag, resize, minimize, close, focus (z-index), fullscreen, widget, help
- **Add**: Edge snapping — drag window to left/right screen edge, outline appears, snaps to half-screen width. Simple, like Windows.

### Other
- **Scrollbar**: Codified as design system element (dot-pattern track, bordered thumb, yellow hover)
- **Accessibility**: Pragmatic — focus rings, ARIA labels, escape-to-close, reduced motion. Not enterprise WCAG.
- **Mobile**: Unresolved — placeholder section in DESIGN.md. Needs dedicated design pass. Seeker is an early prototype, not canon.

### Document Structure
- One doc, two sections: "Design System" (tokens, components, patterns) + "RadOS Application" (window system, desktop, taskbar)
- Philosophy section first, then rules
- Do/don't code examples for every section

## Open Questions

- Mobile aesthetic (deferred — needs its own brainstorm)
- Depth of Radiants Studio sub-tools (Pixel Art, Dither, Commission) — need quality audit
- RadTools deprecation cleanup scope (how many files reference the old name?)
- Whether magnetic snap zones need their own implementation plan

## Research Notes

### Relevant Skills
- `/vercel-composition-patterns` — compound components, avoid boolean props, children over render props, explicit variants, state context interface, decouple state from UI, lift state to providers
- `/vercel-react-best-practices` — performance patterns, rendering optimization
- `/design-system-patterns` — component architecture, design tokens, theming
- `/tailwind-v4-shadcn` — Tailwind v4 dark mode, @theme patterns, common gotchas
- `/zustand-state-management` — slice pattern, persist middleware, TypeScript

### Files Audited
- `app/globals.css` + `@rdna/radiants/tokens.css` — full token system
- `@rdna/radiants/dark.css` — dark mode implementation
- `@rdna/radiants/typography.css` — base element styles
- `@rdna/radiants/base.css` — scrollbar, animations, reduced motion
- `@rdna/radiants/components/core/*` — all 20+ component primitives
- `components/Rad_os/AppWindow.tsx`, `WindowTitleBar.tsx` — window chrome
- `lib/constants.tsx` — app registry (11 apps)
- `store/` — Zustand slices (5 slices)

### Inconsistencies Found (to fix in polish pass)
1. `--color-cream` / `--color-warm-cloud` duplication
2. Ghost button hover uses raw `bg-sun-yellow` (not semantic)
3. Tab pill inactive uses raw `bg-cream` (not semantic)
4. All button sizes resolve to same h-8 height
5. `--font-size-sm` and `--font-size-base` both 14px
6. `--duration-scalar` defined but unused in actual duration overrides
7. Dead tokens: `--color-success-green-dark`, `--color-warning-yellow-dark`, `--color-error-red-dark`
8. Border-2 on Dialog/Alert, border on everything else (no rule)
9. `main` and `sub` identical in light mode
