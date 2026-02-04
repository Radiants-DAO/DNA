import hotkeys from 'hotkeys-js';

/**
 * Register a keyboard hotkey handler.
 * Returns a cleanup function to unbind the hotkey.
 */
export function registerHotkey(
  keys: string,
  handler: (event: KeyboardEvent) => void
): () => void {
  hotkeys(keys, (event) => {
    handler(event as KeyboardEvent);
  });
  return () => hotkeys.unbind(keys);
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
