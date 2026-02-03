/**
 * React Fiber Source Extraction Utilities
 *
 * Extracts debug source information from React fiber internals for elements.
 * Used by Dogfood Mode to get file:line references for RadFlow UI elements.
 *
 * References:
 * - click-to-component, react-dev-inspector, react-scan patterns
 * - React does NOT export fiber types, so we define our own minimal interface
 */

import type { SourceLocation } from "../stores/types";

// ============================================================================
// Types (React internals are not exported - we define our own)
// ============================================================================

/**
 * React Fiber debug source information.
 * Contains file path and line/column numbers from development builds.
 */
export interface FiberDebugSource {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
}

/**
 * React Fiber internal type (minimal interface for our needs).
 * React does NOT export fiber types - we define our own.
 */
export interface ReactFiber {
  type:
    | {
        displayName?: string;
        name?: string;
      }
    | string
    | null;
  _debugSource?: FiberDebugSource | null;
  _debugOwner?: ReactFiber | null;
  _debugStack?: string; // React 19+
  return?: ReactFiber | null;
}

/**
 * Extend Element for fiber access via internal React properties.
 * React attaches fibers to DOM elements with dynamic property names.
 */
interface FiberElement extends Element {
  [key: `__reactFiber$${string}`]: ReactFiber | undefined;
}

// ============================================================================
// Version Detection
// ============================================================================

/**
 * Check if React 19+ is being used.
 * React 19 uses _debugStack instead of _debugSource for source information.
 *
 * @returns true if React 19 or later is detected
 */
export function isReact19OrLater(): boolean {
  try {
    // Check React.version if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ReactModule = (window as any).React;
    if (ReactModule?.version) {
      const major = parseInt(ReactModule.version.split(".")[0], 10);
      return major >= 19;
    }

    // Fallback: Check DevTools hook for renderer version
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook?.renderers) {
      for (const renderer of hook.renderers.values()) {
        if (renderer.version) {
          const major = parseInt(renderer.version.split(".")[0], 10);
          return major >= 19;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

// ============================================================================
// Fiber Extraction
// ============================================================================

/**
 * Get React fiber from a DOM element.
 * Uses two-tier lookup: DOM property scan (most reliable in Tauri) then DevTools hook fallback.
 *
 * @param element - The DOM element to get fiber from
 * @returns The React fiber or null if not found
 */
export function getFiberFromElement(element: HTMLElement): ReactFiber | null {
  if (!element) return null;

  try {
    // Primary: Scan DOM properties for __reactFiber$ prefix
    // This is the most reliable in Tauri where DevTools hook may not exist
    const fiberKey = Object.keys(element).find((key) =>
      key.startsWith("__reactFiber$")
    );
    if (fiberKey) {
      const fiber = (element as unknown as FiberElement)[
        fiberKey as `__reactFiber$${string}`
      ];
      if (fiber) return fiber;
    }

    // Fallback: Try DevTools hook if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook?.renderers) {
      for (const renderer of hook.renderers.values()) {
        const fiber = renderer.findFiberByHostInstance?.(element);
        if (fiber) return fiber as ReactFiber;
      }
    }

    return null;
  } catch {
    // Graceful failure - return null
    return null;
  }
}

// ============================================================================
// Debug Source Extraction
// ============================================================================

/**
 * Parse React 19+ _debugStack to extract source information.
 * React 19 uses an Error object to capture the component stack trace.
 * The actual source info is in error.stack.
 *
 * @param debugStack - The _debugStack from React 19+ fiber (Error object)
 * @returns FiberDebugSource or null if parsing fails
 */
function parseDebugStack(debugStack: unknown): FiberDebugSource | null {
  if (!debugStack) return null;

  try {
    let stackString: string | undefined;

    // React 19: _debugStack is an Error object - extract .stack
    if (debugStack instanceof Error) {
      stackString = debugStack.stack;
    } else if (typeof debugStack === "object" && debugStack !== null) {
      // Fallback: check for .stack property on object
      const obj = debugStack as { stack?: string };
      if (obj.stack) {
        stackString = obj.stack;
      }
    } else if (typeof debugStack === "string") {
      stackString = debugStack;
    }

    if (!stackString) return null;

    // Parse the stack trace to find source files
    // Stack format (Vite dev):
    //   Error: react-stack-top-frame
    //       at LeftPanel (http://localhost:1420/src/components/layout/LeftPanel.tsx:42:5)
    //       at div
    //       at EditorLayout (http://localhost:1420/src/components/layout/EditorLayout.tsx:15:3)

    // Split into lines and find first line with a .tsx/.ts file
    const lines = stackString.split("\n");

    for (const line of lines) {
      // Skip the "Error:" line and react internals
      if (line.includes("react-stack-top-frame")) continue;
      if (line.includes("react-jsx-dev-runtime")) continue;
      if (line.includes("react-dom")) continue;
      if (line.includes("node_modules")) continue;

      // Match: "at ComponentName (http://localhost:1420/src/path/file.tsx:line:col)"
      // or Safari: "ComponentName@http://localhost:1420/src/path/file.tsx:line:col"
      const patterns = [
        // Chrome/Node format: at Name (url:line:col)
        /at\s+(\w+)\s+\((?:https?:\/\/[^/]+)?([^:)]+):(\d+):(\d+)\)/,
        // Safari format: Name@url:line:col
        /(\w+)@(?:https?:\/\/[^/]+)?([^:]+):(\d+):(\d+)/,
        // Anonymous: at (url:line:col)
        /at\s+\((?:https?:\/\/[^/]+)?([^:)]+):(\d+):(\d+)\)/,
      ];

      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          // For patterns with component name, file is in match[2], otherwise match[1]
          const fileName = match[2] || match[1];
          const lineNum = parseInt(match[3] || match[2], 10);
          const colNum = parseInt(match[4] || match[3], 10);

          // Only return if it's a source file (not react internals)
          if (fileName.includes("/src/") || fileName.endsWith(".tsx") || fileName.endsWith(".ts")) {
            return {
              fileName,
              lineNumber: lineNum,
              columnNumber: colNum,
            };
          }
        }
      }
    }

    return null;
  } catch (e) {
    console.warn("[parseDebugStack] Error:", e);
    return null;
  }
}

/**
 * Extract debug source from a React fiber.
 * For React 18: Uses _debugSource directly or via _debugOwner chain.
 * For React 19: Uses _debugStack (string or object format).
 *
 * @param fiber - The React fiber to extract source from
 * @returns FiberDebugSource or null if not found
 */
export function extractDebugSource(
  fiber: ReactFiber
): FiberDebugSource | null {
  if (!fiber) return null;

  try {
    // React 18: Direct source
    if (fiber._debugSource) {
      return fiber._debugSource;
    }

    // React 19: Check _debugStack FIRST (before owner chain)
    // For intrinsic elements (div, button), _debugStack points to where they were rendered
    if (fiber._debugStack) {
      const fromStack = parseDebugStack(fiber._debugStack);
      if (fromStack) return fromStack;
    }

    // Traverse _debugOwner chain (max 5 levels for performance)
    // Check both _debugSource and _debugStack on each owner
    let owner = fiber._debugOwner;
    let depth = 0;
    while (owner && depth < 5) {
      if (owner._debugSource) {
        return owner._debugSource;
      }
      if (owner._debugStack) {
        const fromStack = parseDebugStack(owner._debugStack);
        if (fromStack) return fromStack;
      }
      owner = owner._debugOwner;
      depth++;
    }

    return null;
  } catch {
    // Graceful failure - return null
    return null;
  }
}

// ============================================================================
// Path Normalization
// ============================================================================

/**
 * Convert FiberDebugSource to SourceLocation format.
 * Normalizes absolute paths to project-relative paths.
 *
 * @param source - The FiberDebugSource from React fiber
 * @returns SourceLocation with normalized paths
 */
export function fiberSourceToLocation(source: FiberDebugSource): SourceLocation {
  // Vite dev paths are typically relative already
  // But handle absolute paths from different build setups
  let relativePath = source.fileName;
  const filePath = source.fileName;

  // Strip common prefixes for Vite/Tauri dev
  // Handle both Unix and Windows paths
  const prefixes = [
    "/src/",
    "src/",
    "\\src\\",
    // Vite-specific patterns
    "/@fs/",
    // Common absolute path patterns - strip everything before src/
  ];

  for (const prefix of prefixes) {
    const idx = relativePath.indexOf(prefix);
    if (idx !== -1) {
      // Keep "src/" in the path
      const prefixStart = prefix.startsWith("/") || prefix.startsWith("\\") ? 1 : 0;
      relativePath = relativePath.slice(idx + prefixStart);
      break;
    }
  }

  // Handle full absolute paths (e.g., /Users/name/project/src/...)
  // Extract from last occurrence of "src/"
  if (relativePath.startsWith("/") || relativePath.includes(":\\")) {
    const srcMatch = relativePath.match(/[/\\](src[/\\].+)$/);
    if (srcMatch) {
      relativePath = srcMatch[1];
    }
  }

  // Normalize path separators to forward slashes
  relativePath = relativePath.replace(/\\/g, "/");

  return {
    filePath,
    relativePath,
    line: source.lineNumber,
    column: source.columnNumber ?? 0,
  };
}

// ============================================================================
// Combined Utility
// ============================================================================

/**
 * Get source location from a DOM element by extracting its React fiber.
 * Convenience function that combines getFiberFromElement, extractDebugSource,
 * and fiberSourceToLocation.
 *
 * @param element - The DOM element to get source from
 * @returns SourceLocation or null if source unavailable
 */
export function getSourceFromElement(
  element: HTMLElement
): SourceLocation | null {
  const fiber = getFiberFromElement(element);
  if (!fiber) return null;

  const debugSource = extractDebugSource(fiber);
  if (!debugSource) return null;

  return fiberSourceToLocation(debugSource);
}

/**
 * Get component name from a React fiber.
 * Useful for display purposes in comment mode.
 *
 * @param fiber - The React fiber to get name from
 * @returns Component name or null
 */
export function getComponentName(fiber: ReactFiber): string | null {
  if (!fiber) return null;

  try {
    if (typeof fiber.type === "string") {
      // HTML element
      return fiber.type;
    }

    if (fiber.type && typeof fiber.type === "object") {
      // React component
      return fiber.type.displayName || fiber.type.name || null;
    }

    return null;
  } catch {
    return null;
  }
}
