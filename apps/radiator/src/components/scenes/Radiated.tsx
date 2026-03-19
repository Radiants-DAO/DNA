'use client';

import { useAppStore } from '@/store';
import { LineageTree } from '@/components/ui/LineageTree';
import { Button } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons';
import { mockRewardArt } from '@/data/mockRadiators';

export function Radiated() {
  const setView = useAppStore((s) => s.setView);
  const primaryNFT = useAppStore((s) => s.primaryNFT);
  const gasNFTs = useAppStore((s) => s.gasNFTs);
  const rewardPreview = useAppStore((s) => s.rewardPreview);
  const resetBurn = useAppStore((s) => s.resetBurn);

  const reward = rewardPreview ?? mockRewardArt;

  if (!primaryNFT) {
    setView('choose-fate');
    return null;
  }

  const handleRadiateAgain = () => {
    resetBurn();
    setView('choose-fate');
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 h-full overflow-y-auto text-center">
      {/* Title */}
      <h1 className="font-joystix text-2xl uppercase text-head">
        Radiated
      </h1>

      {/* Decorative divider */}
      <div className="w-16 h-px bg-line" />

      {/* 1/1 art reveal */}
      <div className="w-48 h-48 border-2 border-focus pixel-rounded-sm overflow-hidden pixel-shadow-glow-success">
        <img
          src={reward.image}
          alt={reward.name}
          className="w-full h-full object-cover"
        />
      </div>
      <span className="font-joystix text-sm uppercase text-head">
        {reward.name}
      </span>

      {/* Lineage tree — shows sacrificed NFTs below the hero */}
      <LineageTree primaryNFT={primaryNFT} gasNFTs={gasNFTs} />

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-auto pt-4">
        <Button variant="primary" size="md">
          <span className="flex items-center gap-2">
            View in Wallet
            <Icon name="share" size={14} />
          </span>
        </Button>
        <Button variant="outline" size="md">
          <span className="flex items-center gap-2">
            Share
            <Icon name="copy" size={14} />
          </span>
        </Button>
        <Button variant="ghost" size="md" onClick={handleRadiateAgain}>
          <span className="flex items-center gap-2">
            Radiate Again
            <Icon name="refresh1" size={14} />
          </span>
        </Button>
      </div>
    </div>
  );
}
