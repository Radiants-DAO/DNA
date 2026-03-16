# Playground Annotations Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Add a component-level annotation system to the playground: store, API routes, CLI commands, badge UI, and a PreToolUse hook that auto-injects pending annotations into agent context.

**Architecture:** An in-memory annotation store manages annotation CRUD and emits `"annotations-changed"` events through the existing signal store's pub/sub, so the existing SSE endpoint at `/api/agent/signal` streams annotation events to all connected browsers with zero additional infrastructure. A dedicated `/api/agent/annotation` route handles REST operations. CLI commands wrap those routes. A PreToolUse hook queries pending annotations and prints them to stdout so they appear in agent context.

**Tech Stack:** TypeScript, Next.js App Router API routes, Vitest, existing signal store SSE infrastructure, existing CLI/hook patterns

---

## Scope Guardrails

- This plan covers Phase 1 only: data model, API, CLI, hook, badge count. No popover UI, no token inspector, no agent-spawning commands.
- Annotations are process-local (in-memory). They survive page reloads via localStorage on the browser side, but are lost on server restart.
- The annotation store emits events through the existing signal store — no second SSE endpoint.
- The PreToolUse hook injects annotations as informational stdout output (exit 0). It does not block tool execution.
- Annotation IDs use `crypto.randomUUID()` (available in Node 18.7+).

## Existing Repo Facts

- Signal store: `tools/playground/app/playground/api/agent/signal-store.ts` — singleton with pub/sub, emits `PlaygroundSignalEvent`
- Signal route: `tools/playground/app/playground/api/agent/signal/route.ts` — SSE GET + POST
- Signal event parser: `tools/playground/app/playground/lib/playground-signal-event.ts`
- Signal hook: `tools/playground/app/playground/hooks/usePlaygroundSignals.ts`
- Work signal hook: `.claude/hooks/playground-work-signal.sh`
- CLI entry: `tools/playground/bin/rdna-playground.mjs` — COMMANDS map with lazy imports
- CLI api helper: `tools/playground/bin/lib/api.mjs` — exports `get`, `post`, `del`
- ViolationBadge: `tools/playground/app/playground/components/ViolationBadge.tsx` — button + popover pattern
- ComponentCard header: `tools/playground/app/playground/nodes/ComponentCard.tsx` lines ~444-449
- Tests: zero-config vitest, files at `app/playground/lib/__tests__/*.test.ts`

## Execution Order

1. Extend the signal store event type first so the SSE infrastructure supports annotation events.
2. Build the annotation store and its test.
3. Add the API route.
4. Extend the browser event parser and hook.
5. Add CLI commands.
6. Add the badge to ComponentCard.
7. Add the PreToolUse hook.

---

## Task 1: Extend Signal Store Event Types

Add `"annotations-changed"` to the existing `PlaygroundSignalEvent` union and add an emitter method to the `SignalStore` class.

**Files:**
- Modify: `tools/playground/app/playground/api/agent/signal-store.ts`
- Modify: `tools/playground/app/playground/lib/__tests__/signal-store.test.ts`

**Step 1: Add the new event type and method**

In `signal-store.ts`, extend the `PlaygroundSignalEvent` type:

```ts
export type PlaygroundSignalEvent =
  | { type: "work-signals"; active: string[] }
  | { type: "iterations-changed"; componentId?: string }
  | { type: "annotations-changed"; componentId?: string };
```

Add a method to `SignalStore`:

```ts
  annotationsChanged(componentId?: string): void {
    this.emit({ type: "annotations-changed", componentId });
  }
```

**Step 2: Add a test for the new event**

Append to the existing describe block in `signal-store.test.ts`:

```ts
  it("broadcasts annotation change events", () => {
    const events: PlaygroundSignalEvent[] = [];
    const unsubscribe = signalStore.subscribe((event) => events.push(event));

    signalStore.annotationsChanged("button");

    unsubscribe();

    expect(events).toEqual([
      { type: "annotations-changed", componentId: "button" },
    ]);
  });
```

**Step 3: Run tests**

Run: `cd tools/playground && pnpm test -- --run app/playground/lib/__tests__/signal-store.test.ts`
Expected: PASS (4 tests)

**Step 4: Commit**

```bash
git add tools/playground/app/playground/api/agent/signal-store.ts tools/playground/app/playground/lib/__tests__/signal-store.test.ts
git commit -m "feat(playground): extend signal store with annotations-changed event"
```

---

## Task 2: Add the Annotation Store

Create a process-local annotation store with CRUD operations that emits events through the signal store.

**Files:**
- Create: `tools/playground/app/playground/api/agent/annotation-store.ts`
- Test: `tools/playground/app/playground/lib/__tests__/annotation-store.test.ts`

**Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  annotationStore,
  type PlaygroundAnnotation,
} from "../../api/agent/annotation-store";

beforeEach(() => {
  annotationStore.clearAll();
});

describe("annotationStore", () => {
  it("starts with no annotations", () => {
    expect(annotationStore.getAll()).toEqual([]);
  });

  it("adds an annotation and retrieves it", () => {
    const annotation = annotationStore.add({
      componentId: "button",
      intent: "fix",
      severity: "blocking",
      message: "Border radius should use radius-sm token",
    });

    expect(annotation.id).toBeDefined();
    expect(annotation.status).toBe("pending");
    expect(annotation.createdAt).toBeGreaterThan(0);

    const all = annotationStore.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].componentId).toBe("button");
  });

  it("filters by component", () => {
    annotationStore.add({
      componentId: "button",
      intent: "fix",
      severity: "blocking",
      message: "Fix border",
    });
    annotationStore.add({
      componentId: "card",
      intent: "change",
      severity: "suggestion",
      message: "Try warmer bg",
    });

    expect(annotationStore.getForComponent("button")).toHaveLength(1);
    expect(annotationStore.getForComponent("card")).toHaveLength(1);
    expect(annotationStore.getForComponent("toast")).toHaveLength(0);
  });

  it("filters by status", () => {
    const a = annotationStore.add({
      componentId: "button",
      intent: "fix",
      severity: "blocking",
      message: "Fix border",
    });

    annotationStore.resolve(a.id, "Fixed with radius-sm");

    expect(annotationStore.getPending()).toHaveLength(0);
    expect(annotationStore.getPending("button")).toHaveLength(0);
    expect(annotationStore.getAll()).toHaveLength(1);
    expect(annotationStore.getAll()[0].status).toBe("resolved");
    expect(annotationStore.getAll()[0].resolution).toBe("Fixed with radius-sm");
  });

  it("dismisses an annotation", () => {
    const a = annotationStore.add({
      componentId: "button",
      intent: "question",
      severity: "suggestion",
      message: "Should this be rounded?",
    });

    annotationStore.dismiss(a.id, "Not applicable");

    const all = annotationStore.getAll();
    expect(all[0].status).toBe("dismissed");
    expect(all[0].resolution).toBe("Not applicable");
  });

  it("throws on resolve/dismiss with invalid id", () => {
    expect(() => annotationStore.resolve("nonexistent", "done")).toThrow(
      "Annotation not found",
    );
    expect(() => annotationStore.dismiss("nonexistent", "skip")).toThrow(
      "Annotation not found",
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd tools/playground && pnpm test -- --run app/playground/lib/__tests__/annotation-store.test.ts`
Expected: FAIL with module-not-found errors

**Step 3: Write the implementation**

```ts
import { randomUUID } from "crypto";
import { signalStore } from "./signal-store";

export type AnnotationIntent = "fix" | "change" | "question" | "approve";
export type AnnotationSeverity = "blocking" | "important" | "suggestion";
export type AnnotationStatus = "pending" | "acknowledged" | "resolved" | "dismissed";

export interface PlaygroundAnnotation {
  id: string;
  componentId: string;
  intent: AnnotationIntent;
  severity: AnnotationSeverity;
  status: AnnotationStatus;
  message: string;
  resolution?: string;
  resolvedBy?: "human" | "agent";
  tokenOverrides?: Record<string, string>;
  variant?: string;
  createdAt: number;
  resolvedAt?: number;
}

export interface AddAnnotationInput {
  componentId: string;
  intent: AnnotationIntent;
  severity: AnnotationSeverity;
  message: string;
}

class AnnotationStore {
  private annotations = new Map<string, PlaygroundAnnotation>();

  add(input: AddAnnotationInput): PlaygroundAnnotation {
    const annotation: PlaygroundAnnotation = {
      id: randomUUID(),
      componentId: input.componentId,
      intent: input.intent,
      severity: input.severity,
      status: "pending",
      message: input.message,
      createdAt: Date.now(),
    };

    this.annotations.set(annotation.id, annotation);
    signalStore.annotationsChanged(input.componentId);
    return annotation;
  }

  resolve(id: string, summary?: string): PlaygroundAnnotation {
    const annotation = this.annotations.get(id);
    if (!annotation) throw new Error("Annotation not found");

    annotation.status = "resolved";
    annotation.resolution = summary;
    annotation.resolvedAt = Date.now();
    signalStore.annotationsChanged(annotation.componentId);
    return annotation;
  }

  dismiss(id: string, reason: string): PlaygroundAnnotation {
    const annotation = this.annotations.get(id);
    if (!annotation) throw new Error("Annotation not found");

    annotation.status = "dismissed";
    annotation.resolution = reason;
    annotation.resolvedAt = Date.now();
    signalStore.annotationsChanged(annotation.componentId);
    return annotation;
  }

  getAll(): PlaygroundAnnotation[] {
    return [...this.annotations.values()];
  }

  getForComponent(componentId: string): PlaygroundAnnotation[] {
    return this.getAll().filter((a) => a.componentId === componentId);
  }

  getPending(componentId?: string): PlaygroundAnnotation[] {
    return this.getAll().filter(
      (a) =>
        (a.status === "pending" || a.status === "acknowledged") &&
        (!componentId || a.componentId === componentId),
    );
  }

  getById(id: string): PlaygroundAnnotation | undefined {
    return this.annotations.get(id);
  }

  clearAll(): void {
    this.annotations.clear();
    signalStore.annotationsChanged();
  }
}

export const annotationStore = new AnnotationStore();
```

**Step 4: Run test to verify it passes**

Run: `cd tools/playground && pnpm test -- --run app/playground/lib/__tests__/annotation-store.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add tools/playground/app/playground/api/agent/annotation-store.ts tools/playground/app/playground/lib/__tests__/annotation-store.test.ts
git commit -m "feat(playground): add annotation store with CRUD and signal emission"
```

---

## Task 3: Add the Annotation API Route

Create the REST surface for annotation CRUD.

**Files:**
- Create: `tools/playground/app/playground/api/agent/annotation/route.ts`

**Step 1: Write the route**

```ts
import { NextResponse } from "next/server";
import { annotationStore } from "../annotation-store";
import type { AnnotationIntent, AnnotationSeverity } from "../annotation-store";

export const dynamic = "force-dynamic";

const VALID_INTENTS: AnnotationIntent[] = ["fix", "change", "question", "approve"];
const VALID_SEVERITIES: AnnotationSeverity[] = ["blocking", "important", "suggestion"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const componentId = url.searchParams.get("componentId") ?? undefined;
  const status = url.searchParams.get("status");

  if (status === "pending") {
    return NextResponse.json({
      annotations: annotationStore.getPending(componentId),
    });
  }

  if (componentId) {
    return NextResponse.json({
      annotations: annotationStore.getForComponent(componentId),
    });
  }

  return NextResponse.json({
    annotations: annotationStore.getAll(),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  const action = body.action as string;

  if (action === "annotate") {
    const { componentId, message, intent, severity } = body;

    if (!componentId || !message) {
      return NextResponse.json(
        { error: "Missing componentId or message" },
        { status: 400 },
      );
    }

    const resolvedIntent: AnnotationIntent =
      VALID_INTENTS.includes(intent) ? intent : "change";
    const resolvedSeverity: AnnotationSeverity =
      VALID_SEVERITIES.includes(severity) ? severity : "suggestion";

    const annotation = annotationStore.add({
      componentId,
      intent: resolvedIntent,
      severity: resolvedSeverity,
      message,
    });

    return NextResponse.json({ success: true, annotation });
  }

  if (action === "resolve") {
    const { id, summary } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    try {
      const annotation = annotationStore.resolve(id, summary);
      return NextResponse.json({ success: true, annotation });
    } catch {
      return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
    }
  }

  if (action === "dismiss") {
    const { id, reason } = body;
    if (!id || !reason) {
      return NextResponse.json(
        { error: "Missing id or reason" },
        { status: 400 },
      );
    }

    try {
      const annotation = annotationStore.dismiss(id, reason);
      return NextResponse.json({ success: true, annotation });
    } catch {
      return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
    }
  }

  if (action === "clear-all") {
    annotationStore.clearAll();
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
```

**Step 2: Commit**

```bash
git add tools/playground/app/playground/api/agent/annotation/route.ts
git commit -m "feat(playground): add annotation CRUD API route"
```

---

## Task 4: Extend Browser Event Parser and Hook

Teach the browser to recognize `"annotations-changed"` events and expose annotation state via a hook.

**Files:**
- Modify: `tools/playground/app/playground/lib/playground-signal-event.ts`
- Modify: `tools/playground/app/playground/lib/__tests__/playground-signal-event.test.ts`
- Create: `tools/playground/app/playground/hooks/usePlaygroundAnnotations.ts`

**Step 1: Add the test case**

Append to the test file:

```ts
  it("parses annotation change payloads", () => {
    expect(
      parsePlaygroundSignalEvent('{"type":"annotations-changed","componentId":"button"}'),
    ).toEqual({ type: "annotations-changed", componentId: "button" });
  });
```

**Step 2: Run test to verify it fails**

Run: `cd tools/playground && pnpm test -- --run app/playground/lib/__tests__/playground-signal-event.test.ts`
Expected: FAIL — the parser returns `null` for unknown type

**Step 3: Update the parser**

In `playground-signal-event.ts`, add a new branch after the `"iterations-changed"` check:

```ts
    if (data.type === "annotations-changed") {
      return {
        type: "annotations-changed",
        componentId: typeof data.componentId === "string" ? data.componentId : undefined,
      };
    }
```

**Step 4: Run test to verify it passes**

Run: `cd tools/playground && pnpm test -- --run app/playground/lib/__tests__/playground-signal-event.test.ts`
Expected: PASS (4 tests)

**Step 5: Create the annotation hook**

```ts
// hooks/usePlaygroundAnnotations.ts
"use client";

import { useCallback, useEffect, useState } from "react";

export interface ClientAnnotation {
  id: string;
  componentId: string;
  intent: string;
  severity: string;
  status: string;
  message: string;
  resolution?: string;
  createdAt: number;
  resolvedAt?: number;
}

export function usePlaygroundAnnotations(
  onAnnotationsChanged?: () => void,
): {
  annotations: ClientAnnotation[];
  refresh: () => void;
  countForComponent: (componentId: string) => number;
} {
  const [annotations, setAnnotations] = useState<ClientAnnotation[]>([]);

  const refresh = useCallback(() => {
    fetch("/playground/api/agent/annotation")
      .then((res) => (res.ok ? res.json() : { annotations: [] }))
      .then((data) => setAnnotations(data.annotations ?? []))
      .catch(() => setAnnotations([]));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (onAnnotationsChanged) {
      onAnnotationsChanged();
    }
  }, []);

  const countForComponent = useCallback(
    (componentId: string) =>
      annotations.filter(
        (a) =>
          a.componentId === componentId &&
          (a.status === "pending" || a.status === "acknowledged"),
      ).length,
    [annotations],
  );

  return { annotations, refresh, countForComponent };
}
```

**Step 6: Commit**

```bash
git add tools/playground/app/playground/lib/playground-signal-event.ts tools/playground/app/playground/lib/__tests__/playground-signal-event.test.ts tools/playground/app/playground/hooks/usePlaygroundAnnotations.ts
git commit -m "feat(playground): extend event parser and add annotation hook"
```

---

## Task 5: Add CLI Commands

Add `annotate`, `annotations`, `resolve`, and `dismiss` commands to the CLI.

**Files:**
- Create: `tools/playground/bin/commands/annotate.mjs`
- Modify: `tools/playground/bin/rdna-playground.mjs`

**Step 1: Create the annotate command module**

```js
// bin/commands/annotate.mjs
import { get, post } from "../lib/api.mjs";

export async function annotate(args) {
  const componentId = args[0];
  const message = args.slice(1).join(" ");

  if (!componentId || !message) {
    throw new Error(
      "Usage: rdna-playground annotate <component> <message> [--intent fix|change|question|approve] [--severity blocking|important|suggestion]",
    );
  }

  const intent = extractFlag(args, "--intent") || "change";
  const severity = extractFlag(args, "--severity") || "suggestion";
  const cleanMessage = args
    .filter((a, i) => {
      if (a === "--intent" || a === "--severity") return false;
      if (i > 0 && (args[i - 1] === "--intent" || args[i - 1] === "--severity"))
        return false;
      return true;
    })
    .slice(1)
    .join(" ");

  const result = await post("/agent/annotation", {
    action: "annotate",
    componentId,
    message: cleanMessage || message,
    intent,
    severity,
  });

  console.log(`Annotation created: ${result.annotation.id}`);
  console.log(`  [${result.annotation.intent}/${result.annotation.severity}] ${result.annotation.message}`);
}

export async function list(args) {
  const componentId = args[0];
  const statusFilter = extractFlag(args, "--status");

  let url = "/agent/annotation";
  const params = [];
  if (componentId && !componentId.startsWith("--")) params.push(`componentId=${componentId}`);
  if (statusFilter) params.push(`status=${statusFilter}`);
  if (params.length) url += `?${params.join("&")}`;

  const result = await get(url);
  const annotations = result.annotations || [];

  if (annotations.length === 0) {
    console.log("No annotations found.");
    return;
  }

  console.log(`${annotations.length} annotation(s):`);
  for (const a of annotations) {
    const status = a.status.toUpperCase().padEnd(12);
    console.log(`  ${a.id.slice(0, 8)} ${status} [${a.intent}/${a.severity}] ${a.componentId}: ${a.message}`);
    if (a.resolution) {
      console.log(`           resolved: ${a.resolution}`);
    }
  }
}

export async function resolve(args) {
  const id = args[0];
  const summary = args.slice(1).join(" ") || undefined;

  if (!id) {
    throw new Error("Usage: rdna-playground resolve <annotation-id> [summary]");
  }

  const result = await post("/agent/annotation", {
    action: "resolve",
    id,
    summary,
  });

  console.log(`Resolved: ${result.annotation.id.slice(0, 8)}`);
  if (summary) console.log(`  Summary: ${summary}`);
}

export async function dismiss(args) {
  const id = args[0];
  const reason = args.slice(1).join(" ");

  if (!id || !reason) {
    throw new Error("Usage: rdna-playground dismiss <annotation-id> <reason>");
  }

  const result = await post("/agent/annotation", {
    action: "dismiss",
    id,
    reason,
  });

  console.log(`Dismissed: ${result.annotation.id.slice(0, 8)}`);
  console.log(`  Reason: ${reason}`);
}

function extractFlag(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}
```

**Step 2: Update the CLI entry point**

In `tools/playground/bin/rdna-playground.mjs`, add the new commands to the COMMANDS map:

```js
const COMMANDS = {
  "work-start": () => import("./commands/work-signal.mjs").then((m) => m.workStart(args)),
  "work-end": () => import("./commands/work-signal.mjs").then((m) => m.workEnd(args)),
  status: () => import("./commands/status.mjs").then((m) => m.run()),
  variations: () => import("./commands/variations.mjs").then((m) => m.run(args)),
  annotate: () => import("./commands/annotate.mjs").then((m) => m.annotate(args)),
  annotations: () => import("./commands/annotate.mjs").then((m) => m.list(args)),
  resolve: () => import("./commands/annotate.mjs").then((m) => m.resolve(args)),
  dismiss: () => import("./commands/annotate.mjs").then((m) => m.dismiss(args)),
  help: () => printHelp(),
};
```

Update `printHelp()`:

```js
function printHelp() {
  console.log(`
rdna-playground

Usage:
  rdna-playground work-start <component>
  rdna-playground work-end [component]
  rdna-playground status
  rdna-playground variations <subcommand>
  rdna-playground annotate <component> <message> [--intent fix|change|question|approve] [--severity blocking|important|suggestion]
  rdna-playground annotations [component] [--status pending]
  rdna-playground resolve <annotation-id> [summary]
  rdna-playground dismiss <annotation-id> <reason>
`);
}
```

**Step 3: Commit**

```bash
git add tools/playground/bin/commands/annotate.mjs tools/playground/bin/rdna-playground.mjs
git commit -m "feat(playground): add annotation CLI commands"
```

---

## Task 6: Add Annotation Badge to ComponentCard

Show a pending annotation count badge in the card header, next to ViolationBadge.

**Files:**
- Create: `tools/playground/app/playground/components/AnnotationBadge.tsx`
- Modify: `tools/playground/app/playground/nodes/ComponentCard.tsx`
- Create: `tools/playground/app/playground/annotation-context.ts`
- Modify: `tools/playground/app/playground/PlaygroundCanvas.tsx`

**Step 1: Create the annotation context**

```ts
// annotation-context.ts
"use client";

import { createContext, useContext } from "react";

export type AnnotationCountFn = (componentId: string) => number;

export const AnnotationCountContext = createContext<AnnotationCountFn>(() => 0);

export function useAnnotationCount(): AnnotationCountFn {
  return useContext(AnnotationCountContext);
}
```

**Step 2: Create the AnnotationBadge component**

```tsx
// components/AnnotationBadge.tsx
"use client";

import { useAnnotationCount } from "../annotation-context";

interface AnnotationBadgeProps {
  componentId: string;
}

export function AnnotationBadge({ componentId }: AnnotationBadgeProps) {
  const getCount = useAnnotationCount();
  const count = getCount(componentId);

  if (count === 0) return null;

  return (
    <button
      className="flex items-center gap-1 rounded-sm border border-[rgba(96,165,250,0.4)] bg-[rgba(96,165,250,0.12)] px-1.5 py-0.5 font-mono text-[10px] text-[#60a5fa] transition-colors hover:bg-[rgba(96,165,250,0.2)]"
      title={`${count} pending annotation${count === 1 ? "" : "s"}`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {count}
    </button>
  );
}
```

**Step 3: Wire annotation data into the canvas**

In `PlaygroundCanvas.tsx`:

1. Add imports:
```ts
import { usePlaygroundAnnotations } from "./hooks/usePlaygroundAnnotations";
import { AnnotationCountContext } from "./annotation-context";
```

2. Inside the `PlaygroundCanvas` component, after the `workSignals` hook call, add:
```ts
const { countForComponent, refresh: refreshAnnotations } = usePlaygroundAnnotations();
```

3. In the `usePlaygroundSignals` callback, also refresh annotations when an `annotations-changed` event arrives. The existing `usePlaygroundSignals` hook already calls `refreshIterations` on any non-work-signal event. To also refresh annotations, update the callback:

In the existing code where `usePlaygroundSignals` is called:
```ts
const workSignals = usePlaygroundSignals(() => {
  refreshIterations();
});
```

Change to:
```ts
const workSignals = usePlaygroundSignals(() => {
  refreshIterations();
  refreshAnnotations();
});
```

4. Wrap the provider tree. Replace:
```tsx
<WorkSignalContext.Provider value={workSignals}>
  <IterationMapContext.Provider value={iterationMap}>
```
With:
```tsx
<WorkSignalContext.Provider value={workSignals}>
  <AnnotationCountContext.Provider value={countForComponent}>
    <IterationMapContext.Provider value={iterationMap}>
```

And add the closing tag:
```tsx
    </IterationMapContext.Provider>
  </AnnotationCountContext.Provider>
</WorkSignalContext.Provider>
```

**Step 4: Add the badge to ComponentCard**

In `ComponentCard.tsx`:

1. Add import:
```tsx
import { AnnotationBadge } from "../components/AnnotationBadge";
```

2. In the header section, wrap the right-side badges. Replace:
```tsx
{violations && <ViolationBadge violations={violations} compact />}
```
With:
```tsx
<div className="flex items-center gap-1">
  <AnnotationBadge componentId={entry.id} />
  {violations && <ViolationBadge violations={violations} compact />}
</div>
```

**Step 5: Commit**

```bash
git add tools/playground/app/playground/components/AnnotationBadge.tsx tools/playground/app/playground/annotation-context.ts tools/playground/app/playground/PlaygroundCanvas.tsx tools/playground/app/playground/nodes/ComponentCard.tsx
git commit -m "feat(playground): add annotation count badge to component cards"
```

---

## Task 7: Add the PreToolUse Hook for Annotation Injection

Create a hook that checks for pending annotations when agents edit component files and prints them to stdout so they appear in agent context.

**Files:**
- Create: `.claude/hooks/playground-annotation-inject.sh`
- Modify: root `CLAUDE.md` (add documentation)

**Step 1: Write the hook script**

```bash
#!/bin/bash
# Pre-tool-use hook: inject pending annotations into agent context when
# editing component files. Only fires if the playground is running.
# Outputs to stdout (exit 0) — informational, never blocks.

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Nothing to do without a file path
[ -z "$FILE" ] && exit 0

# Match component source files and extract the component ID.
COMPONENT_ID=""

if echo "$FILE" | grep -qE 'packages/[^/]+/components/core/[^/]+/'; then
  COMPONENT_ID=$(echo "$FILE" | sed -E 's|.*packages/[^/]+/components/core/([^/]+)/.*|\1|' | tr '[:upper:]' '[:lower:]')
elif echo "$FILE" | grep -qE 'apps/[^/]+/(src/)?components/[^/]+'; then
  COMPONENT_ID=$(echo "$FILE" | sed -E 's|.*components/([^/]+)(\.[^/]+)?(/.*)?$|\1|' | sed 's/\..*//' | tr '[:upper:]' '[:lower:]')
fi

[ -z "$COMPONENT_ID" ] && exit 0

# Check if the playground is actually running (1s timeout, fail silently)
RESPONSE=$(curl -sf --max-time 1 "http://localhost:3004/playground/api/agent/annotation?componentId=$COMPONENT_ID&status=pending" 2>/dev/null)

[ -z "$RESPONSE" ] && exit 0

# Parse annotation count
COUNT=$(echo "$RESPONSE" | jq '.annotations | length' 2>/dev/null)

[ "$COUNT" = "0" ] || [ -z "$COUNT" ] && exit 0

# Format and output pending annotations to stdout
echo ""
echo "[playground] $COUNT pending annotation(s) on \"$COMPONENT_ID\":"
echo "$RESPONSE" | jq -r '.annotations[] | "  [\(.intent)/\(.severity)] \(.message)"' 2>/dev/null
echo ""

exit 0
```

**Step 2: Make it executable**

```bash
chmod +x .claude/hooks/playground-annotation-inject.sh
```

**Step 3: Document the hook registration**

The user needs to add this to their `.claude/settings.json` PreToolUse hooks array (alongside the existing work-signal hook):

```json
{
  "matcher": "Edit|Write",
  "hooks": [
    {
      "type": "command",
      "command": ".claude/hooks/playground-annotation-inject.sh",
      "timeout": 5
    }
  ]
}
```

**Step 4: Update root CLAUDE.md**

Add a section under the existing "Playground Work Signals" section:

```md
### Annotation Injection

When the playground is running, pending annotations for the component you're editing are **automatically printed** via a PreToolUse hook (`.claude/hooks/playground-annotation-inject.sh`). You'll see output like:

```
[playground] 2 pending annotation(s) on "button":
  [fix/blocking] Border radius should use radius-sm token, not hardcoded 4px
  [change/suggestion] Consider warmer hover state for the brand refresh
```

Address these annotations in your work. When done, resolve them:

```bash
node tools/playground/bin/rdna-playground.mjs resolve <annotation-id> "Fixed with radius-sm"
```

Or dismiss if not applicable:

```bash
node tools/playground/bin/rdna-playground.mjs dismiss <annotation-id> "Not applicable to this variant"
```
```

**Step 5: Commit**

```bash
git add .claude/hooks/playground-annotation-inject.sh
git commit -m "feat(playground): add PreToolUse hook for annotation context injection"
```

---

## Task 8: Update Playground Documentation

Update the playground README with annotation system documentation.

**Files:**
- Modify: `tools/playground/README.md`

**Step 1: Add an Annotations section**

After the "Live Work Signals" section, add:

```md
## Annotations

Humans leave structured notes on components for agents to read and act on. Annotations are injected into agent context automatically via a PreToolUse hook.

### Creating annotations

```bash
node bin/rdna-playground.mjs annotate button "Border radius should use radius-sm token" --intent fix --severity blocking
node bin/rdna-playground.mjs annotate card "Try warmer background for brand refresh" --intent change --severity suggestion
```

Defaults: `--intent change`, `--severity suggestion`.

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

A PreToolUse hook at `.claude/hooks/playground-annotation-inject.sh` automatically prints pending annotations when agents edit component files. Agents see the annotations in their context and can resolve them via CLI after making changes.

### Annotation API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/playground/api/agent/annotation` | List all annotations |
| `GET` | `/playground/api/agent/annotation?componentId=X` | Filter by component |
| `GET` | `/playground/api/agent/annotation?status=pending` | Filter by status |
| `POST` | `/playground/api/agent/annotation` | Create, resolve, or dismiss |

POST body actions:

```json
{ "action": "annotate", "componentId": "button", "message": "...", "intent": "fix", "severity": "blocking" }
{ "action": "resolve", "id": "<uuid>", "summary": "Fixed" }
{ "action": "dismiss", "id": "<uuid>", "reason": "Not applicable" }
{ "action": "clear-all" }
```

### Taxonomy

**Intent:** fix, change, question, approve
**Severity:** blocking, important, suggestion
**Status:** pending, acknowledged, resolved, dismissed
```

**Step 2: Update the file structure diagram**

Add under `api/agent/`:

```
    │   ├── agent/
    │   │   ├── signal-store.ts      # Process-local signal pub/sub
    │   │   ├── annotation-store.ts  # Process-local annotation CRUD
    │   │   ├── signal/route.ts      # SSE stream + work signal POST
    │   │   └── annotation/route.ts  # Annotation CRUD POST + listing GET
```

**Step 3: Commit**

```bash
git add tools/playground/README.md
git commit -m "docs(playground): add annotation system documentation"
```

---

## Verification Checklist

- [ ] `pnpm --filter @rdna/playground test` — all tests pass
- [ ] `pnpm --filter @rdna/playground typecheck` — no type errors
- [ ] Manual: `node bin/rdna-playground.mjs annotate button "Test annotation"` — creates annotation
- [ ] Manual: `node bin/rdna-playground.mjs annotations` — lists the annotation
- [ ] Manual: `node bin/rdna-playground.mjs resolve <id> "Done"` — resolves it
- [ ] Manual: Badge appears on the Button card in the playground UI
- [ ] Manual: Badge count updates when annotations are added/resolved (via SSE refresh)
- [ ] Manual: Annotation injection hook prints pending annotations when editing a component file (requires hook registration in `.claude/settings.json`)
