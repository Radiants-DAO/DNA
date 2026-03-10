# Upstream: design-playground

## Source

- **Repo:** https://github.com/B1u3B01t/design-playground/
- **Branch:** `master`
- **Commit SHA:** (point-in-time reference, not vendored with git history)
- **Download date:** 2026-03-08
- **License:** None declared in the repository
- **Stars:** 107 | **Forks:** 10 | **Commits:** 21

## What It Is

A drop-in Next.js App Router page (`src/app/playground/`) that provides a visual ReactFlow canvas for comparing component design variations. Components are dragged from a sidebar onto the canvas, then Cursor's agent CLI generates design variations written to disk.

## Reference Snapshot

Stored at `references/design-playground/` as documentation only. No upstream git history is preserved.

## What Was Ported Into `apps/playground`

- Route shell pattern (page → client → canvas + sidebar)
- Component registry contract (id, label, Component, defaultProps, sourcePath)
- ReactFlow canvas with custom component nodes
- Local persistence via localStorage
- Generation API route pattern (adapted from Cursor CLI to Claude CLI)
- Iteration file convention (`ComponentName.iteration-N.tsx`)

## What Was Intentionally Rewritten

- CSS/theming: replaced shadcn variables with RDNA semantic tokens
- UI primitives: replaced shadcn components with `@rdna/radiants` components
- Agent backend: replaced `cursor agent --print --force` with `claude --print`
- Registry: replaced example components with real workspace `@rdna/radiants` components
- Prompt context: injected `DESIGN.md`, schema/dna metadata, and RDNA lint expectations

## Future Upstream Diff Review

Not planned for Phase 0. If upstream tracking becomes useful post-spike, create a proper fork at that point. Do not add subtree/submodule process cost before the MVP proves useful.
