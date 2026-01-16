# fn-5.6 Edit Accumulation + File Write

## Description

Accumulate style edits in a clipboard model and write changes back to source files.

**Edit Data Structure:**
```typescript
interface StyleEdit {
  id: string;                      // UUID for undo tracking
  radflowId: RadflowId;
  componentName: string;
  source: SourceLocation;          // Required for write
  property: string;                // e.g., "color", "padding"
  oldValue: string;
  newValue: string;
  timestamp: number;
}

interface EditsState {
  edits: StyleEdit[];
  // Grouped by file for batch writing
  byFile: Map<string, StyleEdit[]>;
}
```

**Edit Flow:**
1. User changes a style in properties panel
2. Edit added to clipboard: `{ radflowId, property, oldValue, newValue, source }`
3. Live preview via `INJECT_STYLE` (immediate feedback)
4. User reviews accumulated edits in EditClipboard panel
5. User clicks "Save" → writes to source files

**File Write Strategy:**
```rust
// Rust command
#[tauri::command]
async fn write_style_edits(
  edits: Vec<StyleEdit>,
  project_root: String
) -> Result<WriteResult, String>;

struct WriteResult {
  files_modified: Vec<String>,
  backup_path: String,
}
```

**Write Guardrails:**
- Path validation: must be under `project_root`
- No writes to `node_modules/` or `.git/`
- Backup created at `.radflow/backups/{timestamp}/`
- Diff preview shown before write confirmation

**Undo Support:**
- "Undo last" removes most recent edit from clipboard
- "Clear all" removes all pending edits
- After write, edits cleared from clipboard

## Acceptance

- [ ] Edits stored as `{ radflowId, property, oldValue, newValue, source }`
- [ ] Edits grouped by source file for batch writing
- [ ] Diff preview shown before write
- [ ] Write only touches target project files (path validation)
- [ ] Backup created before write (`.radflow/backups/`)
- [ ] Clear and undo-last supported

## Files

- `src/stores/slices/editsSlice.ts`
- `src/components/EditClipboard.tsx`
- `src-tauri/src/commands/file_write.rs`
- `src/hooks/useFileWrite.ts`

## Done summary
- Added editsSlice.ts for accumulating style edits with unique IDs and timestamps
- Implemented file_write.rs with preview_style_edits, write_style_edits, and restore_from_backup commands
- Created EditClipboard.tsx component with diff preview modal and edit list UI
- Added useFileWrite.ts hook for frontend interaction with Rust commands
- Path validation ensures writes only touch target project files (not node_modules, .git)
- Backup automatically created at .radflow/backups/{timestamp}/ before each write
- Undo-last and clear-all supported in editsSlice
## Evidence
- Commits: d880e938c051f6fe349759e61fbcc9aaef07d8f2
- Tests: pnpm test, pnpm tsc --noEmit, pnpm --filter bridge build
- PRs: