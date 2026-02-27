'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import { NFTCard } from '@/components/ui/NFTCard';
import { FuelGauge } from '@/components/ui/FuelGauge';
import { Button } from '@rdna/radiants/components/core';
import { Zap } from '@rdna/radiants/icons';
import type { NFTItem } from '@/store/burnSlice';

export function FeedRadiator() {
  const setView = useAppStore((s) => s.setView);
  const config = useAppStore((s) => s.config);
  const primaryNFT = useAppStore((s) => s.primaryNFT);
  const eligibleNFTs = useAppStore((s) => s.eligibleNFTs);
  const gasNFTs = useAppStore((s) => s.gasNFTs);
  const offeringRealized = useAppStore((s) => s.offeringRealized);
  const addGasNFT = useAppStore((s) => s.addGasNFT);
  const incrementOffering = useAppStore((s) => s.incrementOffering);

  const [selectedGas, setSelectedGas] = useState<NFTItem | null>(null);
  const [burning, setBurning] = useState(false);

  const gasRequired = (config?.offeringSize ?? 3) - 1;
  const isFull = offeringRealized >= gasRequired;

  // NFTs available for burning (not the primary, not already burned)
  const burnedMints = new Set(gasNFTs.map((n) => n.mint));
  const availableNFTs = eligibleNFTs.filter((n) => !burnedMints.has(n.mint));

  const handleBurn = async () => {
    if (!selectedGas) return;
    setBurning(true);
    // Mock burnNFT transaction — 1s delay
    await new Promise((r) => setTimeout(r, 1000));
    addGasNFT(selectedGas);
    incrementOffering();
    setSelectedGas(null);
    setBurning(false);
  };

  if (!primaryNFT) {
    setView('choose-fate');
    return null;
  }

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto">
      {/* Fuel gauge */}
      <FuelGauge realized={offeringRealized} required={gasRequired} />

      {/* Primary NFT reference */}
      <div className="flex items-center gap-3 p-3 border border-edge-muted rounded-sm bg-surface-primary">
        <img
          src={primaryNFT.image}
          alt={primaryNFT.name}
          className="w-10 h-10 rounded-sm object-cover"
        />
        <div className="flex flex-col">
          <span className="font-joystix text-xs uppercase text-content-muted">Primary</span>
          <span className="font-joystix text-xs uppercase text-content-heading">{primaryNFT.name}</span>
        </div>
      </div>

      {/* Gas burn confirmation */}
      {selectedGas && !isFull && (
        <div className="flex items-center gap-4 p-4 border border-edge-focus rounded-sm bg-surface-muted">
          <img
            src={selectedGas.image}
            alt={selectedGas.name}
            className="w-16 h-16 rounded-sm object-cover"
          />
          <div className="flex flex-col gap-2 flex-1">
            <span className="font-joystix text-sm uppercase text-content-heading">
              Feed to the radiator?
            </span>
            <span className="font-mondwest text-sm text-content-secondary">
              {selectedGas.name} will be burned permanently
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedGas(null)}
                disabled={burning}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleBurn}
                disabled={burning}
              >
                {burning ? 'Burning...' : 'Burn It'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Burned tombstones */}
      {gasNFTs.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-joystix text-xs uppercase text-content-muted">
            Sacrificed
          </span>
          <div className="flex gap-2 flex-wrap">
            {gasNFTs.map((nft) => (
              <div key={nft.mint} className="w-14">
                <NFTCard name={nft.name} image={nft.image} burned />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available NFTs grid */}
      {!isFull && availableNFTs.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-joystix text-xs uppercase text-content-muted">
            Select sacrifice
          </span>
          <div className="grid @sm:grid-cols-3 @md:grid-cols-4 gap-3">
            {availableNFTs.map((nft) => (
              <NFTCard
                key={nft.mint}
                name={nft.name}
                image={nft.image}
                selected={selectedGas?.mint === nft.mint}
                onClick={() => setSelectedGas(nft)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fully fueled CTA */}
      {isFull && (
        <div className="flex flex-col items-center gap-4 py-6 mt-auto">
          <Zap size={32} className="text-action-primary" />
          <h2 className="font-joystix text-lg uppercase text-content-heading">
            Radiator is fully fueled
          </h2>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setView('ignite')}
          >
            Ignite
          </Button>
        </div>
      )}
    </div>
  );
}
