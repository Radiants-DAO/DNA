'use client';

import React from 'react';
import { Desktop } from './Desktop';
import { InvertModeProvider } from './InvertModeProvider';
import { ToastProvider } from '@rdna/radiants/components/core';
import { useHashRouting } from '@/hooks';

/**
 * Main RadOS desktop environment component.
 * Combines all desktop elements:
 * - WebGL sun background (rendered inside Desktop)
 * - Desktop with icons, windows, dock, and utility bar
 * - Invert mode support
 * - Hash routing
 */
export function RadOSDesktop() {
  // Enable hash routing
  useHashRouting();

  return (
    <ToastProvider>
      <InvertModeProvider>
        <Desktop />
      </InvertModeProvider>
    </ToastProvider>
  );
}

export default RadOSDesktop;
