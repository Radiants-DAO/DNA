'use client';

import { Button, IconButton, Divider, Tooltip } from '@rdna/radiants/components/core';
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
      <span className="font-joystix text-sm uppercase tracking-wide text-content-heading shrink-0">
        Radiator
      </span>

      {/* Divider line */}
      <Divider className="flex-1" />

      {/* Wallet address (when connected) */}
      <WalletAddress />

      {/* Admin CTA */}
      <Button
        variant="outline"
        size="md"
        onClick={() => setView('admin-wizard')}
      >
        Radiate a Collection
      </Button>

      {/* Action buttons */}
      <Tooltip content="Help" position="bottom">
        <IconButton icon={<HelpCircle size={20} />} variant="ghost" size="md" aria-label="Help" />
      </Tooltip>
      <Tooltip content="Fullscreen" position="bottom">
        <IconButton
          icon={<Maximize2 size={20} />}
          variant="ghost"
          size="md"
          aria-label="Fullscreen"
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              document.documentElement.requestFullscreen();
            }
          }}
        />
      </Tooltip>
      <Tooltip content="Close" position="bottom">
        <IconButton icon={<X size={20} />} variant="ghost" size="md" aria-label="Close" />
      </Tooltip>
    </div>
  );
}
