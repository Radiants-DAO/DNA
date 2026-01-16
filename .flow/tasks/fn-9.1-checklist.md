# fn-9.1 Direct-Write Audit Checklist

Generated: 2026-01-16

## Summary

| Category | Files | References |
|----------|-------|------------|
| UI Components (directWriteMode) | 8 | ~70 |
| Store/Types | 3 | ~15 |
| Docs (git is save) | 3 | ~20 |
| Rust Write Commands | 2 | 4 |

---

## 1. UI Components with `directWriteMode`

### src/components/SpacingPanel.tsx
- Line 29-30: imports directWriteMode, setDirectWriteMode
- Line 101-138: conditional write logic
- Line 156-163: toggle button UI
- Line 290: status text
- **Action:** Remove directWriteMode logic, keep clipboard-only flow

### src/components/LayoutPanel.tsx
- Line 41-42: imports directWriteMode, setDirectWriteMode
- Line 69-80: conditional write logic
- Line 172-179: toggle button UI
- Line 436: status text
- **Action:** Remove directWriteMode logic, keep clipboard-only flow

### src/components/TypographyPanel.tsx
- Line 55-56: imports directWriteMode, setDirectWriteMode
- Line 151-204: conditional write logic (3 handlers)
- Line 227-234: toggle button UI
- Line 408: status text
- **Action:** Remove directWriteMode logic, keep clipboard-only flow

### src/components/ColorsPanel.tsx
- Line 23-24: imports directWriteMode, setDirectWriteMode
- Line 66-77: conditional write logic
- Line 95-102: toggle button UI
- Line 154: status text
- **Action:** Remove directWriteMode logic, keep clipboard-only flow

### src/components/TextEditMode.tsx
- Line 30-31: imports directWriteMode, setDirectWriteMode
- Line 134-161: direct write handling
- Line 214-215: undo/redo for direct write
- Line 268-288: escape key behavior
- Line 368-379: toggle button UI
- Line 392-416: undo/redo status UI
- **Action:** Remove directWriteMode logic, simplify to text edit + accumulator

### src/components/layout/TitleBar.tsx
- Line 40-42: mode toggle ("clipboard" | "direct-edit")
- Line 80-107: ModeToggle component
- **Action:** Remove ModeToggle component entirely

### src/components/layout/RightPanel.tsx
- Line 35: comment about modes
- Line 309: title text
- Line 392: tooltip
- Line 1506, 1550, 1556: PositionSection directWriteMode
- Line 1987, 2110-2130: TypographyDetailed debounced write
- **Action:** Remove all directWriteMode references, debounce logic

### src/hooks/useTauriCommands.ts
- Line 85-99: directWriteMode exports
- **Action:** Remove directWriteMode from hook exports

---

## 2. Store & Types

### src/stores/types.ts
- Line 110-111: DirectWriteRecord interface
- Line 129: directWriteMode state
- Line 131-133: undoStack, redoStack for direct write
- Line 141: setDirectWriteMode action
- Line 146: comment about direct write operations
- Line 193: EditorMode includes "direct-edit"
- **Action:** Remove DirectWriteRecord, directWriteMode, undo/redo stacks, "direct-edit" mode

### src/stores/slices/textEditSlice.ts
- Line 2: imports DirectWriteRecord
- Line 12: directWriteMode: false initial state
- Line 28-34: setDirectWriteMode action with localStorage
- Line 91: DirectWriteRecord creation
- Line 253-261: initDirectWriteMode function
- **Action:** Remove all directWriteMode state and persistence

### src/stores/appStore.ts
- Line 56: directWriteMode in selector
- **Action:** Remove from selector

---

## 3. Docs - "Git is Save" References

### CLAUDE.md (line 59)
```
5. **Git is save** — Cmd+S commits, no ambiguous saves
```
- **Action:** Remove principle #5

### docs/features/07-search-and-navigation.md
- Line 7: Key Principle about git
- Line 148: Cmd+S shortcut
- Line 153: [Commit] description
- Line 159-188: "## Git as Save" entire section
- Line 223: Cmd+S shortcut
- Line 322: Save/Commit reference
- Line 481: Git as Save reference
- **Action:** Remove "Git as Save" section and all Cmd+S commit references

### docs/reviews/*.md (multiple files)
- Historical review documents referencing missing git-as-save
- **Action:** KEEP - these are historical records of the gap analysis

---

## 4. Rust Write Commands

### src-tauri/src/commands/mod.rs (line 7)
```rust
pub mod file_write;
```
- **Action:** Remove module import

### src-tauri/src/lib.rs (lines 143-145)
```rust
commands::file_write::preview_style_edits,
commands::file_write::write_style_edits,
commands::file_write::restore_from_backup,
```
- **Action:** Remove command registrations

### src-tauri/src/commands/file_write.rs
- Entire file implements write operations
- **Action:** Delete or archive file

---

## 5. Other Files to Update

### src/bindings.ts (line 119)
- Comment about direct write functionality
- **Action:** Remove comment or update context

---

## Verification Commands

After cleanup, these should return no results:

```bash
# No directWriteMode in source
grep -r "directWriteMode" src/

# No DirectWriteRecord
grep -r "DirectWriteRecord" src/

# No "git is save" in CLAUDE.md
grep -i "git is save" CLAUDE.md

# No "Git as Save" section in docs
grep -r "Git as Save" docs/features/

# No write commands registered
grep "file_write" src-tauri/src/lib.rs
```
