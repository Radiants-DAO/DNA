'use client';

import { Zap } from '@rdna/radiants/icons';
import type { NFTItem } from '@/store/burnSlice';

interface LineageTreeProps {
  rewardImage: string;
  rewardName: string;
  primaryNFT: NFTItem;
  gasNFTs: NFTItem[];
}

export function LineageTree({ rewardImage, rewardName, primaryNFT, gasNFTs }: LineageTreeProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Reward (top) */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-24 h-24 border-2 border-edge-focus rounded-sm overflow-hidden">
          <img src={rewardImage} alt={rewardName} className="w-full h-full object-cover" />
        </div>
        <span className="font-joystix text-xs uppercase text-content-heading">{rewardName}</span>
      </div>

      {/* Connection line */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-px h-6 bg-edge-primary" />
        <Zap size={16} className="text-action-primary" />
        <div className="w-px h-6 bg-edge-primary" />
      </div>

      {/* Sacrificed NFTs (bottom row) */}
      <div className="flex items-start gap-3 flex-wrap justify-center">
        {/* Primary */}
        <SacrificeThumb nft={primaryNFT} label="Primary" />
        {/* Gas */}
        {gasNFTs.map((nft) => (
          <SacrificeThumb key={nft.mint} nft={nft} label="Sacrificed" />
        ))}
      </div>
    </div>
  );
}

function SacrificeThumb({ nft, label }: { nft: NFTItem; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-14 h-14 border border-edge-muted rounded-sm overflow-hidden grayscale opacity-60">
        <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
      </div>
      <span className="font-joystix text-[8px] uppercase text-content-muted max-w-14 truncate">
        {nft.name}
      </span>
      <span className="font-mondwest text-[8px] text-content-muted">{label}</span>
    </div>
  );
}
