# Migrate rad_os app to DNA monorepo

## Overview

Migrate the rad_os desktop OS application from standalone Next.js app to the DNA monorepo, making it consume the @dna/radiants theme package. The app has been copied to `packages/radiants/apps/rad_os/`. 

**Strategy**: Copy components first, get running, then refactor tokens in batches. Don't rebuild from scratch.

## Scope

### In Scope
- Configure pnpm workspace for nested apps
- Add turborepo for build orchestration  
- Extract animations.css and base.css from globals.css to theme
- Update app config (package.json, tsconfig, layout.tsx)
- Move useModalBehavior hook to theme (required by overlay components)
- Migrate 22 UI components to theme (copy first, refactor later)
- Update app imports to use @dna/radiants
- Full functionality matches original rad_os

### Out of Scope
- Full three-file DNA pattern for all components (deferred to refactor phase)
- Moving icons to theme (refactor later)
- Automated testing (visual smoke test only)
- DevTools rewrite (keeping as reference)

## Critical Prerequisite Decisions

### 1. Font Path Resolution
**Issue**: App's globals.css references non-existent font files (`Mondwest-Regular.woff2`, `PixelCode.woff2`).
**Solution**: Theme fonts.css has working @font-face declarations with correct filenames (`Mondwest.woff2`, `Joystix.woff2`). Task 5 removes app's broken @font-face and uses theme's working fonts.

### 2. useModalBehavior Location
**Issue**: Dialog, Popover, Sheet, DropdownMenu depend on useModalBehavior hook. If hook stays in app while components move to theme, theme would depend on app (reverse dependency).
**Solution**: Move useModalBehavior to theme FIRST (new Task 1.5), before migrating overlay components.

### 3. Button Strategy  
**Issue**: App's Button uses `iconName` prop + Icon component. Theme's Button uses generic slots.
**Solution**: Keep both Buttons. App imports its Button locally. When migrating overlay components, use relative import for app's Button. Later task creates adapter.

### 4. Scrollbar Asset
**Issue**: Scrollbar CSS uses `url('/scrollbar-background.svg')`
**Solution**: Copy `scrollbar-background.svg` to theme's assets in Task 2 (along with animations.css and base.css).

## Approach

### Phase 0: Preparation
1. Configure pnpm workspace + turbo.json
31. Move useModalBehavior hook to theme (depends on Task 1)

### Phase 1: Theme CSS (Task 2)
2. CREATE animations.css + base.css + copy scrollbar-background.svg to theme

**Verification Gate**: Theme builds successfully (`pnpm --filter @dna/radiants build`)

### Phase 2: App Configuration (Tasks 3-5)
3. Update app package.json with @dna/radiants dependency
4. Update app tsconfig.json paths
5. Update app globals.css to import from theme (remove duplicate @font-face, @keyframes, scrollbar styles)

**Verification Gate**: App dev server starts (`cd packages/radiants/apps/rad_os && pnpm dev`)

### Phase 3: Component Migration (Tasks 6-27)
Copy 22 parent components from app to theme (Button, Input, Card already in theme = 19 to migrate):

- **Tier 1 (Simple)**: Badge, Divider, Progress/Spinner, Tooltip, Switch, Slider
- **Tier 2 (Forms)**: Tabs, Select, Checkbox/Radio, Alert
- **Tier 3 (Feedback)**: Toast, Accordion, Breadcrumbs
- **Tier 4 (Overlay helpers)**: ContextMenu, HelpPanel, CountdownTimer, Web3ActionBar, MockStatesPopover
- **Tier 5 (Complex overlays)**: Dialog, Popover, Sheet, DropdownMenu (use useModalBehavior from theme)

**Note**: Tier 5 components depend on useModalBehavior which was moved in Task 31.

**Component Count Clarification**: 22 parent components total. Sub-components are bundled with their parent in the same task:
- Card includes CardHeader, CardBody, CardFooter
- Tabs includes TabList, TabTrigger, TabContent
- Dialog includes DialogTrigger, DialogContent, DialogHeader, etc.
- etc.

**Verification Gate**: All components export correctly from theme index

### Phase 4: Integration (Tasks 28-30)
28. Update all app imports to use theme components
29. Remove duplicate UI components from app
30. Final verification - dev server + full functionality

## Key Decisions Summary

| Decision | Resolution |
|----------|------------|
| Button API | Keep separate. App uses local Button with iconName. |
| useModalBehavior | Moves to theme in Task 31 (before overlay components) |
| Icon system | Stays in app. Theme components use slots. |
| Token refactoring | Deferred. Copy with brand tokens, refactor in batches later. |
| Fonts | Use theme's fonts.css. Remove duplicates from app. |
| Scrollbar SVG | Copy to theme in Task 2 |

## Token Mapping Reference

When refactoring tokens later:
- `font-joystix` → `font-heading`
- `font-mondwest` → `font-sans`
- `bg-warm-cloud` → `bg-surface-primary`
- `bg-black` → `bg-surface-secondary`
- `text-black` → `text-content-primary`
- `text-cream` → `text-content-inverted`
- `border-black` → `border-edge-primary`
- `ring-sun-yellow` → `ring-edge-focus`
- `border-sun-red` → `border-status-error`

## Quick commands

```bash
# Install dependencies
pnpm install

# Build theme (verification gate after Task 2)
pnpm --filter @dna/radiants build

# Start dev server (verification gate after Task 5)
cd packages/radiants/apps/rad_os && pnpm dev

# Build all
pnpm turbo build
```

## Acceptance

- [ ] pnpm workspace includes nested apps pattern
- [ ] turbo.json configures build pipeline
- [ ] useModalBehavior hook exists in theme
- [ ] animations.css, base.css, scrollbar-background.svg exist in theme
- [ ] Theme builds successfully
- [ ] App dev server starts without errors
- [ ] All 22 UI components migrated to theme
- [ ] App imports from @dna/radiants for theme components
- [ ] Home page renders with desktop, taskbar, icons
- [ ] Windows can open, close, drag
- [ ] Full functionality matches original rad_os

## Rollback Plan

If migration fails at any phase:
1. App still has all original components in `components/ui/`
2. Revert globals.css imports to local definitions
3. Theme package changes don't affect app if imports reverted
4. Git stash/reset to last known working state

## References

- Theme spec: `docs/theme-spec.md`
- App globals.css: `packages/radiants/apps/rad_os/app/globals.css`
- UI components: `packages/radiants/apps/rad_os/components/ui/index.ts`
- useModalBehavior: `packages/radiants/apps/rad_os/components/ui/hooks/useModalBehavior.ts`
- pnpm workspace: `pnpm-workspace.yaml`
