# fn-1-cs3.3 Delete design-system page

## Description
Delete the design-system page that imports from devtools.

## File to delete
- `app/design-system/page.tsx`

The page imports `DesignSystemTab` from `@/devtools/tabs/ComponentsTab/DesignSystemTab` which will no longer exist.

## Command
```bash
rm -rf app/design-system/
```

## Context
User confirmed: design-system page should be removed entirely. Component canvas functionality will be provided by RadFlow instead.
## Acceptance
- [ ] `app/design-system/` directory deleted
- [ ] Route `/design-system` no longer accessible
## Done summary
Deleted the app/design-system/ directory which contained a page that imported from the now-deleted devtools module.
## Evidence
- Commits: 97b797267c77cc0f82718012586e9162a8b0cca9
- Tests: ls app/design-system/ - confirmed directory deleted
- PRs: