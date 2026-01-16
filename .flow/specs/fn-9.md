# fn-9: Context Engineering & Codebase Cleanup

## Overview

**Major pivot:** RadFlow is a **Design System Manager for LLM CLI tools** (Claude Code, Cursor, etc.), not a standalone editor that writes files directly.

This epic cleans up the codebase to reflect this vision and implements the context engineering output system.

**Core insight:** RadFlow is like Cursor's browser, but design-system-aware. It browses target projects, understands tokens/themes/components, and outputs smart context for LLMs to make changes.

---

## Goals

1. **Remove direct-write paradigm** - No file writes, no "git is save"
2. **Build edit accumulator** - Batch visual edits in the DOM
3. **Smart prompt output** - Export LLM-ready context for changes
4. **Clean codebase** - Remove dead code, update all docs

---

## Quick Commands

```bash
cd /Users/rivermassey/Desktop/dev/radflow-tauri

# Development
pnpm tauri dev

# Find direct-write references to remove
grep -r "directWrite" src/
grep -r "git.*save" docs/
grep -r "update_token" src-tauri/

# Verify cleanup
grep -r "directWriteMode" src/  # Should return nothing after cleanup

# Test accumulator
# 1. Open Variables panel
# 2. Edit a token value
# 3. See edit appear in accumulator
# 4. Cmd+C to copy as prompt
```

---

## Phase 1: Codebase Cleanup (Priority: First)

### Task 1.1: Audit & Document Direct-Write References
- Search all code for direct-write patterns
- Search docs for "git is save", "Cmd+S commits"
- Create removal checklist
- **Output:** Cleanup checklist in .flow/tasks/fn-9.1.md

### Task 1.2: Update CLAUDE.md
- Remove "Git is save" principle
- Add "Context engineering for LLM CLI tools" framing
- Update project description
- Remove direct-write references from Commands section

### Task 1.3: Update Feature Specs (docs/features/)
- 01-variables-editor.md: Remove "Save Action", "Direct write mode"
- 02-typography-editor.md: Remove direct write references
- 06-tools-and-modes.md: Remove "Direct-Edit Mode" section
- 07-search-and-navigation.md: Remove git-related shortcuts
- Add "Context Output" sections to relevant specs

### Task 1.4: Remove Direct-Write UI Code
- Remove `directWriteMode` state and toggles
- Remove Save/Write buttons (replace with Copy)
- Remove fn-7.19 (Clipboard Mode) and fn-7.20 (Direct-Edit Mode) from scope
- Clean up related store state

### Task 1.5: Archive Sunset Features
- Create `docs/archive/` folder
- Move fn-11 (Git Integration) spec to archive
- Move direct-write related specs to archive
- Update fn-11 status to 'archived' in .flow/

### Task 1.6: Remove Rust Write Commands
- Audit `src-tauri/src/commands/` for write commands
- Remove or comment out `file_write.rs` usage
- Keep read/parse commands (still needed)
- Update command registrations in `lib.rs`

---

## Phase 2: Edit Accumulator

### Task 2.1: Accumulator Store
- Create `useEditAccumulator` Zustand store
- Track edits by type (token, typography, component, style)
- Smart auto-grouping (by file when logical)
- Ephemeral (clears on app restart, no localStorage)

### Task 2.2: Accumulator UI
- Left panel overlay/tab (can split with Layers)
- Show pending edits grouped smartly
- Edit count badge
- Clear all button
- Optional: user annotations for intent

### Task 2.3: Hook Editors to Accumulator
- Variables panel → accumulates token changes
- Typography panel → accumulates text style changes
- Property panels → accumulates component style changes
- Each edit captures: what changed, old value, new value, context

---

## Phase 3: Context Output

### Task 3.1: Output Formatter
- Multiple formats: Prompt (default), Code only, Diff
- Include necessary context per edit:
  - DOM Path
  - React Component name
  - HTML Element snippet
  - File path (relative)
- Start flexible, spec format later based on learning

### Task 3.2: Copy UX
- Primary: "Copy Prompt" button in accumulator panel
- Keyboard shortcuts:
  - Cmd+C (when accumulator focused) = smart default
  - Cmd+Shift+C = full prompt with context
- Visual feedback on copy (toast/animation)

### Task 3.3: Format Preview (Optional)
- Show preview of what will be copied
- Let user adjust before copying
- (Can defer to future iteration)

---

## Acceptance Criteria

### Cleanup Complete
- [ ] No `directWriteMode` references in codebase
- [ ] No "git is save" in CLAUDE.md or docs
- [ ] fn-11 moved to docs/archive/
- [ ] Feature specs updated (01, 02, 06, 07)
- [ ] Rust write commands removed/disabled

### Accumulator Works
- [ ] Token edits accumulate in left panel
- [ ] Typography edits accumulate
- [ ] Component style edits accumulate
- [ ] Smart grouping visible
- [ ] Clear button works

### Context Output Works
- [ ] Copy button produces LLM-ready prompt
- [ ] Prompt includes: what to change, where, context
- [ ] Keyboard shortcuts work (Cmd+C, Cmd+Shift+C)
- [ ] Multiple output formats available

---

## Out of Scope (Deferred)

- Prompt output spec standardization (learn first)
- Persistence across sessions
- Git integration (archived)
- Direct file writes (sunset)
- Theme context in output (future skill)

---

## Dependencies

```
Phase 1 (Cleanup) ──────────> Phase 2 (Accumulator) ──────────> Phase 3 (Output)
     │
     └──> Can unblock fn-7 remaining tasks (UI work)
```

---

## Impact on Other Epics

| Epic | Change |
|------|--------|
| fn-7 | Remove fn-7.19, fn-7.20 from scope (direct-write modes) |
| fn-10 | Keep - theme discovery for target projects still valuable |
| fn-11 | Archive completely |
| fn-12 | Keep - search useful for browsing design system |
| fn-13-15 | Align with context output approach (browse + export, not edit) |

---

## Architecture Notes

### Edit Accumulator Shape
```typescript
interface AccumulatedEdit {
  id: string;
  type: 'token' | 'typography' | 'component' | 'style';
  target: {
    file: string;        // relative path
    selector?: string;   // CSS selector or component name
    domPath?: string;    // DOM path for context
  };
  change: {
    property: string;
    oldValue: string;
    newValue: string;
  };
  context: {
    component?: string;  // React component name
    element?: string;    // HTML snippet
  };
  annotation?: string;   // Optional user note
  timestamp: number;
}
```

### Prompt Output Example
```
Update the following design tokens in theme-rad-os:

File: packages/theme-rad-os/tokens.css

Changes:
1. --color-surface-primary: #FEF8E2 → #FFFFFF
   Context: Used as main background in Card components

2. --color-content-primary: #0F0E0C → #1A1A1A  
   Context: Primary text color, affects all body text

Apply these changes to maintain the RadOS theme's visual consistency.
```

---

## References

- Current fn-9 spec (to be replaced): `.flow/specs/fn-9.md`
- Prioritized fixes: `/docs/reviews/prioritized-fixes.md`
- Edit accumulation (fn-5.6): Already implemented base
- Archive location: `docs/archive/`
