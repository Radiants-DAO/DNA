/**
 * RadFlow Source Resolver
 *
 * Multi-strategy source resolution for React components.
 * Tries: DevTools API → _debugSource → Error stack parsing → Source maps
 */

import type { Fiber, SourceLocation, RendererInterface } from './types';

/** Cache for function source locations (captured at definition time) */
const functionSourceCache = new WeakMap<object, SourceLocation | null>();

/**
 * Resolve the source location for a fiber.
 * Uses multiple strategies in priority order.
 */
export function resolveSource(fiber: Fiber): SourceLocation | null {
  // Strategy 1: React DevTools API (preferred)
  const devToolsSource = getSourceFromDevTools(fiber);
  if (devToolsSource) return devToolsSource;

  // Strategy 2: _debugSource prop (Babel-compiled, rare in Next.js)
  const debugSource = getSourceFromDebugProp(fiber);
  if (debugSource) return debugSource;

  // Strategy 3: Cached function source (from error stack at definition)
  const cachedSource = getSourceFromCache(fiber);
  if (cachedSource) return cachedSource;

  // Strategy 4: Error stack parsing (fallback - uses function.toString())
  const stackSource = getSourceFromStack(fiber);
  if (stackSource) return stackSource;

  // Strategy 5: Source maps (last resort - expensive, async)
  // Deferred to future implementation - requires fetching .map files

  return null;
}

/**
 * Strategy 1: Get source from React DevTools internal API.
 * React 18+ exposes this via the rendererInterfaces.
 */
function getSourceFromDevTools(fiber: Fiber): SourceLocation | null {
  if (typeof window === 'undefined') return null;

  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook?.rendererInterfaces) return null;

  // Iterate all renderers (don't assume ID 1)
  for (const [, renderer] of hook.rendererInterfaces) {
    const source = getSourceForFiber(renderer, fiber);
    if (source) return source;
  }

  return null;
}

/**
 * Call renderer.getSourceForFiber if available.
 */
function getSourceForFiber(
  renderer: RendererInterface,
  fiber: Fiber
): SourceLocation | null {
  if (!renderer.getSourceForFiber) return null;

  try {
    const source = renderer.getSourceForFiber(fiber);
    if (source?.fileName) {
      return {
        filePath: source.fileName,
        relativePath: toRelativePath(source.fileName),
        line: source.lineNumber,
        column: source.columnNumber ?? 1,
      };
    }
  } catch {
    // Renderer may throw for certain fiber types
  }

  return null;
}

/**
 * Strategy 2: Get source from fiber's _debugSource prop.
 * Only works with Babel-compiled code (rare in Next.js with SWC).
 */
function getSourceFromDebugProp(fiber: Fiber): SourceLocation | null {
  const debug = fiber._debugSource;
  if (!debug?.fileName) return null;

  return {
    filePath: debug.fileName,
    relativePath: toRelativePath(debug.fileName),
    line: debug.lineNumber,
    column: debug.columnNumber ?? 1,
  };
}

/**
 * Convert absolute path to relative path.
 * Strips common prefixes like /Users/.../project/
 */
function toRelativePath(absolutePath: string): string {
  // Try to extract path after common markers
  const markers = ['/src/', '/app/', '/pages/', '/components/'];

  for (const marker of markers) {
    const idx = absolutePath.indexOf(marker);
    if (idx !== -1) {
      return absolutePath.slice(idx + 1); // Keep 'src/...' etc
    }
  }

  // Fall back to filename only
  const parts = absolutePath.split('/');
  return parts[parts.length - 1];
}

/**
 * Check if a source location is from node_modules.
 * These should be excluded from the componentMap.
 */
export function isNodeModulesSource(source: SourceLocation | null): boolean {
  if (!source) return false;
  return source.filePath.includes('node_modules');
}

/**
 * Strategy 3: Get source from cache.
 * Sources are cached by function identity.
 */
function getSourceFromCache(fiber: Fiber): SourceLocation | null {
  const type = fiber.type;
  if (typeof type !== 'function' && typeof type !== 'object') return null;
  if (type === null) return null;

  return functionSourceCache.get(type) ?? null;
}

/**
 * Strategy 4: Get source from error stack parsing.
 * Creates an error and parses the stack trace.
 *
 * Note: This is imprecise in bundled code without source maps,
 * but can still provide useful information in dev mode.
 */
function getSourceFromStack(fiber: Fiber): SourceLocation | null {
  const type = fiber.type;

  // Only works for function components
  if (typeof type !== 'function') return null;

  // Check if we've already tried this function
  if (functionSourceCache.has(type)) {
    return functionSourceCache.get(type) ?? null;
  }

  try {
    // Try to extract source from the function's string representation
    // This only works in dev mode where functions aren't fully minified
    const funcStr = type.toString();
    const sourceMatch = funcStr.match(
      /\/\/# sourceURL=([^\s]+)/
    );
    if (sourceMatch) {
      const result = parseSourceUrl(sourceMatch[1]);
      functionSourceCache.set(type, result);
      return result;
    }

    // Try parsing an error stack
    // Create error at call site to capture stack
    const stack = new Error().stack;
    if (stack) {
      const source = parseStackForComponent(stack, type.name || 'anonymous');
      functionSourceCache.set(type, source);
      return source;
    }
  } catch {
    // Stack parsing can fail in various edge cases
  }

  functionSourceCache.set(type, null);
  return null;
}

/**
 * Parse a sourceURL comment for location info.
 */
function parseSourceUrl(url: string): SourceLocation | null {
  // Format: webpack://projectName/./src/components/Button.tsx?line:col
  // or: file:///path/to/file.tsx:line:col

  try {
    // Handle webpack:// URLs
    if (url.startsWith('webpack://')) {
      const match = url.match(/webpack:\/\/[^/]+\/\.\/(.+?)(?:\?(\d+):(\d+))?$/);
      if (match) {
        return {
          filePath: match[1],
          relativePath: match[1],
          line: parseInt(match[2] || '1', 10),
          column: parseInt(match[3] || '1', 10),
        };
      }
    }

    // Handle file:// URLs
    if (url.startsWith('file://')) {
      const match = url.match(/file:\/\/(.+?):(\d+):(\d+)/);
      if (match) {
        return {
          filePath: match[1],
          relativePath: toRelativePath(match[1]),
          line: parseInt(match[2], 10),
          column: parseInt(match[3], 10),
        };
      }
    }
  } catch {
    // URL parsing can fail
  }

  return null;
}

/**
 * Parse a stack trace to find a component's source location.
 */
function parseStackForComponent(
  stack: string,
  componentName: string
): SourceLocation | null {
  const lines = stack.split('\n');

  // Look for a line mentioning the component or a user source file
  for (const line of lines) {
    // Skip node_modules and internal frames
    if (line.includes('node_modules') || line.includes('react-dom')) continue;

    // Try to parse Chrome/V8 style stack frame
    // Format: "    at ComponentName (file:line:col)" or "    at file:line:col"
    const chromeMatch = line.match(
      /at\s+(?:(\S+)\s+)?\(?(.+?):(\d+):(\d+)\)?$/
    );
    if (chromeMatch) {
      const [, name, file, lineStr, colStr] = chromeMatch;
      // Prefer frames that match the component name
      if (name === componentName || isUserSourceFile(file)) {
        return {
          filePath: file,
          relativePath: toRelativePath(file),
          line: parseInt(lineStr, 10),
          column: parseInt(colStr, 10),
        };
      }
    }

    // Try Firefox/Safari style
    // Format: "functionName@file:line:col" or "file:line:col"
    const firefoxMatch = line.match(/(?:(\S+)@)?(.+?):(\d+):(\d+)$/);
    if (firefoxMatch) {
      const [, name, file, lineStr, colStr] = firefoxMatch;
      if (name === componentName || isUserSourceFile(file)) {
        return {
          filePath: file,
          relativePath: toRelativePath(file),
          line: parseInt(lineStr, 10),
          column: parseInt(colStr, 10),
        };
      }
    }
  }

  return null;
}

/**
 * Check if a file path looks like user source code (not framework/library).
 */
function isUserSourceFile(path: string): boolean {
  if (!path) return false;
  if (path.includes('node_modules')) return false;
  if (path.includes('webpack-internal')) return false;
  if (path.includes('react-dom')) return false;
  if (path.includes('next/dist')) return false;

  // Positive signals
  return (
    path.includes('/src/') ||
    path.includes('/app/') ||
    path.includes('/pages/') ||
    path.includes('/components/') ||
    path.endsWith('.tsx') ||
    path.endsWith('.jsx')
  );
}

/**
 * Register a function's source location in the cache.
 * Can be called by instrumented code to provide accurate locations.
 */
export function registerFunctionSource(
  fn: Function,
  source: SourceLocation
): void {
  functionSourceCache.set(fn, source);
}
