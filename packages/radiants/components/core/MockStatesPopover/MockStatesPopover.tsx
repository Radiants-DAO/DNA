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
// Component
// ============================================================================

/**
 * MockStatesPopover
 *
 * A development-only popover for toggling between mock states.
 * Displays categorized mock state presets that can be applied
 * to test different UI scenarios.
 *
 * Uses inline styles with CSS custom properties so this component
 * works when consumed from a package (no Tailwind class scanning needed).
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
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '8px 12px',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background-color 150ms',
          backgroundColor: isActive ? 'var(--color-sun-yellow, #FCE184)' : 'transparent',
          color: 'var(--color-content-primary, #0F0E0C)',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(15, 14, 12, 0.05)';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {def.icon && <span style={{ fontSize: '14px' }}>{def.icon}</span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-heading, monospace)',
            fontSize: '11px',
            textTransform: 'uppercase',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {def.name}
          </div>
          <div style={{
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: '11px',
            color: 'var(--color-content-secondary, rgba(15, 14, 12, 0.7))',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {def.description}
          </div>
        </div>
        {isActive && <span style={{ fontSize: '12px' }}>&#x2713;</span>}
      </button>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
        onClick={onClose}
      />

      {/* Popover */}
      <div
        className={className}
        style={{
          position: 'absolute',
          top: '48px',
          right: '8px',
          zIndex: 50,
          width: '288px',
          backgroundColor: 'var(--color-surface-primary, #FEF8E2)',
          border: '2px solid var(--color-edge-primary, #0F0E0C)',
          borderRadius: '2px',
          boxShadow: '4px 4px 0 0 rgba(15, 14, 12, 0.15)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid rgba(15, 14, 12, 0.2)',
        }}>
          <span style={{
            fontFamily: 'var(--font-heading, monospace)',
            fontSize: '11px',
            textTransform: 'uppercase',
          }}>
            {title}
          </span>
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
        <div style={{ padding: '8px', maxHeight: '320px', overflowY: 'auto' }}>
          {statesByCategory.map(({ category, states }) => (
            <div key={category.id} style={{ marginBottom: '12px' }}>
              <div style={{
                fontFamily: 'var(--font-heading, monospace)',
                fontSize: '11px',
                textTransform: 'uppercase',
                color: 'var(--color-content-secondary, rgba(15, 14, 12, 0.7))',
                padding: '0 8px',
                marginBottom: '4px',
              }}>
                {category.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {states.map(renderStateButton)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {footerText && (
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid rgba(15, 14, 12, 0.2)',
            backgroundColor: 'rgba(15, 14, 12, 0.03)',
          }}>
            <div style={{
              fontFamily: 'var(--font-sans, sans-serif)',
              fontSize: '11px',
              color: 'var(--color-content-secondary, rgba(15, 14, 12, 0.7))',
              textAlign: 'center',
            }}>
              {footerText}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default MockStatesPopover;
