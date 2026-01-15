# fn-2.2 Project picker and file system integration

## Description

Implement project picker UI and file system integration so users can select which project folder to open on app launch.

## Technical Details

1. **Project picker UI**
   - Full-screen modal on app launch
   - "Open Project" button triggers native folder dialog
   - Recent projects list (persist to localStorage/Tauri store)
   - Show project name and path

2. **Folder dialog**
   - Use `@tauri-apps/plugin-dialog` for native folder picker
   - Validate folder contains package.json or tsconfig.json
   - Show error if invalid project structure

3. **Project state**
   - Store selected project path in Zustand
   - Persist recent projects list
   - Allow switching projects (File > Open Project)

4. **File system access**
   - Configure Tauri permissions for project folder
   - Set up scoped file system access

## References

- Tauri dialog plugin: https://tauri.app/plugin/dialog/
- Feature spec: `/docs/features/06-tools-and-modes.md:365-366`
## Acceptance
- [ ] App shows project picker on first launch
- [ ] Native folder dialog opens when clicking "Open Project"
- [ ] Invalid folders show error message
- [ ] Selected project persists across app restarts
- [ ] Recent projects shown in picker
- [ ] Can switch projects via menu
## Done summary
Project picker implemented: ProjectPicker.tsx, projectStore.ts, Tauri dialog integration
## Evidence
- Commits:
- Tests:
- PRs: