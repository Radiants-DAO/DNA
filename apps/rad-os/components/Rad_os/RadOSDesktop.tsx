'use client';

import React from 'react';
import { Desktop } from './Desktop';
import { Taskbar } from './Taskbar';
import { InvertModeProvider } from './InvertModeProvider';
import { ToastProvider } from '@rdna/radiants/components/core';
import { useHashRouting } from '@/hooks';

/**
 * Main RadOS desktop environment component.
 * Combines all desktop elements:
 * - WebGL sun background (rendered inside Desktop)
 * - Desktop with icons and windows
 * - Taskbar with Start Menu
 * - Invert mode support
 * - Hash routing
 */
export function RadOSDesktop() {
  // Enable hash routing
  useHashRouting();

  return (
    <ToastProvider>
      <InvertModeProvider>
        {/* Desktop with Icons, Windows, and WebGL Background */}
        <Desktop showTaskbar>
          {/* Taskbar with integrated Start Menu */}
          <Taskbar />
        </Desktop>
      </InvertModeProvider>
    </ToastProvider>
  );
}

export default RadOSDesktop;
