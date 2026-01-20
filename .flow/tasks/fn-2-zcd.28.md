# fn-2-zcd.28 Update app imports to use theme components

## Description
Update all app component imports to use @dna/radiants for migrated components.

## Changes

Replace local imports with theme imports:
```typescript
// Before
import { Badge } from '@/components/ui'
import { Dialog, DialogContent } from '@/components/ui/Dialog'

// After
import { Badge, Dialog, DialogContent } from '@dna/radiants/components/core'
```

### Keep local imports for:
- **Button** (app-specific with iconName prop)
- **Icon** component (app-specific)
- **Desktop components** (AppWindow, WindowTitleBar, etc.)
- **App-specific components** (not in theme)

### Migration pattern for each file:
1. Find imports from `@/components/ui`
2. Check if component was migrated to theme (Tasks 6-27)
3. If migrated: change import to `@dna/radiants/components/core`
4. If not migrated (Button, Icon): keep local import
## Acceptance
- [ ] All migrated components import from @dna/radiants/components/core
- [ ] Button still imports from @/components/ui/Button
- [ ] Icon still imports from @/components/ui/Icon
- [ ] No broken imports (TypeScript compiles)
- [ ] App renders correctly with theme components
## Done summary
Updated 29 files in rad_os app to import migrated components from @dna/radiants/components/core instead of @/components/ui. Kept Button, Icon, Card, Input imports local as they have app-specific implementations.
## Evidence
- Commits: b21fb575f6aa36ac53ca23da061e8c250d2b3187
- Tests:
- PRs: