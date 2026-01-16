# fn-9: Write Infrastructure

## Overview

Enable bidirectional editing across all RadFlow Tauri features. Currently the application is read-only; this epic adds the write commands that make editing functional.

**Goal:** Complete the token → file write path so editors actually persist changes.

**Priority:** P0 - Critical (blocks core value proposition)

**Estimated Hours:** 35-50h

**Dependencies:** None (foundation epic)

---

## Quick Commands

```bash
# Development
cd /Users/rivermassey/Desktop/dev/radflow-tauri
pnpm tauri dev

# Verify token write works
# 1. Open Variables panel
# 2. Edit a color token value
# 3. Click Save (direct write mode)
# 4. Check CSS file updated

# Run tests
cargo test --package radflow-tauri
pnpm test

# Check Tauri commands
grep -r "pub fn" src-tauri/src/commands/
```

---

## Scope

### In Scope (from prioritized-fixes.md)

| ID | Gap | Priority | Hours |
|----|-----|----------|-------|
| P0-1 | No Token Write Commands | P0 | 4-6h |
| P0-2 | No Typography Write Commands | P0 | 6-8h |
| P0-3 | Write Commands Not Connected to Editors | P0 | 2-3h |
| P0-4 | No Component Write-Back | P0 | 8-10h |
| P0-5 | No Component Style Editing | P0 | 12-16h |
| P0-12 | Preview Mode Shows Placeholder | P0 | 4-6h |
| P0-13 | PreviewShell Not Used | P0 | (included in P0-12) |

**Note:** P0-6 (Live Component Preview) moved to fn-13 (Component Browser Enhancement) as its natural home.

### Out of Scope

- Git integration (fn-11)
- Theme system (fn-10)
- Search functionality (fn-12)

---

## Task Breakdown

### Phase 1: Token Write Infrastructure

**fn-9.1: Implement Token Write Command** (4-6h)
- Add `update_token(css_path, token_name, new_value)` to `commands/tokens.rs`
- Use existing `file_write.rs` infrastructure
- Handle CSS parsing, value replacement, file write
- Test with color tokens

**fn-9.2: Implement Typography Write Command** (6-8h)
- Create `commands/typography.rs`
- Add `update_element_style(css_path, element, property, value)`
- Target `@layer base` rules in CSS
- Handle element selectors (h1-h6, p, a, etc.)

**fn-9.3: Wire Token Editor to Write Commands** (2-3h)
- Update `VariablesPanel.tsx` to call `update_token`
- Update `TypographyPanel.tsx` to call `update_element_style`
- Make `directWriteMode` functional
- Add loading/error states

### Phase 2: Preview Mode Infrastructure

**fn-9.4: Implement Preview Mode** (4-6h)
- Refactor App.tsx to use PreviewShell in both modes
- Pass target project dev server URL to PreviewShell
- Remove placeholder content from preview mode
- Ensure DevTools not shown in preview

### Phase 3: Component Write Infrastructure

**fn-9.5: Implement Component Style Editing** (12-16h)
- Create `ComponentStyleEditor.tsx`
- Enable visual token binding
- Show computed styles
- Generate style changes as CSS

**fn-9.6: Implement Component Write-Back** (8-10h)
- Add `update_component_style()` Rust command
- Parse TSX/CSS files
- Apply style changes
- Handle different styling approaches (Tailwind, CSS modules, inline)

---

## Dependencies

```
fn-9.1 (Token Write) ─────────────┐
fn-9.2 (Typography Write) ────────┼─> fn-9.3 (Wire to Editors)
                                  │
fn-9.4 (Preview Mode) ────────────┤
                                  │
fn-9.5 (Style Editing) ───────────┼─> fn-9.6 (Write-Back)
```

---

## Acceptance Criteria

### Token Write
- [ ] Can edit token value in Variables panel
- [ ] Save button writes to CSS file
- [ ] Changes persist across reload
- [ ] Undo works (reverts to previous value)

### Typography Write
- [ ] Can edit base element styles (h1-h6, p, a)
- [ ] Save writes to `@layer base` rules
- [ ] Styleguide reflects changes immediately

### Preview Mode
- [ ] Preview mode shows actual target project
- [ ] DevTools not visible in preview
- [ ] PreviewShell component used for preview

### Component Write
- [ ] Live preview shows actual rendered component
- [ ] Can modify component styles visually
- [ ] Changes write back to source files
- [ ] Multiple styling approaches supported

---

## Technical Notes

### Token Write Approach
```rust
// src-tauri/src/commands/tokens.rs
#[tauri::command]
#[specta::specta]
pub fn update_token(
    css_path: PathBuf,
    token_name: String,
    new_value: String,
) -> Result<(), String> {
    // 1. Read CSS file
    // 2. Parse with lightningcss
    // 3. Find token declaration
    // 4. Replace value
    // 5. Write back
}
```

### Component Preview Approach
- Use iframe pointing to `http://localhost:5173/preview/{component}`
- Target project needs preview route that renders isolated component
- Pass props via postMessage or query params

---

## References

- Master Gap Report: `/docs/reviews/spec-review-master.md`
- Prioritized Fixes: `/docs/reviews/prioritized-fixes.md`
- Existing write infrastructure: `src-tauri/src/commands/file_write.rs`
- Token parsing: `src-tauri/src/commands/tokens.rs`
