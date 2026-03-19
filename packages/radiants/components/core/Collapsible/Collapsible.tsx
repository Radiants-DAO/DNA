'use client';

import React from 'react';
import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { ChevronDown } from '../../../icons/generated';

// ============================================================================
// Types
// ============================================================================

interface RootProps {
  /** Collapsible content and trigger */
  children: React.ReactNode;
  /** Additional classes for the root container */
  className?: string;
  /** Whether the panel is initially open (uncontrolled) */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
}

interface TriggerProps {
  /** Trigger content (usually a button label) */
  children: React.ReactNode;
  /** Additional classes */
  className?: string;
}

interface ContentProps {
  /** Collapsible panel content */
  children: React.ReactNode;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// Root
// ============================================================================

/**
 * Groups all parts of the collapsible.
 * Simpler than Accordion — handles a single expand/collapse section.
 */
function Root({
  children,
  className = '',
  defaultOpen = false,
  open,
  onOpenChange,
  disabled = false,
}: RootProps): React.ReactNode {
  return (
    <BaseCollapsible.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
      className={`${className}`.trim()}
      data-rdna="collapsible"
      data-variant="collapsible"
    >
      {children}
    </BaseCollapsible.Root>
  );
}

// ============================================================================
// Trigger
// ============================================================================

/**
 * Button that toggles the collapsible panel open/closed.
 */
function Trigger({ children, className = '' }: TriggerProps): React.ReactNode {
  return (
    <BaseCollapsible.Trigger
      className={`
        group
        w-full flex items-center justify-between
        px-4 py-3
        font-sans text-sm uppercase tracking-tight leading-none
        pixel-rounded-xs
        transition-colors
        cursor-pointer
        focus-visible:outline-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `.trim()}
      data-slot="button-face"
      data-variant="ghost"
      data-color="accent"
    >
      <span>{children}</span>
      <span
        className="select-none transition-transform duration-200 ease-out group-data-[panel-open]:rotate-180"
        aria-hidden="true"
      >
        <ChevronDown size={14} />
      </span>
    </BaseCollapsible.Trigger>
  );
}

// ============================================================================
// Content
// ============================================================================

/**
 * The collapsible panel that expands/collapses.
 */
function Content({ children, className = '' }: ContentProps): React.ReactNode {
  return (
    <BaseCollapsible.Panel
      className={`
        overflow-hidden
        ${className}
      `.trim()}
    >
      <div className="px-4 py-3 font-sans text-main bg-card pixel-rounded-xs">
        {children}
      </div>
    </BaseCollapsible.Panel>
  );
}

// ============================================================================
// Collapsible — namespace API
// ============================================================================

export const Collapsible = {
  Root,
  Trigger,
  Content,
};

export default Collapsible;
