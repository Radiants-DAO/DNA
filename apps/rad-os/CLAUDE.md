# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture Overview

This is a Next.js 16 application (App Router) with a custom design system and developer tooling.

### Core Technologies
- **Next.js 16** with App Router (`app/` directory)
- **React 19** with TypeScript (strict mode)
- **Tailwind CSS v4** with custom theme configuration
- **Zustand** for state management
- **react-draggable** for draggable UI elements

### Project Structure

**`components/ui/`** - Design system primitives (Button, Card, Dialog, Tabs, etc.). Import from `@/components/ui`.

**`components/Rad_os/`** - Desktop-like window components (AppWindow, WindowTitleBar, MobileAppModal) that provide draggable/resizable windows with z-index management.

**`hooks/useWindowManager.ts`** - Manages desktop-like window state (open/close, position, size, z-index focus). Used by AppWindow for multi-window UIs.

**`devtools/`** - Development-only design system tooling (RadTools):
- `DevToolsProvider.tsx` - Wraps app, toggle with `Shift+Cmd+K` / `Shift+Ctrl+K`
- `store/` - Zustand store with slices for panel, variables, typography, components, assets, mock states
- `tabs/` - Tab panels for Variables, Typography, Components, Assets, MockStates
- `lib/` - CSS parsing, component scanning, selector generation utilities

**`app/api/devtools/`** - API routes for devtools (read/write CSS, manage assets, fonts, components)

### State Management Pattern

The devtools use Zustand with a slice pattern. Each feature has its own slice in `devtools/store/slices/` combined in `devtools/store/index.ts`.

### Styling

- Tailwind v4 theme defined in `app/globals.css` using `@theme` blocks
- Custom brand colors: `--color-cream`, `--color-black`, `--color-sun-yellow`, `--color-sky-blue`, etc.
- Custom fonts: Mondwest (body), Joystix (headings), PixelCode (code)
- Font utilities: `font-mondwest`, `font-joystix`
- Path alias: `@/*` maps to project root

### DevTools (Development Only)

DevToolsProvider wraps the app and renders the RadTools panel only in development. The panel is a draggable, resizable window for inspecting/editing design tokens, typography, components, and assets.

## Project Specification

**`SPEC.md`** - The authoritative source of truth for the RadOS build. Contains all architecture decisions, app inventory, mock data shapes, and implementation phases.

## Custom Skills

Located in `.claude/skills/`, these skills provide quick reference for common tasks:

| Skill | Purpose |
|-------|---------|
| `rados` | Main entry point - architecture, window system, app patterns |
| `radtools` | Component API quick reference with copy-paste examples |
| `rados-app-scaffold` | Scaffolding new RadOS applications |

For detailed documentation, read the vault at `.vault/`:

| Topic | Vault Path |
|-------|------------|
| Architecture | `.vault/architecture/` |
| Component APIs | `.vault/components/` |
| App Patterns | `.vault/apps/` |
| Guides | `.vault/guides/` |

Use skills by mentioning them: "Use the rados-app-scaffold skill to create a new app."

## Design Resources

- **Webflow Reference**: `radiant-nexus.webflow.io` - Canonical screens at `/#brand`, `/#manifesto`, `/#market`
- **Figma MCP**: For detailed design specifications (spacing, measurements, assets), use the Figma MCP tool when available

## Reference Implementation

**`reference/rados/`** - Existing implementation with Webflow Devlink components. Use for understanding patterns and extracting designs to restyle with RadTools.
