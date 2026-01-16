# Pitfalls

Lessons learned from NEEDS_WORK feedback. Things models tend to miss.

<!-- Entries added automatically by hooks or manually via `flowctl memory add` -->

## 2026-01-16 manual [pitfall]
When counting spec compliance, extra commands beyond spec must NOT be counted toward spec percentage - count only commands that directly implement spec items

## 2026-01-16 manual [pitfall]
When reviewing write capabilities, check for existing write infrastructure (e.g., file_write.rs) that may serve different features - distinguish between 'no writes' and 'writes exist but not wired to this feature'
