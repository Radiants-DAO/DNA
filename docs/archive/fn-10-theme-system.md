# fn-10: Theme System (ARCHIVED)

> **ARCHIVED:** 2026-01-16
>
> **Reason:** This epic was about theme switching for RadFlow's own editor UI. With the pivot to a read-only design system browser, multi-theme support for the editor itself is low priority. The theme-rad-os package provides a consistent UI; users don't need to switch RadFlow's theme.
>
> **Clarification:** The theme system in `packages/theme-rad-os/` is still valuable for **target projects** (cross-project component portability), but RadFlow itself doesn't need dynamic theme switching.

---

## Original Overview

Implement the complete theme system that enables multi-brand workflows. Currently the editor is hardcoded to a single theme; this epic adds theme discovery, switching, and management.

**Goal:** Enable "editor is console, theme is game" architecture per spec.

---

## Why Archived

1. **RadFlow is read-only** — No need for editor theme customization
2. **Single UI theme is fine** — theme-rad-os provides consistent experience
3. **Target project themes** — RadFlow browses themes in target projects, doesn't need its own theme switcher
4. **Lower priority** — Context engineering (fn-9) is the focus

---

## What Remains Valuable

The **target project theme discovery** concept is still useful:
- RadFlow should detect themes in projects it browses
- Display theme tokens in the Variables panel
- This is browsing/reading, not switching RadFlow's UI

This functionality is covered by existing token parsing, not a separate theme switching system.

---

## Original Tasks (for reference)

| Task | Description | Hours |
|------|-------------|-------|
| fn-10.1 | Theme Type Definitions | 1-2h |
| fn-10.2 | Theme Module | 2-3h |
| fn-10.3 | Theme Discovery | 3-4h |
| fn-10.4 | Theme Switching | 4-6h |
| fn-10.5 | Decouple Editor | 2-3h |
| fn-10.6 | Theme Management UI | 4-6h |
| fn-10.7 | Color Mode Toggle | 2-3h |
| fn-10.8 | Theme Persistence | 2-3h |
| fn-10.9 | Theme Preview | 3-4h |
| fn-10.10 | Theme Validation | 3-4h |

---

## References

- Original spec: `.flow/specs/fn-10.md`
- Theme System Spec: `/docs/features/04-theme-system.md`
