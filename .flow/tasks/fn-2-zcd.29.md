# fn-2-zcd.29 Remove duplicate components from app

## Description
After updating imports in Task 28, remove the now-unused component files from the app's local components/ui/ folder that have been migrated to the theme.

## Components to Remove
Delete these from `packages/radiants/apps/rad_os/components/ui/`:
- Badge/
- Divider/
- Progress/ (Spinner)
- Tooltip/
- Switch/
- Slider/
- Tabs/
- Select/
- Checkbox/ (Radio)
- Alert/
- Toast/
- Accordion/
- Breadcrumbs/
- ContextMenu/
- HelpPanel/
- CountdownTimer/
- Web3ActionBar/
- MockStatesPopover/
- Dialog/
- Popover/
- Sheet/
- DropdownMenu/

## Keep These (NOT migrated)
- Button/ (app-specific with iconName prop)
- Icon/ (app-specific icon system)
- Card/ (already in theme, keep if app has customizations)
- Input/ (already in theme)
- Desktop components (AppWindow, WindowTitleBar, etc.)

## Acceptance
- [ ] All 22 migrated component directories removed from app
- [ ] Button and Icon remain in app
- [ ] Desktop components remain in app
- [ ] Update components/ui/index.ts to remove exports for deleted components
- [ ] TypeScript compiles without errors

## Done summary
Removed 22 duplicate UI component files and hooks/useModalBehavior.ts from app. Updated index.ts to only export app-specific components (Button, Card, Input).
## Evidence
- Commits: 80218626e6359c910a838bd2479ca5e22f85451d
- Tests:
- PRs: