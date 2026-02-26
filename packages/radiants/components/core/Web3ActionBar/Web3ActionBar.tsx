'use client';

import React from 'react';
import { Button } from '../Button/Button';

// Helper function to format wallet address
function formatAddress(address: string | null | undefined): string {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// ============================================================================
// Types
// ============================================================================

interface Web3ActionBarProps {
  /** Whether wallet is connected */
  isConnected: boolean;
  /** Wallet address to display when connected */
  walletAddress?: string | null;
  /** Callback when connect button is clicked */
  onConnect: () => void;
  /** Optional callback when disconnect button is clicked */
  onDisconnect?: () => void;
  /** Icon slot for disconnect button (pass your close icon component) */
  disconnectIcon?: React.ReactNode;
  /** App-specific action buttons (My Vault, Place Offering, Stake, etc.) */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Universal Web3 Action Bar for all web3 apps in RadOS
 *
 * Provides a consistent bottom bar for wallet connection and app-specific
 * blockchain actions. Used across Auctions, MurderTree, Vault, and future web3 apps.
 *
 * Architecture:
 * - TabList = Navigation tabs (web2 apps)
 * - Web3ActionBar = Wallet + blockchain actions (web3 apps)
 *
 * @example
 * ```tsx
 * <Web3ActionBar
 *   isConnected={isConnected}
 *   walletAddress={walletAddress}
 *   onConnect={handleConnect}
 *   onDisconnect={handleDisconnect}
 *   disconnectIcon={<CloseIcon />}
 * >
 *   <Button variant="outline" onClick={handleShowVault}>My Vault</Button>
 *   {status === 'live' && <Button>Place Offering</Button>}
 * </Web3ActionBar>
 * ```
 */
export function Web3ActionBar({
  isConnected,
  walletAddress,
  onConnect,
  onDisconnect,
  disconnectIcon,
  children,
  className = '',
}: Web3ActionBarProps) {
  return (
    <div className={`flex items-center justify-between gap-4 px-2 py-2 bg-surface-primary border-t border-edge-primary shrink-0 ${className}`.trim()}>
      {/* Left: Wallet Connection */}
      <div className="flex gap-2 items-center">
        {!isConnected ? (
          <Button onClick={onConnect}>Connect</Button>
        ) : (
          <>
            {/* Wallet address display */}
            {walletAddress && (
              <span className="font-mono text-sm text-content-primary">{formatAddress(walletAddress)}</span>
            )}
            {/* Disconnect button */}
            {onDisconnect && (
              <Button
                variant="ghost"
                iconOnly={true}
                icon={disconnectIcon}
                onClick={onDisconnect}
                title="Disconnect wallet"
              />
            )}
          </>
        )}
      </div>

      {/* Right: App-specific actions (My Vault, Place Offering, Stake, etc.) */}
      {isConnected && children && (
        <div className="flex gap-2 items-center">
          {children}
        </div>
      )}
    </div>
  );
}

export default Web3ActionBar;
