# fn-5.7 First-Run Wizard

## Description

Guide user through project setup on first open with a step-by-step wizard.

**Wizard Steps:**

### Step 1: Select Project
- File picker dialog for project folder
- Validate: must contain `package.json` with `next` dependency
- Show detected info: project name, Next.js version, package manager
- Error state: "No Next.js project found"

### Step 2: Install Bridge
- Show commands that will run (using detected package manager):
  ```
  Copying @radflow/bridge to .radflow/bridge/
  Running: {pnpm|npm|yarn} add -D file:.radflow/bridge
  Adding .radflow/ to .gitignore
  ```
- "Install" button to execute
- Progress indicator during install
- Success/error feedback

### Step 3: Configure Next.js
- Show required config change:
  ```javascript
  // next.config.js
  const { withRadflow } = require('@radflow/bridge');

  module.exports = withRadflow({
    // your existing config
  });
  ```
- "Copy to clipboard" button
- Checkbox: "I've updated my next.config.js"
- Link to docs for manual setup

### Step 4: Start Dev Server
- "Start Dev Server" button
- Shows server output/logs
- Waits for `/__radflow/health` to respond
- Success: "Connected! RadFlow is ready."
- Auto-advances to main editor on success

**Skip Logic:**
- If `.radflow/bridge/` exists and `/__radflow/health` responds, skip wizard
- Store wizard completion in project config

**Re-run:**
- Settings → "Re-run Setup Wizard" option
- Useful for troubleshooting connection issues

## Acceptance

- [ ] Step 1: Select project folder (must contain `package.json` with `next`)
- [ ] Step 2: Confirm bridge installation (shows commands to run)
- [ ] Step 3: Prompt to add `withRadflow()` to config
- [ ] Step 4: Start dev server and verify connection
- [ ] Wizard skipped if project already configured
- [ ] Can re-run wizard from settings

## Files

- `src/components/FirstRunWizard.tsx`
- `src/components/wizard/Step1SelectProject.tsx`
- `src/components/wizard/Step2InstallBridge.tsx`
- `src/components/wizard/Step3ConfigureNextjs.tsx`
- `src/components/wizard/Step4StartServer.tsx`
- `src/stores/slices/wizardSlice.ts`

## Done summary

TBD

## Evidence

- Commits:
- Tests:
- PRs:
