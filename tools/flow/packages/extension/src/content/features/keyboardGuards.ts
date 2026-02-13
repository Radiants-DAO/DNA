const EDITABLE_ROLES = new Set(['textbox', 'searchbox', 'combobox', 'spinbutton']);

/**
 * True when the target is an element that accepts text/numeric typing.
 */
export function isEditableElement(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  const contentEditable = target.getAttribute('contenteditable');
  if (
    contentEditable === '' ||
    contentEditable === 'true' ||
    contentEditable === 'plaintext-only'
  ) {
    return true;
  }

  const role = target.getAttribute('role');
  if (role && EDITABLE_ROLES.has(role.toLowerCase())) return true;

  return false;
}

/**
 * Global keyboard shortcuts should be ignored while typing in an editable field.
 */
export function shouldIgnoreKeyboardShortcut(event: KeyboardEvent): boolean {
  if (isEditableElement(event.target)) return true;

  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  for (const node of path) {
    if (isEditableElement(node)) return true;
  }

  if (isEditableElement(document.activeElement)) return true;

  return false;
}
