# DNA Playground

Component iteration and design comparison tool for RDNA themes. Uses Claude Code to generate component variations, lint them against RDNA rules, and compare baseline vs candidate side-by-side.

**This app writes source files to disk.** Generated iterations are written to `app/playground/iterations/`. The adopt flow can replace source files only inside allowlisted package/app roots: `packages/radiants/components/core/`, `packages/monolith/components/core/`, `apps/rad-os/components/`, and `apps/radiator/src/components/`. Adopt targets must come from the registry, and paths containing `..` traversal are rejected before any file writes occur. Review changes carefully before committing.

## Prerequisites

- Node.js 18+
- pnpm (workspace-managed)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated — required for the `/playground/api/generate` route

## Setup

```bash
# From the monorepo root
pnpm install
pnpm --filter @rdna/playground dev
```

Opens at [http://localhost:3004](http://localhost:3004).

## Scripts

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Start dev server (port 3004) |
| `pnpm build` | Production build |
| `pnpm test` | Run vitest suite |
| `pnpm test:watch` | Run vitest in watch mode |
| `pnpm verify:iterations` | Lint generated iteration files against RDNA rules |
| `pnpm violations:generate` | Regenerate RDNA violations manifest for the UI |
| `pnpm typecheck` | Run TypeScript type checking |

## Live Work Signals

The playground shows real-time visual feedback when agents are modifying components. A glowing overlay with status text appears on the component card while work is in progress, and a checkmark flash plays on completion.

### How it works

1. A **process-local signal store** tracks which components are actively being worked on
2. An **SSE endpoint** streams signal changes to all connected browsers
3. The **canvas** subscribes via `usePlaygroundSignals` and renders a `WorkSignalOverlay` on affected cards
4. When work ends, the overlay transitions to a completion flash (checkmark + dissolve) before disappearing

Signals are ephemeral — they reset when the dev server restarts.

### Automatic signaling via hook

A PreToolUse hook at `.claude/hooks/playground-work-signal.sh` fires `work-start` automatically when any agent edits files inside component directories. The hook:

- Checks if the playground is running on port 3004 (fails silently if not)
- Extracts the component ID from the file path (`packages/*/components/core/Button/` → `button`)
- Fires `work-start` via the signal API (idempotent — repeated calls are no-ops)

**Agents must fire `work-end` manually** when they finish modifying a component:

```bash
node tools/playground/bin/rdna-playground.mjs work-end <component-id>
# or clear all signals:
node tools/playground/bin/rdna-playground.mjs work-end
```

Hook registration (in `.claude/settings.json`):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/playground-work-signal.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### Signal API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/playground/api/agent/signal` | SSE stream of signal events |
| `GET` | `/playground/api/agent/signal?format=json` | JSON snapshot of active signals |
| `POST` | `/playground/api/agent/signal` | Send a signal command |

POST body actions:

```json
{ "action": "work-start", "componentId": "button" }
{ "action": "work-end", "componentId": "button" }
{ "action": "clear-all" }
```

## CLI

From `tools/playground/` (or anywhere via `npx rdna-playground`):

### Work signals

```bash
node bin/rdna-playground.mjs work-start <component>   # Signal work in progress
node bin/rdna-playground.mjs work-end [component]      # Signal completion (omit component to clear all)
node bin/rdna-playground.mjs status                    # Show active signals + iteration counts
```

### Variation lifecycle

```bash
node bin/rdna-playground.mjs variations list [component]                    # List iterations
node bin/rdna-playground.mjs variations generate <component> [count]        # Generate via Claude
node bin/rdna-playground.mjs variations write <component> <file>            # Write a local file as iteration
node bin/rdna-playground.mjs variations trash <component> <iteration-file>  # Delete an iteration
node bin/rdna-playground.mjs variations adopt <component> <iteration-file>  # Adopt into source
```

All variation commands go through server routes — the CLI never writes files directly. Every write is RDNA-lint-gated, and the browser refreshes automatically via SSE.

## How it works

1. **Registry** — Aggregates three sources:
   - renderable entries from `@rdna/radiants/registry`
   - manifest-only metadata entries from packages without a shared runtime registry (currently `@rdna/monolith`)
   - optional app-local entries from `app-registry.ts`
   The sidebar groups entries by package, then category. Metadata-only entries are visible for inspection but cannot be dragged onto the canvas or opened in compare mode.

2. **Canvas** — Drag components from the sidebar onto a ReactFlow canvas. Canvas state persists to localStorage.

3. **Compare** — Click "vs" on any component to enter comparison mode. Baseline (current implementation) renders alongside the candidate (generated iteration). Switch viewport presets and Sun/Moon mode to review.

4. **Generate** — `POST /playground/api/generate` with `{ componentId, variationCount? }`. Spawns `claude --print` with a prompt containing DESIGN.md, source code, schema, and 19 RDNA rules.

5. **Adopt** — `POST /playground/api/adopt` with `{ componentId, iterationFile }`. Validates that the target source path exists in the registry and inside the adoption allowlist, rejects traversal and cross-component iteration filenames, copies the iteration file over the source implementation, runs RDNA ESLint + package TypeScript checks, and rolls back on failure.

6. **Violations** — Run `pnpm violations:generate` to scan registered components and iteration files with RDNA ESLint rules. Results appear as badges in the sidebar and canvas nodes (red for errors, yellow for warnings). Click a badge to see rule details.

## File structure

```
bin/
├── rdna-playground.mjs          # CLI entry point
├── lib/api.mjs                  # Shared HTTP client (get/post/del)
└── commands/
    ├── work-signal.mjs          # work-start, work-end
    ├── status.mjs               # status
    └── variations.mjs           # list, generate, write, trash, adopt
app/
├── globals.css                  # Imports @rdna/radiants theme
├── layout.tsx                   # Root layout (font-sans, light mode)
├── page.tsx                     # Landing → links to /playground
└── playground/
    ├── page.tsx                 # Route entry
    ├── PlaygroundClient.tsx      # Root client shell
    ├── PlaygroundCanvas.tsx      # ReactFlow canvas + signal wiring
    ├── PlaygroundSidebar.tsx     # Component list + controls
    ├── ComparisonView.tsx       # Side-by-side comparison
    ├── work-signal-context.ts   # React context for active work signals
    ├── registry.tsx             # Aggregates shared, manifest-only, and app-local entries
    ├── registry.server.ts       # Server-side registry (no React)
    ├── types.ts                 # Shared types
    ├── api/
    │   ├── agent/
    │   │   ├── signal-store.ts  # Process-local signal pub/sub
    │   │   └── signal/route.ts  # SSE stream + POST commands
    │   ├── generate/
    │   │   ├── route.ts         # Claude generation + iteration listing
    │   │   ├── write/route.ts   # Direct file write (RDNA-gated)
    │   │   └── [file]/route.ts  # Single-file DELETE
    │   └── adopt/route.ts       # Adopt iteration into source
    ├── hooks/
    │   └── usePlaygroundSignals.ts  # SSE subscription hook
    ├── components/              # UI components (ViewportPresetBar, etc.)
    ├── iterations/              # Generated variation files (gitignored)
    ├── lib/
    │   ├── iteration-naming.ts      # Parse/sort/filter iteration filenames
    │   ├── iterations.server.ts     # Server helpers (list, group, write, resolve)
    │   ├── playground-signal-event.ts # SSE event parser
    │   ├── work-overlay.ts          # Overlay phase logic + status copy
    │   ├── source-path-policy.ts    # Adoption allowlist
    │   └── code-blocks.ts           # Extract TSX from Claude output
    └── prompts/                 # Prompt builders for Claude
```
