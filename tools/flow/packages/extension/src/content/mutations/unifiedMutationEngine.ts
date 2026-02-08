/**
 * Unified Mutation Engine
 *
 * Replaces the dual mutationEngine + mutationRecorder systems with a single
 * pipeline. All DOM mutations (spacing handles, designer panel, VisBug tools,
 * text editing) flow through this engine.
 *
 * Features:
 * - Before/after tracking for every mutation via inline style capture
 * - Single undo/redo stack (content-script-side, where DOM access lives)
 * - Batch coalescing (for rapid sequential changes like arrow key holds)
 * - Diff export compatible with @flow/shared MutationDiff format
 * - Net diff squashing (getNetDiffs) for agent context — collapses history
 *   to one before→after per element+property
 * - Full revert (clearAll restores all original inline styles)
 *
 * Audit notes (from Task 0.1):
 * - Old mutationEngine.ts: had revert via revertStack, own element registry + selector gen
 * - Old mutationRecorder.ts: stateless diff builder, no revert, used elementRegistry
 * - Old useUndoRedo.ts: panel-side React hook with local useState stacks, disconnected
 * - Old editingSlice.ts: Zustand undo/redo stacks, also disconnected
 * - Old mutationSlice.ts: simple diff accumulator
 * - Old designerChangesSlice.ts: another disconnected accumulator
 * This engine unifies all of the above into one content-side system.
 */

import type {
  MutationDiff,
  PropertyMutation,
  ElementIdentity,
} from '@flow/shared'
import { normalizeStyleChanges } from '../features/styleUtils'
import { generateSelector } from '../elementRegistry'

// ============================================================================
// Types
// ============================================================================

interface MutationEntry {
  diff: MutationDiff
  revert: () => void
}

interface MutationBatch {
  entries: MutationEntry[]
}

export interface UnifiedMutationEngine {
  /** Apply style changes to an element. Returns diff or null if no change. */
  applyStyle(el: HTMLElement, changes: Record<string, string>): MutationDiff | null
  /**
   * Apply text content change. Returns diff or null if no change.
   * Note: sets el.textContent, which destroys any child elements.
   * Only use on leaf text nodes or elements where child loss is acceptable.
   */
  applyText(el: HTMLElement, newText: string): MutationDiff | null
  /** Start a batch — all mutations until commitBatch() become one undo step. */
  beginBatch(): void
  /** Commit the current batch as a single undo step. */
  commitBatch(): void
  /** Discard the current batch without committing. Mutations already applied to DOM are NOT reverted. */
  cancelBatch(): void
  /** Undo the last mutation (or batch). Returns true if something was undone. */
  undo(): boolean
  /** Redo the last undone mutation. Returns true if something was redone. */
  redo(): boolean
  /** Get all active diffs in order (full granular history, excludes undone). */
  getDiffs(): MutationDiff[]
  /**
   * Get squashed diffs for agent context. Collapses history to one diff per
   * element with one change per property (first oldValue → last newValue).
   * Omits properties where net change is zero (changed and changed back).
   */
  getNetDiffs(): MutationDiff[]
  /** Undo everything and clear all stacks. */
  clearAll(): void
  /** Whether undo is available. */
  readonly canUndo: boolean
  /** Whether redo is available. */
  readonly canRedo: boolean
  /** Number of undo steps. */
  readonly undoCount: number
  /** Number of redo steps. */
  readonly redoCount: number
  /** Subscribe to state changes (canUndo, canRedo, diffs). */
  subscribe(listener: () => void): () => void
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Re-query an element by selector. Used by undo/redo to avoid holding stale
 * references to elements that may have been removed and re-added (HMR, SPA nav).
 */
function findElement(selector: string): HTMLElement | null {
  return document.querySelector(selector) as HTMLElement | null
}

function revertInlineStyles(selector: string, beforeInline: Record<string, string>): void {
  const el = findElement(selector)
  if (!el) return
  for (const [prop, value] of Object.entries(beforeInline)) {
    if (value) {
      el.style.setProperty(prop, value)
    } else {
      el.style.removeProperty(prop)
    }
  }
}

export function createUnifiedMutationEngine(): UnifiedMutationEngine {
  const undoStack: MutationBatch[] = []
  const redoStack: MutationBatch[] = []
  let currentBatch: MutationEntry[] | null = null
  const listeners = new Set<() => void>()

  function notify() {
    for (const listener of listeners) {
      listener()
    }
  }

  function buildIdentity(el: HTMLElement): ElementIdentity {
    return { selector: generateSelector(el) }
  }

  function captureInlineStyles(
    el: HTMLElement,
    properties: string[]
  ): Record<string, string> {
    const result: Record<string, string> = {}
    for (const prop of properties) {
      result[prop] = el.style.getPropertyValue(prop)
    }
    return result
  }

  function applyStyle(
    el: HTMLElement,
    changes: Record<string, string>
  ): MutationDiff | null {
    const normalized = normalizeStyleChanges(changes)
    const properties = Object.keys(normalized)
    if (properties.length === 0) return null

    // Capture before (inline style values, not computed)
    const beforeInline = captureInlineStyles(el, properties)

    // Also capture computed "before" for the diff report
    const computed = getComputedStyle(el)
    const beforeComputed: Record<string, string> = {}
    for (const prop of properties) {
      beforeComputed[prop] = computed.getPropertyValue(prop).trim()
    }

    // Apply
    for (const [prop, value] of Object.entries(normalized)) {
      el.style.setProperty(prop, value)
    }

    // Capture computed "after" for the diff report
    const afterComputed: Record<string, string> = {}
    for (const prop of properties) {
      afterComputed[prop] = getComputedStyle(el).getPropertyValue(prop).trim()
    }

    // Build changes list (only properties that actually changed)
    const mutationChanges: PropertyMutation[] = properties
      .filter((prop) => beforeComputed[prop] !== afterComputed[prop])
      .map((prop) => ({
        property: prop,
        oldValue: beforeComputed[prop],
        newValue: afterComputed[prop],
      }))

    if (mutationChanges.length === 0) {
      // Revert the no-op style sets
      for (const [prop, value] of Object.entries(beforeInline)) {
        if (value) {
          el.style.setProperty(prop, value)
        } else {
          el.style.removeProperty(prop)
        }
      }
      return null
    }

    const selector = generateSelector(el)
    const diff: MutationDiff = {
      id: crypto.randomUUID(),
      element: { selector },
      type: 'style',
      changes: mutationChanges,
      timestamp: new Date().toISOString(),
    }

    // Revert re-queries by selector to handle HMR/SPA element replacement
    const revert = () => revertInlineStyles(selector, beforeInline)

    pushEntry({ diff, revert })
    return diff
  }

  function applyText(el: HTMLElement, newText: string): MutationDiff | null {
    const oldText = el.textContent ?? ''
    if (oldText === newText) return null

    el.textContent = newText

    const selector = generateSelector(el)
    const diff: MutationDiff = {
      id: crypto.randomUUID(),
      element: { selector },
      type: 'text',
      changes: [
        { property: 'textContent', oldValue: oldText, newValue: newText },
      ],
      timestamp: new Date().toISOString(),
    }

    const revert = () => {
      const target = findElement(selector)
      if (target) target.textContent = oldText
    }

    pushEntry({ diff, revert })
    return diff
  }

  function pushEntry(entry: MutationEntry): void {
    if (currentBatch) {
      currentBatch.push(entry)
    } else {
      undoStack.push({ entries: [entry] })
      redoStack.length = 0
      notify()
    }
  }

  function beginBatch(): void {
    currentBatch = []
  }

  function commitBatch(): void {
    if (currentBatch && currentBatch.length > 0) {
      undoStack.push({ entries: [...currentBatch] })
      redoStack.length = 0
      notify()
    }
    currentBatch = null
  }

  function cancelBatch(): void {
    currentBatch = null
  }

  function undo(): boolean {
    const batch = undoStack.pop()
    if (!batch) return false

    // Revert in reverse order
    for (let i = batch.entries.length - 1; i >= 0; i--) {
      batch.entries[i].revert()
    }

    redoStack.push(batch)
    notify()
    return true
  }

  function redo(): boolean {
    const batch = redoStack.pop()
    if (!batch) return false

    // Re-apply in forward order
    for (const entry of batch.entries) {
      if (entry.diff.type === 'style') {
        const el = findElement(entry.diff.element.selector)
        if (el) {
          for (const change of entry.diff.changes) {
            el.style.setProperty(change.property, change.newValue)
          }
        }
      } else if (entry.diff.type === 'text') {
        const el = findElement(entry.diff.element.selector)
        if (el) {
          el.textContent = entry.diff.changes[0].newValue
        }
      }
    }

    undoStack.push(batch)
    notify()
    return true
  }

  function getDiffs(): MutationDiff[] {
    const diffs: MutationDiff[] = []
    for (const batch of undoStack) {
      for (const entry of batch.entries) {
        diffs.push(entry.diff)
      }
    }
    return diffs
  }

  function getNetDiffs(): MutationDiff[] {
    // Group all changes by element selector, then by property.
    // For each property: keep first oldValue, last newValue.
    // Omit properties where net change is zero.
    const elementMap = new Map<string, {
      element: ElementIdentity
      type: MutationDiff['type']
      props: Map<string, { oldValue: string; newValue: string }>
      firstTimestamp: string
    }>()

    for (const batch of undoStack) {
      for (const entry of batch.entries) {
        const key = entry.diff.element.selector
        let group = elementMap.get(key)
        if (!group) {
          group = {
            element: entry.diff.element,
            type: entry.diff.type,
            props: new Map(),
            firstTimestamp: entry.diff.timestamp,
          }
          elementMap.set(key, group)
        }

        for (const change of entry.diff.changes) {
          const existing = group.props.get(change.property)
          if (existing) {
            // Update newValue, keep original oldValue
            existing.newValue = change.newValue
          } else {
            group.props.set(change.property, {
              oldValue: change.oldValue,
              newValue: change.newValue,
            })
          }
        }
      }
    }

    const result: MutationDiff[] = []
    for (const group of elementMap.values()) {
      // Filter out properties where net change is zero
      const netChanges: PropertyMutation[] = []
      for (const [property, { oldValue, newValue }] of group.props) {
        if (oldValue !== newValue) {
          netChanges.push({ property, oldValue, newValue })
        }
      }

      if (netChanges.length === 0) continue

      result.push({
        id: crypto.randomUUID(),
        element: group.element,
        type: group.type,
        changes: netChanges,
        timestamp: group.firstTimestamp,
      })
    }

    return result
  }

  function clearAll(): void {
    // Undo everything
    while (undoStack.length > 0) {
      const batch = undoStack.pop()!
      for (let i = batch.entries.length - 1; i >= 0; i--) {
        batch.entries[i].revert()
      }
    }
    redoStack.length = 0
    notify()
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  return {
    applyStyle,
    applyText,
    beginBatch,
    commitBatch,
    cancelBatch,
    undo,
    redo,
    getDiffs,
    getNetDiffs,
    clearAll,
    subscribe,
    get canUndo() { return undoStack.length > 0 },
    get canRedo() { return redoStack.length > 0 },
    get undoCount() { return undoStack.length },
    get redoCount() { return redoStack.length },
  }
}
