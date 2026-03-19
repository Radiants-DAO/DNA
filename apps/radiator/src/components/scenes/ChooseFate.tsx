'use client';

import { useAppStore } from '@/store';
import { NFTCard } from '@/components/ui/NFTCard';
import { Button } from '@rdna/radiants/components/core';
import { mockHolderNFTs, mockRewardArt } from '@/data/mockRadiators';
import { Icon } from '@rdna/radiants/icons';

export function ChooseFate() {
  const setView = useAppStore((s) => s.setView);
  const primaryNFT = useAppStore((s) => s.primaryNFT);
  const setPrimaryNFT = useAppStore((s) => s.setPrimaryNFT);
  const setEligibleNFTs = useAppStore((s) => s.setEligibleNFTs);
  const setRewardPreview = useAppStore((s) => s.setRewardPreview);
  const config = useAppStore((s) => s.config);

  const revealUpfront = config?.revealUpfront ?? true;

  const handleSelect = (nft: typeof mockHolderNFTs[number]) => {
    setPrimaryNFT(nft);
    if (revealUpfront) {
      setRewardPreview(mockRewardArt);
    }
  };

  const handleProceed = () => {
    // Store all eligible NFTs minus the primary for the gas-burn step
    const remaining = mockHolderNFTs.filter((n) => n.mint !== primaryNFT?.mint);
    setEligibleNFTs(remaining);
    setView('seal-claim');
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <Icon name="electric" size={20} className="text-accent" />
          <h1 className="font-joystix text-xl uppercase text-head">
            Choose Your Fate
          </h1>
        </div>
        <p className="font-mondwest text-sub">
          Select the NFT that will be irradiated
        </p>
      </div>

      {/* NFT grid */}
      <div className="grid @sm:grid-cols-2 @md:grid-cols-3 @lg:grid-cols-4 gap-3">
        {mockHolderNFTs.map((nft) => (
          <NFTCard
            key={nft.mint}
            name={nft.name}
            image={nft.image}
            selected={primaryNFT?.mint === nft.mint}
            onClick={() => handleSelect(nft)}
          />
        ))}
      </div>

      {/* Reward preview (upfront reveal) */}
      {primaryNFT && revealUpfront && (
        <div className="flex items-center gap-4 p-4 border border-line pixel-rounded-sm bg-depth">
          <img
            src={mockRewardArt.image}
            alt={mockRewardArt.name}
            className="w-16 h-16 rounded-sm object-cover"
          />
          <div className="flex flex-col gap-0.5">
            <span className="font-joystix text-xs uppercase text-mute">
              You will receive
            </span>
            <span className="font-joystix text-sm uppercase text-head">
              {mockRewardArt.name}
            </span>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-auto pt-4">
        <Button
          variant="primary"
          size="lg"
          disabled={!primaryNFT}
          onClick={handleProceed}
        >
          Seal Your Fate
        </Button>
      </div>
    </div>
  );
}
