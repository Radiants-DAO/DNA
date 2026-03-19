'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@rdna/radiants/components/core';

export function ConnectWallet() {
  const { connected, disconnect, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    const address = publicKey.toBase58();
    const truncated = `${address.slice(0, 4)}...${address.slice(-4)}`;

    return (
      <div className="flex items-center gap-2">
        <div className="border border-line pixel-rounded-sm px-3 py-1.5">
          <span className="font-joystix text-xs text-head">
            {truncated}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      size="md"
      onClick={() => setVisible(true)}
    >
      Connect Wallet
    </Button>
  );
}

/** Truncated address pill for the title bar */
export function WalletAddress() {
  const { connected, publicKey } = useWallet();

  if (!connected || !publicKey) return null;

  const address = publicKey.toBase58();
  const truncated = `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <div className="border border-line pixel-rounded-sm px-2 py-1">
      <span className="font-joystix text-xs text-head">
        {truncated}
      </span>
    </div>
  );
}
