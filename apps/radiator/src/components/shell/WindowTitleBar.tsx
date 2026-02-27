'use client';

import { Button, IconButton } from '@rdna/radiants/components/core';
import { RadMarkIcon, HelpCircle, Maximize2, X } from '@rdna/radiants/icons';
import { useAppStore } from '@/store';
import { WalletAddress } from '@/components/ui/ConnectWallet';

export function WindowTitleBar() {
  const setView = useAppStore((s) => s.setView);

  return (
    <div className="flex items-center gap-3 pl-4 pr-1 pt-1 pb-1">
      {/* App icon */}
      <RadMarkIcon size={20} className="text-content-heading shrink-0" />

      {/* Title */}
      <span className="font-joystix text-sm uppercase text-content-heading shrink-0">
        Radiator
      </span>

      {/* Divider line */}
      <div className="flex-1 h-px bg-edge-primary" />

      {/* Wallet address (when connected) */}
      <WalletAddress />

      {/* Admin CTA */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setView('admin-wizard')}
      >
        Radiate a Collection
      </Button>

      {/* Action buttons */}
      <IconButton variant="ghost" size="md" aria-label="Help">
        <HelpCircle size={16} />
      </IconButton>
      <IconButton variant="ghost" size="md" aria-label="Fullscreen">
        <Maximize2 size={16} />
      </IconButton>
      <IconButton variant="ghost" size="md" aria-label="Close">
        <X size={16} />
      </IconButton>
    </div>
  );
}
