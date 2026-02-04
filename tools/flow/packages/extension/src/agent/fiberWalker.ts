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
