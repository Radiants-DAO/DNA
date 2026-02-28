'use client';

import { Zap } from '@rdna/radiants/icons';
import type { NFTItem } from '@/store/burnSlice';

interface LineageTreeProps {
  primaryNFT: NFTItem;
  gasNFTs: NFTItem[];
}

/**
 * Shows the lineage of sacrificed NFTs that powered the radiation.
 * Displayed below the hero reward art — does NOT duplicate the reward image.
 */
export function LineageTree({ primaryNFT, gasNFTs }: LineageTreeProps) {
  const all = [primaryNFT, ...gasNFTs];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Connection line from hero art above */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-px h-4 bg-edge-primary" />
        <Zap size={16} className="text-action-primary" />
        <div className="w-px h-4 bg-edge-primary" />
      </div>

      {/* Label */}
      <span className="font-joystix text-[8px] uppercase text-content-muted">
        Sacrificed
      </span>

      {/* Sacrificed NFT thumbnails */}
      <div className="flex items-start gap-3 flex-wrap justify-center">
        {all.map((nft) => (
          <SacrificeThumb key={nft.mint} nft={nft} />
        ))}
      </div>
    </div>
  );
}

function SacrificeThumb({ nft }: { nft: NFTItem }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-12 h-12 border border-edge-muted rounded-sm overflow-hidden grayscale opacity-60">
        <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
      </div>
      <span className="font-joystix text-[8px] uppercase text-content-muted max-w-12 truncate">
        {nft.name}
      </span>
    </div>
  );
}
