'use client';

import { useEffect, useState } from 'react';

const DEFAULT_CORNER_SHAPE = 'circle';

function readCornerShape(): string {
  if (typeof document === 'undefined') {
    return DEFAULT_CORNER_SHAPE;
  }

  const value = document.documentElement.dataset.cornerShape?.trim();
  return value ? value : DEFAULT_CORNER_SHAPE;
}

export function useCornerShape(): string {
  const [cornerShape, setCornerShape] = useState(readCornerShape);

  useEffect(() => {
    const root = document.documentElement;
    const syncCornerShape = () => {
      setCornerShape((current) => {
        const next = readCornerShape();
        return current === next ? current : next;
      });
    };

    syncCornerShape();

    const observer = new MutationObserver(syncCornerShape);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-corner-shape'],
    });

    return () => observer.disconnect();
  }, []);

  return cornerShape;
}
