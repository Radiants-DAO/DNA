# Playground CLI Agent Integration — Phases 1+2 (Glow + Variations)

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Add a CLI that orchestrates agent work signals (dithwather glow on canvas nodes) and variation generation/management, connected to the playground via SSE and REST.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA` (main checkout, branch `main`)

**Architecture:** CLI (`tools/playground/bin/rdna-playground.mjs`) sends HTTP requests to Next.js API routes. Work signals flow through a dedicated SSE endpoint (`GET /api/agent/signal`) for instant browser updates. Variation commands wrap existing `generate` and `adopt` routes, plus a new `write` path for agent-direct iteration creation with RDNA lint gating. `DitherSkeleton` from `@rdna/dithwather-react` renders as an overlay on active ComponentCards.

**Tech Stack:** Node.js (ESM, `.mjs` — matches existing scripts), Next.js API routes, SSE (native `ReadableStream`), `@rdna/dithwather-react`, `@flow/shared` types (future annotations phase)

---

## Conventions & References

- **Existing API routes:** `tools/playground/app/playground/api/generate/route.ts` (POST/GET/DELETE) and `api/adopt/route.ts` (POST)
- **Existing verify script:** `tools/playground/scripts/verify-generated-variation.mjs` — runs RDNA ESLint on iteration files
- **Existing lib:** `lib/iteration-naming.ts` (parse/filter/sort), `lib/code-blocks.ts` (extract from Claude output), `lib/source-path-policy.ts` (adoption validation)
- **Canvas:** Section nodes render `ComponentCard` as div children. `IterationMapContext` shares iteration data from `GET /api/generate`.
- **DitherSkeleton props:** `width`, `height`, `speed`, `color`, `bgColor`, `opacity`, `algorithm`, `pixelScale`, `className`, `style` — renders `<div>` wrapping animated `<canvas>`
- **Playground port:** `3004` (declared in `package.json` → `dna.port`)
- **Test runner:** `vitest` — run with `pnpm --filter @rdna/playground test`
- **RDNA lint:** `pnpm exec eslint --config eslint.rdna.config.mjs <file>` from monorepo root

---

## Phase 1: Work Signals (Glow)

### Task 1: Signal Store — In-Memory Server State

A singleton module that holds active work signals and manages SSE client connections.

**Files:**
- Create: `tools/playground/app/playground/api/agent/signal-store.ts`
- Test: `tools/playground/app/playground/lib/__tests__/signal-store.test.ts`

**Step 1: Write the failing test**

```ts
// signal-store.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { signalStore } from "../../api/agent/signal-store";

beforeEach(() => {
  signalStore.clearAll();
});

describe("signalStore", () => {
  it("starts with no active signals", () => {
    expect(signalStore.getActive()).toEqual([]);
  });

  it("records a work-start signal", () => {
    signalStore.workStart("button");
    expect(signalStore.getActive()).toEqual(["button"]);
  });

  it("removes a work-end signal", () => {
    signalStore.workStart("button");
    signalStore.workEnd("button");
    expect(signalStore.getActive()).toEqual([]);
  });

  it("clearAll removes everything", () => {
    signalStore.workStart("button");
    signalStore.workStart("alert");
    signalStore.clearAll();
    expect(signalStore.getActive()).toEqual([]);
  });

  it("notifies subscribers on change", () => {
    const events: string[][] = [];
    const unsub = signalStore.subscribe((active) => events.push([...active]));
    signalStore.workStart("button");
    signalStore.workEnd("button");
    unsub();
    expect(events).toEqual([["button"], []]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd tools/playground && pnpm test -- --run app/playground/lib/__tests__/signal-store.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```ts
// signal-store.ts
type Listener = (active: string[]) => void;

class SignalStore {
  private active = new Set<string>();
  private listeners = new Set<Listener>();

  getActive(): string[] {
    return [...this.active];
  }

  workStart(componentId: string): void {
    this.active.add(componentId);
    this.notify();
  }

  workEnd(componentId: string): void {
    this.active.delete(componentId);
    this.notify();
  }

  clearAll(): void {
    this.active.clear();
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const snapshot = this.getActive();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export const signalStore = new SignalStore();
```

**Step 4: Run test to verify it passes**

Run: `cd tools/playground && pnpm test -- --run app/playground/lib/__tests__/signal-store.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add tools/playground/app/playground/api/agent/signal-store.ts tools/playground/app/playground/lib/__tests__/signal-store.test.ts
git commit -m "feat(playground): add signal store for work-start/work-end state"
```

---

### Task 2: SSE Endpoint — `GET /api/agent/signal`

Streams signal state changes to the browser. Uses `ReadableStream` (Next.js App Router pattern).

**Files:**
- Create: `tools/playground/app/playground/api/agent/signal/route.ts`

**Step 1: Write the route**

```ts
// route.ts
import { signalStore } from "../signal-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send current state immediately
      const initial = JSON.stringify({ type: "snapshot", active: signalStore.getActive() });
      controller.enqueue(encoder.encode(`data: ${initial}\n\n`));

      // Subscribe to changes
      const unsub = signalStore.subscribe((active) => {
        const event = JSON.stringify({ type: "update", active });
        controller.enqueue(encoder.encode(`data: ${event}\n\n`));
      });

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 30_000);

      // Cleanup on close — ReadableStream cancel signal
      const cleanup = () => {
        unsub();
        clearInterval(heartbeat);
      };

      // Store cleanup for cancel()
      (controller as unknown as Record<string, unknown>).__cleanup = cleanup;
    },
    cancel(controller) {
      const cleanup = (controller as unknown as Record<string, unknown>).__cleanup as (() => void) | undefined;
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
```

**Step 2: Manual test**

Run playground: `pnpm --filter @rdna/playground dev`
In another terminal: `curl -N http://localhost:3004/playground/api/agent/signal`
Expected: receive `data: {"type":"snapshot","active":[]}`

**Step 3: Commit**

```bash
git add tools/playground/app/playground/api/agent/signal/route.ts
git commit -m "feat(playground): add SSE endpoint for work signals"
```

---

### Task 3: Signal POST Endpoint — `POST /api/agent/signal`

Receives `work-start` and `work-end` commands from the CLI.

**Files:**
- Modify: `tools/playground/app/playground/api/agent/signal/route.ts` (add POST handler)

**Step 1: Add POST handler to the existing route file**

Append to `route.ts`:

```ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.action || !body?.componentId) {
    return NextResponse.json(
      { error: "Missing action or componentId" },
      { status: 400 },
    );
  }

  const { action, componentId } = body;

  if (action === "work-start") {
    signalStore.workStart(componentId);
  } else if (action === "work-end") {
    signalStore.workEnd(componentId);
  } else if (action === "clear-all") {
    signalStore.clearAll();
  } else {
    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    active: signalStore.getActive(),
  });
}
```

**Step 2: Manual test**

```bash
# Start signal
curl -X POST http://localhost:3004/playground/api/agent/signal \
  -H 'Content-Type: application/json' \
  -d '{"action":"work-start","componentId":"button"}'

# Check SSE received the update (should see "button" in active)

# End signal
curl -X POST http://localhost:3004/playground/api/agent/signal \
  -H 'Content-Type: application/json' \
  -d '{"action":"work-end","componentId":"button"}'
```

**Step 3: Commit**

```bash
git add tools/playground/app/playground/api/agent/signal/route.ts
git commit -m "feat(playground): add POST handler for work signal commands"
```

---

### Task 4: CLI Scaffolding

Create the CLI entry point with subcommand routing. Uses `.mjs` (matches existing scripts). No framework — just `process.argv`.

**Files:**
- Create: `tools/playground/bin/rdna-playground.mjs`
- Create: `tools/playground/bin/lib/api.mjs` (shared HTTP helpers)
- Modify: `tools/playground/package.json` (add `bin` field)

**Step 1: Create shared API helper**

```js
// bin/lib/api.mjs
const BASE_URL = process.env.PLAYGROUND_URL || "http://localhost:3004";

/** POST JSON to a playground API route */
export async function post(path, body) {
  const res = await fetch(`${BASE_URL}/playground/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

/** GET from a playground API route */
export async function get(path) {
  const res = await fetch(`${BASE_URL}/playground/api${path}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

/** DELETE a playground API route */
export async function del(path) {
  const res = await fetch(`${BASE_URL}/playground/api${path}`, {
    method: "DELETE",
  });
  return res.json();
}
```

**Step 2: Create CLI entry point**

```js
#!/usr/bin/env node
// bin/rdna-playground.mjs

const [command, ...args] = process.argv.slice(2);

const COMMANDS = {
  "work-start": () => import("./commands/work-signal.mjs").then((m) => m.workStart(args)),
  "work-end": () => import("./commands/work-signal.mjs").then((m) => m.workEnd(args)),
  variations: () => import("./commands/variations.mjs").then((m) => m.run(args)),
  status: () => import("./commands/status.mjs").then((m) => m.run(args)),
  help: () => printHelp(),
};

function printHelp() {
  console.log(`
rdna-playground — CLI for the DNA Playground

Usage:
  rdna-playground <command> [options]

Commands:
  work-start <component>         Signal that an agent is editing a component
  work-end [component]           Clear work signal (omit component to clear all)
  variations <subcommand>        Manage component variations
  status                         Show playground state

Run 'rdna-playground <command> --help' for details.
`);
}

if (!command || command === "--help" || command === "-h") {
  printHelp();
  process.exit(0);
}

const handler = COMMANDS[command];
if (!handler) {
  console.error(`Unknown command: ${command}\nRun 'rdna-playground help' for usage.`);
  process.exit(1);
}

handler().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
```

**Step 3: Add bin to package.json**

Add to `tools/playground/package.json`:

```json
"bin": {
  "rdna-playground": "./bin/rdna-playground.mjs"
}
```

**Step 4: Manual test**

```bash
cd tools/playground && node bin/rdna-playground.mjs help
```
Expected: help text prints

**Step 5: Commit**

```bash
git add tools/playground/bin/ tools/playground/package.json
git commit -m "feat(playground): scaffold CLI with subcommand routing"
```

---

### Task 5: CLI `work-start` / `work-end` Commands

**Files:**
- Create: `tools/playground/bin/commands/work-signal.mjs`

**Step 1: Write the command handlers**

```js
// bin/commands/work-signal.mjs
import { post } from "../lib/api.mjs";

export async function workStart(args) {
  const componentId = args[0];
  if (!componentId) {
    console.error("Usage: rdna-playground work-start <component>");
    process.exit(1);
  }

  const result = await post("/agent/signal", {
    action: "work-start",
    componentId,
  });

  console.log(`⟐ Work started on: ${componentId}`);
  console.log(`  Active: ${result.active.join(", ") || "(none)"}`);
}

export async function workEnd(args) {
  const componentId = args[0];

  if (!componentId) {
    // Clear all signals
    await post("/agent/signal", { action: "clear-all", componentId: "_" });
    console.log("⟐ All work signals cleared.");
    return;
  }

  const result = await post("/agent/signal", {
    action: "work-end",
    componentId,
  });

  console.log(`⟐ Work ended on: ${componentId}`);
  console.log(`  Active: ${result.active.join(", ") || "(none)"}`);
}
```

**Step 2: Manual test (with playground running)**

```bash
node bin/rdna-playground.mjs work-start button
# Expected: "⟐ Work started on: button"

node bin/rdna-playground.mjs work-end button
# Expected: "⟐ Work ended on: button"

node bin/rdna-playground.mjs work-end
# Expected: "⟐ All work signals cleared."
```

**Step 3: Commit**

```bash
git add tools/playground/bin/commands/work-signal.mjs
git commit -m "feat(playground): add work-start/work-end CLI commands"
```

---

### Task 6: Browser Hook — `useWorkSignals`

Connects to the SSE endpoint and exposes active component IDs as React state.

**Files:**
- Create: `tools/playground/app/playground/hooks/useWorkSignals.ts`
- Test: `tools/playground/app/playground/lib/__tests__/useWorkSignals.test.ts`

**Step 1: Write the hook**

```ts
// hooks/useWorkSignals.ts
"use client";

import { useState, useEffect } from "react";

export function useWorkSignals(): Set<string> {
  const [active, setActive] = useState<Set<string>>(new Set());

  useEffect(() => {
    const eventSource = new EventSource("/playground/api/agent/signal");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.active) {
          setActive(new Set(data.active));
        }
      } catch {
        // Ignore parse errors (heartbeats, etc.)
      }
    };

    eventSource.onerror = () => {
      // EventSource auto-reconnects — just let it
    };

    return () => eventSource.close();
  }, []);

  return active;
}
```

**Step 2: Wire into PlaygroundCanvas**

In `PlaygroundCanvas.tsx`, add `useWorkSignals` and pass the set down through a context (alongside `IterationMapContext`):

```ts
// Add near the top of the file, after IterationMapContext:
const WorkSignalContext = createContext<Set<string>>(new Set());
const useWorkSignalActive = () => useContext(WorkSignalContext);
```

In the `PlaygroundCanvas` component body, add:
```ts
import { useWorkSignals } from "./hooks/useWorkSignals";
// ...
const workSignals = useWorkSignals();
```

Wrap the return JSX:
```tsx
<WorkSignalContext.Provider value={workSignals}>
  <IterationMapContext.Provider value={iterationMap}>
    {/* ... existing ReactFlow JSX ... */}
  </IterationMapContext.Provider>
</WorkSignalContext.Provider>
```

Export `useWorkSignalActive` so `ComponentCard` can consume it.

**Step 3: Commit**

```bash
git add tools/playground/app/playground/hooks/useWorkSignals.ts tools/playground/app/playground/PlaygroundCanvas.tsx
git commit -m "feat(playground): add useWorkSignals hook and context"
```

---

### Task 7: DitherSkeleton Overlay on ComponentCard

When a component has an active work signal, overlay a `DitherSkeleton` shimmer.

**Files:**
- Modify: `tools/playground/package.json` (add `@rdna/dithwather-react` dep)
- Modify: `tools/playground/app/playground/nodes/ComponentCard.tsx`

**Step 1: Add dependency**

```bash
cd /Users/rivermassey/Desktop/dev/DNA && pnpm --filter @rdna/playground add @rdna/dithwather-react
```

**Step 2: Add overlay to ComponentCard**

In `ComponentCard.tsx`, import the skeleton and the work signal context:

```tsx
import { DitherSkeleton } from "@rdna/dithwather-react";
// Import useWorkSignalActive from PlaygroundCanvas or a shared module
```

Wrap the card's outer `<div>` with a relative container and add a conditional overlay:

```tsx
function ComponentCardInner({ entry, iterations: initialIterations }: ComponentCardProps) {
  // ... existing code ...
  const workActive = useWorkSignalActive();
  const isWorking = workActive.has(entry.id);

  return (
    <div className="relative">
      {isWorking && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-xs">
          <DitherSkeleton
            width="100%"
            height="100%"
            bgColor="#0F0E0C"
            color="#FEF8E2"
            opacity={0.15}
            speed={2000}
            algorithm="bayer4x4"
            pixelScale={3}
          />
        </div>
      )}
      <div
        className="flex w-[22rem] flex-col rounded-xs border border-[rgba(254,248,226,0.15)] bg-[#0F0E0C]"
        style={{ boxShadow: isWorking
          ? "0 0 0 1px rgba(252,225,132,0.12), 0 0 24px rgba(252,225,132,0.15)"
          : "0 0 0 1px rgba(252,225,132,0.06), 0 0 12px rgba(252,225,132,0.08)"
        }}
      >
        {/* ... existing card content ... */}
      </div>
    </div>
  );
}
```

**Step 3: Manual test**

1. Run playground: `pnpm --filter @rdna/playground dev`
2. In another terminal: `node tools/playground/bin/rdna-playground.mjs work-start button`
3. Check canvas — Button card should shimmer with dithered glow
4. Run: `node tools/playground/bin/rdna-playground.mjs work-end button`
5. Shimmer should stop

**Step 4: Commit**

```bash
git add tools/playground/package.json tools/playground/app/playground/nodes/ComponentCard.tsx
git commit -m "feat(playground): add DitherSkeleton overlay for active work signals"
```

---

### Task 8: CLI `status` Command

Quick sanity command — shows active signals and playground state.

**Files:**
- Create: `tools/playground/bin/commands/status.mjs`

**Step 1: Write the command**

```js
// bin/commands/status.mjs
import { get } from "../lib/api.mjs";

export async function run() {
  const [signal, iterations] = await Promise.all([
    get("/agent/signal").catch(() => ({ active: [] })),
    get("/generate"),
  ]);

  console.log("Playground Status");
  console.log("─".repeat(40));

  console.log(`\nActive work signals: ${signal.active?.length || 0}`);
  if (signal.active?.length > 0) {
    for (const id of signal.active) {
      console.log(`  ⟐ ${id}`);
    }
  }

  console.log(`\nIteration files: ${iterations.files?.length || 0}`);
  if (iterations.byComponent) {
    for (const [comp, files] of Object.entries(iterations.byComponent)) {
      console.log(`  ${comp}: ${files.length} iteration(s)`);
    }
  }

  console.log(`\nGenerate locked: ${iterations.locked ? "yes" : "no"}`);
}
```

**Note:** The `GET /api/agent/signal` is an SSE endpoint. We need a separate GET that returns JSON for the status command. Add a query param check to the SSE route:

In `api/agent/signal/route.ts`, modify the GET handler to check for `?format=json`:

```ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({ active: signalStore.getActive() });
  }
  // ... existing SSE code ...
}
```

Update `status.mjs` to call `get("/agent/signal?format=json")`.

**Step 2: Commit**

```bash
git add tools/playground/bin/commands/status.mjs tools/playground/app/playground/api/agent/signal/route.ts
git commit -m "feat(playground): add status CLI command and JSON format for signal endpoint"
```

---

## Phase 2: Variations

### Task 9: CLI `variations list`

Lists existing iteration files. Wraps `GET /api/generate`.

**Files:**
- Create: `tools/playground/bin/commands/variations.mjs`

**Step 1: Write the subcommand router + list**

```js
// bin/commands/variations.mjs
import { get, post, del } from "../lib/api.mjs";

const SUBCOMMANDS = {
  list,
  generate,
  write,
  adopt,
  trash,
};

export async function run(args) {
  const [subcommand, ...rest] = args;

  if (!subcommand || subcommand === "--help") {
    console.log(`
Usage: rdna-playground variations <subcommand>

Subcommands:
  list [component]              List iteration files
  generate <component>          Spawn agent to generate variations
  write <component> <file>      Register an agent-written iteration
  adopt <component> <iteration> Adopt an iteration into source (lint+tsc gated)
  trash <component> <iteration> Delete an iteration file
`);
    return;
  }

  const handler = SUBCOMMANDS[subcommand];
  if (!handler) {
    console.error(`Unknown subcommand: ${subcommand}`);
    process.exit(1);
  }

  await handler(rest);
}

async function list(args) {
  const data = await get("/generate");
  const componentFilter = args[0];

  if (componentFilter) {
    const files = data.byComponent?.[componentFilter] || [];
    console.log(`${componentFilter}: ${files.length} iteration(s)`);
    for (const f of files) console.log(`  ${f}`);
  } else {
    console.log(`Total iterations: ${data.files?.length || 0}\n`);
    for (const [comp, files] of Object.entries(data.byComponent || {})) {
      console.log(`${comp}: ${files.length}`);
      for (const f of files) console.log(`  ${f}`);
    }
  }
}
```

**Step 2: Manual test**

```bash
node bin/rdna-playground.mjs variations list
# Expected: lists iterations (may be empty after cleanup)
```

**Step 3: Commit**

```bash
git add tools/playground/bin/commands/variations.mjs
git commit -m "feat(playground): add variations list CLI command"
```

---

### Task 10: CLI `variations generate`

Wraps `POST /api/generate` — spawns Claude to generate variations.

**Files:**
- Modify: `tools/playground/bin/commands/variations.mjs` (fill in `generate` function)

**Step 1: Implement generate**

```js
async function generate(args) {
  const componentId = args[0];
  if (!componentId) {
    console.error("Usage: rdna-playground variations generate <component>");
    process.exit(1);
  }

  const count = parseInt(args[1], 10) || 2;
  console.log(`Generating ${count} variation(s) for: ${componentId}...`);
  console.log("(This spawns claude --print and may take 30-60s)\n");

  const result = await post("/generate", {
    componentId,
    variationCount: count,
  });

  console.log(`Generated ${result.writtenFiles.length} iteration(s):`);
  for (const f of result.writtenFiles) {
    console.log(`  ${f}`);
  }
  console.log(`\nTotal iterations for ${componentId}: ${result.totalIterations}`);
}
```

**Step 2: Manual test**

```bash
node bin/rdna-playground.mjs variations generate button
# Expected: waits for Claude, then lists written files
```

**Step 3: Commit**

```bash
git add tools/playground/bin/commands/variations.mjs
git commit -m "feat(playground): add variations generate CLI command"
```

---

### Task 11: CLI `variations write` + RDNA Lint Gate

Agent-direct path: write an iteration file from a provided path, lint it first.

**Files:**
- Modify: `tools/playground/bin/commands/variations.mjs` (fill in `write` function)

**Step 1: Implement write with lint gate**

```js
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLAYGROUND_ROOT = resolve(__dirname, "../..");
const MONO_ROOT = resolve(PLAYGROUND_ROOT, "../..");
const ITERATIONS_DIR = resolve(PLAYGROUND_ROOT, "app/playground/iterations");

async function write(args) {
  const componentId = args[0];
  const sourcePath = args[1];

  if (!componentId || !sourcePath) {
    console.error("Usage: rdna-playground variations write <component> <file>");
    process.exit(1);
  }

  const absSource = resolve(sourcePath);
  if (!existsSync(absSource)) {
    console.error(`File not found: ${absSource}`);
    process.exit(1);
  }

  // Determine next iteration number by querying existing files
  const data = await get("/generate");
  const existing = data.byComponent?.[componentId] || [];
  let maxN = 0;
  for (const f of existing) {
    const match = f.match(/\.iteration-(\d+)\.tsx$/);
    if (match) maxN = Math.max(maxN, parseInt(match[1], 10));
  }

  const iterationN = maxN + 1;
  const filename = `${componentId}.iteration-${iterationN}.tsx`;
  const targetPath = resolve(ITERATIONS_DIR, filename);

  // Ensure iterations dir exists
  if (!existsSync(ITERATIONS_DIR)) mkdirSync(ITERATIONS_DIR, { recursive: true });

  // Copy file to iterations dir
  const content = readFileSync(absSource, "utf-8");
  writeFileSync(targetPath, content, "utf-8");

  // Run RDNA lint
  console.log(`Linting ${filename} against RDNA rules...`);
  try {
    execSync(
      `pnpm exec eslint --config eslint.rdna.config.mjs '${targetPath}'`,
      { cwd: MONO_ROOT, stdio: "pipe" },
    );
    console.log(`  PASS — no violations`);
  } catch (error) {
    const stderr = error.stderr?.toString() || "";

    // Check for critical violations (error-level ESLint rules)
    const errorCount = (stderr.match(/\d+ error/)?.[0] || "").replace(" error", "");
    if (parseInt(errorCount, 10) > 0) {
      // Critical — reject
      const { unlinkSync } = await import("fs");
      unlinkSync(targetPath);
      console.error(`  REJECTED — Critical RDNA violations found:\n${stderr.slice(0, 1000)}`);
      process.exit(1);
    }

    // Warnings only — keep but flag
    console.warn(`  WARNING — RDNA lint warnings:\n${stderr.slice(0, 500)}`);
  }

  console.log(`\nWritten: ${filename}`);
  console.log(`Total iterations for ${componentId}: ${iterationN}`);
}
```

**Step 2: Manual test**

Create a test file and write it as a variation:
```bash
echo '"use client"; export default function TestButton() { return <button>Test</button>; }' > /tmp/test-var.tsx
node bin/rdna-playground.mjs variations write button /tmp/test-var.tsx
```

**Step 3: Commit**

```bash
git add tools/playground/bin/commands/variations.mjs
git commit -m "feat(playground): add variations write CLI with RDNA lint gate"
```

---

### Task 12: CLI `variations adopt`

Wraps `POST /api/adopt` — adopts an iteration into real source.

**Files:**
- Modify: `tools/playground/bin/commands/variations.mjs` (fill in `adopt` function)

**Step 1: Implement adopt**

```js
async function adopt(args) {
  const componentId = args[0];
  const iterationFile = args[1];

  if (!componentId || !iterationFile) {
    console.error("Usage: rdna-playground variations adopt <component> <iteration>");
    console.error("  e.g.: rdna-playground variations adopt button button.iteration-2.tsx");
    process.exit(1);
  }

  console.log(`Adopting ${iterationFile} → ${componentId} source...`);
  console.log("(Running ESLint + TypeScript checks)\n");

  const result = await post("/adopt", { componentId, iterationFile });

  console.log(`Adopted: ${result.iterationFile}`);
  console.log(`Target:  ${result.targetPath}`);
}
```

**Step 2: Commit**

```bash
git add tools/playground/bin/commands/variations.mjs
git commit -m "feat(playground): add variations adopt CLI command"
```

---

### Task 13: CLI `variations trash`

Deletes an iteration file from disk.

**Files:**
- Create: `tools/playground/app/playground/api/generate/[file]/route.ts` (DELETE endpoint for single file)
- Modify: `tools/playground/bin/commands/variations.mjs` (fill in `trash` function)

**Step 1: Create single-file DELETE endpoint**

```ts
// api/generate/[file]/route.ts
import { NextResponse } from "next/server";
import { existsSync, unlinkSync } from "fs";
import { resolve, relative } from "path";

const ITERATIONS_DIR = resolve(process.cwd(), "app/playground/iterations");

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;

  // Prevent path traversal
  const target = resolve(ITERATIONS_DIR, file);
  const rel = relative(ITERATIONS_DIR, target);
  if (rel.startsWith("..") || rel.includes("/")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  if (!existsSync(target)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  unlinkSync(target);
  return NextResponse.json({ deleted: file });
}
```

**Step 2: Implement CLI trash**

```js
async function trash(args) {
  const componentId = args[0];
  const iterationFile = args[1];

  if (!componentId || !iterationFile) {
    console.error("Usage: rdna-playground variations trash <component> <iteration>");
    process.exit(1);
  }

  const res = await fetch(
    `${process.env.PLAYGROUND_URL || "http://localhost:3004"}/playground/api/generate/${encodeURIComponent(iterationFile)}`,
    { method: "DELETE" },
  );
  const data = await res.json();

  if (!res.ok) {
    console.error(`Failed: ${data.error}`);
    process.exit(1);
  }

  console.log(`Deleted: ${data.deleted}`);
}
```

**Step 3: Commit**

```bash
git add tools/playground/app/playground/api/generate/\[file\]/route.ts tools/playground/bin/commands/variations.mjs
git commit -m "feat(playground): add variations trash CLI command and DELETE endpoint"
```

---

### Task 14: SSE Notification for Variation Changes

When iterations change (generate, write, trash), broadcast via SSE so the canvas auto-refreshes.

**Files:**
- Modify: `tools/playground/app/playground/api/agent/signal-store.ts` (add iteration event support)
- Modify: `tools/playground/app/playground/api/generate/route.ts` (emit after write)
- Modify: `tools/playground/app/playground/api/generate/[file]/route.ts` (emit after delete)
- Modify: `tools/playground/app/playground/hooks/useWorkSignals.ts` (handle iteration events)
- Modify: `tools/playground/app/playground/PlaygroundCanvas.tsx` (re-fetch iterations on SSE event)

**Step 1: Extend signal store with generic event broadcasting**

Add to `signal-store.ts`:

```ts
type SSEEvent = { type: string; [key: string]: unknown };
type EventListener = (event: SSEEvent) => void;

// Add to SignalStore class:
private eventListeners = new Set<EventListener>();

broadcast(event: SSEEvent): void {
  for (const listener of this.eventListeners) {
    listener(event);
  }
}

onEvent(listener: EventListener): () => void {
  this.eventListeners.add(listener);
  return () => this.eventListeners.delete(listener);
}
```

Update the SSE route to use `onEvent` instead of `subscribe` for the stream, and have `subscribe` emit via `broadcast`.

**Step 2: Emit from generate and trash routes**

In `api/generate/route.ts`, after writing files:
```ts
import { signalStore } from "../agent/signal-store";
// After writtenFiles:
signalStore.broadcast({ type: "iterations-changed", componentId: body.componentId });
```

In `api/generate/[file]/route.ts`, after deleting:
```ts
import { signalStore } from "../../agent/signal-store";
signalStore.broadcast({ type: "iterations-changed" });
```

**Step 3: Handle in browser**

In `useWorkSignals.ts`, add a callback for iteration change events. In `PlaygroundCanvas.tsx`, re-fetch `GET /api/generate` when an `iterations-changed` event arrives.

**Step 4: Commit**

```bash
git add tools/playground/app/playground/api/agent/signal-store.ts \
  tools/playground/app/playground/api/agent/signal/route.ts \
  tools/playground/app/playground/api/generate/route.ts \
  tools/playground/app/playground/api/generate/\[file\]/route.ts \
  tools/playground/app/playground/hooks/useWorkSignals.ts \
  tools/playground/app/playground/PlaygroundCanvas.tsx
git commit -m "feat(playground): broadcast iteration changes via SSE for auto-refresh"
```

---

## Post-Implementation Checklist

- [ ] Run `pnpm --filter @rdna/playground test` — all tests pass
- [ ] Run `pnpm --filter @rdna/playground typecheck` — no TS errors
- [ ] Manual E2E: `work-start button` → see glow → `work-end button` → glow stops
- [ ] Manual E2E: `variations generate button` → iterations appear on canvas
- [ ] Manual E2E: `variations trash button button.iteration-1.tsx` → removed from canvas
- [ ] Manual E2E: `variations write button /path/to/file.tsx` → lint runs → file appears
- [ ] Verify sun/moon mode — glow should look good on both (DitherSkeleton uses hardcoded dark colors)
