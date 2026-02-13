/**
 * Text edit mode for in-place text editing.
 *
 * In T mode:
 * - first click selects element / focuses typography controls in panel
 * - second click on the same element enters contentEditable
 * - committed text changes are tracked in unified mutations
 */

import type { MutationDiff } from '@flow/shared';
import type { UnifiedMutationEngine } from './unifiedMutationEngine';
import { setTextEditHandlers } from './mutationMessageHandler';
import { generateSelector } from '../elementRegistry';

export interface TextEditModeOptions {
  /** Callback when a text diff is produced */
  onDiff: (diff: MutationDiff) => void;
}

// Visual feedback constants
const EDIT_OUTLINE_STYLE = '2px solid rgba(59, 130, 246, 0.5)';
const EDIT_OUTLINE_OFFSET = '2px';
const DOUBLE_CLICK_WINDOW_MS = 450;

let activeElement: HTMLElement | null = null;
let originalText: string = '';
let options: TextEditModeOptions | null = null;
let abortController: AbortController | null = null;
let engine: UnifiedMutationEngine | null = null;
let pendingElement: HTMLElement | null = null;
let pendingTimestamp = 0;

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
  pendingElement = null;
  pendingTimestamp = 0;
}

/**
 * Initialize text edit mode with the unified engine.
 * Call this after initMutationMessageHandler to ensure proper initialization order.
 */
export function initTextEditMode(unifiedEngine?: UnifiedMutationEngine): void {
  if (unifiedEngine) {
    engine = unifiedEngine;
  }
  setTextEditHandlers({
    // Adapt the signature: handler expects (onDiff) => void, we have (opts) => void
    activate: (onDiff) => activateTextEditMode({ onDiff }),
    deactivate: deactivateTextEditMode,
  });
}

function handleClick(e: MouseEvent): void {
  const initialTarget = e.target as HTMLElement;
  if (!initialTarget || !options) return;
  const target = resolveEditableTarget(initialTarget);
  if (!target) return;
  if (activeElement && target === activeElement) return;

  const now = Date.now();
  const isDoubleClick =
    pendingElement === target &&
    now - pendingTimestamp <= DOUBLE_CLICK_WINDOW_MS;

  if (!isDoubleClick) {
    // First click: arm this element (selection + typography panel happens in content.ts).
    pendingElement = target;
    pendingTimestamp = now;
    return;
  }

  e.preventDefault();
  e.stopPropagation();
  pendingElement = null;
  pendingTimestamp = 0;

  // Commit previous edit if any, then begin editing on second click.
  commitEdit();
  startEditing(target);
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    // Revert and exit
    if (activeElement) {
      activeElement.textContent = originalText;
    }
    commitEdit(true);
  } else if (e.key === 'Enter' && !e.shiftKey) {
    // Enter commits, Shift+Enter inserts newline (default behavior)
    e.preventDefault();
    commitEdit();
  }
}

function handleBlur(): void {
  commitEdit();
}

function hasDirectText(el: HTMLElement): boolean {
  return Array.from(el.childNodes).some(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
  );
}

function resolveEditableTarget(target: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = target;
  while (current && current !== document.body) {
    if (hasDirectText(current)) return current;
    current = current.parentElement;
  }
  return null;
}

function startEditing(target: HTMLElement): void {
  activeElement = target;
  originalText = target.textContent ?? '';

  target.contentEditable = 'true';
  target.focus();

  // Style to show it's editable
  target.style.outline = EDIT_OUTLINE_STYLE;
  target.style.outlineOffset = EDIT_OUTLINE_OFFSET;

  // Use AbortController for clean event listener management
  abortController = new AbortController();
  target.addEventListener('blur', handleBlur, { signal: abortController.signal });
  target.addEventListener('keydown', handleKeydown, { signal: abortController.signal });
}

function commitEdit(reverted = false): void {
  if (!activeElement) return;

  // Abort all event listeners for this element
  abortController?.abort();
  abortController = null;

  const el = activeElement;
  el.contentEditable = 'false';
  el.style.outline = '';
  el.style.outlineOffset = '';

  if (!reverted && options && engine) {
    const newText = el.textContent ?? '';
    if (newText !== originalText) {
      // The DOM has already changed via contentEditable; record as a custom text mutation.
      const selector = generateSelector(el);
      const diff = engine.recordCustomMutation(
        el,
        'text',
        [
          {
            property: 'textContent',
            oldValue: originalText,
            newValue: newText,
          },
        ],
        {
          revert: () => {
            const target = document.querySelector(selector) as HTMLElement | null;
            if (target) target.textContent = originalText;
          },
          reapply: () => {
            const target = document.querySelector(selector) as HTMLElement | null;
            if (target) target.textContent = newText;
          },
        }
      );
      if (diff) {
        options.onDiff(diff);
      }
    }
  }

  activeElement = null;
  originalText = '';
}
