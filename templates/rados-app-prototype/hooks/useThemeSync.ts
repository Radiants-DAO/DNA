'use client';

import { useEffect } from 'react';
import { usePreferencesStore } from '../store';

/** Syncs the Zustand darkMode state to the <html> element's class list. */
export function useThemeSync() {
  const { darkMode } = usePreferencesStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);
}
