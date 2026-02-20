/**
 * Multi-Select Engine Proxy
 *
 * Wraps UnifiedMutationEngine so that design tool mutations (applyStyle)
 * are replicated to ALL persistently selected elements. Undo reverts all
 * in one step because the proxy batches them together.
 *
 * Only applyStyle is intercepted — everything else passes through directly.
 * Tools require zero changes: they call engine.applyStyle(el, changes) as
 * before, and the proxy fans out to the other selected elements.
 *
 * Nested batching is safe: if the caller (e.g. spacingTool drag) already
 * called beginBatch(), the proxy detects isBatching and skips wrapping.
 * The tool's batch naturally includes all replicated mutations.
 */

import type { UnifiedMutationEngine } from './unifiedMutationEngine'
import type { MutationDiff } from '@flow/shared'
import { generateSelector } from '../elementRegistry'

export function createMultiSelectProxy(
  engine: UnifiedMutationEngine,
  getSelectedSelectors: () => string[],
): UnifiedMutationEngine {
  function applyStyle(
    el: HTMLElement,
    changes: Record<string, string>,
  ): MutationDiff | null {
    const selectors = getSelectedSelectors()
    if (selectors.length <= 1) {
      return engine.applyStyle(el, changes)
    }

    const primarySelector = generateSelector(el)
    const alreadyBatching = engine.isBatching
    if (!alreadyBatching) {
      engine.beginBatch()
    }

    // Primary element first
    const primaryDiff = engine.applyStyle(el, changes)

    // Replicate to other selected elements
    for (const selector of selectors) {
      if (selector === primarySelector) continue
      const otherEl = document.querySelector(selector) as HTMLElement | null
      if (otherEl) {
        engine.applyStyle(otherEl, changes)
      }
    }

    if (!alreadyBatching) {
      engine.commitBatch()
    }

    return primaryDiff
  }

  return {
    applyStyle,
    // Pass through everything else
    applyText: engine.applyText.bind(engine),
    recordCustomMutation: engine.recordCustomMutation.bind(engine),
    beginBatch: engine.beginBatch.bind(engine),
    commitBatch: engine.commitBatch.bind(engine),
    cancelBatch: engine.cancelBatch.bind(engine),
    undo: engine.undo.bind(engine),
    redo: engine.redo.bind(engine),
    getDiffs: engine.getDiffs.bind(engine),
    getNetDiffs: engine.getNetDiffs.bind(engine),
    clearAll: engine.clearAll.bind(engine),
    subscribe: engine.subscribe.bind(engine),
    get canUndo() { return engine.canUndo },
    get canRedo() { return engine.canRedo },
    get undoCount() { return engine.undoCount },
    get redoCount() { return engine.redoCount },
    get isBatching() { return engine.isBatching },
  }
}
