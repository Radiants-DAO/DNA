# fn-9.4 Remove Direct-Write UI Code

## Description
Remove all direct-write UI code from the React frontend.

**Changes:**
- Remove `directWriteMode` state and toggles from stores
- Remove Save/Write buttons (replace with Copy where appropriate)
- Remove fn-7.19 (Clipboard Mode) and fn-7.20 (Direct-Edit Mode) references
- Clean up any related store state
- Update any components that reference direct write functionality
## Acceptance
- [ ] No `directWriteMode` state in any store
- [ ] No Save/Write buttons in UI
- [ ] fn-7.19 and fn-7.20 removed from scope/task tracking
- [ ] `grep -r "directWriteMode" src/` returns nothing
- [ ] App builds without errors
## Done summary
# fn-9.4: Remove Direct-Write UI Code

## Summary
Removed all direct-write mode UI code from the frontend in favor of clipboard-only mode.

## Files Modified

### Store Layer
- **src/stores/types.ts**: Removed `DirectWriteRecord`, `FileModificationRecord` interfaces, `directWriteMode` state, undo/redo stacks, and conflict handling from `TextEditSlice`
- **src/stores/slices/textEditSlice.ts**: Rewrote to clipboard-only mode, removed all direct-write logic
- **src/stores/appStore.ts**: Removed `directWriteMode` from persisted state

### Hooks
- **src/hooks/useTauriCommands.ts**: Removed `directWriteMode` and `setDirectWrite` from `useTextEditMode` hook
- **src/hooks/useFileWrite.ts**: Converted to stub that returns "feature sunset" errors

### Components
- **src/components/ColorsPanel.tsx**: Removed direct-write toggle, now clipboard-only
- **src/components/SpacingPanel.tsx**: Removed direct-write toggle, now clipboard-only  
- **src/components/LayoutPanel.tsx**: Removed direct-write toggle, now clipboard-only
- **src/components/TypographyPanel.tsx**: Removed direct-write toggle, now clipboard-only
- **src/components/TextEditMode.tsx**: Removed direct-write mode, undo/redo, conflict dialog
- **src/components/layout/TitleBar.tsx**: Removed mode toggle, now shows "Clipboard" indicator
- **src/components/layout/RightPanel.tsx**: Removed `directWriteMode` from PositionSection and TypographySection

## Verification
- `npx tsc --noEmit` passes
- `cargo check` passes (src-tauri)
## Evidence
- Commits:
- Tests:
- PRs: