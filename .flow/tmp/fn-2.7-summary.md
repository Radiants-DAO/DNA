Implemented Text Edit Mode with contentEditable and clipboard accumulation.

**New component**: `src/components/TextEditMode.tsx` (~350 lines)
- T key toggles mode via keyboard shortcuts
- Purple mode indicator with Direct Write toggle
- Pending edits counter in top-right
- Click text elements to edit with contentEditable
- Rich text: Cmd+B (bold), Cmd+I (italic), Cmd+U (underline)
- Formatting toolbar on active edit

**Change tracking**: Uses existing textEditSlice.addPendingEdit()
- Format: `// ComponentName @ file.tsx:line\n- "old"\n+ "new"`

**Exit behavior**: Escape copies all edits to clipboard, shows toast with count

**Updates**:
- `src/components/index.ts`: Export TextEditMode
- `src/App.tsx`: Add TextEditMode overlay
- `src/hooks/useKeyboardShortcuts.ts`: Defer Escape to TextEditMode when active
