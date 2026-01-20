'use client';

import React from 'react';
import { Button } from '../Button/Button';

// ============================================================================
// Types
// ============================================================================

export interface MockStateDefinition {
  /** Unique identifier for this mock state */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Category for grouping (e.g., 'wallet', 'auction', 'user') */
  category: string;
  /** Optional icon (emoji or component) */
  icon?: React.ReactNode;
}

export interface MockStateCategory {
  /** Category identifier */
  id: string;
  /** Display label */
  label: string;
}

export interface MockStatesPopoverProps {
  /** Whether the popover is open */
  isOpen: boolean;
  /** Callback when the popover should close */
  onClose: () => void;
  /** Array of mock state definitions */
  mockStates: MockStateDefinition[];
  /** Currently active mock state ID */
  activeMockState?: string;
  /** Callback when a mock state is selected */
  onSelectState: (stateId: string) => void;
  /** Categories to display (in order). States are grouped by category. */
  categories?: MockStateCategory[];
  /** Title shown in the header */
  title?: string;
  /** Footer text */
  footerText?: string;
  /** Additional className for the popover container */
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const popoverStyles = `
  absolute top-12 right-2 z-50 w-72
  bg-surface-primary border-2 border-edge-primary rounded-sm shadow-lg
`;

const headerStyles = `
  flex items-center justify-between px-3 py-2 border-b border-edge-primary/20
`;

const contentStyles = `
  p-2 space-y-3 max-h-80 overflow-y-auto
`;

const categoryLabelStyles = `
  font-heading text-xs uppercase text-content-secondary px-2 mb-1
`;

const footerStyles = `
  px-3 py-2 border-t border-edge-primary/20 bg-content-primary/5
`;

// ============================================================================
// Component
// ============================================================================

/**
 * MockStatesPopover
 *
 * A development-only popover for toggling between mock states.
 * Displays categorized mock state presets that can be applied
 * to test different UI scenarios.
 *
 * This is a generic component - pass your mock state definitions
 * and handlers as props.
 */
export function MockStatesPopover({
  isOpen,
  onClose,
  mockStates,
  activeMockState,
  onSelectState,
  categories,
  title = 'Mock States',
  footerText = 'Dev mode only',
  className = '',
}: MockStatesPopoverProps) {
  if (!isOpen) return null;

  // Get unique categories from states if not provided
  const derivedCategories = categories ??
    [...new Set(mockStates.map(s => s.category))].map(cat => ({
      id: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
    }));

  // Group states by category
  const statesByCategory = derivedCategories.map(cat => ({
    category: cat,
    states: mockStates.filter(s => s.category === cat.id),
  })).filter(group => group.states.length > 0);

  const renderStateButton = (def: MockStateDefinition) => {
    const isActive = activeMockState === def.id;
    return (
      <button
        key={def.id}
        onClick={() => onSelectState(def.id)}
        className={`
          w-full text-left px-3 py-2 rounded-sm
          flex items-center gap-2
          transition-colors duration-150
          ${
            isActive
              ? 'bg-action-primary text-content-primary'
              : 'hover:bg-content-primary/5 text-content-primary'
          }
        `}
      >
        {def.icon && <span className="text-sm">{def.icon}</span>}
        <div className="flex-1 min-w-0">
          <div className="font-heading text-xs uppercase truncate">
            {def.name}
          </div>
          <div className="font-body text-xs text-content-secondary truncate">
            {def.description}
          </div>
        </div>
        {isActive && <span className="text-xs">&#x2713;</span>}
      </button>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Popover */}
      <div className={`${popoverStyles} ${className}`.trim()}>
        {/* Header */}
        <div className={headerStyles}>
          <span className="font-heading text-xs uppercase">{title}</span>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={onClose}
            aria-label="Close"
          >
            &#x2715;
          </Button>
        </div>

        {/* Content */}
        <div className={contentStyles}>
          {statesByCategory.map(({ category, states }) => (
            <div key={category.id}>
              <div className={categoryLabelStyles}>
                {category.label}
              </div>
              <div className="space-y-1">
                {states.map(renderStateButton)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {footerText && (
          <div className={footerStyles}>
            <div className="font-body text-xs text-content-secondary text-center">
              {footerText}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default MockStatesPopover;
