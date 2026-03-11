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
      disabled={disabled}
      className={`border border-edge-primary rounded-xs p-4 ${className}`.trim()}
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
      className={`text-content-heading font-heading text-sm px-2 ${className}`.trim()}
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
