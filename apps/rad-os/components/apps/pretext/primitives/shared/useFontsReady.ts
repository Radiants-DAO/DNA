import { useEffect } from 'react';

/**
 * Runs `effect` once the document's fonts are ready. SSR-safe: when
 * `document.fonts` is unavailable (server, older browsers), the callback
 * fires immediately on a resolved promise.
 *
 * The effect receives an `isCancelled` getter — pretext layout can be
 * expensive, so callers should bail out early when the effect has been
 * cleaned up. The hook returns nothing; caller deps drive re-runs exactly
 * like a regular `useEffect`.
 */
export function useFontsReady(
  effect: (isCancelled: () => boolean) => void,
  deps: React.DependencyList,
): void {
  useEffect(() => {
    let cancelled = false;

    const ready =
      typeof document !== 'undefined' && 'fonts' in document && document.fonts?.ready
        ? document.fonts.ready
        : Promise.resolve();

    void ready.then(() => {
      if (cancelled) return;
      effect(() => cancelled);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller owns deps
  }, deps);
}
