# Component Canvas Phase 2: Live Preview & Relationship Lines

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add live component preview iframes, a page preview card, and animated relationship lines to the component canvas.

**Architecture:** Extend ComponentCanvas with three features: (1) per-node iframe previews using the existing bridge/PostMessage pattern from PreviewCanvas, (2) a special "page preview" card that embeds the full app preview as a canvas node, (3) SVG relationship lines (composition, token-share, variant) computed from .dna.json and .schema.json data. All state additions go into the existing componentCanvasSlice.

**Tech Stack:** React 19, Zustand 5, Tauri 2 PostMessage bridge, SVG Bezier curves, CSS keyframe animations

---

## Implementation Order

1. **Task 1-5:** Relationship Lines (002-F) — pure frontend, no bridge changes
2. **Task 6-11:** Live Component Preview (002-H) — iframe pool, bridge extension
3. **Task 12-14:** Page Preview Card — special node type on canvas

---

## Task 1: Add connection types to componentCanvas types

**Files:**
- Modify: `app/types/componentCanvas.ts`

**Step 1: Write the types**

Add to the bottom of `app/types/componentCanvas.ts`:

```typescript
// ============================================================================
// Connection Types (Phase 2 - Relationship Lines)
// ============================================================================

/** Type of relationship between two component nodes */
export type ConnectionType = "composition" | "tokenShare" | "variant";

/** A connection between two component canvas nodes */
export interface ComponentConnection {
  /** Unique ID: `${type}-${sourceId}-${targetId}` */
  id: string;
  /** Source node ID */
  sourceId: string;
  /** Target node ID */
  targetId: string;
  /** Relationship type */
  type: ConnectionType;
  /** Shared token name (for tokenShare type) or variant name */
  label?: string;
}

/** Color mapping for connection types */
export const CONNECTION_COLORS: Record<ConnectionType, string> = {
  composition: "#3b82f6", // blue
  tokenShare: "#22c55e",  // green
  variant: "#f59e0b",     // amber
};
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS (no errors from new types)

**Step 3: Commit**

```bash
git add app/types/componentCanvas.ts
git commit -m "feat(component-canvas): add connection types for relationship lines"
```

---

## Task 2: Add connection state to componentCanvasSlice

**Files:**
- Modify: `app/stores/slices/componentCanvasSlice.ts`

**Step 1: Add state and actions to the slice interface**

Add to `ComponentCanvasSlice` interface (after `componentCanvasError`):

```typescript
/** Computed connections between nodes */
componentConnections: ComponentConnection[];

/** Which connection types are visible */
componentConnectionVisibility: Record<ConnectionType, boolean>;

/** Node ID currently hovered (for highlighting connections) */
componentCanvasHoveredId: string | null;
```

Add actions (after `layoutComponentNodes`):

```typescript
/** Set hovered node ID */
setComponentCanvasHoveredId: (id: string | null) => void;

/** Toggle connection type visibility */
toggleConnectionVisibility: (type: ConnectionType) => void;

/** Recompute connections from current schemas + dna configs */
computeConnections: () => void;
```

**Step 2: Add initial state and action implementations**

In the `createComponentCanvasSlice` function, add initial state:

```typescript
componentConnections: [],
componentConnectionVisibility: { composition: true, tokenShare: true, variant: true },
componentCanvasHoveredId: null,
```

Add action implementations:

```typescript
setComponentCanvasHoveredId: (id) => set({ componentCanvasHoveredId: id }),

toggleConnectionVisibility: (type) =>
  set((state) => ({
    componentConnectionVisibility: {
      ...state.componentConnectionVisibility,
      [type]: !state.componentConnectionVisibility[type],
    },
  })),

computeConnections: () => {
  const state = get();
  const connections: ComponentConnection[] = [];
  const nodeMap = new Map(state.componentCanvasNodes.map((n) => [n.schema.name, n]));

  // 1. Composition connections (from schema.subcomponents)
  for (const node of state.componentCanvasNodes) {
    if (node.schema.subcomponents) {
      for (const sub of node.schema.subcomponents) {
        const target = nodeMap.get(sub);
        if (target) {
          connections.push({
            id: `composition-${node.id}-${target.id}`,
            sourceId: node.id,
            targetId: target.id,
            type: "composition",
          });
        }
      }
    }
  }

  // 2. Token share connections (from dna.tokenBindings)
  // Build token -> component[] mapping
  const tokenToComponents = new Map<string, Set<string>>();
  for (const node of state.componentCanvasNodes) {
    if (!node.dna) continue;
    for (const variant of Object.values(node.dna.tokenBindings)) {
      for (const tokenValue of Object.values(variant)) {
        if (!tokenToComponents.has(tokenValue)) {
          tokenToComponents.set(tokenValue, new Set());
        }
        tokenToComponents.get(tokenValue)!.add(node.id);
      }
    }
  }

  // For each token shared by 2+ components, create connections
  for (const [token, componentIds] of tokenToComponents) {
    const ids = Array.from(componentIds);
    if (ids.length < 2) continue;
    // Connect first to each subsequent (star topology, not full mesh)
    for (let i = 1; i < ids.length; i++) {
      const connId = `tokenShare-${ids[0]}-${ids[i]}`;
      // Deduplicate
      if (!connections.find((c) => c.id === connId)) {
        connections.push({
          id: connId,
          sourceId: ids[0],
          targetId: ids[i],
          type: "tokenShare",
          label: token,
        });
      }
    }
  }

  // 3. Variant connections (same variant names across components)
  const variantToComponents = new Map<string, Set<string>>();
  for (const node of state.componentCanvasNodes) {
    if (!node.dna) continue;
    for (const variantName of Object.keys(node.dna.tokenBindings)) {
      if (!variantToComponents.has(variantName)) {
        variantToComponents.set(variantName, new Set());
      }
      variantToComponents.get(variantName)!.add(node.id);
    }
  }

  for (const [variant, componentIds] of variantToComponents) {
    const ids = Array.from(componentIds);
    if (ids.length < 2) continue;
    for (let i = 1; i < ids.length; i++) {
      const connId = `variant-${ids[0]}-${ids[i]}`;
      if (!connections.find((c) => c.id === connId)) {
        connections.push({
          id: connId,
          sourceId: ids[0],
          targetId: ids[i],
          type: "variant",
          label: variant,
        });
      }
    }
  }

  set({ componentConnections: connections });
},
```

**Step 3: Call `computeConnections()` after scan completes**

In `scanComponentSchemas`, after the `set({ componentSchemas, ... })` call, add:

```typescript
// After set(), compute connections
get().computeConnections();
```

**Step 4: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add app/stores/slices/componentCanvasSlice.ts
git commit -m "feat(component-canvas): add connection state and computation to slice"
```

---

## Task 3: Create ComponentConnections.tsx

**Files:**
- Create: `app/components/component-canvas/ComponentConnections.tsx`

**Step 1: Create the SVG connection lines component**

```typescript
import { useMemo, memo } from "react";
import type {
  ComponentCanvasNode,
  ComponentConnection,
  ConnectionType,
} from "../../types/componentCanvas";
import { CONNECTION_COLORS } from "../../types/componentCanvas";

interface ConnectionPathProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: ConnectionType;
  isHighlighted: boolean;
  label?: string;
}

const ConnectionPath = memo(function ConnectionPath({
  fromX,
  fromY,
  toX,
  toY,
  type,
  isHighlighted,
}: ConnectionPathProps) {
  const d = useMemo(() => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const controlOffset = Math.max(Math.abs(dx), Math.abs(dy)) * 0.4;
    // Horizontal-biased Bezier for grid layout
    return `M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY}, ${toX - controlOffset} ${toY}, ${toX} ${toY}`;
  }, [fromX, fromY, toX, toY]);

  const color = CONNECTION_COLORS[type];
  const opacity = isHighlighted ? 0.9 : 0.3;
  const strokeWidth = isHighlighted ? 2.5 : 1.5;
  const isDashed = type === "tokenShare";

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeOpacity={opacity}
      strokeLinecap="round"
      strokeDasharray={isDashed ? "6 4" : undefined}
      className={`transition-all duration-150 ${isDashed && isHighlighted ? "animate-dash-flow" : ""}`}
    />
  );
});

interface ComponentConnectionsProps {
  nodes: ComponentCanvasNode[];
  connections: ComponentConnection[];
  visibility: Record<ConnectionType, boolean>;
  hoveredNodeId: string | null;
  selectedIds: Set<string>;
}

export function ComponentConnections({
  nodes,
  connections,
  visibility,
  hoveredNodeId,
  selectedIds,
}: ComponentConnectionsProps) {
  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  // Filter by visibility
  const visibleConnections = useMemo(
    () => connections.filter((c) => visibility[c.type]),
    [connections, visibility]
  );

  // Determine which connections are highlighted (connected to hovered or selected node)
  const highlightedIds = useMemo(() => {
    const activeId = hoveredNodeId;
    if (!activeId && selectedIds.size === 0) return new Set<string>();

    const ids = new Set<string>();
    for (const conn of visibleConnections) {
      if (
        conn.sourceId === activeId ||
        conn.targetId === activeId ||
        selectedIds.has(conn.sourceId) ||
        selectedIds.has(conn.targetId)
      ) {
        ids.add(conn.id);
      }
    }
    return ids;
  }, [visibleConnections, hoveredNodeId, selectedIds]);

  if (visibleConnections.length === 0) return null;

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: 1 }}
    >
      {visibleConnections.map((conn) => {
        const source = nodeMap.get(conn.sourceId);
        const target = nodeMap.get(conn.targetId);
        if (!source || !target) return null;

        // Connect from right-center of source to left-center of target
        const fromX = source.x + source.width;
        const fromY = source.y + source.height / 2;
        const toX = target.x;
        const toY = target.y + target.height / 2;

        return (
          <ConnectionPath
            key={conn.id}
            fromX={fromX}
            fromY={fromY}
            toX={toX}
            toY={toY}
            type={conn.type}
            isHighlighted={highlightedIds.has(conn.id)}
            label={conn.label}
          />
        );
      })}
    </svg>
  );
}

export default ComponentConnections;
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add app/components/component-canvas/ComponentConnections.tsx
git commit -m "feat(component-canvas): create ComponentConnections SVG renderer"
```

---

## Task 4: Add dash-flow CSS animation

**Files:**
- Modify: `app/index.css`

**Step 1: Add keyframe animation**

Add after the existing `@keyframes file-node-highlight-pulse` block:

```css
/* Component canvas connection line animation */
@keyframes dash-flow {
  to {
    stroke-dashoffset: -20;
  }
}

.animate-dash-flow {
  animation: dash-flow 1s linear infinite;
}
```

**Step 2: Verify the app builds**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add app/index.css
git commit -m "feat(component-canvas): add dash-flow animation for token connections"
```

---

## Task 5: Wire ConnectionLines into ComponentCanvas

**Files:**
- Modify: `app/components/component-canvas/ComponentCanvas.tsx`
- Modify: `app/components/component-canvas/index.ts`

**Step 1: Add imports and state selectors to ComponentCanvas.tsx**

Add import at top:

```typescript
import { ComponentConnections } from "./ComponentConnections";
```

Add store selectors (after existing selectors around line 83-84):

```typescript
const connections = useAppStore((s) => s.componentConnections);
const connectionVisibility = useAppStore((s) => s.componentConnectionVisibility);
const hoveredNodeId = useAppStore((s) => s.componentCanvasHoveredId);
const setHoveredNodeId = useAppStore((s) => s.setComponentCanvasHoveredId);
```

**Step 2: Add hover handlers to ComponentNode rendering**

In the `componentNodes.map()` block (around line 292), add `onMouseEnter` and `onMouseLeave` to `ComponentNode`:

This requires adding props to `ComponentNode`. Instead, wrap each node:

```typescript
{componentNodes.map((node) => (
  <div
    key={node.id}
    onMouseEnter={() => setHoveredNodeId(node.id)}
    onMouseLeave={() => setHoveredNodeId(null)}
  >
    <ComponentNode
      node={node}
      isSelected={
        selectedIds.has(node.id) ||
        marqueeState.intersectingPaths.has(node.id)
      }
      isFocused={focusedId === node.id}
      onSelect={handleSelect}
      onDoubleClick={handleNodeDoubleClick}
    />
  </div>
))}
```

**Step 3: Render ComponentConnections inside the transform container**

Add before the `{componentNodes.map(` block (inside the transformed div, around line 291):

```typescript
{/* Relationship lines */}
<ComponentConnections
  nodes={componentNodes}
  connections={connections}
  visibility={connectionVisibility}
  hoveredNodeId={hoveredNodeId}
  selectedIds={selectedIds}
/>
```

**Step 4: Update barrel export**

In `app/components/component-canvas/index.ts`, add:

```typescript
export { ComponentConnections } from "./ComponentConnections";
```

**Step 5: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 6: Commit**

```bash
git add app/components/component-canvas/ComponentCanvas.tsx app/components/component-canvas/ComponentConnections.tsx app/components/component-canvas/index.ts
git commit -m "feat(component-canvas): wire relationship lines into canvas"
```

---

## Task 6: Add preview state to componentCanvasSlice

**Files:**
- Modify: `app/types/componentCanvas.ts`
- Modify: `app/stores/slices/componentCanvasSlice.ts`

**Step 1: Add preview-related types**

Add to `app/types/componentCanvas.ts`:

```typescript
// ============================================================================
// Preview Types (Phase 2 - Live Preview)
// ============================================================================

/** Preview state for a component node */
export interface NodePreviewState {
  /** Whether preview is enabled for this node */
  enabled: boolean;
  /** Whether the iframe has loaded */
  loaded: boolean;
  /** Reported dimensions from the rendered component */
  dimensions?: { width: number; height: number };
}
```

**Step 2: Add preview state to slice interface**

Add to `ComponentCanvasSlice` interface:

```typescript
/** Per-node preview state: nodeId -> PreviewState */
componentNodePreviews: Map<string, NodePreviewState>;

/** Whether a dev server is available for previews */
componentPreviewServerUrl: string | null;
```

Add actions:

```typescript
/** Toggle preview for a node */
toggleNodePreview: (nodeId: string) => void;

/** Set preview loaded state */
setNodePreviewLoaded: (nodeId: string, loaded: boolean) => void;

/** Set preview dimensions */
setNodePreviewDimensions: (nodeId: string, dimensions: { width: number; height: number }) => void;

/** Set preview server URL */
setComponentPreviewServerUrl: (url: string | null) => void;
```

**Step 3: Add initial state and implementations**

```typescript
componentNodePreviews: new Map(),
componentPreviewServerUrl: null,

toggleNodePreview: (nodeId) =>
  set((state) => {
    const previews = new Map(state.componentNodePreviews);
    const existing = previews.get(nodeId);
    if (existing?.enabled) {
      previews.delete(nodeId);
    } else {
      previews.set(nodeId, { enabled: true, loaded: false });
    }
    return { componentNodePreviews: previews };
  }),

setNodePreviewLoaded: (nodeId, loaded) =>
  set((state) => {
    const previews = new Map(state.componentNodePreviews);
    const existing = previews.get(nodeId);
    if (existing) {
      previews.set(nodeId, { ...existing, loaded });
    }
    return { componentNodePreviews: previews };
  }),

setNodePreviewDimensions: (nodeId, dimensions) =>
  set((state) => {
    const previews = new Map(state.componentNodePreviews);
    const existing = previews.get(nodeId);
    if (existing) {
      previews.set(nodeId, { ...existing, dimensions });
    }
    return { componentNodePreviews: previews };
  }),

setComponentPreviewServerUrl: (url) => set({ componentPreviewServerUrl: url }),
```

**Step 4: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add app/types/componentCanvas.ts app/stores/slices/componentCanvasSlice.ts
git commit -m "feat(component-canvas): add preview state to slice"
```

---

## Task 7: Create CanvasComponentPreview.tsx

**Files:**
- Create: `app/components/component-canvas/CanvasComponentPreview.tsx`

**Step 1: Create the iframe preview component**

This component renders an iframe for a single component, reusing the security pattern from PreviewCanvas.

```typescript
import { useRef, useEffect, useCallback } from "react";
import { useAppStore } from "../../stores/appStore";

/**
 * Feature detection for iframe credentialless attribute
 */
const supportsCredentialless =
  typeof HTMLIFrameElement !== "undefined" &&
  "credentialless" in HTMLIFrameElement.prototype;

interface CanvasComponentPreviewProps {
  /** Component name to render */
  componentName: string;
  /** Node ID for state tracking */
  nodeId: string;
  /** Preview server URL */
  serverUrl: string;
  /** Width of the preview area */
  width: number;
  /** Height of the preview area */
  height: number;
}

/**
 * CanvasComponentPreview renders a single component in an iframe.
 *
 * Uses a URL convention: `{serverUrl}/__component/{componentName}`
 * The target app's dev server needs a route that renders a component
 * in isolation. Falls back to showing the component name.
 *
 * Based on PreviewCanvas iframe pattern with security upgrades.
 */
export function CanvasComponentPreview({
  componentName,
  nodeId,
  serverUrl,
  width,
  height,
}: CanvasComponentPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const setNodePreviewLoaded = useAppStore((s) => s.setNodePreviewLoaded);

  // Build preview URL
  const previewUrl = `${serverUrl}/__component/${encodeURIComponent(componentName)}`;

  const handleLoad = useCallback(() => {
    setNodePreviewLoaded(nodeId, true);
  }, [nodeId, setNodePreviewLoaded]);

  const handleError = useCallback(() => {
    setNodePreviewLoaded(nodeId, false);
  }, [nodeId, setNodePreviewLoaded]);

  return (
    <div
      className="relative overflow-hidden rounded bg-white"
      style={{ width, height }}
    >
      <iframe
        ref={iframeRef}
        src={previewUrl}
        className="w-full h-full border-0"
        title={`Preview: ${componentName}`}
        {...(supportsCredentialless && { credentialless: "true" })}
        sandbox="allow-scripts allow-same-origin"
        onLoad={handleLoad}
        onError={handleError}
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
}

export default CanvasComponentPreview;
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add app/components/component-canvas/CanvasComponentPreview.tsx
git commit -m "feat(component-canvas): create CanvasComponentPreview iframe component"
```

---

## Task 8: Add preview toggle to ComponentNode

**Files:**
- Modify: `app/components/component-canvas/ComponentNode.tsx`

**Step 1: Add preview toggle button and iframe embed**

Add new props to `ComponentNodeProps`:

```typescript
/** Whether preview is enabled */
previewEnabled?: boolean;
/** Preview server URL (null = no server available) */
previewServerUrl?: string | null;
/** Callback to toggle preview */
onTogglePreview?: (nodeId: string) => void;
```

Add to the header section (after the DNA badge, inside the header div), a toggle button:

```typescript
{previewServerUrl && onTogglePreview && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onTogglePreview(node.id);
    }}
    className="p-0.5 rounded hover:bg-white/10 transition-colors"
    title={previewEnabled ? "Hide preview" : "Show preview"}
    style={{
      color: previewEnabled ? "rgba(59, 130, 246, 0.9)" : "rgba(255, 255, 255, 0.4)",
    }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  </button>
)}
```

Add below the header (conditionally when preview is enabled):

```typescript
{previewEnabled && previewServerUrl && (
  <div className="flex-1 min-h-0">
    <CanvasComponentPreview
      componentName={schema.name}
      nodeId={node.id}
      serverUrl={previewServerUrl}
      width={node.width - 2}
      height={80}
    />
  </div>
)}
```

Import at the top:

```typescript
import { CanvasComponentPreview } from "./CanvasComponentPreview";
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add app/components/component-canvas/ComponentNode.tsx
git commit -m "feat(component-canvas): add preview toggle to ComponentNode"
```

---

## Task 9: Wire preview props through ComponentCanvas

**Files:**
- Modify: `app/components/component-canvas/ComponentCanvas.tsx`

**Step 1: Add preview state selectors**

Add after existing selectors:

```typescript
const nodePreviews = useAppStore((s) => s.componentNodePreviews);
const previewServerUrl = useAppStore((s) => s.componentPreviewServerUrl);
const toggleNodePreview = useAppStore((s) => s.toggleNodePreview);
```

**Step 2: Pass preview props to ComponentNode**

Update the ComponentNode rendering to include preview props:

```typescript
<ComponentNode
  node={node}
  isSelected={
    selectedIds.has(node.id) ||
    marqueeState.intersectingPaths.has(node.id)
  }
  isFocused={focusedId === node.id}
  onSelect={handleSelect}
  onDoubleClick={handleNodeDoubleClick}
  previewEnabled={nodePreviews.get(node.id)?.enabled ?? false}
  previewServerUrl={previewServerUrl}
  onTogglePreview={toggleNodePreview}
/>
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add app/components/component-canvas/ComponentCanvas.tsx
git commit -m "feat(component-canvas): wire preview props to ComponentNode"
```

---

## Task 10: Update barrel exports

**Files:**
- Modify: `app/components/component-canvas/index.ts`

**Step 1: Add new exports**

```typescript
export { ComponentNode } from "./ComponentNode";
export { ComponentCanvas } from "./ComponentCanvas";
export { ComponentConnections } from "./ComponentConnections";
export { CanvasComponentPreview } from "./CanvasComponentPreview";
```

**Step 2: Commit**

```bash
git add app/components/component-canvas/index.ts
git commit -m "chore(component-canvas): update barrel exports"
```

---

## Task 11: Update AppState types for new slice fields

**Files:**
- Modify: `app/stores/types.ts`

**Step 1: Verify AppState includes new fields**

Since `AppState extends ComponentCanvasSlice`, the new fields should be automatically included. Verify with:

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

If there are errors, check that `ComponentCanvasSlice` in types.ts properly imports/re-exports the new fields.

**Step 2: Commit (only if changes needed)**

```bash
git add app/stores/types.ts
git commit -m "fix: align AppState with updated ComponentCanvasSlice"
```

---

## Task 12: Add PagePreviewNode type

**Files:**
- Modify: `app/types/componentCanvas.ts`

**Step 1: Add page preview node type**

Add to types:

```typescript
// ============================================================================
// Page Preview Node (Phase 2 - Canvas Page Preview)
// ============================================================================

/**
 * A special canvas node that shows the full page preview.
 * Displayed as a larger card alongside component nodes.
 */
export interface PagePreviewConfig {
  /** Whether the page preview card is shown on the canvas */
  enabled: boolean;
  /** URL to display in the page preview iframe */
  url: string | null;
  /** Position on canvas */
  x: number;
  y: number;
  /** Dimensions (larger than component nodes) */
  width: number;
  height: number;
}

export const DEFAULT_PAGE_PREVIEW: PagePreviewConfig = {
  enabled: false,
  url: null,
  x: 48,
  y: 48,
  width: 480,
  height: 360,
};
```

**Step 2: Add to slice interface and state**

In `ComponentCanvasSlice`, add:

```typescript
/** Page preview card config */
pagePreviewConfig: PagePreviewConfig;

/** Toggle page preview card */
togglePagePreview: () => void;

/** Set page preview URL */
setPagePreviewUrl: (url: string | null) => void;
```

In the slice implementation:

```typescript
pagePreviewConfig: { enabled: false, url: null, x: 48, y: 48, width: 480, height: 360 },

togglePagePreview: () =>
  set((state) => ({
    pagePreviewConfig: {
      ...state.pagePreviewConfig,
      enabled: !state.pagePreviewConfig.enabled,
    },
  })),

setPagePreviewUrl: (url) =>
  set((state) => ({
    pagePreviewConfig: {
      ...state.pagePreviewConfig,
      url,
    },
  })),
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add app/types/componentCanvas.ts app/stores/slices/componentCanvasSlice.ts
git commit -m "feat(component-canvas): add PagePreviewConfig type and slice state"
```

---

## Task 13: Create PagePreviewCard.tsx

**Files:**
- Create: `app/components/component-canvas/PagePreviewCard.tsx`

**Step 1: Create the page preview card component**

```typescript
import { useRef, useCallback } from "react";
import { useAppStore } from "../../stores/appStore";

const supportsCredentialless =
  typeof HTMLIFrameElement !== "undefined" &&
  "credentialless" in HTMLIFrameElement.prototype;

/**
 * PagePreviewCard - A special canvas node showing the full page preview.
 *
 * Sits alongside component nodes on the canvas, larger and with a
 * different visual treatment (thicker border, "Page" label).
 * Reuses the PreviewCanvas iframe security pattern.
 */
export function PagePreviewCard() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const config = useAppStore((s) => s.pagePreviewConfig);
  const togglePagePreview = useAppStore((s) => s.togglePagePreview);

  if (!config.enabled || !config.url) return null;

  return (
    <div
      className="absolute rounded-lg overflow-hidden"
      style={{
        left: config.x,
        top: config.y,
        width: config.width,
        height: config.height,
        zIndex: 1,
        backgroundColor: "#1a1a1a",
        border: "2px solid rgba(139, 92, 246, 0.5)",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          borderColor: "rgba(255, 255, 255, 0.08)",
        }}
      >
        <span className="text-xs font-medium text-[rgba(255,255,255,0.9)]">
          Page Preview
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePagePreview();
          }}
          className="text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.8)] transition-colors"
          title="Close page preview"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={config.url}
        className="w-full border-0"
        style={{
          height: config.height - 36, // subtract header
          pointerEvents: "none",
        }}
        title="Page Preview"
        {...(supportsCredentialless && { credentialless: "true" })}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}

export default PagePreviewCard;
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add app/components/component-canvas/PagePreviewCard.tsx
git commit -m "feat(component-canvas): create PagePreviewCard component"
```

---

## Task 14: Wire PagePreviewCard into ComponentCanvas

**Files:**
- Modify: `app/components/component-canvas/ComponentCanvas.tsx`
- Modify: `app/components/component-canvas/index.ts`

**Step 1: Import and render PagePreviewCard**

Add import:

```typescript
import { PagePreviewCard } from "./PagePreviewCard";
```

Inside the transform container (before or after component nodes), add:

```typescript
{/* Page preview card */}
<PagePreviewCard />
```

**Step 2: Update barrel export**

Add to `index.ts`:

```typescript
export { PagePreviewCard } from "./PagePreviewCard";
```

**Step 3: Update grid layout to offset nodes when page preview is enabled**

In `calculateGridLayout` inside `componentCanvasSlice.ts`, check the page preview config and offset the grid origin to avoid overlap:

This is optional for v1 — the page preview card sits at (48, 48) with fixed 480x360 dimensions. Simply offset `rootOffsetY` when page preview is active. However, for now just render it and let users scroll past it. Refinement can come later.

**Step 4: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/tools/flow && pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add app/components/component-canvas/ComponentCanvas.tsx app/components/component-canvas/PagePreviewCard.tsx app/components/component-canvas/index.ts
git commit -m "feat(component-canvas): wire PagePreviewCard into canvas"
```

---

## Verification Checklist

### Relationship Lines
1. Open Flow, load a theme with `.dna.json` files (`/packages/radiants`)
2. Switch to component canvas view
3. Verify colored lines appear between components sharing tokens
4. Hover a component node — connected lines should brighten
5. Lines should be: blue (composition), green dashed (token share), amber (variant)

### Live Component Preview
1. Set a dev server URL in the app
2. Click the eye icon on a ComponentNode card
3. Verify iframe loads with component preview
4. Toggle off — iframe should disappear

### Page Preview Card
1. Enable page preview from canvas (need a UI trigger — could be a toolbar button)
2. Verify large card appears on canvas with full page iframe
3. Close button dismisses it

---

## Notes

- **No tests in this plan** — this is primarily UI/visual work. Manual verification through the running app is the appropriate testing strategy for canvas rendering, SVG paths, and iframe embedding.
- **Bridge protocol extension** (RENDER_COMPONENT messages from the original plan) is deferred. The simpler approach here uses a URL convention (`/__component/{name}`) which doesn't require bridge changes. Bridge extension can come in Phase 3 if needed.
- **Page preview layout overlap** — v1 just renders the page preview card at a fixed position. A future task can add layout awareness to offset the grid.
