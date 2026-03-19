'use client';

import React from 'react';
import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset';

// ============================================================================
// Types
// ============================================================================

interface RootProps {
  children: React.ReactNode;
  className?: string;
  /** Whether all fields in the fieldset are disabled */
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
 */
function Root({ children, className = '', disabled }: RootProps): React.ReactNode {
  return (
    <BaseFieldset.Root
      data-rdna="fieldset"
      disabled={disabled}
      className={`pixel-rounded-xs p-4 transition-shadow duration-150 focus-within:shadow-[0_0_0_1px_var(--color-focus),0_0_8px_rgba(252,225,132,0.4),0_0_16px_rgba(252,225,132,0.2)] ${className}`.trim()}
    >
      {children}
    </BaseFieldset.Root>
  );
}

/**
 * Legend for the fieldset, displayed as the group heading.
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

export const Fieldset = {
  Root,
  Legend,
};

export default Fieldset;
