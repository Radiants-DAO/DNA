'use client';
import { Desktop } from './Desktop';
import { CommandPalette } from './CommandPalette';
import { InvertModeProvider } from './InvertModeProvider';
import { ToastProvider } from '@rdna/radiants/components/core';
import { TooltipProvider } from '@rdna/ctrl';
import { Agentation } from 'agentation';
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
      <TooltipProvider>
        <InvertModeProvider>
          <Desktop />
          <CommandPalette />
          <Agentation />
        </InvertModeProvider>
      </TooltipProvider>
    </ToastProvider>
  );
}
