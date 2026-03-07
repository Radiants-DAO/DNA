'use client';

import { useEffect, useState } from 'react';

export interface AnimationPreferences {
  isDocumentVisible: boolean;
  prefersReducedMotion: boolean;
}

export function useAnimationPreferences(): AnimationPreferences {
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const syncVisibility = () => {
      setIsDocumentVisible(!document.hidden);
    };

    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    return () => document.removeEventListener('visibilitychange', syncVisibility);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncReducedMotion = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    syncReducedMotion();
    mediaQuery.addEventListener('change', syncReducedMotion);
    return () => mediaQuery.removeEventListener('change', syncReducedMotion);
  }, []);

  return { isDocumentVisible, prefersReducedMotion };
}
