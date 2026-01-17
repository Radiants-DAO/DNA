# Pitfalls

Lessons learned from NEEDS_WORK feedback. Things models tend to miss.

<!-- Entries added automatically by hooks or manually via `flowctl memory add` -->

## 2026-01-16 manual [pitfall]
When counting spec compliance, extra commands beyond spec must NOT be counted toward spec percentage - count only commands that directly implement spec items

## 2026-01-16 manual [pitfall]
When reviewing write capabilities, check for existing write infrastructure (e.g., file_write.rs) that may serve different features - distinguish between 'no writes' and 'writes exist but not wired to this feature'

## 2026-01-16 manual [pitfall]
UI components must integrate with app state (useAppStore) from start - building UI-only mockups creates P0 integration gaps

## 2026-01-16 manual [pitfall]
Designer panel inputs must debounce in direct-write mode (500ms) to prevent excessive file writes

## 2026-01-16 manual [pitfall]
When using debounced callbacks with mode-dependent logic, capture the mode at call time (const currentMode = editorMode) to avoid race conditions during the debounce delay

## 2026-01-17 manual [pitfall]
When using git commit --amend, update evidence commit hash to post-amend SHA before marking task done
