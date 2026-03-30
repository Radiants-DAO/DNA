'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Track the width and height of a container element via ResizeObserver.
 * Returns [ref, { width, height }] — attach ref to the container div.
 *
 * Used by pretext-migrated apps to feed container dimensions into resolveFluid()
 * and page-based layout engines.
 */
export function useContainerSize(defaultWidth = 448, defaultHeight = 704) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setSize({ width: el.clientWidth || defaultWidth, height: el.clientHeight || defaultHeight });
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) {
        setSize({ width: rect.width, height: rect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [defaultWidth, defaultHeight]);

  return [ref, size] as const;
}
