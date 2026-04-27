'use client';

import React from 'react';
import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset';


// ============================================================================
// Types
// ============================================================================

interface RootProps {
  children: React.ReactNode;
  className?: string;
  /** Whether all fields in the group are disabled */
  disabled?: boolean;
}

interface LegendProps {
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Groups related form fields with a semantic <fieldset> element.
 * Uses Base UI Fieldset.Root for accessible grouping.
 *
 * Uses pixel-rounded-* with a CSS mask so the inner `<fieldset>`'s
 * `focus-within:outline` ring can escape the pixel staircase instead
 * of being clipped by an `overflow-hidden` wrapper.
 */
function Root({ children, className = '', disabled }: RootProps): React.ReactNode {
  return (
    <BaseFieldset.Root
      data-rdna="input-set"
      disabled={disabled}
      className={`pixel-rounded-4 bg-transparent p-4 transition-shadow duration-[var(--duration-base)] focus-within:outline focus-within:outline-2 focus-within:outline-focus ${className}`.trim()}
    >
      {children}
    </BaseFieldset.Root>
  );
}

/**
 * Legend for the input set, displayed as the group heading.
 */
function Legend({ children, className = '' }: LegendProps): React.ReactNode {
  return (
    <BaseFieldset.Legend
      className={`text-head font-heading text-sm px-2 ${className}`.trim()}
    >
      {children}
    </BaseFieldset.Legend>
  );
}

// ============================================================================
// Export
// ============================================================================

export const InputSet = {
  Root,
  Legend,
};
