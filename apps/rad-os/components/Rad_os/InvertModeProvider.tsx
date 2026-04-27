'use client';

import React from 'react';
import { usePreferencesStore } from '@/store';
import { useKonamiCode } from '@/hooks';
import { InvertOverlay } from './InvertOverlay';

interface InvertModeProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that:
 * - Applies invert overlay with mix-blend-mode: difference when invertMode is enabled
 * - Listens for Konami code to toggle invert mode
 *
 * @example
 * <InvertModeProvider>
 *   <App />
 * </InvertModeProvider>
 */
export function InvertModeProvider({ children }: InvertModeProviderProps) {
  const {
    invertMode,
    toggleInvertMode,
    darkMode,
    darkModeAuto,
    theme,
    reduceMotion,
    pixelScale,
    cornerShape,
    setDarkMode,
  } = usePreferencesStore();

  // Listen for Konami code
  useKonamiCode({
    onActivate: () => {
      toggleInvertMode();
    },
  });

  // Mirror OS `prefers-color-scheme` while auto is on
  React.useEffect(() => {
    if (!darkModeAuto || typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    setDarkMode(media.matches);
    const onChange = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [darkModeAuto, setDarkMode, theme]);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.classList.toggle('light', !darkMode);
  }, [darkMode]);

  // Expose visual preferences to CSS
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.reduceMotion = reduceMotion ? 'true' : 'false';
    root.dataset.pixelScale = String(pixelScale);
    root.dataset.cornerShape = cornerShape;
    root.style.setProperty('--pixel-scale', String(pixelScale));
  }, [theme, reduceMotion, pixelScale, cornerShape]);

  return (
    <>
      {children}
      <InvertOverlay active={invertMode} />
    </>
  );
}
