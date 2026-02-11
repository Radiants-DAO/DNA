/**
 * Text edit mode for in-place text editing.
 *
 * Enables text edit mode: user clicks a text element, it becomes editable,
 * changes are captured as diffs on blur. Per spec section 7.3.
 */

import type { MutationDiff } from '@flow/shared';
import type { UnifiedMutationEngine } from './unifiedMutationEngine';
import { setTextEditHandlers } from './mutationMessageHandler';

export interface TextEditModeOptions {
  /** Callback when a text diff is produced */
  onDiff: (diff: MutationDiff) => void;
}

// Visual feedback constants
const EDIT_OUTLINE_STYLE = '2px solid rgba(59, 130, 246, 0.5)';
const EDIT_OUTLINE_OFFSET = '2px';

let activeElement: HTMLElement | null = null;
let originalText: string = '';
let options: TextEditModeOptions | null = null;
let abortController: AbortController | null = null;
let engine: UnifiedMutationEngine | null = null;

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
      const diff = engine.applyText(el, newText);
      if (diff) {
        options.onDiff(diff);
      }
    }
  }

  activeElement = null;
  originalText = '';
}
