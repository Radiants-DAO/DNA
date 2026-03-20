# Migration Guide: rad_os to DNA Monorepo

**Epic:** fn-2-zcd
**Status:** Complete
**Date:** 2026-01-20

This document captures the migration of the rad_os desktop OS application from a standalone Next.js app to the DNA monorepo, making it consume the `@rdna/radiants` theme package.

---

## Overview

**Source:** Standalone rad_os Next.js app
**Target:** `apps/rad-os/` in DNA monorepo
**Strategy:** Copy first, get running, then refactor tokens in batches

### What Was Migrated
- 22 UI components to theme (`@rdna/radiants/components/core`)
- Shared hooks (useModalBehavior) to theme
- CSS (animations, base styles, scrollbar assets)
- App configuration (package.json, tsconfig, globals.css)

### What Stayed in App
- Button (app-specific with `iconName` prop)
- Icon component (app-specific icon system)
- Desktop components (AppWindow, WindowTitleBar, etc.)

---

## Prerequisites

### 1. Monorepo Structure
```
dna/
├── packages/
│   └── radiants/           # @rdna/radiants theme package
│       ├── components/
│       │   └── core/       # Theme components
│       ├── hooks/          # Shared hooks
│       └── assets/         # Theme assets
├── apps/
│   └── rad-os/             # RadOS showcase app
├── tools/
│   └── playground/         # Component playground + agent workflow surface
├── pnpm-workspace.yaml
└── turbo.json
```

### 2. Required Files at Repo Root

**pnpm-workspace.yaml:**
```yaml
packages:
  - "packages/*"
  - "packages/*/apps/*"
```

**turbo.json:**
```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```

---

## Phase 0: Preparation

### Task 1: Configure pnpm workspace + turbo.json
- Create `pnpm-workspace.yaml` with nested apps pattern
- Create `turbo.json` for build orchestration

### Task 31: Move useModalBehavior hook to theme
**Critical:** This must happen BEFORE migrating overlay components (Dialog, Popover, Sheet, DropdownMenu) to avoid reverse dependency.

**Location:** `packages/radiants/hooks/useModalBehavior.ts`

**Exports:**
```typescript
export { useEscapeKey, useClickOutside, useLockBodyScroll } from './useModalBehavior';
```

---

## Phase 1: Theme CSS

### Task 2: Create animations.css, base.css, and assets

**animations.css** - Extract `@keyframes` from app's globals.css:
- fadeIn, fadeOut
- slideUp, slideDown
- pulse, spin
- etc.

**base.css** - Extract root/body styles:
- Scrollbar styling
- Selection colors
- Root variables

**assets/scrollbar-background.svg** - Copy scrollbar asset

---

## Phase 2: App Configuration

### Task 3: Update app package.json
```json
{
  "dependencies": {
    "@rdna/radiants": "workspace:*"
  }
}
```

### Task 4: Update app tsconfig.json
```json
{
  "compilerOptions": {
    "paths": {
      "@rdna/radiants": ["../../index.css"],
      "@rdna/radiants/*": ["../../*"]
    }
  }
}
```

### Task 5: Update app globals.css
Replace 500+ lines with:
```css
/* Import theme styles */
@import '@rdna/radiants';
@import '@rdna/radiants/dark';

/* App-specific overrides (if any) */
```

**Verification Gate:** `cd apps/rad-os && pnpm dev`

---

## Phase 3: Component Migration

### Migration Pattern

For each component:

1. **Copy** from `app/components/ui/` to `packages/radiants/components/core/`
2. **Update imports** - Change relative paths to theme paths
3. **Handle hooks** - For overlay components, import from `@rdna/radiants/hooks`
4. **Export** from `components/core/index.ts`

### Component Tiers

**Tier 1 (Simple):** Badge, Divider, Progress/Spinner, Tooltip, Switch, Slider

**Tier 2 (Forms):** Tabs, Select, Checkbox/Radio, Alert

**Tier 3 (Feedback):** Toast, Accordion, Breadcrumbs

**Tier 4 (Overlay helpers):** ContextMenu, HelpPanel, CountdownTimer, Web3ActionBar, MockStatesPopover

**Tier 5 (Complex overlays):** Dialog, Popover, Sheet, DropdownMenu
- These depend on useModalBehavior from theme
- Import: `import { useEscapeKey, useClickOutside, useLockBodyScroll } from '@rdna/radiants/hooks'`

### Component Structure
```
components/core/
├── index.ts              # Barrel export
├── Badge/
│   └── Badge.tsx
├── Dialog/
│   └── Dialog.tsx        # Includes DialogTrigger, DialogContent, etc.
└── ...
```

---

## Phase 4: Integration

### Task 28: Update app imports
```typescript
// Before
import { Badge } from '@/components/ui'
import { Dialog, DialogContent } from '@/components/ui/Dialog'

// After
import { Badge, Dialog, DialogContent } from '@rdna/radiants/components/core'
```

**Keep local:**
- Button (app-specific with iconName)
- Icon (app-specific)
- Desktop components

### Task 29: Remove duplicate components
Delete migrated component files from `app/components/ui/`:
- All 22 migrated component directories
- `hooks/useModalBehavior.ts`

Update `components/ui/index.ts` to only export remaining local components.

### Task 30: Final verification
```bash
pnpm install
pnpm --filter @rdna/radiants build  # if applicable
cd apps/rad-os && pnpm dev
```

---

## Key Decisions

| Decision | Resolution |
|----------|------------|
| Button API | Keep separate. App uses local Button with iconName. |
| useModalBehavior | Moved to theme FIRST (Task 31) before overlay components |
| Icon system | Stays in app. Theme components use slots. |
| Token refactoring | Deferred. Copy with brand tokens, refactor later. |
| Fonts | Use theme's fonts.css. Remove duplicates from app. |
| Scrollbar SVG | Copied to theme assets in Task 2 |

---

## Token Mapping Reference

For future refactoring to semantic tokens:

| Brand Token | Semantic Token |
|-------------|----------------|
| `font-joystix` | `font-heading` |
| `font-mondwest` | `font-sans` |
| `bg-warm-cloud` | `bg-page` |
| `bg-black` | `bg-inv` |
| `text-black` | `text-main` |
| `text-cream` | `text-flip` |
| `border-black` | `border-line` |
| `ring-sun-yellow` | `ring-focus` |
| `border-sun-red` | `border-danger` |

---

## Troubleshooting

### Import errors after migration
- Check that component is exported from `@rdna/radiants/components/core/index.ts`
- Verify tsconfig paths are correct
- Run `pnpm install` to link workspace packages

### useModalBehavior not found
- Ensure hooks are exported from `@rdna/radiants/hooks`
- Check import path in overlay components

### Fonts not loading
- Theme's `fonts.css` should have correct `@font-face` declarations
- App's globals.css should import theme (not duplicate @font-face)

### TypeScript errors
- Check for missing peer dependencies (react, react-dom, next)
- Ensure theme package.json has proper peerDependencies

---

## Commits (fn-2-zcd)

| Task | Commit | Description |
|------|--------|-------------|
| 1 | Initial | pnpm workspace + turbo.json |
| 2-5 | Various | Theme CSS + app config |
| 6-27 | Various | Component migrations |
| 28 | b21fb57 | Update app imports |
| 29 | 8021862 | Remove duplicate components |
| 30 | 1cfb6d3 | Final verification + fixes |
| 31 | Various | useModalBehavior to theme |

---

## Next Steps

After migration, consider:
1. **Token refactoring** - Convert brand tokens to semantic naming
2. **Three-file pattern** - Add `.schema.json` and `.dna.json` to components
3. **Motion tokens** - Add duration and easing tokens
4. **Package exports** - Proper exports field in theme package.json

See: `docs/theme-spec.md` for full DNA specification.
