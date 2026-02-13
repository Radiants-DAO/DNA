'use client';

import React from 'react';

interface MenuButtonProps {
  /** Whether the menu is currently open */
  isOpen: boolean;
  /** Click handler for toggling menu */
  onClick: () => void;
  /** Click handler for closing menu (used by close button) */
  onClose?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether to use blend mode (false when menu is open) */
  useBlendMode?: boolean;
}

/**
 * 3x3 grid menu button with animated cells
 *
 * Features:
 * - Staggered color animations on hover (purple, green, blue pattern)
 * - Cells at positions 2, 4, 6, 8 fade out when menu is open
 * - Smooth transitions between open/close states
 * - Renders both open and close buttons, toggling visibility
 */
export function MenuButton({ isOpen, onClick, onClose, className = '', useBlendMode = true }: MenuButtonProps) {
  const handleClose = onClose || onClick;

  // Grid configuration: 3x3 = 9 cells
  // Pattern: Purple, Green, Blue / Green, Blue, Purple / Blue, Purple, Green
  // Positions 2, 4, 6, 8 (0-indexed: 1, 3, 5, 7) fade out when menu is open
  const gridConfig = [
    { hoverColor: 'group-hover:bg-purple', delay: '0', fadeOnOpen: false },      // 0
    { hoverColor: 'group-hover:bg-green', delay: '50ms', fadeOnOpen: true },     // 1
    { hoverColor: 'group-hover:bg-blue', delay: '100ms', fadeOnOpen: false },   // 2
    { hoverColor: 'group-hover:bg-green', delay: '150ms', fadeOnOpen: true },   // 3
    { hoverColor: 'group-hover:bg-blue', delay: '200ms', fadeOnOpen: false },   // 4
    { hoverColor: 'group-hover:bg-purple', delay: '250ms', fadeOnOpen: true },  // 5
    { hoverColor: 'group-hover:bg-blue', delay: '300ms', fadeOnOpen: false },   // 6
    { hoverColor: 'group-hover:bg-purple', delay: '350ms', fadeOnOpen: true },  // 7
    { hoverColor: 'group-hover:bg-green', delay: '400ms', fadeOnOpen: false },  // 8
  ];

  const renderGrid = () => (
    <div className="backdrop-blur-[0.25rem] flex justify-center items-center transition-colors duration-300 hover:border-black active:scale-[0.88] group h-[1.25rem]">
      <div className="grid grid-cols-3 gap-1 p-1">
        {gridConfig.map((cell, index) => (
          <div
            key={index}
            className={`${useBlendMode ? 'bg-white' : 'bg-black'} ${cell.hoverColor} w-1 h-1 transition-opacity duration-300 transition-colors ${
              cell.fadeOnOpen && isOpen ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ transitionDelay: cell.delay }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Close Button - visible when menu is open */}
      <button
        type="button"
        className={`absolute top-0 right-0 z-[1] cursor-pointer ${useBlendMode ? 'mix-blend-difference' : ''} transition-opacity duration-300 transition-transform ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 ${className}`}
        onClick={handleClose}
        aria-expanded={isOpen}
        aria-label="Close menu"
        tabIndex={isOpen ? 0 : -1}
      >
        {renderGrid()}
      </button>

      {/* Open Button - visible when menu is closed */}
      <button
        type="button"
        className={`absolute top-0 right-0 z-[1] cursor-pointer ${useBlendMode ? 'mix-blend-difference' : ''} transition-opacity duration-300 transition-transform ${
          isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 ${className}`}
        onClick={onClick}
        aria-expanded={isOpen}
        aria-label="Open menu"
        tabIndex={isOpen ? -1 : 0}
      >
        {renderGrid()}
      </button>
    </>
  );
}
