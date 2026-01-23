# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Architecture

Layer33 is a Next.js 16 App Router application for a coalition of independent Solana validators. It uses React 19, Tailwind CSS 4, and Zustand for state management.

### Key Directories

- **app/** - Next.js App Router pages and API routes
- **components/ui/** - Design system component library (Button, Card, Dialog, etc.) - import from `@/components/ui`
- **components/33layout/** - Layout primitives (Container, Section, PagePadding, Footer)
- **components/Rad_os/** - Window management components (MobileAppModal, WindowTitleBar)
- **hooks/** - Custom React hooks (useWindowManager, useScrollHide, useStaking)
- **lib/validators/** - Validator data types and API utilities for Solana validator integration

### State Management

Zustand stores are used for:
- **hooks/useStaking.ts** - Staking interface state

### Path Aliases

Use `@/*` to import from the project root (e.g., `@/components/ui`, `@/hooks`).

### Validator Data

The app integrates with Solana validators via:
- GitHub-hosted `validators.json` for the Layer33 validator list
- Trillium API for validator performance metrics (APY, stake, skip rate)
