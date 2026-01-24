# fn-1-cs3.6 Delete AppWindow and remove react-draggable

## Description
Delete AppWindow.tsx and remove react-draggable dependency.

## Files to delete
- `components/Rad_os/AppWindow.tsx`

## Check for other Rad_os files
First verify if other files in `components/Rad_os/` depend on AppWindow:
```bash
grep -r "AppWindow" components/Rad_os/
```

If entire Rad_os directory is orphaned, delete the whole directory.

## Remove dependency
```bash
npm uninstall react-draggable
```

## Verify
- Check no other files import react-draggable
- Check no other files import AppWindow
## Acceptance
- [x] `components/Rad_os/AppWindow.tsx` deleted
- [x] `react-draggable` removed from package.json
- [x] No other files import AppWindow
- [x] No other files import react-draggable
## Done summary
Deleted AppWindow.tsx and removed react-draggable dependency
## Evidence
- Commits: de8722f
- Tests: npm run lint
- PRs: