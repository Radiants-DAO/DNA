# fn-5.7 First-Run Wizard - Summary

## Implementation

Implemented a step-by-step First-Run Wizard that guides users through project setup.

### Components Created

1. **`src/components/FirstRunWizard.tsx`** - Main wizard container with:
   - Progress stepper showing current step
   - Local zustand store for wizard state
   - Skip logic if project already configured
   - `useFirstRunWizard` hook for re-running wizard from settings

2. **`src/components/wizard/Step1SelectProject.tsx`** - Project selection step:
   - File picker dialog for project folder
   - Validates must contain `package.json` with `next` dependency
   - Shows detected info: project name, Next.js version, package manager, dev port
   - Error state for non-Next.js projects

3. **`src/components/wizard/Step2InstallBridge.tsx`** - Bridge installation step:
   - Shows terminal commands to run (using detected package manager)
   - Copy-to-clipboard for each command
   - Skips automatically if bridge already installed (`hasBridge: true`)
   - Confirmation checkbox before proceeding

4. **`src/components/wizard/Step3ConfigureNextjs.tsx`** - Config step:
   - Shows `withRadflow()` config code
   - Toggle between CommonJS (.js) and ES Modules (.mjs)
   - Copy-to-clipboard functionality
   - Instructions list
   - Confirmation checkbox

5. **`src/components/wizard/Step4StartServer.tsx`** - Server connection step:
   - "Start Dev Server" button
   - Shows server logs during startup
   - Monitors bridge connection status
   - Success state when connected
   - Auto-advances when bridge confirms connection

6. **`src/stores/slices/wizardSlice.ts`** - State management for wizard

### Settings Integration

- Added "Re-run Setup Wizard" option in LeftPanel settings menu
- Wizard is accessible via `useFirstRunWizard().openWizard()`

### Skip Logic

- Wizard skips if `.radflow/bridge/` exists and project type is Next.js
- Based on `ProjectInfo.hasBridge` field from Rust backend

## Acceptance Criteria

- [x] Step 1: Select project folder (must contain `package.json` with `next`)
- [x] Step 2: Confirm bridge installation (shows commands to run)
- [x] Step 3: Prompt to add `withRadflow()` to config
- [x] Step 4: Start dev server and verify connection
- [x] Wizard skipped if project already configured
- [x] Can re-run wizard from settings

## Files Changed

- `src/components/FirstRunWizard.tsx` (new)
- `src/components/wizard/Step1SelectProject.tsx` (new)
- `src/components/wizard/Step2InstallBridge.tsx` (new)
- `src/components/wizard/Step3ConfigureNextjs.tsx` (new)
- `src/components/wizard/Step4StartServer.tsx` (new)
- `src/components/wizard/index.ts` (new)
- `src/stores/slices/wizardSlice.ts` (new)
- `src/components/index.ts` (updated - export wizard)
- `src/components/layout/LeftPanel.tsx` (updated - settings menu)
- `src/App.tsx` (updated - render wizard)
