# Playground Agent Integration Brainstorm

**Date:** 2026-03-15
**Status:** Decided

## What We're Building

A CLI-driven agent integration layer inside the playground tool, replacing the agentation MCP with a lighter-weight CLI + API route + SSE architecture. Three features: work signals (dithwather skeleton glow when agent is editing a component), threaded annotations on component nodes, and variation creation/display with both agent-direct and headless paths.

## Why This Approach

CLI over MCP saves tokens (MCP schemas are injected into every message), is testable from any terminal, works in CI, and needs zero special editor setup. The playground already has working generation/adoption API routes — the CLI wraps them and adds the missing signal + annotation layers. Skills teach Claude when and how to call the CLI.

## Key Decisions

- **CLI, not MCP.** Zero token cost until invoked. Skills wrap CLI commands for Claude.
- **Glow/shimmer uses dithwather.** Dithered skeleton loader overlay on the active node — distinctive, on-brand, uses existing vendored library.
- **Work signals are explicit CLI calls.** `rdna-playground work-start <component>` / `work-end`. No file watcher magic.
- **Threaded annotations, fresh implementation.** Agentation-inspired (intent, severity, status, thread) but purpose-built for the playground. No dependency on agentation package.
- **Annotation persistence: in-memory + localStorage.** Server holds current session, browser caches for reload survival. Lost on server restart. Simplest MVP.
- **Variations: both paths.** Agent generates code directly and writes via CLI (fast, in-context), OR CLI triggers the existing `/api/playground/generate` route (headless, batch via `claude --print`).
- **Live page embedding: design for it, don't build it.** Annotation data model stays generic enough to target future live content (iframe or dev-shell wrapping), but MVP only targets canvas nodes.
- **Dev-shell wrapping is a possible future.** Playground could become the dev server that wraps apps (no iframe), with production builds stripping the shell. Not in MVP scope but noted as architectural direction.

## Build Sequence

1. **Glow/shimmer** — API route (`POST /api/agent/signal`), SSE endpoint (`GET /api/agent/signal`), browser listener that applies dithwather skeleton to the target node, CLI `work-start`/`work-end` commands. Proves the full CLI → API → SSE → browser pipe.

2. **Variations display** — UI on canvas nodes to browse/preview iteration files. CLI `variations write` (agent-direct path) and `variations generate` (headless path). Builds on existing generate/adopt routes.

3. **Threaded annotations** — Annotation data model (intent, severity, status, thread per component). API routes for CRUD. CLI commands to read/write annotations. Canvas UI for viewing threads on nodes.

4. **Skills** — Wrap all CLI commands as Claude Code skills so the agent knows when/how to use them.

## Open Questions

- **Dithwather integration:** How does dithwather render as an overlay on a ReactFlow node? Need to check its API — does it take a target element, or does it render standalone?
- **Annotation UI placement:** Inline on the node (like a comment badge), in a side panel, or both?
- **CLI package name and bin entry:** `rdna-playground`? `playground`? Where does the bin script live in the monorepo?
- **Dev-shell architecture:** If we pursue the wrapping approach later, is it reverse proxy, shared layout, or middleware? Needs its own brainstorm when the time comes.

## Worktree Context

- Path: `/Users/rivermassey/Desktop/dev/DNA` (main checkout)
- Branch: `main`
- Playground location: `tools/playground/`

## Research Notes

- **Existing API routes:** `POST /api/playground/generate` (spawns `claude --print`, writes iteration files) and `POST /api/playground/adopt` (overwrites source, runs lint+tsc, rolls back on failure) are both functional.
- **Agentation:** React annotation toolbar (`agentation@^2.2.0`). Used in RadOS dev layout. Exposes `Annotation` objects with intent/severity/status/thread. Also registered as MCP server in `.codex/config.toml`.
- **Flow:** Chrome DevTools extension + MCP sidecar. 8 design tools, comment badges, fiber walking. Phase 4 of playground plan defines flow-context handoff. Flow already rebuilt agentation's annotation model internally.
- **Dithwather:** Vendored dithering library at `tools/dithwather/`. Sub-monorepo with its own Turborepo setup.
- **dark.css glow tokens:** `--shadow-glow-sm` through `--shadow-glow-xl`, status variants (`--shadow-glow-success/error/info`). Available but not used for this — dithwather skeleton is the chosen approach.
