# fn-7.24 Welcome Screen - Project picker and recent projects

## Description
Implement a welcome screen shown when RadFlow launches without a project open. Displays recent projects and allows opening new projects.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    ╭─────────────╮                      │
│                    │   RadFlow   │                      │
│                    ╰─────────────╯                      │
│                                                         │
│     Recent Projects                                     │
│     ┌─────────────────────────────────────────────┐     │
│     │ 📁 my-app           ~/Desktop/dev/my-app    │     │
│     │    Last opened: 2 hours ago                 │     │
│     ├─────────────────────────────────────────────┤     │
│     │ 📁 design-system    ~/work/design-system    │     │
│     │    Last opened: Yesterday                   │     │
│     ├─────────────────────────────────────────────┤     │
│     │ 📁 landing-page     ~/projects/landing      │     │
│     │    Last opened: 3 days ago                  │     │
│     └─────────────────────────────────────────────┘     │
│                                                         │
│     [Open Project...]    [+ New Project]                │
│                                                         │
│     ─────────────────────────────────────────────       │
│     Quick Actions                                       │
│     [📖 Documentation]  [⚙️ Settings]  [? Help]         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Recent Projects:**
- Stored in localStorage or Tauri's app data directory
- Shows project name, path, and last opened time
- Click to open project
- Right-click for context menu (Remove from list, Open in Finder)
- Maximum 10 recent projects

**Actions:**
- **Open Project**: Opens native file picker (Tauri dialog)
- **New Project**: Future feature, grayed out for V1
- **Documentation**: Opens docs in browser
- **Settings**: Opens settings panel
- **Help**: Opens help/support page

**Project Detection:**
- Validates selected folder contains package.json
- Warns if no Next.js/React detected
- Stores project in recents on successful open

## Acceptance
- [ ] Welcome screen shown when no project open
- [ ] RadFlow logo/branding
- [ ] Recent projects list (up to 10)
- [ ] Recent projects sorted by last opened
- [ ] Click recent project to open
- [ ] Right-click context menu on recent projects
- [ ] "Open Project" button triggers file picker
- [ ] Project validation (package.json exists)
- [ ] Warning for non-React projects
- [ ] Quick action buttons (Docs, Settings, Help)
- [ ] Keyboard navigation (arrow keys + Enter)
- [ ] Empty state for first-time users

## Files
- `src/components/welcome/WelcomeScreen.tsx`
- `src/stores/slices/recentProjectsSlice.ts`
- `src/utils/projectValidation.ts`
- Integration with Tauri file dialog

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
