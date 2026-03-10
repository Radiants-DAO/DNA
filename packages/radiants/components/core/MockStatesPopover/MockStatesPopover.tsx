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
          // eslint-disable-next-line rdna/no-hardcoded-spacing -- reason:package-portable-inline-styles owner:radiants expires:2026-12-31 issue:DNA-999
          padding: '8px 12px',
          borderRadius: 'var(--radius-xs)',
          display: 'flex',
          alignItems: 'center',
          // eslint-disable-next-line rdna/no-hardcoded-spacing -- reason:package-portable-inline-styles owner:radiants expires:2026-12-31 issue:DNA-999
          gap: '8px',
          transition: 'background-color var(--duration-base) var(--easing-default)',
          backgroundColor: isActive ? 'var(--color-action-primary, oklch(0.9126 0.1170 93.68))' : 'transparent',
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:package-portability-fallback owner:design-system expires:2026-12-31 issue:DNA-999
          color: 'var(--color-content-primary, oklch(0.1641 0.0044 84.59))',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-hover-overlay, oklch(0.1641 0.0044 84.59 / 0.05))';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {def.icon && <span style={{ fontSize: 'var(--font-size-sm)' }}>{def.icon}</span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-heading, monospace)',
            fontSize: 'var(--font-size-sm)',
            textTransform: 'uppercase',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {def.name}
          </div>
          <div style={{
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: 'var(--font-size-sm)',
            // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:package-portability-fallback owner:design-system expires:2026-12-31 issue:DNA-999
            color: 'var(--color-content-secondary, oklch(0.1641 0.0044 84.59 / 0.7))',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {def.description}
          </div>
        </div>
        {isActive && <span style={{ fontSize: 'var(--font-size-sm)' }}>&#x2713;</span>}
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
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:package-portability-fallback owner:design-system expires:2026-12-31 issue:DNA-999
          backgroundColor: 'var(--color-surface-primary, oklch(0.9780 0.0295 94.34))',
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:package-portability-fallback owner:design-system expires:2026-12-31 issue:DNA-999
          border: '1px solid var(--color-edge-primary, oklch(0.1641 0.0044 84.59))',
          borderRadius: 'var(--radius-xs)',
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:semantic-shadow-token-not-a-color owner:design-system expires:2026-12-31 issue:DNA-999
          boxShadow: 'var(--shadow-floating)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          // eslint-disable-next-line rdna/no-hardcoded-spacing -- reason:package-portable-inline-styles owner:radiants expires:2026-12-31 issue:DNA-999
          padding: '8px 12px',
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:package-portability-fallback owner:design-system expires:2026-12-31 issue:DNA-999
          borderBottom: '1px solid var(--color-edge-muted, oklch(0.1641 0.0044 84.59 / 0.2))',
        }}>
          <span style={{
            fontFamily: 'var(--font-heading, monospace)',
            fontSize: 'var(--font-size-sm)',
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
        {/* eslint-disable-next-line rdna/no-hardcoded-spacing -- reason:package-portable-inline-styles owner:radiants expires:2026-12-31 issue:DNA-999 */}
        <div style={{ padding: '8px', maxHeight: '320px', overflowY: 'auto' }}>
          {statesByCategory.map(({ category, states }) => (
            // eslint-disable-next-line rdna/no-hardcoded-spacing -- reason:package-portable-inline-styles owner:radiants expires:2026-12-31 issue:DNA-999
            <div key={category.id} style={{ marginBottom: '12px' }}>
              <div style={{
                fontFamily: 'var(--font-heading, monospace)',
                fontSize: 'var(--font-size-sm)',
                textTransform: 'uppercase',
                // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:package-portability-fallback owner:design-system expires:2026-12-31 issue:DNA-999
                color: 'var(--color-content-secondary, oklch(0.1641 0.0044 84.59 / 0.7))',
                // eslint-disable-next-line rdna/no-hardcoded-spacing -- reason:package-portable-inline-styles owner:radiants expires:2026-12-31 issue:DNA-999
                padding: '0 8px',
                // eslint-disable-next-line rdna/no-hardcoded-spacing -- reason:package-portable-inline-styles owner:radiants expires:2026-12-31 issue:DNA-999
                marginBottom: '4px',
              }}>
                {category.label}
              </div>
              {/* eslint-disable-next-line rdna/no-hardcoded-spacing -- reason:package-portable-inline-styles owner:radiants expires:2026-12-31 issue:DNA-999 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {states.map(renderStateButton)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {footerText && (
          <div style={{
            // eslint-disable-next-line rdna/no-hardcoded-spacing -- reason:package-portable-inline-styles owner:radiants expires:2026-12-31 issue:DNA-999
            padding: '8px 12px',
            // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:package-portability-fallback owner:design-system expires:2026-12-31 issue:DNA-999
            borderTop: '1px solid var(--color-edge-muted, oklch(0.1641 0.0044 84.59 / 0.2))',
            // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:package-portability-fallback owner:design-system expires:2026-12-31 issue:DNA-999
            backgroundColor: 'var(--color-surface-muted, oklch(0.1641 0.0044 84.59 / 0.03))',
          }}>
            <div style={{
              fontFamily: 'var(--font-sans, sans-serif)',
              fontSize: 'var(--font-size-sm)',
              // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:package-portability-fallback owner:design-system expires:2026-12-31 issue:DNA-999
              color: 'var(--color-content-secondary, oklch(0.1641 0.0044 84.59 / 0.7))',
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
