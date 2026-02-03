# Phase 2: Inspection Pipeline

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Click any element on any page and see component name, source location (if React), computed styles grouped by category, and CSS custom properties in the DevTools panel.

**Architecture:** The agent script (page context, `world: 'MAIN'`) handles React fiber walking and CSS custom property reading since these require access to page globals. The content script (isolated world) handles computed style extraction, layout inference, and animation capture via standard DOM APIs. Data flows agent → content → service worker → DevTools panel through the message chain established in Phase 1.

**Tech Stack:** TypeScript, WXT, React 19, `__REACT_DEVTOOLS_GLOBAL_HOOK__`, `getComputedStyle`, `document.getAnimations()`, Web Animations API

---

## Assumes Phase 1 Complete

The following exist and work:

- `packages/extension/` — WXT Chrome extension with HMR
- `packages/shared/` — shared types and message schemas
- Content script with element picker + highlight overlay (Shadow DOM + Popover API)
- Agent script injected into `world: 'MAIN'` with verified page-context access
- Service worker with tabId-based message router
- DevTools panel: minimal React 19 app receiving messages from content script
- Full message chain: agent ↔ content ↔ service worker ↔ panel

---

## Task 0: Add Vitest test tooling (shared + extension)

**Files:**
- Modify `packages/shared/package.json`
- Add `packages/shared/vitest.config.ts`
- Modify `packages/extension/package.json`
- Add `packages/extension/vitest.config.ts`

### `packages/shared/package.json` (add test script + devDependency)

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  }
}
```

### `packages/shared/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

### `packages/extension/package.json` (add test scripts + devDependencies)

```json
{
  "scripts": {
    "dev": "wxt",
    "build": "wxt build",
    "zip": "wxt zip",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^3.0.0",
    "jsdom": "^25.0.0",
    "@testing-library/react": "^16.0.0"
  }
}
```

### `packages/extension/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
```

**Commit:** `chore(flow2): add vitest setup for shared and extension`

---

## Task 1: Shared types for inspection data

**File:** `packages/shared/src/types/inspection.ts`

Define the data structures that flow through the entire inspection pipeline.

```typescript
// packages/shared/src/types/inspection.ts

/** React component identity extracted from fiber */
export interface FiberData {
  /** Display name of the component (e.g. "Button", "HeroSection") */
  componentName: string;
  /** Component props (serializable subset) */
  props: Record<string, unknown>;
  /** Source location from _debugSource or captureOwnerStack */
  source: SourceLocation | null;
  /** Parent component chain, nearest first */
  hierarchy: HierarchyEntry[];
}

export interface SourceLocation {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
}

export interface HierarchyEntry {
  componentName: string;
  source: SourceLocation | null;
}

/** CSS custom property with tier classification */
export interface CustomProperty {
  name: string;
  value: string;
  tier: 'brand' | 'semantic' | 'unknown';
}

/** Computed style values grouped by the 9 designer categories */
export interface GroupedStyles {
  layout: StyleEntry[];
  spacing: StyleEntry[];
  size: StyleEntry[];
  typography: StyleEntry[];
  colors: StyleEntry[];
  borders: StyleEntry[];
  shadows: StyleEntry[];
  effects: StyleEntry[];
  animations: StyleEntry[];
}

export interface StyleEntry {
  property: string;
  value: string;
  /** The CSS custom property providing this value, if any */
  customProperty?: string;
}

/** Grid or flex layout structure */
export interface LayoutStructure {
  type: 'grid' | 'flex' | 'block' | 'inline' | 'none';
  /** Grid-specific */
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridGap?: string;
  /** Flex-specific */
  flexDirection?: string;
  flexWrap?: string;
  alignItems?: string;
  justifyContent?: string;
  gap?: string;
  /** Inferred column/row count */
  inferredColumns?: number;
  inferredRows?: number;
}

/** Animation state for a single animation */
export interface AnimationData {
  name: string;
  type: 'css-animation' | 'css-transition' | 'web-animation' | 'gsap';
  target: string;
  duration: number;
  delay: number;
  easing: string;
  playState: string;
  currentTime: number | null;
  keyframes: Record<string, string>[];
}

/** Full inspection result for a single element */
export interface InspectionResult {
  /** Unique selector for the element */
  selector: string;
  /** Tag name (e.g. "div", "button") */
  tagName: string;
  /** React fiber data, null if not a React app or element has no fiber */
  fiber: FiberData | null;
  /** Computed styles grouped by category */
  styles: GroupedStyles;
  /** CSS custom properties applied to this element */
  customProperties: CustomProperty[];
  /** Layout structure (grid/flex inference) */
  layout: LayoutStructure;
  /** Active animations on this element */
  animations: AnimationData[];
  /** Timestamp of extraction */
  timestamp: number;
}
```

**Test:** `pnpm --filter @flow/shared test` — verify types compile, write a simple type assertion test.

**Commit:** `feat(shared): add inspection pipeline types`

---

## Task 2: Shared message types for inspection

**File:** `packages/shared/src/messages.ts` (extend existing)

Add message types for the inspection pipeline to the existing message schema from Phase 1.

```typescript
// Add to packages/shared/src/messages.ts

import type {
  FiberData,
  CustomProperty,
  GroupedStyles,
  LayoutStructure,
  AnimationData,
  InspectionResult,
} from './types/inspection';

// Agent → Content messages (window.postMessage)
export interface AgentFiberResult {
  type: 'flow:agent:fiber-result';
  fiber: FiberData | null;
  customProperties: CustomProperty[];
}

// Content → Service Worker messages
export interface ContentInspectionResult {
  type: 'flow:content:inspection-result';
  tabId: number;
  result: InspectionResult;
}

// Content → Agent messages (window.postMessage)
export interface ContentRequestFiber {
  type: 'flow:content:request-fiber';
  /** Unique numeric ID assigned to the element by content script */
  elementIndex: number;
}

// Panel → Content messages (via service worker)
export interface PanelRequestInspection {
  type: 'flow:panel:request-inspection';
  /** CSS selector or element index */
  target: string | number;
}
```

**Commit:** `feat(shared): add inspection message types`

---

## Task 3: Agent script — React fiber tree walker

**File:** `packages/extension/src/agent/fiberWalker.ts`

Access `__REACT_DEVTOOLS_GLOBAL_HOOK__` to find the fiber node for a given DOM element. Extract component name, props, `_debugSource`. Walk parent chain for hierarchy. Handle non-React pages gracefully (return null).

```typescript
// packages/extension/src/agent/fiberWalker.ts

import type { FiberData, SourceLocation, HierarchyEntry } from '@flow/shared';

/**
 * Internal React fiber node shape (subset we care about).
 * React internals — not a public API. We access defensively.
 */
interface Fiber {
  tag: number;
  type: any;
  stateNode: any;
  return: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  memoizedProps: Record<string, unknown> | null;
  _debugSource?: {
    fileName: string;
    lineNumber: number;
    columnNumber?: number;
  };
  _debugOwner?: Fiber | null;
}

// React fiber tags for function/class components
const FUNCTION_COMPONENT = 0;
const CLASS_COMPONENT = 1;
const FORWARD_REF = 11;
const MEMO = 14;
const SIMPLE_MEMO = 15;

const COMPONENT_TAGS = new Set([
  FUNCTION_COMPONENT,
  CLASS_COMPONENT,
  FORWARD_REF,
  MEMO,
  SIMPLE_MEMO,
]);

/**
 * Get the React DevTools global hook if available.
 */
function getHook(): any | null {
  try {
    return (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ ?? null;
  } catch {
    return null;
  }
}

/**
 * Find the fiber node associated with a DOM element.
 * Searches all mounted React roots via the DevTools hook.
 */
export function findFiberForElement(element: Element): Fiber | null {
  const hook = getHook();
  if (!hook) return null;

  // Try the React internal key first (fastest path)
  const fiberKey = Object.keys(element).find(
    (key) =>
      key.startsWith('__reactFiber$') ||
      key.startsWith('__reactInternalInstance$')
  );
  if (fiberKey) {
    return (element as any)[fiberKey] as Fiber;
  }

  return null;
}

/**
 * Get the display name of a component from its fiber.
 */
function getComponentName(fiber: Fiber): string {
  if (!fiber.type) return 'Unknown';

  if (typeof fiber.type === 'string') return fiber.type;
  if (fiber.type.displayName) return fiber.type.displayName;
  if (fiber.type.name) return fiber.type.name;

  // ForwardRef
  if (fiber.type.render) {
    return fiber.type.render.displayName || fiber.type.render.name || 'ForwardRef';
  }

  // Memo
  if (fiber.type.type) {
    return getComponentName({ ...fiber, type: fiber.type.type });
  }

  return 'Anonymous';
}

/**
 * Extract source location from a fiber node.
 * Tries _debugSource first, then falls back to captureOwnerStack (React 19+).
 */
function extractSource(fiber: Fiber): SourceLocation | null {
  // Primary: _debugSource (injected by Babel/SWC transform)
  if (fiber._debugSource) {
    return {
      fileName: fiber._debugSource.fileName,
      lineNumber: fiber._debugSource.lineNumber,
      columnNumber: fiber._debugSource.columnNumber ?? 0,
    };
  }

  // Fallback: React 19 captureOwnerStack
  // This is only available during render. We parse the stack string.
  try {
    const React = (window as any).React;
    if (React?.captureOwnerStack) {
      const stack = React.captureOwnerStack();
      if (stack) {
        return parseOwnerStack(stack);
      }
    }
  } catch {
    // Not in a render context or React not available
  }

  return null;
}

/**
 * Parse React 19's captureOwnerStack() output.
 * Format: "    at ComponentName (file:line:column)"
 */
function parseOwnerStack(stack: string): SourceLocation | null {
  const lines = stack.split('\n').filter((l) => l.trim().startsWith('at '));
  if (lines.length === 0) return null;

  const match = lines[0].match(/at\s+\S+\s+\((.+):(\d+):(\d+)\)/);
  if (!match) return null;

  return {
    fileName: match[1],
    lineNumber: parseInt(match[2], 10),
    columnNumber: parseInt(match[3], 10),
  };
}

/**
 * Serialize props to a safe, JSON-serializable subset.
 * Strips functions, React elements, and circular references.
 */
function serializeProps(
  props: Record<string, unknown> | null
): Record<string, unknown> {
  if (!props) return {};

  const result: Record<string, unknown> = {};
  const MAX_PROPS = 20;
  let count = 0;

  for (const [key, value] of Object.entries(props)) {
    if (count >= MAX_PROPS) break;
    if (key === 'children') continue; // Skip children — too noisy

    const t = typeof value;
    if (t === 'string' || t === 'number' || t === 'boolean' || value === null) {
      result[key] = value;
      count++;
    } else if (t === 'function') {
      result[key] = '[function]';
      count++;
    } else if (Array.isArray(value)) {
      result[key] = `[Array(${value.length})]`;
      count++;
    } else if (t === 'object' && value !== null) {
      // Check for React element
      if ((value as any).$$typeof) {
        result[key] = '[ReactElement]';
      } else {
        try {
          result[key] = JSON.parse(JSON.stringify(value));
        } catch {
          result[key] = '[Object]';
        }
      }
      count++;
    }
  }

  return result;
}

/**
 * Walk the fiber parent chain to build component hierarchy.
 * Returns only component fibers (not host elements like div, span).
 */
function buildHierarchy(fiber: Fiber, maxDepth = 10): HierarchyEntry[] {
  const hierarchy: HierarchyEntry[] = [];
  let current = fiber.return;
  let depth = 0;

  while (current && depth < maxDepth) {
    if (COMPONENT_TAGS.has(current.tag)) {
      hierarchy.push({
        componentName: getComponentName(current),
        source: extractSource(current),
      });
      depth++;
    }
    current = current.return;
  }

  return hierarchy;
}

/**
 * Find the nearest component fiber at or above the given fiber.
 * Host fibers (div, span) don't have component names — walk up to find one.
 */
function findNearestComponentFiber(fiber: Fiber): Fiber | null {
  let current: Fiber | null = fiber;
  while (current) {
    if (COMPONENT_TAGS.has(current.tag)) return current;
    current = current.return;
  }
  return null;
}

/**
 * Main entry: extract full FiberData for a DOM element.
 * Returns null if the page is not a React app or the element has no fiber.
 */
export function extractFiberData(element: Element): FiberData | null {
  const fiber = findFiberForElement(element);
  if (!fiber) return null;

  const componentFiber = findNearestComponentFiber(fiber);
  if (!componentFiber) return null;

  return {
    componentName: getComponentName(componentFiber),
    props: serializeProps(componentFiber.memoizedProps),
    source: extractSource(componentFiber),
    hierarchy: buildHierarchy(componentFiber),
  };
}
```

**Test:** `packages/extension/src/agent/__tests__/fiberWalker.test.ts`

```typescript
// packages/extension/src/agent/__tests__/fiberWalker.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';

// We can't test against real React fiber in unit tests, but we can test
// the utility functions with mocked structures.

describe('fiberWalker', () => {
  beforeEach(() => {
    // Reset window globals
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;
  });

  it('returns null when no React hook is present', async () => {
    const { extractFiberData } = await import('../fiberWalker');
    const el = document.createElement('div');
    expect(extractFiberData(el)).toBeNull();
  });

  it('returns null when element has no fiber key', async () => {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = { renderers: new Map() };
    const { extractFiberData } = await import('../fiberWalker');
    const el = document.createElement('div');
    expect(extractFiberData(el)).toBeNull();
  });

  it('extracts component name from fiber with displayName', async () => {
    const { extractFiberData } = await import('../fiberWalker');

    const el = document.createElement('div');
    const mockFiber = {
      tag: 0, // FUNCTION_COMPONENT
      type: { displayName: 'MyButton', name: 'MyButton' },
      stateNode: null,
      return: null,
      child: null,
      sibling: null,
      memoizedProps: { variant: 'primary', disabled: false },
      _debugSource: {
        fileName: '/src/components/Button.tsx',
        lineNumber: 42,
        columnNumber: 5,
      },
    };
    (el as any).__reactFiber$abc123 = mockFiber;

    const result = extractFiberData(el);
    expect(result).not.toBeNull();
    expect(result!.componentName).toBe('MyButton');
    expect(result!.props).toEqual({ variant: 'primary', disabled: false });
    expect(result!.source).toEqual({
      fileName: '/src/components/Button.tsx',
      lineNumber: 42,
      columnNumber: 5,
    });
  });

  it('walks parent chain to build hierarchy', async () => {
    const { extractFiberData } = await import('../fiberWalker');

    const el = document.createElement('div');
    const grandparent = {
      tag: 0,
      type: { name: 'App' },
      stateNode: null,
      return: null,
      child: null,
      sibling: null,
      memoizedProps: {},
      _debugSource: { fileName: '/src/App.tsx', lineNumber: 10 },
    };
    const parent = {
      tag: 0,
      type: { name: 'HeroSection' },
      stateNode: null,
      return: grandparent,
      child: null,
      sibling: null,
      memoizedProps: {},
      _debugSource: { fileName: '/src/Hero.tsx', lineNumber: 5 },
    };
    const fiber = {
      tag: 0,
      type: { name: 'Button' },
      stateNode: null,
      return: parent,
      child: null,
      sibling: null,
      memoizedProps: { label: 'Click' },
      _debugSource: { fileName: '/src/Button.tsx', lineNumber: 20 },
    };
    (el as any).__reactFiber$abc123 = fiber;

    const result = extractFiberData(el);
    expect(result).not.toBeNull();
    expect(result!.componentName).toBe('Button');
    expect(result!.hierarchy).toHaveLength(2);
    expect(result!.hierarchy[0].componentName).toBe('HeroSection');
    expect(result!.hierarchy[1].componentName).toBe('App');
  });

  it('handles host fiber by walking up to nearest component', async () => {
    const { extractFiberData } = await import('../fiberWalker');

    const el = document.createElement('div');
    const componentFiber = {
      tag: 0,
      type: { name: 'Card' },
      stateNode: null,
      return: null,
      child: null,
      sibling: null,
      memoizedProps: { title: 'Hello' },
      _debugSource: { fileName: '/src/Card.tsx', lineNumber: 8 },
    };
    const hostFiber = {
      tag: 5, // HostComponent (div, span, etc.)
      type: 'div',
      stateNode: el,
      return: componentFiber,
      child: null,
      sibling: null,
      memoizedProps: { className: 'card' },
    };
    (el as any).__reactFiber$abc123 = hostFiber;

    const result = extractFiberData(el);
    expect(result).not.toBeNull();
    expect(result!.componentName).toBe('Card');
  });
});
```

**Commit:** `feat(agent): React fiber tree walker with hierarchy extraction`

---

## Task 4: Agent script — CSS custom property reading

**File:** `packages/extension/src/agent/customProperties.ts`

Read all CSS custom properties from a DOM element's computed style. Classify each as brand tier, semantic tier, or unknown based on DNA naming conventions.

```typescript
// packages/extension/src/agent/customProperties.ts

import type { CustomProperty } from '@flow/shared';

/**
 * DNA token naming convention patterns:
 * - Brand (Tier 1): --color-{name} (raw palette, e.g. --color-sun-yellow)
 * - Semantic (Tier 2): --color-{purpose}-{variant} (e.g. --color-surface-primary)
 *
 * Semantic purposes: surface, content, edge, accent, status
 * If it matches a semantic purpose pattern, it's semantic. Otherwise brand.
 */
const SEMANTIC_PURPOSES = [
  'surface',
  'content',
  'edge',
  'accent',
  'status',
  'interactive',
  'focus',
  'disabled',
];

const SEMANTIC_PATTERN = new RegExp(
  `^--(?:color|spacing|size|radius|shadow|font|motion)-(?:${SEMANTIC_PURPOSES.join('|')})`
);

/**
 * Classify a custom property name into brand or semantic tier.
 */
export function classifyTier(name: string): 'brand' | 'semantic' | 'unknown' {
  if (SEMANTIC_PATTERN.test(name)) return 'semantic';

  // Brand tokens use raw descriptive names like --color-sun-yellow, --color-midnight
  if (name.startsWith('--color-') || name.startsWith('--spacing-') ||
      name.startsWith('--size-') || name.startsWith('--radius-') ||
      name.startsWith('--shadow-') || name.startsWith('--font-') ||
      name.startsWith('--motion-')) {
    return 'brand';
  }

  return 'unknown';
}

/**
 * Extract all CSS custom properties (--*) from an element's computed style.
 *
 * Note: getComputedStyle does not directly list custom properties.
 * We must walk all stylesheets to find which custom properties apply,
 * then read their computed values.
 */
export function extractCustomProperties(element: Element): CustomProperty[] {
  const properties: CustomProperty[] = [];
  const seen = new Set<string>();
  const computedStyle = getComputedStyle(element);

  // Strategy 1: Walk all stylesheets to find custom property names
  const customPropNames = collectCustomPropertyNames();

  // Strategy 2: Also check inline style
  const inlineStyle = (element as HTMLElement).style;
  if (inlineStyle) {
    for (let i = 0; i < inlineStyle.length; i++) {
      const prop = inlineStyle[i];
      if (prop.startsWith('--')) {
        customPropNames.add(prop);
      }
    }
  }

  // Read computed values for all discovered custom properties
  for (const name of customPropNames) {
    if (seen.has(name)) continue;
    seen.add(name);

    const value = computedStyle.getPropertyValue(name).trim();
    if (value) {
      properties.push({
        name,
        value,
        tier: classifyTier(name),
      });
    }
  }

  // Sort: semantic first, then brand, then unknown
  const tierOrder = { semantic: 0, brand: 1, unknown: 2 };
  properties.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);

  return properties;
}

/**
 * Collect all custom property names defined across all stylesheets.
 * Cached per call to avoid redundant walks.
 */
function collectCustomPropertyNames(): Set<string> {
  const names = new Set<string>();

  try {
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules;
        for (let i = 0; i < rules.length; i++) {
          extractPropsFromRule(rules[i], names);
        }
      } catch {
        // Cross-origin stylesheets throw SecurityError — skip
      }
    }
  } catch {
    // document.styleSheets not accessible
  }

  return names;
}

function extractPropsFromRule(rule: CSSRule, names: Set<string>): void {
  if (rule instanceof CSSStyleRule) {
    const style = rule.style;
    for (let i = 0; i < style.length; i++) {
      const prop = style[i];
      if (prop.startsWith('--')) {
        names.add(prop);
      }
    }
  } else if (
    rule instanceof CSSMediaRule ||
    rule instanceof CSSSupportsRule ||
    rule instanceof CSSLayerBlockRule
  ) {
    for (let i = 0; i < rule.cssRules.length; i++) {
      extractPropsFromRule(rule.cssRules[i], names);
    }
  }
}
```

**Test:** `packages/extension/src/agent/__tests__/customProperties.test.ts`

```typescript
// packages/extension/src/agent/__tests__/customProperties.test.ts

import { describe, it, expect } from 'vitest';
import { classifyTier } from '../customProperties';

describe('classifyTier', () => {
  it('classifies semantic surface tokens', () => {
    expect(classifyTier('--color-surface-primary')).toBe('semantic');
    expect(classifyTier('--color-surface-secondary')).toBe('semantic');
  });

  it('classifies semantic content tokens', () => {
    expect(classifyTier('--color-content-primary')).toBe('semantic');
    expect(classifyTier('--color-content-inverted')).toBe('semantic');
  });

  it('classifies semantic edge tokens', () => {
    expect(classifyTier('--color-edge-primary')).toBe('semantic');
  });

  it('classifies brand tokens', () => {
    expect(classifyTier('--color-sun-yellow')).toBe('brand');
    expect(classifyTier('--color-midnight')).toBe('brand');
    expect(classifyTier('--spacing-base')).toBe('brand');
  });

  it('classifies unknown tokens', () => {
    expect(classifyTier('--my-custom-thing')).toBe('unknown');
    expect(classifyTier('--z-index-modal')).toBe('unknown');
  });
});
```

**Commit:** `feat(agent): CSS custom property extraction with tier classification`

---

## Task 5: Agent script — main entry point and message handler

**File:** `packages/extension/src/agent/index.ts`

Wire the fiber walker and custom property reader to respond to content script messages via `window.postMessage`.

```typescript
// packages/extension/src/agent/index.ts

import { extractFiberData } from './fiberWalker';
import { extractCustomProperties } from './customProperties';
import type { AgentFiberResult, ContentRequestFiber } from '@flow/shared';

const FLOW_ORIGIN = 'flow:content:';

/**
 * Element registry: content script assigns numeric indices to elements
 * via a data attribute, and we look them up here.
 */
function findElementByIndex(index: number): Element | null {
  return document.querySelector(`[data-flow-index="${index}"]`) ?? null;
}

/**
 * Handle incoming messages from the content script.
 */
function handleMessage(event: MessageEvent): void {
  // Only accept messages from the same window (content script)
  if (event.source !== window) return;

  const data = event.data;
  if (!data || typeof data.type !== 'string') return;
  if (!data.type.startsWith(FLOW_ORIGIN)) return;

  switch (data.type) {
    case 'flow:content:request-fiber': {
      const msg = data as ContentRequestFiber;
      const element = findElementByIndex(msg.elementIndex);
      if (!element) {
        postResult({ fiber: null, customProperties: [] });
        return;
      }

      const fiber = extractFiberData(element);
      const customProperties = extractCustomProperties(element);

      postResult({ fiber, customProperties });
      break;
    }
  }
}

function postResult(
  payload: Omit<AgentFiberResult, 'type'>
): void {
  const message: AgentFiberResult = {
    type: 'flow:agent:fiber-result',
    ...payload,
  };
  window.postMessage(message, '*');
}

// Listen for content script messages
window.addEventListener('message', handleMessage);

// Signal that the agent is ready
window.postMessage({ type: 'flow:agent:ready' }, '*');
```

**Commit:** `feat(agent): wire fiber walker and custom properties to message handler`

---

## Task 6: Content script — computed style extraction by 9 categories

**File:** `packages/extension/src/content/styleExtractor.ts`

Extract computed styles from a DOM element, grouped into the 9 designer categories defined in spec section 7.5.

```typescript
// packages/extension/src/content/styleExtractor.ts

import type { GroupedStyles, StyleEntry } from '@flow/shared';

/** Properties per category, matching spec §7.5 */
const STYLE_CATEGORIES: Record<keyof GroupedStyles, string[]> = {
  layout: [
    'display',
    'position',
    'top', 'right', 'bottom', 'left',
    'z-index',
    'float',
    'clear',
    'flex-direction', 'flex-wrap', 'flex-flow',
    'align-items', 'align-content', 'align-self',
    'justify-content', 'justify-items', 'justify-self',
    'place-items', 'place-content', 'place-self',
    'grid-template-columns', 'grid-template-rows', 'grid-template-areas',
    'grid-auto-columns', 'grid-auto-rows', 'grid-auto-flow',
    'grid-column', 'grid-row', 'grid-area',
    'order',
    'overflow', 'overflow-x', 'overflow-y',
  ],
  spacing: [
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'gap', 'row-gap', 'column-gap',
  ],
  size: [
    'width', 'height',
    'min-width', 'min-height',
    'max-width', 'max-height',
    'aspect-ratio',
    'box-sizing',
    'flex-basis', 'flex-grow', 'flex-shrink',
  ],
  typography: [
    'font-family', 'font-size', 'font-weight', 'font-style',
    'font-variant', 'font-stretch',
    'line-height', 'letter-spacing', 'word-spacing',
    'text-align', 'text-decoration', 'text-transform',
    'text-indent', 'text-overflow', 'text-wrap',
    'white-space', 'word-break', 'overflow-wrap',
    'vertical-align',
    '-webkit-line-clamp',
  ],
  colors: [
    'color',
    'background', 'background-color', 'background-image', 'background-gradient',
    'caret-color',
    'accent-color',
    'outline-color',
  ],
  borders: [
    'border', 'border-width', 'border-style', 'border-color',
    'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'border-radius',
    'border-top-left-radius', 'border-top-right-radius',
    'border-bottom-left-radius', 'border-bottom-right-radius',
    'outline', 'outline-width', 'outline-style', 'outline-offset',
  ],
  shadows: [
    'box-shadow',
    'text-shadow',
  ],
  effects: [
    'opacity',
    'visibility',
    'filter',
    'backdrop-filter',
    'mix-blend-mode',
    'isolation',
    'clip-path',
    'mask',
    'transform',
    'transform-origin',
    'perspective',
    'will-change',
    'contain',
    'pointer-events',
    'cursor',
  ],
  animations: [
    'transition', 'transition-property', 'transition-duration',
    'transition-timing-function', 'transition-delay',
    'animation', 'animation-name', 'animation-duration',
    'animation-timing-function', 'animation-delay',
    'animation-iteration-count', 'animation-direction',
    'animation-fill-mode', 'animation-play-state',
  ],
};

/**
 * Default/empty values to filter out for cleaner output.
 */
const SKIP_VALUES = new Set([
  'none', 'normal', 'auto', 'visible', '0px', '0s', 'static',
  'start', 'baseline', 'stretch', 'row', 'content-box',
  'running', '1', 'ltr', 'separate',
]);

/**
 * Extract computed styles for an element, grouped by category.
 * Filters out default/empty values to reduce noise.
 */
export function extractGroupedStyles(element: Element): GroupedStyles {
  const computed = getComputedStyle(element);
  const result: GroupedStyles = {
    layout: [],
    spacing: [],
    size: [],
    typography: [],
    colors: [],
    borders: [],
    shadows: [],
    effects: [],
    animations: [],
  };

  for (const [category, properties] of Object.entries(STYLE_CATEGORIES)) {
    const entries: StyleEntry[] = [];

    for (const prop of properties) {
      const value = computed.getPropertyValue(prop).trim();
      if (!value || SKIP_VALUES.has(value)) continue;

      entries.push({ property: prop, value });
    }

    result[category as keyof GroupedStyles] = entries;
  }

  return result;
}
```

**Test:** `packages/extension/src/content/__tests__/styleExtractor.test.ts`

```typescript
// packages/extension/src/content/__tests__/styleExtractor.test.ts

import { describe, it, expect } from 'vitest';
import { extractGroupedStyles } from '../styleExtractor';

describe('extractGroupedStyles', () => {
  it('groups styles into 9 categories', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.display = 'flex';
    el.style.padding = '16px';
    el.style.fontSize = '14px';
    el.style.color = 'red';
    el.style.borderRadius = '8px';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    el.style.opacity = '0.5';

    const result = extractGroupedStyles(el);

    expect(result.layout.some((e) => e.property === 'display')).toBe(true);
    expect(result.typography.some((e) => e.property === 'font-size')).toBe(true);
    expect(result.colors.some((e) => e.property === 'color')).toBe(true);
    expect(result.shadows.some((e) => e.property === 'box-shadow')).toBe(true);
    expect(result.effects.some((e) => e.property === 'opacity')).toBe(true);

    document.body.removeChild(el);
  });

  it('filters out default values', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const result = extractGroupedStyles(el);

    // Default div should have very few non-default entries
    const totalEntries = Object.values(result).flat().length;
    expect(totalEntries).toBeLessThan(10);

    document.body.removeChild(el);
  });
});
```

**Commit:** `feat(content): computed style extraction grouped by 9 categories`

---

## Task 7: Content script — grid/flex structure inference

**File:** `packages/extension/src/content/layoutInference.ts`

Infer grid and flex layout structure from computed styles. Per spec section 5.4 steps 4-5.

```typescript
// packages/extension/src/content/layoutInference.ts

import type { LayoutStructure } from '@flow/shared';

/**
 * Infer the layout structure of an element from its computed styles.
 */
export function inferLayoutStructure(element: Element): LayoutStructure {
  const computed = getComputedStyle(element);
  const display = computed.display;

  if (display.includes('grid')) {
    return inferGrid(element, computed);
  }

  if (display.includes('flex')) {
    return inferFlex(computed);
  }

  if (display === 'inline' || display === 'inline-block') {
    return { type: 'inline' };
  }

  if (display === 'none') {
    return { type: 'none' };
  }

  return { type: 'block' };
}

function inferGrid(element: Element, computed: CSSStyleDeclaration): LayoutStructure {
  const templateCols = computed.gridTemplateColumns;
  const templateRows = computed.gridTemplateRows;
  const gap = computed.gap;

  // Infer column count from template
  let inferredColumns: number | undefined;
  if (templateCols && templateCols !== 'none') {
    // Count space-separated values (each is a track)
    inferredColumns = templateCols.split(/\s+/).length;
  }

  // Infer row count from template or children
  let inferredRows: number | undefined;
  if (templateRows && templateRows !== 'none') {
    inferredRows = templateRows.split(/\s+/).length;
  } else if (inferredColumns) {
    const childCount = element.children.length;
    inferredRows = Math.ceil(childCount / inferredColumns);
  }

  return {
    type: 'grid',
    gridTemplateColumns: templateCols !== 'none' ? templateCols : undefined,
    gridTemplateRows: templateRows !== 'none' ? templateRows : undefined,
    gridGap: gap !== 'normal' && gap !== '0px' ? gap : undefined,
    inferredColumns,
    inferredRows,
  };
}

function inferFlex(computed: CSSStyleDeclaration): LayoutStructure {
  return {
    type: 'flex',
    flexDirection: computed.flexDirection,
    flexWrap: computed.flexWrap !== 'nowrap' ? computed.flexWrap : undefined,
    alignItems: computed.alignItems !== 'normal' ? computed.alignItems : undefined,
    justifyContent: computed.justifyContent !== 'normal' ? computed.justifyContent : undefined,
    gap: computed.gap !== 'normal' && computed.gap !== '0px' ? computed.gap : undefined,
  };
}
```

**Test:** `packages/extension/src/content/__tests__/layoutInference.test.ts`

```typescript
// packages/extension/src/content/__tests__/layoutInference.test.ts

import { describe, it, expect } from 'vitest';
import { inferLayoutStructure } from '../layoutInference';

describe('inferLayoutStructure', () => {
  it('detects flex layout', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.gap = '16px';

    const result = inferLayoutStructure(el);
    expect(result.type).toBe('flex');
    expect(result.flexDirection).toBe('column');
    expect(result.gap).toBe('16px');

    document.body.removeChild(el);
  });

  it('detects grid layout with columns', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.display = 'grid';
    el.style.gridTemplateColumns = '1fr 1fr 1fr';

    // Add children for row inference
    for (let i = 0; i < 6; i++) {
      el.appendChild(document.createElement('div'));
    }

    const result = inferLayoutStructure(el);
    expect(result.type).toBe('grid');
    expect(result.inferredColumns).toBe(3);
    expect(result.inferredRows).toBe(2);

    document.body.removeChild(el);
  });

  it('returns block for normal div', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const result = inferLayoutStructure(el);
    expect(result.type).toBe('block');

    document.body.removeChild(el);
  });
});
```

**Commit:** `feat(content): grid/flex structure inference`

---

## Task 8: Content script — animation state capture

**File:** `packages/extension/src/content/animationCapture.ts`

Capture active animations on an element using Web Animations API, CSS transitions, and GSAP detection. Per spec section 8.1.

```typescript
// packages/extension/src/content/animationCapture.ts

import type { AnimationData } from '@flow/shared';

/**
 * Build a CSS selector string for an element (best effort).
 */
function selectorFor(el: Element): string {
  if (el.id) return `#${el.id}`;
  if (el.className && typeof el.className === 'string') {
    const classes = el.className.trim().split(/\s+/).slice(0, 2).join('.');
    if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
  }
  return el.tagName.toLowerCase();
}

/**
 * Capture all active animations on an element.
 */
export function captureAnimations(element: Element): AnimationData[] {
  const animations: AnimationData[] = [];
  const selector = selectorFor(element);

  // 1. Web Animations API (covers CSS animations and WAAPI)
  try {
    const webAnimations = element.getAnimations({ subtree: false });
    for (const anim of webAnimations) {
      const timing = anim.effect?.getComputedTiming();
      const keyframes = (anim.effect as KeyframeEffect)?.getKeyframes?.() ?? [];

      const isCSSAnimation = anim instanceof CSSAnimation;
      const isCSSTransition = anim instanceof CSSTransition;

      animations.push({
        name: isCSSAnimation
          ? (anim as CSSAnimation).animationName
          : isCSSTransition
            ? (anim as CSSTransition).transitionProperty
            : anim.id || 'anonymous',
        type: isCSSAnimation
          ? 'css-animation'
          : isCSSTransition
            ? 'css-transition'
            : 'web-animation',
        target: selector,
        duration: (timing?.duration as number) ?? 0,
        delay: timing?.delay ?? 0,
        easing: (timing as any)?.easing ?? 'linear',
        playState: anim.playState,
        currentTime: anim.currentTime as number | null,
        keyframes: keyframes.map((kf) => {
          const entry: Record<string, string> = {};
          for (const [key, val] of Object.entries(kf)) {
            if (
              key !== 'offset' &&
              key !== 'computedOffset' &&
              key !== 'easing' &&
              key !== 'composite' &&
              val !== undefined &&
              val !== null
            ) {
              entry[key] = String(val);
            }
          }
          return entry;
        }),
      });
    }
  } catch {
    // getAnimations not supported or errored
  }

  // 2. CSS transition properties (for elements not currently transitioning but configured)
  try {
    const computed = getComputedStyle(element);
    const transitionProp = computed.transitionProperty;
    const transitionDur = computed.transitionDuration;

    if (transitionProp && transitionProp !== 'none' && transitionProp !== 'all') {
      const props = transitionProp.split(',').map((s) => s.trim());
      const durs = transitionDur.split(',').map((s) => parseFloat(s) * 1000);
      const easings = computed.transitionTimingFunction.split(',').map((s) => s.trim());
      const delays = computed.transitionDelay.split(',').map((s) => parseFloat(s) * 1000);

      for (let i = 0; i < props.length; i++) {
        // Skip if already captured by getAnimations
        if (animations.some((a) => a.type === 'css-transition' && a.name === props[i])) {
          continue;
        }

        const dur = durs[i % durs.length];
        if (dur <= 0) continue;

        animations.push({
          name: props[i],
          type: 'css-transition',
          target: selector,
          duration: dur,
          delay: delays[i % delays.length] || 0,
          easing: easings[i % easings.length] || 'ease',
          playState: 'configured', // Not actively running
          currentTime: null,
          keyframes: [],
        });
      }
    }
  } catch {
    // Style reading failed
  }

  // 3. GSAP detection (via window.gsap or window.__FLOW_GSAP__)
  try {
    const gsap = (window as any).gsap || (window as any).__FLOW_GSAP__;
    if (gsap?.globalTimeline) {
      const tweens = gsap.globalTimeline.getChildren(true, true, false);
      for (const tween of tweens) {
        const targets = tween.targets?.() ?? [];
        if (!targets.includes(element)) continue;

        const vars = tween.vars ?? {};
        animations.push({
          name: vars.id || 'gsap-tween',
          type: 'gsap',
          target: selector,
          duration: (tween.duration?.() ?? 0) * 1000,
          delay: (tween.delay?.() ?? 0) * 1000,
          easing: vars.ease || 'power1.out',
          playState: tween.isActive?.() ? 'running' : 'paused',
          currentTime: (tween.time?.() ?? 0) * 1000,
          keyframes: [],
        });
      }
    }
  } catch {
    // GSAP not available
  }

  return animations;
}
```

**Commit:** `feat(content): animation state capture (Web Animations, CSS transitions, GSAP)`

---

## Task 9: Content script — inspection orchestrator

**File:** `packages/extension/src/content/inspector.ts`

Orchestrate the full inspection pipeline for a clicked element. Coordinate between the content script's own extractors and the agent script via `window.postMessage`.

```typescript
// packages/extension/src/content/inspector.ts

import type {
  InspectionResult,
  FiberData,
  CustomProperty,
  AgentFiberResult,
} from '@flow/shared';
import { extractGroupedStyles } from './styleExtractor';
import { inferLayoutStructure } from './layoutInference';
import { captureAnimations } from './animationCapture';

let elementCounter = 0;

/**
 * Generate a best-effort CSS selector for the element.
 */
function buildSelector(element: Element): string {
  if (element.id) return `#${element.id}`;

  const parts: string[] = [];
  let el: Element | null = element;
  let depth = 0;

  while (el && depth < 3) {
    let part = el.tagName.toLowerCase();
    if (el.id) {
      part = `#${el.id}`;
      parts.unshift(part);
      break;
    }
    if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\s+/)[0];
      if (cls) part += `.${cls}`;
    }
    parts.unshift(part);
    el = el.parentElement;
    depth++;
  }

  return parts.join(' > ');
}

/**
 * Request fiber data from the agent script.
 * Returns a promise that resolves when the agent responds, with a timeout.
 */
function requestFiberData(
  element: Element
): Promise<{ fiber: FiberData | null; customProperties: CustomProperty[] }> {
  return new Promise((resolve) => {
    const index = ++elementCounter;
    (element as HTMLElement).dataset.flowIndex = String(index);

    const timeout = setTimeout(() => {
      cleanup();
      resolve({ fiber: null, customProperties: [] });
    }, 500); // 500ms timeout — agent should respond fast

    function handler(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.type !== 'flow:agent:fiber-result') return;

      cleanup();
      const data = event.data as AgentFiberResult;
      resolve({
        fiber: data.fiber,
        customProperties: data.customProperties,
      });
    }

    function cleanup() {
      clearTimeout(timeout);
      window.removeEventListener('message', handler);
      delete (element as HTMLElement).dataset.flowIndex;
    }

    window.addEventListener('message', handler);
    window.postMessage(
      { type: 'flow:content:request-fiber', elementIndex: index },
      '*'
    );
  });
}

/**
 * Full inspection of an element: gather fiber data (via agent),
 * computed styles, layout structure, and animations.
 */
export async function inspectElement(
  element: Element
): Promise<InspectionResult> {
  // Run agent request and content-side extraction in parallel
  const [agentData, styles, layout, animations] = await Promise.all([
    requestFiberData(element),
    Promise.resolve(extractGroupedStyles(element)),
    Promise.resolve(inferLayoutStructure(element)),
    Promise.resolve(captureAnimations(element)),
  ]);

  return {
    selector: buildSelector(element),
    tagName: element.tagName.toLowerCase(),
    fiber: agentData.fiber,
    styles,
    customProperties: agentData.customProperties,
    layout,
    animations,
    timestamp: Date.now(),
  };
}
```

**Commit:** `feat(content): inspection orchestrator coordinating agent and content extractors`

---

## Task 10: Content script — wire click handler to inspection pipeline

**File:** `packages/extension/src/entrypoints/content.ts` (extend existing from Phase 1)

Integrate the inspection orchestrator with the element picker from Phase 1. When the user clicks an element, run full inspection and send results to the service worker.

```typescript
// Add to packages/extension/src/entrypoints/content.ts
// (extend the existing content script from Phase 1)

import { inspectElement } from '../content/inspector';
import type { ContentInspectionResult } from '@flow/shared';

/**
 * Called when the user clicks an element in select mode.
 * Runs the full inspection pipeline and sends results to the panel.
 */
async function onElementSelected(element: Element): Promise<void> {
  try {
    const result = await inspectElement(element);

    // Send to service worker → DevTools panel
    const message: ContentInspectionResult = {
      type: 'flow:content:inspection-result',
      tabId: 0, // Service worker fills in the real tabId
      result,
    };

    chrome.runtime.sendMessage(message);
  } catch (error) {
    console.error('[Flow] Inspection failed:', error);
  }
}

// Hook into the element picker from Phase 1.
// Phase 1 should expose a way to register a selection callback.
// Example integration point:
//
//   elementPicker.onSelect = onElementSelected;
//
// The exact integration depends on Phase 1's element picker API.
// This function is exported for the picker to call.
export { onElementSelected };
```

**Commit:** `feat(content): wire element click to inspection pipeline`

---

## Task 11: DevTools panel — inspection results display

**File:** `packages/extension/src/panel/components/InspectionPanel.tsx`

Display the full inspection result in the DevTools panel: component name + hierarchy, source file:line, styles by category, custom properties with tier labels, animation state.

```tsx
// packages/extension/src/panel/components/InspectionPanel.tsx

import { useState, useEffect } from 'react';
import type {
  InspectionResult,
  GroupedStyles,
  CustomProperty,
  AnimationData,
  HierarchyEntry,
} from '@flow/shared';

export function InspectionPanel() {
  const [result, setResult] = useState<InspectionResult | null>(null);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'flow-panel' });

    port.onMessage.addListener((msg: any) => {
      if (msg.type === 'flow:content:inspection-result') {
        setResult(msg.result);
      }
    });

    return () => port.disconnect();
  }, []);

  if (!result) {
    return (
      <div className="p-4 text-content-secondary text-sm">
        Click an element on the page to inspect it.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3 text-sm overflow-y-auto h-full">
      {/* Element identity */}
      <section>
        <SectionHeader>Element</SectionHeader>
        <div className="font-mono text-xs text-content-secondary">
          &lt;{result.tagName}&gt; — {result.selector}
        </div>
      </section>

      {/* React component info */}
      {result.fiber && (
        <section>
          <SectionHeader>Component</SectionHeader>
          <ComponentInfo fiber={result.fiber} />
        </section>
      )}

      {/* Custom properties */}
      {result.customProperties.length > 0 && (
        <section>
          <SectionHeader>
            Custom Properties ({result.customProperties.length})
          </SectionHeader>
          <CustomPropertiesList properties={result.customProperties} />
        </section>
      )}

      {/* Layout structure */}
      {result.layout.type !== 'block' && result.layout.type !== 'none' && (
        <section>
          <SectionHeader>Layout: {result.layout.type}</SectionHeader>
          <LayoutInfo layout={result.layout} />
        </section>
      )}

      {/* Grouped styles */}
      <StyleCategories styles={result.styles} />

      {/* Animations */}
      {result.animations.length > 0 && (
        <section>
          <SectionHeader>
            Animations ({result.animations.length})
          </SectionHeader>
          <AnimationsList animations={result.animations} />
        </section>
      )}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-content-primary uppercase tracking-wide mb-1">
      {children}
    </h3>
  );
}

function ComponentInfo({ fiber }: { fiber: NonNullable<InspectionResult['fiber']> }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-semibold text-content-primary">
        {fiber.componentName}
      </div>

      {fiber.source && (
        <div className="font-mono text-xs text-content-secondary">
          {fiber.source.fileName}:{fiber.source.lineNumber}
          {fiber.source.columnNumber ? `:${fiber.source.columnNumber}` : ''}
        </div>
      )}

      {/* Props */}
      {Object.keys(fiber.props).length > 0 && (
        <div className="mt-1">
          <span className="text-xs text-content-secondary">Props:</span>
          <div className="font-mono text-xs ml-2">
            {Object.entries(fiber.props).map(([key, val]) => (
              <div key={key}>
                <span className="text-content-secondary">{key}</span>
                <span className="text-content-primary">={JSON.stringify(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hierarchy */}
      {fiber.hierarchy.length > 0 && (
        <div className="mt-1">
          <span className="text-xs text-content-secondary">Hierarchy:</span>
          <div className="font-mono text-xs ml-2">
            {fiber.hierarchy.map((entry: HierarchyEntry, i: number) => (
              <div key={i} className="text-content-secondary">
                {'  '.repeat(i)}&lt;{entry.componentName}&gt;
                {entry.source && (
                  <span className="ml-1 opacity-60">
                    {entry.source.fileName.split('/').pop()}:{entry.source.lineNumber}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomPropertiesList({ properties }: { properties: CustomProperty[] }) {
  const tierColors: Record<string, string> = {
    semantic: 'text-green-400',
    brand: 'text-blue-400',
    unknown: 'text-content-secondary',
  };

  return (
    <div className="font-mono text-xs flex flex-col gap-0.5">
      {properties.map((prop) => (
        <div key={prop.name} className="flex items-center gap-2">
          <span className={`text-[10px] uppercase ${tierColors[prop.tier]}`}>
            {prop.tier === 'unknown' ? '' : prop.tier}
          </span>
          <span className="text-content-secondary">{prop.name}:</span>
          <span className="text-content-primary">{prop.value}</span>
        </div>
      ))}
    </div>
  );
}

function LayoutInfo({ layout }: { layout: InspectionResult['layout'] }) {
  return (
    <div className="font-mono text-xs flex flex-col gap-0.5">
      {layout.type === 'grid' && (
        <>
          {layout.gridTemplateColumns && (
            <div>
              <span className="text-content-secondary">columns:</span>{' '}
              {layout.gridTemplateColumns}
            </div>
          )}
          {layout.gridTemplateRows && (
            <div>
              <span className="text-content-secondary">rows:</span>{' '}
              {layout.gridTemplateRows}
            </div>
          )}
          {layout.inferredColumns && (
            <div>
              <span className="text-content-secondary">inferred:</span>{' '}
              {layout.inferredColumns} cols x {layout.inferredRows ?? '?'} rows
            </div>
          )}
          {layout.gridGap && (
            <div>
              <span className="text-content-secondary">gap:</span>{' '}
              {layout.gridGap}
            </div>
          )}
        </>
      )}
      {layout.type === 'flex' && (
        <>
          {layout.flexDirection && (
            <div>
              <span className="text-content-secondary">direction:</span>{' '}
              {layout.flexDirection}
            </div>
          )}
          {layout.alignItems && (
            <div>
              <span className="text-content-secondary">align:</span>{' '}
              {layout.alignItems}
            </div>
          )}
          {layout.justifyContent && (
            <div>
              <span className="text-content-secondary">justify:</span>{' '}
              {layout.justifyContent}
            </div>
          )}
          {layout.gap && (
            <div>
              <span className="text-content-secondary">gap:</span>{' '}
              {layout.gap}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const CATEGORY_LABELS: Record<keyof GroupedStyles, string> = {
  layout: 'Layout',
  spacing: 'Spacing',
  size: 'Size',
  typography: 'Typography',
  colors: 'Colors',
  borders: 'Borders',
  shadows: 'Shadows',
  effects: 'Effects',
  animations: 'Animations',
};

function StyleCategories({ styles }: { styles: GroupedStyles }) {
  const nonEmpty = (Object.entries(styles) as [keyof GroupedStyles, any][]).filter(
    ([, entries]) => entries.length > 0
  );

  if (nonEmpty.length === 0) return null;

  return (
    <>
      {nonEmpty.map(([category, entries]) => (
        <section key={category}>
          <SectionHeader>{CATEGORY_LABELS[category]}</SectionHeader>
          <div className="font-mono text-xs flex flex-col gap-0.5">
            {entries.map((entry: any) => (
              <div key={entry.property}>
                <span className="text-content-secondary">{entry.property}:</span>{' '}
                <span className="text-content-primary">{entry.value}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function AnimationsList({ animations }: { animations: AnimationData[] }) {
  return (
    <div className="flex flex-col gap-2">
      {animations.map((anim, i) => (
        <div key={i} className="font-mono text-xs flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase text-content-secondary">
              {anim.type}
            </span>
            <span className="text-content-primary font-semibold">{anim.name}</span>
            <span className="text-content-secondary">
              {anim.duration}ms
              {anim.delay ? ` +${anim.delay}ms delay` : ''}
            </span>
          </div>
          <div className="text-content-secondary">
            {anim.easing} | {anim.playState}
            {anim.currentTime !== null && ` @ ${anim.currentTime.toFixed(0)}ms`}
          </div>
          {anim.keyframes.length > 0 && (
            <div className="ml-2">
              {anim.keyframes.map((kf, j) => (
                <div key={j} className="text-content-secondary">
                  {Object.entries(kf).map(([prop, val]) => (
                    <span key={prop} className="mr-2">
                      {prop}: {val}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Commit:** `feat(panel): inspection results display with component, styles, properties, animations`

---

## Task 12: Service worker — route inspection messages to panel

**File:** `packages/extension/src/background/index.ts` (extend existing from Phase 1)

Add routing for inspection result messages from content script to the connected DevTools panel.

```typescript
// Add to packages/extension/src/background/index.ts
// (extend the existing service worker from Phase 1)

// Map of tabId -> panel port (established in Phase 1)
// Phase 1 should have: const panelPorts = new Map<number, chrome.runtime.Port>();

// Handle inspection result messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'flow:content:inspection-result' && sender.tab?.id) {
    const tabId = sender.tab.id;
    const panelPort = panelPorts.get(tabId);

    if (panelPort) {
      // Forward to the DevTools panel with the real tabId
      panelPort.postMessage({
        ...message,
        tabId,
      });
    }
  }

  // Return false to indicate we won't call sendResponse asynchronously
  return false;
});
```

**Commit:** `feat(background): route inspection results from content to panel`

---

## Task 13: Integration test — end-to-end click-to-inspect

**File:** `packages/extension/src/__tests__/inspection-e2e.test.ts`

Integration test verifying the full pipeline: click element, agent extracts fiber, content extracts styles, data arrives at panel.

```typescript
// packages/extension/src/__tests__/inspection-e2e.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inspectElement } from '../content/inspector';
import type { InspectionResult } from '@flow/shared';

/**
 * Integration test for the inspection pipeline.
 * Tests the content-side orchestration. Agent communication is mocked
 * since we can't run a real agent script in vitest.
 */
describe('inspection pipeline integration', () => {
  beforeEach(() => {
    // Mock agent response
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'flow:content:request-fiber') {
        // Simulate agent responding with no fiber (non-React page)
        window.postMessage(
          {
            type: 'flow:agent:fiber-result',
            fiber: null,
            customProperties: [],
          },
          '*'
        );
      }
    });
  });

  it('produces a complete InspectionResult for a styled element', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.gap = '8px';
    el.style.padding = '16px';
    el.style.fontSize = '14px';
    el.style.color = 'rgb(255, 0, 0)';
    el.style.borderRadius = '8px';
    el.style.opacity = '0.8';

    const result: InspectionResult = await inspectElement(el);

    // Structure checks
    expect(result.tagName).toBe('div');
    expect(result.selector).toBeTruthy();
    expect(result.timestamp).toBeGreaterThan(0);

    // Fiber is null (no React in test)
    expect(result.fiber).toBeNull();

    // Layout inference
    expect(result.layout.type).toBe('flex');
    expect(result.layout.flexDirection).toBe('column');

    // Style categories should have entries
    expect(result.styles.layout.length).toBeGreaterThan(0);
    expect(result.styles.spacing.length).toBeGreaterThan(0);
    expect(result.styles.typography.length).toBeGreaterThan(0);
    expect(result.styles.colors.length).toBeGreaterThan(0);
    expect(result.styles.effects.length).toBeGreaterThan(0);

    document.body.removeChild(el);
  });

  it('handles an element with no special styles', async () => {
    const el = document.createElement('span');
    document.body.appendChild(el);
    el.textContent = 'hello';

    const result = await inspectElement(el);

    expect(result.tagName).toBe('span');
    expect(result.layout.type).toBe('inline');
    expect(result.fiber).toBeNull();
    expect(result.animations).toEqual([]);

    document.body.removeChild(el);
  });
});
```

**Commit:** `test: end-to-end inspection pipeline integration test`

---

## Task 14: Export shared types from package entry point

**File:** `packages/shared/src/index.ts` (extend existing)

Ensure all new types are exported from the shared package.

```typescript
// Add to packages/shared/src/index.ts

export type {
  FiberData,
  SourceLocation,
  HierarchyEntry,
  CustomProperty,
  GroupedStyles,
  StyleEntry,
  LayoutStructure,
  AnimationData,
  InspectionResult,
} from './types/inspection';

export type {
  AgentFiberResult,
  ContentInspectionResult,
  ContentRequestFiber,
  PanelRequestInspection,
} from './messages';
```

**Commit:** `feat(shared): export all inspection types and messages from package entry`

---

## Summary

| Task | File | What |
|------|------|------|
| 0 | `packages/shared/vitest.config.ts`, `packages/extension/vitest.config.ts` | Vitest setup |
| 1 | `packages/shared/src/types/inspection.ts` | Inspection data types |
| 2 | `packages/shared/src/messages.ts` | Message types for inspection |
| 3 | `packages/extension/src/agent/fiberWalker.ts` | React fiber tree walker |
| 4 | `packages/extension/src/agent/customProperties.ts` | CSS custom property reader with tier classification |
| 5 | `packages/extension/src/agent/index.ts` | Agent message handler |
| 6 | `packages/extension/src/content/styleExtractor.ts` | Computed styles by 9 categories |
| 7 | `packages/extension/src/content/layoutInference.ts` | Grid/flex structure inference |
| 8 | `packages/extension/src/content/animationCapture.ts` | Animation state capture |
| 9 | `packages/extension/src/content/inspector.ts` | Inspection orchestrator |
| 10 | `packages/extension/src/entrypoints/content.ts` | Wire click to inspection |
| 11 | `packages/extension/src/panel/components/InspectionPanel.tsx` | Panel display |
| 12 | `packages/extension/src/background/index.ts` | Route messages to panel |
| 13 | `packages/extension/src/__tests__/inspection-e2e.test.ts` | Integration test |
| 14 | `packages/shared/src/index.ts` | Export all types |

**Total estimated new code:** ~1,200 lines (types + logic + tests + UI)
**Total commits:** 14
