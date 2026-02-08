---
title: ComponentsPanel Data Shape Mismatch
category: integration-issues
date: 2026-02-05
tags: [react, typescript, type-safety, dom-inspection, data-contract]
---

# ComponentsPanel Data Shape Mismatch

## Symptom

ComponentsPanel displayed broken UI with missing data — component names showed as undefined, props section was empty, instance counts were wrong.

## Investigation

1. **Checked ComponentsPanel** — Expected `DisplayComponent` with rich metadata
2. **Checked panelRouter response** — Returned only DOM-available data
3. **Found shape mismatch** — Panel expected data that can't be computed from DOM alone

## Root Cause

ComponentsPanel was designed for a richer data model than what DOM inspection can provide:

```typescript
// Panel expected (from design-time):
interface DisplayComponent {
  name: string;
  description: string | null;
  props: Record<string, { type: string; default?: unknown }>;
  instances: number;
}

// Content script can only provide (from DOM):
{
  radflowId: string;           // data-radflow-id attribute
  selector: string;            // Generated CSS selector
  componentName: string | null; // data-component-name attribute (if present)
}
```

The content script has no access to component schemas, prop definitions, or instance counting across the React tree.

## Solution

Align ComponentsPanel with what's actually available from DOM inspection:

```typescript
// packages/extension/src/panel/components/ComponentsPanel.tsx

interface DisplayComponent {
  radflowId: string;
  selector: string;
  componentName: string | null;
}

// Update type guard
function isComponentMapResponse(message: unknown): message is {
  type: "component-map:result";
  payload: { components: DisplayComponent[] };
} {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type: string }).type === 'component-map:result' &&
    'payload' in message &&
    Array.isArray((message as { payload: { components: unknown[] } }).payload?.components)
  );
}

// Update UI to display available data
function ComponentRow({ component }: { component: DisplayComponent }) {
  return (
    <div className="...">
      <span>{component.componentName || component.radflowId}</span>
      {component.componentName && (
        <span className="text-xs text-neutral-500">{component.radflowId}</span>
      )}
    </div>
  );
}
```

## Prevention

1. **Design from data source**: Start with what the data provider can actually return
2. **Document data contracts**: Type the response shape in `@flow/shared/messages.ts`
3. **Progressive enhancement**: Rich metadata (props, instances) available when sidecar is active, basic metadata always available

## Related

- `packages/extension/src/panel/components/ComponentsPanel.tsx` — Panel implementation
- `packages/extension/src/content/panelRouter.ts` — Content-side handler (handleGetComponentMap)
- `packages/shared/src/messages.ts` — Message type definitions
