'use client';

import React from 'react';
import { Button } from './Button';
import { useWalletStore } from '@/store';
import {
  AUCTIONS_MOCK_STATE_DEFINITIONS,
  type MockStateDefinition,
} from '@/lib/mockStates/auctionsMockStates';

interface MockStatesPopoverProps {
  /** Whether the popover is open */
  isOpen: boolean;
  /** Callback when the popover should close */
  onClose: () => void;
  /** App ID for filtering relevant mock states (future use) */
  appId?: string;
}

/**
 * MockStatesPopover
 *
 * A development-only popover for toggling between mock states.
 * Displays categorized mock state presets that can be applied
 * to test different UI scenarios.
 */
export function MockStatesPopover({
  isOpen,
  onClose,
  appId = 'auctions',
}: MockStatesPopoverProps) {
  const { activeMockState, applyMockState } = useWalletStore();

  if (!isOpen) return null;

  // Group mock states by category
  const walletStates = AUCTIONS_MOCK_STATE_DEFINITIONS.filter(
    (def) => def.category === 'wallet'
  );
  const auctionStates = AUCTIONS_MOCK_STATE_DEFINITIONS.filter(
    (def) => def.category === 'auction'
  );
  const userStates = AUCTIONS_MOCK_STATE_DEFINITIONS.filter(
    (def) => def.category === 'user'
  );

  const handleSelectState = (stateId: string) => {
    applyMockState(stateId);
  };

  const renderStateButton = (def: MockStateDefinition) => {
    const isActive = activeMockState === def.id;
    return (
      <button
        key={def.id}
        onClick={() => handleSelectState(def.id)}
        className={`
          w-full text-left px-3 py-2 rounded-sm
          flex items-center gap-2
          transition-colors duration-150
          ${
            isActive
              ? 'bg-sun-yellow text-black'
              : 'hover:bg-black/5 text-black'
          }
        `}
      >
        {def.icon && <span className="text-sm">{def.icon}</span>}
        <div className="flex-1 min-w-0">
          <div className="font-joystix text-xs uppercase truncate">
            {def.name}
          </div>
          <div className="font-mondwest text-xs text-black/60 truncate">
            {def.description}
          </div>
        </div>
        {isActive && <span className="text-xs">✓</span>}
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
      <div className="absolute top-12 right-2 z-50 w-72 bg-cream border-2 border-black rounded-sm shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-black/20">
          <span className="font-joystix text-xs uppercase">Mock States</span>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            iconName="close"
            onClick={onClose}
          />
        </div>

        {/* Content */}
        <div className="p-2 space-y-3 max-h-80 overflow-y-auto">
          {/* Wallet States */}
          <div>
            <div className="font-joystix text-xs uppercase text-black/50 px-2 mb-1">
              Wallet
            </div>
            <div className="space-y-1">
              {walletStates.map(renderStateButton)}
            </div>
          </div>

          {/* Auction States */}
          {auctionStates.length > 0 && (
            <div>
              <div className="font-joystix text-xs uppercase text-black/50 px-2 mb-1">
                Auction
              </div>
              <div className="space-y-1">
                {auctionStates.map(renderStateButton)}
              </div>
            </div>
          )}

          {/* User States */}
          {userStates.length > 0 && (
            <div>
              <div className="font-joystix text-xs uppercase text-black/50 px-2 mb-1">
                User
              </div>
              <div className="space-y-1">
                {userStates.map(renderStateButton)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-black/20 bg-black/5">
          <div className="font-mondwest text-xs text-black/50 text-center">
            Dev mode only
          </div>
        </div>
      </div>
    </>
  );
}

export default MockStatesPopover;
