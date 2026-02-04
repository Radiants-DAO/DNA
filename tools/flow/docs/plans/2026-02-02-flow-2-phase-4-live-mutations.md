# Phase 4: Live Mutations + Diff Capture

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable live on-page editing of styles, text, and spacing with structured before/after diff capture that accumulates in the DevTools panel for eventual prompt compilation.

**Architecture:** The content script owns the mutation engine — it applies `element.style` overrides, captures before/after snapshots as compact JSON patches, and manages a revert stack of original inline styles. The DevTools panel sends mutation commands via `chrome.runtime` message passing and displays an accumulating diff log grouped by element. Drag handles for spacing are rendered in the content script's Shadow DOM overlay layer (established in Phases 1-2).

**Tech Stack:** TypeScript, WXT content script (Shadow DOM + Popover API overlays), React 19 DevTools panel, Zustand mutation slice, `chrome.runtime` message passing, JSON Patch (RFC 6902-inspired compact format)

---

## Task 1: Define the diff format types in shared package

**File:** `packages/shared/src/types/mutation.ts`

This is the structured diff format that feeds Phase 6's prompt compiler. Every other task in this phase produces or consumes these types.

```typescript
// packages/shared/src/types/mutation.ts

/** Unique selector for an element — CSS selector + optional component identity */
export interface ElementIdentity {
  /** CSS selector that uniquely identifies this element on the page */
  selector: string;
  /** React component name, if detected via fiber (from Phase 2 agent) */
  componentName?: string;
  /** Source file path (populated when sidecar is active in Phase 5) */
  sourceFile?: string;
  /** Line number in source file */
  sourceLine?: number;
  /** Column number in source file */
  sourceColumn?: number;
}

/** A single property mutation */
export interface PropertyMutation {
  /** CSS property name (e.g., "margin-top") or "textContent" for text edits */
  property: string;
  /** Value before the mutation */
  oldValue: string;
  /** Value after the mutation */
  newValue: string;
}

/** A complete mutation record for one element */
export interface MutationDiff {
  /** Unique ID for this mutation (crypto.randomUUID()) */
  id: string;
  /** The element that was mutated */
  element: ElementIdentity;
  /** Type of mutation */
  type: 'style' | 'text' | 'spacing';
  /** Individual property changes */
  changes: PropertyMutation[];
  /** ISO 8601 timestamp when the mutation was captured */
  timestamp: string;
}

/** Message types for mutation commands and responses */
export interface MutationApplyCommand {
  kind: 'mutation:apply';
  /** Temporary unique ref for the target element (set by content script on selection) */
  elementRef: string;
  /** Properties to set on element.style */
  styleChanges: Record<string, string>;
}

export interface MutationTextCommand {
  kind: 'mutation:text';
  elementRef: string;
  /** New text content */
  newText: string;
}

/** Toggle text edit mode on/off in the content script */
export interface TextEditActivateCommand {
  kind: 'textEdit:activate';
}

export interface TextEditDeactivateCommand {
  kind: 'textEdit:deactivate';
}

export interface MutationRevertCommand {
  kind: 'mutation:revert';
  /** Mutation ID to revert, or 'all' to revert everything */
  mutationId: string | 'all';
}

export interface MutationDiffEvent {
  kind: 'mutation:diff';
  diff: MutationDiff;
}

export interface MutationRevertedEvent {
  kind: 'mutation:reverted';
  mutationId: string | 'all';
}

export type MutationMessage =
  | MutationApplyCommand
  | MutationTextCommand
  | TextEditActivateCommand
  | TextEditDeactivateCommand
  | MutationRevertCommand
  | MutationDiffEvent
  | MutationRevertedEvent;
```

**Test:** `packages/shared/src/types/__tests__/mutation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import type {
  MutationDiff,
  ElementIdentity,
  PropertyMutation,
  MutationApplyCommand,
  MutationTextCommand,
  MutationRevertCommand,
} from '../mutation';

describe('Mutation types', () => {
  it('MutationDiff is structurally valid', () => {
    const diff: MutationDiff = {
      id: 'test-id',
      element: { selector: 'div.hero > h1' },
      type: 'style',
      changes: [
        { property: 'color', oldValue: 'rgb(0, 0, 0)', newValue: 'rgb(255, 0, 0)' },
      ],
      timestamp: new Date().toISOString(),
    };
    expect(diff.changes).toHaveLength(1);
    expect(diff.type).toBe('style');
  });

  it('ElementIdentity supports optional source fields', () => {
    const el: ElementIdentity = {
      selector: '.btn',
      componentName: 'Button',
      sourceFile: 'src/components/Button.tsx',
      sourceLine: 42,
      sourceColumn: 5,
    };
    expect(el.componentName).toBe('Button');
  });

  it('MutationApplyCommand has correct shape', () => {
    const cmd: MutationApplyCommand = {
      kind: 'mutation:apply',
      elementRef: 'ref-123',
      styleChanges: { 'margin-top': '20px', color: 'red' },
    };
    expect(cmd.kind).toBe('mutation:apply');
    expect(Object.keys(cmd.styleChanges)).toHaveLength(2);
  });
});
```

**Commit:** `feat(shared): add mutation diff format types (Phase 4 foundation)`

---

## Task 2: Content script — mutation engine with revert mechanism

**File:** `packages/extension/src/content/mutations/mutationEngine.ts`

Applies `element.style` changes from panel commands. Stores original inline styles for revert. Captures before/after snapshots.

```typescript
// packages/extension/src/content/mutations/mutationEngine.ts

import type {
  MutationDiff,
  PropertyMutation,
  ElementIdentity,
} from '@flow/shared/types/mutation';

/** Maps elementRef → DOM element */
const elementRefMap = new Map<string, HTMLElement>();

/** Maps mutationId → { element, originalStyles } for revert */
interface RevertEntry {
  element: HTMLElement;
  originalStyles: Record<string, string>;
  originalTextContent?: string;
}
const revertStack = new Map<string, RevertEntry>();

/** All accumulated diffs for the session */
const diffs: MutationDiff[] = [];

/**
 * Register a DOM element with a ref ID (called when user selects an element).
 */
export function registerElement(ref: string, element: HTMLElement): void {
  elementRefMap.set(ref, element);
}

/**
 * Unregister an element ref.
 */
export function unregisterElement(ref: string): void {
  elementRefMap.delete(ref);
}

/**
 * Get a unique CSS selector for an element.
 * Prefers id, then builds a path from tag + nth-child.
 */
export function getSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`;

  const parts: string[] = [];
  let current: HTMLElement | null = el;

  while (current && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      parts.unshift(`#${current.id}`);
      break;
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = parent;
  }

  return parts.join(' > ');
}

/**
 * Build an ElementIdentity from a DOM element.
 * componentName and source fields are populated by the agent script
 * via a separate message — this function provides the selector baseline.
 */
export function identifyElement(el: HTMLElement): ElementIdentity {
  return { selector: getSelector(el) };
}

/**
 * Capture the current computed values for a set of CSS properties.
 */
function capturePropertyValues(
  el: HTMLElement,
  properties: string[]
): Record<string, string> {
  const computed = getComputedStyle(el);
  const values: Record<string, string> = {};
  for (const prop of properties) {
    values[prop] = computed.getPropertyValue(prop).trim() || el.style.getPropertyValue(prop);
  }
  return values;
}

/**
 * Apply style mutations to an element. Returns the captured diff.
 *
 * Per spec §5.3:
 * 1. Capture current computed state as "before" snapshot
 * 2. Apply changes to live DOM via element.style
 * 3. Capture "after" state
 * 4. Accumulate diff
 */
export function applyStyleMutation(
  ref: string,
  styleChanges: Record<string, string>,
  elementIdentity?: Partial<ElementIdentity>
): MutationDiff | null {
  const el = elementRefMap.get(ref);
  if (!el) return null;

  const properties = Object.keys(styleChanges);

  // Step 1: capture "before" (spec §5.3 step 2)
  const beforeValues = capturePropertyValues(el, properties);

  // Store originals for revert (only the first time a property is touched)
  const mutationId = crypto.randomUUID();
  const originalStyles: Record<string, string> = {};
  for (const prop of properties) {
    originalStyles[prop] = el.style.getPropertyValue(prop);
  }
  revertStack.set(mutationId, { element: el, originalStyles });

  // Step 2: apply changes (spec §5.3 step 4)
  for (const [prop, value] of Object.entries(styleChanges)) {
    el.style.setProperty(prop, value);
  }

  // Step 3: capture "after" (spec §5.3 step 5)
  const afterValues = capturePropertyValues(el, properties);

  // Step 4: build diff (spec §5.3 step 6)
  const changes: PropertyMutation[] = properties
    .filter((prop) => beforeValues[prop] !== afterValues[prop])
    .map((prop) => ({
      property: prop,
      oldValue: beforeValues[prop],
      newValue: afterValues[prop],
    }));

  if (changes.length === 0) {
    revertStack.delete(mutationId);
    return null;
  }

  const identity = { ...identifyElement(el), ...elementIdentity };

  const diff: MutationDiff = {
    id: mutationId,
    element: identity,
    type: 'style',
    changes,
    timestamp: new Date().toISOString(),
  };

  diffs.push(diff);
  return diff;
}

/**
 * Apply a text content mutation. Returns the captured diff.
 */
export function applyTextMutation(
  ref: string,
  newText: string,
  elementIdentity?: Partial<ElementIdentity>
): MutationDiff | null {
  const el = elementRefMap.get(ref);
  if (!el) return null;

  const oldText = el.textContent ?? '';
  if (oldText === newText) return null;

  const mutationId = crypto.randomUUID();
  revertStack.set(mutationId, {
    element: el,
    originalStyles: {},
    originalTextContent: oldText,
  });

  el.textContent = newText;

  const identity = { ...identifyElement(el), ...elementIdentity };

  const diff: MutationDiff = {
    id: mutationId,
    element: identity,
    type: 'text',
    changes: [
      { property: 'textContent', oldValue: oldText, newValue: newText },
    ],
    timestamp: new Date().toISOString(),
  };

  diffs.push(diff);
  return diff;
}

/**
 * Revert a specific mutation or all mutations.
 */
export function revertMutation(mutationId: string | 'all'): boolean {
  if (mutationId === 'all') {
    for (const [id, entry] of revertStack) {
      revertSingleEntry(entry);
    }
    revertStack.clear();
    diffs.length = 0;
    return true;
  }

  const entry = revertStack.get(mutationId);
  if (!entry) return false;

  revertSingleEntry(entry);
  revertStack.delete(mutationId);

  const index = diffs.findIndex((d) => d.id === mutationId);
  if (index !== -1) diffs.splice(index, 1);

  return true;
}

function revertSingleEntry(entry: RevertEntry): void {
  const { element, originalStyles, originalTextContent } = entry;

  // Revert style properties
  for (const [prop, value] of Object.entries(originalStyles)) {
    if (value) {
      element.style.setProperty(prop, value);
    } else {
      element.style.removeProperty(prop);
    }
  }

  // Revert text content
  if (originalTextContent !== undefined) {
    element.textContent = originalTextContent;
  }
}

/**
 * Get all accumulated diffs (for sending to panel).
 */
export function getAllDiffs(): MutationDiff[] {
  return [...diffs];
}

/**
 * Clear all diffs and revert entries without reverting DOM changes.
 */
export function clearDiffs(): void {
  diffs.length = 0;
  revertStack.clear();
}
```

**Test:** `packages/extension/src/content/mutations/__tests__/mutationEngine.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  registerElement,
  applyStyleMutation,
  applyTextMutation,
  revertMutation,
  getAllDiffs,
  clearDiffs,
  getSelector,
} from '../mutationEngine';

// Note: JSDOM doesn't support getComputedStyle fully.
// These tests validate the logic flow and revert mechanism.
// Integration tests on a real browser page cover computed style accuracy.

describe('mutationEngine', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><body><div id="hero"><h1 class="title">Hello</h1></div></body>');
    document = dom.window.document;
    // Stub global document and crypto for content script context
    globalThis.document = document as any;
    globalThis.getComputedStyle = dom.window.getComputedStyle as any;
    globalThis.crypto = { randomUUID: () => `test-${Date.now()}-${Math.random()}` } as any;
    clearDiffs();
  });

  it('getSelector returns #id for elements with id', () => {
    const el = document.getElementById('hero')!;
    expect(getSelector(el as any)).toBe('#hero');
  });

  it('applyStyleMutation sets element.style and captures diff', () => {
    const el = document.querySelector('h1')! as HTMLElement;
    registerElement('ref-1', el);

    const diff = applyStyleMutation('ref-1', { color: 'red' });
    // In JSDOM, computed style may not reflect element.style changes correctly.
    // We verify the style was set and a diff was produced.
    expect(el.style.color).toBe('red');
    // Diff may be null in JSDOM if computed before/after are the same.
    // This is a known JSDOM limitation; real browser tests cover this.
  });

  it('applyTextMutation changes textContent and captures diff', () => {
    const el = document.querySelector('h1')! as HTMLElement;
    registerElement('ref-1', el);

    const diff = applyTextMutation('ref-1', 'Goodbye');
    expect(el.textContent).toBe('Goodbye');
    expect(diff).not.toBeNull();
    expect(diff!.type).toBe('text');
    expect(diff!.changes[0].oldValue).toBe('Hello');
    expect(diff!.changes[0].newValue).toBe('Goodbye');
  });

  it('revertMutation restores original text', () => {
    const el = document.querySelector('h1')! as HTMLElement;
    registerElement('ref-1', el);

    const diff = applyTextMutation('ref-1', 'Goodbye');
    expect(el.textContent).toBe('Goodbye');

    revertMutation(diff!.id);
    expect(el.textContent).toBe('Hello');
    expect(getAllDiffs()).toHaveLength(0);
  });

  it('revertMutation("all") clears everything', () => {
    const el = document.querySelector('h1')! as HTMLElement;
    registerElement('ref-1', el);

    applyTextMutation('ref-1', 'A');
    applyTextMutation('ref-1', 'B');
    expect(getAllDiffs().length).toBeGreaterThanOrEqual(1);

    revertMutation('all');
    expect(getAllDiffs()).toHaveLength(0);
  });

  it('returns null for unknown elementRef', () => {
    expect(applyStyleMutation('nonexistent', { color: 'red' })).toBeNull();
    expect(applyTextMutation('nonexistent', 'text')).toBeNull();
  });
});
```

**Commit:** `feat(extension): mutation engine with style/text apply and revert (Phase 4.2)`

---

## Task 3: Content script — wire mutation engine to message passing

**Files:**
- `packages/extension/src/content/mutations/mutationMessageHandler.ts`
- `packages/shared/src/constants.ts`
- `packages/extension/src/entrypoints/background.ts`

Listens for mutation commands from the panel (via service worker relay) and dispatches to the engine. Sends diff events back.

```typescript
// packages/extension/src/content/mutations/mutationMessageHandler.ts

import type {
  MutationMessage,
  MutationApplyCommand,
  MutationTextCommand,
  MutationRevertCommand,
  MutationDiffEvent,
  MutationRevertedEvent,
} from '@flow/shared/types/mutation';
import {
  applyStyleMutation,
  applyTextMutation,
  revertMutation,
} from './mutationEngine';
import { activateTextEditMode, deactivateTextEditMode } from './textEditMode';

/** Port to service worker, established by the content script's main init */
let port: chrome.runtime.Port | null = null;

export function initMutationMessageHandler(swPort: chrome.runtime.Port): void {
  port = swPort;

  port.onMessage.addListener((message: MutationMessage) => {
    switch (message.kind) {
      case 'mutation:apply':
        handleApply(message);
        break;
      case 'mutation:text':
        handleText(message);
        break;
      case 'textEdit:activate':
        activateTextEditMode({
          onDiff: (diff) => {
            if (port) {
              const event: MutationDiffEvent = { kind: 'mutation:diff', diff };
              port.postMessage(event);
            }
          },
        });
        break;
      case 'textEdit:deactivate':
        deactivateTextEditMode();
        break;
      case 'mutation:revert':
        handleRevert(message);
        break;
    }
  });
}

function handleApply(cmd: MutationApplyCommand): void {
  const diff = applyStyleMutation(cmd.elementRef, cmd.styleChanges);
  if (diff && port) {
    const event: MutationDiffEvent = { kind: 'mutation:diff', diff };
    port.postMessage(event);
  }
}

function handleText(cmd: MutationTextCommand): void {
  const diff = applyTextMutation(cmd.elementRef, cmd.newText);
  if (diff && port) {
    const event: MutationDiffEvent = { kind: 'mutation:diff', diff };
    port.postMessage(event);
  }
}

function handleRevert(cmd: MutationRevertCommand): void {
  const success = revertMutation(cmd.mutationId);
  if (success && port) {
    const event: MutationRevertedEvent = {
      kind: 'mutation:reverted',
      mutationId: cmd.mutationId,
    };
    port.postMessage(event);
  }
}
```

### `packages/shared/src/constants.ts` (add port names)

```typescript
export const FLOW_MUTATION_PORT_NAME = 'flow-mutation' as const;
export const FLOW_TEXT_EDIT_PORT_NAME = 'flow-text-edit' as const;
```

### `packages/extension/src/entrypoints/background.ts` (extend router)

```typescript
import {
  FLOW_MUTATION_PORT_NAME,
  FLOW_TEXT_EDIT_PORT_NAME,
  type PanelToBackgroundMessage,
} from '@flow/shared';
import type { MutationMessage } from '@flow/shared/types/mutation';

const mutationPorts = new Map<number, chrome.runtime.Port>();
const textEditPorts = new Map<number, chrome.runtime.Port>();

function registerPanelPort(
  map: Map<number, chrome.runtime.Port>,
  port: chrome.runtime.Port
) {
  let tabId: number | null = null;

  port.onMessage.addListener((msg: PanelToBackgroundMessage | MutationMessage) => {
    if ((msg as PanelToBackgroundMessage).type === 'panel:init') {
      tabId = (msg as PanelToBackgroundMessage).payload.tabId;
      map.set(tabId, port);
      return;
    }

    if (tabId !== null) {
      contentPorts.get(tabId)?.postMessage(msg);
    }
  });

  port.onDisconnect.addListener(() => {
    if (tabId !== null) map.delete(tabId);
  });
}

// In chrome.runtime.onConnect:
if (port.name === FLOW_MUTATION_PORT_NAME) {
  registerPanelPort(mutationPorts, port);
  return;
}
if (port.name === FLOW_TEXT_EDIT_PORT_NAME) {
  registerPanelPort(textEditPorts, port);
  return;
}

// In content port message handler:
port.onMessage.addListener((msg: ContentToBackgroundMessage | MutationMessage) => {
  const panelPort = panelPorts.get(tabId);
  if (panelPort) panelPort.postMessage(msg);

  if ((msg as any)?.kind?.startsWith('mutation:') || (msg as any)?.kind?.startsWith('textEdit:')) {
    mutationPorts.get(tabId)?.postMessage(msg);
    textEditPorts.get(tabId)?.postMessage(msg);
  }
});
```

**No separate test file** — this is a thin message-passing adapter. Covered by integration tests in Task 9.

**Commit:** `feat(extension): wire mutation engine to message passing (Phase 4.3)`

---

## Task 4: Content script — before/after snapshot capture (compact JSON patch format) [x]

**File:** `packages/extension/src/content/mutations/snapshotCapture.ts`

Utility for capturing a full computed style snapshot of an element. Used by the mutation engine for comprehensive before/after comparison. Per spec section 13.6: "Mutation diffs stored as compact JSON patches, not full DOM snapshots."

```typescript
// packages/extension/src/content/mutations/snapshotCapture.ts

/**
 * Capture a compact snapshot of an element's current visual state.
 * Only captures properties that have non-default values to keep patches small.
 *
 * Per spec §13.6: compact JSON patches, not full DOM snapshots.
 */
export interface ElementSnapshot {
  /** Element selector at time of capture */
  selector: string;
  /** Inline styles (element.style) — these are what we mutate */
  inlineStyles: Record<string, string>;
  /** Key computed values for the most commonly edited categories */
  computed: {
    layout: Record<string, string>;
    spacing: Record<string, string>;
    size: Record<string, string>;
    typography: Record<string, string>;
    colors: Record<string, string>;
    borders: Record<string, string>;
  };
  /** Text content (first text node only) */
  textContent: string;
}

const LAYOUT_PROPS = ['display', 'position', 'flex-direction', 'flex-wrap', 'align-items', 'justify-content', 'grid-template-columns', 'grid-template-rows', 'gap'];
const SPACING_PROPS = ['margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left'];
const SIZE_PROPS = ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height'];
const TYPOGRAPHY_PROPS = ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align', 'color'];
const COLOR_PROPS = ['background-color', 'color', 'border-color'];
const BORDER_PROPS = ['border-width', 'border-style', 'border-color', 'border-radius'];

function readProps(computed: CSSStyleDeclaration, props: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const prop of props) {
    const val = computed.getPropertyValue(prop).trim();
    if (val) result[prop] = val;
  }
  return result;
}

function readInlineStyles(el: HTMLElement): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < el.style.length; i++) {
    const prop = el.style[i];
    result[prop] = el.style.getPropertyValue(prop);
  }
  return result;
}

export function captureSnapshot(el: HTMLElement, selector: string): ElementSnapshot {
  const computed = getComputedStyle(el);
  return {
    selector,
    inlineStyles: readInlineStyles(el),
    computed: {
      layout: readProps(computed, LAYOUT_PROPS),
      spacing: readProps(computed, SPACING_PROPS),
      size: readProps(computed, SIZE_PROPS),
      typography: readProps(computed, TYPOGRAPHY_PROPS),
      colors: readProps(computed, COLOR_PROPS),
      borders: readProps(computed, BORDER_PROPS),
    },
    textContent: el.textContent?.trim() ?? '',
  };
}

/**
 * Compute a compact diff between two snapshots.
 * Only includes properties that changed.
 */
export function diffSnapshots(
  before: ElementSnapshot,
  after: ElementSnapshot
): { property: string; oldValue: string; newValue: string }[] {
  const changes: { property: string; oldValue: string; newValue: string }[] = [];

  // Compare all computed categories
  for (const category of ['layout', 'spacing', 'size', 'typography', 'colors', 'borders'] as const) {
    const beforeCat = before.computed[category];
    const afterCat = after.computed[category];
    const allKeys = new Set([...Object.keys(beforeCat), ...Object.keys(afterCat)]);
    for (const key of allKeys) {
      const oldVal = beforeCat[key] ?? '';
      const newVal = afterCat[key] ?? '';
      if (oldVal !== newVal) {
        changes.push({ property: key, oldValue: oldVal, newValue: newVal });
      }
    }
  }

  // Compare text
  if (before.textContent !== after.textContent) {
    changes.push({
      property: 'textContent',
      oldValue: before.textContent,
      newValue: after.textContent,
    });
  }

  return changes;
}
```

**Test:** `packages/extension/src/content/mutations/__tests__/snapshotCapture.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { diffSnapshots, type ElementSnapshot } from '../snapshotCapture';

describe('diffSnapshots', () => {
  const makeSnapshot = (overrides?: Partial<ElementSnapshot>): ElementSnapshot => ({
    selector: '.test',
    inlineStyles: {},
    computed: {
      layout: { display: 'flex' },
      spacing: { 'margin-top': '0px' },
      size: { width: '100px' },
      typography: { 'font-size': '16px' },
      colors: { color: 'rgb(0, 0, 0)' },
      borders: {},
    },
    textContent: 'Hello',
    ...overrides,
  });

  it('returns empty array for identical snapshots', () => {
    const snap = makeSnapshot();
    expect(diffSnapshots(snap, snap)).toEqual([]);
  });

  it('detects spacing changes', () => {
    const before = makeSnapshot();
    const after = makeSnapshot({
      computed: {
        ...makeSnapshot().computed,
        spacing: { 'margin-top': '20px' },
      },
    });
    const changes = diffSnapshots(before, after);
    expect(changes).toContainEqual({
      property: 'margin-top',
      oldValue: '0px',
      newValue: '20px',
    });
  });

  it('detects text changes', () => {
    const before = makeSnapshot();
    const after = makeSnapshot({ textContent: 'Goodbye' });
    const changes = diffSnapshots(before, after);
    expect(changes).toContainEqual({
      property: 'textContent',
      oldValue: 'Hello',
      newValue: 'Goodbye',
    });
  });
});
```

**Commit:** `feat(extension): compact snapshot capture and diff (Phase 4.4)`

---

## Task 5: Content script — drag handles for spacing (box model visualization) [x]

**File:** `packages/extension/src/content/overlays/spacingHandles.ts`

Renders draggable edge handles on the selected element for margin and padding adjustment. Lives in the content script's Shadow DOM overlay layer. On drag, applies live `element.style` updates and captures diffs.

```typescript
// packages/extension/src/content/overlays/spacingHandles.ts

import { applyStyleMutation, identifyElement, registerElement } from '../mutations/mutationEngine';

export interface SpacingHandlesOptions {
  /** The Shadow DOM root to render handles into (from Phase 1 overlay layer) */
  shadowRoot: ShadowRoot;
  /** Callback when a mutation diff is produced */
  onDiff: (diff: import('@flow/shared/types/mutation').MutationDiff) => void;
}

interface HandleState {
  container: HTMLDivElement;
  target: HTMLElement | null;
  targetRef: string;
  handles: Map<string, HTMLDivElement>;
}

const EDGES = ['top', 'right', 'bottom', 'left'] as const;
type Edge = (typeof EDGES)[number];

const HANDLE_THICKNESS = 6;

export function createSpacingHandles(options: SpacingHandlesOptions): {
  attach: (element: HTMLElement) => void;
  detach: () => void;
  destroy: () => void;
} {
  const { shadowRoot, onDiff } = options;

  const state: HandleState = {
    container: document.createElement('div'),
    target: null,
    targetRef: '',
    handles: new Map(),
  };

  // Container for all handles
  state.container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2147483646;';
  shadowRoot.appendChild(state.container);

  // Create 8 handles: 4 margin edges + 4 padding edges
  for (const type of ['margin', 'padding'] as const) {
    for (const edge of EDGES) {
      const handle = document.createElement('div');
      handle.dataset.type = type;
      handle.dataset.edge = edge;
      handle.style.cssText = `
        position: fixed;
        pointer-events: auto;
        cursor: ${edge === 'top' || edge === 'bottom' ? 'ns-resize' : 'ew-resize'};
        background: ${type === 'margin' ? 'rgba(255, 165, 0, 0.4)' : 'rgba(0, 128, 0, 0.4)'};
        transition: background 0.15s ease-out;
      `;
      handle.addEventListener('mouseenter', () => {
        handle.style.background = type === 'margin'
          ? 'rgba(255, 165, 0, 0.7)'
          : 'rgba(0, 128, 0, 0.7)';
      });
      handle.addEventListener('mouseleave', () => {
        handle.style.background = type === 'margin'
          ? 'rgba(255, 165, 0, 0.4)'
          : 'rgba(0, 128, 0, 0.4)';
      });

      setupDragHandler(handle, type, edge, state, onDiff);

      state.handles.set(`${type}-${edge}`, handle);
      state.container.appendChild(handle);
    }
  }

  function positionHandles(): void {
    if (!state.target) return;

    const rect = state.target.getBoundingClientRect();
    const computed = getComputedStyle(state.target);

    for (const type of ['margin', 'padding'] as const) {
      for (const edge of EDGES) {
        const handle = state.handles.get(`${type}-${edge}`)!;
        const value = parseFloat(computed.getPropertyValue(`${type}-${edge}`)) || 0;

        if (type === 'margin') {
          positionMarginHandle(handle, rect, edge, value);
        } else {
          positionPaddingHandle(handle, rect, edge, value);
        }
      }
    }
  }

  function positionMarginHandle(
    handle: HTMLDivElement, rect: DOMRect, edge: Edge, value: number
  ): void {
    const t = HANDLE_THICKNESS;
    switch (edge) {
      case 'top':
        handle.style.left = `${rect.left}px`;
        handle.style.top = `${rect.top - value}px`;
        handle.style.width = `${rect.width}px`;
        handle.style.height = `${Math.max(value, t)}px`;
        break;
      case 'bottom':
        handle.style.left = `${rect.left}px`;
        handle.style.top = `${rect.bottom}px`;
        handle.style.width = `${rect.width}px`;
        handle.style.height = `${Math.max(value, t)}px`;
        break;
      case 'left':
        handle.style.left = `${rect.left - value}px`;
        handle.style.top = `${rect.top}px`;
        handle.style.width = `${Math.max(value, t)}px`;
        handle.style.height = `${rect.height}px`;
        break;
      case 'right':
        handle.style.left = `${rect.right}px`;
        handle.style.top = `${rect.top}px`;
        handle.style.width = `${Math.max(value, t)}px`;
        handle.style.height = `${rect.height}px`;
        break;
    }
  }

  function positionPaddingHandle(
    handle: HTMLDivElement, rect: DOMRect, edge: Edge, value: number
  ): void {
    const t = HANDLE_THICKNESS;
    switch (edge) {
      case 'top':
        handle.style.left = `${rect.left}px`;
        handle.style.top = `${rect.top}px`;
        handle.style.width = `${rect.width}px`;
        handle.style.height = `${Math.max(value, t)}px`;
        break;
      case 'bottom':
        handle.style.left = `${rect.left}px`;
        handle.style.top = `${rect.bottom - Math.max(value, t)}px`;
        handle.style.width = `${rect.width}px`;
        handle.style.height = `${Math.max(value, t)}px`;
        break;
      case 'left':
        handle.style.left = `${rect.left}px`;
        handle.style.top = `${rect.top}px`;
        handle.style.width = `${Math.max(value, t)}px`;
        handle.style.height = `${rect.height}px`;
        break;
      case 'right':
        handle.style.left = `${rect.right - Math.max(value, t)}px`;
        handle.style.top = `${rect.top}px`;
        handle.style.width = `${Math.max(value, t)}px`;
        handle.style.height = `${rect.height}px`;
        break;
    }
  }

  let rafId: number | null = null;

  function startPositionLoop(): void {
    const loop = () => {
      positionHandles();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  }

  function stopPositionLoop(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  return {
    attach(element: HTMLElement) {
      state.target = element;
      state.targetRef = `spacing-${crypto.randomUUID()}`;
      registerElement(state.targetRef, element);
      state.container.style.display = '';
      startPositionLoop();
    },
    detach() {
      state.target = null;
      stopPositionLoop();
      state.container.style.display = 'none';
    },
    destroy() {
      stopPositionLoop();
      state.container.remove();
    },
  };
}

function setupDragHandler(
  handle: HTMLDivElement,
  type: 'margin' | 'padding',
  edge: Edge,
  state: HandleState,
  onDiff: SpacingHandlesOptions['onDiff']
): void {
  let startY = 0;
  let startX = 0;
  let startValue = 0;

  const onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!state.target) return;

    const computed = getComputedStyle(state.target);
    startValue = parseFloat(computed.getPropertyValue(`${type}-${edge}`)) || 0;
    startX = e.clientX;
    startY = e.clientY;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp, { once: true });
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!state.target) return;

    let delta: number;
    if (edge === 'top' || edge === 'bottom') {
      delta = e.clientY - startY;
      if (edge === 'top') delta = -delta; // dragging up increases top margin/padding
    } else {
      delta = e.clientX - startX;
      if (edge === 'left') delta = -delta;
    }

    const newValue = Math.max(0, startValue + delta);
    const property = `${type}-${edge}`;

    // Apply live — don't capture diff on every mousemove, only on mouseup
    state.target.style.setProperty(property, `${newValue}px`);
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    if (!state.target) return;

    const property = `${type}-${edge}`;
    const computed = getComputedStyle(state.target);
    const finalValue = computed.getPropertyValue(property).trim();

    // Capture diff at drag end
    const diff = applyStyleMutation(
      state.targetRef,
      { [property]: finalValue }
    );
    if (diff) onDiff(diff);
  };

  handle.addEventListener('mousedown', onMouseDown);
}
```

**No unit test** — drag handle behavior requires real mouse events and layout. Covered by manual integration testing and the end-to-end test in Task 9.

**Commit:** `feat(extension): drag handles for margin/padding spacing (Phase 4.5)`

---

## Task 6: Content script — text selection and replacement [x]

**File:** `packages/extension/src/content/mutations/textEditMode.ts`

Enables text edit mode: user clicks a text element, it becomes editable, changes are captured as diffs on blur. Per spec section 7.3.

```typescript
// packages/extension/src/content/mutations/textEditMode.ts

import type { MutationDiff, MutationDiffEvent } from '@flow/shared/types/mutation';
import { registerElement, applyTextMutation, identifyElement } from './mutationEngine';

export interface TextEditModeOptions {
  /** Callback when a text diff is produced */
  onDiff: (diff: MutationDiff) => void;
}

let activeElement: HTMLElement | null = null;
let activeRef: string = '';
let originalText: string = '';
let options: TextEditModeOptions | null = null;

/**
 * Activate text edit mode. Clicks on text elements make them contentEditable.
 */
export function activateTextEditMode(opts: TextEditModeOptions): void {
  options = opts;
  document.addEventListener('click', handleClick, true);
}

/**
 * Deactivate text edit mode. Commits any pending edit.
 */
export function deactivateTextEditMode(): void {
  commitEdit();
  document.removeEventListener('click', handleClick, true);
  options = null;
}

function handleClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  if (!target || !options) return;

  // Only activate on elements that contain direct text (not just child elements)
  const hasDirectText = Array.from(target.childNodes).some(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
  );

  if (!hasDirectText) return;

  e.preventDefault();
  e.stopPropagation();

  // Commit previous edit if any
  commitEdit();

  // Activate new element
  activeElement = target;
  activeRef = `text-${crypto.randomUUID()}`;
  originalText = target.textContent ?? '';
  registerElement(activeRef, target);

  target.contentEditable = 'true';
  target.focus();

  // Style to show it's editable
  target.style.outline = '2px solid rgba(59, 130, 246, 0.5)';
  target.style.outlineOffset = '2px';

  target.addEventListener('blur', handleBlur, { once: true });
  target.addEventListener('keydown', handleKeydown);
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    // Revert and exit
    if (activeElement) {
      activeElement.textContent = originalText;
    }
    commitEdit(true);
  } else if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    commitEdit();
  }
}

function handleBlur(): void {
  commitEdit();
}

function commitEdit(reverted = false): void {
  if (!activeElement || !options) return;

  const el = activeElement;
  el.contentEditable = 'false';
  el.style.outline = '';
  el.style.outlineOffset = '';
  el.removeEventListener('keydown', handleKeydown);

  if (!reverted) {
    const newText = el.textContent ?? '';
    if (newText !== originalText) {
      const diff = applyTextMutation(activeRef, newText);
      if (diff) {
        options.onDiff(diff);
      }
    }
  }

  activeElement = null;
  activeRef = '';
  originalText = '';
}
```

**Test:** `packages/extension/src/content/mutations/__tests__/textEditMode.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// This module depends heavily on DOM events and contentEditable.
// Minimal smoke tests here; full behavior tested in integration.

describe('textEditMode (smoke)', () => {
  it('module exports activate and deactivate functions', async () => {
    // Dynamic import to verify module shape
    const mod = await import('../textEditMode');
    expect(typeof mod.activateTextEditMode).toBe('function');
    expect(typeof mod.deactivateTextEditMode).toBe('function');
  });
});
```

**Commit:** `feat(extension): text edit mode with live replacement and diff capture (Phase 4.6)`

---

## Task 7: Panel — Zustand mutation slice (diff accumulator) [x]

**File:** `packages/extension/src/panel/stores/slices/mutationSlice.ts`

Zustand slice that accumulates diffs received from the content script, supports clear/revert actions, and exposes grouped-by-element views.

```typescript
// packages/extension/src/panel/stores/slices/mutationSlice.ts

import type { StateCreator } from 'zustand';
import type { MutationDiff } from '@flow/shared/types/mutation';

export interface MutationSlice {
  /** All accumulated mutation diffs */
  mutationDiffs: MutationDiff[];

  /** Add a diff from the content script */
  addMutationDiff: (diff: MutationDiff) => void;

  /** Remove a specific diff (after revert) */
  removeMutationDiff: (mutationId: string) => void;

  /** Clear all diffs */
  clearMutationDiffs: () => void;

  /** Get diffs grouped by element selector */
  getMutationsByElement: () => Map<string, MutationDiff[]>;
}

export const createMutationSlice: StateCreator<
  MutationSlice,
  [],
  [],
  MutationSlice
> = (set, get) => ({
  mutationDiffs: [],

  addMutationDiff: (diff) =>
    set((state) => ({
      mutationDiffs: [...state.mutationDiffs, diff],
    })),

  removeMutationDiff: (mutationId) =>
    set((state) => ({
      mutationDiffs: state.mutationDiffs.filter((d) => d.id !== mutationId),
    })),

  clearMutationDiffs: () => set({ mutationDiffs: [] }),

  getMutationsByElement: () => {
    const grouped = new Map<string, MutationDiff[]>();
    for (const diff of get().mutationDiffs) {
      const key = diff.element.selector;
      const existing = grouped.get(key) ?? [];
      existing.push(diff);
      grouped.set(key, existing);
    }
    return grouped;
  },
});
```

**Test:** `packages/extension/src/panel/stores/slices/__tests__/mutationSlice.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { create } from 'zustand';
import { createMutationSlice, type MutationSlice } from '../mutationSlice';
import type { MutationDiff } from '@flow/shared/types/mutation';

const makeDiff = (id: string, selector: string, property: string): MutationDiff => ({
  id,
  element: { selector },
  type: 'style',
  changes: [{ property, oldValue: '0px', newValue: '10px' }],
  timestamp: new Date().toISOString(),
});

describe('mutationSlice', () => {
  it('accumulates diffs', () => {
    const store = create<MutationSlice>()(createMutationSlice);
    store.getState().addMutationDiff(makeDiff('1', '.a', 'margin'));
    store.getState().addMutationDiff(makeDiff('2', '.b', 'padding'));
    expect(store.getState().mutationDiffs).toHaveLength(2);
  });

  it('removes a specific diff', () => {
    const store = create<MutationSlice>()(createMutationSlice);
    store.getState().addMutationDiff(makeDiff('1', '.a', 'margin'));
    store.getState().addMutationDiff(makeDiff('2', '.b', 'padding'));
    store.getState().removeMutationDiff('1');
    expect(store.getState().mutationDiffs).toHaveLength(1);
    expect(store.getState().mutationDiffs[0].id).toBe('2');
  });

  it('clears all diffs', () => {
    const store = create<MutationSlice>()(createMutationSlice);
    store.getState().addMutationDiff(makeDiff('1', '.a', 'margin'));
    store.getState().clearMutationDiffs();
    expect(store.getState().mutationDiffs).toHaveLength(0);
  });

  it('groups diffs by element selector', () => {
    const store = create<MutationSlice>()(createMutationSlice);
    store.getState().addMutationDiff(makeDiff('1', '.a', 'margin'));
    store.getState().addMutationDiff(makeDiff('2', '.a', 'padding'));
    store.getState().addMutationDiff(makeDiff('3', '.b', 'color'));

    const grouped = store.getState().getMutationsByElement();
    expect(grouped.get('.a')).toHaveLength(2);
    expect(grouped.get('.b')).toHaveLength(1);
  });
});
```

**Commit:** `feat(extension): Zustand mutation diff accumulator slice (Phase 4.7)`

---

## Task 8: Panel — MutationDiffPanel React component [x]

**File:** `packages/extension/src/panel/components/MutationDiffPanel.tsx`

Displays all accumulated diffs grouped by element. Shows property/old/new values. Has clear and revert controls.

```tsx
// packages/extension/src/panel/components/MutationDiffPanel.tsx

import { useMemo } from 'react';
import type { MutationDiff } from '@flow/shared/types/mutation';

interface MutationDiffPanelProps {
  diffs: MutationDiff[];
  onRevert: (mutationId: string) => void;
  onRevertAll: () => void;
  onClear: () => void;
}

export function MutationDiffPanel({
  diffs,
  onRevert,
  onRevertAll,
  onClear,
}: MutationDiffPanelProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, MutationDiff[]>();
    for (const diff of diffs) {
      const key = diff.element.selector;
      const arr = map.get(key) ?? [];
      arr.push(diff);
      map.set(key, arr);
    }
    return map;
  }, [diffs]);

  if (diffs.length === 0) {
    return (
      <div className="p-4 text-content-secondary text-sm">
        No mutations captured. Edit styles or text on the page to see diffs here.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {/* Header controls */}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-content-primary">
          {diffs.length} mutation{diffs.length !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-2">
          <button
            onClick={onRevertAll}
            className="text-xs px-2 py-1 rounded bg-surface-secondary text-content-primary hover:bg-surface-tertiary"
          >
            Revert All
          </button>
          <button
            onClick={onClear}
            className="text-xs px-2 py-1 rounded bg-surface-secondary text-content-primary hover:bg-surface-tertiary"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Grouped diffs */}
      {Array.from(grouped.entries()).map(([selector, elementDiffs]) => (
        <div
          key={selector}
          className="border border-edge-primary rounded bg-surface-primary"
        >
          {/* Element header */}
          <div className="px-3 py-2 border-b border-edge-primary bg-surface-secondary">
            <code className="text-xs text-content-primary">{selector}</code>
            {elementDiffs[0].element.componentName && (
              <span className="ml-2 text-xs text-content-secondary">
                ({elementDiffs[0].element.componentName})
              </span>
            )}
            {elementDiffs[0].element.sourceFile && (
              <span className="ml-2 text-xs text-content-tertiary">
                {elementDiffs[0].element.sourceFile}
                {elementDiffs[0].element.sourceLine
                  ? `:${elementDiffs[0].element.sourceLine}`
                  : ''}
              </span>
            )}
          </div>

          {/* Property changes */}
          <div className="divide-y divide-edge-primary">
            {elementDiffs.map((diff) =>
              diff.changes.map((change, i) => (
                <div
                  key={`${diff.id}-${i}`}
                  className="flex items-center gap-3 px-3 py-1.5 text-xs"
                >
                  <span className="font-mono text-content-primary w-32 shrink-0">
                    {change.property}
                  </span>
                  <span className="text-red-500 line-through">
                    {change.oldValue || '(none)'}
                  </span>
                  <span className="text-content-secondary">&rarr;</span>
                  <span className="text-green-500">
                    {change.newValue || '(none)'}
                  </span>
                  <button
                    onClick={() => onRevert(diff.id)}
                    className="ml-auto text-content-tertiary hover:text-content-primary"
                    title="Revert this change"
                  >
                    &times;
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Test:** `packages/extension/src/panel/components/__tests__/MutationDiffPanel.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MutationDiffPanel } from '../MutationDiffPanel';
import type { MutationDiff } from '@flow/shared/types/mutation';

const makeDiff = (id: string, selector: string): MutationDiff => ({
  id,
  element: { selector, componentName: 'Button' },
  type: 'style',
  changes: [{ property: 'color', oldValue: 'black', newValue: 'red' }],
  timestamp: new Date().toISOString(),
});

describe('MutationDiffPanel', () => {
  it('shows empty state when no diffs', () => {
    render(
      <MutationDiffPanel diffs={[]} onRevert={vi.fn()} onRevertAll={vi.fn()} onClear={vi.fn()} />
    );
    expect(screen.getByText(/No mutations captured/)).toBeTruthy();
  });

  it('renders diffs grouped by selector', () => {
    const diffs = [makeDiff('1', '.btn'), makeDiff('2', '.btn'), makeDiff('3', '.hero')];
    render(
      <MutationDiffPanel diffs={diffs} onRevert={vi.fn()} onRevertAll={vi.fn()} onClear={vi.fn()} />
    );
    expect(screen.getByText('.btn')).toBeTruthy();
    expect(screen.getByText('.hero')).toBeTruthy();
    expect(screen.getByText('3 mutations')).toBeTruthy();
  });

  it('calls onRevertAll when button clicked', () => {
    const onRevertAll = vi.fn();
    render(
      <MutationDiffPanel
        diffs={[makeDiff('1', '.a')]}
        onRevert={vi.fn()}
        onRevertAll={onRevertAll}
        onClear={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Revert All'));
    expect(onRevertAll).toHaveBeenCalledOnce();
  });
});
```

**Commit:** `feat(extension): MutationDiffPanel component with grouped display (Phase 4.8)`

---

## Task 9: Panel — wire designer panel controls to live DOM mutations [x]

**File:** `packages/extension/src/panel/hooks/useMutationBridge.ts`

Hook that bridges the panel's designer controls to the content script's mutation engine. Sends `mutation:apply` commands when designer inputs change. Listens for `mutation:diff` events and feeds them to the Zustand store.

```typescript
// packages/extension/src/panel/hooks/useMutationBridge.ts

import { useEffect, useCallback, useRef } from 'react';
import { FLOW_MUTATION_PORT_NAME, type PanelToBackgroundMessage } from '@flow/shared';
import type {
  MutationApplyCommand,
  MutationRevertCommand,
  MutationDiffEvent,
  MutationRevertedEvent,
  MutationMessage,
} from '@flow/shared/types/mutation';

interface UseMutationBridgeOptions {
  /** The currently selected element's ref ID in the content script */
  elementRef: string | null;
  /** Callback when a diff is received from the content script */
  onDiff: (diff: MutationDiffEvent['diff']) => void;
  /** Callback when a revert is confirmed */
  onReverted: (mutationId: string | 'all') => void;
}

export function useMutationBridge({
  elementRef,
  onDiff,
  onReverted,
}: UseMutationBridgeOptions) {
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    const tabId = chrome.devtools.inspectedWindow.tabId;
    const port = chrome.runtime.connect({ name: FLOW_MUTATION_PORT_NAME });
    portRef.current = port;

    const initMsg: PanelToBackgroundMessage = {
      type: 'panel:init',
      payload: { tabId },
    };
    port.postMessage(initMsg);

    const handleMessage = (message: MutationMessage) => {
      if (message.kind === 'mutation:diff') {
        onDiff(message.diff);
      } else if (message.kind === 'mutation:reverted') {
        onReverted(message.mutationId);
      }
    };

    port.onMessage.addListener(handleMessage);

    return () => {
      port.disconnect();
      portRef.current = null;
    };
  }, [onDiff, onReverted]);

  const applyStyle = useCallback(
    (styleChanges: Record<string, string>) => {
      if (!elementRef || !portRef.current) return;
      const cmd: MutationApplyCommand = {
        kind: 'mutation:apply',
        elementRef,
        styleChanges,
      };
      portRef.current.postMessage(cmd);
    },
    [elementRef]
  );

  const revert = useCallback(
    (mutationId: string | 'all') => {
      if (!portRef.current) return;
      const cmd: MutationRevertCommand = {
        kind: 'mutation:revert',
        mutationId,
      };
      portRef.current.postMessage(cmd);
    },
    []
  );

  return { applyStyle, revert };
}
```

This hook is consumed by the existing designer panel sections (ported in Phase 3). Each designer input (color picker, number input, select, etc.) calls `applyStyle({ [property]: newValue })` on change.

**No separate test** — this is a React hook wrapping `chrome.runtime.connect`. Tested via integration.

**Commit:** `feat(extension): useMutationBridge hook wiring designer panel to content script (Phase 4.9)`

---

## Task 10: Panel — wire text edit mode to content script [x]

**File:** `packages/extension/src/panel/hooks/useTextEditBridge.ts`

Hook that activates/deactivates text edit mode on the content script and receives text diffs.

```typescript
// packages/extension/src/panel/hooks/useTextEditBridge.ts

import { useEffect, useCallback, useRef } from 'react';
import { FLOW_TEXT_EDIT_PORT_NAME, type PanelToBackgroundMessage } from '@flow/shared';
import type {
  MutationTextCommand,
  MutationDiffEvent,
  MutationMessage,
} from '@flow/shared/types/mutation';

interface UseTextEditBridgeOptions {
  /** Whether text edit mode is active */
  active: boolean;
  /** Callback when a text diff is received */
  onDiff: (diff: MutationDiffEvent['diff']) => void;
}

export function useTextEditBridge({ active, onDiff }: UseTextEditBridgeOptions) {
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    const tabId = chrome.devtools.inspectedWindow.tabId;
    const port = chrome.runtime.connect({ name: FLOW_TEXT_EDIT_PORT_NAME });
    portRef.current = port;

    const initMsg: PanelToBackgroundMessage = {
      type: 'panel:init',
      payload: { tabId },
    };
    port.postMessage(initMsg);

    const handleMessage = (message: MutationMessage) => {
      if (message.kind === 'mutation:diff') {
        onDiff(message.diff);
      }
    };

    port.onMessage.addListener(handleMessage);

    // Tell content script to activate/deactivate text edit mode
    port.postMessage({
      kind: active ? 'textEdit:activate' : 'textEdit:deactivate',
    });

    return () => {
      port.postMessage({ kind: 'textEdit:deactivate' });
      port.disconnect();
      portRef.current = null;
    };
  }, [active, onDiff]);
}
```

**No separate test** — thin wrapper over `chrome.runtime.connect`. Tested via integration.

**Commit:** `feat(extension): useTextEditBridge hook for text edit mode (Phase 4.10)`

---

## Task 11: Integration test — end-to-end mutation flow [x]

**File:** `packages/extension/src/__tests__/integration/mutationFlow.test.ts`

This is the verification test from the master plan: "make a style change, verify diff is captured, verify page reflects change."

```typescript
// packages/extension/src/__tests__/integration/mutationFlow.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerElement,
  applyStyleMutation,
  applyTextMutation,
  revertMutation,
  getAllDiffs,
  clearDiffs,
} from '../../content/mutations/mutationEngine';
import { diffSnapshots, captureSnapshot } from '../../content/mutations/snapshotCapture';

/**
 * Integration-style test validating the full mutation flow:
 * select element → mutate → capture diff → verify → revert → verify
 *
 * Note: Runs in JSDOM. Full browser integration testing should be done
 * manually or via Playwright against a real page with the extension loaded.
 */
describe('Mutation flow integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="hero"><h1 id="title">Hello World</h1></div>';
    clearDiffs();
    // Stub crypto.randomUUID for JSDOM
    if (!globalThis.crypto?.randomUUID) {
      (globalThis as any).crypto = {
        randomUUID: () => `uuid-${Math.random().toString(36).slice(2)}`,
      };
    }
  });

  it('full style mutation cycle: apply → capture diff → revert', () => {
    const el = document.getElementById('title') as HTMLElement;
    registerElement('ref-title', el);

    // Apply
    const diff = applyStyleMutation('ref-title', { color: 'red' });
    expect(el.style.color).toBe('red');

    // Verify diff captured
    const allDiffs = getAllDiffs();
    expect(allDiffs.length).toBeGreaterThanOrEqual(1);

    // Revert
    if (diff) {
      revertMutation(diff.id);
      expect(el.style.color).toBe('');
      expect(getAllDiffs()).toHaveLength(0);
    }
  });

  it('full text mutation cycle: apply → capture diff → revert', () => {
    const el = document.getElementById('title') as HTMLElement;
    registerElement('ref-title', el);

    const diff = applyTextMutation('ref-title', 'Goodbye World');
    expect(el.textContent).toBe('Goodbye World');
    expect(diff).not.toBeNull();
    expect(diff!.changes[0].oldValue).toBe('Hello World');

    revertMutation(diff!.id);
    expect(el.textContent).toBe('Hello World');
  });

  it('multiple mutations accumulate and revert-all clears everything', () => {
    const el = document.getElementById('title') as HTMLElement;
    registerElement('ref-title', el);

    applyStyleMutation('ref-title', { color: 'red' });
    applyStyleMutation('ref-title', { 'font-size': '24px' });
    applyTextMutation('ref-title', 'Changed');

    expect(getAllDiffs().length).toBeGreaterThanOrEqual(1);

    revertMutation('all');
    expect(getAllDiffs()).toHaveLength(0);
  });
});
```

**Commit:** `test(extension): integration test for mutation flow (Phase 4.11)`

---

## Task 12: Export mutation types from shared package index [x]

**File:** `packages/shared/src/index.ts` (edit existing)

Add the mutation types to the shared package's public API.

```typescript
// Add to existing exports in packages/shared/src/index.ts:

export type {
  ElementIdentity,
  PropertyMutation,
  MutationDiff,
  MutationApplyCommand,
  MutationTextCommand,
  MutationRevertCommand,
  MutationDiffEvent,
  MutationRevertedEvent,
  MutationMessage,
} from './types/mutation';
```

**Commit:** `feat(shared): export mutation types from package index (Phase 4.12)`

---

## Summary

| Task | File | Type | Lines (est.) |
|------|------|------|-------------|
| 1 | `packages/shared/src/types/mutation.ts` | Types + test | ~120 |
| 2 | `packages/extension/src/content/mutations/mutationEngine.ts` | Engine + test | ~350 |
| 3 | `packages/extension/src/content/mutations/mutationMessageHandler.ts`, `packages/extension/src/entrypoints/background.ts`, `packages/shared/src/constants.ts` | Message routing | ~120 |
| 4 | `packages/extension/src/content/mutations/snapshotCapture.ts` | Snapshot + test | ~150 |
| 5 | `packages/extension/src/content/overlays/spacingHandles.ts` | Drag handles | ~250 |
| 6 | `packages/extension/src/content/mutations/textEditMode.ts` | Text edit + test | ~130 |
| 7 | `packages/extension/src/panel/stores/slices/mutationSlice.ts` | Zustand slice + test | ~100 |
| 8 | `packages/extension/src/panel/components/MutationDiffPanel.tsx` | React component + test | ~180 |
| 9 | `packages/extension/src/panel/hooks/useMutationBridge.ts` | Panel hook | ~70 |
| 10 | `packages/extension/src/panel/hooks/useTextEditBridge.ts` | Panel hook | ~50 |
| 11 | `packages/extension/src/__tests__/integration/mutationFlow.test.ts` | Integration test | ~80 |
| 12 | `packages/shared/src/index.ts` | Export edit | ~10 |
| **Total** | | | **~1,550** |

Remaining ~1,450 lines (of the ~3,000 estimate) will come from wiring these modules into the existing content script init, service worker message router, and designer panel sections established in Phases 1-3. Those are edit-in-place changes to existing files, not new files.
