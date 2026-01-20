# fn-2-zcd.30 Final verification - dev server + full functionality

## Description
Final verification that the migration is complete and the app works correctly with theme components.

## Verification Steps

### 1. Install dependencies
```bash
cd /Users/rivermassey/Desktop/dev/dna
pnpm install
```

### 2. Build theme
```bash
pnpm --filter @dna/radiants build
```

### 3. Start dev server
```bash
cd packages/radiants/apps/rad_os && pnpm dev
```

### 4. Functional testing
- Home page renders with desktop background
- Taskbar visible at bottom
- Desktop icons visible
- Click icon to open window
- Window has title bar with close/minimize buttons
- Window can be dragged
- Window can be closed
- Dialogs work correctly
- Toast notifications work
- All UI components render correctly

## Acceptance
- [ ] pnpm install succeeds
- [ ] Theme builds successfully
- [ ] Dev server starts without errors
- [ ] Home page renders desktop environment
- [ ] Windows open, close, and drag correctly
- [ ] All UI components render without errors
- [ ] No console errors in browser

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
