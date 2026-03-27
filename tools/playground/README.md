# DNA Playground

Component iteration and design comparison tool for RDNA themes. Uses Claude Code to generate component variations, lint them against RDNA rules, and compare baseline vs candidate side-by-side.

**This app writes source files to disk.** Generated iterations are written to `app/playground/iterations/`. The adopt flow can replace source files only inside allowlisted package/app roots: `packages/radiants/components/core/` and `apps/rad-os/components/`. Adopt targets must come from the registry, and paths containing `..` traversal are rejected before any file writes occur. Review changes carefully before committing.

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

Hook registration (in `.claude/settings.local.json`):

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

## Annotations

Humans leave structured notes on components for agents to read and act on. Annotations are injected into agent context automatically via a PreToolUse hook.

### Creating annotations

```bash
node bin/rdna-playground.mjs annotate button "Border radius should use radius-sm token" --intent fix --priority P1
node bin/rdna-playground.mjs annotate card "Try warmer background for brand refresh" --intent change --priority P3
```

Defaults: `--intent change`, `--priority` unset (null).

### Listing annotations

```bash
node bin/rdna-playground.mjs annotations                    # All annotations
node bin/rdna-playground.mjs annotations button             # For a specific component
node bin/rdna-playground.mjs annotations --status pending   # Only pending
```

### Resolving and dismissing

```bash
node bin/rdna-playground.mjs resolve <id> "Fixed with radius-sm token"
node bin/rdna-playground.mjs dismiss <id> "Not applicable to this variant"
```

### Agent integration

A PreToolUse hook at `.claude/hooks/playground-annotation-inject.sh` automatically prints pending annotations when agents edit canonical component files. In Phase 1, automatic component ID detection assumes the playground registry ID is the lowercased component directory/file name; custom `appRegistry` slugs are not auto-resolved. Agents see the annotations in their context and can resolve them via CLI after making changes.

### Annotation API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/playground/api/agent/annotation` | List all annotations |
| `GET` | `/playground/api/agent/annotation?componentId=X` | Filter by component |
| `GET` | `/playground/api/agent/annotation?status=pending` | Filter by status |
| `POST` | `/playground/api/agent/annotation` | Create, resolve, or dismiss |

POST body actions:

```json
{ "action": "annotate", "componentId": "button", "message": "...", "intent": "fix", "priority": "P1" }
{ "action": "resolve", "id": "<uuid>", "summary": "Fixed" }
{ "action": "dismiss", "id": "<uuid>", "reason": "Not applicable" }
{ "action": "clear-all" }
```

### Taxonomy

**Intent:** fix, change, question
**Priority:** P1, P2, P3, P4, or null (unset)
**Status:** pending, acknowledged, resolved, dismissed

## Agent Workflow

Two Claude Code skills automate playground operations end-to-end, connecting annotations, work signals, the fix log, and variant generation into a single loop.

**`/playground-ops`** — Opus-tier orchestrator. Handles annotation triage, autonomous queue draining, fix implementation, and variant generation. Two modes:
- **Assistant** — on-demand commands (e.g., "fix the P1 on button", "generate card variants")
- **Autonomous** — drain the priority queue: read all pending annotations sorted by priority, fix each one, resolve, repeat until empty

**`/playground-start`** — Lightweight Haiku-tier polling loop. Checks for pending annotations every N seconds and only escalates to `/playground-ops` when work exists. Saves ~80% tokens on idle ticks vs running the full ops skill every tick.

### Model Tiers

The playground uses a tiered model strategy to balance cost and capability:

| Tier | Used for |
|------|----------|
| Haiku | Polling, status checks, question acknowledgments, fix-log appends |
| Sonnet | P3/P4 fixes, change implementations, variant generation |
| Opus | P1/P2 fixes, orchestration, review pass every 5 fixes |

### Work Signal Protocol

Work signals bracket every agent modification so the playground UI reflects real-time progress. The lifecycle:

1. **`work-start <component>`** — Fire before modifying a component. Auto-fired by the PreToolUse hook for Edit/Write tool uses, but must be manually fired before CLI commands like `fix` or `create-variants`.
2. **Do the work** — implement the fix, generate variants, etc.
3. **`work-end <component>`** — Fire when done. Always manual, even on failure. Omit the component ID to clear all active signals.

### Fix Log

`docs/ops/playground-fix-log.md` is an append-only record of every design system fix made through the playground.

- Agents append via `cat >> ... <<'EOF'` — never read the file
- Entry format:

```
## YYYY-MM-DD — component [P1/fix]
**Problem:** <what was wrong>
**Resolution:** <what was done>
**Files:** <comma-separated list of modified files>
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
node bin/rdna-playground.mjs create-variants <component> [count]            # Generate via Claude with creativity ladder
node bin/rdna-playground.mjs variations list [component]                    # List iterations
node bin/rdna-playground.mjs variations write <component> <file>            # Write a local file as iteration
node bin/rdna-playground.mjs variations trash <component> <iteration-file>  # Delete an iteration
node bin/rdna-playground.mjs variations adopt <component> <iteration-file>  # Adopt into source
```

`create-variants` uses a **creativity ladder** — each variant gets a different energy level:

| Variant | Level | Description |
|---------|-------|-------------|
| 1 | Safe | Polish, refine, stay close to source |
| 2 | Improvement | Meaningful enhancement, same visual language |
| 3 | Bold | Break conventions, surprise the viewer |
| 4 | Wild | Reimagine completely, swing for the fences |
| 5+ | Beyond | Escalating experimentation, outside-UI inspiration |

Default count: 4. All variants are RDNA-lint-gated before writing.

### Annotations

```bash
node bin/rdna-playground.mjs annotate <component> "<message>" [--intent fix|change|question] [--priority P1|P2|P3|P4]
node bin/rdna-playground.mjs annotations [component] [--status pending|resolved|dismissed]
node bin/rdna-playground.mjs resolve <id> "<summary>"
node bin/rdna-playground.mjs dismiss <id> "<reason>"
```

### Visual QA

```bash
node bin/rdna-playground.mjs list-states <component> [--json]            # Show test matrix (props × color modes × states)
node bin/rdna-playground.mjs set-props <component> key=value [...] [--color-mode light|dark] [--state hover]  # Build preview URL
node bin/rdna-playground.mjs screenshot <component> [--out path] [--props key=val...] [--color-mode light|dark] [--state hover]
node bin/rdna-playground.mjs sweep <component> [--out-dir path] [--max N] [--props key=val...]  # Capture all states as PNGs
```

`list-states` generates a test matrix from the registry manifest. When Phase 2 contract fields (`styleOwnership`, `pixelCorners`, `shadowSystem`, `a11y`) are present, the matrix is enriched with data-attribute variants and QA flags. `screenshot` and `sweep` require the playground dev server to be running — they use an iframe-based capture pipeline via `html-to-image`.

### Agent fix

```bash
node bin/rdna-playground.mjs fix <component> --annotation <id>
```

Spawns Claude to address a specific annotation. On success: writes a lint-gated iteration, auto-adopts into source, and resolves the annotation. The agent gets full context: source, schema, DESIGN.md, RDNA rules, and the annotation's details.

## How it works

1. **Registry** — Aggregates three sources:
   - renderable entries from `@rdna/radiants/registry`
   - manifest-only metadata entries from packages without a shared runtime registry, when present
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
├── lib/
│   ├── api.mjs                  # Shared HTTP client (get/post/del)
│   ├── manifest.mjs             # Registry manifest reader (readFullComponent, lookupComponent)
│   ├── prompt.mjs               # Prompt builders (creativity ladder, fix)
│   └── prop-matrix.mjs          # Contract-aware test matrix generator
└── commands/
    ├── work-signal.mjs          # work-start, work-end
    ├── status.mjs               # status
    ├── variations.mjs           # list, write, trash, adopt
    ├── create-variants.mjs      # Creativity ladder variant generation
    ├── agent-fix.mjs            # Fix command (annotation → agent → adopt)
    ├── annotate.mjs             # annotate, annotations, resolve, dismiss
    ├── list-states.mjs          # Test matrix from manifest + contract fields
    ├── set-props.mjs            # Build headless preview URL
    ├── screenshot.mjs           # Capture single component state as PNG
    └── sweep.mjs                # Capture all matrix states as PNG directory
app/
├── globals.css                  # Imports @rdna/radiants theme
├── layout.tsx                   # Root layout (font-sans, light mode)
├── page.tsx                     # Redirects / → /playground
└── playground/
    ├── page.tsx                 # Route entry
    ├── PlaygroundClient.tsx      # Root client shell
    ├── PlaygroundCanvas.tsx      # ReactFlow canvas + signal wiring
    ├── PlaygroundSidebar.tsx     # Component list + controls
    ├── ComparisonView.tsx       # Side-by-side comparison
    ├── work-signal-context.ts   # React context for active work signals
    ├── annotation-context.ts    # React context for annotation counts
    ├── registry.tsx             # Aggregates shared, manifest-only, and app-local entries
    ├── registry.server.ts       # Server-side registry (no React)
    ├── types.ts                 # Shared types
    ├── api/
    │   ├── agent/
    │   │   ├── signal-store.ts      # Process-local signal pub/sub
    │   │   ├── annotation-store.ts  # Process-local annotation CRUD
    │   │   ├── signal/route.ts      # SSE stream + work signal POST
    │   │   └── annotation/route.ts  # Annotation CRUD POST + listing GET
    │   ├── generate/
    │   │   ├── route.ts         # Claude generation + iteration listing
    │   │   ├── write/route.ts   # Direct file write (RDNA-gated)
    │   │   └── [file]/route.ts  # Single-file DELETE
    │   └── adopt/route.ts       # Adopt iteration into source
    ├── hooks/
    │   ├── usePlaygroundSignals.ts      # SSE subscription hook
    │   └── usePlaygroundAnnotations.ts  # Annotation count subscription hook
    ├── components/              # UI components
    │   ├── AnnotationBadge.tsx  # Pending annotation count badge
    │   └── ...                  # ViewportPresetBar, ViolationBadge, etc.
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
