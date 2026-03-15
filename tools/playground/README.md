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

## CLI

From `tools/playground/`:

```bash
node bin/rdna-playground.mjs work-start button
node bin/rdna-playground.mjs work-end button
node bin/rdna-playground.mjs status
node bin/rdna-playground.mjs variations list
node bin/rdna-playground.mjs variations generate button
node bin/rdna-playground.mjs variations write button /path/to/file.tsx
node bin/rdna-playground.mjs variations trash button button.iteration-1.tsx
node bin/rdna-playground.mjs variations adopt button button.iteration-1.tsx
```

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
app/
├── globals.css              # Imports @rdna/radiants theme
├── layout.tsx               # Root layout (font-sans, light mode)
├── page.tsx                 # Landing → links to /playground
└── playground/
    ├── page.tsx             # Route entry
    ├── PlaygroundClient.tsx  # Root client shell
    ├── PlaygroundCanvas.tsx  # ReactFlow canvas
    ├── PlaygroundSidebar.tsx # Component list + controls
    ├── ComparisonView.tsx   # Side-by-side comparison
    ├── app-registry.ts      # Optional app-local registry entries
    ├── registry.tsx         # Aggregates shared, manifest-only, and app-local entries
    ├── registry.overrides.ts # Playground-only props/interface overrides
    ├── types.ts             # Shared types
    ├── api/
    │   ├── generate/
    │   │   ├── route.ts
    │   │   └── write/route.ts
    │   └── adopt/route.ts
    ├── components/          # UI components (ViewportPresetBar, ReviewChecklist)
    ├── iterations/          # Generated variation files (gitignored except .gitkeep)
    ├── lib/                 # Pure logic (storage, compare, naming, source-path policy)
    └── prompts/             # Prompt builders for Claude
```
