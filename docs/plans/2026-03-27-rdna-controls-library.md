# RDNA Controls Library Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Build `@rdna/controls` — a standalone control component library that wraps RDNA primitives into parameter-GUI controls, ships a declarative `useControlPanel` hook, and integrates into RadOS as dockable/detachable control surfaces (CD-player metaphor: window=player, surface=drive, controls=disc, eject=detach).

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA` → branch `feat/rdna-controls` (create at execution time)

**Architecture:** New `packages/controls` package with peer dep on `@rdna/radiants`. Each control is a thin wrapper around an existing RDNA component (Slider, Switch, Select, Input, Button, Collapsible) with control-specific value formatting. A `useControlPanel` hook mirrors DialKit's `useDialKit` API — declarative config in, typed reactive values out. The RadOS integration adds a dockable panel inside AppWindow with an eject button for detaching into a companion floating window.

**Tech Stack:** React 19, TypeScript, Tailwind v4, Vitest, pnpm workspaces, Zustand (RadOS store extensions), `@rdna/radiants` peer dep

**Reference devDeps:** `interface-kit`, `dialkit`, `agentation`

***

### Task 1: Create Feature Branch

**Step 1: Create worktree and branch**

Run:

```bash
cd /Users/rivermassey/Desktop/dev/DNA
git worktree add ../DNA-rdna-controls -b feat/rdna-controls
```

**Step 2: Verify**

Run:

```bash
git worktree list
```

Expected: new entry at `../DNA-rdna-controls` on `feat/rdna-controls`.

All subsequent tasks run from `/Users/rivermassey/Desktop/dev/DNA-rdna-controls`.

***

### Task 2: Create The `@rdna/controls` Package Shell

**Files:**

* Create: `packages/controls/package.json`

* Create: `packages/controls/tsconfig.json`

* Create: `packages/controls/src/index.ts`

* Create: `packages/controls/src/types.ts`

* Create: `packages/controls/test/smoke.test.ts`

* Modify: `package.json` (root — add test:controls script)

**Step 1: Write the failing test**

Create `packages/controls/test/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('@rdna/controls', () => {
  it('exports core types', async () => {
    const mod = await import('../src/index');
    expect(mod).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/controls exec vitest run test/smoke.test.ts
```

Expected: FAIL because package does not exist.

**Step 3: Write minimal implementation**

Create `packages/controls/package.json`:

```json
{
  "name": "@rdna/controls",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "vitest run",
    "lint": "eslint ."
  },
  "peerDependencies": {
    "@rdna/radiants": "workspace:*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@rdna/radiants": "workspace:*",
    "react": "^19.2.1",
    "react-dom": "^19.2.1",
    "@types/react": "^19",
    "dialkit": "^1.1.0",
    "interface-kit": "^0.1.3",
    "agentation": "*",
    "vitest": "^2.1.9",
    "typescript": "^5"
  }
}
```

Create `packages/controls/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist"
  },
  "include": ["src", "test"]
}
```

Create `packages/controls/src/types.ts`:

```ts
import type { ReactNode } from 'react';

// ============================================================================
// Control value types — what each control type produces
// ============================================================================

export type ControlValue = number | boolean | string;

// ============================================================================
// Control definitions — declarative config for each control type
// ============================================================================

/** Slider: renders RDNA Slider. Inferred from number or explicit tuple. */
export type SliderDef = number | [defaultVal: number, min: number, max: number, step?: number];

/** Toggle: renders RDNA Switch. Inferred from boolean. */
export type ToggleDef = boolean;

/** Select: renders RDNA Select. Explicit config object. */
export interface SelectDef {
  type: 'select';
  options: string[] | { value: string; label: string }[];
  default?: string;
}

/** TextInput: renders RDNA Input. Inferred from non-hex string or explicit. */
export interface TextDef {
  type: 'text';
  default?: string;
  placeholder?: string;
}

/** Action: renders RDNA Button. Produces no value — triggers callback. */
export interface ActionDef {
  type: 'action';
  label?: string;
}

/** Folder: collapsible group. Nested config object (no `type` field). */
export type FolderDef = {
  _collapsed?: boolean;
} & Record<string, ControlDef>;

// ============================================================================
// Union + config shape
// ============================================================================

export type ControlDef = SliderDef | ToggleDef | SelectDef | TextDef | ActionDef | FolderDef;

/** Top-level panel config — keys become control labels. */
export type ControlPanelConfig = Record<string, ControlDef>;

// ============================================================================
// Resolved values — what useControlPanel returns
// ============================================================================

export type ResolveValue<T extends ControlDef> =
  T extends number ? number :
  T extends [number, number, number, number?] ? number :
  T extends boolean ? boolean :
  T extends SelectDef ? string :
  T extends TextDef ? string :
  T extends ActionDef ? never :
  T extends Record<string, ControlDef> ? { [K in keyof T as K extends `_${string}` ? never : K]: ResolveValue<T[K] & ControlDef> } :
  never;

export type ResolvedValues<T extends ControlPanelConfig> = {
  [K in keyof T as T[K] extends ActionDef ? never : K]: ResolveValue<T[K]>;
};

// ============================================================================
// Hook options
// ============================================================================

export interface UseControlPanelOptions {
  onAction?: (action: string) => void;
}

// ============================================================================
// Panel rendering props
// ============================================================================

export type ControlSurfaceDock = 'left' | 'right' | 'bottom';

export interface ControlSurfaceConfig {
  enabled: boolean;
  dock: ControlSurfaceDock;
  autoOpen?: boolean;
}

export interface ControlPanelProps {
  /** Unique panel ID */
  id: string;
  /** Panel title */
  title?: string;
  /** Controls config */
  config: ControlPanelConfig;
  /** Current values (controlled) */
  values: Record<string, ControlValue>;
  /** Value change handler */
  onChange: (path: string, value: ControlValue) => void;
  /** Action handler */
  onAction?: (action: string) => void;
  /** Header slot (presets, pickers, etc.) */
  header?: ReactNode;
  /** Footer slot */
  footer?: ReactNode;
  /** Width override */
  width?: string;
  /** Additional className */
  className?: string;
}
```

Create `packages/controls/src/index.ts`:

```ts
export type {
  ControlValue,
  SliderDef,
  ToggleDef,
  SelectDef,
  TextDef,
  ActionDef,
  FolderDef,
  ControlDef,
  ControlPanelConfig,
  ResolvedValues,
  UseControlPanelOptions,
  ControlSurfaceDock,
  ControlSurfaceConfig,
  ControlPanelProps,
} from './types';
```

**Step 4: Install deps and run test**

Run:

```bash
cd /Users/rivermassey/Desktop/dev/DNA-rdna-controls && pnpm install && pnpm --filter @rdna/controls exec vitest run test/smoke.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/controls package.json pnpm-lock.yaml
git commit -m "feat(controls): add @rdna/controls package shell with types"
```

***

### Task 3: Build The Control Store (useSyncExternalStore)

**Files:**

* Create: `packages/controls/src/store.ts`

* Create: `packages/controls/test/store.test.ts`

* Modify: `packages/controls/src/index.ts`

**Step 1: Write the failing test**

Create `packages/controls/test/store.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { ControlStore } from '../src/store';

describe('ControlStore', () => {
  it('registers a panel and retrieves values', () => {
    const store = new ControlStore();
    store.registerPanel('test', {
      speed: 50,
      enabled: true,
      shape: { type: 'select' as const, options: ['circle', 'square'], default: 'circle' },
    });

    const values = store.getValues('test');
    expect(values).toEqual({ speed: 50, enabled: true, shape: 'circle' });
  });

  it('updates a value and notifies subscribers', () => {
    const store = new ControlStore();
    store.registerPanel('test', { speed: 50 });

    const listener = vi.fn();
    const unsub = store.subscribe('test', listener);

    store.updateValue('test', 'speed', 75);
    expect(store.getValues('test')).toEqual({ speed: 75 });
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();
    store.updateValue('test', 'speed', 100);
    expect(listener).toHaveBeenCalledTimes(1); // no extra call
  });

  it('resolves nested folder defaults', () => {
    const store = new ControlStore();
    store.registerPanel('test', {
      gradient: {
        enabled: true,
        radius: [100, 50, 400, 10],
        _collapsed: true,
      },
    });

    const values = store.getValues('test');
    expect(values).toEqual({
      'gradient.enabled': true,
      'gradient.radius': 100,
    });
  });

  it('unregisters a panel', () => {
    const store = new ControlStore();
    store.registerPanel('test', { speed: 50 });
    store.unregisterPanel('test');
    expect(store.getValues('test')).toEqual({});
  });

  it('triggers and subscribes to actions', () => {
    const store = new ControlStore();
    store.registerPanel('test', {
      copy: { type: 'action' as const, label: 'Copy' },
    });

    const handler = vi.fn();
    const unsub = store.subscribeActions('test', handler);

    store.triggerAction('test', 'copy');
    expect(handler).toHaveBeenCalledWith('copy');

    unsub();
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/controls exec vitest run test/store.test.ts
```

Expected: FAIL — `store.ts` does not exist.

**Step 3: Write minimal implementation**

Create `packages/controls/src/store.ts`:

```ts
import type { ControlPanelConfig, ControlDef, ControlValue, SelectDef, TextDef } from './types';

type Listener = () => void;
type ActionListener = (action: string) => void;

interface PanelState {
  config: ControlPanelConfig;
  values: Record<string, ControlValue>;
  listeners: Set<Listener>;
  actionListeners: Set<ActionListener>;
}

/**
 * Resolve the default value from a control definition.
 * Returns undefined for action controls (they produce no value).
 */
function resolveDefault(def: ControlDef): ControlValue | undefined {
  if (typeof def === 'number') return def;
  if (typeof def === 'boolean') return def;
  if (typeof def === 'string') return def;
  if (Array.isArray(def)) return def[0];
  if (typeof def === 'object' && 'type' in def) {
    switch (def.type) {
      case 'select': {
        const sel = def as SelectDef;
        if (sel.default) return sel.default;
        const first = sel.options[0];
        return typeof first === 'string' ? first : first.value;
      }
      case 'text':
        return (def as TextDef).default ?? '';
      case 'action':
        return undefined;
    }
  }
  return undefined;
}

/**
 * Flatten a config into path→value pairs.
 * Folders create dotted paths: { gradient: { radius: 50 } } → { 'gradient.radius': 50 }
 */
function flattenConfig(
  config: Record<string, ControlDef>,
  prefix = '',
): Record<string, ControlValue> {
  const result: Record<string, ControlValue> = {};

  for (const [key, def] of Object.entries(config)) {
    if (key.startsWith('_')) continue; // skip meta keys like _collapsed

    const path = prefix ? `${prefix}.${key}` : key;

    // Check if this is a folder (plain object without `type`)
    if (
      typeof def === 'object' &&
      def !== null &&
      !Array.isArray(def) &&
      !('type' in def)
    ) {
      Object.assign(result, flattenConfig(def as Record<string, ControlDef>, path));
      continue;
    }

    const val = resolveDefault(def);
    if (val !== undefined) {
      result[path] = val;
    }
  }

  return result;
}

export class ControlStore {
  private panels = new Map<string, PanelState>();

  registerPanel(id: string, config: ControlPanelConfig): void {
    const values = flattenConfig(config);
    this.panels.set(id, {
      config,
      values,
      listeners: new Set(),
      actionListeners: new Set(),
    });
  }

  unregisterPanel(id: string): void {
    this.panels.delete(id);
  }

  getValues(id: string): Record<string, ControlValue> {
    return this.panels.get(id)?.values ?? {};
  }

  getValue(id: string, path: string): ControlValue | undefined {
    return this.panels.get(id)?.values[path];
  }

  updateValue(id: string, path: string, value: ControlValue): void {
    const panel = this.panels.get(id);
    if (!panel) return;
    panel.values = { ...panel.values, [path]: value };
    panel.listeners.forEach((l) => l());
  }

  subscribe(id: string, listener: Listener): () => void {
    const panel = this.panels.get(id);
    if (!panel) return () => {};
    panel.listeners.add(listener);
    return () => panel.listeners.delete(listener);
  }

  subscribeActions(id: string, listener: ActionListener): () => void {
    const panel = this.panels.get(id);
    if (!panel) return () => {};
    panel.actionListeners.add(listener);
    return () => panel.actionListeners.delete(listener);
  }

  triggerAction(id: string, action: string): void {
    const panel = this.panels.get(id);
    if (!panel) return;
    panel.actionListeners.forEach((l) => l(action));
  }

  getSnapshot(id: string): Record<string, ControlValue> {
    return this.getValues(id);
  }
}

/** Default singleton instance for module-level usage */
export const controlStore = new ControlStore();
```

Update `packages/controls/src/index.ts` — add:

```ts
export { ControlStore, controlStore } from './store';
```

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @rdna/controls exec vitest run test/store.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/controls/src/store.ts packages/controls/test/store.test.ts packages/controls/src/index.ts
git commit -m "feat(controls): add ControlStore with flat-path values and subscriptions"
```

***

### Task 4: Build `useControlPanel` Hook

**Files:**

* Create: `packages/controls/src/useControlPanel.ts`

* Create: `packages/controls/test/useControlPanel.test.ts`

* Modify: `packages/controls/src/index.ts`

**Step 1: Write the failing test**

Create `packages/controls/test/useControlPanel.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useControlPanel } from '../src/useControlPanel';
import { controlStore } from '../src/store';

describe('useControlPanel', () => {
  it('returns typed values from config', () => {
    const { result } = renderHook(() =>
      useControlPanel('test-hook', {
        speed: 50,
        enabled: true,
        shape: { type: 'select' as const, options: ['circle', 'square'], default: 'circle' },
      })
    );

    expect(result.current.speed).toBe(50);
    expect(result.current.enabled).toBe(true);
    expect(result.current.shape).toBe('circle');
  });

  it('re-renders when store value changes', () => {
    const { result } = renderHook(() =>
      useControlPanel('test-reactive', { speed: 10 })
    );

    expect(result.current.speed).toBe(10);

    act(() => {
      controlStore.updateValue('test-reactive', 'speed', 99);
    });

    expect(result.current.speed).toBe(99);
  });

  it('calls onAction when an action fires', () => {
    const onAction = vi.fn();

    renderHook(() =>
      useControlPanel('test-action', {
        copy: { type: 'action' as const, label: 'Copy' },
      }, { onAction })
    );

    act(() => {
      controlStore.triggerAction('test-action', 'copy');
    });

    expect(onAction).toHaveBeenCalledWith('copy');
  });

  it('unregisters panel on unmount', () => {
    const { unmount } = renderHook(() =>
      useControlPanel('test-cleanup', { speed: 50 })
    );

    expect(controlStore.getValues('test-cleanup')).toEqual({ speed: 50 });

    unmount();

    expect(controlStore.getValues('test-cleanup')).toEqual({});
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/controls exec vitest run test/useControlPanel.test.ts
```

Expected: FAIL — `useControlPanel.ts` does not exist.

**Step 3: Write minimal implementation**

Create `packages/controls/src/useControlPanel.ts`:

```ts
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { controlStore } from './store';
import type { ControlPanelConfig, UseControlPanelOptions } from './types';

/**
 * Declarative control panel hook — mirrors DialKit's useDialKit API.
 *
 * Pass a config object describing controls; get back live-updating typed values.
 * The hook registers with the singleton ControlStore on mount and unregisters on unmount.
 */
export function useControlPanel<T extends ControlPanelConfig>(
  id: string,
  config: T,
  options?: UseControlPanelOptions,
): Record<string, unknown> {
  const configRef = useRef(config);
  const idRef = useRef(id);

  // Register panel on mount, unregister on unmount
  useEffect(() => {
    controlStore.registerPanel(id, config);
    return () => controlStore.unregisterPanel(id);
    // Intentionally only run on mount/unmount — config changes handled by key remount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Subscribe to action callbacks
  useEffect(() => {
    if (!options?.onAction) return;
    return controlStore.subscribeActions(id, options.onAction);
  }, [id, options?.onAction]);

  // Subscribe to value changes via useSyncExternalStore
  const subscribe = useCallback(
    (listener: () => void) => controlStore.subscribe(id, listener),
    [id],
  );

  const getSnapshot = useCallback(
    () => controlStore.getSnapshot(id),
    [id],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
```

Update `packages/controls/src/index.ts` — add:

```ts
export { useControlPanel } from './useControlPanel';
```

Note: you will need `@testing-library/react` as a devDep. Add it:

```bash
pnpm --filter @rdna/controls add -D @testing-library/react
```

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @rdna/controls exec vitest run test/useControlPanel.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/controls
git commit -m "feat(controls): add useControlPanel hook with useSyncExternalStore"
```

***

### Task 5: Build P0 Control Components — Slider

**Files:**

* Create: `packages/controls/src/controls/ControlSlider.tsx`

* Create: `packages/controls/test/controls/slider.test.tsx`

The first control component. Pattern established here is reused for all subsequent controls.

**Step 1: Write the failing test**

Create `packages/controls/test/controls/slider.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlSlider } from '../../src/controls/ControlSlider';

describe('ControlSlider', () => {
  it('renders with label and current value', () => {
    render(
      <ControlSlider
        path="speed"
        label="Speed"
        value={50}
        min={0}
        max={100}
        step={1}
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Speed')).toBeDefined();
    expect(screen.getByText('50')).toBeDefined();
  });

  it('calls onChange with new value', () => {
    const onChange = vi.fn();
    render(
      <ControlSlider
        path="speed"
        label="Speed"
        value={50}
        min={0}
        max={100}
        step={1}
        onChange={onChange}
      />
    );

    // The underlying RDNA Slider is what we're testing integration with
    const slider = screen.getByRole('slider');
    expect(slider).toBeDefined();
  });

  it('renders inline number input for direct editing', () => {
    render(
      <ControlSlider
        path="speed"
        label="Speed"
        value={50}
        min={0}
        max={100}
        step={1}
        onChange={() => {}}
      />
    );

    // Value display should be present
    expect(screen.getByText('50')).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/controls exec vitest run test/controls/slider.test.tsx
```

Expected: FAIL — file does not exist.

**Step 3: Write minimal implementation**

Create `packages/controls/src/controls/ControlSlider.tsx`:

```tsx
'use client';

import React from 'react';
import { Slider } from '@rdna/radiants/components/core';

export interface ControlSliderProps {
  path: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (path: string, value: number) => void;
  className?: string;
}

export function ControlSlider({
  path,
  label,
  value,
  min,
  max,
  step,
  onChange,
  className = '',
}: ControlSliderProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`} data-control="slider" data-path={path}>
      <Slider
        label={label}
        value={value}
        onChange={(v) => onChange(path, v)}
        min={min}
        max={max}
        step={step}
        size="sm"
        showValue
      />
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @rdna/controls exec vitest run test/controls/slider.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/controls/src/controls/ControlSlider.tsx packages/controls/test/controls/slider.test.tsx
git commit -m "feat(controls): add ControlSlider wrapping RDNA Slider"
```

***

### Task 6: Build P0 Control Components — Toggle, Select, TextInput, Action

**Files:**

* Create: `packages/controls/src/controls/ControlToggle.tsx`

* Create: `packages/controls/src/controls/ControlSelect.tsx`

* Create: `packages/controls/src/controls/ControlTextInput.tsx`

* Create: `packages/controls/src/controls/ControlAction.tsx`

* Create: `packages/controls/test/controls/toggle.test.tsx`

* Create: `packages/controls/test/controls/select.test.tsx`

* Create: `packages/controls/test/controls/text-input.test.tsx`

* Create: `packages/controls/test/controls/action.test.tsx`

Each control follows the same pattern as ControlSlider: thin wrapper around RDNA primitive, accepts `path` + `value` + `onChange`.

**Step 1: Write failing tests for all four**

Create `packages/controls/test/controls/toggle.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlToggle } from '../../src/controls/ControlToggle';

describe('ControlToggle', () => {
  it('renders with label and checked state', () => {
    render(<ControlToggle path="enabled" label="Enabled" value={true} onChange={() => {}} />);
    expect(screen.getByText('Enabled')).toBeDefined();
    expect(screen.getByRole('switch')).toBeDefined();
  });

  it('calls onChange when toggled', () => {
    const onChange = vi.fn();
    render(<ControlToggle path="enabled" label="Enabled" value={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith('enabled', true);
  });
});
```

Create `packages/controls/test/controls/select.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ControlSelect } from '../../src/controls/ControlSelect';

describe('ControlSelect', () => {
  it('renders with label and options', () => {
    render(
      <ControlSelect
        path="shape"
        label="Shape"
        value="circle"
        options={['circle', 'square', 'triangle']}
        onChange={() => {}}
      />
    );
    expect(screen.getByText('Shape')).toBeDefined();
  });

  it('supports object options with label/value', () => {
    render(
      <ControlSelect
        path="shape"
        label="Shape"
        value="circle"
        options={[{ value: 'circle', label: 'Circle' }, { value: 'square', label: 'Square' }]}
        onChange={() => {}}
      />
    );
    expect(screen.getByText('Shape')).toBeDefined();
  });
});
```

Create `packages/controls/test/controls/text-input.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlTextInput } from '../../src/controls/ControlTextInput';

describe('ControlTextInput', () => {
  it('renders with label and value', () => {
    render(<ControlTextInput path="title" label="Title" value="Hello" onChange={() => {}} />);
    expect(screen.getByText('Title')).toBeDefined();
    expect(screen.getByDisplayValue('Hello')).toBeDefined();
  });
});
```

Create `packages/controls/test/controls/action.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlAction } from '../../src/controls/ControlAction';

describe('ControlAction', () => {
  it('renders a button with label', () => {
    render(<ControlAction path="copy" label="Copy JSX" onAction={() => {}} />);
    expect(screen.getByRole('button', { name: /copy jsx/i })).toBeDefined();
  });

  it('calls onAction when clicked', () => {
    const onAction = vi.fn();
    render(<ControlAction path="copy" label="Copy" onAction={onAction} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalledWith('copy');
  });
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/controls exec vitest run test/controls/
```

Expected: FAIL for all four.

**Step 3: Write implementations**

Create `packages/controls/src/controls/ControlToggle.tsx`:

```tsx
'use client';

import React from 'react';
import { Switch } from '@rdna/radiants/components/core';

export interface ControlToggleProps {
  path: string;
  label: string;
  value: boolean;
  onChange: (path: string, value: boolean) => void;
  className?: string;
}

export function ControlToggle({ path, label, value, onChange, className = '' }: ControlToggleProps) {
  return (
    <div className={`flex items-center justify-between ${className}`} data-control="toggle" data-path={path}>
      <Switch
        checked={value}
        onChange={(checked) => onChange(path, checked)}
        label={label}
        labelPosition="left"
        size="sm"
      />
    </div>
  );
}
```

Create `packages/controls/src/controls/ControlSelect.tsx`:

```tsx
'use client';

import React from 'react';
import { Select } from '@rdna/radiants/components/core';

export interface ControlSelectProps {
  path: string;
  label: string;
  value: string;
  options: string[] | { value: string; label: string }[];
  onChange: (path: string, value: string) => void;
  className?: string;
}

export function ControlSelect({ path, label, value, options, onChange, className = '' }: ControlSelectProps) {
  const { state, actions } = Select.useSelectState({
    value,
    onChange: (v) => onChange(path, v),
  });

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt,
  );

  return (
    <div className={`flex flex-col gap-1 ${className}`} data-control="select" data-path={path}>
      <span className="font-heading text-xs text-mute">{label}</span>
      <Select.Provider state={state} actions={actions}>
        <Select.Trigger size="sm" />
        <Select.Content>
          {normalizedOptions.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              {opt.label}
            </Select.Option>
          ))}
        </Select.Content>
      </Select.Provider>
    </div>
  );
}
```

Create `packages/controls/src/controls/ControlTextInput.tsx`:

```tsx
'use client';

import React from 'react';
import { Input } from '@rdna/radiants/components/core';

export interface ControlTextInputProps {
  path: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (path: string, value: string) => void;
  className?: string;
}

export function ControlTextInput({ path, label, value, placeholder, onChange, className = '' }: ControlTextInputProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`} data-control="text" data-path={path}>
      <span className="font-heading text-xs text-mute">{label}</span>
      <Input
        value={value}
        onChange={(e) => onChange(path, e.target.value)}
        placeholder={placeholder}
        size="sm"
      />
    </div>
  );
}
```

Create `packages/controls/src/controls/ControlAction.tsx`:

```tsx
'use client';

import React from 'react';
import { Button } from '@rdna/radiants/components/core';

export interface ControlActionProps {
  path: string;
  label: string;
  onAction: (path: string) => void;
  className?: string;
}

export function ControlAction({ path, label, onAction, className = '' }: ControlActionProps) {
  return (
    <div className={className} data-control="action" data-path={path}>
      <Button
        mode="flat"
        size="sm"
        onClick={() => onAction(path)}
      >
        {label}
      </Button>
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/controls exec vitest run test/controls/
```

Expected: PASS for all.

**Step 5: Commit**

```bash
git add packages/controls/src/controls packages/controls/test/controls
git commit -m "feat(controls): add Toggle, Select, TextInput, Action control components"
```

***

### Task 7: Build P0 Control Components — Folder (Collapsible Group)

**Files:**

* Create: `packages/controls/src/controls/ControlFolder.tsx`

* Create: `packages/controls/test/controls/folder.test.tsx`

* Create: `packages/controls/src/controls/index.ts`

* Modify: `packages/controls/src/index.ts`

**Step 1: Write the failing test**

Create `packages/controls/test/controls/folder.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlFolder } from '../../src/controls/ControlFolder';

describe('ControlFolder', () => {
  it('renders a collapsible group with label', () => {
    render(
      <ControlFolder label="Gradient" defaultOpen={true}>
        <div data-testid="folder-child">child content</div>
      </ControlFolder>
    );
    expect(screen.getByText('Gradient')).toBeDefined();
    expect(screen.getByTestId('folder-child')).toBeDefined();
  });

  it('can start collapsed', () => {
    render(
      <ControlFolder label="Gradient" defaultOpen={false}>
        <div data-testid="folder-child">child content</div>
      </ControlFolder>
    );
    expect(screen.getByText('Gradient')).toBeDefined();
    // Content should be hidden when collapsed
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/controls exec vitest run test/controls/folder.test.tsx
```

Expected: FAIL.

**Step 3: Write implementation**

Create `packages/controls/src/controls/ControlFolder.tsx`:

```tsx
'use client';

import React from 'react';
import { Collapsible } from '@rdna/radiants/components/core';

export interface ControlFolderProps {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ControlFolder({ label, defaultOpen = true, children, className = '' }: ControlFolderProps) {
  return (
    <Collapsible.Root defaultOpen={defaultOpen} className={className}>
      <Collapsible.Trigger className="flex w-full items-center justify-between py-1 font-heading text-xs uppercase tracking-wide text-mute hover:text-main transition-colors duration-fast cursor-pointer">
        {label}
      </Collapsible.Trigger>
      <Collapsible.Content className="flex flex-col gap-2 pl-2 border-l border-line">
        {children}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
```

Create `packages/controls/src/controls/index.ts`:

```ts
export { ControlSlider, type ControlSliderProps } from './ControlSlider';
export { ControlToggle, type ControlToggleProps } from './ControlToggle';
export { ControlSelect, type ControlSelectProps } from './ControlSelect';
export { ControlTextInput, type ControlTextInputProps } from './ControlTextInput';
export { ControlAction, type ControlActionProps } from './ControlAction';
export { ControlFolder, type ControlFolderProps } from './ControlFolder';
```

Update `packages/controls/src/index.ts` — add:

```ts
export {
  ControlSlider,
  ControlToggle,
  ControlSelect,
  ControlTextInput,
  ControlAction,
  ControlFolder,
} from './controls';
```

**Step 4: Run full test suite**

Run:

```bash
pnpm --filter @rdna/controls test
```

Expected: all tests PASS.

**Step 5: Commit**

```bash
git add packages/controls
git commit -m "feat(controls): add ControlFolder and barrel exports for all P0 controls"
```

***

### Task 8: Build ControlPanel — Config-Driven Renderer

**Files:**

* Create: `packages/controls/src/panel/ControlPanel.tsx`

* Create: `packages/controls/src/panel/resolveControl.ts`

* Create: `packages/controls/test/panel/control-panel.test.tsx`

* Modify: `packages/controls/src/index.ts`

The ControlPanel takes a `ControlPanelConfig` and renders the appropriate control components automatically — this is the "disc" in the CD player metaphor.

**Step 1: Write the failing test**

Create `packages/controls/test/panel/control-panel.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ControlPanel } from '../../src/panel/ControlPanel';

describe('ControlPanel', () => {
  it('renders slider from number config', () => {
    render(
      <ControlPanel
        id="test"
        config={{ speed: 50 }}
        values={{ speed: 50 }}
        onChange={() => {}}
      />
    );
    expect(screen.getByRole('slider')).toBeDefined();
  });

  it('renders toggle from boolean config', () => {
    render(
      <ControlPanel
        id="test"
        config={{ enabled: true }}
        values={{ enabled: true }}
        onChange={() => {}}
      />
    );
    expect(screen.getByRole('switch')).toBeDefined();
  });

  it('renders select from SelectDef config', () => {
    render(
      <ControlPanel
        id="test"
        config={{ shape: { type: 'select' as const, options: ['circle', 'square'] } }}
        values={{ shape: 'circle' }}
        onChange={() => {}}
      />
    );
    expect(screen.getByText('shape')).toBeDefined();
  });

  it('renders action button from ActionDef config', () => {
    render(
      <ControlPanel
        id="test"
        config={{ copy: { type: 'action' as const, label: 'Copy' } }}
        values={{}}
        onAction={() => {}}
        onChange={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /copy/i })).toBeDefined();
  });

  it('renders nested folder from object config', () => {
    render(
      <ControlPanel
        id="test"
        config={{
          gradient: {
            enabled: true,
            radius: [100, 50, 400, 10],
          },
        }}
        values={{ 'gradient.enabled': true, 'gradient.radius': 100 }}
        onChange={() => {}}
      />
    );
    expect(screen.getByText('gradient')).toBeDefined(); // folder label
    expect(screen.getByRole('switch')).toBeDefined(); // toggle inside folder
    expect(screen.getByRole('slider')).toBeDefined(); // slider inside folder
  });

  it('renders header and footer slots', () => {
    render(
      <ControlPanel
        id="test"
        config={{ speed: 50 }}
        values={{ speed: 50 }}
        onChange={() => {}}
        header={<div data-testid="header">Header</div>}
        footer={<div data-testid="footer">Footer</div>}
      />
    );
    expect(screen.getByTestId('header')).toBeDefined();
    expect(screen.getByTestId('footer')).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/controls exec vitest run test/panel/control-panel.test.tsx
```

Expected: FAIL.

**Step 3: Write implementation**

Create `packages/controls/src/panel/resolveControl.ts`:

```ts
import type { ControlDef, SelectDef, TextDef, ActionDef } from '../types';

export type ResolvedControlType = 'slider' | 'toggle' | 'select' | 'text' | 'action' | 'folder';

export interface ResolvedControl {
  type: ResolvedControlType;
  path: string;
  label: string;
  // Slider-specific
  min?: number;
  max?: number;
  step?: number;
  // Select-specific
  options?: string[] | { value: string; label: string }[];
  // Text-specific
  placeholder?: string;
  // Folder-specific
  children?: Record<string, ControlDef>;
  defaultOpen?: boolean;
}

/**
 * Infer the control type and extract metadata from a ControlDef.
 * Mirrors DialKit's auto-detection logic.
 */
export function resolveControl(key: string, def: ControlDef, prefix = ''): ResolvedControl {
  const path = prefix ? `${prefix}.${key}` : key;
  const label = key;

  // Number → slider with auto-inferred range
  if (typeof def === 'number') {
    const abs = Math.abs(def);
    let min = 0, max: number, step: number;
    if (abs <= 1) { max = 1; step = 0.01; }
    else if (abs <= 10) { max = Math.round(def * 3); step = 0.1; }
    else if (abs <= 100) { max = Math.round(def * 3); step = 1; }
    else { max = Math.round(def * 3); step = 10; }
    return { type: 'slider', path, label, min, max, step };
  }

  // Tuple → slider with explicit range
  if (Array.isArray(def)) {
    const [, min, max, step = 1] = def;
    return { type: 'slider', path, label, min, max, step };
  }

  // Boolean → toggle
  if (typeof def === 'boolean') {
    return { type: 'toggle', path, label };
  }

  // String → text input
  if (typeof def === 'string') {
    return { type: 'text', path, label };
  }

  // Object with `type` field → explicit control
  if (typeof def === 'object' && def !== null && 'type' in def) {
    switch (def.type) {
      case 'select': {
        const sel = def as SelectDef;
        return { type: 'select', path, label, options: sel.options };
      }
      case 'text': {
        const txt = def as TextDef;
        return { type: 'text', path, label, placeholder: txt.placeholder };
      }
      case 'action': {
        const act = def as ActionDef;
        return { type: 'action', path, label: act.label ?? key };
      }
    }
  }

  // Plain object without `type` → folder
  if (typeof def === 'object' && def !== null) {
    const collapsed = '_collapsed' in def ? (def as Record<string, unknown>)._collapsed === true : false;
    const children = Object.fromEntries(
      Object.entries(def).filter(([k]) => !k.startsWith('_'))
    ) as Record<string, ControlDef>;
    return { type: 'folder', path, label, children, defaultOpen: !collapsed };
  }

  return { type: 'text', path, label };
}
```

Create `packages/controls/src/panel/ControlPanel.tsx`:

```tsx
'use client';

import React from 'react';
import type { ControlPanelProps, ControlDef, ControlValue } from '../types';
import { resolveControl } from './resolveControl';
import { ControlSlider } from '../controls/ControlSlider';
import { ControlToggle } from '../controls/ControlToggle';
import { ControlSelect } from '../controls/ControlSelect';
import { ControlTextInput } from '../controls/ControlTextInput';
import { ControlAction } from '../controls/ControlAction';
import { ControlFolder } from '../controls/ControlFolder';
import { ScrollArea } from '@rdna/radiants/components/core';

function renderControls(
  config: Record<string, ControlDef>,
  values: Record<string, ControlValue>,
  onChange: (path: string, value: ControlValue) => void,
  onAction?: (action: string) => void,
  prefix = '',
): React.ReactNode[] {
  return Object.entries(config)
    .filter(([key]) => !key.startsWith('_'))
    .map(([key, def]) => {
      const resolved = resolveControl(key, def, prefix);

      switch (resolved.type) {
        case 'slider':
          return (
            <ControlSlider
              key={resolved.path}
              path={resolved.path}
              label={resolved.label}
              value={(values[resolved.path] as number) ?? 0}
              min={resolved.min ?? 0}
              max={resolved.max ?? 100}
              step={resolved.step ?? 1}
              onChange={onChange}
            />
          );

        case 'toggle':
          return (
            <ControlToggle
              key={resolved.path}
              path={resolved.path}
              label={resolved.label}
              value={(values[resolved.path] as boolean) ?? false}
              onChange={onChange}
            />
          );

        case 'select':
          return (
            <ControlSelect
              key={resolved.path}
              path={resolved.path}
              label={resolved.label}
              value={(values[resolved.path] as string) ?? ''}
              options={resolved.options ?? []}
              onChange={onChange}
            />
          );

        case 'text':
          return (
            <ControlTextInput
              key={resolved.path}
              path={resolved.path}
              label={resolved.label}
              value={(values[resolved.path] as string) ?? ''}
              placeholder={resolved.placeholder}
              onChange={onChange}
            />
          );

        case 'action':
          return (
            <ControlAction
              key={resolved.path}
              path={resolved.path}
              label={resolved.label}
              onAction={onAction ?? (() => {})}
            />
          );

        case 'folder':
          return (
            <ControlFolder
              key={resolved.path}
              label={resolved.label}
              defaultOpen={resolved.defaultOpen}
            >
              {resolved.children &&
                renderControls(resolved.children, values, onChange, onAction, resolved.path)}
            </ControlFolder>
          );

        default:
          return null;
      }
    });
}

export function ControlPanel({
  id,
  title,
  config,
  values,
  onChange,
  onAction,
  header,
  footer,
  width = 'w-64',
  className = '',
}: ControlPanelProps) {
  return (
    <div
      className={`flex flex-col bg-card border-l border-line ${width} ${className}`}
      data-control-panel={id}
    >
      {title && (
        <div className="flex items-center px-3 py-2 border-b border-line">
          <span className="font-heading text-xs uppercase text-mute">{title}</span>
        </div>
      )}

      {header && <div className="border-b border-line">{header}</div>}

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-3 p-3">
          {renderControls(config, values, onChange, onAction)}
        </div>
      </ScrollArea>

      {footer && <div className="border-t border-line">{footer}</div>}
    </div>
  );
}
```

Update `packages/controls/src/index.ts` — add:

```ts
export { ControlPanel } from './panel/ControlPanel';
```

**Step 4: Run tests**

Run:

```bash
pnpm --filter @rdna/controls test
```

Expected: all tests PASS.

**Step 5: Commit**

```bash
git add packages/controls
git commit -m "feat(controls): add ControlPanel config-driven renderer"
```

***

### Task 9: RadOS Integration — Window Store Extensions

**Files:**

* Modify: `apps/rad-os/store/slices/windowsSlice.ts`

* Modify: `apps/rad-os/lib/apps/catalog.tsx`

* Create: `apps/rad-os/test/control-surface-store.test.ts`

Add `parentId` to WindowState and `controlSurface` to AppCatalogEntry.

**Step 1: Write the failing test**

Create `apps/rad-os/test/control-surface-store.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('control surface store integration', () => {
  it('WindowState type includes parentId field', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'apps/rad-os/store/slices/windowsSlice.ts'),
      'utf8',
    );
    expect(src).toContain('parentId');
  });

  it('AppCatalogEntry type includes controlSurface field', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'apps/rad-os/lib/apps/catalog.tsx'),
      'utf8',
    );
    expect(src).toContain('controlSurface');
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter rad-os exec vitest run test/control-surface-store.test.ts
```

Expected: FAIL — neither field exists yet.

**Step 3: Write minimal implementation**

Modify `apps/rad-os/store/slices/windowsSlice.ts` — add to `WindowState`:

```ts
interface WindowState {
  // ... existing fields ...
  /** If set, this window is a companion (e.g. detached control surface) of the parent window */
  parentId?: string;
}
```

Add new actions to the slice:

```ts
/** Open a companion window linked to a parent. Closing parent closes companion. */
openCompanionWindow: (id: string, parentId: string) => void;

/** Close all companion windows of a given parent */
closeCompanionWindows: (parentId: string) => void;
```

Modify `closeWindow` to also close companions:

```ts
closeWindow: (id) => {
  set((state) => {
    // Close companions first
    const companions = state.windows.filter((w) => w.parentId === id);
    const updated = state.windows.map((w) => {
      if (w.id === id || w.parentId === id) {
        return { ...w, isOpen: false, isFullscreen: false, isWidget: false, parentId: undefined };
      }
      return w;
    });
    return { windows: updated };
  });
},
```

Modify `apps/rad-os/lib/apps/catalog.tsx` — add to types:

```ts
import type { ControlPanelConfig, ControlSurfaceDock } from '@rdna/controls';

interface AppCatalogEntry {
  // ... existing fields ...
  /** Control surface config — if set, app supports a dockable control panel */
  controlSurface?: {
    dock: ControlSurfaceDock;
    autoOpen?: boolean;
    config: ControlPanelConfig;
  };
}
```

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter rad-os exec vitest run test/control-surface-store.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/rad-os/store/slices/windowsSlice.ts apps/rad-os/lib/apps/catalog.tsx apps/rad-os/test/control-surface-store.test.ts
git commit -m "feat(rad-os): add parentId to WindowState and controlSurface to catalog"
```

***

### Task 10: RadOS Integration — Title Bar Eject Button

**Files:**

* Modify: `apps/rad-os/components/Rad_os/WindowTitleBar.tsx`

* Modify: `apps/rad-os/components/Rad_os/AppWindow.tsx`

**Step 1: Write the failing test**

Add to existing `apps/rad-os/test/app-window.test.tsx` (or create):

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('control surface title bar integration', () => {
  it('WindowTitleBar supports showControlSurfaceButton prop', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'apps/rad-os/components/Rad_os/WindowTitleBar.tsx'),
      'utf8',
    );
    expect(src).toContain('showControlSurfaceButton');
    expect(src).toContain('onToggleControlSurface');
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter rad-os exec vitest run test/app-window.test.tsx
```

Expected: FAIL.

**Step 3: Write minimal implementation**

Modify `apps/rad-os/components/Rad_os/WindowTitleBar.tsx` — add props:

```ts
interface WindowTitleBarProps {
  // ... existing props ...

  /** Show the control surface toggle button (CD drive icon) */
  showControlSurfaceButton?: boolean;

  /** Called when user clicks control surface button */
  onToggleControlSurface?: () => void;

  /** Called when user long-presses or secondary-clicks to eject */
  onEjectControlSurface?: () => void;

  /** Whether control surface is currently docked */
  isControlSurfaceDocked?: boolean;
}
```

Add the button in the button area (before the copy button):

```tsx
{showControlSurfaceButton && onToggleControlSurface && (
  <Tooltip content={isControlSurfaceDocked ? 'Eject control surface' : 'Open control surface'}>
    <Button
      quiet
      size="sm"
      rounded="md"
      iconOnly
      icon="equalizer"
      aria-label="Toggle control surface"
      onClick={onToggleControlSurface}
      onContextMenu={(e) => {
        e.preventDefault();
        onEjectControlSurface?.();
      }}
    />
  </Tooltip>
)}
```

Pass through from `AppWindow.tsx` — add the props to AppWindowProps and thread them to WindowTitleBar.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter rad-os exec vitest run test/app-window.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/rad-os/components/Rad_os/WindowTitleBar.tsx apps/rad-os/components/Rad_os/AppWindow.tsx apps/rad-os/test/app-window.test.tsx
git commit -m "feat(rad-os): add control surface toggle/eject button to window title bar"
```

***

### Task 11: RadOS Integration — Docked Control Surface Panel

**Files:**

* Create: `apps/rad-os/components/Rad_os/ControlSurfaceDock.tsx`

* Modify: `apps/rad-os/components/Rad_os/AppWindow.tsx`

* Create: `apps/rad-os/test/control-surface-dock.test.tsx`

This renders the docked panel (the "CD drive") inside the AppWindow when the control surface is open.

**Step 1: Write the failing test**

Create `apps/rad-os/test/control-surface-dock.test.tsx`:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('ControlSurfaceDock', () => {
  it('component file exists and exports ControlSurfaceDock', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'apps/rad-os/components/Rad_os/ControlSurfaceDock.tsx'),
      'utf8',
    );
    expect(src).toContain('export function ControlSurfaceDock');
    expect(src).toContain('ControlPanel');
    expect(src).toContain('@rdna/controls');
  });

  it('AppWindow renders ControlSurfaceDock when controlSurface is provided', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'apps/rad-os/components/Rad_os/AppWindow.tsx'),
      'utf8',
    );
    expect(src).toContain('ControlSurfaceDock');
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter rad-os exec vitest run test/control-surface-dock.test.tsx
```

Expected: FAIL.

**Step 3: Write implementation**

Create `apps/rad-os/components/Rad_os/ControlSurfaceDock.tsx`:

```tsx
'use client';

import React, { useState } from 'react';
import { ControlPanel } from '@rdna/controls';
import type { ControlPanelConfig, ControlSurfaceDock as DockPosition, ControlValue } from '@rdna/controls';

interface ControlSurfaceDockProps {
  windowId: string;
  dock: DockPosition;
  config: ControlPanelConfig;
  values: Record<string, ControlValue>;
  onChange: (path: string, value: ControlValue) => void;
  onAction?: (action: string) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const dockClasses: Record<DockPosition, string> = {
  right: 'border-l border-line',
  left: 'border-r border-line order-first',
  bottom: 'border-t border-line',
};

const dockWidth: Record<DockPosition, string> = {
  right: 'w-64',
  left: 'w-64',
  bottom: 'w-full h-48',
};

export function ControlSurfaceDock({
  windowId,
  dock,
  config,
  values,
  onChange,
  onAction,
  header,
  footer,
}: ControlSurfaceDockProps) {
  return (
    <div className={`flex-shrink-0 ${dockClasses[dock]}`} data-control-surface-dock={dock}>
      <ControlPanel
        id={`${windowId}-controls`}
        config={config}
        values={values}
        onChange={onChange}
        onAction={onAction}
        header={header}
        footer={footer}
        width={dockWidth[dock]}
      />
    </div>
  );
}
```

Modify `apps/rad-os/components/Rad_os/AppWindow.tsx` to conditionally render the dock when `controlSurface` config is provided and the surface is toggled open. The window body layout changes from single-child to a flex row (for left/right dock) or flex column (for bottom dock).

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter rad-os exec vitest run test/control-surface-dock.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/rad-os/components/Rad_os/ControlSurfaceDock.tsx apps/rad-os/components/Rad_os/AppWindow.tsx apps/rad-os/test/control-surface-dock.test.tsx
git commit -m "feat(rad-os): add ControlSurfaceDock component (docked panel in AppWindow)"
```

***

### Task 12: RadOS Integration — Detached Companion Window (Eject)

**Files:**

* Modify: `apps/rad-os/components/Rad_os/Desktop.tsx`

* Create: `apps/rad-os/components/Rad_os/ControlSurfaceWindow.tsx`

When the user ejects the control surface, it becomes a floating companion AppWindow with the same ControlPanel content.

**Step 1: Write the failing test**

Add to `apps/rad-os/test/control-surface-dock.test.tsx`:

```ts
it('ControlSurfaceWindow component exists', () => {
  const src = readFileSync(
    resolve(process.cwd(), 'apps/rad-os/components/Rad_os/ControlSurfaceWindow.tsx'),
    'utf8',
  );
  expect(src).toContain('export function ControlSurfaceWindow');
  expect(src).toContain('parentId');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter rad-os exec vitest run test/control-surface-dock.test.tsx
```

Expected: FAIL (new assertion).

**Step 3: Write implementation**

Create `apps/rad-os/components/Rad_os/ControlSurfaceWindow.tsx`:

```tsx
'use client';

import React from 'react';
import { AppWindow } from './AppWindow';
import { ControlPanel } from '@rdna/controls';
import type { ControlPanelConfig, ControlValue } from '@rdna/controls';

interface ControlSurfaceWindowProps {
  parentId: string;
  windowId: string;
  title: string;
  config: ControlPanelConfig;
  values: Record<string, ControlValue>;
  onChange: (path: string, value: ControlValue) => void;
  onAction?: (action: string) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function ControlSurfaceWindow({
  parentId,
  windowId,
  title,
  config,
  values,
  onChange,
  onAction,
  header,
  footer,
}: ControlSurfaceWindowProps) {
  return (
    <AppWindow
      id={windowId}
      title={`${title} Controls`}
      defaultSize={{ width: 280, height: 400 }}
      resizable
      icon={/* equalizer icon */}
    >
      <ControlPanel
        id={windowId}
        config={config}
        values={values}
        onChange={onChange}
        onAction={onAction}
        header={header}
        footer={footer}
        width="w-full"
      />
    </AppWindow>
  );
}
```

Modify `apps/rad-os/components/Rad_os/Desktop.tsx` to render `ControlSurfaceWindow` for any window state where `parentId` is set and the companion window is open.

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter rad-os exec vitest run test/control-surface-dock.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/rad-os/components/Rad_os/ControlSurfaceWindow.tsx apps/rad-os/components/Rad_os/Desktop.tsx apps/rad-os/test/control-surface-dock.test.tsx
git commit -m "feat(rad-os): add ControlSurfaceWindow for ejected/detached panels"
```

***

### Task 13: Full Integration Test — Run All Suites

**Files:**

* No code changes expected unless verification fails.

**Step 1: Run the controls package test suite**

Run:

```bash
pnpm --filter @rdna/controls test
```

Expected: all PASS.

**Step 2: Run the rad-os test suite**

Run:

```bash
pnpm --filter rad-os test
```

Expected: all PASS (including new control surface tests).

**Step 3: Run the RDNA lint**

Run:

```bash
pnpm lint:design-system
```

Expected: no new errors from control components (they use semantic tokens and RDNA primitives).

**Step 4: Run full build**

Run:

```bash
pnpm build
```

Expected: PASS.

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "test: verify controls + rad-os integration suites"
```

***

## Notes For Subsequent Phases

### P1: interface-kit Visual Controls

* ColorArea (OKLCH picker using `culori`), BoxSpacing, BorderRadius, Shadow, Typography

* Source: `node_modules/interface-kit/dist/react.js` — study the control implementations

* Each becomes a new control in `packages/controls/src/controls/`

* Register via `ControlStore.registerControlType()` extension point (add when needed)

### Pattern Playground Migration

* Replace `useDialKit` with `useControlPanel` in `PatternPlayground.tsx`

* Replace `<DialPanel>` with `<ControlPanel>` or `<ControlSurfaceDock>`

* Map existing config 1:1 — the config shape is intentionally compatible

* Add `controlSurface` to the Pattern Playground catalog entry

### Styling Evolution

* After P0 controls work functionally, iterate on styling to be "more modern, minimal, sleek"

* Use the playground as the visual testbed — screenshot-critique-fix loop via `/qc-visual`

⠀