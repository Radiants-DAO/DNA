# Playground Agent Integration Brainstorm

**Date:** 2026-03-15
**Status:** Decided

## What We're Building

A CLI-driven agent integration layer inside the playground tool, replacing the agentation MCP with a lighter-weight CLI + API route + SSE architecture. Three features: work signals (dithwather skeleton glow when agent is editing a component), threaded annotations on component nodes, and variation creation/display with both agent-direct and headless paths.

## Why This Approach

CLI over MCP saves tokens (MCP schemas are injected into every message), is testable from any terminal, works in CI, and needs zero special editor setup. Critically, the CLI is an **agent orchestrator** — it spawns Claude/Codex subagents from the terminal with pre-built prompts, not just a curl wrapper. This means a developer can run `rdna-playground create-variants Alert` from any terminal and get agent-generated variations without being inside a Claude session. The playground already has working generation/adoption API routes — the CLI wraps them and adds the missing signal, annotation, and orchestration layers. Skills wrap CLI commands for use when already inside a Claude session.

## Key Decisions

- **CLI as agent orchestrator, not MCP.** Zero token cost until invoked. CLI spawns Claude/Codex subagents from the terminal — a standalone developer tool, not just a proxy. Skills wrap CLI commands for use inside existing Claude sessions.
- **Glow/shimmer uses dithwather.** Dithered skeleton loader overlay on the active node — distinctive, on-brand, uses existing vendored library.
- **Work signals are explicit CLI calls.** `rdna-playground work-start <component>` / `work-end`. No file watcher magic.
- **Threaded annotations, fresh implementation.** Agentation-inspired (intent, severity, status, thread) but purpose-built for the playground. No dependency on agentation package.
- **Annotation persistence: in-memory + localStorage.** Server holds current session, browser caches for reload survival. Lost on server restart. Simplest MVP.
- **Variations: both paths.** Agent generates code directly and writes via CLI (fast, in-context), OR CLI triggers the existing `/api/playground/generate` route (headless, batch via `claude --print`).
- **Live page embedding: design for it, don't build it.** Annotation data model stays generic enough to target future live content (iframe or dev-shell wrapping), but MVP only targets canvas nodes.
- **Dev-shell wrapping is a possible future.** Playground could become the dev server that wraps apps (no iframe), with production builds stripping the shell. Not in MVP scope but noted as architectural direction.

## CLI Commands

### Core (MVP)

| Command | What it does |
|---------|-------------|
| `rdna-playground work-start <component>` | Signal agent is editing a component. Playground shows dithwather skeleton on that node |
| `rdna-playground work-end [component]` | Clear work signal. Omit component to clear all |
| `rdna-playground create-variants <component>` | Spawn a Claude/Codex subagent to generate variations. Writes files, pings playground to display |
| `rdna-playground variations list [component]` | List existing iteration files |
| `rdna-playground variations write <component> <file>` | Write an agent-generated variation file and notify playground |
| `rdna-playground variations adopt <component> <iteration>` | Adopt an iteration into the real source (lint + tsc gated) |
| `rdna-playground annotate <component> <message>` | Add a threaded annotation to a component node |
| `rdna-playground annotations [component]` | List annotations, optionally filtered by component |
| `rdna-playground status` | Show active component state (which nodes are on canvas, forced state, color mode) |

### Future (post-MVP)

| Command | What it does |
|---------|-------------|
| `rdna-playground review <component>` | Spawn agent to review a component and leave threaded annotations |
| `rdna-playground fix <component> --annotation <id>` | Spawn agent to address a specific annotation |
| `rdna-playground audit` | Spawn parallel agents to review all components |
| `rdna-playground audit --parallel <n>` | Control concurrency for batch audits |

### CLI Features

- **Tab completion** for component names (populated from registry at runtime)
- **`--model` flag** to choose Claude vs Codex for agent-spawning commands
- **`--dry-run`** to preview what would happen without executing
- **Real-time feedback** — agent-spawning commands stream progress to stdout while the playground updates live via SSE

## Variant Display Model

Variants render as a separate ReactFlow node connected via edge to the original component node. The variant node:

- Title: "POTENTIAL VARIANTS (n)"
- Contains live-rendered previews of each iteration file
- Each preview has trash (delete) and adopt (replace source) actions
- "Generate More" button at the bottom triggers another round
- Edge connects original component node → variant node

### Relevant CLI commands

| Command | What it does |
|---------|-------------|
| `rdna-playground variants show <component>` | Creates/reveals the variant node on the canvas for a component |
| `rdna-playground variants generate <component>` | Spawn agent to generate variations, display on canvas when done |
| `rdna-playground variants write <component> <file>` | Register an agent-written iteration file and display it |
| `rdna-playground variants adopt <component> <iteration>` | Adopt an iteration into real source (lint + tsc gated) |
| `rdna-playground variants trash <component> <iteration>` | Delete an iteration file and remove from canvas |
| `rdna-playground variants list [component]` | List existing iteration files |

## Build Sequence

1. **Glow/shimmer** — API route (`POST /api/agent/signal`), SSE endpoint (`GET /api/agent/signal`), browser listener that applies dithwather skeleton to the target node, CLI `work-start`/`work-end` commands. Proves the full CLI → API → SSE → browser pipe.

2. **Variations display** — UI on canvas nodes to browse/preview iteration files. CLI `variations write` (agent-direct path) and `variations generate` (headless path). Builds on existing generate/adopt routes. **Each generated variation must be run through the RDNA linter (`lint:design-system`) before being written to disk.** Violations are surfaced inline on the variation card (reuse ViolationBadge). Variations with Critical violations are rejected; High/Medium violations are shown as warnings but the variation is still displayed.

3. **Threaded annotations** — Annotation data model (intent, severity, status, thread per component). API routes for CRUD. CLI commands to read/write annotations. Canvas UI for viewing threads on nodes.

4. **Skills** — Wrap all CLI commands as Claude Code skills so the agent knows when/how to use them.

## Resolved Questions (2026-03-15)

- **Dithwather integration:** `@rdna/dithwather-react` exports `DitherSkeleton` — a React component with animated shimmer on a canvas. Wrap ComponentCard in DitherSkeleton when work signal is active. Self-contained, no DOM targeting needed.
- **Annotation data model:** Import Flow's shared types from `packages/shared/src/types/` (`AgentFeedback`, `ThreadMessage`, `FeedbackV2`). Portable — no Chrome deps. Shared vocabulary across Flow and Playground.
- **CLI location:** `tools/playground/bin/` with bin entry in playground's `package.json`. Co-located with API routes. Solo dev tool, no need for separate package.
- **SSE scope:** SSE for work signals only (`work-start`/`work-end`). Generate route stays sync. Variations use REST.
- **Planning scope:** Phases 1+2 (Glow + Variations). Annotations and Skills deferred.

## Open Questions

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
