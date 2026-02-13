import hotkeys from 'hotkeys-js';
import { shouldIgnoreKeyboardShortcut } from './keyboardGuards';

/**
 * Register a keyboard hotkey handler.
 * Returns a cleanup function to unbind only this specific handler.
 */
export function registerHotkey(
  keys: string,
  handler: (event: KeyboardEvent) => void
): () => void {
  // Wrap handler so we can pass it to unbind for targeted removal
  const wrappedHandler = (event: KeyboardEvent) => {
    if (shouldIgnoreKeyboardShortcut(event)) return;
    handler(event);
  };
  hotkeys(keys, wrappedHandler);
  // Pass the specific handler to unbind only this binding, not all handlers for the key
  return () => hotkeys.unbind(keys, wrappedHandler);
}

/**
 * Register multiple hotkeys at once.
 * Returns a single cleanup function that unbinds all.
 */
export function registerHotkeys(
  bindings: Array<{ keys: string; handler: (event: KeyboardEvent) => void }>
): () => void {
  const cleanups = bindings.map(({ keys, handler }) => registerHotkey(keys, handler));
  return () => cleanups.forEach((cleanup) => cleanup());
}
