# Playground CLI Agent Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add live work-signal glow plus CLI-backed variation management to the playground, while keeping the playground app as the source of truth for state and file mutations.

**Architecture:** The playground owns all work-signal and iteration lifecycle logic. A process-local signal store feeds a single SSE endpoint for browser updates; Next.js API routes own generation, write, delete, and adopt mutations; the CLI only validates args, calls those routes, and prints results. This phase extends the existing inline `ComponentCard` variation UI rather than introducing separate ReactFlow variant nodes.

**Tech Stack:** Node.js ESM CLI, Next.js App Router API routes, native SSE via `ReadableStream`, React 19 client hooks, Vitest, `@rdna/dithwather-react`, RDNA ESLint gate

---

## Scope Guardrails

- The CLI is a thin wrapper in this phase. It does **not** compute iteration numbers, write files directly, or run RDNA lint itself.
- All iteration writes, deletes, and generation-time verification happen server-side inside `tools/playground/app/playground/api/*` plus shared server helpers.
- The existing inline variation stack in `ComponentCard` remains the display model for Phases 1+2. Do **not** add separate ReactFlow variant nodes in this plan.
- `ComponentCard` must not keep its own stale copy of the iteration list. The canvas-provided prop is the source of truth.
- Work-signal and iteration-change events are process-local and reset when the playground dev server restarts.
- Direct CLI orchestration of Claude/Codex subagents is deferred. In this phase, `variations generate` still wraps the existing server-side `/api/generate` route.

## Existing Repo Facts

- Existing iteration lifecycle:
  - `tools/playground/app/playground/api/generate/route.ts`
  - `tools/playground/app/playground/api/adopt/route.ts`
- Existing iteration helpers:
  - `tools/playground/app/playground/lib/iteration-naming.ts`
  - `tools/playground/app/playground/lib/source-path-policy.ts`
  - `tools/playground/app/playground/lib/code-blocks.ts`
- Existing canvas behavior:
  - `tools/playground/app/playground/PlaygroundCanvas.tsx` fetches `GET /playground/api/generate`
  - `tools/playground/app/playground/nodes/ComponentCard.tsx` already renders inline iteration previews
- Existing verification script:
  - `tools/playground/scripts/verify-generated-variation.mjs`
- Playground package:
  - `tools/playground/package.json`
  - port `3004` via `dna.port`
- Workspace dependency is available:
  - `tools/dithwather/packages/react/package.json` exports `@rdna/dithwather-react`

## Execution Order

1. Prove the server-to-browser live path first: signal store, SSE route, browser subscription, glow overlay.
2. Verify the glow path manually with `curl` before introducing the CLI wrapper.
3. Centralize iteration writes/deletes in shared server helpers and server routes.
4. Let the CLI wrap those stable routes only after the browser/server behavior works.

---

## Phase 1: Live Work Signals

### Task 1: Add the Signal Store

Create a process-local signal/event store that can broadcast both active work signals and later `iterations-changed` events.

**Files:**
- Create: `tools/playground/app/playground/api/agent/signal-store.ts`
- Test: `tools/playground/app/playground/lib/__tests__/signal-store.test.ts`

**Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { signalStore, type PlaygroundSignalEvent } from "../../api/agent/signal-store";

beforeEach(() => {
  signalStore.clearAll();
});

describe("signalStore", () => {
  it("starts with no active signals", () => {
    expect(signalStore.getActive()).toEqual([]);
  });

  it("broadcasts active signal snapshots", () => {
    const events: PlaygroundSignalEvent[] = [];
    const unsubscribe = signalStore.subscribe((event) => events.push(event));

    signalStore.workStart("button");
    signalStore.workEnd("button");

    unsubscribe();

    expect(events).toEqual([
      { type: "work-signals", active: ["button"] },
      { type: "work-signals", active: [] },
    ]);
  });

  it("broadcasts iteration refresh events", () => {
    const events: PlaygroundSignalEvent[] = [];
    const unsubscribe = signalStore.subscribe((event) => events.push(event));

    signalStore.iterationsChanged("button");

    unsubscribe();

    expect(events).toEqual([
      { type: "iterations-changed", componentId: "button" },
    ]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd tools/playground && pnpm test -- --run app/playground/lib/__tests__/signal-store.test.ts`
Expected: FAIL with module-not-found errors

**Step 3: Write minimal implementation**

```ts
export type PlaygroundSignalEvent =
  | { type: "work-signals"; active: string[] }
  | { type: "iterations-changed"; componentId?: string };

type Listener = (event: PlaygroundSignalEvent) => void;

class SignalStore {
  private active = new Set<string>();
  private listeners = new Set<Listener>();

  getActive(): string[] {
    return [...this.active];
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  workStart(componentId: string): void {
    this.active.add(componentId);
    this.emit({ type: "work-signals", active: this.getActive() });
  }

  workEnd(componentId: string): void {
    this.active.delete(componentId);
    this.emit({ type: "work-signals", active: this.getActive() });
  }

  clearAll(): void {
    this.active.clear();
    this.emit({ type: "work-signals", active: [] });
  }

  iterationsChanged(componentId?: string): void {
    this.emit({ type: "iterations-changed", componentId });
  }

  private emit(event: PlaygroundSignalEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export const signalStore = new SignalStore();
```

**Step 4: Run test to verify it passes**

Run: `cd tools/playground && pnpm test -- --run app/playground/lib/__tests__/signal-store.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tools/playground/app/playground/api/agent/signal-store.ts tools/playground/app/playground/lib/__tests__/signal-store.test.ts
git commit -m "feat(playground): add signal store for work and iteration events"
```

---

### Task 2: Add the Signal Route (`GET` SSE, `GET ?format=json`, `POST`)

Create the API surface before the CLI so the browser path can be proven with `curl`.

**Files:**
- Create: `tools/playground/app/playground/api/agent/signal/route.ts`

**Step 1: Write the route**

```ts
import { NextResponse } from "next/server";
import { signalStore } from "../signal-store";

export const dynamic = "force-dynamic";

function encodeEvent(encoder: TextEncoder, payload: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({ active: signalStore.getActive() });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encodeEvent(encoder, payload));
      };

      send({ type: "work-signals", active: signalStore.getActive() });

      const unsubscribe = signalStore.subscribe((event) => send(event));
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 30_000);

      const cleanup = () => {
        unsubscribe();
        clearInterval(heartbeat);
      };

      request.signal.addEventListener("abort", cleanup, { once: true });
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

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  const action = body.action as string;
  const componentId = typeof body.componentId === "string" ? body.componentId : undefined;

  if (action !== "clear-all" && !componentId) {
    return NextResponse.json({ error: "Missing componentId" }, { status: 400 });
  }

  if (action === "work-start" && componentId) {
    signalStore.workStart(componentId);
  } else if (action === "work-end" && componentId) {
    signalStore.workEnd(componentId);
  } else if (action === "clear-all") {
    signalStore.clearAll();
  } else {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    active: signalStore.getActive(),
  });
}
```

**Step 2: Manual proof with `curl`**

Run playground: `pnpm --filter @rdna/playground dev`

In another terminal:

```bash
curl -N http://localhost:3004/playground/api/agent/signal
```

Expected first event:

```text
data: {"type":"work-signals","active":[]}
```

Then:

```bash
curl -X POST http://localhost:3004/playground/api/agent/signal \
  -H 'Content-Type: application/json' \
  -d '{"action":"work-start","componentId":"button"}'
```

Expected: the SSE terminal prints an event whose `active` array contains `"button"`.

**Step 3: Commit**

```bash
git add tools/playground/app/playground/api/agent/signal/route.ts
git commit -m "feat(playground): add work signal SSE and command route"
```

---

### Task 3: Add a Browser Event Parser and Hook

Keep the event parsing logic pure and tested; keep the React hook thin.

**Files:**
- Create: `tools/playground/app/playground/lib/playground-signal-event.ts`
- Test: `tools/playground/app/playground/lib/__tests__/playground-signal-event.test.ts`
- Create: `tools/playground/app/playground/hooks/usePlaygroundSignals.ts`

**Step 1: Write the failing parser test**

```ts
import { describe, expect, it } from "vitest";
import { parsePlaygroundSignalEvent } from "../playground-signal-event";

describe("parsePlaygroundSignalEvent", () => {
  it("parses work-signal payloads", () => {
    expect(
      parsePlaygroundSignalEvent('{"type":"work-signals","active":["button"]}'),
    ).toEqual({ type: "work-signals", active: ["button"] });
  });

  it("parses iteration refresh payloads", () => {
    expect(
      parsePlaygroundSignalEvent('{"type":"iterations-changed","componentId":"button"}'),
    ).toEqual({ type: "iterations-changed", componentId: "button" });
  });

  it("returns null for invalid data", () => {
    expect(parsePlaygroundSignalEvent(": heartbeat")).toBeNull();
    expect(parsePlaygroundSignalEvent('{"type":"unknown"}')).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd tools/playground && pnpm test -- --run app/playground/lib/__tests__/playground-signal-event.test.ts`
Expected: FAIL with module-not-found errors

**Step 3: Write the parser and hook**

```ts
// lib/playground-signal-event.ts
import type { PlaygroundSignalEvent } from "../api/agent/signal-store";

export function parsePlaygroundSignalEvent(raw: string): PlaygroundSignalEvent | null {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;

    if (
      data.type === "work-signals" &&
      Array.isArray(data.active) &&
      data.active.every((item) => typeof item === "string")
    ) {
      return { type: "work-signals", active: data.active };
    }

    if (data.type === "iterations-changed") {
      return {
        type: "iterations-changed",
        componentId: typeof data.componentId === "string" ? data.componentId : undefined,
      };
    }
  } catch {
    return null;
  }

  return null;
}
```

```ts
// hooks/usePlaygroundSignals.ts
"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { parsePlaygroundSignalEvent } from "../lib/playground-signal-event";

export function usePlaygroundSignals(onIterationsChanged?: () => void): Set<string> {
  const [active, setActive] = useState<Set<string>>(new Set());
  const notifyIterationsChanged = useEffectEvent(() => {
    onIterationsChanged?.();
  });

  useEffect(() => {
    const eventSource = new EventSource("/playground/api/agent/signal");

    eventSource.onmessage = (event) => {
      const parsed = parsePlaygroundSignalEvent(event.data);
      if (!parsed) return;

      if (parsed.type === "work-signals") {
        setActive(new Set(parsed.active));
        return;
      }

      notifyIterationsChanged();
    };

    return () => eventSource.close();
  }, []);

  return active;
}
```

**Step 4: Run test to verify it passes**

Run: `cd tools/playground && pnpm test -- --run app/playground/lib/__tests__/playground-signal-event.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tools/playground/app/playground/lib/playground-signal-event.ts tools/playground/app/playground/lib/__tests__/playground-signal-event.test.ts tools/playground/app/playground/hooks/usePlaygroundSignals.ts
git commit -m "feat(playground): add browser parser and hook for signal events"
```

---

### Task 4: Wire the Browser and Add the Glow Overlay

Finish the browser side and manually verify the live pipe before writing any CLI code.

**Files:**
- Create: `tools/playground/app/playground/work-signal-context.ts`
- Modify: `tools/playground/app/playground/PlaygroundCanvas.tsx`
- Modify: `tools/playground/app/playground/nodes/ComponentCard.tsx`
- Modify: `tools/playground/package.json`

**Step 1: Add the workspace dependency**

Add to `tools/playground/package.json`:

```json
"@rdna/dithwather-react": "workspace:*"
```

**Step 2: Add a dedicated client context**

```ts
"use client";

import { createContext, useContext } from "react";

export const WorkSignalContext = createContext<Set<string>>(new Set());

export function useWorkSignalSet(): Set<string> {
  return useContext(WorkSignalContext);
}
```

**Step 3: Wire the hook into the canvas**

In `PlaygroundCanvas.tsx`:

```ts
import { createContext, useContext, useEffect, useEffectEvent, useState } from "react";
import { usePlaygroundSignals } from "./hooks/usePlaygroundSignals";
import { WorkSignalContext } from "./work-signal-context";
```

Replace the existing iteration fetch effect with a reusable refresh function:

```ts
const refreshIterations = useEffectEvent(() => {
  fetch("/playground/api/generate")
    .then((res) => (res.ok ? res.json() : { byComponent: {} }))
    .then((data) => setIterationMap(data.byComponent ?? {}))
    .catch(() => setIterationMap({}));
});

useEffect(() => {
  refreshIterations();
}, [entries]);

const workSignals = usePlaygroundSignals(() => {
  refreshIterations();
});
```

Wrap the existing provider tree:

```tsx
<WorkSignalContext.Provider value={workSignals}>
  <IterationMapContext.Provider value={iterationMap}>
    {/* existing ReactFlow tree */}
  </IterationMapContext.Provider>
</WorkSignalContext.Provider>
```

**Step 4: Add the overlay to `ComponentCard`**

In `ComponentCard.tsx`:

```tsx
import { DitherSkeleton } from "@rdna/dithwather-react";
import { useWorkSignalSet } from "../work-signal-context";
```

Then wrap the outer card:

```tsx
const workSignals = useWorkSignalSet();
const isWorking = workSignals.has(entry.id);

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
      style={{
        boxShadow: isWorking
          ? "0 0 0 1px rgba(252,225,132,0.12), 0 0 24px rgba(252,225,132,0.15)"
          : "0 0 0 1px rgba(252,225,132,0.06), 0 0 12px rgba(252,225,132,0.08)",
      }}
    >
      {/* existing card body */}
    </div>
  </div>
);
```

**Step 5: Manual proof**

1. Run: `pnpm --filter @rdna/playground dev`
2. Start the signal with `curl`:

```bash
curl -X POST http://localhost:3004/playground/api/agent/signal \
  -H 'Content-Type: application/json' \
  -d '{"action":"work-start","componentId":"button"}'
```

3. Confirm the Button card glows.
4. Clear the signal:

```bash
curl -X POST http://localhost:3004/playground/api/agent/signal \
  -H 'Content-Type: application/json' \
  -d '{"action":"work-end","componentId":"button"}'
```

5. Confirm the glow disappears.

**Step 6: Commit**

```bash
git add tools/playground/package.json tools/playground/app/playground/work-signal-context.ts tools/playground/app/playground/PlaygroundCanvas.tsx tools/playground/app/playground/nodes/ComponentCard.tsx
git commit -m "feat(playground): show live glow for active work signals"
```

---

### Task 5: Add the Thin CLI for Work Signals

Only after the live browser path works, add the CLI wrapper.

**Files:**
- Create: `tools/playground/bin/rdna-playground.mjs`
- Create: `tools/playground/bin/lib/api.mjs`
- Create: `tools/playground/bin/commands/work-signal.mjs`
- Create: `tools/playground/bin/commands/status.mjs`
- Modify: `tools/playground/package.json`

**Step 1: Add the shared API helper**

```js
const BASE_URL = process.env.PLAYGROUND_URL || "http://localhost:3004";

async function request(path, init = {}) {
  const url = new URL(`/playground/api${path}`, BASE_URL);
  const res = await fetch(url, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data;
}

export function get(path) {
  return request(path);
}

export function post(path, body) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function del(path) {
  return request(path, { method: "DELETE" });
}
```

**Step 2: Add the CLI entry point**

```js
#!/usr/bin/env node

const [command, ...args] = process.argv.slice(2);

const COMMANDS = {
  "work-start": () => import("./commands/work-signal.mjs").then((m) => m.workStart(args)),
  "work-end": () => import("./commands/work-signal.mjs").then((m) => m.workEnd(args)),
  status: () => import("./commands/status.mjs").then((m) => m.run()),
  help: () => printHelp(),
};

function printHelp() {
  console.log(`
rdna-playground

Usage:
  rdna-playground work-start <component>
  rdna-playground work-end [component]
  rdna-playground status
`);
}

if (!command || command === "help" || command === "--help" || command === "-h") {
  printHelp();
  process.exit(0);
}

const handler = COMMANDS[command];
if (!handler) {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

handler().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
```

**Step 3: Add work-signal and status commands**

```js
// commands/work-signal.mjs
import { post } from "../lib/api.mjs";

export async function workStart(args) {
  const componentId = args[0];
  if (!componentId) {
    throw new Error("Usage: rdna-playground work-start <component>");
  }

  const result = await post("/agent/signal", {
    action: "work-start",
    componentId,
  });

  console.log(`Work started: ${componentId}`);
  console.log(`Active: ${result.active.join(", ") || "(none)"}`);
}

export async function workEnd(args) {
  const componentId = args[0];

  const result = await post("/agent/signal", componentId
    ? { action: "work-end", componentId }
    : { action: "clear-all" });

  console.log(componentId ? `Work ended: ${componentId}` : "All work signals cleared");
  console.log(`Active: ${result.active.join(", ") || "(none)"}`);
}
```

```js
// commands/status.mjs
import { get } from "../lib/api.mjs";

export async function run() {
  const [signals, iterations] = await Promise.all([
    get("/agent/signal?format=json"),
    get("/generate"),
  ]);

  console.log("Playground Status");
  console.log(`Active signals: ${signals.active.length}`);
  console.log(`Iteration files: ${iterations.files.length}`);
  console.log(`Generate locked: ${iterations.locked ? "yes" : "no"}`);
}
```

Add to `tools/playground/package.json`:

```json
"bin": {
  "rdna-playground": "./bin/rdna-playground.mjs"
}
```

**Step 4: Manual test**

```bash
cd tools/playground
node bin/rdna-playground.mjs work-start button
node bin/rdna-playground.mjs status
node bin/rdna-playground.mjs work-end button
```

Expected:
- commands print success output
- the browser glow turns on and off

**Step 5: Commit**

```bash
git add tools/playground/bin tools/playground/package.json
git commit -m "feat(playground): add thin CLI for work signals and status"
```

---

## Phase 2: Variation Lifecycle Through Server Routes

### Task 6: Extract Shared Server Iteration Helpers

Centralize list/group/write/delete behavior before adding more routes so `generate`, `write`, and `trash` cannot drift.

**Files:**
- Create: `tools/playground/app/playground/lib/iterations.server.ts`
- Test: `tools/playground/app/playground/lib/__tests__/iterations-server.test.ts`

**Step 1: Write the failing test**

```ts
import { mkdtempSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { execSync } from "child_process";
import {
  groupIterationsByComponent,
  listAllIterations,
  writeVerifiedIteration,
} from "../iterations.server";

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

describe("iterations.server", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("groups iteration files by component", () => {
    expect(
      groupIterationsByComponent([
        "button.iteration-1.tsx",
        "button.iteration-2.tsx",
        "card.iteration-1.tsx",
      ]),
    ).toEqual({
      button: ["button.iteration-1.tsx", "button.iteration-2.tsx"],
      card: ["card.iteration-1.tsx"],
    });
  });

  it("writes and verifies an iteration file", () => {
    const dir = mkdtempSync(join(tmpdir(), "playground-iterations-"));

    const result = writeVerifiedIteration({
      monoRoot: process.cwd(),
      iterationsDir: dir,
      componentId: "button",
      contents: "'use client'; export function Button(){ return <button>OK</button>; }",
    });

    expect(result.fileName).toBe("button.iteration-1.tsx");
    expect(readFileSync(join(dir, result.fileName), "utf-8")).toContain("export function Button");
    expect(execSync).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd tools/playground && pnpm test -- --run app/playground/lib/__tests__/iterations-server.test.ts`
Expected: FAIL with module-not-found errors

**Step 3: Write the helper module**

```ts
import { execSync } from "child_process";
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import { relative, resolve } from "path";
import { parseIterationName, sortIterationFiles } from "./iteration-naming";

export function listAllIterations(iterationsDir: string): string[] {
  if (!existsSync(iterationsDir)) return [];
  return sortIterationFiles(readdirSync(iterationsDir));
}

export function groupIterationsByComponent(files: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const file of files) {
    const parsed = parseIterationName(file);
    if (!parsed) continue;
    if (!grouped[parsed.componentId]) grouped[parsed.componentId] = [];
    grouped[parsed.componentId].push(file);
  }

  return grouped;
}

export function nextIterationFileName(iterationsDir: string, componentId: string): string {
  const files = listAllIterations(iterationsDir);
  let max = 0;

  for (const file of files) {
    const parsed = parseIterationName(file);
    if (parsed?.componentId === componentId && parsed.n > max) {
      max = parsed.n;
    }
  }

  return `${componentId}.iteration-${max + 1}.tsx`;
}

export function writeVerifiedIteration({
  monoRoot,
  iterationsDir,
  componentId,
  contents,
}: {
  monoRoot: string;
  iterationsDir: string;
  componentId: string;
  contents: string;
}): { fileName: string } {
  if (!existsSync(iterationsDir)) {
    mkdirSync(iterationsDir, { recursive: true });
  }

  const fileName = nextIterationFileName(iterationsDir, componentId);
  const target = resolve(iterationsDir, fileName);
  writeFileSync(target, contents, "utf-8");

  try {
    execSync(
      `pnpm exec eslint --config eslint.rdna.config.mjs '${target}'`,
      { cwd: monoRoot, stdio: "pipe" },
    );
  } catch (error) {
    unlinkSync(target);
    const stderr =
      error instanceof Error && "stderr" in error
        ? (error as { stderr?: Buffer }).stderr?.toString() ?? ""
        : "";
    throw new Error(stderr || "RDNA lint failed");
  }

  return { fileName };
}

export function resolveIterationTarget(iterationsDir: string, fileName: string): string {
  const target = resolve(iterationsDir, fileName);
  const rel = relative(iterationsDir, target);
  if (rel.startsWith("..") || rel.includes("/")) {
    throw new Error("Invalid iteration filename");
  }
  return target;
}
```

**Step 4: Run test to verify it passes**

Run: `cd tools/playground && pnpm test -- --run app/playground/lib/__tests__/iterations-server.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tools/playground/app/playground/lib/iterations.server.ts tools/playground/app/playground/lib/__tests__/iterations-server.test.ts
git commit -m "refactor(playground): centralize server iteration lifecycle helpers"
```

---

### Task 7: Add a Server-Side `variations write` Route and CLI Wrapper

The CLI reads a local file and posts its contents. The server decides the filename, writes it, verifies it, and emits the refresh event.

**Files:**
- Create: `tools/playground/app/playground/api/generate/write/route.ts`
- Create: `tools/playground/bin/commands/variations.mjs`
- Modify: `tools/playground/bin/rdna-playground.mjs`

**Step 1: Write the route**

```ts
import { NextResponse } from "next/server";
import { resolve } from "path";
import { serverRegistry } from "../../../registry.server";
import { signalStore } from "../../agent/signal-store";
import { listAllIterations, writeVerifiedIteration } from "../../../lib/iterations.server";

const MONO_ROOT = resolve(process.cwd(), "../..");
const ITERATIONS_DIR = resolve(process.cwd(), "app/playground/iterations");

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.componentId || !body?.contents) {
    return NextResponse.json(
      { error: "Missing componentId or contents" },
      { status: 400 },
    );
  }

  const entry = serverRegistry.find((item) => item.id === body.componentId);
  if (!entry) {
    return NextResponse.json(
      { error: `Unknown component: ${body.componentId}` },
      { status: 404 },
    );
  }

  try {
    const result = writeVerifiedIteration({
      monoRoot: MONO_ROOT,
      iterationsDir: ITERATIONS_DIR,
      componentId: entry.id,
      contents: body.contents,
    });

    signalStore.iterationsChanged(entry.id);

    return NextResponse.json({
      success: true,
      fileName: result.fileName,
      totalIterations: listAllIterations(ITERATIONS_DIR).filter((file) =>
        file.startsWith(`${entry.id}.iteration-`),
      ).length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Write failed" },
      { status: 422 },
    );
  }
}
```

**Step 2: Add the CLI subcommand router and `write` command**

First, register the new top-level command in `rdna-playground.mjs`:

```js
const COMMANDS = {
  "work-start": () => import("./commands/work-signal.mjs").then((m) => m.workStart(args)),
  "work-end": () => import("./commands/work-signal.mjs").then((m) => m.workEnd(args)),
  status: () => import("./commands/status.mjs").then((m) => m.run()),
  variations: () => import("./commands/variations.mjs").then((m) => m.run(args)),
  help: () => printHelp(),
};
```

Then add `bin/commands/variations.mjs`:

```js
import { readFileSync } from "fs";
import { resolve } from "path";
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
  const handler = subcommand ? SUBCOMMANDS[subcommand] : undefined;

  if (!handler) {
    console.log(`
Usage: rdna-playground variations <subcommand>

Subcommands:
  list [component]
  generate <component> [count]
  write <component> <file>
  trash <component> <iteration-file>
  adopt <component> <iteration-file>
`);
    return;
  }

  await handler(rest);
}

async function write(args) {
  const [componentId, sourcePath] = args;
  if (!componentId || !sourcePath) {
    throw new Error("Usage: rdna-playground variations write <component> <file>");
  }

  const contents = readFileSync(resolve(sourcePath), "utf-8");
  const result = await post("/generate/write", { componentId, contents });

  console.log(`Written: ${result.fileName}`);
  console.log(`Total iterations: ${result.totalIterations}`);
}
```

**Step 3: Manual test**

```bash
cat > /tmp/button-variation.tsx <<'EOF'
'use client';
export function Button() {
  return <button className="bg-page text-main">Test</button>;
}
EOF

cd tools/playground
node bin/rdna-playground.mjs variations write button /tmp/button-variation.tsx
```

Expected:
- the command prints the new iteration filename
- the browser updates without a manual refresh

**Step 4: Commit**

```bash
git add tools/playground/app/playground/api/generate/write/route.ts tools/playground/bin/commands/variations.mjs tools/playground/bin/rdna-playground.mjs
git commit -m "feat(playground): add server-backed variations write flow"
```

---

### Task 8: Refactor `generate` to Use the Shared Write Helper and Emit Refresh Events

Bring the existing generation route under the same verification rules as the new `write` route.

**Files:**
- Modify: `tools/playground/app/playground/api/generate/route.ts`

**Step 1: Replace inline file writes with the shared helper**

Update `generate/route.ts` to:

- import `listAllIterations`, `groupIterationsByComponent`, and `writeVerifiedIteration`
- remove local `listIterationsForComponent`, `nextIterationNumber`, and `listAllIterations` helpers
- write each extracted code block through `writeVerifiedIteration`
- track filenames written during the current request
- if any write fails, delete files written earlier in the same request and return `422`
- emit `signalStore.iterationsChanged(entry.id)` only after the whole batch succeeds

Core write loop:

```ts
const writtenFiles: string[] = [];

for (const code of codeBlocks) {
  try {
    const result = writeVerifiedIteration({
      monoRoot: resolve(process.cwd(), "../.."),
      iterationsDir: ITERATIONS_DIR,
      componentId: entry.id,
      contents: code,
    });

    writtenFiles.push(result.fileName);
  } catch (error) {
    for (const fileName of writtenFiles) {
      unlinkSync(resolve(ITERATIONS_DIR, fileName));
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Generation verification failed",
      },
      { status: 422 },
    );
  }
}

signalStore.iterationsChanged(entry.id);
```

Update `GET` to use:

```ts
const allFiles = listAllIterations(ITERATIONS_DIR);
const byComponent = groupIterationsByComponent(allFiles);
```

**Step 2: Manual test**

```bash
curl -X POST http://localhost:3004/playground/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"componentId":"button","variationCount":2}'
```

Expected:
- files are written only if they pass the RDNA gate
- browser updates without manual refresh

**Step 3: Commit**

```bash
git add tools/playground/app/playground/api/generate/route.ts
git commit -m "refactor(playground): route generation through shared verified write flow"
```

---

### Task 9: Add Single-File Delete and Make the Card Iteration List Prop-Driven

This fixes the stale iteration-list problem in `ComponentCard` and wires delete through the server.

**Files:**
- Create: `tools/playground/app/playground/api/generate/[file]/route.ts`
- Modify: `tools/playground/app/playground/nodes/ComponentCard.tsx`

**Step 1: Add the delete route**

```ts
import { NextResponse } from "next/server";
import { existsSync, unlinkSync } from "fs";
import { resolve } from "path";
import { signalStore } from "../../agent/signal-store";
import { parseIterationName } from "../../../lib/iteration-naming";
import { resolveIterationTarget } from "../../../lib/iterations.server";

const ITERATIONS_DIR = resolve(process.cwd(), "app/playground/iterations");

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const parsed = parseIterationName(file);

  if (!parsed) {
    return NextResponse.json({ error: "Invalid iteration filename" }, { status: 400 });
  }

  let target: string;
  try {
    target = resolveIterationTarget(ITERATIONS_DIR, file);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid filename" },
      { status: 400 },
    );
  }

  if (!existsSync(target)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  unlinkSync(target);
  signalStore.iterationsChanged(parsed.componentId);

  return NextResponse.json({ deleted: file });
}
```

**Step 2: Make `ComponentCard` use the prop directly**

In `ComponentCard.tsx`:

- remove `const [iterations, setIterations] = useState(initialIterations);`
- rename the prop binding to `iterations`
- delete the fake local `handleTrash` implementation that only mutates client state
- replace it with a real API call:

```tsx
async function handleTrash(fileName: string) {
  try {
    const res = await fetch(`/playground/api/generate/${encodeURIComponent(fileName)}`, {
      method: "DELETE",
    });
    const result = await res.json();
    if (!res.ok) {
      console.error("Trash failed:", result.error);
    }
  } catch (error) {
    console.error("Trash error:", error);
  }
}
```

Important: keep rendering from `iterations` props so the SSE-driven canvas refresh remains the source of truth.

**Step 3: Manual test**

1. Generate or write an iteration for `button`
2. Click the trash action on the variation card
3. Confirm the file disappears from the UI without a full page refresh

**Step 4: Commit**

```bash
git add tools/playground/app/playground/api/generate/\[file\]/route.ts tools/playground/app/playground/nodes/ComponentCard.tsx
git commit -m "feat(playground): add server-backed iteration delete and prop-driven card refresh"
```

---

### Task 10: Finish the Variation CLI Surface (`list`, `generate`, `trash`, `adopt`)

Add only thin wrappers over the routes that now exist.

**Files:**
- Modify: `tools/playground/bin/commands/variations.mjs`
- Modify: `tools/playground/README.md`

**Step 1: Fill in the remaining CLI commands**

```js
async function list(args) {
  const componentId = args[0];
  const data = await get("/generate");

  if (componentId) {
    const files = data.byComponent?.[componentId] || [];
    console.log(`${componentId}: ${files.length} iteration(s)`);
    for (const file of files) console.log(`  ${file}`);
    return;
  }

  console.log(`Total iterations: ${data.files.length}`);
  for (const [component, files] of Object.entries(data.byComponent || {})) {
    console.log(`${component}: ${files.length}`);
  }
}

async function generate(args) {
  const componentId = args[0];
  const variationCount = Number.parseInt(args[1] ?? "2", 10);
  if (!componentId) {
    throw new Error("Usage: rdna-playground variations generate <component> [count]");
  }

  const result = await post("/generate", { componentId, variationCount });
  console.log(`Generated ${result.writtenFiles.length} iteration(s)`);
  for (const file of result.writtenFiles) console.log(`  ${file}`);
}

async function trash(args) {
  const [componentId, iterationFile] = args;
  if (!componentId || !iterationFile) {
    throw new Error("Usage: rdna-playground variations trash <component> <iteration-file>");
  }

  await del(`/generate/${encodeURIComponent(iterationFile)}`);
  console.log(`Deleted: ${iterationFile}`);
}

async function adopt(args) {
  const [componentId, iterationFile] = args;
  if (!componentId || !iterationFile) {
    throw new Error("Usage: rdna-playground variations adopt <component> <iteration-file>");
  }

  const result = await post("/adopt", { componentId, iterationFile });
  console.log(`Adopted: ${result.iterationFile}`);
  console.log(`Target: ${result.targetPath}`);
}
```

**Step 2: Document the CLI in `README.md`**

Add a short section:

```md
## CLI

From `tools/playground/`:

- `node bin/rdna-playground.mjs work-start button`
- `node bin/rdna-playground.mjs work-end button`
- `node bin/rdna-playground.mjs variations generate button`
- `node bin/rdna-playground.mjs variations list button`
```

**Step 3: Manual test**

```bash
cd tools/playground
node bin/rdna-playground.mjs variations list
node bin/rdna-playground.mjs variations generate button
node bin/rdna-playground.mjs variations trash button button.iteration-1.tsx
```

Expected:
- the CLI mirrors route behavior
- the browser refreshes after generate/write/trash

**Step 4: Commit**

```bash
git add tools/playground/bin/commands/variations.mjs tools/playground/README.md
git commit -m "feat(playground): finish variation CLI wrappers"
```

---

## Verification Checklist

- [ ] `pnpm --filter @rdna/playground test`
- [ ] `pnpm --filter @rdna/playground typecheck`
- [ ] Manual SSE proof with `curl -N http://localhost:3004/playground/api/agent/signal`
- [ ] Manual glow proof: `work-start button` turns glow on, `work-end button` turns it off
- [ ] Manual variation write proof: `variations write` creates a file only if the RDNA gate passes
- [ ] Manual variation generate proof: `variations generate button` writes files and refreshes the UI
- [ ] Manual variation delete proof: trash from the card removes the file and refreshes the UI
- [ ] Manual adoption proof: `variations adopt` still runs lint + typecheck and returns the target path

## Notes for the Implementer

- Do not reintroduce direct file writes in the CLI.
- Do not add a second iteration-state source in `ComponentCard`.
- Do not add separate ReactFlow variant nodes in this phase.
- If the signal route needs cleanup changes during implementation, prefer `request.signal`-based cleanup over controller mutation hacks.
