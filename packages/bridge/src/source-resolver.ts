/**
 * RadFlow Source Resolver
 *
 * Multi-strategy source resolution for React components.
 * Tries: DevTools API → Error stack parsing → Source maps
 *
 * Implementation: fn-5.2
 */

import type { Fiber, SourceLocation, RendererInterface } from './types';

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

  // Strategy 3: Error stack parsing (fallback)
  // Implemented in fn-5.2

  // Strategy 4: Source maps (last resort)
  // Implemented in fn-5.2

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
