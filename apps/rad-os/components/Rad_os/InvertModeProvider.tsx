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
  const { invertMode, toggleInvertMode, darkMode } = usePreferencesStore();

  // Listen for Konami code
  useKonamiCode({
    onActivate: () => {
      toggleInvertMode();
    },
  });

  // Sync darkMode to the <html> element's `dark` class
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.classList.toggle('light', !darkMode);
  }, [darkMode]);

  return (
    <>
      {children}
      <InvertOverlay active={invertMode} />
    </>
  );
}

export default InvertModeProvider;
