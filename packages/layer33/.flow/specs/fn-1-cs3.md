# Remove devtools from Layer33

## Overview

Remove the custom devtools implementation (`/devtools`) from Layer33 to prepare for RadFlow integration. This includes deleting the devtools directory, API routes, design-system page, AppWindow component, and refactoring useStaking to remove mock state dependencies.

## Scope

**In scope:**
- Delete entire `devtools/` directory (45 files)
- Delete `app/api/devtools/` API routes (8 files)
- Delete `app/design-system/` page
- Delete `components/Rad_os/AppWindow.tsx`
- Remove `react-draggable` dependency
- Refactor `hooks/useStaking.ts` to remove mock state
- Remove DevToolsProvider from `app/layout.tsx`
- Update CLAUDE.md to remove devtools references
- **Sweep entire codebase for remaining devtools references**

**Out of scope:**
- Modifying `@radflow/bridge` integration (preserve)
- DNA theme migration (separate epic)

## Approach

1. **Sweep for all devtools references** - Search entire repo before deletion
2. **Delete devtools directory** - Remove entire `/devtools` folder
3. **Delete API routes** - Remove `/app/api/devtools/`
4. **Delete design-system page** - Remove `/app/design-system/`
5. **Delete AppWindow** - Remove `components/Rad_os/AppWindow.tsx` and `react-draggable`
6. **Refactor useStaking** - Remove devtools imports, return disconnected state for wallet
7. **Update layout.tsx** - Remove DevToolsProvider import
8. **Update CLAUDE.md** - Remove devtools shortcut reference
9. **Verify build** - Run `npm run build` to confirm no broken imports
10. **Smoke test** - Run dev server, load root page, verify no runtime errors

## Key Files

| File | Action | Notes |
|------|--------|-------|
| `devtools/` | DELETE | 45 files, entire directory |
| `app/api/devtools/` | DELETE | 8 API route files |
| `app/design-system/page.tsx` | DELETE | Imports from devtools |
| `components/Rad_os/AppWindow.tsx` | DELETE | Uses react-draggable |
| `hooks/useStaking.ts` | MODIFY | Remove devtools imports |
| `app/layout.tsx` | MODIFY | Remove DevToolsProvider import |
| `CLAUDE.md` | MODIFY | Remove devtools shortcut reference |
| `package.json` | MODIFY | Remove react-draggable |

## Quick commands

```bash
# BEFORE deletion: Full repo sweep for devtools references
rg "devtools" --type-add 'web:*.{ts,tsx,js,jsx,md,json,mjs,cjs}' -t web .
rg "@/devtools" .
rg "from.*devtools" .

# Verify no broken imports after deletion
npm run build

# Comprehensive post-deletion sweep (all file types)
rg "devtools" . --glob '!node_modules' --glob '!.next' --glob '!.git'

# Verify radflow still works
curl http://localhost:3000/api/radflow/health

# Runtime smoke test
npm run dev &
sleep 10
curl -s http://localhost:3000 | head -20
pkill -f "next dev"
```

## Acceptance

- [ ] Pre-deletion sweep shows only expected devtools/ references
- [ ] `devtools/` directory deleted
- [ ] `app/api/devtools/` deleted
- [ ] `app/design-system/` page deleted
- [ ] `components/Rad_os/AppWindow.tsx` deleted
- [ ] `react-draggable` removed from package.json
- [ ] `hooks/useStaking.ts` works without devtools imports
- [ ] `npm run build` passes with no errors
- [ ] Post-deletion `rg "devtools"` returns no matches (excluding .flow/)
- [ ] `npm run dev` starts without errors
- [ ] Root page loads without runtime errors
- [ ] `@radflow/bridge` integration still functional

## References

- `devtools/index.ts` - Main exports to trace dependencies
- `hooks/useStaking.ts:4-5` - DevTools imports to remove
- `app/layout.tsx:5` - DevToolsProvider import
- `next.config.ts:2` - @radflow/bridge (preserve)
