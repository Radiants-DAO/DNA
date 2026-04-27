# Lane 8 — Stale / Redundant Comments (2026-04-21)

**Rule:** CLAUDE.md — "default to writing no comments." WHAT-comments and task-reference comments are findings.
**Seed:** grep for `// Handle`, `// Copy`, `// Update`, etc. headers; banner comments; JSDoc blocks.
**Cap:** 20.
**Total findings:** 5.

| # | ID | File | Line | Severity | Category | Finding | Suggested fix | Effort | Cross-lane |
|---|---|---|---|---|---|---|---|---|---|
| 1 | COMMENT-001 | `packages/radiants/components/core/CountdownTimer/CountdownTimer.tsx` | 254, 266, 301 | low | what-comments | Three `// Render {ended,upcoming,active}` comments right above `return <…>` blocks. The render block makes this obvious from its JSX content. | Delete the three comments. | XS | |
| 2 | COMMENT-002 | `packages/radiants/components/core/AppWindow/AppWindow.tsx` | 565, 582 | low | what-comments | Duplicate `// Render inline if no AppWindow context (e.g., tests without AppWindow wrapper)` at two sites. | Delete both — the code reads `if (!ctx) return <inline>`; no reader needs the comment. | XS | LEGACY-001 cluster |
| 3 | COMMENT-003 | `packages/radiants/components/core/Drawer/Drawer.tsx` | 134 | low | what-comment | `// Handle container layout per direction`. The next line is the function definition with a self-describing name. | Delete. | XS | |
| 4 | COMMENT-004 | `apps/rad-os/components/Rad_os/WindowTitleBar.tsx` | 132, 145 | low | task-reference | `// Copy link to clipboard` and `// Handle action button click` — both over `handleCopyLink`/`handleActionClick`. Redundant. | Delete. | XS | |
| 5 | COMMENT-005 | `apps/rad-os/components/Rad_os/InvertModeProvider.tsx` | 51 | low | what-comment | `// Sync darkMode to the <html> element's \`dark\` class` — the effect body is two lines; self-evident. | Delete. | XS | |

## Observations

- Codebase is substantially lighter on comments than the 2026-04-16 snapshot (Wave 9 SLOP-001/002/005/006 appear to have landed).
- Many JSDoc blocks in `packages/pixel/src/shapes.ts` and `packages/radiants/components/core/*.tsx` are legitimate API docs on exported types/functions — NOT findings.
- The 15 files with `// =====` banners are all legitimate section separators in long files (`RadioDisc.tsx`, `WebGLSun.tsx`, etc.). Debatable per CLAUDE.md but intentional. Not flagging.
- Zero `TODO` / `FIXME` / `HACK` / `XXX` / `WIP` in source. Zero `@ts-ignore` with explanations. Zero `// added for …` / `// needed for …` task-reference comments.
- The one JSDoc in `Radio.tsx:28` referencing `RadioWidget` context is keep-worthy (public API context).
