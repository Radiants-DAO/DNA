---
title: Shared Feature Registry Wiring
category: integration-issues
date: 2026-02-05
tags: [chrome-extension, feature-registry, singleton, content-script, state-management]
---

# Shared Feature Registry Wiring

## Symptom

`panel:feature` messages to activate features (guides, selection, component-id) silently failed. Features didn't toggle on/off when panel requested.

## Investigation

1. **Checked panelRouter** — Created its own registry via `createRegistry()`
2. **Checked content.ts** — Created a separate registry, also via `createRegistry()`
3. **Found isolation** — Two separate registries, features registered in one, activated in other

## Root Cause

Both `panelRouter.ts` and `content.ts` called `createRegistry()` independently, creating two isolated registry instances:

```typescript
// panelRouter.ts
const featureRegistry = createRegistry();  // Registry A (empty)

// content.ts
const featureRegistry = createRegistry();  // Registry B (has guides, selection)
featureRegistry.register('guides', { ... });

// Panel sends: panel:feature { featureId: 'guides', action: 'activate' }
// panelRouter uses Registry A → feature not found → silent no-op
```

## Solution

### 1. Create shared registry singleton

```typescript
// packages/extension/src/content/sharedRegistry.ts
import { createRegistry, type Feature } from './registry';

let sharedRegistry: ReturnType<typeof createRegistry> | null = null;

export function getSharedFeatureRegistry() {
  if (!sharedRegistry) {
    sharedRegistry = createRegistry();
  }
  return sharedRegistry;
}

export function registerSharedFeature(id: string, feature: Feature): void {
  getSharedFeatureRegistry().register(id, feature);
}

export function activateSharedFeature(id: string): void {
  getSharedFeatureRegistry().activate(id);
}

export function deactivateSharedFeature(): void {
  getSharedFeatureRegistry().deactivate();
}

export type { Feature };
```

### 2. Use shared registry in panelRouter

```typescript
// packages/extension/src/content/panelRouter.ts
import { getSharedFeatureRegistry } from './sharedRegistry';

function handleFeature(featureId: string, action: 'activate' | 'deactivate'): void {
  const registry = getSharedFeatureRegistry();
  if (action === 'activate') {
    registry.activate(featureId);
  } else {
    registry.deactivate();
  }
}
```

### 3. Register features via shared registry in content.ts

```typescript
// packages/extension/src/entrypoints/content.ts
import { registerSharedFeature } from '../content/sharedRegistry';

registerSharedFeature('guides', {
  activate: () => {
    guidesState.visible = true;
    return () => { guidesState.visible = false; };
  },
});

registerSharedFeature('selection', {
  activate: () => {
    return () => selectionEngine.clear();
  },
});

registerSharedFeature('component-id', {
  activate: () => {
    // Create overlays showing component IDs
    const overlays: HTMLElement[] = [];
    document.querySelectorAll('[data-radflow-id]').forEach((el) => {
      // ... create positioned overlay
      overlays.push(overlay);
    });
    return () => overlays.forEach(o => o.remove());
  },
});
```

## Prevention

1. **Singleton pattern for shared state**: Use module-level singleton for cross-module state
2. **Export registration function**: Don't export the registry directly; export `registerSharedFeature()`
3. **Document initialization order**: Content script registers features before panel can activate them

## Related

- `packages/extension/src/content/sharedRegistry.ts` — Singleton implementation
- `packages/extension/src/content/panelRouter.ts` — Feature activation handler
- `packages/extension/src/entrypoints/content.ts` — Feature registration
