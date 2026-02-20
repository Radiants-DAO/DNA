/**
 * Multi-Select Engine Proxy
 *
 * Wraps UnifiedMutationEngine so that design tool mutations (applyStyle)
 * are replicated to ALL persistently selected elements. Undo reverts all
 * in one step because the proxy batches them together.
 *
 * Only applyStyle is intercepted — everything else delegates to the
 * underlying engine via prototype chain (Object.create). If the engine
 * interface gains new methods, they inherit automatically.
 *
 * Nested batching is safe: if the caller (e.g. spacingTool drag) already
 * called beginBatch(), the proxy detects isBatching and skips wrapping.
 * The tool's batch naturally includes all replicated mutations.
 *
 * Return value contract: applyStyle returns the diff for the primary
 * element only. Diffs for secondary elements are recorded internally
 * by the engine (visible in getDiffs/getNetDiffs) but not returned
 * to the caller. Current tools don't rely on the return value.
 */

import type { UnifiedMutationEngine } from './unifiedMutationEngine'
import type { MutationDiff } from '@flow/shared'

export function createMultiSelectProxy(
  engine: UnifiedMutationEngine,
  getSelectedSelectors: () => string[],
): UnifiedMutationEngine {
  const proxy = Object.create(engine) as UnifiedMutationEngine

  proxy.applyStyle = function applyStyle(
    el: HTMLElement,
    changes: Record<string, string>,
  ): MutationDiff | null {
    const selectors = getSelectedSelectors()
    if (selectors.length <= 1) {
      return engine.applyStyle(el, changes)
    }

    const alreadyBatching = engine.isBatching
    if (!alreadyBatching) {
      engine.beginBatch()
    }

    // Primary element first
    const primaryDiff = engine.applyStyle(el, changes)

    // Replicate to other selected elements (compare DOM nodes, not selector strings)
    for (const selector of selectors) {
      const otherEl = document.querySelector(selector) as HTMLElement | null
      if (!otherEl || otherEl === el) continue
      engine.applyStyle(otherEl, changes)
    }

    if (!alreadyBatching) {
      engine.commitBatch()
    }

    return primaryDiff
  }

  return proxy
}
