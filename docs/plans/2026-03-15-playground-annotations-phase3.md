# Playground Annotations Phase 3: Popover UI + Positioned Pins

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Add x-y positioned annotation pins on component cards with click-to-place, a detail popover for view/resolve/dismiss, and a list popover on badge click.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA` (main checkout, `main` branch)

**Architecture:** Annotation pins render as `position: absolute` children inside each ComponentCard's component render area, using percentage-based coordinates (0-100). Because pins are DOM children of ReactFlow nodes, they move with pan/zoom/drag automatically — no repositioning logic. An "annotate mode" toggle on each card header enables click-to-place. Clicking a pin opens a detail popover; clicking the badge opens a list popover. All mutations go through the existing annotation API route.

**Tech Stack:** TypeScript, React, existing annotation API + SSE infrastructure, existing playground UI patterns (gold/cream palette)

---

## Scope

- Add `x`/`y` coordinates to the annotation data model (optional — CLI-created annotations have no position)
- Render positioned pins on component cards for annotations that have coordinates
- Click-to-place: toggle annotate mode on a card, click the render area to place a pin and open a composer
- Pin click: open detail popover showing message, intent, severity, status — with resolve/dismiss actions
- Badge click: open list popover showing all annotations for the component
- No token inspector, no token editor, no agent-spawning commands

## Existing State (Phase 1 complete)

- Annotation store: `api/agent/annotation-store.ts` — CRUD, `PlaygroundAnnotation` type, signal emission
- API route: `api/agent/annotation/route.ts` — GET (filter by component/status) + POST (annotate/resolve/dismiss/clear-all)
- Client hook: `hooks/usePlaygroundAnnotations.ts` — `{ annotations, refresh, countForComponent }`
- Context: `annotation-context.ts` — `AnnotationCountContext` provides `countForComponent`
- Badge: `components/AnnotationBadge.tsx` — count badge in card header
- Canvas: `PlaygroundCanvas.tsx` — provides annotation count context, refreshes on SSE events
- ComponentCard: `nodes/ComponentCard.tsx` — 623 lines, render area at lines 570-581

## Execution Order

**Phase 1:** Task 1 (data model + API x/y support)
**Phase 2:** Task 2 (expand context to expose full annotations) + Task 3 (pin component) — parallel, independent
**Phase 3:** Task 4 (composer popover) — needs pin component
**Phase 4:** Task 5 (detail popover on pin click) + Task 6 (list popover on badge click) — parallel
**Phase 5:** Task 7 (wire everything into ComponentCard + annotate mode toggle)

---

## Task 1: Add x/y Coordinates to Data Model and API

**Files:**
- Modify: `tools/playground/app/playground/api/agent/annotation-store.ts`
- Modify: `tools/playground/app/playground/api/agent/annotation/route.ts`
- Modify: `tools/playground/app/playground/hooks/usePlaygroundAnnotations.ts`
- Modify: `tools/playground/app/playground/lib/__tests__/annotation-route.test.ts`
- Modify: `tools/playground/app/playground/lib/__tests__/annotation-store.test.ts`

**Step 1: Add x/y to the store types**

In `annotation-store.ts`, add optional coordinates to both interfaces:

```ts
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
  x?: number;          // percentage (0-100) of card render area width
  y?: number;          // percentage (0-100) of card render area height
  createdAt: number;
  resolvedAt?: number;
}

export interface AddAnnotationInput {
  componentId: string;
  intent: AnnotationIntent;
  severity: AnnotationSeverity;
  message: string;
  x?: number;
  y?: number;
}
```

In the `add()` method, pass coordinates through:

```ts
  add(input: AddAnnotationInput): PlaygroundAnnotation {
    const annotation: PlaygroundAnnotation = {
      id: randomUUID(),
      componentId: input.componentId,
      intent: input.intent,
      severity: input.severity,
      status: "pending",
      message: input.message,
      x: input.x,
      y: input.y,
      createdAt: Date.now(),
    };
    // ...
  }
```

**Step 2: Update the API route to accept x/y**

In `annotation/route.ts`, in the `action === "annotate"` block, extract and pass coordinates:

```ts
    const { componentId, message, intent, severity, x, y } = body;
    // ... after normalizedId, resolvedIntent, resolvedSeverity ...

    const annotation = annotationStore.add({
      componentId: normalizedId,
      intent: resolvedIntent,
      severity: resolvedSeverity,
      message,
      x: typeof x === "number" ? x : undefined,
      y: typeof y === "number" ? y : undefined,
    });
```

**Step 3: Update the client type**

In `hooks/usePlaygroundAnnotations.ts`, add x/y to `ClientAnnotation`:

```ts
export interface ClientAnnotation {
  id: string;
  componentId: string;
  intent: string;
  severity: string;
  status: string;
  message: string;
  resolution?: string;
  x?: number;
  y?: number;
  createdAt: number;
  resolvedAt?: number;
}
```

**Step 4: Add tests**

In `annotation-store.test.ts`, add:

```ts
  it("stores x/y coordinates when provided", () => {
    const annotation = annotationStore.add({
      componentId: "button",
      intent: "fix",
      severity: "blocking",
      message: "This corner radius",
      x: 85.5,
      y: 12.3,
    });

    expect(annotation.x).toBe(85.5);
    expect(annotation.y).toBe(12.3);
  });

  it("leaves x/y undefined when not provided", () => {
    const annotation = annotationStore.add({
      componentId: "button",
      intent: "change",
      severity: "suggestion",
      message: "No position",
    });

    expect(annotation.x).toBeUndefined();
    expect(annotation.y).toBeUndefined();
  });
```

In `annotation-route.test.ts`, add under a new `describe("coordinates")`:

```ts
  describe("coordinates", () => {
    it("accepts x/y on annotate", async () => {
      const res = await POST(
        makeRequest("http://localhost/api/agent/annotation", {
          action: "annotate",
          componentId: "button",
          message: "This corner",
          x: 85.5,
          y: 12.3,
        }),
      );
      const data = await res.json();
      expect(data.annotation.x).toBe(85.5);
      expect(data.annotation.y).toBe(12.3);
    });

    it("ignores non-numeric x/y", async () => {
      const res = await POST(
        makeRequest("http://localhost/api/agent/annotation", {
          action: "annotate",
          componentId: "button",
          message: "Bad coords",
          x: "not-a-number",
          y: null,
        }),
      );
      const data = await res.json();
      expect(data.annotation.x).toBeUndefined();
      expect(data.annotation.y).toBeUndefined();
    });
  });
```

**Step 5: Run tests**

Run: `cd tools/playground && pnpm test -- --run`
Expected: All pass (new count: ~140)

**Step 6: Commit**

```bash
git add tools/playground/app/playground/api/agent/annotation-store.ts tools/playground/app/playground/api/agent/annotation/route.ts tools/playground/app/playground/hooks/usePlaygroundAnnotations.ts tools/playground/app/playground/lib/__tests__/annotation-store.test.ts tools/playground/app/playground/lib/__tests__/annotation-route.test.ts
git commit -m "feat(playground): add x/y coordinate support to annotation data model"
```

---

## Task 2: Expand Annotation Context

Replace `AnnotationCountContext` with a richer context that exposes both `countForComponent` and `annotationsForComponent`, so ComponentCard can render pins.

**Files:**
- Modify: `tools/playground/app/playground/annotation-context.ts`
- Modify: `tools/playground/app/playground/components/AnnotationBadge.tsx`
- Modify: `tools/playground/app/playground/PlaygroundCanvas.tsx`
- Modify: `tools/playground/app/playground/hooks/usePlaygroundAnnotations.ts`

**Step 1: Expand the context type**

Replace the contents of `annotation-context.ts`:

```ts
"use client";

import { createContext, useContext } from "react";
import type { ClientAnnotation } from "./hooks/usePlaygroundAnnotations";

export interface AnnotationContextValue {
  countForComponent: (componentId: string) => number;
  annotationsForComponent: (componentId: string) => ClientAnnotation[];
}

const defaultValue: AnnotationContextValue = {
  countForComponent: () => 0,
  annotationsForComponent: () => [],
};

export const AnnotationContext = createContext<AnnotationContextValue>(defaultValue);

export function useAnnotationContext(): AnnotationContextValue {
  return useContext(AnnotationContext);
}
```

**Step 2: Add `annotationsForComponent` to the hook**

In `hooks/usePlaygroundAnnotations.ts`, add a new memoized function and update the return type:

```ts
export function usePlaygroundAnnotations(): {
  annotations: ClientAnnotation[];
  refresh: () => void;
  countForComponent: (componentId: string) => number;
  annotationsForComponent: (componentId: string) => ClientAnnotation[];
} {
  // ... existing code ...

  const annotationsForComponent = useCallback(
    (componentId: string) =>
      annotations.filter((a) => a.componentId === componentId),
    [annotations],
  );

  return { annotations, refresh, countForComponent, annotationsForComponent };
}
```

**Step 3: Update PlaygroundCanvas to provide the expanded context**

In `PlaygroundCanvas.tsx`:

1. Update imports — replace `AnnotationCountContext` with `AnnotationContext`:
```ts
import { AnnotationContext } from "./annotation-context";
```

2. Destructure the new function:
```ts
const { countForComponent, annotationsForComponent, refresh: refreshAnnotations } = usePlaygroundAnnotations();
```

3. Update the provider — replace `AnnotationCountContext.Provider` with `AnnotationContext.Provider`:
```tsx
<AnnotationContext.Provider value={{ countForComponent, annotationsForComponent }}>
```

And the closing tag:
```tsx
</AnnotationContext.Provider>
```

**Step 4: Update AnnotationBadge**

In `components/AnnotationBadge.tsx`, update the import and usage:

```tsx
"use client";

import { useAnnotationContext } from "../annotation-context";

interface AnnotationBadgeProps {
  componentId: string;
  onClick?: () => void;
}

export function AnnotationBadge({ componentId, onClick }: AnnotationBadgeProps) {
  const { countForComponent } = useAnnotationContext();
  const count = countForComponent(componentId);

  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-sm border border-[rgba(254,248,226,0.25)] bg-[rgba(254,248,226,0.08)] px-1.5 py-0.5 font-mono text-[10px] text-[#FEF8E2] transition-colors hover:bg-[rgba(254,248,226,0.15)]"
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

Note: Added `onClick` prop for Task 6 (list popover). For now it's optional and unused.

**Step 5: Commit**

```bash
git add tools/playground/app/playground/annotation-context.ts tools/playground/app/playground/components/AnnotationBadge.tsx tools/playground/app/playground/PlaygroundCanvas.tsx tools/playground/app/playground/hooks/usePlaygroundAnnotations.ts
git commit -m "feat(playground): expand annotation context with annotationsForComponent"
```

---

## Task 3: Create AnnotationPin Component

A small numbered pin marker rendered at percentage coordinates inside a component's render area.

**Files:**
- Create: `tools/playground/app/playground/components/AnnotationPin.tsx`

**Step 1: Write the component**

```tsx
"use client";

import type { ClientAnnotation } from "../hooks/usePlaygroundAnnotations";

interface AnnotationPinProps {
  annotation: ClientAnnotation;
  index: number;
  onClick: (annotation: ClientAnnotation, element: HTMLElement) => void;
}

export function AnnotationPin({ annotation, index, onClick }: AnnotationPinProps) {
  if (annotation.x == null || annotation.y == null) return null;

  const isPending = annotation.status === "pending" || annotation.status === "acknowledged";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(annotation, e.currentTarget);
      }}
      className="group/pin absolute z-10 flex -translate-x-1/2 -translate-y-full cursor-pointer items-center justify-center"
      style={{
        left: `${annotation.x}%`,
        top: `${annotation.y}%`,
      }}
      title={annotation.message}
    >
      {/* Pin stem */}
      <div className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2 bg-[rgba(254,248,226,0.5)]" />
      {/* Pin head */}
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[9px] leading-none transition-transform group-hover/pin:scale-110 ${
          isPending
            ? "border-[rgba(254,248,226,0.6)] bg-[rgba(254,248,226,0.18)] text-[#FEF8E2]"
            : "border-[rgba(254,248,226,0.25)] bg-[rgba(254,248,226,0.06)] text-[rgba(254,248,226,0.4)]"
        }`}
        style={{ marginBottom: 8 }}
      >
        {index + 1}
      </div>
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add tools/playground/app/playground/components/AnnotationPin.tsx
git commit -m "feat(playground): add AnnotationPin component for positioned markers"
```

---

## Task 4: Create Annotation Composer Popover

A small form that appears at the click position for creating new annotations.

**Files:**
- Create: `tools/playground/app/playground/components/AnnotationComposer.tsx`

**Step 1: Write the component**

```tsx
"use client";

import { useRef, useState, useEffect } from "react";

interface AnnotationComposerProps {
  componentId: string;
  x: number;
  y: number;
  /** Pixel position relative to the card render area, for visual placement */
  anchorLeft: number;
  anchorTop: number;
  onSubmit: () => void;
  onCancel: () => void;
}

const INTENTS = ["fix", "change", "question", "approve"] as const;
const SEVERITIES = ["blocking", "important", "suggestion"] as const;

export function AnnotationComposer({
  componentId,
  x,
  y,
  anchorLeft,
  anchorTop,
  onSubmit,
  onCancel,
}: AnnotationComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState("");
  const [intent, setIntent] = useState<(typeof INTENTS)[number]>("change");
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>("suggestion");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/playground/api/agent/annotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "annotate",
          componentId,
          message: message.trim(),
          intent,
          severity,
          x,
          y,
        }),
      });

      if (res.ok) {
        onSubmit();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      className="absolute z-30"
      style={{ left: anchorLeft, top: anchorTop + 4 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-64 rounded-sm border border-[rgba(254,248,226,0.2)] bg-[#1a1814] shadow-lg">
        <div className="border-b border-[rgba(254,248,226,0.1)] px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[rgba(254,248,226,0.5)]">
            New annotation
          </span>
        </div>

        <div className="flex flex-col gap-2 p-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs attention here?"
            rows={3}
            className="w-full resize-none rounded-xs border border-[rgba(254,248,226,0.12)] bg-[#0F0E0C] px-2 py-1.5 font-mono text-xs text-[#FEF8E2] placeholder:text-[rgba(254,248,226,0.3)] focus:border-[rgba(254,248,226,0.3)] focus:outline-none"
          />

          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[rgba(254,248,226,0.4)]">
                Intent
              </span>
              <select
                value={intent}
                onChange={(e) => setIntent(e.target.value as typeof intent)}
                className="rounded-xs border border-[rgba(254,248,226,0.12)] bg-[#0F0E0C] px-1.5 py-1 font-mono text-[10px] text-[#FEF8E2] focus:outline-none"
              >
                {INTENTS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[rgba(254,248,226,0.4)]">
                Severity
              </span>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as typeof severity)}
                className="rounded-xs border border-[rgba(254,248,226,0.12)] bg-[#0F0E0C] px-1.5 py-1 font-mono text-[10px] text-[#FEF8E2] focus:outline-none"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[9px] text-[rgba(254,248,226,0.3)]">
              ⌘+Enter to submit
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={onCancel}
                className="rounded-xs px-2 py-1 font-mono text-[10px] text-[rgba(254,248,226,0.5)] hover:bg-[rgba(254,248,226,0.06)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || submitting}
                className="rounded-xs border border-[rgba(254,248,226,0.2)] bg-[rgba(254,248,226,0.08)] px-2 py-1 font-mono text-[10px] text-[#FEF8E2] hover:bg-[rgba(254,248,226,0.14)] disabled:opacity-40"
              >
                {submitting ? "..." : "Pin"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add tools/playground/app/playground/components/AnnotationComposer.tsx
git commit -m "feat(playground): add annotation composer popover for click-to-place"
```

---

## Task 5: Create Annotation Detail Popover

Shows annotation details when a pin is clicked. Includes resolve/dismiss actions.

**Files:**
- Create: `tools/playground/app/playground/components/AnnotationDetail.tsx`

**Step 1: Write the component**

```tsx
"use client";

import { useState } from "react";
import type { ClientAnnotation } from "../hooks/usePlaygroundAnnotations";

interface AnnotationDetailProps {
  annotation: ClientAnnotation;
  anchorElement: HTMLElement;
  onClose: () => void;
  onResolved: () => void;
}

const INTENT_LABELS: Record<string, string> = {
  fix: "Fix",
  change: "Change",
  question: "Question",
  approve: "Approve",
};

const SEVERITY_COLORS: Record<string, string> = {
  blocking: "text-[#ff6b6b]",
  important: "text-[#ffd43b]",
  suggestion: "text-[rgba(254,248,226,0.6)]",
};

export function AnnotationDetail({
  annotation,
  anchorElement,
  onClose,
  onResolved,
}: AnnotationDetailProps) {
  const [resolveText, setResolveText] = useState("");
  const [dismissText, setDismissText] = useState("");
  const [mode, setMode] = useState<"view" | "resolve" | "dismiss">("view");
  const [submitting, setSubmitting] = useState(false);

  const rect = anchorElement.getBoundingClientRect();
  const parentRect = anchorElement.offsetParent?.getBoundingClientRect() ?? rect;
  const left = rect.left - parentRect.left;
  const top = rect.bottom - parentRect.top + 4;

  const isPending = annotation.status === "pending" || annotation.status === "acknowledged";

  const handleAction = async (action: "resolve" | "dismiss") => {
    setSubmitting(true);
    try {
      const body: Record<string, string> = { action, id: annotation.id };
      if (action === "resolve") body.summary = resolveText.trim() || undefined as unknown as string;
      if (action === "dismiss") body.reason = dismissText.trim();

      const res = await fetch("/playground/api/agent/annotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onResolved();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (mode === "resolve") handleAction("resolve");
      if (mode === "dismiss" && dismissText.trim()) handleAction("dismiss");
    }
  };

  const age = formatAge(annotation.createdAt);

  return (
    <div
      className="absolute z-30"
      style={{ left, top }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-64 rounded-sm border border-[rgba(254,248,226,0.2)] bg-[#1a1814] shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(254,248,226,0.1)] px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#FEF8E2]">
              {INTENT_LABELS[annotation.intent] ?? annotation.intent}
            </span>
            <span className={`font-mono text-[9px] uppercase ${SEVERITY_COLORS[annotation.severity] ?? ""}`}>
              {annotation.severity}
            </span>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[10px] text-[rgba(254,248,226,0.4)] hover:text-[#FEF8E2]"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-2 p-3">
          <p className="font-mono text-xs leading-relaxed text-[#FEF8E2]">
            {annotation.message}
          </p>

          <span className="font-mono text-[9px] text-[rgba(254,248,226,0.3)]">
            {age} · {annotation.status}
            {annotation.resolution ? ` · ${annotation.resolution}` : ""}
          </span>

          {/* Actions for pending annotations */}
          {isPending && mode === "view" && (
            <div className="flex gap-1.5 border-t border-[rgba(254,248,226,0.08)] pt-2">
              <button
                onClick={() => setMode("resolve")}
                className="flex-1 rounded-xs border border-[rgba(254,248,226,0.15)] px-2 py-1 font-mono text-[10px] text-[#FEF8E2] hover:bg-[rgba(254,248,226,0.06)]"
              >
                Resolve
              </button>
              <button
                onClick={() => setMode("dismiss")}
                className="flex-1 rounded-xs px-2 py-1 font-mono text-[10px] text-[rgba(254,248,226,0.5)] hover:bg-[rgba(254,248,226,0.06)]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Resolve form */}
          {isPending && mode === "resolve" && (
            <div className="flex flex-col gap-1.5 border-t border-[rgba(254,248,226,0.08)] pt-2">
              <input
                type="text"
                value={resolveText}
                onChange={(e) => setResolveText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Summary (optional)"
                autoFocus
                className="w-full rounded-xs border border-[rgba(254,248,226,0.12)] bg-[#0F0E0C] px-2 py-1 font-mono text-[10px] text-[#FEF8E2] placeholder:text-[rgba(254,248,226,0.3)] focus:outline-none"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => setMode("view")}
                  className="rounded-xs px-2 py-1 font-mono text-[10px] text-[rgba(254,248,226,0.5)]"
                >
                  Back
                </button>
                <button
                  onClick={() => handleAction("resolve")}
                  disabled={submitting}
                  className="rounded-xs border border-[rgba(254,248,226,0.2)] bg-[rgba(254,248,226,0.08)] px-2 py-1 font-mono text-[10px] text-[#FEF8E2] hover:bg-[rgba(254,248,226,0.14)] disabled:opacity-40"
                >
                  {submitting ? "..." : "Resolve"}
                </button>
              </div>
            </div>
          )}

          {/* Dismiss form */}
          {isPending && mode === "dismiss" && (
            <div className="flex flex-col gap-1.5 border-t border-[rgba(254,248,226,0.08)] pt-2">
              <input
                type="text"
                value={dismissText}
                onChange={(e) => setDismissText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reason (required)"
                autoFocus
                className="w-full rounded-xs border border-[rgba(254,248,226,0.12)] bg-[#0F0E0C] px-2 py-1 font-mono text-[10px] text-[#FEF8E2] placeholder:text-[rgba(254,248,226,0.3)] focus:outline-none"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => setMode("view")}
                  className="rounded-xs px-2 py-1 font-mono text-[10px] text-[rgba(254,248,226,0.5)]"
                >
                  Back
                </button>
                <button
                  onClick={() => handleAction("dismiss")}
                  disabled={!dismissText.trim() || submitting}
                  className="rounded-xs border border-[rgba(254,248,226,0.2)] bg-[rgba(254,248,226,0.08)] px-2 py-1 font-mono text-[10px] text-[#FEF8E2] hover:bg-[rgba(254,248,226,0.14)] disabled:opacity-40"
                >
                  {submitting ? "..." : "Dismiss"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatAge(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
```

**Step 2: Commit**

```bash
git add tools/playground/app/playground/components/AnnotationDetail.tsx
git commit -m "feat(playground): add annotation detail popover with resolve/dismiss"
```

---

## Task 6: Create Annotation List Popover

Opens when the badge is clicked, showing all annotations for the component.

**Files:**
- Create: `tools/playground/app/playground/components/AnnotationList.tsx`

**Step 1: Write the component**

```tsx
"use client";

import { useState } from "react";
import type { ClientAnnotation } from "../hooks/usePlaygroundAnnotations";

interface AnnotationListProps {
  componentId: string;
  annotations: ClientAnnotation[];
  onClose: () => void;
  onResolved: () => void;
  onAnnotateClick: () => void;
}

const SEVERITY_DOTS: Record<string, string> = {
  blocking: "bg-[#ff6b6b]",
  important: "bg-[#ffd43b]",
  suggestion: "bg-[rgba(254,248,226,0.4)]",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "PENDING",
  acknowledged: "ACK",
  resolved: "RESOLVED",
  dismissed: "DISMISSED",
};

export function AnnotationList({
  componentId,
  annotations,
  onClose,
  onResolved,
  onAnnotateClick,
}: AnnotationListProps) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"resolve" | "dismiss" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const componentAnnotations = annotations.filter((a) => a.componentId === componentId);
  const pending = componentAnnotations.filter((a) => a.status === "pending" || a.status === "acknowledged");
  const resolved = componentAnnotations.filter((a) => a.status === "resolved" || a.status === "dismissed");

  const handleAction = async () => {
    if (!actionId || !actionType || submitting) return;
    if (actionType === "dismiss" && !inputValue.trim()) return;

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { action: actionType, id: actionId };
      if (actionType === "resolve") body.summary = inputValue.trim() || undefined;
      if (actionType === "dismiss") body.reason = inputValue.trim();

      const res = await fetch("/playground/api/agent/annotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setActionId(null);
        setActionType(null);
        setInputValue("");
        onResolved();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="absolute right-0 top-full z-30 mt-1"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-72 rounded-sm border border-[rgba(254,248,226,0.2)] bg-[#1a1814] shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(254,248,226,0.1)] px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[rgba(254,248,226,0.5)]">
            Annotations ({pending.length} pending)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onAnnotateClick}
              className="font-mono text-[10px] text-[rgba(254,248,226,0.5)] hover:text-[#FEF8E2]"
              title="Place a pin"
            >
              + Pin
            </button>
            <button
              onClick={onClose}
              className="font-mono text-[10px] text-[rgba(254,248,226,0.4)] hover:text-[#FEF8E2]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-64 overflow-y-auto">
          {componentAnnotations.length === 0 && (
            <div className="px-3 py-4 text-center font-mono text-[10px] text-[rgba(254,248,226,0.3)]">
              No annotations yet
            </div>
          )}

          {pending.length > 0 && (
            <div className="flex flex-col">
              {pending.map((a) => (
                <div key={a.id} className="border-b border-[rgba(254,248,226,0.05)] px-3 py-2">
                  <div className="flex items-start gap-2">
                    <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOTS[a.severity] ?? ""}`} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="font-mono text-[11px] leading-snug text-[#FEF8E2]">
                        {a.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-[rgba(254,248,226,0.3)]">
                          {a.intent} · {STATUS_LABELS[a.status] ?? a.status}
                        </span>
                        {actionId !== a.id && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => { setActionId(a.id); setActionType("resolve"); setInputValue(""); }}
                              className="font-mono text-[9px] text-[rgba(254,248,226,0.4)] hover:text-[#FEF8E2]"
                            >
                              resolve
                            </button>
                            <button
                              onClick={() => { setActionId(a.id); setActionType("dismiss"); setInputValue(""); }}
                              className="font-mono text-[9px] text-[rgba(254,248,226,0.4)] hover:text-[#FEF8E2]"
                            >
                              dismiss
                            </button>
                          </div>
                        )}
                      </div>

                      {actionId === a.id && actionType && (
                        <div className="mt-1 flex gap-1">
                          <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAction();
                              if (e.key === "Escape") { setActionId(null); setActionType(null); }
                            }}
                            placeholder={actionType === "resolve" ? "Summary (optional)" : "Reason (required)"}
                            autoFocus
                            className="flex-1 rounded-xs border border-[rgba(254,248,226,0.12)] bg-[#0F0E0C] px-1.5 py-0.5 font-mono text-[9px] text-[#FEF8E2] placeholder:text-[rgba(254,248,226,0.25)] focus:outline-none"
                          />
                          <button
                            onClick={handleAction}
                            disabled={submitting || (actionType === "dismiss" && !inputValue.trim())}
                            className="rounded-xs bg-[rgba(254,248,226,0.08)] px-1.5 py-0.5 font-mono text-[9px] text-[#FEF8E2] disabled:opacity-40"
                          >
                            {submitting ? "..." : "OK"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <>
              <div className="border-b border-[rgba(254,248,226,0.05)] px-3 py-1.5">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[rgba(254,248,226,0.25)]">
                  Resolved ({resolved.length})
                </span>
              </div>
              {resolved.map((a) => (
                <div key={a.id} className="border-b border-[rgba(254,248,226,0.05)] px-3 py-2 opacity-50">
                  <div className="flex items-start gap-2">
                    <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOTS[a.severity] ?? ""}`} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="font-mono text-[11px] leading-snug text-[#FEF8E2] line-through">
                        {a.message}
                      </p>
                      <span className="font-mono text-[9px] text-[rgba(254,248,226,0.3)]">
                        {a.intent} · {STATUS_LABELS[a.status] ?? a.status}
                        {a.resolution ? ` · ${a.resolution}` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add tools/playground/app/playground/components/AnnotationList.tsx
git commit -m "feat(playground): add annotation list popover for badge click"
```

---

## Task 7: Wire Pins, Popovers, and Annotate Mode into ComponentCard

Integrate all new components. Add an "annotate mode" toggle to the card header. Render pins in the render area. Handle click-to-place, pin click, and badge click.

**Files:**
- Modify: `tools/playground/app/playground/nodes/ComponentCard.tsx`

**Step 1: Add imports**

```ts
import { useAnnotationContext } from "../annotation-context";
import { AnnotationPin } from "../components/AnnotationPin";
import { AnnotationComposer } from "../components/AnnotationComposer";
import { AnnotationDetail } from "../components/AnnotationDetail";
import { AnnotationList } from "../components/AnnotationList";
import type { ClientAnnotation } from "../hooks/usePlaygroundAnnotations";
```

**Step 2: Add annotation state inside `ComponentCardInner`**

After the existing `isOverlayActive` line (~line 539), add:

```ts
  const { annotationsForComponent } = useAnnotationContext();
  const cardAnnotations = annotationsForComponent(entry.id);
  const positionedAnnotations = cardAnnotations.filter((a) => a.x != null && a.y != null);

  const [annotateMode, setAnnotateMode] = useState(false);
  const [composer, setComposer] = useState<{ x: number; y: number; left: number; top: number } | null>(null);
  const [selectedPin, setSelectedPin] = useState<{ annotation: ClientAnnotation; element: HTMLElement } | null>(null);
  const [showList, setShowList] = useState(false);
```

**Step 3: Add click handler for the render area**

```ts
  const handleRenderAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!annotateMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setComposer({
      x,
      y,
      left: e.clientX - rect.left,
      top: e.clientY - rect.top,
    });
    setAnnotateMode(false);
  };

  const handlePinClick = (annotation: ClientAnnotation, element: HTMLElement) => {
    setSelectedPin({ annotation, element });
    setComposer(null);
    setShowList(false);
  };

  const handleAnnotationMutated = () => {
    setComposer(null);
    setSelectedPin(null);
    setShowList(false);
  };
```

**Step 4: Add annotate mode toggle button to the card header**

In the header's right-side `<div className="flex items-center gap-1">`, add before `<AnnotationBadge>`:

```tsx
<button
  onClick={() => {
    setAnnotateMode(!annotateMode);
    setComposer(null);
    setSelectedPin(null);
    setShowList(false);
  }}
  className={`rounded-xs p-0.5 transition-colors ${
    annotateMode
      ? "bg-[rgba(254,248,226,0.15)] text-[#FEF8E2]"
      : "text-[rgba(254,248,226,0.3)] hover:text-[rgba(254,248,226,0.6)]"
  }`}
  title={annotateMode ? "Cancel annotation" : "Place an annotation pin"}
>
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20v-8" />
    <circle cx="12" cy="8" r="4" />
  </svg>
</button>
```

**Step 5: Update AnnotationBadge to open list**

Pass `onClick` to AnnotationBadge:

```tsx
<AnnotationBadge
  componentId={entry.id}
  onClick={() => {
    setShowList(!showList);
    setComposer(null);
    setSelectedPin(null);
    setAnnotateMode(false);
  }}
/>
```

**Step 6: Wrap each component render area with pin overlay + click handler**

The default render area (lines 570-581) currently looks like:

```tsx
{Component && (
  <div className="rounded-sm border border-edge-primary bg-surface-primary">
    <div className="flex items-center border-b border-edge-primary px-2 py-1">
      <span className="font-mono text-xs text-content-muted">default</span>
    </div>
    <div className="flex min-h-32 items-center justify-center p-3">
      <Suspense fallback={...}>
        <Component {...props} />
      </Suspense>
    </div>
  </div>
)}
```

Replace the inner render div (the one with `min-h-32`) with:

```tsx
<div
  className={`relative flex min-h-32 items-center justify-center p-3 ${
    annotateMode ? "cursor-crosshair" : ""
  }`}
  onClick={handleRenderAreaClick}
>
  <Suspense fallback={<div className="text-xs text-content-muted">Loading...</div>}>
    <Component {...props} />
  </Suspense>

  {/* Annotation pins */}
  {positionedAnnotations
    .filter((a) => a.status === "pending" || a.status === "acknowledged")
    .map((a, i) => (
      <AnnotationPin
        key={a.id}
        annotation={a}
        index={i}
        onClick={handlePinClick}
      />
    ))}

  {/* Composer */}
  {composer && (
    <AnnotationComposer
      componentId={entry.id}
      x={composer.x}
      y={composer.y}
      anchorLeft={composer.left}
      anchorTop={composer.top}
      onSubmit={handleAnnotationMutated}
      onCancel={() => setComposer(null)}
    />
  )}

  {/* Pin detail popover */}
  {selectedPin && (
    <AnnotationDetail
      annotation={selectedPin.annotation}
      anchorElement={selectedPin.element}
      onClose={() => setSelectedPin(null)}
      onResolved={handleAnnotationMutated}
    />
  )}
</div>
```

**Step 7: Add annotation list popover**

After the header `</div>`, before `{/* Sub-cards */}`, add a relative wrapper around the header for popover positioning. The simplest approach: wrap the right-side div (that contains badges) in `relative`:

Change the header badges wrapper to:

```tsx
<div className="relative flex items-center gap-1">
  {/* annotate mode toggle button */}
  {/* AnnotationBadge */}
  {violations && <ViolationBadge violations={violations} compact />}

  {/* List popover */}
  {showList && (
    <AnnotationList
      componentId={entry.id}
      annotations={cardAnnotations}
      onClose={() => setShowList(false)}
      onResolved={handleAnnotationMutated}
      onAnnotateClick={() => {
        setShowList(false);
        setAnnotateMode(true);
      }}
    />
  )}
</div>
```

**Step 8: Add annotate mode visual indicator**

When annotateMode is true, add a subtle border highlight to the card. In the card's outer div style, after the existing `boxShadow` logic, add annotateMode handling:

```ts
boxShadow: isOverlayActive
  ? "0 0 0 2px rgba(255,245,194,0.76), 0 0 34px rgba(255,226,125,0.9), 0 0 84px rgba(255,196,71,0.42)"
  : annotateMode
    ? "0 0 0 1px rgba(254,248,226,0.3), 0 0 16px rgba(254,248,226,0.12)"
    : "0 0 0 1px rgba(252,225,132,0.06), 0 0 12px rgba(252,225,132,0.08)",
```

**Step 9: Run tests and typecheck**

Run: `cd tools/playground && pnpm test -- --run`
Expected: All pass

Run: `cd /Users/rivermassey/Desktop/dev/DNA && pnpm --filter @rdna/playground typecheck 2>&1 | grep -v Checkbox`
Expected: No new type errors

**Step 10: Commit**

```bash
git add tools/playground/app/playground/nodes/ComponentCard.tsx
git commit -m "feat(playground): wire annotation pins, popovers, and annotate mode into ComponentCard"
```

---

## Verification Checklist

- [ ] `pnpm --filter @rdna/playground test` — all tests pass
- [ ] `pnpm --filter @rdna/playground typecheck` — no new type errors (pre-existing Checkbox error is ok)
- [ ] Manual: Click the pin icon in a card header → card enters annotate mode (crosshair cursor, subtle border glow)
- [ ] Manual: Click on the component render area in annotate mode → composer appears at click position
- [ ] Manual: Fill in message, submit → pin appears at the position, badge count updates
- [ ] Manual: Click a pin → detail popover shows message, intent, severity, age
- [ ] Manual: Resolve from detail popover → pin disappears, badge count decrements
- [ ] Manual: Click the badge → list popover shows all annotations
- [ ] Manual: Resolve/dismiss from list popover → annotation moves to resolved section
- [ ] Manual: "+ Pin" in list popover → enters annotate mode
- [ ] Manual: Pan/zoom the canvas → pins stay anchored to their positions on the card
- [ ] Manual: CLI-created annotations (no x/y) appear in badge count and list but not as pins
